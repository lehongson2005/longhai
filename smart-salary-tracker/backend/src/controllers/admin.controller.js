const { dbAll, dbGet, dbRun } = require('../database/db');

const VALID_APP_STATUSES = ['new', 'contacted', 'interviewed', 'hired', 'rejected'];
const VALID_QUOTE_STATUSES = ['new', 'consulting', 'quoted', 'closed'];
const VALID_JOB_STATUSES = ['open', 'closed'];

exports.getStats = async (req, res) => {
    try {
        const [openJobsRow, totalJobsRow, newAppsRow, totalAppsRow, newQuotesRow, totalQuotesRow] = await Promise.all([
            dbGet("SELECT COUNT(*) as count FROM jobs WHERE status = 'open'"),
            dbGet('SELECT COUNT(*) as count FROM jobs'),
            dbGet("SELECT COUNT(*) as count FROM applications WHERE status = 'new'"),
            dbGet('SELECT COUNT(*) as count FROM applications'),
            dbGet("SELECT COUNT(*) as count FROM quote_requests WHERE status = 'new'"),
            dbGet('SELECT COUNT(*) as count FROM quote_requests')
        ]);

        res.json({
            openJobs: openJobsRow?.count || 0,
            totalJobs: totalJobsRow?.count || 0,
            newApplications: newAppsRow?.count || 0,
            totalApplications: totalAppsRow?.count || 0,
            newQuotes: newQuotesRow?.count || 0,
            totalQuotes: totalQuotesRow?.count || 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi tải thống kê' });
    }
};

exports.getAllJobs = async (req, res) => {
    try {
        const jobs = await dbAll('SELECT * FROM jobs ORDER BY is_hot DESC, created_at DESC, id DESC');
        res.json(jobs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi tải danh sách việc làm' });
    }
};

exports.createJob = async (req, res) => {
    try {
        const {
            title,
            department = 'Bảo vệ mục tiêu',
            location,
            site_type = 'Tòa nhà văn phòng',
            shift_type = 'Ca 8h / 12h linh hoạt',
            salary_min = 7500000,
            salary_max = 12000000,
            salary_display,
            quantity = 10,
            description,
            requirements,
            benefits,
            is_hot = 0,
            status = 'open'
        } = req.body;

        if (!title || !String(title).trim() || !location || !String(location).trim()) {
            return res.status(400).json({ message: 'Tiêu đề và địa điểm là bắt buộc' });
        }

        const minSal = Number(salary_min);
        const maxSal = Number(salary_max);
        if (!Number.isFinite(minSal) || !Number.isFinite(maxSal) || minSal < 0 || maxSal < minSal) {
            return res.status(400).json({ message: 'Khoảng lương không hợp lệ' });
        }

        const jobStatus = VALID_JOB_STATUSES.includes(status) ? status : 'open';
        const display =
            salary_display && String(salary_display).trim()
                ? String(salary_display).trim()
                : `${(minSal / 1000000).toFixed(1)} - ${(maxSal / 1000000).toFixed(1)} triệu/tháng`;

        const result = await dbRun(
            `INSERT INTO jobs (title, department, location, site_type, shift_type, salary_min, salary_max, salary_display, quantity, description, requirements, benefits, is_hot, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                String(title).trim(),
                String(department).trim(),
                String(location).trim(),
                String(site_type).trim(),
                String(shift_type).trim(),
                minSal,
                maxSal,
                display,
                Number(quantity) || 1,
                description ? String(description).trim() : 'Thực hiện nhiệm vụ bảo vệ mục tiêu theo quy chuẩn Securitas.',
                requirements ? String(requirements).trim() : 'Từ 18–50 tuổi, có CCCD gắn chip, sức khỏe tốt.',
                benefits ? String(benefits).trim() : 'Đầy đủ BHXH/BHYT/BHTN, BHTN 24/7, lương tháng 13, không thu phí.',
                is_hot ? 1 : 0,
                jobStatus
            ]
        );

        res.status(201).json({ id: result.id, message: 'Tạo tin tuyển dụng thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi tạo tin tuyển dụng' });
    }
};

exports.updateJob = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await dbGet('SELECT * FROM jobs WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({ message: 'Không tìm thấy tin tuyển dụng' });
        }

        const {
            title = existing.title,
            department = existing.department,
            location = existing.location,
            site_type = existing.site_type,
            shift_type = existing.shift_type,
            salary_min = existing.salary_min,
            salary_max = existing.salary_max,
            salary_display = existing.salary_display,
            quantity = existing.quantity,
            description = existing.description,
            requirements = existing.requirements,
            benefits = existing.benefits,
            is_hot = existing.is_hot,
            status = existing.status
        } = req.body;

        if (!VALID_JOB_STATUSES.includes(status)) {
            return res.status(400).json({ message: 'Trạng thái tin tuyển dụng không hợp lệ' });
        }

        const minSal = Number(salary_min);
        const maxSal = Number(salary_max);
        if (!Number.isFinite(minSal) || !Number.isFinite(maxSal) || minSal < 0 || maxSal < minSal) {
            return res.status(400).json({ message: 'Khoảng lương không hợp lệ' });
        }

        await dbRun(
            `UPDATE jobs
             SET title = ?, department = ?, location = ?, site_type = ?, shift_type = ?,
                 salary_min = ?, salary_max = ?, salary_display = ?, quantity = ?,
                 description = ?, requirements = ?, benefits = ?, is_hot = ?, status = ?
             WHERE id = ?`,
            [
                String(title).trim(),
                String(department).trim(),
                String(location).trim(),
                String(site_type).trim(),
                String(shift_type).trim(),
                minSal,
                maxSal,
                String(salary_display).trim(),
                Number(quantity) || 1,
                String(description).trim(),
                String(requirements).trim(),
                String(benefits).trim(),
                is_hot ? 1 : 0,
                status,
                id
            ]
        );

        res.json({ message: 'Cập nhật tin tuyển dụng thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật tin tuyển dụng' });
    }
};

exports.deleteJob = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await dbGet('SELECT id FROM jobs WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({ message: 'Không tìm thấy tin tuyển dụng' });
        }

        await dbRun('UPDATE applications SET job_id = NULL WHERE job_id = ?', [id]);
        await dbRun('DELETE FROM jobs WHERE id = ?', [id]);

        res.json({ message: 'Đã xóa tin tuyển dụng' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi xóa tin tuyển dụng' });
    }
};

exports.getApplications = async (req, res) => {
    try {
        const { status } = req.query;
        let query = `
            SELECT a.*, j.title as job_title
            FROM applications a
            LEFT JOIN jobs j ON a.job_id = j.id
        `;
        const params = [];

        if (status && status !== 'all') {
            query += ' WHERE a.status = ?';
            params.push(status);
        }

        query += ' ORDER BY a.created_at DESC, a.id DESC';
        const rows = await dbAll(query, params);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi tải danh sách ứng viên' });
    }
};

exports.updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, admin_note } = req.body;

        const existing = await dbGet('SELECT * FROM applications WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({ message: 'Không tìm thấy hồ sơ ứng viên' });
        }

        const nextStatus = status || existing.status;
        if (!VALID_APP_STATUSES.includes(nextStatus)) {
            return res.status(400).json({ message: 'Trạng thái hồ sơ không hợp lệ' });
        }

        const nextNote = admin_note !== undefined ? admin_note : existing.admin_note;

        await dbRun(
            'UPDATE applications SET status = ?, admin_note = ? WHERE id = ?',
            [nextStatus, nextNote, id]
        );
        res.json({ message: 'Cập nhật hồ sơ ứng viên thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

exports.getQuotes = async (req, res) => {
    try {
        const { status } = req.query;
        let query = 'SELECT * FROM quote_requests';
        const params = [];

        if (status && status !== 'all') {
            query += ' WHERE status = ?';
            params.push(status);
        }

        query += ' ORDER BY created_at DESC, id DESC';
        const rows = await dbAll(query, params);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ khi tải danh sách báo giá' });
    }
};

exports.updateQuoteStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, admin_note } = req.body;

        const existing = await dbGet('SELECT * FROM quote_requests WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({ message: 'Không tìm thấy yêu cầu báo giá' });
        }

        const nextStatus = status || existing.status;
        if (!VALID_QUOTE_STATUSES.includes(nextStatus)) {
            return res.status(400).json({ message: 'Trạng thái báo giá không hợp lệ' });
        }

        const nextNote = admin_note !== undefined ? admin_note : existing.admin_note;

        await dbRun(
            'UPDATE quote_requests SET status = ?, admin_note = ? WHERE id = ?',
            [nextStatus, nextNote, id]
        );
        res.json({ message: 'Cập nhật yêu cầu báo giá thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};
