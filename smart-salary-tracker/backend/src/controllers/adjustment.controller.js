const { dbRun, dbAll, getMonthDateRange } = require('../database/db');

const VALID_TYPES = ['ALLOWANCE', 'DEDUCTION'];

exports.getAdjustments = async (req, res) => {
    try {
        const { month, year } = req.query;
        let query = 'SELECT * FROM salary_adjustments WHERE user_id = ?';
        const params = [req.userId];

        if (month && year) {
            let range;
            try {
                range = getMonthDateRange(month, year);
            } catch {
                return res.status(400).json({ message: 'Tháng hoặc năm không hợp lệ' });
            }
            query += ' AND adjustment_date >= ? AND adjustment_date < ?';
            params.push(range.start, range.endExclusive);
        }

        query += ' ORDER BY adjustment_date DESC, id DESC';
        const rows = await dbAll(query, params);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi tải danh sách phụ cấp & khấu trừ' });
    }
};

exports.createAdjustment = async (req, res) => {
    try {
        const { adjustment_date, type, title, amount, note = '' } = req.body;
        const cleanType = String(type || '').trim().toUpperCase();
        const cleanTitle = String(title || '').trim();
        const parsedAmount = Number(amount);

        if (!VALID_TYPES.includes(cleanType)) {
            return res.status(400).json({ message: 'Loại điều chỉnh phải là Phụ cấp hoặc Tạm ứng/Khấu trừ' });
        }
        if (!cleanTitle) {
            return res.status(400).json({ message: 'Vui lòng nhập tên khoản phụ cấp hoặc khấu trừ' });
        }
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ message: 'Số tiền phải lớn hơn 0' });
        }
        if (!adjustment_date || !/^\d{4}-\d{2}-\d{2}$/.test(String(adjustment_date))) {
            return res.status(400).json({ message: 'Ngày áp dụng không hợp lệ' });
        }

        const result = await dbRun(
            'INSERT INTO salary_adjustments (user_id, adjustment_date, type, title, amount, note) VALUES (?, ?, ?, ?, ?, ?)',
            [req.userId, adjustment_date, cleanType, cleanTitle, parsedAmount, String(note || '').trim()]
        );

        res.status(201).json({
            id: result.id,
            message:
                cleanType === 'ALLOWANCE'
                    ? `Đã thêm phụ cấp "${cleanTitle}" thành công!`
                    : `Đã ghi khoản tạm ứng/khấu trừ "${cleanTitle}" thành công!`
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi lưu phụ cấp/khấu trừ' });
    }
};

exports.deleteAdjustment = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await dbRun('DELETE FROM salary_adjustments WHERE id = ? AND user_id = ?', [id, req.userId]);
        if (result.changes === 0) {
            return res.status(404).json({ message: 'Không tìm thấy khoản cần xóa' });
        }
        res.json({ message: 'Đã xóa khoản điều chỉnh lương!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi xóa khoản điều chỉnh' });
    }
};
