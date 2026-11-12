const { dbRun, dbAll, dbGet } = require('../database/db');

exports.getShifts = async (req, res) => {
    try {
        const shifts = await dbAll(
            `SELECT * FROM shifts
             WHERE (user_id IS NULL OR user_id = ?) AND is_active = 1
             ORDER BY CASE code
                WHEN 'B1' THEN 1
                WHEN 'B2' THEN 2
                WHEN 'A' THEN 3
                WHEN 'B' THEN 4
                WHEN 'C' THEN 5
                WHEN 'A1' THEN 6
                WHEN 'C1' THEN 7
                WHEN 'AB' THEN 8
                WHEN 'H' THEN 9
                WHEN 'R' THEN 10
                WHEN 'Nghỉ' THEN 11
                ELSE 99
             END, id ASC`,
            [req.userId]
        );
        res.setHeader('Cache-Control', 'private, max-age=300');
        res.json(shifts);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi tải danh sách ca trực' });
    }
};

exports.createShift = async (req, res) => {
    try {
        const { code, name, total_hours, regular_hours, overtime_hours } = req.body;
        if (!code || !name) {
            return res.status(400).json({ message: 'Vui lòng nhập mã và tên ca' });
        }
        const result = await dbRun(
            'INSERT INTO shifts (user_id, code, name, total_hours, regular_hours, overtime_hours) VALUES (?, ?, ?, ?, ?, ?)',
            [req.userId, String(code).trim(), String(name).trim(), Number(total_hours) || 0, Number(regular_hours) || 0, Number(overtime_hours) || 0]
        );
        res.status(201).json({ id: result.id, message: 'Đã thêm ca trực mới' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

exports.updateShift = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, total_hours, regular_hours, overtime_hours, is_active } = req.body;

        const shift = await dbGet('SELECT * FROM shifts WHERE id = ?', [id]);
        if (!shift) {
            return res.status(404).json({ message: 'Không tìm thấy ca trực' });
        }

        if (shift.user_id !== req.userId) {
            return res.status(403).json({ message: 'Không thể sửa ca trực mặc định' });
        }

        await dbRun(
            'UPDATE shifts SET code = ?, name = ?, total_hours = ?, regular_hours = ?, overtime_hours = ?, is_active = ? WHERE id = ?',
            [code, name, total_hours, regular_hours, overtime_hours, is_active, id]
        );
        res.json({ message: 'Đã cập nhật ca trực' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};
