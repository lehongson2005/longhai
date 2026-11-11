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

async function seedShifts() {
    const row = await dbGet('SELECT COUNT(*) as count FROM shifts WHERE user_id IS NULL');
    if (row && row.count === 0) {
        const shifts = [
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
            name: 'Quản trị Nhân sự Long Hải',
            email: 'admin@securitaslonghai.vn',
            employee_code: 'LH-ADM01',
            password: process.env.DEMO_ADMIN_PASSWORD || 'Admin@123',
            role: 'admin'
        },
        {
            name: 'Nguyễn Văn Bảo (NV Bảo vệ)',
            email: 'nhanvien@securitaslonghai.vn',
            employee_code: 'LH-NV001',
            password: process.env.DEMO_EMPLOYEE_PASSWORD || '123456',
            role: 'employee'
        }
    ];

    const defaultCategories = ['Ăn uống', 'Di chuyển', 'Nhà ở', 'Mua sắm', 'Giải trí', 'Khác'];

    for (const acc of demoAccounts) {
        let user = await dbGet('SELECT * FROM users WHERE email = ?', [acc.email]);
        if (!user) {
            const password_hash = await bcrypt.hash(acc.password, 10);
            const res = await dbRun(
                'INSERT INTO users (name, email, employee_code, password_hash, role) VALUES (?, ?, ?, ?, ?)',
                [acc.name, acc.email, acc.employee_code, password_hash, acc.role]
            );
            user = { id: res.id };
        }

        const existingSettings = await dbGet('SELECT id FROM salary_settings WHERE user_id = ?', [user.id]);
        if (!existingSettings) {
            await dbRun(
                'INSERT INTO salary_settings (user_id, base_salary, standard_work_days, standard_hour_rate, overtime_rate, weekly_off_rate, holiday_rate) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [user.id, 5310000, 26, 25529, 38293, 51058, 2]
            );
        }

        const existingCats = await dbGet('SELECT COUNT(*) as count FROM expense_categories WHERE user_id = ?', [user.id]);
        if (!existingCats || existingCats.count === 0) {
            for (const cat of defaultCategories) {
                await dbRun('INSERT INTO expense_categories (user_id, name, icon) VALUES (?, ?, ?)', [user.id, cat, '']);
            }
        }
    }
}

