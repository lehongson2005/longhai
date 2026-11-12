const {
    calculateNormalDay,
    calculateHoliday,
    calculateWeeklyOff,
    calculateShiftSalary
} = require('./salaryCalculator');

describe('Salary Calculator Tests', () => {
    const rate = 25529; // ~ 204,231 / 8

    test('Calculate B1/B2 ngày thường (4h)', () => {
        const res = calculateShiftSalary({ total_hours: 4 }, 'NORMAL', { standard_hour_rate: rate });
        expect(res.regularHours).toBe(4);
        expect(res.overtimeHours).toBe(0);
        expect(Math.round(res.salary)).toBe(102116); // 4 * 25529
    });

    test('Calculate B1/B2 Chủ Nhật (4h * 200%)', () => {
        const res = calculateShiftSalary({ total_hours: 4 }, 'WEEKLY_OFF', { standard_hour_rate: rate });
        expect(Math.round(res.salary)).toBe(204232); // 4 * 25529 * 2
    });

    test('Calculate B1/B2 Ngày Lễ (4h * 200%)', () => {
        const res = calculateShiftSalary({ total_hours: 4 }, 'HOLIDAY', { standard_hour_rate: rate });
        expect(Math.round(res.salary)).toBe(204232); // 4 * 25529 * 2
    });

    test('Calculate A ngày thường (8h)', () => {
        const res = calculateNormalDay(8, rate);
        expect(res.regularHours).toBe(8);
        expect(res.overtimeHours).toBe(0);
        expect(Math.round(res.salary)).toBe(204232); // 8 * 25529
    });

    test('Calculate A1 ngày thường (12h)', () => {
        const res = calculateNormalDay(12, rate);
        expect(res.regularHours).toBe(8);
        expect(res.overtimeHours).toBe(4);
        expect(Math.round(res.salary)).toBe(357406); // 8 * rate + 4 * rate * 1.5
    });

    test('Calculate AB ngày thường (16h)', () => {
        const res = calculateNormalDay(16, rate);
        expect(res.regularHours).toBe(8);
        expect(res.overtimeHours).toBe(8);
        expect(Math.round(res.salary)).toBe(510580);
    });

    test('Calculate Chủ Nhật (200%) cho ca A (8h)', () => {
        const res = calculateWeeklyOff(8, rate);
        expect(Math.round(res.salary)).toBe(408464);
    });

    test('Calculate Chủ Nhật cho ca 12h', () => {
        const res = calculateWeeklyOff(12, rate);
        expect(Math.round(res.salary)).toBe(612696);
    });

    test('Calculate Ngày Lễ cho ca A (8h)', () => {
        const res = calculateHoliday(8, rate);
        expect(Math.round(res.salary)).toBe(408464);
    });

    test('Calculate Ngày Lễ cho ca 12h (8h 200%, 4h 300%)', () => {
        const res = calculateHoliday(12, rate);
        expect(Math.round(res.salary)).toBe(714812); // 8 * 25529 * 2 + 4 * 25529 * 3
    });
});
