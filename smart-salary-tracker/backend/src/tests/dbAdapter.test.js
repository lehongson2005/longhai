const { convertPlaceholders, getMonthDateRange, shouldUseSsl, getStorageInfo } = require('../database/db');

describe('Database dual-driver utilities & date ranges', () => {
    test('converts ? placeholders to $1, $2... while ignoring quoted question marks', () => {
        const sql = "SELECT * FROM users WHERE username = ? AND note != 'why?' AND role = ?";
        expect(convertPlaceholders(sql)).toBe(
            "SELECT * FROM users WHERE username = $1 AND note != 'why?' AND role = $2"
        );
    });

    test('computes inclusive-exclusive month date ranges cleanly across year rollover', () => {
        expect(getMonthDateRange(2, 2026)).toEqual({
            start: '2026-02-01',
            endExclusive: '2026-03-01'
        });
        expect(getMonthDateRange('12', '2026')).toEqual({
            start: '2026-12-01',
            endExclusive: '2027-01-01'
        });
    });

    test('configures SSL automatically for hosted Postgres and disables for localhost', () => {
        expect(shouldUseSsl('postgres://user:pass@localhost:5432/longhai')).toBe(false);
        expect(shouldUseSsl('postgres://user:pass@ep-cool.ap-southeast-1.aws.neon.tech/neondb?sslmode=require')).toEqual({
            rejectUnauthorized: false
        });
        expect(shouldUseSsl('postgres://user:pass@remote:5432/db?sslmode=disable')).toBe(false);
    });

    test('reports sqlite non-persistent storage by default when DATABASE_URL is unset', () => {
        expect(getStorageInfo()).toEqual({ driver: 'sqlite', persistent: false });
    });
});
