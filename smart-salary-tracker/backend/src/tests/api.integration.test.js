const path = require('path');
const fs = require('fs');
const os = require('os');
const sqlite3 = require('sqlite3').verbose();

const testDbPath = path.join(os.tmpdir(), `longhai_test_${Date.now()}.sqlite`);
process.env.DB_PATH = testDbPath;
process.env.JWT_SECRET = 'test_jwt_secret_key';

const request = require('supertest');
const { db, dbAll, dbGet, ready } = require('../database/db');
const app = require('../app');

afterAll(async () => {
    await new Promise((resolve) => db.close(() => resolve()));
    if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
    }
});

describe('1. Database schema, shifts B1/B2 & memorable demo accounts', () => {
    beforeAll(async () => {
        await ready();
    });

    test('creates core salary tracker tables and nullable email + username column on users', async () => {
        const tables = await dbAll("SELECT name FROM sqlite_master WHERE type='table'");
        const names = tables.map((t) => t.name);
        expect(names).toEqual(
            expect.arrayContaining([
                'users',
                'shifts',
                'work_schedules',
                'expense_categories',
                'expenses',
                'salary_settings',
                'salary_adjustments'
            ])
        );

        const userColumns = await dbAll('PRAGMA table_info(users)');
        const usernameCol = userColumns.find((c) => c.name === 'username');
        const emailCol = userColumns.find((c) => c.name === 'email');
        expect(usernameCol).toBeTruthy();
        expect(emailCol).toBeTruthy();
        expect(emailCol.notnull).toBe(0);
    });

    test('seeds B1 and B2 4-hour shifts alongside default shifts', async () => {
        const shifts = await dbAll('SELECT * FROM shifts WHERE user_id IS NULL');
        const byCode = Object.fromEntries(shifts.map((s) => [s.code, s]));

        expect(byCode.B1).toBeTruthy();
        expect(byCode.B1.total_hours).toBe(4);
        expect(byCode.B1.regular_hours).toBe(4);
        expect(byCode.B1.overtime_hours).toBe(0);

        expect(byCode.B2).toBeTruthy();
        expect(byCode.B2.total_hours).toBe(4);
        expect(byCode.B2.regular_hours).toBe(4);
        expect(byCode.B2.overtime_hours).toBe(0);

        expect(byCode.A.total_hours).toBe(8);
        expect(byCode.A1.total_hours).toBe(12);
        expect(byCode.AB.total_hours).toBe(16);
    });

    test('seeds memorable demo admin ("admin") and employee ("nv1") accounts', async () => {
        const admin = await dbGet('SELECT * FROM users WHERE username = ?', ['admin']);
        expect(admin).toBeTruthy();
        expect(admin.role).toBe('admin');

        const employee = await dbGet('SELECT * FROM users WHERE username = ?', ['nv1']);
        expect(employee).toBeTruthy();
        expect(employee.role).toBe('employee');

        const empSettings = await dbGet('SELECT * FROM salary_settings WHERE user_id = ?', [employee.id]);
        expect(empSettings).toBeTruthy();
        const empCats = await dbAll('SELECT * FROM expense_categories WHERE user_id = ?', [employee.id]);
        expect(empCats.length).toBeGreaterThanOrEqual(6);
    });
});

