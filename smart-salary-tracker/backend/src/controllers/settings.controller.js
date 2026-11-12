const { dbRun, dbGet } = require('../database/db');

exports.getSettings = async (req, res) => {
    try {
        let settings = await dbGet('SELECT * FROM salary_settings WHERE user_id = ?', [req.userId]);
        if (!settings) {
            await dbRun(
                'INSERT INTO salary_settings (user_id, base_salary, standard_work_days, standard_hour_rate, overtime_rate, weekly_off_rate, holiday_rate) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [req.userId, 5310000, 26, 25529, 38293, 51058, 2]
            );
            settings = await dbGet('SELECT * FROM salary_settings WHERE user_id = ?', [req.userId]);
        }
        res.json(settings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi tải cấu hình lương' });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const baseSalary = Number(req.body.base_salary);
        const standardWorkDays = Number(req.body.standard_work_days);
        const standardHourRate = Number(req.body.standard_hour_rate);
        const overtimeRate = Number(req.body.overtime_rate ?? Math.round(standardHourRate * 1.5));
        const weeklyOffRate = Number(req.body.weekly_off_rate ?? Math.round(standardHourRate * 2));
        const holidayRate = Number(req.body.holiday_rate ?? 2);

        if (!Number.isFinite(baseSalary) || baseSalary < 0) {
            return res.status(400).json({ message: 'Lương cơ bản không hợp lệ' });
        }
        if (!Number.isFinite(standardWorkDays) || standardWorkDays <= 0) {
            return res.status(400).json({ message: 'Số công chuẩn phải lớn hơn 0' });
        }
        if (!Number.isFinite(standardHourRate) || standardHourRate <= 0) {
            return res.status(400).json({ message: 'Đơn giá giờ phải lớn hơn 0' });
        }

        const existing = await dbGet('SELECT id FROM salary_settings WHERE user_id = ?', [req.userId]);
        if (existing) {
            await dbRun(
                'UPDATE salary_settings SET base_salary = ?, standard_work_days = ?, standard_hour_rate = ?, overtime_rate = ?, weekly_off_rate = ?, holiday_rate = ? WHERE user_id = ?',
                [baseSalary, standardWorkDays, standardHourRate, overtimeRate, weeklyOffRate, holidayRate, req.userId]
            );
        } else {
            await dbRun(
                'INSERT INTO salary_settings (user_id, base_salary, standard_work_days, standard_hour_rate, overtime_rate, weekly_off_rate, holiday_rate) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [req.userId, baseSalary, standardWorkDays, standardHourRate, overtimeRate, weeklyOffRate, holidayRate]
            );
        }

        const updated = await dbGet('SELECT * FROM salary_settings WHERE user_id = ?', [req.userId]);
        res.json({ message: 'Đã lưu cấu hình lương thành công!', settings: updated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi lưu cấu hình lương' });
    }
};
