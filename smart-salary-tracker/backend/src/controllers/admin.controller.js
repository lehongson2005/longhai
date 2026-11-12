const bcrypt = require('bcrypt');
const { dbAll, dbGet, dbRun, ensureUserDefaults, getStorageInfo, getMonthDateRange, parsePositiveInt } = require('../database/db');
const { calculateShiftSalary } = require('../utils/salaryCalculator');

const VALID_ROLES = ['employee', 'admin'];
const VALID_DAY_TYPES = ['NORMAL', 'WEEKLY_OFF', 'HOLIDAY'];
const VALID_ADJUSTMENT_TYPES = ['ALLOWANCE', 'DEDUCTION'];
const DEFAULT_SETTINGS = {
    base_salary: 5310000,
    standard_work_days: 26,
    standard_hour_rate: 25529,
    overtime_rate: 38293,
    weekly_off_rate: 51058,
    holiday_rate: 2
};

async function runInBatches(taskFns, batchSize = 10) {
    for (let i = 0; i < taskFns.length; i += batchSize) {
        await Promise.all(taskFns.slice(i, i + batchSize).map((fn) => fn()));
    }
}

exports.getStats = async (req, res) => {
    try {
        const [totalUsersRow, employeesRow, adminsRow, shiftsRow, currentAdminRow] = await Promise.all([
            dbGet('SELECT COUNT(*) as count FROM users'),
            dbGet("SELECT COUNT(*) as count FROM users WHERE role = 'employee'"),
            dbGet("SELECT COUNT(*) as count FROM users WHERE role = 'admin'"),
            dbGet('SELECT COUNT(*) as count FROM shifts WHERE user_id IS NULL AND is_active = 1'),
            dbGet('SELECT password_hash FROM users WHERE id = ?', [req.userId])
        ]);

        const isDefaultAdminPassword = currentAdminRow?.password_hash
            ? await bcrypt.compare('admin123', currentAdminRow.password_hash)
            : false;

        res.setHeader('Cache-Control', 'no-store');
        res.json({
            totalUsers: Number(totalUsersRow?.count || 0),
            totalEmployees: Number(employeesRow?.count || 0),
            totalAdmins: Number(adminsRow?.count || 0),
            activeShifts: Number(shiftsRow?.count || 0),
            isDefaultAdminPassword,
            storage: getStorageInfo()
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi tải thống kê' });
    }
};

exports.getTeamPayroll = async (req, res) => {
    try {
        const now = new Date();
        const targetMonth = req.query.month !== undefined ? Number(req.query.month) : now.getMonth() + 1;
        const targetYear = req.query.year !== undefined ? Number(req.query.year) : now.getFullYear();

        let range;
        try {
            range = getMonthDateRange(targetMonth, targetYear);
        } catch {
            return res.status(400).json({ message: 'Tháng hoặc năm không hợp lệ' });
        }

        const [users, settingsRows, scheduleRows, adjustmentRows, expenseRows] = await Promise.all([
            dbAll(
                "SELECT id, name, username, email, employee_code, role FROM users ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END, name ASC, id ASC"
            ),
            dbAll(
                'SELECT user_id, base_salary, standard_work_days, standard_hour_rate, overtime_rate, weekly_off_rate, holiday_rate FROM salary_settings'
            ),
            dbAll(
                `SELECT ws.user_id, ws.work_date, ws.day_type, s.total_hours, s.code as shift_code
                 FROM work_schedules ws
                 JOIN shifts s ON ws.shift_id = s.id
                 WHERE ws.work_date >= ? AND ws.work_date < ?
                 ORDER BY ws.work_date ASC`,
                [range.start, range.endExclusive]
            ),
            dbAll(
                `SELECT user_id, type, amount
                 FROM salary_adjustments
                 WHERE adjustment_date >= ? AND adjustment_date < ?`,
                [range.start, range.endExclusive]
            ),
            dbAll(
                `SELECT user_id, SUM(amount) as total_expense
                 FROM expenses
                 WHERE expense_date >= ? AND expense_date < ?
                 GROUP BY user_id`,
                [range.start, range.endExclusive]
            )
        ]);

        const settingsMap = new Map(settingsRows.map((row) => [Number(row.user_id), row]));
        const schedulesByUser = new Map();
        for (const row of scheduleRows) {
            const uid = Number(row.user_id);
            if (!schedulesByUser.has(uid)) schedulesByUser.set(uid, []);
            schedulesByUser.get(uid).push(row);
        }

        const adjustmentsByUser = new Map();
        for (const row of adjustmentRows) {
            const uid = Number(row.user_id);
            if (!adjustmentsByUser.has(uid)) adjustmentsByUser.set(uid, []);
            adjustmentsByUser.get(uid).push(row);
        }

        const expenseByUser = new Map(expenseRows.map((row) => [Number(row.user_id), Number(row.total_expense || 0)]));

        const totals = {
            totalMembers: users.length,
            activeWorkers: 0,
            workDays: 0,
            totalHours: 0,
            regularHours: 0,
            overtimeHours: 0,
            shiftIncome: 0,
            allowances: 0,
            deductions: 0,
            netSalary: 0,
            totalExpense: 0,
            balance: 0
        };

        const members = users.map((u) => {
            const uid = Number(u.id);
            const userSettings = settingsMap.get(uid) || DEFAULT_SETTINGS;
            const userSchedules = schedulesByUser.get(uid) || [];
            const userAdjustments = adjustmentsByUser.get(uid) || [];

            let rawShiftIncome = 0;
            let totalHours = 0;
            let regularHours = 0;
            let overtimeHours = 0;
            let workDays = 0;
            const shiftCountMap = {};

            for (const sch of userSchedules) {
                const calc = calculateShiftSalary(sch, sch.day_type, userSettings);
                const hrs = Number(sch.total_hours) || 0;
                rawShiftIncome += calc.salary;
                totalHours += hrs;
                regularHours += calc.regularHours || 0;
                overtimeHours += calc.overtimeHours || 0;
                if (hrs > 0) workDays += 1;
                shiftCountMap[sch.shift_code] = (shiftCountMap[sch.shift_code] || 0) + 1;
            }

            let rawAllowances = 0;
            let rawDeductions = 0;
            for (const adj of userAdjustments) {
                const amt = Number(adj.amount) || 0;
                if (adj.type === 'ALLOWANCE') rawAllowances += amt;
                else if (adj.type === 'DEDUCTION') rawDeductions += amt;
            }

            const shiftIncome = Math.round(rawShiftIncome);
            const allowances = Math.round(rawAllowances);
            const deductions = Math.round(rawDeductions);
            const netSalary = shiftIncome + allowances - deductions;
            const totalExpense = Math.round(expenseByUser.get(uid) || 0);
            const balance = netSalary - totalExpense;

            if (workDays > 0 || netSalary !== 0 || totalExpense > 0) {
                totals.activeWorkers += 1;
            }
            totals.workDays += workDays;
            totals.totalHours += totalHours;
            totals.regularHours += regularHours;
            totals.overtimeHours += overtimeHours;
            totals.shiftIncome += shiftIncome;
            totals.allowances += allowances;
            totals.deductions += deductions;
            totals.netSalary += netSalary;
            totals.totalExpense += totalExpense;
            totals.balance += balance;

            return {
                id: u.id,
                name: u.name,
                username: u.username,
                email: u.email,
                employee_code: u.employee_code,
                role: u.role,
                workDays,
                totalHours: Number(totalHours.toFixed(1)),
                regularHours: Number(regularHours.toFixed(1)),
                overtimeHours: Number(overtimeHours.toFixed(1)),
                shiftIncome,
                allowances,
                deductions,
                netSalary,
                totalExpense,
                balance,
                shiftCounts: shiftCountMap
            };
        });

        totals.totalHours = Number(totals.totalHours.toFixed(1));
        totals.regularHours = Number(totals.regularHours.toFixed(1));
        totals.overtimeHours = Number(totals.overtimeHours.toFixed(1));

        res.setHeader('Cache-Control', 'no-store');
        res.json({
            period: { month: targetMonth, year: targetYear },
            totals,
            members
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi tổng hợp bảng công cả đội' });
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
                COALESCE(ws_cnt.cnt, 0) as schedule_count,
                COALESCE(ex_cnt.cnt, 0) as expense_count
            FROM users u
            LEFT JOIN (
                SELECT user_id, COUNT(*) as cnt FROM work_schedules GROUP BY user_id
            ) ws_cnt ON ws_cnt.user_id = u.id
            LEFT JOIN (
                SELECT user_id, COUNT(*) as cnt FROM expenses GROUP BY user_id
            ) ex_cnt ON ex_cnt.user_id = u.id
        `;
        const params = [];

        if (q && String(q).trim()) {
            const kw = `%${String(q).trim().toLowerCase()}%`;
            query +=
                " WHERE LOWER(u.name) LIKE ? OR LOWER(COALESCE(u.username, '')) LIKE ? OR LOWER(COALESCE(u.email, '')) LIKE ? OR LOWER(COALESCE(u.employee_code, '')) LIKE ?";
            params.push(kw, kw, kw, kw);
        }

        query += " ORDER BY CASE WHEN u.role = 'admin' THEN 0 ELSE 1 END, u.id DESC";
        const users = await dbAll(query, params);
        res.json(
            users.map((u) => ({
                ...u,
                schedule_count: Number(u.schedule_count || 0),
                expense_count: Number(u.expense_count || 0)
            }))
        );
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
        const id = parsePositiveInt(req.params.id);
        if (!id) {
            return res.status(400).json({ message: 'ID tài khoản không hợp lệ' });
        }
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
        const id = parsePositiveInt(req.params.id);
        if (!id) {
            return res.status(400).json({ message: 'ID tài khoản không hợp lệ' });
        }
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
        const id = parsePositiveInt(req.params.id);
        if (!id) {
            return res.status(400).json({ message: 'ID tài khoản không hợp lệ' });
        }
        const target = await dbGet('SELECT id, name FROM users WHERE id = ?', [id]);
        if (!target) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
        }

        if (Number(target.id) === Number(req.userId)) {
            return res.status(400).json({ message: 'Không thể tự xóa tài khoản Admin đang đăng nhập' });
        }

        await dbRun('DELETE FROM work_schedules WHERE user_id = ?', [target.id]);
        await dbRun('DELETE FROM expenses WHERE user_id = ?', [target.id]);
        await dbRun('DELETE FROM salary_adjustments WHERE user_id = ?', [target.id]);
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

exports.exportBackup = async (req, res) => {
    try {
        const [
            users,
            shifts,
            salary_settings,
            expense_categories,
            work_schedules,
            expenses,
            salary_adjustments
        ] = await Promise.all([
            dbAll('SELECT id, name, username, email, employee_code, password_hash, role, created_at, updated_at FROM users ORDER BY id ASC'),
            dbAll('SELECT id, user_id, code, name, total_hours, regular_hours, overtime_hours, is_active FROM shifts ORDER BY id ASC'),
            dbAll('SELECT user_id, base_salary, standard_work_days, standard_hour_rate, overtime_rate, weekly_off_rate, holiday_rate FROM salary_settings ORDER BY id ASC'),
            dbAll('SELECT id, user_id, name, icon FROM expense_categories ORDER BY id ASC'),
            dbAll('SELECT user_id, work_date, shift_id, day_type, notes FROM work_schedules ORDER BY work_date ASC, id ASC'),
            dbAll('SELECT user_id, expense_date, amount, category_id, note FROM expenses ORDER BY expense_date ASC, id ASC'),
            dbAll('SELECT user_id, adjustment_date, type, title, amount, note FROM salary_adjustments ORDER BY adjustment_date ASC, id ASC')
        ]);

        res.setHeader('Cache-Control', 'no-store');
        res.json({
            version: 1,
            app: 'longhai-securitas',
            exportedAt: new Date().toISOString(),
            storage: getStorageInfo(),
            data: {
                users,
                shifts,
                salary_settings,
                expense_categories,
                work_schedules,
                expenses,
                salary_adjustments
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi xuất bản sao lưu dữ liệu' });
    }
};

exports.importBackup = async (req, res) => {
    try {
        const payload = req.body && req.body.data ? req.body.data : req.body;
        if (!payload || !Array.isArray(payload.users) || payload.users.length === 0) {
            return res.status(400).json({ message: 'File sao lưu không hợp lệ hoặc chưa có tài khoản nào' });
        }

        const existingUsers = await dbAll(
            'SELECT id, name, username, email, employee_code, password_hash, role FROM users ORDER BY id ASC'
        );
        const byUsername = new Map();
        const byEmail = new Map();
        const byCode = new Map();
        const registerUserLookup = (u) => {
            if (u.username) byUsername.set(String(u.username).trim().toLowerCase(), u);
            if (u.email) byEmail.set(String(u.email).trim().toLowerCase(), u);
            if (u.employee_code) byCode.set(String(u.employee_code).trim().toLowerCase(), u);
        };
        existingUsers.forEach(registerUserLookup);

        const userIdMap = new Map();
        let usersCreated = 0;
        let usersUpdated = 0;
        let defaultHashPromise = null;
        const getFallbackHash = () => {
            if (!defaultHashPromise) {
                defaultHashPromise = bcrypt.hash('123456', 10);
            }
            return defaultHashPromise;
        };

        for (const rawUser of payload.users) {
            const cleanName = String(rawUser?.name || '').trim();
            const cleanUsername = rawUser?.username ? String(rawUser.username).trim().toLowerCase() : null;
            const cleanEmail = rawUser?.email ? String(rawUser.email).trim().toLowerCase() : null;
            const cleanCode = rawUser?.employee_code ? String(rawUser.employee_code).trim() : null;
            const codeKey = cleanCode ? cleanCode.toLowerCase() : null;

            if (!cleanName || (!cleanUsername && !cleanEmail && !cleanCode)) {
                continue;
            }

            const matched =
                (cleanUsername && byUsername.get(cleanUsername)) ||
                (cleanEmail && byEmail.get(cleanEmail)) ||
                (codeKey && byCode.get(codeKey)) ||
                null;

            const safeRole = VALID_ROLES.includes(rawUser?.role) ? rawUser.role : 'employee';

            if (matched) {
                const nextRole = Number(matched.id) === Number(req.userId) ? 'admin' : safeRole;
                const nextHash =
                    rawUser?.password_hash && String(rawUser.password_hash).trim()
                        ? String(rawUser.password_hash).trim()
                        : matched.password_hash;

                await dbRun(
                    'UPDATE users SET name = ?, role = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [cleanName, nextRole, nextHash, matched.id]
                );
                await ensureUserDefaults(matched.id);
                if (rawUser?.id != null) {
                    userIdMap.set(Number(rawUser.id), Number(matched.id));
                }
                usersUpdated += 1;
            } else {
                const safeCode = codeKey && byCode.has(codeKey) ? null : cleanCode;
                const nextHash =
                    rawUser?.password_hash && String(rawUser.password_hash).trim()
                        ? String(rawUser.password_hash).trim()
                        : await getFallbackHash();

                const inserted = await dbRun(
                    'INSERT INTO users (name, username, email, employee_code, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)',
                    [cleanName, cleanUsername, cleanEmail, safeCode, nextHash, safeRole]
                );
                await ensureUserDefaults(inserted.id);

                const newUser = {
                    id: Number(inserted.id),
                    name: cleanName,
                    username: cleanUsername,
                    email: cleanEmail,
                    employee_code: safeCode,
                    password_hash: nextHash,
                    role: safeRole
                };
                registerUserLookup(newUser);
                if (rawUser?.id != null) {
                    userIdMap.set(Number(rawUser.id), Number(inserted.id));
                }
                usersCreated += 1;
            }
        }

        const [existingShifts, existingCategories, existingSchedules, existingExpenses, existingAdjustments] =
            await Promise.all([
                dbAll('SELECT * FROM shifts ORDER BY id ASC'),
                dbAll('SELECT * FROM expense_categories ORDER BY id ASC'),
                dbAll('SELECT id, user_id, work_date FROM work_schedules'),
                dbAll('SELECT user_id, expense_date, amount, category_id, note FROM expenses'),
                dbAll('SELECT user_id, adjustment_date, type, title, amount, note FROM salary_adjustments')
            ]);

        const shiftIdMap = new Map();
        const shiftKeyMap = new Map();
        existingShifts.forEach((s) => {
            const ownerKey = s.user_id == null ? 'global' : String(s.user_id);
            shiftKeyMap.set(`${ownerKey}:${s.code}`, s.id);
        });

        for (const rawShift of Array.isArray(payload.shifts) ? payload.shifts : []) {
            const cleanShiftCode = String(rawShift?.code || '').trim();
            const cleanShiftName = String(rawShift?.name || '').trim();
            if (!cleanShiftCode || !cleanShiftName) continue;

            const mappedOwner = rawShift.user_id == null ? null : userIdMap.get(Number(rawShift.user_id));
            if (rawShift.user_id != null && !mappedOwner) continue;

            const key = `${mappedOwner == null ? 'global' : String(mappedOwner)}:${cleanShiftCode}`;
            const existingShiftId = shiftKeyMap.get(key);
            if (existingShiftId) {
                if (rawShift?.id != null) shiftIdMap.set(Number(rawShift.id), Number(existingShiftId));
            } else {
                const insertedShift = await dbRun(
                    'INSERT INTO shifts (user_id, code, name, total_hours, regular_hours, overtime_hours, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [
                        mappedOwner,
                        cleanShiftCode,
                        cleanShiftName,
                        Number(rawShift.total_hours) || 0,
                        Number(rawShift.regular_hours) || 0,
                        Number(rawShift.overtime_hours) || 0,
                        rawShift.is_active === 0 ? 0 : 1
                    ]
                );
                shiftKeyMap.set(key, insertedShift.id);
                if (rawShift?.id != null) shiftIdMap.set(Number(rawShift.id), Number(insertedShift.id));
            }
        }

        const categoryIdMap = new Map();
        const categoryKeyMap = new Map();
        existingCategories.forEach((c) => {
            const ownerKey = c.user_id == null ? 'global' : String(c.user_id);
            categoryKeyMap.set(`${ownerKey}:${String(c.name || '').trim().toLowerCase()}`, c.id);
        });

        for (const rawCat of Array.isArray(payload.expense_categories) ? payload.expense_categories : []) {
            const cleanCatName = String(rawCat?.name || '').trim();
            if (!cleanCatName) continue;

            const mappedOwner = rawCat.user_id == null ? null : userIdMap.get(Number(rawCat.user_id));
            if (rawCat.user_id != null && !mappedOwner) continue;

            const key = `${mappedOwner == null ? 'global' : String(mappedOwner)}:${cleanCatName.toLowerCase()}`;
            const existingCatId = categoryKeyMap.get(key);
            if (existingCatId) {
                if (rawCat?.id != null) categoryIdMap.set(Number(rawCat.id), Number(existingCatId));
            } else {
                const insertedCat = await dbRun(
                    'INSERT INTO expense_categories (user_id, name, icon) VALUES (?, ?, ?)',
                    [mappedOwner, cleanCatName, String(rawCat.icon || '')]
                );
                categoryKeyMap.set(key, insertedCat.id);
                if (rawCat?.id != null) categoryIdMap.set(Number(rawCat.id), Number(insertedCat.id));
            }
        }

        const settingsTasks = [];
        let settingsUpdated = 0;
        for (const rawSetting of Array.isArray(payload.salary_settings) ? payload.salary_settings : []) {
            const mappedUserId = userIdMap.get(Number(rawSetting?.user_id));
            if (!mappedUserId) continue;

            const baseSalary = Number(rawSetting.base_salary ?? 5310000);
            const standardWorkDays = Number(rawSetting.standard_work_days ?? 26);
            const standardHourRate = Number(rawSetting.standard_hour_rate ?? 25529);
            const overtimeRate = Number(rawSetting.overtime_rate ?? 38293);
            const weeklyOffRate = Number(rawSetting.weekly_off_rate ?? 51058);
            const holidayRate = Number(rawSetting.holiday_rate ?? 2);

            if (standardWorkDays <= 0 || standardHourRate <= 0) continue;

            settingsUpdated += 1;
            settingsTasks.push(() =>
                dbRun(
                    'UPDATE salary_settings SET base_salary = ?, standard_work_days = ?, standard_hour_rate = ?, overtime_rate = ?, weekly_off_rate = ?, holiday_rate = ? WHERE user_id = ?',
                    [baseSalary, standardWorkDays, standardHourRate, overtimeRate, weeklyOffRate, holidayRate, mappedUserId]
                )
            );
        }
        await runInBatches(settingsTasks, 10);

        const scheduleMap = new Map(existingSchedules.map((s) => [`${s.user_id}:${s.work_date}`, s.id]));
        const scheduleTasks = [];
        let schedulesSaved = 0;
        for (const rawSchedule of Array.isArray(payload.work_schedules) ? payload.work_schedules : []) {
            const mappedUserId = userIdMap.get(Number(rawSchedule?.user_id));
            const mappedShiftId = shiftIdMap.get(Number(rawSchedule?.shift_id));
            const workDate = String(rawSchedule?.work_date || '').trim();
            const dayType = VALID_DAY_TYPES.includes(rawSchedule?.day_type) ? rawSchedule.day_type : 'NORMAL';

            if (!mappedUserId || !mappedShiftId || !/^\d{4}-\d{2}-\d{2}$/.test(workDate)) continue;

            const key = `${mappedUserId}:${workDate}`;
            const existingScheduleId = scheduleMap.get(key);
            const cleanNotes = String(rawSchedule.notes || '');
            schedulesSaved += 1;

            if (existingScheduleId) {
                scheduleTasks.push(() =>
                    dbRun('UPDATE work_schedules SET shift_id = ?, day_type = ?, notes = ? WHERE id = ?', [
                        mappedShiftId,
                        dayType,
                        cleanNotes,
                        existingScheduleId
                    ])
                );
            } else {
                scheduleMap.set(key, -1);
                scheduleTasks.push(() =>
                    dbRun(
                        'INSERT INTO work_schedules (user_id, work_date, shift_id, day_type, notes) VALUES (?, ?, ?, ?, ?)',
                        [mappedUserId, workDate, mappedShiftId, dayType, cleanNotes]
                    )
                );
            }
        }
        await runInBatches(scheduleTasks, 10);

        const expenseKeys = new Set(
            existingExpenses.map(
                (e) => `${e.user_id}|${e.expense_date}|${Number(e.amount)}|${e.category_id ?? ''}|${e.note || ''}`
            )
        );
        const expenseTasks = [];
        let expensesAdded = 0;
        for (const rawExp of Array.isArray(payload.expenses) ? payload.expenses : []) {
            const mappedUserId = userIdMap.get(Number(rawExp?.user_id));
            const expenseDate = String(rawExp?.expense_date || '').trim();
            const amount = Number(rawExp?.amount);
            const mappedCategoryId =
                rawExp?.category_id != null ? (categoryIdMap.get(Number(rawExp.category_id)) ?? null) : null;
            const cleanNote = String(rawExp?.note || '').trim();

            if (!mappedUserId || !/^\d{4}-\d{2}-\d{2}$/.test(expenseDate) || !Number.isFinite(amount) || amount <= 0) {
                continue;
            }

            const sig = `${mappedUserId}|${expenseDate}|${amount}|${mappedCategoryId ?? ''}|${cleanNote}`;
            if (expenseKeys.has(sig)) continue;
            expenseKeys.add(sig);
            expensesAdded += 1;

            expenseTasks.push(() =>
                dbRun('INSERT INTO expenses (user_id, expense_date, amount, category_id, note) VALUES (?, ?, ?, ?, ?)', [
                    mappedUserId,
                    expenseDate,
                    amount,
                    mappedCategoryId,
                    cleanNote
                ])
            );
        }
        await runInBatches(expenseTasks, 10);

        const adjustmentKeys = new Set(
            existingAdjustments.map(
                (a) =>
                    `${a.user_id}|${a.adjustment_date}|${a.type}|${a.title}|${Number(a.amount)}|${a.note || ''}`
            )
        );
        const adjustmentTasks = [];
        let adjustmentsAdded = 0;
        for (const rawAdj of Array.isArray(payload.salary_adjustments) ? payload.salary_adjustments : []) {
            const mappedUserId = userIdMap.get(Number(rawAdj?.user_id));
            const adjDate = String(rawAdj?.adjustment_date || '').trim();
            const adjType = String(rawAdj?.type || '').trim().toUpperCase();
            const cleanTitle = String(rawAdj?.title || '').trim();
            const amount = Number(rawAdj?.amount);
            const cleanNote = String(rawAdj?.note || '').trim();

            if (
                !mappedUserId ||
                !/^\d{4}-\d{2}-\d{2}$/.test(adjDate) ||
                !VALID_ADJUSTMENT_TYPES.includes(adjType) ||
                !cleanTitle ||
                !Number.isFinite(amount) ||
                amount <= 0
            ) {
                continue;
            }

            const sig = `${mappedUserId}|${adjDate}|${adjType}|${cleanTitle}|${amount}|${cleanNote}`;
            if (adjustmentKeys.has(sig)) continue;
            adjustmentKeys.add(sig);
            adjustmentsAdded += 1;

            adjustmentTasks.push(() =>
                dbRun(
                    'INSERT INTO salary_adjustments (user_id, adjustment_date, type, title, amount, note) VALUES (?, ?, ?, ?, ?, ?)',
                    [mappedUserId, adjDate, adjType, cleanTitle, amount, cleanNote]
                )
            );
        }
        await runInBatches(adjustmentTasks, 10);

        res.json({
            message: `Đã khôi phục xong: ${usersCreated} TK mới, ${usersUpdated} TK cập nhật, ${schedulesSaved} ca trực, ${expensesAdded} khoản chi, ${adjustmentsAdded} phụ cấp/tạm ứng.`,
            stats: {
                usersCreated,
                usersUpdated,
                settingsUpdated,
                schedulesSaved,
                expensesAdded,
                adjustmentsAdded
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi khôi phục dữ liệu sao lưu' });
    }
};
