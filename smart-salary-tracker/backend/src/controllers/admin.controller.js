const bcrypt = require('bcrypt');
const { dbAll, dbGet, dbRun, ensureUserDefaults } = require('../database/db');

const VALID_ROLES = ['employee', 'admin'];

exports.getStats = async (req, res) => {
    try {
        const [totalUsersRow, employeesRow, adminsRow, shiftsRow] = await Promise.all([
            dbGet('SELECT COUNT(*) as count FROM users'),
            dbGet("SELECT COUNT(*) as count FROM users WHERE role = 'employee'"),
            dbGet("SELECT COUNT(*) as count FROM users WHERE role = 'admin'"),
            dbGet('SELECT COUNT(*) as count FROM shifts WHERE user_id IS NULL AND is_active = 1')
        ]);

        res.json({
            totalUsers: totalUsersRow?.count || 0,
            totalEmployees: employeesRow?.count || 0,
            totalAdmins: adminsRow?.count || 0,
            activeShifts: shiftsRow?.count || 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi tải thống kê' });
    }
};

exports.listUsers = async (req, res) => {
    try {
        const { q } = req.query;
        let query = `
            SELECT
                u.id,
                u.name,
                u.username,
                u.email,
                u.employee_code,
                u.role,
                u.created_at,
                u.updated_at,
                (SELECT COUNT(*) FROM work_schedules ws WHERE ws.user_id = u.id) as schedule_count,
                (SELECT COUNT(*) FROM expenses ex WHERE ex.user_id = u.id) as expense_count
            FROM users u
        `;
        const params = [];

        if (q && String(q).trim()) {
            const kw = `%${String(q).trim()}%`;
            query += ' WHERE u.name LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR u.employee_code LIKE ?';
            params.push(kw, kw, kw, kw);
        }

        query += " ORDER BY CASE WHEN u.role = 'admin' THEN 0 ELSE 1 END, u.id DESC";
        const users = await dbAll(query, params);
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi tải danh sách nhân viên' });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { name, identifier, username, email, employee_code, password, role = 'employee' } = req.body;
        const rawIdentifier = String(identifier ?? username ?? email ?? '').trim();

        if (!name || !String(name).trim() || !rawIdentifier) {
            return res.status(400).json({ message: 'Vui lòng nhập họ tên và tên đăng nhập / SĐT' });
        }

        if (/\s/.test(rawIdentifier)) {
            return res.status(400).json({ message: 'Tên đăng nhập không được chứa khoảng trắng' });
        }

        const safeRole = VALID_ROLES.includes(role) ? role : 'employee';
        const rawPassword = password && String(password).trim() ? String(password).trim() : '123456';
        if (rawPassword.length < 4) {
            return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 4 ký tự' });
        }

        const cleanId = rawIdentifier.toLowerCase();
        const isEmail = cleanId.includes('@');
        const cleanUsername = isEmail ? null : cleanId;
        const cleanEmail = isEmail ? cleanId : null;

        const existing = await dbGet(
            'SELECT id FROM users WHERE LOWER(username) = ? OR LOWER(email) = ? OR LOWER(employee_code) = ?',
            [cleanId, cleanId, cleanId]
        );
        if (existing) {
            return res.status(400).json({ message: 'Tên đăng nhập / Email đã tồn tại' });
        }

        const normalizedCode = employee_code && String(employee_code).trim() ? String(employee_code).trim() : null;
        if (normalizedCode) {
            const existingCode = await dbGet(
                'SELECT id FROM users WHERE LOWER(employee_code) = ? OR LOWER(username) = ?',
                [normalizedCode.toLowerCase(), normalizedCode.toLowerCase()]
            );
            if (existingCode) {
                return res.status(400).json({ message: 'Mã nhân viên đã tồn tại' });
            }
        }

        const password_hash = await bcrypt.hash(rawPassword, 10);
        const result = await dbRun(
            'INSERT INTO users (name, username, email, employee_code, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)',
            [String(name).trim(), cleanUsername, cleanEmail, normalizedCode, password_hash, safeRole]
        );

        await ensureUserDefaults(result.id);

        const created = await dbGet(
            'SELECT id, name, username, email, employee_code, role, created_at FROM users WHERE id = ?',
            [result.id]
        );

        res.status(201).json({
            message: `Đã tạo tài khoản cho ${created.name} (mật khẩu mặc định: ${rawPassword})`,
            user: created
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi tạo tài khoản' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const nextPassword =
            req.body && req.body.newPassword && String(req.body.newPassword).trim()
                ? String(req.body.newPassword).trim()
                : '123456';

        if (nextPassword.length < 4) {
            return res.status(400).json({ message: 'Mật khẩu đặt lại phải từ 4 ký tự trở lên' });
        }

        const targetUser = await dbGet('SELECT id, name, username, email FROM users WHERE id = ?', [id]);
        if (!targetUser) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản nhân viên' });
        }

        const password_hash = await bcrypt.hash(nextPassword, 10);
        await dbRun('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
            password_hash,
            targetUser.id
        ]);

        res.json({
            message: `Đã đặt lại mật khẩu của ${targetUser.name} về ${nextPassword}`,
            userId: targetUser.id,
            defaultPassword: nextPassword
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi đặt lại mật khẩu' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await dbGet('SELECT * FROM users WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
        }

        const nextName = req.body.name !== undefined ? String(req.body.name).trim() : existing.name;
        if (!nextName) {
            return res.status(400).json({ message: 'Họ tên không được để trống' });
        }

        const nextCode =
            req.body.employee_code !== undefined
                ? (String(req.body.employee_code).trim() || null)
                : existing.employee_code;

        if (nextCode) {
            const clash = await dbGet('SELECT id FROM users WHERE LOWER(employee_code) = ? AND id != ?', [
                nextCode.toLowerCase(),
                existing.id
            ]);
            if (clash) {
                return res.status(400).json({ message: 'Mã nhân viên đã thuộc về người khác' });
            }
        }

        const nextRole = req.body.role !== undefined ? req.body.role : existing.role;
        if (!VALID_ROLES.includes(nextRole)) {
            return res.status(400).json({ message: 'Vai trò không hợp lệ' });
        }
        if (Number(existing.id) === Number(req.userId) && nextRole !== 'admin') {
            return res.status(400).json({ message: 'Không thể tự hạ quyền Quản trị của chính mình' });
        }

        await dbRun(
            'UPDATE users SET name = ?, employee_code = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [nextName, nextCode, nextRole, existing.id]
        );

        const updated = await dbGet(
            'SELECT id, name, username, email, employee_code, role, created_at FROM users WHERE id = ?',
            [existing.id]
        );
        res.json({ message: 'Đã cập nhật thông tin tài khoản', user: updated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật tài khoản' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const target = await dbGet('SELECT id, name FROM users WHERE id = ?', [id]);
        if (!target) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
        }

        if (Number(target.id) === Number(req.userId)) {
            return res.status(400).json({ message: 'Không thể tự xóa tài khoản Admin đang đăng nhập' });
        }

        await dbRun('DELETE FROM work_schedules WHERE user_id = ?', [target.id]);
        await dbRun('DELETE FROM expenses WHERE user_id = ?', [target.id]);
        await dbRun('DELETE FROM salary_settings WHERE user_id = ?', [target.id]);
        await dbRun('DELETE FROM expense_categories WHERE user_id = ?', [target.id]);
        await dbRun('DELETE FROM salary_records WHERE user_id = ?', [target.id]);
        await dbRun('DELETE FROM financial_goals WHERE user_id = ?', [target.id]);
        await dbRun('DELETE FROM shifts WHERE user_id = ?', [target.id]);
        await dbRun('DELETE FROM users WHERE id = ?', [target.id]);

        res.json({ message: `Đã xóa tài khoản ${target.name}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi xóa tài khoản' });
    }
};