async function seedJobs() {
    const row = await dbGet('SELECT COUNT(*) as count FROM jobs');
    if (row && row.count === 0) {
        const defaultJobs = [
            {
                title: 'Nhân viên Bảo vệ Tòa nhà Văn phòng (Quận 1 & Phú Nhuận)',
                department: 'Bảo vệ mục tiêu',
                location: 'TP. Hồ Chí Minh',
                site_type: 'Tòa nhà văn phòng',
                shift_type: 'Ca 8h / 12h linh hoạt',
                salary_min: 7800000,
                salary_max: 12000000,
                salary_display: '7.8 - 12 triệu/tháng',
                quantity: 25,
                description: 'Kiểm soát an ninh sảnh lễ tân, hướng dẫn khách hàng ra vào tòa nhà văn phòng hạng A, tuần tra các tầng và phối hợp vận hành phòng trực camera theo tiêu chuẩn Securitas.',
                requirements: 'Nam/Nữ 18–48 tuổi, có CCCD gắn chip, tốt nghiệp THCS trở lên. Tác phong lịch sự, không hình xăm lộ diện. Không yêu cầu kinh nghiệm (được đào tạo miễn phí).',
                benefits: 'Nhận lương qua ATM đúng ngày 5 hàng tháng; đóng BHXH/BHYT/BHTN đầy đủ + BHTN 24/7; cấp đồng phục miễn phí; lương tháng 13; thưởng tiếng Anh giao tiếp nếu có.',
                is_hot: 1
            },
            {
                title: 'Nhân viên An ninh Khu công nghiệp & Nhà máy FDI',
                department: 'Bảo vệ mục tiêu',
                location: 'Bình Dương',
                site_type: 'Khu công nghiệp / Nhà máy',
                shift_type: 'Ca 12h (A1 / C1)',
                salary_min: 9500000,
                salary_max: 12373000,
                salary_display: '9.5 - 12.3 triệu/tháng',
                quantity: 40,
                description: 'Trực cổng kiểm soát xe vận tải, xuất nhập hàng hóa, kiểm tra an toàn PCCC và tuần tra vành đai tại các nhà máy FDI thuộc KCN VSIP, Sóng Thần.',
                requirements: 'Tuổi 18–50, sức khỏe tốt, có CCCD gắn chip, lý lịch rõ ràng. Ưu tiên bộ đội xuất ngũ hoặc có nguyện vọng gắn bó lâu dài.',
                benefits: 'Hỗ trợ nhà đội (chỗ ở miễn phí) cho nhân viên ở xa; phụ cấp cơm ca; OT tính hệ số 150% - 200% - 300%; 14 ngày phép năm; tuyệt đối không thu phí tuyển dụng.',
                is_hot: 1
            },
            {
                title: 'Nhân viên Bảo vệ Chi nhánh Ngân hàng & Điểm giao dịch',
                department: 'Bảo vệ mục tiêu',
                location: 'Hà Nội',
                site_type: 'Ngân hàng',
                shift_type: 'Ca 8h / 12h',
                salary_min: 8000000,
                salary_max: 11200000,
                salary_display: '8.0 - 11.2 triệu/tháng',
                quantity: 15,
                description: 'Đảm bảo an toàn khu vực giao dịch tiền mặt, hỗ trợ khách hàng gửi xe và phòng ngừa rủi ro an ninh tại các ngân hàng ở Ba Đình, Hoàn Kiếm, Nam Từ Liêm.',
                requirements: 'Nam 20–45 tuổi, cao từ 1m65 trở lên, trung thực, nhanh nhẹn, xử lý tình huống bình tĩnh, không tiền án tiền sự.',
                benefits: 'Đóng BHXH đầy đủ từ tháng đầu, bảo hiểm tai nạn 24/7, đào tạo nghiệp vụ bảo vệ ngân hàng bài bản miễn phí, thưởng lễ tết và tháng 13.',
                is_hot: 1
            },
            {
                title: 'Nhân viên Bảo vệ Nhà máy & Kho vận Biên Hòa',
                department: 'Bảo vệ mục tiêu',
                location: 'Đồng Nai',
                site_type: 'Khu công nghiệp / Nhà máy',
                shift_type: 'Ca 12h',
                salary_min: 9000000,
                salary_max: 11800000,
                salary_display: '9.0 - 11.8 triệu/tháng',
                quantity: 30,
                description: 'Giám sát cổng ra vào công nhân viên, kiểm soát niêm phong container, ghi chép sổ trực và đảm bảo an toàn tài sản nhà máy tại Amata, Biên Hòa.',
                requirements: 'Tuổi 18–50, tốt nghiệp THCS trở lên, có CCCD gắn chip. Không yêu cầu kinh nghiệm trước, được hướng dẫn trực tiếp tại mục tiêu.',
                benefits: 'Nhà đội miễn phí gần KCN, đồng phục cấp mới hàng năm, nhận lương đúng hạn ngày 5, hỗ trợ viện phí và bảo hiểm 24/7.',
                is_hot: 0
            },
            {
                title: 'Nhân viên Bảo vệ Trường học Quốc tế & Khu đô thị',
                department: 'Bảo vệ mục tiêu',
                location: 'TP. Hồ Chí Minh',
                site_type: 'Trường học / Bệnh viện',
                shift_type: 'Ca 8h',
                salary_min: 7500000,
                salary_max: 9200000,
                salary_display: '7.5 - 9.2 triệu/tháng',
                quantity: 12,
                description: 'Điều phối giao thông giờ đón trả học sinh, kiểm soát khách đến liên hệ công tác và giữ gìn môi trường sư phạm an toàn tại Quận 7, Bình Thạnh.',
                requirements: 'Nam/Nữ 22–50 tuổi, thái độ thân thiện, chuẩn mực, biết lắng nghe và sẵn sàng hỗ trợ phụ huynh, giáo viên.',
                benefits: 'Làm việc trong môi trường văn minh, sạch sẽ; nghỉ phép 14 ngày/năm; đầy đủ chế độ bảo hiểm và quà sinh nhật, hiếu hỉ.',
                is_hot: 0
            },
            {
                title: 'Đội trưởng / Giám sát Mục tiêu An ninh Khu vực',
                department: 'Chỉ huy / Giám sát',
                location: 'Đà Nẵng',
                site_type: 'Trung tâm thương mại',
                shift_type: 'Giờ hành chính & Kiểm tra ca',
                salary_min: 12000000,
                salary_max: 16000000,
                salary_display: '12 - 16 triệu/tháng',
                quantity: 3,
                description: 'Quản lý quân số, sắp xếp lịch trực, huấn luyện nghiệp vụ tại chỗ cho nhân viên mục tiêu và trực tiếp phối hợp làm việc với ban quản lý khách hàng.',
                requirements: 'Tối thiểu 1 năm kinh nghiệm ở vị trí Ca trưởng/Đội trưởng bảo vệ hoặc bộ đội xuất ngũ cấp tiểu đội/trung đội trưởng; kỹ năng giao tiếp và báo cáo tốt.',
                benefits: 'Thu nhập cao + phụ cấp trách nhiệm, xăng xe, điện thoại; cơ hội thăng tiến lên Quản lý khu vực (AM/BM) theo lộ trình Securitas.',
                is_hot: 1
            }
        ];

        for (const job of defaultJobs) {
            await dbRun(
                `INSERT INTO jobs (title, department, location, site_type, shift_type, salary_min, salary_max, salary_display, quantity, description, requirements, benefits, is_hot, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')`,
                [
                    job.title,
                    job.department,
                    job.location,
                    job.site_type,
                    job.shift_type,
                    job.salary_min,
                    job.salary_max,
                    job.salary_display,
                    job.quantity,
                    job.description,
                    job.requirements,
                    job.benefits,
                    job.is_hot
                ]
            );
        }
    }
}

async function initializeDatabase() {
    await dbRun('PRAGMA foreign_keys = ON');
    await dbRun('PRAGMA busy_timeout = 5000');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await dbExec(schema);

    const userCols = await dbAll('PRAGMA table_info(users)');
    const hasRole = userCols.some((col) => col.name === 'role');
    if (!hasRole) {
        await dbRun("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'employee'");
    }

    await seedShifts();
    await seedDemoUsers();
    await seedJobs();
}

const initPromise = initializeDatabase().catch((err) => {
    console.error('Database initialization error:', err);
    throw err;
});

const ready = () => initPromise;

module.exports = { db, dbRun, dbGet, dbAll, ready };
