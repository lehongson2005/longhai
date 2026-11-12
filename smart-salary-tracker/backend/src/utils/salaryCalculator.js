// salaryCalculator.js

/**
 * Normal day: 8 hours = regular
 * if > 8 hours, extra hours use overtimeRate (defaults to 1.5x standardHourRate)
 */
const calculateNormalDay = (hours, standardHourRate, overtimeRate = null) => {
    const regularHours = Math.min(8, hours);
    const overtimeHours = Math.max(0, hours - 8);
    const otRate = Number(overtimeRate) > 0 ? Number(overtimeRate) : standardHourRate * 1.5;
    const salary = (regularHours * standardHourRate) + (overtimeHours * otRate);
    return { regularHours, overtimeHours, salary };
};

/**
 * Weekly Off (Sunday/Rest day): 2.0x (200%) for all hours
 */
const calculateWeeklyOff = (hours, standardHourRate, weeklyOffRateMultiplier = 2) => {
    const regularHours = 0;
    const overtimeHours = hours;
    const salary = hours * standardHourRate * weeklyOffRateMultiplier;
    return { regularHours, overtimeHours, salary };
};

/**
 * Holiday: 8 hours at 2.0x (200%), beyond 8 hours at 3.0x (300%)
 */
const calculateHoliday = (hours, standardHourRate) => {
    const regularHours = 0;
    const overtimeHours = hours;
    const first8 = Math.min(8, hours);
    const beyond8 = Math.max(0, hours - 8);
    const salary = (first8 * standardHourRate * 2) + (beyond8 * standardHourRate * 3);
    return { regularHours, overtimeHours, salary };
};

const calculateShiftSalary = (shift, dayType, settings) => {
    const hours = Number(shift?.total_hours) || 0;
    const rate = Number(settings?.standard_hour_rate) || 0;
    const customOtRate = Number(settings?.overtime_rate) || null;

    switch (dayType) {
        case 'NORMAL':
            return calculateNormalDay(hours, rate, customOtRate);
        case 'WEEKLY_OFF':
            return calculateWeeklyOff(hours, rate, 2);
        case 'HOLIDAY':
            return calculateHoliday(hours, rate);
        default:
            return { regularHours: hours, overtimeHours: 0, salary: 0 };
    }
};

module.exports = {
    calculateNormalDay,
    calculateWeeklyOff,
    calculateHoliday,
    calculateShiftSalary
};
