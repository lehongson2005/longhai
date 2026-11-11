# Long Hải Securitas Corporate Info, Recruitment & Employee Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or subagent-driven-development) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nâng cấp `smart-salary-tracker` thành nền tảng hợp nhất gồm Website Thông tin & Dịch vụ An ninh Công ty Bảo vệ Long Hải (Securitas Vietnam), Cổng Tuyển dụng (kèm công cụ Ước tính thu nhập từ `salaryCalculator.js`), Trang quản trị HR (`/admin`) và Cổng nhân viên (`/nhan-vien`).

**Architecture:** Mở rộng Backend Express 5 + SQLite3 hiện tại (tách `app.js` khỏi `server.js`, xuất `ready()` để khởi tạo DB có thứ tự, thêm bảng `jobs`, `applications`, `quote_requests` và cột `users.role`, cung cấp API `/api/public/*` và `/api/admin/*`). Frontend React 19 + Vite 8 + Tailwind v4 tách thành `PublicLayout` (5 trang giới thiệu/dịch vụ/tuyển dụng/liên hệ), `MainLayout` (`/nhan-vien/*`), và `AdminDashboard` (`/admin`).

**Tech Stack:** React 19, Vite 8, Tailwind CSS v4, React Router v7, Axios, Lucide React, Node.js, Express 5, SQLite3, bcrypt, jsonwebtoken, Jest, Supertest.

**Spec:** `d:\HocTap\longhai\docs\superpowers\specs\2026-11-11-securitas-longhai-web-design.md`

## Global Constraints

- Công thức tính lương tập trung: mọi phép tính lương (kể cả ước tính công khai) phải đi qua `backend/src/utils/salaryCalculator.js`, không lặp lại ở Frontend.
- DB compatibility & readiness: bật `PRAGMA foreign_keys = ON;`, xuất `ready()` promise từ `db.js`, nâng cấp an toàn cột `users.role` bằng `PRAGMA table_info(users)`, hỗ trợ `process.env.DB_PATH` để test độc lập.
- Sửa lỗi `employee_code`: chuẩn hóa chuỗi rỗng `""` thành `null` khi đăng ký để tránh lỗi `SQLITE_CONSTRAINT` ở tài khoản thứ 2 trở đi.
- Seed tài khoản demo (`admin@securitaslonghai.vn` / `Admin@123` và `nhanvien@securitaslonghai.vn` / `123456`) kèm đầy đủ `salary_settings` và `expense_categories` mặc định.
- Cấu hình API URL động: `frontend/src/services/api.js` dùng `import.meta.env.VITE_API_URL || 'http://localhost:5000/api'`.
- Git hygiene: root `.gitignore` loại trừ `node_modules/`, `database.sqlite`, `.env`, `dist/`, `coverage/`.

## Review Focus

1. **Đăng ký nhiều nhân viên bỏ trống `employee_code` (`""`):** phải lưu `NULL` trong SQLite thay vì `""` để không vấp `UNIQUE` constraint ở người đăng ký thứ 2 (`Task 3`).
2. **Tổng số ngày trong `POST /api/public/salary-estimate` vượt quá 31 hoặc âm:** phải trả `400` với thông báo tiếng Việt rõ ràng thay vì trả con số vô nghĩa (`Task 4`).
3. **Số điện thoại ứng viên / khách hàng chứa dấu cách/chấm hoặc quá ngắn (`"123"`):** chuẩn hóa khoảng trắng/gạch ngang trước khi kiểm tra 9–11 chữ số, từ chối SĐT không hợp lệ bằng `400` (`Task 4`).
4. **Xóa tin tuyển dụng (`DELETE /api/admin/jobs/:id`) đã có đơn ứng tuyển (`applications.job_id`):** không được lỗi khóa ngoại `SQLITE_CONSTRAINT`; `applications.job_id` chuyển về `NULL` và giữ nguyên hồ sơ ứng viên (`Task 5`).
5. **User `employee` gọi `/api/admin/*` hoặc truy cập `/admin`:** API trả `403`, giao diện Frontend tự chuyển hướng về `/nhan-vien` (`Task 3`, `Task 5`, `Task 11`).

---

