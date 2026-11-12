const { dbRun, dbAll, dbGet } = require('../database/db');
const { calculateShiftSalary } = require('../utils/salaryCalculator');

const VALID_DAY_TYPES = ['NORMAL', 'WEEKLY_OFF', 'HOLIDAY'];

exports.getSchedules = async (req, res) => {
    try {
        const { month, year } = req.query;
        let query = `
            SELECT ws.*, s.code as shift_code, s.name as shift_name,
                   s.total_hours as shift_hours, s.regular_hours, s.overtime_hours
            FROM work_schedules ws
            JOIN shifts s ON ws.shift_id = s.id
            WHERE ws.user_id = ?
        `;
        const params = [req.userId];

        if (month && year) {
            query += ' AND strftime("%m", work_date) = ? AND strftime("%Y", work_date) = ?';
            params.push(String(month).padStart(2, '0'), String(year));
        }

        query += ' ORDER BY ws.work_date ASC';

        const [schedules, settingsRow] = await Promise.all([
            dbAll(query, params),
            dbGet('SELECT * FROM salary_settings WHERE user_id = ?', [req.userId])
        ]);

        const settings = settingsRow || { standard_hour_rate: 25529 };
        const enriched = schedules.map((sch) => {
            const calc = calculateShiftSalary(
                { total_hours: sch.shift_hours },
                sch.day_type,
                settings
            );
            return {
                ...sch,
                estimated_salary: Math.round(calc.salary),
                calc_regular_hours: calc.regularHours,
                calc_overtime_hours: calc.overtimeHours
            };
        });

        res.json(enriched);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi tải lịch trực' });
    }
};

exports.createOrUpdateSchedule = async (req, res) => {
    try {
        const { work_date, shift_id, day_type = 'NORMAL', notes = '' } = req.body;

        if (!work_date || !/^\d{4}-\d{2}-\d{2}$/.test(String(work_date))) {
            return res.status(400).json({ message: 'Ngày làm việc không hợp lệ' });
        }
        if (!shift_id) {
            return res.status(400).json({ message: 'Vui lòng chọn ca trực' });
        }
        if (!VALID_DAY_TYPES.includes(day_type)) {
            return res.status(400).json({ message: 'Loại ngày không hợp lệ' });
        }

        const shift = await dbGet('SELECT id, code, total_hours FROM shifts WHERE id = ?', [shift_id]);
        if (!shift) {
            return res.status(404).json({ message: 'Ca trực không tồn tại' });
        }

        const existing = await dbGet('SELECT * FROM work_schedules WHERE user_id = ? AND work_date = ?', [
            req.userId,
            work_date
        ]);

        if (existing) {
            await dbRun('UPDATE work_schedules SET shift_id = ?, day_type = ?, notes = ? WHERE id = ?', [
                shift.id,
                day_type,
                notes || '',
                existing.id
            ]);
            return res.json({
                id: existing.id,
                message: `Đã cập nhật ca ${shift.code} (${shift.total_hours}h)`
            });
        }

        const result = await dbRun(
            'INSERT INTO work_schedules (user_id, work_date, shift_id, day_type, notes) VALUES (?, ?, ?, ?, ?)',
            [req.userId, work_date, shift.id, day_type, notes || '']
        );
        return res.status(201).json({
            id: result.id,
            message: `Đã lưu ca ${shift.code} (${shift.total_hours}h)`
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi lưu ca trực' });
    }
};

exports.deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await dbRun('DELETE FROM work_schedules WHERE id = ? AND user_id = ?', [id, req.userId]);
        if (result.changes === 0) {
            return res.status(404).json({ message: 'Không tìm thấy ca trực cần xóa' });
        }
        res.json({ message: 'Đã xóa ca trực thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi xóa ca trực' });
    }
};
