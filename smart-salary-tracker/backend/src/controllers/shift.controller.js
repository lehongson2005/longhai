const { dbRun, dbAll, dbGet, parsePositiveInt } = require('../database/db');

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
        res.setHeader('Cache-Control', 'no-store');
        res.json(shifts);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi tải danh sách ca trực' });
    }
};

exports.createShift = async (req, res) => {
    try {
        const rawCode = String(req.body?.code || '').trim();
        const rawName = String(req.body?.name || '').trim() || `Ca ${rawCode}`;
        const totalHours = Number(req.body?.total_hours);

        if (!rawCode) {
            return res.status(400).json({ message: 'Vui lòng nhập mã ca trực (VD: C2, Đ6)' });
        }
        if (rawCode.length > 20 || rawName.length > 60) {
            return res.status(400).json({ message: 'Mã ca tối đa 20 ký tự, tên ca tối đa 60 ký tự' });
        }
        if (!Number.isFinite(totalHours) || totalHours < 0 || totalHours > 24) {
            return res.status(400).json({ message: 'Tổng số giờ phải từ 0 đến 24 giờ' });
        }

        const regHours =
            req.body?.regular_hours !== undefined && req.body?.regular_hours !== ''
                ? Number(req.body.regular_hours)
                : Math.min(8, totalHours);
        const otHours =
            req.body?.overtime_hours !== undefined && req.body?.overtime_hours !== ''
                ? Number(req.body.overtime_hours)
                : Math.max(0, totalHours - regHours);

        if (!Number.isFinite(regHours) || regHours < 0 || !Number.isFinite(otHours) || otHours < 0) {
            return res.status(400).json({ message: 'Số giờ chuẩn và giờ tăng ca không hợp lệ' });
        }

        const existing = await dbGet(
            'SELECT id FROM shifts WHERE LOWER(code) = ? AND is_active = 1 AND (user_id IS NULL OR user_id = ?)',
            [rawCode.toLowerCase(), req.userId]
        );
        if (existing) {
            return res.status(400).json({ message: `Mã ca "${rawCode}" đã tồn tại` });
        }

        const result = await dbRun(
            'INSERT INTO shifts (user_id, code, name, total_hours, regular_hours, overtime_hours, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
            [req.userId, rawCode, rawName, totalHours, regHours, otHours]
        );
        const created = await dbGet('SELECT * FROM shifts WHERE id = ?', [result.id]);
        res.status(201).json({ id: result.id, shift: created, message: `Đã thêm ca riêng "${rawCode}" (${totalHours}h)` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi thêm ca trực riêng' });
    }
};

exports.updateShift = async (req, res) => {
    try {
        const id = parsePositiveInt(req.params.id);
        if (!id) {
            return res.status(400).json({ message: 'ID ca trực không hợp lệ' });
        }

        const shift = await dbGet('SELECT * FROM shifts WHERE id = ?', [id]);
        if (!shift) {
            return res.status(404).json({ message: 'Không tìm thấy ca trực' });
        }

        if (shift.user_id == null || Number(shift.user_id) !== Number(req.userId)) {
            return res.status(403).json({ message: 'Không thể sửa ca trực mặc định' });
        }

        const code = req.body?.code !== undefined ? String(req.body.code).trim() : shift.code;
        const name = req.body?.name !== undefined ? String(req.body.name).trim() : shift.name;
        const totalHours = req.body?.total_hours !== undefined ? Number(req.body.total_hours) : Number(shift.total_hours);
        const regHours =
            req.body?.regular_hours !== undefined ? Number(req.body.regular_hours) : Number(shift.regular_hours);
        const otHours =
            req.body?.overtime_hours !== undefined ? Number(req.body.overtime_hours) : Number(shift.overtime_hours);
        const isActive = req.body?.is_active !== undefined ? (Number(req.body.is_active) === 0 ? 0 : 1) : shift.is_active;

        if (!code || !name || !Number.isFinite(totalHours) || totalHours < 0 || totalHours > 24) {
            return res.status(400).json({ message: 'Thông tin ca trực không hợp lệ' });
        }

        await dbRun(
            'UPDATE shifts SET code = ?, name = ?, total_hours = ?, regular_hours = ?, overtime_hours = ?, is_active = ? WHERE id = ?',
            [code, name, totalHours, regHours, otHours, isActive, id]
        );
        res.json({ message: 'Đã cập nhật ca trực' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

exports.deleteShift = async (req, res) => {
    try {
        const id = parsePositiveInt(req.params.id);
        if (!id) {
            return res.status(400).json({ message: 'ID ca trực không hợp lệ' });
        }

        const shift = await dbGet('SELECT * FROM shifts WHERE id = ?', [id]);
        if (!shift) {
            return res.status(404).json({ message: 'Không tìm thấy ca trực' });
        }

        if (shift.user_id == null || Number(shift.user_id) !== Number(req.userId)) {
            return res.status(403).json({ message: 'Không thể xóa ca trực mặc định của hệ thống' });
        }

        const usageRow = await dbGet('SELECT COUNT(*) as count FROM work_schedules WHERE shift_id = ?', [id]);
        if (Number(usageRow?.count || 0) > 0) {
            await dbRun('UPDATE shifts SET is_active = 0 WHERE id = ? AND user_id = ?', [id, req.userId]);
            return res.json({
                message: `Đã ẩn ca riêng "${shift.code}" (các ngày đã chấm trước đó vẫn giữ nguyên)`,
                deactivated: true
            });
        }

        await dbRun('DELETE FROM shifts WHERE id = ? AND user_id = ?', [id, req.userId]);
        return res.json({ message: `Đã xóa ca riêng "${shift.code}"`, deleted: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Lỗi máy chủ khi xóa ca trực riêng' });
    }
};
