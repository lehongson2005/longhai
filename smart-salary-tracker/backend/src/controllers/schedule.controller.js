const { dbRun, dbAll, dbGet, getMonthDateRange, parsePositiveInt } = require('../database/db');
const { calculateShiftSalary } = require('../utils/salaryCalculator');

const VALID_DAY_TYPES = ['NORMAL', 'WEEKLY_OFF', 'HOLIDAY'];
const VALID_BULK_MODES = ['AUTO', ...VALID_DAY_TYPES];

function resolveAutoDayType(dateStr) {
    const [year, month, day] = String(dateStr).split('-').map(Number);
    const utcDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    return utcDay === 0 ? 'WEEKLY_OFF' : 'NORMAL';
}

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
            let range;
            try {
                range = getMonthDateRange(month, year);
            } catch {
                return res.status(400).json({ message: 'Tháng hoặc năm không hợp lệ' });
            }
            query += ' AND ws.work_date >= ? AND ws.work_date < ?';
            params.push(range.start, range.endExclusive);
        }

        query += ' ORDER BY ws.work_date ASC';

        const [schedules, settingsRow] = await Promise.all([
            dbAll(query, params),
            dbGet('SELECT * FROM salary_settings WHERE user_id = ?', [req.userId])
        ]);

        const settings = settingsRow || { standard_hour_rate: 25529, overtime_rate: 38293 };
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
        const parsedShiftId = parsePositiveInt(shift_id);
        if (!parsedShiftId) {
            return res.status(400).json({ message: 'Vui lòng chọn ca trực hợp lệ' });
        }
        if (!VALID_DAY_TYPES.includes(day_type)) {
            return res.status(400).json({ message: 'Loại ngày không hợp lệ' });
        }

        const shift = await dbGet('SELECT id, code, total_hours FROM shifts WHERE id = ?', [parsedShiftId]);
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

exports.bulkCreateOrUpdateSchedule = async (req, res) => {
    try {
        const { dates, shift_id, day_type_mode = 'AUTO', notes = '', overwrite = true } = req.body;

        if (!Array.isArray(dates) || dates.length === 0) {
            return res.status(400).json({ message: 'Vui lòng chọn ít nhất 1 ngày để chấm ca' });
        }
        if (dates.length > 62) {
            return res.status(400).json({ message: 'Mỗi lần chỉ chấm tối đa 62 ngày' });
        }
        const parsedShiftId = parsePositiveInt(shift_id);
        if (!parsedShiftId) {
            return res.status(400).json({ message: 'Vui lòng chọn ca trực hợp lệ' });
        }
        if (!VALID_BULK_MODES.includes(day_type_mode)) {
            return res.status(400).json({ message: 'Chế độ loại ngày không hợp lệ' });
        }

        const uniqueDates = Array.from(
            new Set(dates.map((d) => String(d).trim()).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)))
        ).sort();
        if (uniqueDates.length === 0) {
            return res.status(400).json({ message: 'Danh sách ngày làm việc không hợp lệ' });
        }

        const minDate = uniqueDates[0];
        const maxDate = uniqueDates[uniqueDates.length - 1];

        const [shift, existingRows] = await Promise.all([
            dbGet('SELECT id, code, total_hours FROM shifts WHERE id = ?', [parsedShiftId]),
            dbAll('SELECT id, work_date FROM work_schedules WHERE user_id = ? AND work_date >= ? AND work_date <= ?', [
                req.userId,
                minDate,
                maxDate
            ])
        ]);

        if (!shift) {
            return res.status(404).json({ message: 'Ca trực không tồn tại' });
        }

        const existingByDate = new Map(existingRows.map((row) => [row.work_date, row.id]));
        const cleanNotes = String(notes || '').trim();
        let createdCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;

        const tasks = [];
        for (const workDate of uniqueDates) {
            const resolvedDayType = day_type_mode === 'AUTO' ? resolveAutoDayType(workDate) : day_type_mode;
            const existingId = existingByDate.get(workDate);

            if (existingId) {
                if (!overwrite) {
                    skippedCount += 1;
                    continue;
                }
                updatedCount += 1;
                tasks.push(() =>
                    dbRun('UPDATE work_schedules SET shift_id = ?, day_type = ?, notes = ? WHERE id = ?', [
                        shift.id,
                        resolvedDayType,
                        cleanNotes,
                        existingId
                    ])
                );
            } else {
                createdCount += 1;
                tasks.push(() =>
                    dbRun(
                        'INSERT INTO work_schedules (user_id, work_date, shift_id, day_type, notes) VALUES (?, ?, ?, ?, ?)',
                        [req.userId, workDate, shift.id, resolvedDayType, cleanNotes]
                    )
                );
            }
        }

        for (let i = 0; i < tasks.length; i += 10) {
            await Promise.all(tasks.slice(i, i + 10).map((run) => run()));
        }

        const savedCount = createdCount + updatedCount;
        res.json({
            createdCount,
            updatedCount,
            skippedCount,
            savedCount,
            message:
                skippedCount > 0
                    ? `Đã chấm ca ${shift.code} cho ${savedCount} ngày (bỏ qua ${skippedCount} ngày đã chấm)`
                    : `Đã chấm ca ${shift.code} cho ${savedCount} ngày!`
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi chấm ca hàng loạt' });
    }
};

exports.deleteSchedule = async (req, res) => {
    try {
        const id = parsePositiveInt(req.params.id);
        if (!id) {
            return res.status(400).json({ message: 'ID ca trực không hợp lệ' });
        }
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
