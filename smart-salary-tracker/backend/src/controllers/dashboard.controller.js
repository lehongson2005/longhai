const { dbAll, dbGet } = require('../database/db');
const { calculateShiftSalary } = require('../utils/salaryCalculator');

exports.getDashboardData = async (req, res) => {
    try {
        const { date } = req.query; // YYYY-MM-DD format expected for today
        if (!date) return res.status(400).json({ message: 'Date is required' });

        const [year, month, day] = date.split('-');

        // Get user settings
        const settings = await dbGet('SELECT * FROM salary_settings WHERE user_id = ?', [req.userId]);

        // Today Income
        const todaySchedule = await dbGet(`
            SELECT ws.*, s.total_hours, s.code
            FROM work_schedules ws
            JOIN shifts s ON ws.shift_id = s.id
            WHERE ws.user_id = ? AND ws.work_date = ?
        `, [req.userId, date]);

        let todayIncome = 0;
        if (todaySchedule && settings) {
            const result = calculateShiftSalary(todaySchedule, todaySchedule.day_type, settings);
            todayIncome = result.salary;
        }

        // Today Expense
        const todayExpRow = await dbGet('SELECT SUM(amount) as total FROM expenses WHERE user_id = ? AND expense_date = ?', [req.userId, date]);
        const todayExpense = todayExpRow.total || 0;
        const todayBalance = todayIncome - todayExpense;

        // Month Income
        const monthSchedules = await dbAll(`
            SELECT ws.*, s.total_hours
            FROM work_schedules ws
            JOIN shifts s ON ws.shift_id = s.id
            WHERE ws.user_id = ? AND strftime("%m", ws.work_date) = ? AND strftime("%Y", ws.work_date) = ?
        `, [req.userId, month.padStart(2, '0'), year]);

        let monthIncome = 0;
        if (settings) {
            monthSchedules.forEach(sch => {
                const res = calculateShiftSalary(sch, sch.day_type, settings);
                monthIncome += res.salary;
            });
        }

        // Month Expense
        const monthExpRow = await dbGet(`
            SELECT SUM(amount) as total 
            FROM expenses 
            WHERE user_id = ? AND strftime("%m", expense_date) = ? AND strftime("%Y", expense_date) = ?
        `, [req.userId, month.padStart(2, '0'), year]);
        const monthExpense = monthExpRow.total || 0;
        const monthBalance = monthIncome - monthExpense;

        const monthlySavingsRate = monthIncome > 0 ? ((monthBalance / monthIncome) * 100).toFixed(1) : 0;

        res.json({
            today: {
                income: todayIncome,
                expense: todayExpense,
                balance: todayBalance,
                schedule: todaySchedule || null
            },
            month: {
                income: monthIncome,
                expense: monthExpense,
                balance: monthBalance,
                savingsRate: monthlySavingsRate
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
