# Long Hải Securitas — Cổng Thông tin, Tuyển dụng & Nhân viên

Hệ thống web Full-stack hợp nhất **Website Doanh nghiệp**, **Cổng Tuyển dụng Trực tiếp** và **Cổng Nhân viên (Chấm ca & Lương)** cho Công ty Cổ phần Dịch vụ Bảo vệ Long Hải (Securitas Vietnam).

> **Lưu ý:** Thông tin doanh nghiệp, chi nhánh và quyền lợi tuyển dụng được tham khảo từ [securitaslonghai.vn](https://www.securitaslonghai.vn/). Công cụ ước tính thu nhập mang tính chất tham khảo.

## Kiến trúc 3 phân hệ

1. **Website Công ty & Tuyển dụng (Công khai)**
   - `/` — Trang chủ giới thiệu thương hiệu (1995 – Securitas AB), số liệu năng lực, dịch vụ tiêu biểu, 3 giá trị cốt lõi, việc làm nổi bật & ứng tuyển nhanh 30 giây.
   - `/gioi-thieu` — Lịch sử phát triển, chuẩn ISO 9001, đào tạo và hệ thống 5 văn phòng/chi nhánh toàn quốc.
   - `/dich-vu` — 5 nhóm giải pháp an ninh (Mục tiêu cố định, An ninh điện tử & AI, Tuần tra cơ động, Áp tải/VIP/Sự kiện, Huấn luyện & PCCC) kèm form yêu cầu báo giá.
   - `/tuyen-dung` — Cổng tuyển dụng lọc theo khu vực/loại mục tiêu/từ khóa, modal chi tiết + ứng tuyển nhanh 30 giây, tích hợp **Công cụ Ước tính Thu nhập Bảo vệ** gọi trực tiếp API backend.
   - `/lien-he` — Danh bạ 5 chi nhánh (TP.HCM, Hà Nội, Bình Dương, Đồng Nai, Đà Nẵng) và form gửi yêu cầu khảo sát báo giá B2B.

2. **Cổng Nhân viên (`/nhan-vien`, yêu cầu đăng nhập)**
   - `/nhan-vien` — Tổng quan thu nhập ước tính và chi tiêu hôm nay / tháng này.
   - `/nhan-vien/schedule` — Lịch trực theo tháng & cập nhật ca làm việc.
   - `/nhan-vien/expenses` — Quản lý chi tiêu cá nhân.
   - `/nhan-vien/settings` — Cấu hình lương cơ bản, số công chuẩn, đơn giá giờ và OT.

3. **Cổng Quản trị HR & Kinh doanh (`/admin`, yêu cầu tài khoản `role = admin`)**
   - Thống kê nhanh tin tuyển dụng, hồ sơ ứng viên mới, yêu cầu báo giá mới.
   - Quản lý & cập nhật trạng thái hồ sơ ứng viên (`Mới tiếp nhận` → `Đã liên hệ` → `Đã phỏng vấn` → `Trúng tuyển` / `Chưa phù hợp`) kèm ghi chú HR.
   - Quản lý yêu cầu khảo sát & báo giá B2B kèm ghi chú kinh doanh.
   - CRUD Tin tuyển dụng (đăng mới, sửa, đóng/mở lại, xóa an toàn vẫn giữ hồ sơ ứng viên).

## Công nghệ sử dụng

- **Backend:** Node.js, Express 5, SQLite3 (`database.sqlite`), JWT (`jsonwebtoken`), `bcrypt`, Jest + Supertest.
- **Frontend:** React 19, Vite 8, Tailwind CSS v4 (`@tailwindcss/postcss`), React Router DOM 7, Axios, Lucide React.

## Tài khoản dùng thử mặc định (Seed tự động)

Khi khởi động Backend lần đầu, SQLite tự động khởi tạo schema, migrate an toàn (nếu đã có DB cũ), 6 tin tuyển dụng mẫu và 2 tài khoản dùng thử:

| Vai trò | Email | Mật khẩu | Điều hướng mặc định |
| :--- | :--- | :--- | :--- |
| **Quản trị HR (Admin)** | `admin@securitaslonghai.vn` | `Admin@123` | `/admin` |
| **Nhân viên Bảo vệ** | `nhanvien@securitaslonghai.vn` | `123456` | `/nhan-vien` |

Trang `/login` cũng có nút điền nhanh tài khoản dùng thử (có thể tắt khi deploy bằng biến `VITE_ENABLE_DEMO_LOGIN=false`).

## Hướng dẫn cài đặt & Chạy Local

> **Lưu ý trên Windows PowerShell:** Nếu máy bật chính sách chặn chạy script `.ps1` (`running scripts is disabled on this system`), hãy chạy các lệnh `npm` thông qua `cmd /c "..."` hoặc dùng trực tiếp `node server.js` như bên dưới.

### 1. Chạy Backend (Port `5000`)

```bash
cd smart-salary-tracker/backend
npm install
# (Tùy chọn) Tạo file .env với PORT=5000 và JWT_SECRET=...
node server.js
```

Hoặc trên PowerShell bị khóa `.ps1`:

```powershell
cd d:\HocTap\longhai\smart-salary-tracker\backend
node server.js
# hoặc: cmd /c "npm run dev"
```

Backend sẽ chạy tại `http://localhost:5000` (health check: `GET http://localhost:5000/api/health`).

### 2. Chạy Frontend (Port `5173`)

Mở terminal mới:

```bash
cd smart-salary-tracker/frontend
npm install
npm run dev
```

Hoặc trên PowerShell bị khóa `.ps1`:

```powershell
cd d:\HocTap\longhai\smart-salary-tracker\frontend
cmd /c "npm run dev"
```

Truy cập ứng dụng tại `http://localhost:5173`.

## Kiểm thử & Build Production

```bash
# Backend: Unit test + API Integration test (Jest & Supertest)
cd smart-salary-tracker/backend
cmd /c "npm test"

# Frontend: Lint & Production Build
cd smart-salary-tracker/frontend
cmd /c "npm run lint && npm run build"
```

## Biến môi trường & Triển khai (Production)

### Backend
- `PORT`: Cổng chạy Express (mặc định `5000`).
- `JWT_SECRET`: Chuỗi bí mật ký JWT (bắt buộc thiết lập an toàn khi deploy).
- `DB_PATH`: Đường dẫn file SQLite tùy chỉnh (mặc định `backend/database.sqlite`).
- `DEMO_ADMIN_PASSWORD` / `DEMO_EMPLOYEE_PASSWORD`: Ghi đè mật khẩu seed mặc định nếu cần.

### Frontend
- `VITE_API_URL`: URL API Backend khi deploy (mặc định `http://localhost:5000/api`).
- `VITE_ENABLE_DEMO_LOGIN`: Đặt `false` để ẩn 2 nút đăng nhập nhanh tài khoản mẫu ở trang `/login`.

> **Gợi ý Deploy:** Frontend build tĩnh từ `frontend/dist` phù hợp deploy trên Vercel / Netlify; Backend phù hợp triển khai trên Railway / Render (cần cấu hình persistent volume cho SQLite hoặc chuyển sang PostgreSQL khi vận hành thực tế).
