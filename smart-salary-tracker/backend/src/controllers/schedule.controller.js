const { dbRun, dbAll, dbGet } = require('../database/db');

exports.getSchedules = async (req, res) => {
    try {
        const { month, year } = req.query;
        let query = 'SELECT ws.*, s.code as shift_code, s.total_hours as shift_hours FROM work_schedules ws JOIN shifts s ON ws.shift_id = s.id WHERE ws.user_id = ?';
        let params = [req.userId];
        
        if (month && year) {
            query += ' AND strftime("%m", work_date) = ? AND strftime("%Y", work_date) = ?';
            // ensure month is 2 digits
            const formattedMonth = month.padStart(2, '0');
            params.push(formattedMonth, year);
        }

        const schedules = await dbAll(query, params);
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createOrUpdateSchedule = async (req, res) => {
    try {
        const { work_date, shift_id, day_type, notes } = req.body;

        const existing = await dbGet('SELECT * FROM work_schedules WHERE user_id = ? AND work_date = ?', [req.userId, work_date]);

        if (existing) {
            await dbRun(
                'UPDATE work_schedules SET shift_id = ?, day_type = ?, notes = ? WHERE id = ?',
                [shift_id, day_type, notes, existing.id]
            );
            return res.json({ message: 'Schedule updated successfully' });
        } else {
            const result = await dbRun(
                'INSERT INTO work_schedules (user_id, work_date, shift_id, day_type, notes) VALUES (?, ?, ?, ?, ?)',
                [req.userId, work_date, shift_id, day_type, notes]
            );
            return res.status(201).json({ id: result.id, message: 'Schedule created successfully' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        await dbRun('DELETE FROM work_schedules WHERE id = ? AND user_id = ?', [id, req.userId]);
        res.json({ message: 'Schedule deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
