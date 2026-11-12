CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    employee_code TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'employee',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shifts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    total_hours DOUBLE PRECISION NOT NULL,
    regular_hours DOUBLE PRECISION NOT NULL,
    overtime_hours DOUBLE PRECISION NOT NULL,
    is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS work_schedules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    work_date TEXT NOT NULL,
    shift_id INTEGER NOT NULL REFERENCES shifts(id),
    day_type TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expense_categories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    name TEXT NOT NULL,
    icon TEXT
);

CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    expense_date TEXT NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    category_id INTEGER REFERENCES expense_categories(id),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS salary_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    base_salary DOUBLE PRECISION,
    standard_work_days DOUBLE PRECISION,
    standard_hour_rate DOUBLE PRECISION,
    overtime_rate DOUBLE PRECISION,
    weekly_off_rate DOUBLE PRECISION,
    holiday_rate DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS salary_adjustments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    adjustment_date TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS salary_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    base_salary DOUBLE PRECISION,
    regular_salary DOUBLE PRECISION,
    weekly_off_salary DOUBLE PRECISION,
    holiday_salary DOUBLE PRECISION,
    normal_overtime DOUBLE PRECISION,
    weekly_overtime DOUBLE PRECISION,
    holiday_overtime DOUBLE PRECISION,
    allowances DOUBLE PRECISION,
    deductions DOUBLE PRECISION,
    estimated_net_salary DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS financial_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    target_amount DOUBLE PRECISION NOT NULL,
    current_amount DOUBLE PRECISION DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_work_schedules_user_date ON work_schedules(user_id, work_date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, expense_date);
CREATE INDEX IF NOT EXISTS idx_salary_adjustments_user_date ON salary_adjustments(user_id, adjustment_date);
CREATE INDEX IF NOT EXISTS idx_salary_settings_user ON salary_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_user ON expense_categories(user_id);
