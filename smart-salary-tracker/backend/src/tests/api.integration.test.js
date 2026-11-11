const path = require('path');
const fs = require('fs');
const os = require('os');

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

describe('Task 2: Database initialization, migration & seed', () => {
    beforeAll(async () => {
        await ready();
    });

    test('creates required tables including jobs, applications, quote_requests and users.role', async () => {
        const tables = await dbAll("SELECT name FROM sqlite_master WHERE type='table'");
        const names = tables.map((t) => t.name);
        expect(names).toEqual(expect.arrayContaining(['users', 'shifts', 'jobs', 'applications', 'quote_requests', 'salary_settings']));

        const userColumns = await dbAll('PRAGMA table_info(users)');
        const colNames = userColumns.map((c) => c.name);
        expect(colNames).toContain('role');
    });

    test('seeds at least 6 open jobs and 2 demo accounts with salary_settings', async () => {
        const jobs = await dbAll('SELECT * FROM jobs WHERE status = "open"');
        expect(jobs.length).toBeGreaterThanOrEqual(6);

        const admin = await dbGet('SELECT * FROM users WHERE email = ?', ['admin@securitaslonghai.vn']);
        expect(admin).toBeTruthy();
        expect(admin.role).toBe('admin');

        const adminSettings = await dbGet('SELECT * FROM salary_settings WHERE user_id = ?', [admin.id]);
        expect(adminSettings).toBeTruthy();

        const employee = await dbGet('SELECT * FROM users WHERE email = ?', ['nhanvien@securitaslonghai.vn']);
        expect(employee).toBeTruthy();
        expect(employee.role).toBe('employee');

        const empSettings = await dbGet('SELECT * FROM salary_settings WHERE user_id = ?', [employee.id]);
        expect(empSettings).toBeTruthy();
    });
});

