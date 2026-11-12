# Kế hoạch Tái cấu trúc Ứng dụng Tính Lương & Chi Tiêu Bảo Vệ Long Hải

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Loại bỏ toàn bộ thông tin doanh nghiệp/tuyển dụng rườm rà để tập trung hoàn toàn vào công cụ tính lương, chấm ca (thêm ca 4h `B1`, `B2`), ghi chi tiêu (sửa dứt điểm lỗi nút lưu), đăng nhập/đăng ký dễ nhớ và tính năng Admin đặt lại mật khẩu nhân viên về `123456`, với giao diện hiện đại, thông báo toast đẹp và dễ dùng.

**Architecture:** Frontend React + Tailwind CSS chuyển trang chủ `/` thẳng vào Đăng nhập / Cổng Tính lương (`/nhan-vien`) hoặc Quản trị Tài khoản (`/admin`). Backend Express + SQLite bổ sung `username` cho đăng nhập ngắn gọn, nâng cấp `seedShifts()` idempotent thêm `B1`/`B2` (4h), bổ sung API quản lý user & reset mật khẩu `123456` cho Admin, nâng cấp API lịch trực/chi tiêu/tổng quan với validation đầy đủ và thông báo tiếng Việt rõ ràng.

**Tech Stack:** Node.js 22, Express 5, SQLite3, bcrypt, jsonwebtoken, Jest + Supertest, React 19, React Router 7, Tailwind CSS 4, Lucide icons, Vite 8.

## Global Constraints
- Giữ tương thích Render Docker (`Dockerfile` `node:22-trixie-slim`, `render.yaml`, `/api/health`).
- Hỗ trợ nâng cấp an toàn cho cả SQLite mới và SQLite cũ (migration `username`, nullable `email`, seed từng mã ca `B1`/`B2`).
- Không che khuất modal/nút bấm trên mobile (`nav` `z-30`, modal `z-[60]`, toast `z-[80]`).
- Mọi thao tác CRUD/Auth/Admin đều có thông báo toast/banner rõ ràng thay vì `window.alert`/`window.confirm`.

---

### Task 1: Database Schema, Migration & Idempotent Seeds (`B1`, `B2`, Admin/Employee Accounts)
**Files:**
- Modify: `smart-salary-tracker/backend/src/database/schema.sql`
- Modify: `smart-salary-tracker/backend/src/database/db.js`
- Test: `smart-salary-tracker/backend/src/utils/salaryCalculator.test.js`
- Test: `smart-salary-tracker/backend/src/tests/api.integration.test.js`

- [ ] **Step 1 (RED):** Viết test trong `salaryCalculator.test.js` cho ca 4 tiếng (`B1`/`B2`: 4h ngày thường, Chủ nhật, Ngày lễ) và viết test trong `api.integration.test.js` kiểm tra: DB có đủ ca `B1`, `B2` (4h), migration trên DB legacy thiếu `username` và thiếu `B1`/`B2`, seed tài khoản dễ nhớ `admin` và `nv1`.
- [ ] **Step 2:** Chạy `npm test` xác nhận test mới FAIL đúng lý do.
- [ ] **Step 3 (GREEN):** Cập nhật `schema.sql` (thêm `username TEXT UNIQUE`, cho phép `email TEXT UNIQUE` nullable) và `db.js` (`initializeDatabase()` migration an toàn cả khi bảng `users` cũ có `email NOT NULL`; `seedShifts()` thêm đủ `B1`, `B2` idempotent; `seedDemoUsers()` tạo `admin` / `admin123` và `nv1` / `123456`).
- [ ] **Step 4:** Chạy `npm test` xác nhận PASS.

### Task 2: Auth & Admin User Management + Reset Password (`123456`)
**Files:**
- Modify: `smart-salary-tracker/backend/src/controllers/auth.controller.js`
- Modify: `smart-salary-tracker/backend/src/routes/auth.routes.js`
- Modify: `smart-salary-tracker/backend/src/controllers/admin.controller.js`
- Modify: `smart-salary-tracker/backend/src/routes/admin.routes.js`
- Modify: `smart-salary-tracker/backend/src/app.js`
- Delete (corporate clutter): `smart-salary-tracker/backend/src/controllers/public.controller.js`, `smart-salary-tracker/backend/src/routes/public.routes.js`