## File Structure

### Backend (`smart-salary-tracker/backend/`)
- Create: `.gitignore` tại `d:\HocTap\longhai\.gitignore`
- Modify: `src/database/schema.sql` — thêm `role` trong `users`, thêm bảng `jobs`, `applications`, `quote_requests`
- Modify: `src/database/db.js` — hỗ trợ `DB_PATH`, `PRAGMA foreign_keys = ON`, `ready()`, migration `users.role`, seed 2 user demo (kèm settings & categories) và 6 tin tuyển dụng thực tế
- Create: `src/app.js` — cấu hình Express routes (tách khỏi `listen`)
- Modify: `server.js` — đợi `ready()` rồi gọi `app.listen()`
- Modify: `src/middleware/auth.middleware.js` — thêm `requireAdmin`
- Modify: `src/controllers/auth.controller.js` — fix `employee_code || null`, trả `role` ở `login` và `getMe`
- Create: `src/controllers/public.controller.js` — `getJobs`, `getJobById`, `createApplication`, `createQuoteRequest`, `estimateSalary`
- Create: `src/routes/public.routes.js`
- Create: `src/controllers/admin.controller.js` — `getStats`, `getAllJobs`, `createJob`, `updateJob`, `deleteJob`, `getApplications`, `updateApplicationStatus`, `getQuotes`, `updateQuoteStatus`
- Create: `src/routes/admin.routes.js`
- Test: `src/tests/api.integration.test.js` — kiểm thử tích hợp toàn bộ API với Supertest

### Frontend (`smart-salary-tracker/frontend/`)
- Modify: `index.html` — đổi `lang="vi"` và title chuẩn Long Hải Securitas
- Modify: `src/index.css` — bổ sung biến/tiện ích màu thương hiệu (`#0A192F`, `#E30613`) và font mượt
- Modify: `src/services/api.js` — dùng `import.meta.env.VITE_API_URL || 'http://localhost:5000/api'`
- Create: `src/services/publicService.js` — gọi `/public/jobs`, `/public/applications`, `/public/quotes`, `/public/salary-estimate`
- Create: `src/services/adminService.js` — gọi `/admin/stats`, `/admin/jobs`, `/admin/applications`, `/admin/quotes`
- Create: `src/data/companyData.js` — dữ liệu chính xác từ `securitaslonghai.vn` (lịch sử, sứ mệnh, 3 giá trị cốt lõi, 5 nhóm dịch vụ, ngành mục tiêu, 5 chi nhánh, khách hàng tiêu biểu, phúc lợi ứng viên)
- Create: `src/components/BrandLogo.jsx` — logo Long Hải Securitas (khiên + 3 chấm đỏ)
- Create: `src/components/SalaryEstimatorWidget.jsx` — widget tính thử lương ca 8h/12h/16h gọi `POST /api/public/salary-estimate`
- Create: `src/components/QuickApplyModal.jsx` — modal ứng tuyển 30 giây gọi `POST /api/public/applications`
- Create: `src/components/QuoteRequestForm.jsx` — form yêu cầu báo giá dịch vụ an ninh gọi `POST /api/public/quotes`
- Create: `src/layouts/PublicLayout.jsx` — Navbar + Mobile Bottom Quick Bar + Footer
- Create: `src/pages/public/HomePage.jsx`
- Create: `src/pages/public/AboutPage.jsx`
- Create: `src/pages/public/ServicesPage.jsx`
- Create: `src/pages/public/RecruitmentPage.jsx`
- Create: `src/pages/public/ContactPage.jsx`
- Create: `src/pages/admin/AdminDashboard.jsx`
- Modify: `src/pages/Login.jsx` — điều hướng theo `role`, nút quay về trang chủ, nút chọn tài khoản demo (khi `VITE_ENABLE_DEMO_LOGIN !== 'false'`)
- Modify: `src/pages/Register.jsx` — đồng bộ giao diện Long Hải Securitas
- Modify: `src/layouts/MainLayout.jsx` — cập nhật route `/nhan-vien/*`, thêm link Trang chủ & Admin
- Modify: `src/pages/Dashboard.jsx` — cập nhật link `+ THÊM CHI TIÊU` (`/nhan-vien/expenses`) và `+ NHẬP CA` (`/nhan-vien/schedule`)
- Modify: `src/App.jsx` — tích hợp toàn bộ routes Public, Auth, `/nhan-vien/*`, `/admin`
- Modify: `smart-salary-tracker/README.md` — cập nhật tài liệu hướng dẫn chạy, tài khoản demo và kiến trúc mới

