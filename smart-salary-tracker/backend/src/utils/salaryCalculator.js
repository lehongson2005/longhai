// salaryCalculator.js

/**
 * Normal day: 8 hours = regular
 * if > 8 hours, extra hours are overtime at 1.5x (150%)
 */
const calculateNormalDay = (hours, standardHourRate) => {
    let regularHours = Math.min(8, hours);
    let overtimeHours = Math.max(0, hours - 8);
    let salary = (regularHours * standardHourRate) + (overtimeHours * standardHourRate * 1.5);
    return { regularHours, overtimeHours, salary };
};

/**
 * Weekly Off (Sunday/Rest day): usually 2.0x (200%) for all hours
 */
const calculateWeeklyOff = (hours, standardHourRate, weeklyOffRateMultiplier = 2) => {
    let regularHours = 0; // Or treat all as OT? Let's just track total hours and salary
    let overtimeHours = hours; 
    let salary = (hours * standardHourRate * weeklyOffRateMultiplier);
    return { regularHours, overtimeHours, salary };
};

/**
 * Holiday: 8 hours at 2.0x (200%), beyond 8 hours at 3.0x (300%)
 */
const calculateHoliday = (hours, standardHourRate) => {
    let regularHours = 0;
    let overtimeHours = hours;
    let first8 = Math.min(8, hours);
    let beyond8 = Math.max(0, hours - 8);
    let salary = (first8 * standardHourRate * 2) + (beyond8 * standardHourRate * 3);
    return { regularHours, overtimeHours, salary };
};

const calculateShiftSalary = (shift, dayType, settings) => {
    const hours = shift.total_hours;
    const rate = settings.standard_hour_rate;

    switch (dayType) {
        case 'NORMAL':
            return calculateNormalDay(hours, rate);
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
