const path = require('path');
const fs = require('fs');
const os = require('os');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

describe('Legacy database upgrade (email NOT NULL + old shifts without B1/B2)', () => {
    const legacyDbPath = path.join(os.tmpdir(), `longhai_legacy_${Date.now()}.sqlite`);

    beforeAll(async () => {
        const legacyDb = new sqlite3.Database(legacyDbPath);
        const execSql = (sql) =>
            new Promise((resolve, reject) => legacyDb.exec(sql, (err) => (err ? reject(err) : resolve())));
        const runSql = (sql, params = []) =>
            new Promise((resolve, reject) => legacyDb.run(sql, params, (err) => (err ? reject(err) : resolve())));

        await execSql(`
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                employee_code TEXT UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'employee',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE shifts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                code TEXT NOT NULL,
                name TEXT NOT NULL,
                total_hours REAL NOT NULL,
                regular_hours REAL NOT NULL,
                overtime_hours REAL NOT NULL,
                is_active INTEGER DEFAULT 1
            );
            CREATE TABLE salary_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                base_salary REAL,
                standard_work_days REAL,
                standard_hour_rate REAL,
                overtime_rate REAL,
                weekly_off_rate REAL,
                holiday_rate REAL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        `);

        const passHash = await bcrypt.hash('123456', 10);
        await runSql(
            "INSERT INTO users (name, email, employee_code, password_hash, role) VALUES ('Old Guard', 'nhanvien@securitaslonghai.vn', 'LH-OLD', ?, 'employee')",
            [passHash]
        );
        await runSql(
            'INSERT INTO salary_settings (user_id, base_salary, standard_work_days, standard_hour_rate, overtime_rate, weekly_off_rate, holiday_rate) VALUES (1, 5310000, 26, 25529, 38293, 51058, 2)'
        );
        await runSql("INSERT INTO shifts (code, name, total_hours, regular_hours, overtime_hours) VALUES ('A', 'Ca A', 8, 8, 0)");

        await new Promise((resolve) => legacyDb.close(() => resolve()));
    });

    afterAll(() => {
        if (fs.existsSync(legacyDbPath)) {
            fs.unlinkSync(legacyDbPath);
        }
    });

    test('upgrades legacy DB cleanly, preserves old user + adds B1/B2 shifts & username support', async () => {
        jest.resetModules();
        process.env.DB_PATH = legacyDbPath;
        const { db, dbAll, dbGet, ready } = require('../database/db');

        await ready();

        const cols = await dbAll('PRAGMA table_info(users)');
        const emailCol = cols.find((c) => c.name === 'email');
        const usernameCol = cols.find((c) => c.name === 'username');
        expect(usernameCol).toBeTruthy();
        expect(emailCol.notnull).toBe(0);

        const oldGuard = await dbGet('SELECT * FROM users WHERE email = ?', ['nhanvien@securitaslonghai.vn']);
        expect(oldGuard).toBeTruthy();
        expect(oldGuard.username).toBe('nv1');

        const shifts = await dbAll('SELECT * FROM shifts WHERE user_id IS NULL');
        const codes = shifts.map((s) => s.code);
        expect(codes).toEqual(expect.arrayContaining(['A', 'B1', 'B2']));

        await new Promise((resolve) => db.close(() => resolve()));
    });
});
