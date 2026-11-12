const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { dbRun, dbGet, ensureUserDefaults } = require('../database/db');

function signToken(user) {
    return jwt.sign(
        { userId: user.id, role: user.role || 'employee' },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
    );
}

function serializeUser(user) {
    return {
        id: user.id,
        name: user.name,
        username: user.username || null,
        email: user.email || null,
        employee_code: user.employee_code || null,
        role: user.role || 'employee'
    };
}

exports.register = async (req, res) => {
    try {
        const { name, identifier, username, email, employee_code, password } = req.body;
        const rawIdentifier = String(identifier ?? username ?? email ?? '').trim();

        if (!name || !String(name).trim() || !rawIdentifier || !password) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ họ tên, tên đăng nhập/SĐT và mật khẩu' });
        }

        if (/\s/.test(rawIdentifier)) {
            return res.status(400).json({ message: 'Tên đăng nhập không được chứa khoảng trắng' });
        }

        if (String(password).length < 4) {
            return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 4 ký tự' });
        }

        const cleanId = rawIdentifier.toLowerCase();
        const isEmail = cleanId.includes('@');
        const cleanUsername = isEmail
            ? (username && String(username).trim() ? String(username).trim().toLowerCase() : null)
            : cleanId;
        const cleanEmail = isEmail
            ? cleanId
            : (email && String(email).trim() ? String(email).trim().toLowerCase() : null);

        const existingUser = await dbGet(
            'SELECT id FROM users WHERE LOWER(username) = ? OR LOWER(email) = ? OR LOWER(employee_code) = ?',
            [cleanId, cleanId, cleanId]
        );
        if (existingUser) {
            return res.status(400).json({ message: 'Tên đăng nhập / Email này đã được sử dụng' });
        }

        const normalizedEmployeeCode =
            employee_code && String(employee_code).trim() ? String(employee_code).trim() : null;

        if (normalizedEmployeeCode) {
            if (normalizedEmployeeCode.toLowerCase() === cleanId) {
                return res.status(400).json({ message: 'Mã nhân viên không nên trùng với tên đăng nhập' });
            }
            const existingCode = await dbGet(
                'SELECT id FROM users WHERE LOWER(employee_code) = ? OR LOWER(username) = ?',
                [normalizedEmployeeCode.toLowerCase(), normalizedEmployeeCode.toLowerCase()]
            );
            if (existingCode) {
                return res.status(400).json({ message: 'Mã nhân viên đã tồn tại' });
            }
        }

        const password_hash = await bcrypt.hash(String(password), 10);

        const result = await dbRun(
            "INSERT INTO users (name, username, email, employee_code, password_hash, role) VALUES (?, ?, ?, ?, ?, 'employee')",
            [String(name).trim(), cleanUsername, cleanEmail, normalizedEmployeeCode, password_hash]
        );

        await ensureUserDefaults(result.id);

        const createdUser = await dbGet('SELECT id, name, username, email, employee_code, role FROM users WHERE id = ?', [
            result.id
        ]);
        const token = signToken(createdUser);

        res.status(201).json({
            message: 'Tạo tài khoản thành công!',
            token,
            user: serializeUser(createdUser)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi đăng ký tài khoản' });
    }
};

exports.login = async (req, res) => {
    try {
        const { identifier, email, username, password } = req.body;
        const rawIdentifier = String(identifier ?? email ?? username ?? '').trim();
        const cleanId = rawIdentifier.toLowerCase();

        if (!cleanId || !password) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu' });
        }

        const user = await dbGet(
            'SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ? OR LOWER(employee_code) = ? LIMIT 1',
            [cleanId, cleanId, cleanId]
        );
        if (!user) {
            return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không đúng' });
        }

        const isValidPassword = await bcrypt.compare(String(password), user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không đúng' });
        }

        const token = signToken(user);

        res.json({
            message: 'Đăng nhập thành công!',
            token,
            user: serializeUser(user)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi đăng nhập' });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới' });
        }
        if (String(newPassword).length < 4) {
            return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 4 ký tự' });
        }

        const user = await dbGet('SELECT * FROM users WHERE id = ?', [req.userId]);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
        }

        const matches = await bcrypt.compare(String(currentPassword), user.password_hash);
        if (!matches) {
            return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
        }

        const nextHash = await bcrypt.hash(String(newPassword), 10);
        await dbRun('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
            nextHash,
            req.userId
        ]);

        res.json({ message: 'Đổi mật khẩu thành công!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi đổi mật khẩu' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await dbGet('SELECT id, name, username, email, employee_code, role FROM users WHERE id = ?', [
            req.userId
        ]);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
        }
        res.json(serializeUser(user));
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const existing = await dbGet('SELECT * FROM users WHERE id = ?', [req.userId]);
        if (!existing) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
        }

        const rawName = req.body?.name;
        const nextName = rawName !== undefined ? String(rawName).trim() : existing.name;
        if (!nextName) {
            return res.status(400).json({ message: 'Họ và tên không được để trống' });
        }
        if (nextName.length > 100) {
            return res.status(400).json({ message: 'Họ và tên tối đa 100 ký tự' });
        }

        const nextCode =
            req.body?.employee_code !== undefined
                ? (String(req.body.employee_code || '').trim() || null)
                : existing.employee_code;

        if (nextCode) {
            if (/\s/.test(nextCode)) {
                return res.status(400).json({ message: 'Mã nhân viên không được chứa khoảng trắng' });
            }
            const clash = await dbGet(
                'SELECT id FROM users WHERE (LOWER(employee_code) = ? OR LOWER(username) = ?) AND id != ?',
                [nextCode.toLowerCase(), nextCode.toLowerCase(), existing.id]
            );
            if (clash) {
                return res.status(400).json({ message: 'Mã nhân viên đã thuộc về tài khoản khác' });
            }
        }

        await dbRun(
            'UPDATE users SET name = ?, employee_code = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [nextName, nextCode, existing.id]
        );

        const updated = await dbGet(
            'SELECT id, name, username, email, employee_code, role FROM users WHERE id = ?',
            [existing.id]
        );

        res.json({
            message: 'Đã cập nhật thông tin cá nhân!',
            user: serializeUser(updated)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật thông tin cá nhân' });
    }
};
