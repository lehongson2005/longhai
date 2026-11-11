CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    employee_code TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'employee',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    total_hours REAL NOT NULL,
    regular_hours REAL NOT NULL,
    overtime_hours REAL NOT NULL,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS work_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    work_date DATE NOT NULL,
    shift_id INTEGER NOT NULL,
    day_type TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (shift_id) REFERENCES shifts(id)
);

CREATE TABLE IF NOT EXISTS expense_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    icon TEXT
);

CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    expense_date DATE NOT NULL,
    amount REAL NOT NULL,
    category_id INTEGER,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES expense_categories(id)
);

CREATE TABLE IF NOT EXISTS salary_settings (
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

CREATE TABLE IF NOT EXISTS salary_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    base_salary REAL,
    regular_salary REAL,
    weekly_off_salary REAL,
    holiday_salary REAL,
    normal_overtime REAL,
    weekly_overtime REAL,
    holiday_overtime REAL,
    allowances REAL,
    deductions REAL,
    estimated_net_salary REAL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS financial_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    target_amount REAL NOT NULL,
    current_amount REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    location TEXT NOT NULL,
    site_type TEXT NOT NULL,
    shift_type TEXT NOT NULL,
    salary_min INTEGER NOT NULL,
    salary_max INTEGER NOT NULL,
    salary_display TEXT NOT NULL,
    quantity INTEGER DEFAULT 10,
    description TEXT NOT NULL,
    requirements TEXT NOT NULL,
    benefits TEXT NOT NULL,
    is_hot INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    birth_year INTEGER,
    preferred_location TEXT NOT NULL,
    preferred_shift TEXT,
    has_cccd INTEGER DEFAULT 1,
    experience_note TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    admin_note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS quote_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    location TEXT NOT NULL,
    service_type TEXT NOT NULL,
    guard_count INTEGER,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    admin_note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
