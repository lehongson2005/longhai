const { dbRun, dbAll, dbGet, getMonthDateRange } = require('../database/db');

async function resolveCategoryId(rawCategoryId, userId) {
    if (rawCategoryId === undefined || rawCategoryId === null || String(rawCategoryId).trim() === '') {
        return null;
    }
    const parsedId = Number(rawCategoryId);
    if (!Number.isInteger(parsedId)) {
        return null;
    }
    const cat = await dbGet('SELECT id FROM expense_categories WHERE id = ? AND (user_id = ? OR user_id IS NULL)', [
        parsedId,
        userId
    ]);
    return cat ? cat.id : null;
}

exports.getExpenses = async (req, res) => {
    try {
        const { date, month, year } = req.query;
        let query = `
            SELECT e.*, COALESCE(c.name, 'Khác') as category_name, COALESCE(c.icon, '') as category_icon
            FROM expenses e
            LEFT JOIN expense_categories c ON e.category_id = c.id
            WHERE e.user_id = ?
        `;
        const params = [req.userId];

        if (date) {
            query += ' AND e.expense_date = ?';
            params.push(date);
        } else if (month && year) {
            let range;
            try {
                range = getMonthDateRange(month, year);
            } catch {
                return res.status(400).json({ message: 'Tháng hoặc năm không hợp lệ' });
            }
            query += ' AND e.expense_date >= ? AND e.expense_date < ?';
            params.push(range.start, range.endExclusive);
        }

        query += ' ORDER BY e.expense_date DESC, e.id DESC';

        const expenses = await dbAll(query, params);
        res.json(expenses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi tải danh sách chi tiêu' });
    }
};

exports.createExpense = async (req, res) => {
    try {
        const { expense_date, amount, category_id, note = '' } = req.body;
        const parsedAmount = Number(amount);

        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ message: 'Số tiền chi tiêu phải lớn hơn 0' });
        }
        if (!expense_date || !/^\d{4}-\d{2}-\d{2}$/.test(String(expense_date))) {
            return res.status(400).json({ message: 'Ngày chi tiêu không hợp lệ' });
        }

        const resolvedCategoryId = await resolveCategoryId(category_id, req.userId);

        const result = await dbRun(
            'INSERT INTO expenses (user_id, expense_date, amount, category_id, note) VALUES (?, ?, ?, ?, ?)',
            [req.userId, expense_date, parsedAmount, resolvedCategoryId, String(note || '').trim()]
        );

        res.status(201).json({
            id: result.id,
            message: 'Đã lưu khoản chi tiêu thành công!'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi lưu chi tiêu' });
    }
};

exports.updateExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const { expense_date, amount, category_id, note = '' } = req.body;
        const parsedAmount = Number(amount);

        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ message: 'Số tiền chi tiêu phải lớn hơn 0' });
        }
        if (!expense_date || !/^\d{4}-\d{2}-\d{2}$/.test(String(expense_date))) {
            return res.status(400).json({ message: 'Ngày chi tiêu không hợp lệ' });
        }

        const resolvedCategoryId = await resolveCategoryId(category_id, req.userId);

        const result = await dbRun(
            'UPDATE expenses SET expense_date = ?, amount = ?, category_id = ?, note = ? WHERE id = ? AND user_id = ?',
            [expense_date, parsedAmount, resolvedCategoryId, String(note || '').trim(), id, req.userId]
        );

        if (result.changes === 0) {
            return res.status(404).json({ message: 'Không tìm thấy khoản chi tiêu' });
        }

        res.json({ message: 'Đã cập nhật khoản chi tiêu!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật chi tiêu' });
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await dbRun('DELETE FROM expenses WHERE id = ? AND user_id = ?', [id, req.userId]);
        if (result.changes === 0) {
            return res.status(404).json({ message: 'Không tìm thấy khoản chi tiêu' });
        }
        res.json({ message: 'Đã xóa khoản chi tiêu!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi xóa chi tiêu' });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const categories = await dbAll('SELECT * FROM expense_categories WHERE user_id = ? OR user_id IS NULL ORDER BY id ASC', [
            req.userId
        ]);
        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi tải danh mục chi tiêu' });
    }
};
