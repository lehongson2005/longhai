const { dbRun, dbGet } = require('../database/db');

exports.getSettings = async (req, res) => {
    try {
        const settings = await dbGet('SELECT * FROM salary_settings WHERE user_id = ?', [req.userId]);
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const { base_salary, standard_work_days, standard_hour_rate, overtime_rate, weekly_off_rate, holiday_rate } = req.body;
        
        await dbRun(
            'UPDATE salary_settings SET base_salary = ?, standard_work_days = ?, standard_hour_rate = ?, overtime_rate = ?, weekly_off_rate = ?, holiday_rate = ? WHERE user_id = ?',
            [base_salary, standard_work_days, standard_hour_rate, overtime_rate, weekly_off_rate, holiday_rate, req.userId]
        );
        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
