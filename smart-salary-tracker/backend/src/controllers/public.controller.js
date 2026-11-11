const { dbAll, dbGet, dbRun } = require('../database/db');
const {
    calculateNormalDay,
    calculateWeeklyOff,
    calculateHoliday
} = require('../utils/salaryCalculator');

function normalizePhone(rawPhone) {
    if (!rawPhone) return '';
    return String(rawPhone)
        .trim()
        .replace(/[\s\-().]/g, '')
        .replace(/^\+84/, '0');
}

function isValidPhone(normalized) {
    return /^0\d{8,10}$/.test(normalized) || /^\d{9,11}$/.test(normalized);
}

exports.getJobs = async (req, res) => {
    try {
        const { location, site_type, department, q } = req.query;
        let query = "SELECT * FROM jobs WHERE status = 'open'";
        const params = [];

        if (location && location !== 'all') {
            query += ' AND location = ?';
            params.push(location);
        }
        if (site_type && site_type !== 'all') {
            query += ' AND site_type = ?';
            params.push(site_type);
        }
        if (department && department !== 'all') {
            query += ' AND department = ?';
            params.push(department);
        }
        if (q && String(q).trim()) {
            const keyword = `%${String(q).trim()}%`;
            query += ' AND (title LIKE ? OR description LIKE ? OR location LIKE ? OR site_type LIKE ?)';
            params.push(keyword, keyword, keyword, keyword);
        }

        query += ' ORDER BY is_hot DESC, created_at DESC, id DESC';
        const jobs = await dbAll(query, params);
        res.json(jobs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi tải tin tuyển dụng' });
    }
};

exports.getJobById = async (req, res) => {
    try {
        const job = await dbGet('SELECT * FROM jobs WHERE id = ?', [req.params.id]);
        if (!job) {
            return res.status(404).json({ message: 'Không tìm thấy tin tuyển dụng' });
        }
        res.json(job);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

exports.createApplication = async (req, res) => {
    try {
        const {
            job_id,
            full_name,
            phone,
            birth_year,
            preferred_location,
            preferred_shift,
            has_cccd,
            experience_note
        } = req.body;

        if (!full_name || !String(full_name).trim()) {
            return res.status(400).json({ message: 'Vui lòng nhập họ và tên' });
        }

        const normalizedPhone = normalizePhone(phone);
        if (!isValidPhone(normalizedPhone)) {
            return res.status(400).json({ message: 'Số điện thoại không hợp lệ (cần 9–11 chữ số)' });
        }

        if (!preferred_location || !String(preferred_location).trim()) {
            return res.status(400).json({ message: 'Vui lòng chọn khu vực làm việc mong muốn' });
        }

        let validJobId = null;
        if (job_id !== undefined && job_id !== null && job_id !== '') {
            const job = await dbGet('SELECT id FROM jobs WHERE id = ?', [job_id]);
            if (!job) {
                return res.status(400).json({ message: 'Vị trí tuyển dụng không tồn tại' });
            }
            validJobId = job.id;
        }

        let parsedBirthYear = null;
        if (birth_year !== undefined && birth_year !== null && birth_year !== '') {
            const yr = Number(birth_year);
            const currentYear = new Date().getFullYear();
            if (!Number.isInteger(yr) || yr < 1955 || yr > currentYear - 16) {
                return res.status(400).json({ message: 'Năm sinh không hợp lệ' });
            }
            parsedBirthYear = yr;
        }

        const result = await dbRun(
            `INSERT INTO applications
             (job_id, full_name, phone, birth_year, preferred_location, preferred_shift, has_cccd, experience_note, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new')`,
            [
                validJobId,
                String(full_name).trim(),
                normalizedPhone,
                parsedBirthYear,
                String(preferred_location).trim(),
                preferred_shift ? String(preferred_shift).trim() : null,
                has_cccd === false || has_cccd === 0 ? 0 : 1,
                experience_note ? String(experience_note).trim() : null
            ]
        );

        res.status(201).json({
            id: result.id,
            message: 'Nộp hồ sơ thành công! Bộ phận Nhân sự Long Hải sẽ liên hệ trực tiếp (không thu phí).'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi gửi hồ sơ' });
    }
};

exports.createQuoteRequest = async (req, res) => {
    try {
        const {
            company_name,
            contact_name,
            phone,
            email,
            location,
            service_type,
            guard_count,
            notes
        } = req.body;

        if (!company_name || !String(company_name).trim()) {
            return res.status(400).json({ message: 'Vui lòng nhập tên công ty / tổ chức' });
        }
        if (!contact_name || !String(contact_name).trim()) {
            return res.status(400).json({ message: 'Vui lòng nhập tên người liên hệ' });
        }

        const normalizedPhone = normalizePhone(phone);
        if (!isValidPhone(normalizedPhone)) {
            return res.status(400).json({ message: 'Số điện thoại liên hệ không hợp lệ' });
        }

        if (!location || !String(location).trim()) {
            return res.status(400).json({ message: 'Vui lòng chọn khu vực mục tiêu cần bảo vệ' });
        }
        if (!service_type || !String(service_type).trim()) {
            return res.status(400).json({ message: 'Vui lòng chọn loại dịch vụ an ninh' });
        }

        let parsedGuardCount = null;
        if (guard_count !== undefined && guard_count !== null && guard_count !== '') {
            const cnt = Number(guard_count);
            if (!Number.isInteger(cnt) || cnt <= 0) {
                return res.status(400).json({ message: 'Số lượng nhân sự dự kiến phải lớn hơn 0' });
            }
            parsedGuardCount = cnt;
        }

        const result = await dbRun(
            `INSERT INTO quote_requests
             (company_name, contact_name, phone, email, location, service_type, guard_count, notes, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new')`,
            [
                String(company_name).trim(),
                String(contact_name).trim(),
                normalizedPhone,
                email ? String(email).trim() : null,
                String(location).trim(),
                String(service_type).trim(),
                parsedGuardCount,
                notes ? String(notes).trim() : null
            ]
        );

        res.status(201).json({
            id: result.id,
            message: 'Đã tiếp nhận yêu cầu khảo sát & báo giá. Chuyên viên Long Hải Securitas sẽ liên hệ sớm nhất.'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi gửi yêu cầu báo giá' });
    }
};

exports.estimateSalary = (req, res) => {
    try {
        const {
            shiftHours = 12,
            normalDays = 22,
            sundayDays = 4,
            holidayDays = 0,
            hourlyRate = 25529,
            mealAllowancePerDay = 30000
        } = req.body || {};

        const hours = Number(shiftHours);
        const nDays = Number(normalDays);
        const sDays = Number(sundayDays);
        const hDays = Number(holidayDays);
        const rate = Number(hourlyRate);
        const mealPerDay = Number(mealAllowancePerDay);

        if (![8, 12, 16].includes(hours)) {
            return res.status(400).json({ message: 'Số giờ ca làm việc phải là 8, 12 hoặc 16 giờ' });
        }
        if (
            !Number.isInteger(nDays) || nDays < 0 ||
            !Number.isInteger(sDays) || sDays < 0 ||
            !Number.isInteger(hDays) || hDays < 0
        ) {
            return res.status(400).json({ message: 'Số ngày làm việc phải là số nguyên không âm' });
        }

        const totalDays = nDays + sDays + hDays;
        if (totalDays > 31) {
            return res.status(400).json({ message: 'Tổng số ngày làm việc trong tháng không thể vượt quá 31 ngày' });
        }
        if (!Number.isFinite(rate) || rate <= 0) {
            return res.status(400).json({ message: 'Đơn giá giờ phải lớn hơn 0' });
        }
        if (!Number.isFinite(mealPerDay) || mealPerDay < 0) {
            return res.status(400).json({ message: 'Phụ cấp cơm ca không được âm' });
        }

        const normalPerShift = calculateNormalDay(hours, rate);
        const sundayPerShift = calculateWeeklyOff(hours, rate, 2);
        const holidayPerShift = calculateHoliday(hours, rate);

        const normalSalary = Math.round(nDays * normalPerShift.salary);
        const sundaySalary = Math.round(sDays * sundayPerShift.salary);
        const holidaySalary = Math.round(hDays * holidayPerShift.salary);
        const mealAllowance = Math.round(totalDays * mealPerDay);
        const estimatedTotal = normalSalary + sundaySalary + holidaySalary + mealAllowance;
        const totalHours = totalDays * hours;

        res.json({
            shiftHours: hours,
            hourlyRate: rate,
            totalDays,
            totalHours,
            breakdown: {
                normal: {
                    days: nDays,
                    perShiftSalary: Math.round(normalPerShift.salary),
                    regularHoursPerShift: normalPerShift.regularHours,
                    overtimeHoursPerShift: normalPerShift.overtimeHours,
                    totalSalary: normalSalary
                },
                sunday: {
                    days: sDays,
                    perShiftSalary: Math.round(sundayPerShift.salary),
                    totalSalary: sundaySalary
                },
                holiday: {
                    days: hDays,
                    perShiftSalary: Math.round(holidayPerShift.salary),
                    totalSalary: holidaySalary
                },
                mealAllowance: {
                    perDay: mealPerDay,
                    total: mealAllowance
                }
            },
            estimatedTotal
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi ước tính lương' });
    }
};
