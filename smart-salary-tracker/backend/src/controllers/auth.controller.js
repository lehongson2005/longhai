const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { dbRun, dbGet } = require('../database/db');

exports.register = async (req, res) => {
    try {
        const { name, email, employee_code, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu' });
        }

        const cleanEmail = String(email).trim().toLowerCase();
        const existingUser = await dbGet('SELECT id FROM users WHERE email = ?', [cleanEmail]);
        if (existingUser) {
            return res.status(400).json({ message: 'Email đã tồn tại trong hệ thống' });
        }

        const normalizedEmployeeCode =
            employee_code && String(employee_code).trim() ? String(employee_code).trim() : null;

        if (normalizedEmployeeCode) {
            const existingCode = await dbGet('SELECT id FROM users WHERE employee_code = ?', [normalizedEmployeeCode]);
            if (existingCode) {
                return res.status(400).json({ message: 'Mã nhân viên đã tồn tại' });
            }
        }

        const password_hash = await bcrypt.hash(password, 10);

        const result = await dbRun(
            "INSERT INTO users (name, email, employee_code, password_hash, role) VALUES (?, ?, ?, ?, 'employee')",
            [String(name).trim(), cleanEmail, normalizedEmployeeCode, password_hash]
        );

        await dbRun(
            'INSERT INTO salary_settings (user_id, base_salary, standard_work_days, standard_hour_rate, overtime_rate, weekly_off_rate, holiday_rate) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [result.id, 5310000, 26, 25529, 38293, 51058, 2]
        );

        const defaultCategories = ['Ăn uống', 'Di chuyển', 'Nhà ở', 'Mua sắm', 'Giải trí', 'Khác'];
        for (const cat of defaultCategories) {
            await dbRun('INSERT INTO expense_categories (user_id, name, icon) VALUES (?, ?, ?)', [result.id, cat, '']);
        }

        res.status(201).json({ message: 'User registered successfully', userId: result.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const cleanEmail = email ? String(email).trim().toLowerCase() : '';

        const user = await dbGet('SELECT * FROM users WHERE email = ?', [cleanEmail]);
        if (!user) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
        }

        const isValidPassword = await bcrypt.compare(password || '', user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role || 'employee' },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                employee_code: user.employee_code,
                role: user.role || 'employee'
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await dbGet('SELECT id, name, email, employee_code, role FROM users WHERE id = ?', [req.userId]);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