- [ ] **Step 1 (RED):** Viết integration test trong `api.integration.test.js` cho:
  - Nhân viên tự đăng ký bằng tên đăng nhập ngắn/SĐT (không cần `@email`) và nhận ngay token + `salary_settings` + `expense_categories`.
  - Đăng nhập bằng `username`, `employee_code`, hoặc `email`.
  - Nhân viên đổi mật khẩu qua `POST /api/auth/change-password`.
  - Admin lấy danh sách user, tìm kiếm, đặt lại mật khẩu nhân viên về `123456` (`POST /api/admin/users/:id/reset-password`), nhân viên đăng nhập lại được bằng `123456`.
  - Chặn `employee` gọi `/api/admin/*`, chặn Admin tự xóa chính mình.
- [ ] **Step 2:** Chạy `npm test` xác nhận FAIL.
- [ ] **Step 3 (GREEN):** Implement đầy đủ controller/route Auth & Admin, bỏ mount `/api/public`.
- [ ] **Step 4:** Chạy `npm test` xác nhận PASS.

### Task 3: Backend Shifts Order, Schedules Summary, Expenses Validation & Dashboard Enrichment
**Files:**
- Modify: `smart-salary-tracker/backend/src/controllers/shift.controller.js`
- Modify: `smart-salary-tracker/backend/src/controllers/schedule.controller.js`
- Modify: `smart-salary-tracker/backend/src/controllers/expense.controller.js`
- Modify: `smart-salary-tracker/backend/src/controllers/dashboard.controller.js`
- Modify: `smart-salary-tracker/backend/src/controllers/settings.controller.js`

- [ ] **Step 1 (RED):** Viết test trong `api.integration.test.js` kiểm tra:
  - Chấm ca `B1` (4h) và `B2` (4h) phản ánh đúng giờ và tiền lương ở `/api/schedules` & `/api/dashboard`.
  - Xóa ca trực qua `DELETE /api/schedules/:id`.
  - Lưu chi tiêu không gửi `category_id` hoặc `category_id = ""` không bị lỗi 500, từ chối số tiền `<= 0` với 400.
  - Sửa và xóa chi tiêu hoạt động chuẩn xác.
- [ ] **Step 2:** Chạy `npm test` xác nhận FAIL.
- [ ] **Step 3 (GREEN):** Implement validation & enrichment ở các controller trên.
- [ ] **Step 4:** Chạy `npm test` xác nhận toàn bộ backend tests PASS.

### Task 4: Frontend Shared UI (Toast + Confirm Modal), Routing Cleanup & Auth Screens
**Files:**
- Create: `smart-salary-tracker/frontend/src/components/ToastContext.jsx`
- Create: `smart-salary-tracker/frontend/src/components/ConfirmDialog.jsx`
- Modify: `smart-salary-tracker/frontend/src/main.jsx`
- Modify: `smart-salary-tracker/frontend/src/App.jsx`
- Modify: `smart-salary-tracker/frontend/src/components/BrandLogo.jsx`
- Modify: `smart-salary-tracker/frontend/src/services/authService.js`
- Modify: `smart-salary-tracker/frontend/src/services/adminService.js`
- Modify: `smart-salary-tracker/frontend/src/pages/Login.jsx`
- Modify: `smart-salary-tracker/frontend/src/pages/Register.jsx`
- Delete (marketing clutter): `PublicLayout.jsx`, `HomePage.jsx`, `AboutPage.jsx`, `ServicesPage.jsx`, `RecruitmentPage.jsx`, `ContactPage.jsx`, `QuickApplyModal.jsx`, `QuoteRequestForm.jsx`, `SalaryEstimatorWidget.jsx`, `companyData.js`, `publicService.js`

- [ ] Xây dựng `ToastProvider` (thông báo thành công/lỗi/cảnh báo trượt mượt góc trên, dễ đọc trên mobile & desktop) và `ConfirmDialog` (thay thế hoàn toàn `window.confirm`).
- [ ] Gỡ bỏ toàn bộ 5 trang thông tin công ty/tuyển dụng rườm rà; `/` đi thẳng vào app tính lương hoặc `/login`.
- [ ] Thiết kế lại `Login.jsx` (ô nhập tài khoản đa năng + nút hiện mật khẩu + nút điền nhanh tài khoản test `nv1` / `admin` + hướng dẫn quên mật khẩu) và `Register.jsx` (tự tạo tài khoản nhanh chỉ với Họ tên, Tên đăng nhập/SĐT, Mật khẩu -> vào thẳng trang tính lương).