---

### Task 1: Thiết lập Git Hygiene, Test Dependency & Kiểm tra Baseline

**Files:**
- Create: `d:\HocTap\longhai\.gitignore`
- Modify: `smart-salary-tracker/backend/package.json`

- [ ] **Step 1:** Tạo `d:\HocTap\longhai\.gitignore` loại trừ `node_modules/`, `database.sqlite`, `.env`, `dist/`, `coverage/`.
- [ ] **Step 2:** Cài `supertest` trong `smart-salary-tracker/backend` bằng `cmd /c "npm install --save-dev supertest"`.
- [ ] **Step 3:** Chạy `cmd /c "npm test"` tại `backend` để xác nhận `salaryCalculator.test.js` pass 7/7 tests trước khi sửa code.

---

### Task 2: Mở rộng Database Schema, `ready()`, Migration & Seed Data (`db.js` + `schema.sql`)

**Files:**
- Modify: `smart-salary-tracker/backend/src/database/schema.sql`
- Modify: `smart-salary-tracker/backend/src/database/db.js`
- Create: `smart-salary-tracker/backend/src/app.js`
- Modify: `smart-salary-tracker/backend/server.js`

**Interfaces:**
- Produces from `db.js`: `{ db, dbRun, dbGet, dbAll, ready }` where `ready()` returns a Promise resolving after schema creation, `users.role` migration, shift seeding, demo user seeding (with `salary_settings` & `expense_categories`), and 6 default jobs seeding.
- Produces from `app.js`: Express `app` instance (not listening).

- [ ] **Step 1 (RED):** Viết test đầu tiên trong `backend/src/tests/api.integration.test.js` kiểm tra `ready()` khởi tạo đủ các bảng `users`, `jobs`, `applications`, `quote_requests`, cột `users.role`, và seed sẵn `>= 6` jobs cùng 2 demo users có `salary_settings`.
- [ ] **Step 2:** Chạy `cmd /c "npx jest src/tests/api.integration.test.js"` -> Expected: FAIL vì chưa có `app.js` / `ready()` / bảng mới.
- [ ] **Step 3 (GREEN):** Cập nhật `schema.sql`, viết lại phần init/migration/seed trong `db.js` (hỗ trợ `process.env.DB_PATH`, bật `PRAGMA foreign_keys = ON;`, hàm `ready()` dùng async/await tuần tự tránh race condition), tạo `src/app.js` và cập nhật `server.js` gọi `ready().then(...)`.
- [ ] **Step 4:** Chạy test -> Expected: PASS.

---

### Task 3: Cập nhật Auth (`employee_code || null`, `role` & `requireAdmin`)

**Files:**
- Modify: `smart-salary-tracker/backend/src/controllers/auth.controller.js`
- Modify: `smart-salary-tracker/backend/src/middleware/auth.middleware.js`
- Test: `smart-salary-tracker/backend/src/tests/api.integration.test.js`

**Interfaces:**
- Produces in `auth.middleware.js`: `{ authMiddleware, requireAdmin }`.
- Produces in `auth.controller.js`: `login` & `getMe` trả user gồm `{ id, name, email, employee_code, role }`.

- [ ] **Step 1 (RED):** Thêm test case trong `api.integration.test.js`:
  - Đăng ký 2 user liên tiếp với `employee_code: ""` đều trả `201`.
  - Đăng nhập user demo `employee` trả `user.role === 'employee'`; đăng nhập `admin` trả `user.role === 'admin'`.
  - `GET /api/auth/me` trả về `role`.
- [ ] **Step 2:** Chạy test -> Expected: FAIL vì user thứ 2 lỗi 500 `UNIQUE` và response chưa có `role`.
- [ ] **Step 3 (GREEN):** Cập nhật `auth.controller.js` và thêm `requireAdmin` vào `auth.middleware.js`.
- [ ] **Step 4:** Chạy test -> Expected: PASS.