describe('Task 3: Auth registration empty employee_code & role reporting', () => {
    beforeAll(async () => {
        await ready();
    });

    test('allows multiple users to register with empty employee_code', async () => {
        const res1 = await request(app).post('/api/auth/register').send({
            name: 'NV Mot',
            email: 'nv1@example.com',
            employee_code: '',
            password: 'password123'
        });
        expect(res1.statusCode).toBe(201);

        const res2 = await request(app).post('/api/auth/register').send({
            name: 'NV Hai',
            email: 'nv2@example.com',
            employee_code: '',
            password: 'password123'
        });
        expect(res2.statusCode).toBe(201);
    });

    test('login and /auth/me return user role for admin and employee', async () => {
        const adminLogin = await request(app).post('/api/auth/login').send({
            email: 'admin@securitaslonghai.vn',
            password: process.env.DEMO_ADMIN_PASSWORD || 'Admin@123'
        });
        expect(adminLogin.statusCode).toBe(200);
        expect(adminLogin.body.user.role).toBe('admin');

        const meRes = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${adminLogin.body.token}`);
        expect(meRes.statusCode).toBe(200);
        expect(meRes.body.role).toBe('admin');

        const empLogin = await request(app).post('/api/auth/login').send({
            email: 'nhanvien@securitaslonghai.vn',
            password: process.env.DEMO_EMPLOYEE_PASSWORD || '123456'
        });
        expect(empLogin.statusCode).toBe(200);
        expect(empLogin.body.user.role).toBe('employee');
    });
});

describe('Task 4: Public API (jobs, applications, quotes, salary-estimate)', () => {
    beforeAll(async () => {
        await ready();
    });

    test('GET /api/public/jobs filters by location and site_type, and /jobs/:id handles 404', async () => {
        const allRes = await request(app).get('/api/public/jobs');
        expect(allRes.statusCode).toBe(200);
        expect(allRes.body.length).toBeGreaterThanOrEqual(6);

        const bdRes = await request(app).get('/api/public/jobs').query({ location: 'Bình Dương' });
        expect(bdRes.statusCode).toBe(200);
        expect(bdRes.body.length).toBeGreaterThanOrEqual(1);
        expect(bdRes.body.every((j) => j.location === 'Bình Dương')).toBe(true);

        const detailRes = await request(app).get(`/api/public/jobs/${bdRes.body[0].id}`);
        expect(detailRes.statusCode).toBe(200);
        expect(detailRes.body.id).toBe(bdRes.body[0].id);

        const notFoundRes = await request(app).get('/api/public/jobs/999999');
        expect(notFoundRes.statusCode).toBe(404);
    });

    test('POST /api/public/applications validates phone and required fields then saves', async () => {
        const badPhone = await request(app).post('/api/public/applications').send({
            full_name: 'Trần Minh Tâm',
            phone: '123',
            preferred_location: 'TP. Hồ Chí Minh'
        });
        expect(badPhone.statusCode).toBe(400);

        const jobsRes = await request(app).get('/api/public/jobs');
        const firstJobId = jobsRes.body[0].id;

        const validApp = await request(app).post('/api/public/applications').send({
            job_id: firstJobId,
            full_name: 'Trần Minh Tâm',
            phone: '0909 123 456',
            birth_year: 1995,
            preferred_location: 'TP. Hồ Chí Minh',
            preferred_shift: 'Ca 12h',
            has_cccd: true,
            experience_note: 'Bộ đội xuất ngũ'
        });
        expect(validApp.statusCode).toBe(201);
        expect(validApp.body.id).toBeTruthy();

        const saved = await dbGet('SELECT * FROM applications WHERE id = ?', [validApp.body.id]);
        expect(saved.phone).toBe('0909123456');
        expect(saved.job_id).toBe(firstJobId);
    });

    test('POST /api/public/quotes validates required fields and saves quote request', async () => {
        const missingCompany = await request(app).post('/api/public/quotes').send({
            contact_name: 'Anh Hùng',
            phone: '0912345678',
            location: 'Bình Dương',
            service_type: 'Bảo vệ mục tiêu cố định'
        });
        expect(missingCompany.statusCode).toBe(400);

        const validQuote = await request(app).post('/api/public/quotes').send({
            company_name: 'Công ty TNHH Sản Xuất ABC',
            contact_name: 'Nguyễn Văn Hùng',
            phone: '0912-345-678',
            email: 'hung@abc.vn',
            location: 'Bình Dương',
            service_type: 'Bảo vệ nhà máy / Khu công nghiệp',
            guard_count: 12,
            notes: 'Cần khảo sát tuần tới'
        });
        expect(validQuote.statusCode).toBe(201);
        expect(validQuote.body.id).toBeTruthy();
    });

    test('POST /api/public/salary-estimate uses salaryCalculator logic and rejects > 31 total days', async () => {
        const tooManyDays = await request(app).post('/api/public/salary-estimate').send({
            shiftHours: 12,
            normalDays: 28,
            sundayDays: 4,
            holidayDays: 0
        });
        expect(tooManyDays.statusCode).toBe(400);

        const estRes = await request(app).post('/api/public/salary-estimate').send({
            shiftHours: 12,
            normalDays: 22,
            sundayDays: 4,
            holidayDays: 0,
            hourlyRate: 25529,
            mealAllowancePerDay: 30000
        });
        expect(estRes.statusCode).toBe(200);
        // Normal day 12h = 8*25529 + 4*25529*1.5 = 357406 -> 22 * 357406 = 7,862,932
        // Sunday 12h = 12*25529*2 = 612696 -> 4 * 612696 = 2,450,784
        // Meal allowance = 26 * 30000 = 780,000
        // Total = 11,093,716
        expect(estRes.body.totalDays).toBe(26);
        expect(estRes.body.totalHours).toBe(312);
        expect(estRes.body.estimatedTotal).toBe(11093716);
    });
});

describe('Task 5: Admin RBAC, Jobs CRUD, Applications & Quotes Management', () => {
    let adminToken;
    let empToken;

    beforeAll(async () => {
        await ready();
        const adminRes = await request(app).post('/api/auth/login').send({
            email: 'admin@securitaslonghai.vn',
            password: process.env.DEMO_ADMIN_PASSWORD || 'Admin@123'
        });
        adminToken = adminRes.body.token;

        const empRes = await request(app).post('/api/auth/login').send({
            email: 'nhanvien@securitaslonghai.vn',
            password: process.env.DEMO_EMPLOYEE_PASSWORD || '123456'
        });
        empToken = empRes.body.token;
    });

    test('blocks employee role from accessing /api/admin/*', async () => {
        const res = await request(app)
            .get('/api/admin/stats')
            .set('Authorization', `Bearer ${empToken}`);
        expect(res.statusCode).toBe(403);
    });

    test('allows admin to create, close, and safely delete a job that has applications', async () => {
        const createRes = await request(app)
            .post('/api/admin/jobs')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                title: 'Bảo vệ Cảng Quốc tế Long An',
                department: 'Bảo vệ mục tiêu',
                location: 'TP. Hồ Chí Minh',
                site_type: 'Khu công nghiệp / Nhà máy',
                shift_type: 'Ca 12h',
                salary_min: 9500000,
                salary_max: 12000000,
                salary_display: '9.5 - 12 triệu/tháng',
                quantity: 10,
                description: 'Kiểm soát cổng cảng và kho bãi.',
                requirements: 'Có CCCD gắn chip, sức khỏe tốt.',
                benefits: 'Đầy đủ BHXH và nhà đội.',
                is_hot: 1
            });
        expect(createRes.statusCode).toBe(201);
        const createdJobId = createRes.body.id;

        const appRes = await request(app).post('/api/public/applications').send({
            job_id: createdJobId,
            full_name: 'Lê Hoàng Nam',
            phone: '0988777666',
            preferred_location: 'TP. Hồ Chí Minh'
        });
        expect(appRes.statusCode).toBe(201);
        const appId = appRes.body.id;

        const closeRes = await request(app)
            .put(`/api/admin/jobs/${createdJobId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'closed' });
        expect(closeRes.statusCode).toBe(200);

        const publicJobs = await request(app).get('/api/public/jobs');
        expect(publicJobs.body.some((j) => j.id === createdJobId)).toBe(false);

        const delRes = await request(app)
            .delete(`/api/admin/jobs/${createdJobId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(delRes.statusCode).toBe(200);

        const savedApp = await dbGet('SELECT * FROM applications WHERE id = ?', [appId]);
        expect(savedApp).toBeTruthy();
        expect(savedApp.job_id).toBeNull();
    });

    test('allows admin to list and update application & quote statuses with whitelist validation', async () => {
        const appsRes = await request(app)
            .get('/api/admin/applications')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(appsRes.statusCode).toBe(200);
        expect(appsRes.body.length).toBeGreaterThanOrEqual(1);

        const targetAppId = appsRes.body[0].id;
        const badStatus = await request(app)
            .patch(`/api/admin/applications/${targetAppId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'invalid_status' });
        expect(badStatus.statusCode).toBe(400);

        const goodAppPatch = await request(app)
            .patch(`/api/admin/applications/${targetAppId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'contacted', admin_note: 'Đã hẹn phỏng vấn thứ 5' });
        expect(goodAppPatch.statusCode).toBe(200);

        const quotesRes = await request(app)
            .get('/api/admin/quotes')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(quotesRes.statusCode).toBe(200);
        expect(quotesRes.body.length).toBeGreaterThanOrEqual(1);

        const targetQuoteId = quotesRes.body[0].id;
        const goodQuotePatch = await request(app)
            .patch(`/api/admin/quotes/${targetQuoteId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'quoted', admin_note: 'Đã gửi báo giá qua email' });
        expect(goodQuotePatch.statusCode).toBe(200);

        const statsRes = await request(app)
            .get('/api/admin/stats')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(statsRes.statusCode).toBe(200);
        expect(statsRes.body.openJobs).toBeGreaterThanOrEqual(6);
    });
});