### Task 5: Employee Portal Polish (MainLayout, Dashboard, Schedule with B1/B2, Expenses Save Fix, Settings) & Admin User Portal
**Files:**
- Modify: `smart-salary-tracker/frontend/src/layouts/MainLayout.jsx`
- Modify: `smart-salary-tracker/frontend/src/pages/Dashboard.jsx`
- Modify: `smart-salary-tracker/frontend/src/pages/Schedule.jsx`
- Modify: `smart-salary-tracker/frontend/src/pages/Expenses.jsx`
- Modify: `smart-salary-tracker/frontend/src/pages/Settings.jsx`
- Modify: `smart-salary-tracker/frontend/src/pages/admin/AdminDashboard.jsx`
- Modify: `smart-salary-tracker/frontend/src/services/dashboardService.js`, `scheduleService.js`, `expenseService.js`

- [ ] **MainLayout:** Đặt mobile bottom nav `z-30`, bỏ nút "Web công ty", bổ sung nút chuyển nhanh `/admin` cho Admin, hiển thị tên & mã/tài khoản nhân viên gọn đẹp.
- [ ] **Schedule (`Lịch trực`):** Giao diện chọn ca trực quan dạng nút bấm nhanh (`B1 4h`, `B2 4h`, `A 8h`, `B 8h`, `C 8h`, `A1 12h`, `C1 12h`, `AB 16h`, `H 12h`, `R 12h`, `Nghỉ`), xem trước tiền lương ước tính ngay khi chọn, nút **Lưu ca trực** rõ ràng, nút **Xóa ca** + toast thông báo mượt, thống kê tổng công/giờ/lương ngay trên lịch. Modal dùng `z-[60]` không bị nav che.
- [ ] **Expenses (`Chi tiêu`):** Đặt form **Ghi chi tiêu mới** nổi bật ngay trên trang với gợi ý mức tiền nhanh (`30k`, `50k`, `100k`), nút chọn danh mục và nút **`Lưu chi tiêu`** rõ ràng không thể sót/bị che; hỗ trợ thêm/sửa/xóa kèm `ConfirmDialog` và toast thông báo đẹp; sửa parse ngày an toàn tránh lệch múi giờ.
- [ ] **Dashboard (`Tổng quan`):** Chọn tháng xem thu nhập/chi tiêu/còn lại, trạng thái ca hôm nay (nút chấm nhanh nếu chưa có ca), tổng số ca/giờ trong tháng, chi tiêu theo danh mục trực quan, nút chuyển nhanh sang Chấm ca & Ghi chi tiêu.
- [ ] **Settings (`Cài đặt`):** Nút "Tính tự động đơn giá giờ" từ Lương cơ bản & Công chuẩn, lưu cấu hình lương + phần **"Đổi mật khẩu"** cho nhân viên tự đổi sau khi được Admin reset về `123456`.
- [ ] **Admin (`Quản lý Tài khoản`):** Danh sách nhân viên có tìm kiếm, nút 1-click **"Đặt lại MK = 123456"** (kèm `ConfirmDialog` & toast), tạo nhanh nhân viên mới (mặc định MK `123456`), xóa tài khoản không dùng, chuyển sang Cổng Tính lương cá nhân dễ dàng.

### Task 6: Verification, Build, Runtime E2E Test & README Update
- [ ] Chạy Backend Jest (`npm test`) — 100% PASS.
- [ ] Chạy Frontend Oxlint (`npm run lint`) & Vite Build (`npm run build`) — 0 lỗi.
- [ ] Chạy thử unified server thực tế (`node server.js`) + kiểm tra browser/API thực tế (tự đăng ký nhân viên, chấm ca B1/B2, lưu & xóa chi tiêu trên màn hình mobile/desktop, admin reset mật khẩu về `123456`, đăng nhập lại).
- [ ] Cập nhật `README.md` ngắn gọn đúng thông tin tài khoản test mới.
