# Design Specification: Website Thông Tin, Dịch Vụ An Ninh & Tuyển Dụng Long Hải Securitas (Hợp Nhất Cổng Nhân Viên)

**Ngày:** 2026-11-11  
**Nhánh Git:** `master`  
**Phạm vi dự án:** Nâng cấp trực tiếp trong `d:\HocTap\longhai\smart-salary-tracker`

---

## 1. Mục tiêu & Lý do (Intent & Why)

Chuyển đổi ứng dụng nội bộ `smart-salary-tracker` hiện tại thành nền tảng web hợp nhất cho **Công ty Cổ phần Dịch vụ Bảo vệ Long Hải (Securitas Vietnam)** dựa trên dữ liệu thực tế từ `securitaslonghai.vn`, phục vụ 3 nhóm người dùng trên cùng một hệ thống Full-stack:
1. **Khách hàng doanh nghiệp:** Tìm hiểu năng lực, dịch vụ an ninh và gửi yêu cầu khảo sát/báo giá trực tuyến.
2. **Ứng viên tìm việc bảo vệ / chỉ huy:** Tra cứu tin tuyển dụng theo khu vực và loại mục tiêu, ước tính trước mức thu nhập theo ca trực (8h/12h/16h, ngày thường/Chủ Nhật/Lễ), và nộp hồ sơ nhanh trong 30 giây với cam kết tuyển thẳng không thu phí.
3. **Nhân viên nội bộ & HR/Admin:** Nhân viên tiếp tục sử dụng bộ công cụ chấm ca, tính lương, quản lý chi tiêu tại `/nhan-vien`; nhân sự (HR) và kinh doanh sử dụng trang quản trị `/admin` để đăng tin tuyển dụng, xử lý hồ sơ ứng viên và yêu cầu báo giá.

