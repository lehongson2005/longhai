const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

const databaseUrl = process.env.DATABASE_URL ? process.env.DATABASE_URL.trim() : '';
const isPostgres = Boolean(databaseUrl);

const DEFAULT_EXPENSE_CATEGORIES = ['Ăn uống', 'Di chuyển', 'Nhà ở', 'Mua sắm', 'Giải trí', 'Khác'];

function shouldUseSsl(url) {
    if (!url) return false;
    const lower = url.toLowerCase();
    if (lower.includes('sslmode=disable') || lower.includes('localhost') || lower.includes('127.0.0.1')) {
        return false;
    }
    return { rejectUnauthorized: false };
}

function normalizePgConnectionString(url) {
    const trimmed = String(url || '').trim();
    if (!trimmed || !shouldUseSsl(trimmed)) {
        return trimmed;
    }
    try {
        const parsed = new URL(trimmed);
        const mode = (parsed.searchParams.get('sslmode') || '').toLowerCase();
        const libpqCompat = (parsed.searchParams.get('uselibpqcompat') || '').toLowerCase() === 'true';
        if (!libpqCompat && mode !== 'verify-full') {
            parsed.searchParams.set('sslmode', 'no-verify');
        }
        return parsed.toString();
    } catch {
        return trimmed;
    }
}

function parsePositiveInt(value) {
    if (value === undefined || value === null || value === '') return null;
    const num = Number(value);
    if (!Number.isSafeInteger(num) || num <= 0) return null;
    return num;
}

function convertPlaceholders(sql) {
    let out = '';
    let paramIndex = 0;
    let inSingleQuote = false;

    for (let i = 0; i < sql.length; i += 1) {
        const ch = sql[i];
        if (ch === "'") {
            out += ch;
            if (inSingleQuote && sql[i + 1] === "'") {
                out += "'";
                i += 1;
            } else {
                inSingleQuote = !inSingleQuote;
            }
        } else if (ch === '?' && !inSingleQuote) {
            paramIndex += 1;
            out += `$${paramIndex}`;
        } else {
            out += ch;
        }
    }
    return out;
}

function getMonthDateRange(month, year) {
    const m = Number(month);
    const y = Number(year);
    if (!Number.isInteger(m) || m < 1 || m > 12 || !Number.isInteger(y) || y < 1900) {
        throw new Error('Tháng hoặc năm không hợp lệ');
    }
    const start = `${y}-${String(m).padStart(2, '0')}-01`;
    const nextYear = m === 12 ? y + 1 : y;
    const nextMonth = m === 12 ? 1 : m + 1;
    const endExclusive = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    return { start, endExclusive };
}

let db;
let pool = null;

if (isPostgres) {
    const { Pool } = require('pg');
    const normalizedUrl = normalizePgConnectionString(databaseUrl);
    pool = new Pool({
        connectionString: normalizedUrl,
        ssl: shouldUseSsl(normalizedUrl),
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 15000
    });
    pool.on('error', (err) => {
        console.error('PostgreSQL pool idle client error:', err.message);
    });
    db = {
        isPostgres: true,
        close: (cb) => {
            pool.end()
                .then(() => {
                    if (typeof cb === 'function') cb(null);
                })
                .catch((err) => {
                    if (typeof cb === 'function') cb(err);
                });
        }
    };
} else {
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = process.env.DB_PATH
        ? path.resolve(process.env.DB_PATH)
        : path.resolve(__dirname, '../../database.sqlite');
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }
    db = new sqlite3.Database(dbPath);
}

const schemaPath = path.resolve(__dirname, isPostgres ? 'schema.pg.sql' : 'schema.sql');