---

### Task 4: Public API (`/api/public/*`: Jobs, Quick Apply, Quote Requests, Salary Estimator)

**Files:**
- Create: `smart-salary-tracker/backend/src/controllers/public.controller.js`
- Create: `smart-salary-tracker/backend/src/routes/public.routes.js`
- Modify: `smart-salary-tracker/backend/src/app.js`
- Test: `smart-salary-tracker/backend/src/tests/api.integration.test.js`

**Interfaces:**
- `GET /api/public/jobs?location=&site_type=&department=&q=` -> array of open jobs.
- `GET /api/public/jobs/:id` -> job object or `404`.
- `POST /api/public/applications` -> `{ id, message }` (`201`) or `400`.
- `POST /api/public/quotes` -> `{ id, message }` (`201`) or `400`.
- `POST /api/public/salary-estimate` -> `{ shiftHours, hourlyRate, totalDays, totalHours, breakdown, estimatedTotal }` (`200`) or `400`.

- [ ] **Step 1 (RED):** Thêm test cases vào `api.integration.test.js`:
  - Lọc `GET /api/public/jobs?location=Bình Dương` chỉ trả tin ở Bình Dương; `GET /api/public/jobs/99999` trả `404`.
  - `POST /api/public/applications` với SĐT `"123"` trả `400`; với SĐT `"0909 123 456"` hợp lệ trả `201` và lưu DB.
  - `POST /api/public/quotes` thiếu `company_name` trả `400`; đủ thông tin hợp lệ trả `201`.
  - `POST /api/public/salary-estimate` với `{ shiftHours: 12, normalDays: 22, sundayDays: 4, holidayDays: 0, hourlyRate: 25529, mealAllowancePerDay: 30000 }` tính đúng bằng công thức `salaryCalculator.js`; tổng ngày `32` trả `400`.
- [ ] **Step 2:** Chạy test -> Expected: FAIL (404 route chưa tồn tại).
- [ ] **Step 3 (GREEN):** Tạo `public.controller.js`, `public.routes.js`, gắn vào `app.js`.
- [ ] **Step 4:** Chạy test -> Expected: PASS.

---

### Task 5: Admin HR API (`/api/admin/*` + RBAC + Safe Job Deletion)

**Files:**
- Create: `smart-salary-tracker/backend/src/controllers/admin.controller.js`
- Create: `smart-salary-tracker/backend/src/routes/admin.routes.js`
- Modify: `smart-salary-tracker/backend/src/app.js`
- Test: `smart-salary-tracker/backend/src/tests/api.integration.test.js`

**Interfaces:**
- `GET /api/admin/stats`
- `GET /api/admin/jobs`, `POST /api/admin/jobs`, `PUT /api/admin/jobs/:id`, `DELETE /api/admin/jobs/:id`
- `GET /api/admin/applications`, `PATCH /api/admin/applications/:id`
- `GET /api/admin/quotes`, `PATCH /api/admin/quotes/:id`

- [ ] **Step 1 (RED):** Thêm test cases vào `api.integration.test.js`:
  - User `employee` gọi `/api/admin/stats` bị `403`.
  - `admin` tạo tin tuyển dụng mới (`201`), đóng tin (`PUT` `status: 'closed'`) -> tin biến mất khỏi `GET /api/public/jobs`.
  - Ứng viên nộp vào tin mới tạo, sau đó `admin` xóa tin (`DELETE /api/admin/jobs/:id`) -> trả `200`, đơn ứng tuyển vẫn tồn tại trong `GET /api/admin/applications` với `job_id = null`.
  - `admin` cập nhật trạng thái đơn ứng tuyển sang `'contacted'` và báo giá sang `'quoted'` thành công; trạng thái lạ `'hacked'` bị `400`.
- [ ] **Step 2:** Chạy test -> Expected: FAIL.
- [ ] **Step 3 (GREEN):** Viết `admin.controller.js`, `admin.routes.js`, gắn vào `app.js`.
- [ ] **Step 4:** Chạy toàn bộ test suite `cmd /c "npm test"` -> Expected: ALL PASS (cả `salaryCalculator.test.js` và `api.integration.test.js`).

