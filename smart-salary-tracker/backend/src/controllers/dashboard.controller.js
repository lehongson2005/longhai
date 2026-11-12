const { dbAll, dbGet } = require('../database/db');
const { calculateShiftSalary } = require('../utils/salaryCalculator');

exports.getDashboardData = async (req, res) => {
    try {
        const { date, month: queryMonth, year: queryYear } = req.query;
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
            return res.status(400).json({ message: 'Tham số ngày (YYYY-MM-DD) không hợp lệ' });
        }

        const [dateYear, dateMonth] = date.split('-');
        const targetYear = queryYear ? String(queryYear) : dateYear;
        const targetMonth = queryMonth ? String(queryMonth).padStart(2, '0') : dateMonth.padStart(2, '0');

        const settingsRow = await dbGet('SELECT * FROM salary_settings WHERE user_id = ?', [req.userId]);
        const settings = settingsRow || {
            base_salary: 5310000,
            standard_work_days: 26,
            standard_hour_rate: 25529,
            overtime_rate: 38293,
            weekly_off_rate: 51058,
            holiday_rate: 2
        };

        // Today stats
        const todaySchedule = await dbGet(
            `SELECT ws.*, s.total_hours, s.code, s.name as shift_name
             FROM work_schedules ws
             JOIN shifts s ON ws.shift_id = s.id
             WHERE ws.user_id = ? AND ws.work_date = ?`,
            [req.userId, date]
        );

        let todayIncome = 0;
        if (todaySchedule) {
            const result = calculateShiftSalary(todaySchedule, todaySchedule.day_type, settings);
            todayIncome = Math.round(result.salary);
        }

        const todayExpRow = await dbGet(
            'SELECT SUM(amount) as total FROM expenses WHERE user_id = ? AND expense_date = ?',
            [req.userId, date]
        );
        const todayExpense = todayExpRow?.total || 0;
        const todayBalance = todayIncome - todayExpense;

        // Month stats
        const monthSchedules = await dbAll(
            `SELECT ws.*, s.total_hours, s.code, s.name as shift_name
             FROM work_schedules ws
             JOIN shifts s ON ws.shift_id = s.id
             WHERE ws.user_id = ? AND strftime("%m", ws.work_date) = ? AND strftime("%Y", ws.work_date) = ?`,
            [req.userId, targetMonth, targetYear]
        );

        let monthIncome = 0;
        let totalHours = 0;
        let regularHours = 0;
        let overtimeHours = 0;
        let workDays = 0;
        const shiftCountMap = {};

        monthSchedules.forEach((sch) => {
            const calc = calculateShiftSalary(sch, sch.day_type, settings);
            monthIncome += calc.salary;
            totalHours += Number(sch.total_hours) || 0;
            regularHours += calc.regularHours || 0;
            overtimeHours += calc.overtimeHours || 0;
            if ((Number(sch.total_hours) || 0) > 0) {
                workDays += 1;
            }
            if (!shiftCountMap[sch.code]) {
                shiftCountMap[sch.code] = { code: sch.code, count: 0, hours: 0 };
            }
            shiftCountMap[sch.code].count += 1;
            shiftCountMap[sch.code].hours += Number(sch.total_hours) || 0;
        });

        monthIncome = Math.round(monthIncome);

        const monthExpRow = await dbGet(
            `SELECT SUM(amount) as total
             FROM expenses
             WHERE user_id = ? AND strftime("%m", expense_date) = ? AND strftime("%Y", expense_date) = ?`,
            [req.userId, targetMonth, targetYear]
        );
        const monthExpense = monthExpRow?.total || 0;
        const monthBalance = monthIncome - monthExpense;
        const monthlySavingsRate = monthIncome > 0 ? Number(((monthBalance / monthIncome) * 100).toFixed(1)) : 0;

        const expenseBreakdown = await dbAll(
            `SELECT COALESCE(c.name, 'Khác') as category_name, SUM(e.amount) as total
             FROM expenses e
             LEFT JOIN expense_categories c ON e.category_id = c.id
             WHERE e.user_id = ? AND strftime("%m", e.expense_date) = ? AND strftime("%Y", e.expense_date) = ?
             GROUP BY COALESCE(c.name, 'Khác')
             ORDER BY total DESC`,
            [req.userId, targetMonth, targetYear]
        );

        res.json({
            period: {
                month: Number(targetMonth),
                year: Number(targetYear)
            },
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
                savingsRate: monthlySavingsRate,
                workDays,
                totalHours,
                regularHours,
                overtimeHours,
                shiftBreakdown: Object.values(shiftCountMap),
                expenseBreakdown
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi tải tổng quan lương' });
    }
};