describe('2. Self-registration, flexible login & password change', () => {
    let newUserToken;

    beforeAll(async () => {
        await ready();
    });

    test('allows employee to self-register using a short username or phone (no email required) and returns token', async () => {
        const res = await request(app).post('/api/auth/register').send({
            name: 'Trần Minh Bảo',
            identifier: '0909111222',
            employee_code: '',
            password: 'matkhau99'
        });
        expect(res.statusCode).toBe(201);
        expect(res.body.token).toBeTruthy();
        expect(res.body.user.username).toBe('0909111222');
        expect(res.body.user.role).toBe('employee');
        newUserToken = res.body.token;

        // Second registration with empty employee_code works cleanly too
        const res2 = await request(app).post('/api/auth/register').send({
            name: 'Lê Văn Hùng',
            identifier: 'hungbv',
            employee_code: '',
            password: '123456'
        });
        expect(res2.statusCode).toBe(201);
        expect(res2.body.user.username).toBe('hungbv');
    });

    test('prevents duplicate username/identifier registration', async () => {
        const dupRes = await request(app).post('/api/auth/register').send({
            name: 'Trùng Tài Khoản',
            identifier: '0909111222',
            password: 'password123'
        });
        expect(dupRes.statusCode).toBe(400);
    });

    test('logs in via username, employee_code, or email', async () => {
        const byUsername = await request(app).post('/api/auth/login').send({
            identifier: 'nv1',
            password: process.env.DEMO_EMPLOYEE_PASSWORD || '123456'
        });
        expect(byUsername.statusCode).toBe(200);
        expect(byUsername.body.user.role).toBe('employee');

        const byCode = await request(app).post('/api/auth/login').send({
            identifier: 'NV001',
            password: process.env.DEMO_EMPLOYEE_PASSWORD || '123456'
        });
        expect(byCode.statusCode).toBe(200);
        expect(byCode.body.user.username).toBe('nv1');

        const adminLogin = await request(app).post('/api/auth/login').send({
            identifier: 'admin',
            password: process.env.DEMO_ADMIN_PASSWORD || 'admin123'
        });
        expect(adminLogin.statusCode).toBe(200);
        expect(adminLogin.body.user.role).toBe('admin');
    });

    test('authenticated user can change their own password', async () => {
        const badCurrent = await request(app)
            .post('/api/auth/change-password')
            .set('Authorization', `Bearer ${newUserToken}`)
            .send({ currentPassword: 'wrong', newPassword: 'newpass123' });
        expect(badCurrent.statusCode).toBe(400);

        const goodChange = await request(app)
            .post('/api/auth/change-password')
            .set('Authorization', `Bearer ${newUserToken}`)
            .send({ currentPassword: 'matkhau99', newPassword: 'newpass123' });
        expect(goodChange.statusCode).toBe(200);

        const loginNew = await request(app).post('/api/auth/login').send({
            identifier: '0909111222',
            password: 'newpass123'
        });
        expect(loginNew.statusCode).toBe(200);
    });
});