---

### Task 6: Frontend Foundation, API Services & Corporate Data

**Files:**
- Modify: `smart-salary-tracker/frontend/index.html`
- Modify: `smart-salary-tracker/frontend/src/index.css`
- Modify: `smart-salary-tracker/frontend/src/services/api.js`
- Create: `smart-salary-tracker/frontend/src/services/publicService.js`
- Create: `smart-salary-tracker/frontend/src/services/adminService.js`
- Create: `smart-salary-tracker/frontend/src/data/companyData.js`
- Create: `smart-salary-tracker/frontend/src/components/BrandLogo.jsx`

- [ ] **Step 1:** Cập nhật `index.html` (`lang="vi"`, title `Long Hải Securitas - Dịch Vụ Bảo Vệ Chuyên Nghiệp & Tuyển Dụng`) và `index.css` với token màu thương hiệu (`#0A192F`, `#E30613`, `#F8FAFC`).
- [ ] **Step 2:** Cập nhật `api.js` dùng `import.meta.env.VITE_API_URL || 'http://localhost:5000/api'`, tạo `publicService.js` và `adminService.js`.
- [ ] **Step 3:** Tạo `companyData.js` chứa thông tin thật từ `securitaslonghai.vn` (lịch sử 1995–2009–nay, 3 giá trị cốt lõi, 5 nhóm dịch vụ, lĩnh vực mục tiêu, 5 chi nhánh kèm địa chỉ & hotline, khách hàng tiêu biểu, phúc lợi tuyển dụng) và component `BrandLogo.jsx`.

---

### Task 7: Reusable Public Components & Public Layout

**Files:**
- Create: `smart-salary-tracker/frontend/src/components/SalaryEstimatorWidget.jsx`
- Create: `smart-salary-tracker/frontend/src/components/QuickApplyModal.jsx`
- Create: `smart-salary-tracker/frontend/src/components/QuoteRequestForm.jsx`
- Create: `smart-salary-tracker/frontend/src/layouts/PublicLayout.jsx`

- [ ] **Step 1:** Viết `SalaryEstimatorWidget.jsx` gọi `estimateSalary()` từ `publicService.js`, cho phép chọn Ca A/B/C (8h), Ca A1/C1 (12h), Ca AB (16h), chỉnh số ngày thường / Chủ Nhật / Lễ và phụ cấp cơm ca, hiển thị bảng phân rã thu nhập ước tính.
- [ ] **Step 2:** Viết `QuickApplyModal.jsx` (Họ tên, SĐT, Năm sinh, Khu vực, Ca mong muốn, CCCD, Ghi chú) gọi `submitApplication()`, hiển thị thông báo thành công kèm mã hồ sơ và thông tin không thu phí.
- [ ] **Step 3:** Viết `QuoteRequestForm.jsx` gọi `submitQuoteRequest()`.
- [ ] **Step 4:** Viết `PublicLayout.jsx` gồm Header responsive (menu 5 trang + nút Cổng nhân viên / Quản trị HR + CTA Ứng tuyển), Footer 5 chi nhánh & cam kết, và thanh Mobile Quick Bar.

---

### Task 8: Các trang Public (Trang chủ, Giới thiệu, Dịch vụ, Tuyển dụng, Liên hệ)

**Files:**
- Create: `smart-salary-tracker/frontend/src/pages/public/HomePage.jsx`
- Create: `smart-salary-tracker/frontend/src/pages/public/AboutPage.jsx`
- Create: `smart-salary-tracker/frontend/src/pages/public/ServicesPage.jsx`
- Create: `smart-salary-tracker/frontend/src/pages/public/RecruitmentPage.jsx`
- Create: `smart-salary-tracker/frontend/src/pages/public/ContactPage.jsx`

