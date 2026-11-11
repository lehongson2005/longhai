const { dbRun, dbAll, dbGet } = require('../database/db');

exports.getExpenses = async (req, res) => {
    try {
        const { date, month, year } = req.query;
        let query = `
            SELECT e.*, c.name as category_name, c.icon as category_icon 
            FROM expenses e 
            LEFT JOIN expense_categories c ON e.category_id = c.id 
            WHERE e.user_id = ?
        `;
        let params = [req.userId];

        if (date) {
            query += ' AND e.expense_date = ?';
            params.push(date);
        } else if (month && year) {
            query += ' AND strftime("%m", e.expense_date) = ? AND strftime("%Y", e.expense_date) = ?';
            params.push(month.padStart(2, '0'), year);
        }

        query += ' ORDER BY e.expense_date DESC, e.created_at DESC';

        const expenses = await dbAll(query, params);
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createExpense = async (req, res) => {
    try {
        const { expense_date, amount, category_id, note } = req.body;
        
        if (amount <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than 0' });
        }

        const result = await dbRun(
            'INSERT INTO expenses (user_id, expense_date, amount, category_id, note) VALUES (?, ?, ?, ?, ?)',
            [req.userId, expense_date, amount, category_id, note]
        );
        res.status(201).json({ id: result.id, message: 'Expense created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const { expense_date, amount, category_id, note } = req.body;

        await dbRun(
            'UPDATE expenses SET expense_date = ?, amount = ?, category_id = ?, note = ? WHERE id = ? AND user_id = ?',
            [expense_date, amount, category_id, note, id, req.userId]
        );
        res.json({ message: 'Expense updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        await dbRun('DELETE FROM expenses WHERE id = ? AND user_id = ?', [id, req.userId]);
        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const categories = await dbAll('SELECT * FROM expense_categories WHERE user_id = ? OR user_id IS NULL', [req.userId]);
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