const dbRun = (sql, params = []) => {
    if (isPostgres) {
        let pgSql = convertPlaceholders(sql.trim());
        const isInsert = /^\s*INSERT\s+/i.test(pgSql);
        if (isInsert && !/\bRETURNING\b/i.test(pgSql)) {
            pgSql = `${pgSql.replace(/;+$/, '')} RETURNING id`;
        }
        return pool.query(pgSql, params).then((res) => ({
            id: isInsert && res.rows && res.rows[0] ? res.rows[0].id : null,
            changes: res.rowCount || 0
        }));
    }

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
    if (isPostgres) {
        const pgSql = convertPlaceholders(sql);
        return pool.query(pgSql, params).then((res) => res.rows[0] || undefined);
    }

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
    if (isPostgres) {
        const pgSql = convertPlaceholders(sql);
        return pool.query(pgSql, params).then((res) => res.rows);
    }

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
    if (isPostgres) {
        return pool.query(sql).then(() => undefined);
    }

    return new Promise((resolve, reject) => {
        db.exec(sql, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

function getStorageInfo() {
    return {
        driver: isPostgres ? 'postgres' : 'sqlite',
        persistent: isPostgres || process.env.PERSISTENT_DISK === 'true'
    };
}

async function ensureUserDefaults(userId) {
    const [existingSettings, existingCats] = await Promise.all([
        dbGet('SELECT id FROM salary_settings WHERE user_id = ?', [userId]),
        dbGet('SELECT COUNT(*) as count FROM expense_categories WHERE user_id = ?', [userId])
    ]);

    const tasks = [];
    if (!existingSettings) {
        tasks.push(
            dbRun(
                'INSERT INTO salary_settings (user_id, base_salary, standard_work_days, standard_hour_rate, overtime_rate, weekly_off_rate, holiday_rate) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [userId, 5310000, 26, 25529, 38293, 51058, 2]
            )
        );
    }

    if (!existingCats || Number(existingCats.count || 0) === 0) {
        for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
            tasks.push(dbRun('INSERT INTO expense_categories (user_id, name, icon) VALUES (?, ?, ?)', [userId, cat, '']));
        }
    }

    if (tasks.length > 0) {
        await Promise.all(tasks);
    }
}

async function migrateUsersTable() {
    if (isPostgres) {
        await dbRun('ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT');
        await dbRun("ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'employee'");
        try {
            await dbRun('ALTER TABLE users ALTER COLUMN email DROP NOT NULL');
        } catch {
            // email already nullable
        }
        await dbRun('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)');
        return;
    }

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

    const existingRows = await dbAll('SELECT code FROM shifts WHERE user_id IS NULL');
    const existingCodes = new Set(existingRows.map((r) => r.code));
    const missing = shifts.filter((s) => !existingCodes.has(s.code));

    if (missing.length > 0) {
        await Promise.all(
            missing.map((s) =>
                dbRun(
                    'INSERT INTO shifts (code, name, total_hours, regular_hours, overtime_hours) VALUES (?, ?, ?, ?, ?)',
                    [s.code, s.name, s.hours, s.reg, s.ot]
                )
            )
        );
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

async function ensurePerformanceIndexes() {
    const statements = [
        'CREATE INDEX IF NOT EXISTS idx_work_schedules_user_date ON work_schedules(user_id, work_date)',
        'CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, expense_date)',
        'CREATE INDEX IF NOT EXISTS idx_salary_adjustments_user_date ON salary_adjustments(user_id, adjustment_date)',
        'CREATE INDEX IF NOT EXISTS idx_salary_settings_user ON salary_settings(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_expense_categories_user ON expense_categories(user_id)'
    ];
    for (const sql of statements) {
        try {
            await dbRun(sql);
        } catch {
            // Skip index creation on partial test schemas without that table
        }
    }
}

async function initializeDatabase() {
    if (!isPostgres) {
        await dbRun('PRAGMA foreign_keys = ON');
        await dbRun('PRAGMA busy_timeout = 5000');
        await dbRun('PRAGMA journal_mode = WAL');
        await dbRun('PRAGMA synchronous = NORMAL');
        await dbRun('PRAGMA temp_store = MEMORY');
        await dbRun('PRAGMA cache_size = -16000');
    }
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await dbExec(schema);

    await migrateUsersTable();
    await ensurePerformanceIndexes();
    await Promise.all([seedShifts(), seedDemoUsers()]);
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
    DEFAULT_EXPENSE_CATEGORIES,
    getStorageInfo,
    getMonthDateRange,
    convertPlaceholders,
    shouldUseSsl,
    normalizePgConnectionString,
    parsePositiveInt
};