describe('3. Admin User Management & Reset Password to 123456', () => {
    let adminToken;
    let empToken;

    beforeAll(async () => {
        await ready();
        const adminRes = await request(app).post('/api/auth/login').send({
            identifier: 'admin',
            password: process.env.DEMO_ADMIN_PASSWORD || 'admin123'
        });
        adminToken = adminRes.body.token;

        const empRes = await request(app).post('/api/auth/login').send({
            identifier: 'nv1',
            password: process.env.DEMO_EMPLOYEE_PASSWORD || '123456'
        });
        empToken = empRes.body.token;
    });

    test('blocks employee role from accessing /api/admin/*', async () => {
        const res = await request(app)
            .get('/api/admin/users')
            .set('Authorization', `Bearer ${empToken}`);
        expect(res.statusCode).toBe(403);
    });

    test('admin can list, create, reset password back to 123456, and delete employee accounts', async () => {
        const createRes = await request(app)
            .post('/api/admin/users')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Phạm Văn Quên MK',
                identifier: 'phamquen',
                employee_code: 'LH-777',
                password: 'customPassword999'
            });
        expect(createRes.statusCode).toBe(201);
        const createdId = createRes.body.user.id;

        const listRes = await request(app)
            .get('/api/admin/users')
            .query({ q: 'phamquen' })
            .set('Authorization', `Bearer ${adminToken}`);
        expect(listRes.statusCode).toBe(200);
        expect(listRes.body.some((u) => u.id === createdId && u.password_hash === undefined)).toBe(true);

        const resetRes = await request(app)
            .post(`/api/admin/users/${createdId}/reset-password`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(resetRes.statusCode).toBe(200);

        const loginAfterReset = await request(app).post('/api/auth/login').send({
            identifier: 'phamquen',
            password: '123456'
        });
        expect(loginAfterReset.statusCode).toBe(200);

        const deleteRes = await request(app)
            .delete(`/api/admin/users/${createdId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(deleteRes.statusCode).toBe(200);
    });
});

describe('4. Shifts B1/B2 scheduling, Expenses save/validation & Dashboard salary summary', () => {
    let empToken;

    beforeAll(async () => {
        await ready();
        const empRes = await request(app).post('/api/auth/login').send({
            identifier: 'nv1',
            password: process.env.DEMO_EMPLOYEE_PASSWORD || '123456'
        });
        empToken = empRes.body.token;
    });

    test('schedules B1 (4h) and B2 (4h) shifts, computes dashboard income/hours, and supports delete', async () => {
        const shiftsRes = await request(app)
            .get('/api/shifts')
            .set('Authorization', `Bearer ${empToken}`);
        expect(shiftsRes.statusCode).toBe(200);
        const shiftB1 = shiftsRes.body.find((s) => s.code === 'B1');
        const shiftB2 = shiftsRes.body.find((s) => s.code === 'B2');
        expect(shiftB1).toBeTruthy();
        expect(shiftB2).toBeTruthy();

        const sch1 = await request(app)
            .post('/api/schedules')
            .set('Authorization', `Bearer ${empToken}`)
            .send({ work_date: '2026-11-10', shift_id: shiftB1.id, day_type: 'NORMAL' });
        expect(sch1.statusCode).toBe(201);

        const sch2 = await request(app)
            .post('/api/schedules')
            .set('Authorization', `Bearer ${empToken}`)
            .send({ work_date: '2026-11-11', shift_id: shiftB2.id, day_type: 'WEEKLY_OFF' });
        expect(sch2.statusCode).toBe(201);

        const dashRes = await request(app)
            .get('/api/dashboard')
            .query({ date: '2026-11-10' })
            .set('Authorization', `Bearer ${empToken}`);
        expect(dashRes.statusCode).toBe(200);
        // Today (2026-11-10) = B1 (4h) NORMAL = 4 * 25529 = 102116
        expect(Math.round(dashRes.body.today.income)).toBe(102116);
        // Month = B1 NORMAL (102116) + B2 WEEKLY_OFF (4 * 25529 * 2 = 204232) = 306348
        expect(Math.round(dashRes.body.month.income)).toBe(306348);
        expect(dashRes.body.month.totalHours).toBe(8);
        expect(dashRes.body.month.workDays).toBe(2);

        const delRes = await request(app)
            .delete(`/api/schedules/${sch2.body.id}`)
            .set('Authorization', `Bearer ${empToken}`);
        expect(delRes.statusCode).toBe(200);
    });

    test('validates expenses and saves safely even when category_id is empty/omitted', async () => {
        const badAmt = await request(app)
            .post('/api/expenses')
            .set('Authorization', `Bearer ${empToken}`)
            .send({ amount: 0, expense_date: '2026-11-10', category_id: '', note: 'Invalid' });
        expect(badAmt.statusCode).toBe(400);

        const noCatSave = await request(app)
            .post('/api/expenses')
            .set('Authorization', `Bearer ${empToken}`)
            .send({ amount: 45000, expense_date: '2026-11-10', category_id: '', note: 'Cơm ca' });
        expect(noCatSave.statusCode).toBe(201);
        const expId = noCatSave.body.id;

        const updateRes = await request(app)
            .put(`/api/expenses/${expId}`)
            .set('Authorization', `Bearer ${empToken}`)
            .send({ amount: 55000, expense_date: '2026-11-10', category_id: null, note: 'Cơm tối' });
        expect(updateRes.statusCode).toBe(200);

        const listRes = await request(app)
            .get('/api/expenses')
            .query({ month: '11', year: '2026' })
            .set('Authorization', `Bearer ${empToken}`);
        expect(listRes.statusCode).toBe(200);
        const saved = listRes.body.find((e) => e.id === expId);
        expect(saved.amount).toBe(55000);

        const delRes = await request(app)
            .delete(`/api/expenses/${expId}`)
            .set('Authorization', `Bearer ${empToken}`);
        expect(delRes.statusCode).toBe(200);
    });
});

describe('5. Bulk schedule (AUTO Sunday), Salary Adjustments, Custom OT & Health Storage Status', () => {
    let empToken;

    beforeAll(async () => {
        await ready();
        const empRes = await request(app).post('/api/auth/login').send({
            identifier: 'nv1',
            password: process.env.DEMO_EMPLOYEE_PASSWORD || '123456'
        });
        empToken = empRes.body.token;
    });

    test('exposes storage persistence info on /api/health', async () => {
        const health = await request(app).get('/api/health');
        expect(health.statusCode).toBe(200);
        expect(health.body.status).toBe('ok');
        expect(health.body.database).toBe('sqlite');
        expect(health.body.persistent).toBe(false);
    });

    test('bulk schedules with AUTO day_type_mode and overwrite=false keeps existing shifts', async () => {
        const shiftsRes = await request(app).get('/api/shifts').set('Authorization', `Bearer ${empToken}`);
        const shiftA = shiftsRes.body.find((s) => s.code === 'A');

        // 2026-11-10 already has B1 from describe block 4; 2026-11-15 is Sunday; 2026-11-16 is Monday
        const bulkRes = await request(app)
            .post('/api/schedules/bulk')
            .set('Authorization', `Bearer ${empToken}`)
            .send({
                dates: ['2026-11-10', '2026-11-15', '2026-11-16'],
                shift_id: shiftA.id,
                day_type_mode: 'AUTO',
                overwrite: false,
                notes: 'Mục tiêu A'
            });

        expect(bulkRes.statusCode).toBe(200);
        expect(bulkRes.body.skippedCount).toBe(1);
        expect(bulkRes.body.createdCount).toBe(2);

        const listRes = await request(app)
            .get('/api/schedules')
            .query({ month: '11', year: '2026' })
            .set('Authorization', `Bearer ${empToken}`);
        const nov10 = listRes.body.find((s) => s.work_date === '2026-11-10');
        const nov15 = listRes.body.find((s) => s.work_date === '2026-11-15');
        const nov16 = listRes.body.find((s) => s.work_date === '2026-11-16');

        expect(nov10.shift_code).toBe('B1');
        expect(nov15.day_type).toBe('WEEKLY_OFF');
        expect(nov16.day_type).toBe('NORMAL');
    });

    test('creates allowances & deductions and combines them with shiftIncome on dashboard', async () => {
        const allowRes = await request(app)
            .post('/api/adjustments')
            .set('Authorization', `Bearer ${empToken}`)
            .send({
                adjustment_date: '2026-11-15',
                type: 'ALLOWANCE',
                title: 'Phụ cấp ca đêm',
                amount: 500000
            });
        expect(allowRes.statusCode).toBe(201);

        const deductRes = await request(app)
            .post('/api/adjustments')
            .set('Authorization', `Bearer ${empToken}`)
            .send({
                adjustment_date: '2026-11-16',
                type: 'DEDUCTION',
                title: 'Ứng lương giữa tháng',
                amount: 300000
            });
        expect(deductRes.statusCode).toBe(201);

        const dashRes = await request(app)
            .get('/api/dashboard')
            .query({ date: '2026-11-10', month: '11', year: '2026' })
            .set('Authorization', `Bearer ${empToken}`);
        expect(dashRes.statusCode).toBe(200);
        expect(dashRes.body.month.allowances).toBe(500000);
        expect(dashRes.body.month.deductions).toBe(300000);
        expect(dashRes.body.month.netSalary).toBe(dashRes.body.month.shiftIncome + 500000 - 300000);
        expect(dashRes.body.month.adjustments.length).toBe(2);

        // Cleanup adjustments
        await request(app).delete(`/api/adjustments/${allowRes.body.id}`).set('Authorization', `Bearer ${empToken}`);
        await request(app).delete(`/api/adjustments/${deductRes.body.id}`).set('Authorization', `Bearer ${empToken}`);
    });
});
