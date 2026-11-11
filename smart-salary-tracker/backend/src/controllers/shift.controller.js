const { dbRun, dbAll, dbGet } = require('../database/db');

exports.getShifts = async (req, res) => {
    try {
        const shifts = await dbAll('SELECT * FROM shifts WHERE user_id IS NULL OR user_id = ?', [req.userId]);
        res.json(shifts);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createShift = async (req, res) => {
    try {
        const { code, name, total_hours, regular_hours, overtime_hours } = req.body;
        const result = await dbRun(
            'INSERT INTO shifts (user_id, code, name, total_hours, regular_hours, overtime_hours) VALUES (?, ?, ?, ?, ?, ?)',
            [req.userId, code, name, total_hours, regular_hours, overtime_hours]
        );
        res.status(201).json({ id: result.id, message: 'Shift created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateShift = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, total_hours, regular_hours, overtime_hours, is_active } = req.body;
        
        const shift = await dbGet('SELECT * FROM shifts WHERE id = ?', [id]);
        if (!shift) {
            return res.status(404).json({ message: 'Shift not found' });
        }

        // Only allow updating own custom shifts
        if (shift.user_id !== req.userId) {
            return res.status(403).json({ message: 'Cannot update default shift' });
        }

        await dbRun(
            'UPDATE shifts SET code = ?, name = ?, total_hours = ?, regular_hours = ?, overtime_hours = ?, is_active = ? WHERE id = ?',
            [code, name, total_hours, regular_hours, overtime_hours, is_active, id]
        );
        res.json({ message: 'Shift updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
