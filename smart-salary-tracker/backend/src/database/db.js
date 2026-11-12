const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

const dbPath = process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH)
    : path.resolve(__dirname, '../../database.sqlite');
const schemaPath = path.resolve(__dirname, 'schema.sql');

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

const DEFAULT_EXPENSE_CATEGORIES = ['Ăn uống', 'Di chuyển', 'Nhà ở', 'Mua sắm', 'Giải trí', 'Khác'];

const dbRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID, changes: this.changes });
            }
        });
    });
};

const dbGet = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

const dbAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

const dbExec = (sql) => {
    return new Promise((resolve, reject) => {
        db.exec(sql, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

async function ensureUserDefaults(userId) {
    const existingSettings = await dbGet('SELECT id FROM salary_settings WHERE user_id = ?', [userId]);
    if (!existingSettings) {
        await dbRun(
            'INSERT INTO salary_settings (user_id, base_salary, standard_work_days, standard_hour_rate, overtime_rate, weekly_off_rate, holiday_rate) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, 5310000, 26, 25529, 38293, 51058, 2]
        );
    }

    const existingCats = await dbGet('SELECT COUNT(*) as count FROM expense_categories WHERE user_id = ?', [userId]);
    if (!existingCats || existingCats.count === 0) {
        for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
            await dbRun('INSERT INTO expense_categories (user_id, name, icon) VALUES (?, ?, ?)', [userId, cat, '']);
        }
    }
}

async function migrateUsersTable() {
    const userCols = await dbAll('PRAGMA table_info(users)');
    const hasRole = userCols.some((col) => col.name === 'role');
    if (!hasRole) {
        await dbRun("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'employee'");
    }

    const hasUsername = userCols.some((col) => col.name === 'username');
    if (!hasUsername) {
        await dbRun('ALTER TABLE users ADD COLUMN username TEXT');
    }

    const emailCol = userCols.find((col) => col.name === 'email');
    if (emailCol && emailCol.notnull === 1) {
        await dbRun('PRAGMA foreign_keys = OFF');
        try {
            await dbExec(`
                BEGIN TRANSACTION;
                CREATE TABLE users_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    username TEXT UNIQUE,
                    email TEXT UNIQUE,
                    employee_code TEXT UNIQUE,
                    password_hash TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'employee',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
                INSERT INTO users_new (id, name, username, email, employee_code, password_hash, role, created_at, updated_at)
                SELECT id, name, username, email, employee_code, password_hash, role, created_at, updated_at FROM users;
                DROP TABLE users;
                ALTER TABLE users_new RENAME TO users;
                COMMIT;
            `);
        } finally {
            await dbRun('PRAGMA foreign_keys = ON');
        }
    }

    await dbRun('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)');
}

async function seedShifts() {
    const shifts = [
        { code: 'B1', name: 'Ca B1', hours: 4, reg: 4, ot: 0 },
        { code: 'B2', name: 'Ca B2', hours: 4, reg: 4, ot: 0 },
        { code: 'A', name: 'Ca A', hours: 8, reg: 8, ot: 0 },
        { code: 'B', name: 'Ca B', hours: 8, reg: 8, ot: 0 },
        { code: 'C', name: 'Ca C', hours: 8, reg: 8, ot: 0 },
        { code: 'A1', name: 'Ca A1', hours: 12, reg: 8, ot: 4 },
        { code: 'C1', name: 'Ca C1', hours: 12, reg: 8, ot: 4 },
        { code: 'AB', name: 'Ca AB', hours: 16, reg: 8, ot: 8 },
        { code: 'H', name: 'Ca H', hours: 12, reg: 8, ot: 4 },
        { code: 'R', name: 'Ca R', hours: 12, reg: 8, ot: 4 },
        { code: 'Nghỉ', name: 'Nghỉ', hours: 0, reg: 0, ot: 0 }
    ];

    for (const s of shifts) {
        const existing = await dbGet('SELECT id FROM shifts WHERE user_id IS NULL AND code = ?', [s.code]);
        if (!existing) {
            await dbRun(
                'INSERT INTO shifts (code, name, total_hours, regular_hours, overtime_hours) VALUES (?, ?, ?, ?, ?)',
                [s.code, s.name, s.hours, s.reg, s.ot]
            );
        }
    }
}

async function seedDemoUsers() {
    const demoAccounts = [
        {
            name: 'Quản trị viên (Admin)',
            username: 'admin',
            email: 'admin@longhai.vn',
            legacyEmail: 'admin@securitaslonghai.vn',
            employee_code: 'ADMIN',
            password: process.env.DEMO_ADMIN_PASSWORD || 'admin123',
            role: 'admin'
        },
        {
            name: 'Nguyễn Văn Bảo',
            username: 'nv1',
            email: 'nv1@longhai.vn',
            legacyEmail: 'nhanvien@securitaslonghai.vn',
            employee_code: 'NV001',
            password: process.env.DEMO_EMPLOYEE_PASSWORD || '123456',
            role: 'employee'
        }
    ];

    for (const acc of demoAccounts) {
        let user = await dbGet(
            'SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ? OR LOWER(email) = ?',
            [acc.username, acc.email, acc.legacyEmail]
        );
        if (!user) {
            const password_hash = await bcrypt.hash(acc.password, 10);
            const res = await dbRun(
                'INSERT INTO users (name, username, email, employee_code, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)',
                [acc.name, acc.username, acc.email, acc.employee_code, password_hash, acc.role]
            );
            user = { id: res.id };
        } else if (!user.username) {
            const clash = await dbGet('SELECT id FROM users WHERE LOWER(username) = ? AND id != ?', [acc.username, user.id]);
            if (!clash) {
                await dbRun('UPDATE users SET username = ? WHERE id = ?', [acc.username, user.id]);
            }
        }

        await ensureUserDefaults(user.id);
    }
}

async function initializeDatabase() {
    await dbRun('PRAGMA foreign_keys = ON');
    await dbRun('PRAGMA busy_timeout = 5000');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await dbExec(schema);

    await migrateUsersTable();
    await seedShifts();
    await seedDemoUsers();
}

const initPromise = initializeDatabase().catch((err) => {
    console.error('Database initialization error:', err);
    throw err;
});

const ready = () => initPromise;

module.exports = {
    db,
    dbRun,
    dbGet,
    dbAll,
    dbExec,
    ready,
    ensureUserDefaults,
    DEFAULT_EXPENSE_CATEGORIES
};