### Mục tiêu cụ thể (Goals)
- Giao diện Public chuẩn nhận diện thương hiệu an ninh chuyên nghiệp (Navy `#0A192F`, Đỏ Securitas `#E30613`, Nền sáng `#F8FAFC`), tối ưu mobile-first.
- Dữ liệu doanh nghiệp, lịch sử từ 1995, dịch vụ, giá trị cốt lõi, chi nhánh và điều kiện tuyển dụng bám sát thông tin thật từ `securitaslonghai.vn`.
- Tái sử dụng [`salaryCalculator.js`](file:///d:/HocTap/longhai/smart-salary-tracker/backend/src/utils/salaryCalculator.js) làm nguồn sự thật duy nhất (Single Source of Truth) cho cả Cổng nhân viên lẫn công cụ **Ước tính thu nhập bảo vệ** công khai.
- Lưu trữ thực tế vào SQLite cho tin tuyển dụng, hồ sơ ứng viên, yêu cầu báo giá và tài khoản phân quyền (`employee` / `admin`).

### Ngoài phạm vi (Non-Goals)
- Không tích hợp cổng gửi Email/SMS thật hoặc tải lên file PDF/ảnh CCCD lên cloud storage.
- Không đa ngôn ngữ CMS hay chuyển đổi database sang PostgreSQL ở giai đoạn này.

### Ràng buộc không được vi phạm (Anti-Goals)
- Không làm hỏng các tính năng chấm ca, tính lương, chi tiêu hiện tại của nhân viên hoặc bộ unit test của `salaryCalculator`.
- Không dùng nội dung giả (Lorem Ipsum) hay form nộp đơn "chỉ hiện thông báo giả lập" mà không lưu DB.

---

## 2. Phương án kiến trúc đã chọn (Approaches)

Đã đánh giá 3 phương án:
1. **Phương án 1 (Được chọn): Hợp nhất Web Công ty + Tuyển dụng + Cổng nhân viên trên nền Full-stack hiện có.** Mở rộng Backend Express + SQLite và Frontend React + Vite + Tailwind v4 để phục vụ cả trang Public, Cổng nhân viên (`/nhan-vien`) và Admin (`/admin`). Tận dụng tối đa hạ tầng sẵn có và biến bộ tính lương thành tính năng nổi bật cho trang tuyển dụng.
2. **Phương án 2: Thay thế hoàn toàn app Tính lương/Chi tiêu bằng Web Tuyển dụng thuần.** Bỏ phí module tính lương đã kiểm thử tốt.
3. **Phương án 3: Web tĩnh Frontend thuần.** Không lưu được hồ sơ ứng viên hay yêu cầu báo giá vào database, thiếu tính thực tế.

---

## 3. Ràng buộc kỹ thuật & Cấu hình (Global Constraints)

- **Stack giữ nguyên:** Frontend `React 19 + Vite 8 + Tailwind CSS v4 + React Router v7 + Axios + Lucide React`; Backend `Node.js + Express 5 + SQLite3 + bcrypt + jsonwebtoken + Jest`.
- **Công thức tính lương tập trung:** Mọi phép tính lương (kể cả công cụ ước tính công khai) phải chạy qua [`salaryCalculator.js`](file:///d:/HocTap/longhai/smart-salary-tracker/backend/src/utils/salaryCalculator.js), không viết công thức lương trùng lặp ở Frontend.
- **Khởi tạo DB an toàn & có thể test:** [`db.js`](file:///d:/HocTap/longhai/smart-salary-tracker/backend/src/database/db.js) bật `PRAGMA foreign_keys = ON;`, xuất `initPromise` (hoặc `ready()`) để `server.js` và test integration đảm bảo schema + seed hoàn tất trước khi nhận request; nâng cấp an toàn cột `users.role` bằng `PRAGMA table_info(users)` nếu DB cũ đã tồn tại. Hỗ trợ biến môi trường `DB_PATH` để test integration chạy trên SQLite tạm/riêng biệt mà không làm bẩn `database.sqlite` dev.
- **Tách App khỏi Listen:** Tạo `backend/src/app.js` xuất Express `app` (để Jest + Supertest test trực tiếp), còn `server.js` gọi `await ready()` rồi mới `app.listen(PORT)`.
- **Cấu hình API URL linh hoạt:** [`api.js`](file:///d:/HocTap/longhai/smart-salary-tracker/frontend/src/services/api.js) dùng `import.meta.env.VITE_API_URL || 'http://localhost:5000/api'`.
- **Sửa lỗi đăng ký tồn đọng:** Trong [`auth.controller.js`](file:///d:/HocTap/longhai/smart-salary-tracker/backend/src/controllers/auth.controller.js), chuẩn hóa `employee_code` rỗng (`""`) thành `null` để tránh lỗi trùng khóa `UNIQUE` khi nhiều người đăng ký không nhập mã nhân viên.
- **Cổng demo an toàn:** Trên trang `/login`, các nút điền nhanh tài khoản demo (`admin@securitaslonghai.vn` / `Admin@123` và `nhanvien@securitaslonghai.vn` / `123456`) hiển thị khi `import.meta.env.VITE_ENABLE_DEMO_LOGIN !== 'false'` (mặc định bật cho bản demo, có thể tắt bằng env khi deploy production).
- **Git hygiene:** Tạo `.gitignore` tại root repo (`d:\HocTap\longhai\.gitignore`) để loại trừ `node_modules/`, `database.sqlite`, `.env`, `dist/`, `coverage/`.

---

## 4. Dữ liệu Doanh nghiệp & Chi nhánh Chính thức (từ `securitaslonghai.vn`)

- **Tên chính thức:** Công ty Cổ phần Dịch vụ Bảo vệ Long Hải (Long Hải Securitas / Securitas Vietnam)
- **Mục đích / Sứ mệnh:** *"Chúng tôi giúp thế giới trở nên an toàn hơn"*
- **3 Giá trị cốt lõi:** Liêm chính (*Integrity*), Cảnh giác (*Vigilance*), Sẵn sàng giúp đỡ (*Helpfulness*)
- **Lịch sử & Quy mô:**
  - Thành lập tháng 9–10/1995 bởi cố Thiếu tướng Phan Văn Xoàn (nguyên Tư lệnh Bộ Tư lệnh Cảnh vệ - Bộ Công an) với đội ngũ 44–45 nhân viên đầu tiên.
  - Năm 2009: Ký kết liên doanh chiến lược với Tập đoàn an ninh toàn cầu **Securitas AB (Thụy Điển)**.
  - Hiện tại: Gần **3.000 nhân viên** hoạt động tại **19+ tỉnh/thành phố**, vận hành hệ thống quản lý chất lượng theo tiêu chuẩn **ISO 9001**.
- **Hệ thống Trụ sở & Chi nhánh:**
  1. **Trụ sở chính & Chi nhánh TP. Hồ Chí Minh:** 108–110 Nguyễn Văn Trỗi, Phường 8, Quận Phú Nhuận, TP. Hồ Chí Minh | Hotline: `028 3997 6009` | Email: `info@securityvietnam.com` / `longhaisecuritas.vn@gmail.com`
  2. **Chi nhánh Hà Nội:** Số 53 Đường Nguyễn Xiển, TP. Hà Nội | Hotline: `024 3762 4523`
  3. **Chi nhánh Bình Dương:** Số 93 Đường N3, Khu Phố Thống Nhất 1, TP. Dĩ An, Bình Dương | Hotline: `0274 6283 466`
  4. **Chi nhánh Đồng Nai:** 90/2A Đường Hàn Thuyên, Khu Phố 3, TP. Biên Hòa, Đồng Nai | Hotline: `0251 6585 330`
  5. **Chi nhánh Đà Nẵng:** Số 81 Nguyễn Duy, Quận Cẩm Lệ, TP. Đà Nẵng | Hotline: `0236 3634 119`
- **Khách hàng tiêu biểu:** Đại sứ quán Kuwait, Văn phòng Quốc hội (phía Nam), Vedan Việt Nam, Honda Việt Nam, Toyota Việt Nam, Fujitsu Việt Nam, Samsung, LG, Panasonic, Becamex IDC, Hòa Bình Corp, Eximbank, Cà phê Trung Nguyên.

---

## 5. Thiết kế Cơ sở dữ liệu (SQLite Schema Additions)

### 5.1. Cập nhật bảng `users` & Seed Demo
- Bổ sung cột: `role TEXT NOT NULL DEFAULT 'employee'` (`'employee'` | `'admin'`).
- Seed 2 tài khoản demo (chỉ chèn nếu email chưa tồn tại), **kèm đủ `salary_settings` và 6 `expense_categories` mặc định cho cả 2 tài khoản** để cả `admin` và `employee` đều truy cập được `/nhan-vien` không lỗi:
  - HR Admin: `admin@securitaslonghai.vn` / `Admin@123` (`role = 'admin'`, mã `LH-ADM01`)
  - Nhân viên mẫu: `nhanvien@securitaslonghai.vn` / `123456` (`role = 'employee'`, mã `LH-NV001`)

### 5.2. Bảng `jobs` (Tin tuyển dụng)
```sql
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
```
Seed sẵn 6 tin tuyển dụng thực tế (chỉ seed khi `COUNT(*) = 0`) tại TP.HCM, Bình Dương, Đồng Nai, Hà Nội, Đà Nẵng và vị trí Đội trưởng/Giám sát mục tiêu.

### 5.3. Bảng `applications` (Hồ sơ ứng tuyển nhanh)
```sql
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
```
Trạng thái hợp lệ: `new`, `contacted`, `interviewed`, `hired`, `rejected`.

### 5.4. Bảng `quote_requests` (Yêu cầu báo giá dịch vụ an ninh)
```sql
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
```
Trạng thái hợp lệ: `new`, `consulting`, `quoted`, `closed`.

---

## 6. Thiết kế Backend API

### 6.1. Public API (`/api/public/*` - Không cần token)
- `GET /api/public/jobs`: Hỗ trợ query `location`, `site_type`, `department`, `q`. Chỉ trả tin `status = 'open'`, sắp xếp `is_hot DESC, created_at DESC`.
- `GET /api/public/jobs/:id`: Trả chi tiết tin (`404` nếu không tồn tại).
- `POST /api/public/applications`: Validate `full_name` (không rỗng), `phone` (9–11 chữ số sau khi bỏ dấu cách/gạch ngang), `preferred_location` (không rỗng); nếu có `job_id` kiểm tra job tồn tại (`400` nếu không tồn tại). Trả `201` kèm `{ id, message }`.
- `POST /api/public/quotes`: Validate `company_name`, `contact_name`, `phone` (9–11 chữ số), `location`, `service_type` bắt buộc; `guard_count` nếu có phải là số nguyên `> 0`. Trả `201` kèm `{ id, message }`.
- `POST /api/public/salary-estimate`:
  - Body: `{ shiftHours (8|12|16), normalDays (0..31), sundayDays (0..31), holidayDays (0..31), hourlyRate = 25529, mealAllowancePerDay = 30000 }`.
  - Validate: `shiftHours` thuộc `[8, 12, 16]`; các số ngày nguyên không âm và `normalDays + sundayDays + holidayDays <= 31`; `hourlyRate > 0`; `mealAllowancePerDay >= 0`.
  - Gọi `calculateNormalDay`, `calculateWeeklyOff`, `calculateHoliday` từ [`salaryCalculator.js`](file:///d:/HocTap/longhai/smart-salary-tracker/backend/src/utils/salaryCalculator.js):
    - `normalPerShift = calculateNormalDay(shiftHours, hourlyRate)`
    - `sundayPerShift = calculateWeeklyOff(shiftHours, hourlyRate, 2)`
    - `holidayPerShift = calculateHoliday(shiftHours, hourlyRate)`
    - `totalDays = normalDays + sundayDays + holidayDays`
    - `totalAllowance = totalDays * mealAllowancePerDay`
    - `estimatedTotal = Math.round(normalDays * normalPerShift.salary + sundayDays * sundayPerShift.salary + holidayDays * holidayPerShift.salary + totalAllowance)`
  - Trả JSON: `{ shiftHours, hourlyRate, totalDays, totalHours, breakdown: { normal: {...}, sunday: {...}, holiday: {...}, mealAllowance: totalAllowance }, estimatedTotal }`.

### 6.2. Auth & RBAC (`/api/auth/*`)
- `register`: Chuẩn hóa `employee_code` rỗng thành `null`, tạo user với `role = 'employee'`.
- `login` & `getMe`: Trả về thêm `role`.
- `requireAdmin` trong [`auth.middleware.js`](file:///d:/HocTap/longhai/smart-salary-tracker/backend/src/middleware/auth.middleware.js): Đọc `role` từ bảng `users` theo `req.userId`, trả `403` nếu `role !== 'admin'`.

### 6.3. Admin API (`/api/admin/*` - `authMiddleware` + `requireAdmin`)
- `GET /api/admin/stats`: `{ openJobs, totalJobs, newApplications, totalApplications, newQuotes, totalQuotes }`.
- `GET /api/admin/jobs`, `POST /api/admin/jobs`, `PUT /api/admin/jobs/:id`, `DELETE /api/admin/jobs/:id` (khi xóa job, đảm bảo gỡ liên kết `applications.job_id = NULL` hoặc `ON DELETE SET NULL`).
- `GET /api/admin/applications`, `PATCH /api/admin/applications/:id` (validate `status` trong whitelist).
- `GET /api/admin/quotes`, `PATCH /api/admin/quotes/:id` (validate `status` trong whitelist).

### 6.4. Employee Portal API (Giữ nguyên 100%)
- `/api/shifts`, `/api/schedules`, `/api/expenses`, `/api/dashboard`, `/api/settings` giữ nguyên contract cho cả `employee` và `admin`.

---

## 7. Thiết kế Giao diện Frontend (Routes & Components)

### 7.1. Định tuyến & Bảo vệ Route (`App.jsx`)
- **Public (`PublicLayout.jsx`):**
  - `/` -> `HomePage.jsx`
  - `/gioi-thieu` -> `AboutPage.jsx`
  - `/dich-vu` -> `ServicesPage.jsx`
  - `/tuyen-dung` -> `RecruitmentPage.jsx`
  - `/lien-he` -> `ContactPage.jsx`
- **Auth:**
  - `/login` -> `Login.jsx` (nếu đã login: điều hướng `admin` -> `/admin`, `employee` -> `/nhan-vien`)
  - `/register` -> `Register.jsx`
- **Employee Portal (`MainLayout.jsx`, mọi user đã đăng nhập):**
  - `/nhan-vien` -> `Dashboard.jsx` (cập nhật link `+ THÊM CHI TIÊU` -> `/nhan-vien/expenses`, `+ NHẬP CA` -> `/nhan-vien/schedule`)
  - `/nhan-vien/schedule` -> `Schedule.jsx`
  - `/nhan-vien/expenses` -> `Expenses.jsx`
  - `/nhan-vien/settings` -> `Settings.jsx`
  - `MainLayout.jsx`: Cập nhật `navItems` sang `/nhan-vien/*`, thêm nút "Trang chủ Long Hải" (`/`) và nếu `user.role === 'admin'` hiển thị thêm nút "Quản trị HR" (`/admin`).
- **Admin HR Portal (`/admin`, yêu cầu `user?.role === 'admin'`):**
  - Nếu chưa đăng nhập -> điều hướng `/login`. Nếu là `employee` -> điều hướng `/nhan-vien` (không cho truy cập `/admin`).
  - `AdminDashboard.jsx`: 4 thẻ thống kê + 3 tab (`Hồ sơ ứng viên`, `Yêu cầu báo giá`, `Quản lý tin tuyển dụng`).

---

## 8. Kế hoạch kiểm thử & Xác minh

- **Backend Unit & Integration Tests (Jest + Supertest):**
  - `salaryCalculator.test.js` pass 100%.
  - `api.integration.test.js`: Test với file SQLite test riêng (`DB_PATH`), phủ:
    1. Public jobs filter + detail + 404.
    2. Quick application validation (thiếu trường, SĐT sai) + lưu DB thành công.
    3. Quote request validation + lưu DB thành công.
    4. Public salary estimator khớp công thức `salaryCalculator.js` & chặn tổng ngày > 31.
    5. Auth đăng ký 2 tài khoản liên tiếp bỏ trống `employee_code` không lỗi `UNIQUE`.
    6. RBAC: `employee` gọi `/api/admin/*` bị `403`, `admin` CRUD jobs / cập nhật trạng thái ứng viên & báo giá thành công, xóa job không lỗi khóa ngoại với application gắn kèm.
- **Frontend Verification:**
  - `npm run build` (`vite build`) thành công exit code 0.
- **Live E2E Smoke Verification:**
  - Chạy Backend + kiểm tra API thật bằng HTTP request.
