# Long Hải — Chấm Ca, Tính Lương & Quản Lý Chi Tiêu

Ứng dụng web Full-stack tập trung vào tính lương theo ca trực cho nhân viên bảo vệ Long Hải, đi kèm quản lý chi tiêu cá nhân và trang Admin quản lý tài khoản.

## Tính năng chính

1. **Đăng nhập dễ nhớ & Nhân viên tự tạo tài khoản (`/login`, `/register`)**
   - Hỗ trợ đăng nhập bằng **Tên đăng nhập ngắn**, **Số điện thoại**, **Mã nhân viên** hoặc **Email**.
   - Nhân viên mới tự tạo tài khoản chỉ với Họ tên, Tên đăng nhập/SĐT và Mật khẩu (không bắt buộc email), đăng ký xong tự động vào thẳng trang tính lương.
   - Thông báo rõ khi quên mật khẩu: nhắn Admin đặt lại về `123456`, sau đó nhân viên tự đổi lại mật khẩu mới trong **Cài đặt**.

2. **Cổng Nhân viên (`/nhan-vien`)**
   - `/nhan-vien` — Tổng quan hôm nay & tháng (tổng công, tổng giờ chuẩn + OT, thu nhập ước tính, tổng chi tiêu theo danh mục).
   - `/nhan-vien/schedule` — Lịch trực tháng với đầy đủ ca **4h (`B1`, `B2`)**, **8h (`A`, `B`, `C`)**, **12h (`A1`, `C1`, `H`, `R`)**, **16h (`AB`)** và `Nghỉ`, xem trước tiền công ca trước khi lưu, hỗ trợ xóa ca.
   - `/nhan-vien/expenses` — Form ghi chi tiêu trực tiếp luôn hiển thị nút **Lưu chi tiêu** (kèm mức chọn nhanh `20k..200k`, chỉnh sửa & xóa có xác nhận).
   - `/nhan-vien/settings` — Cấu hình lương cơ bản, số công chuẩn, đơn giá giờ (kèm nút tự tính đơn giá) và mục đổi mật khẩu cá nhân.

3. **Cổng Quản trị Admin (`/admin`)**
   - Tìm kiếm nhân viên, xem số lượng ca/chi tiêu, tạo nhanh tài khoản nhân viên, xóa tài khoản và **1 bấm Đặt lại mật khẩu về `123456`**.

## Tài khoản mặc định

| Vai trò | Tên đăng nhập | Mật khẩu | Điều hướng mặc định |
| :--- | :--- | :--- | :--- |
| **Quản trị Admin** | `admin` | `admin123` | `/admin` |
| **Nhân viên mẫu** | `nv1` | `123456` | `/nhan-vien` |

*(Ghi đè qua biến môi trường `DEMO_ADMIN_PASSWORD` / `DEMO_EMPLOYEE_PASSWORD`; đặt `VITE_ENABLE_DEMO_LOGIN=false` khi build frontend để ẩn 2 nút điền nhanh trên `/login`.)*

## Công nghệ sử dụng

- **Backend:** Node.js, Express 5, SQLite3 (`database.sqlite`), JWT (`jsonwebtoken`), `bcrypt`, Jest + Supertest.
- **Frontend:** React 19, Vite 8, Tailwind CSS v4 (`@tailwindcss/postcss`), React Router DOM 7, Axios, Lucide React.

## Hướng dẫn chạy Local & Kiểm thử

### 1. Chạy Backend (`http://localhost:5000`)

```powershell
cd d:\HocTap\longhai\smart-salary-tracker\backend
node server.js
```

### 2. Chạy Frontend (`http://localhost:5173`)

```powershell
cd d:\HocTap\longhai\smart-salary-tracker\frontend
cmd /c "npm run dev"
```

### 3. Kiểm thử & Build Production

```powershell
# Backend tests (Jest + Supertest)
cmd /c "cd /d d:\HocTap\longhai\smart-salary-tracker\backend && npm test"

# Frontend lint & build
cmd /c "cd /d d:\HocTap\longhai\smart-salary-tracker\frontend && npm run lint && npm run build"
```