- [ ] **Step 1:** Tạo `HomePage.jsx` (Hero slogan Securitas, 4 chỉ số uy tín, 4 giải pháp an ninh nổi bật, 3 giá trị cốt lõi, danh sách việc làm hot từ API + banner 0đ phí tuyển dụng, khách hàng tiêu biểu, CTA báo giá).
- [ ] **Step 2:** Tạo `AboutPage.jsx` (lịch sử 1995 từ Thiếu tướng Phan Văn Xoàn -> 2009 Securitas AB, tiêu chuẩn đào tạo Công an & ISO 9001, bản đồ/danh sách 5 chi nhánh).
- [ ] **Step 3:** Tạo `ServicesPage.jsx` (5 nhóm dịch vụ an ninh chi tiết, lĩnh vực phục vụ FDI/Ngân hàng/Ngoại giao/Bán lẻ, nhúng `QuoteRequestForm` đặt lịch khảo sát).
- [ ] **Step 4:** Tạo `RecruitmentPage.jsx` (quyền lợi & điều kiện, `SalaryEstimatorWidget`, bộ lọc Khu vực/Mục tiêu/Từ khóa gọi `getPublicJobs`, thẻ việc làm + modal chi tiết + `QuickApplyModal`).
- [ ] **Step 5:** Tạo `ContactPage.jsx` (5 thẻ chi nhánh với link gọi điện trực tiếp + `QuoteRequestForm`).

---

### Task 9: Trang Quản trị HR (`AdminDashboard.jsx`), Auth & Cập nhật Cổng Nhân Viên (`/nhan-vien`)

**Files:**
- Create: `smart-salary-tracker/frontend/src/pages/admin/AdminDashboard.jsx`
- Modify: `smart-salary-tracker/frontend/src/pages/Login.jsx`
- Modify: `smart-salary-tracker/frontend/src/pages/Register.jsx`
- Modify: `smart-salary-tracker/frontend/src/layouts/MainLayout.jsx`
- Modify: `smart-salary-tracker/frontend/src/pages/Dashboard.jsx`
- Modify: `smart-salary-tracker/frontend/src/App.jsx`

- [ ] **Step 1:** Tạo `AdminDashboard.jsx` với 4 thẻ tổng quan và 3 tab (Hồ sơ ứng viên + đổi trạng thái/ghi chú, Yêu cầu báo giá + đổi trạng thái/ghi chú, Quản lý tin tuyển dụng Thêm/Sửa/Đóng-Mở/Xóa).
- [ ] **Step 2:** Cập nhật `Login.jsx` (giao diện Long Hải Securitas, redirect `admin` -> `/admin`, `employee` -> `/nhan-vien`, nút quay lại `/`, nút điền nhanh tài khoản demo khi `VITE_ENABLE_DEMO_LOGIN !== 'false'`) và `Register.jsx`.
- [ ] **Step 3:** Cập nhật `MainLayout.jsx` và `Dashboard.jsx` chuyển toàn bộ link nội bộ sang `/nhan-vien/*`, thêm link quay về `/` và link `/admin` (nếu `user.role === 'admin'`).
- [ ] **Step 4:** Cập nhật `App.jsx` nối toàn bộ routes Public (`/*`), Auth (`/login`, `/register`), Employee (`/nhan-vien/*`), Admin (`/admin` bảo vệ theo `role === 'admin'`).

---

### Task 10: Tài liệu, Kiểm thử Toàn diện & Xác minh Chạy Thật

**Files:**
- Modify: `smart-salary-tracker/README.md`

- [ ] **Step 1:** Chạy `cmd /c "npm run build"` và `cmd /c "npm run lint"` (nếu có) tại `frontend` -> xác nhận exit code 0, không lỗi biên dịch.
- [ ] **Step 2:** Chạy `cmd /c "npm test"` tại `backend` -> xác nhận tất cả unit test & integration test PASS.
- [ ] **Step 3:** Khởi động cả Backend (`server.js`) và Frontend (`vite`), kiểm tra HTTP live: Public API (`/api/public/jobs`, `/api/public/salary-estimate`), Auth login admin & employee, Admin stats, và kiểm tra Frontend phục vụ `200 OK` (rồi tắt tiến trình kiểm thử sạch sẽ).
- [ ] **Step 4:** Cập nhật `smart-salary-tracker/README.md` với hướng dẫn cài đặt, tài khoản demo, cấu trúc các phân hệ mới và lệnh test.
