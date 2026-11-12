# Long Hải — Ứng dụng Chấm Ca, Tính Lương & Chi Tiêu

Ứng dụng Full-stack gọn nhẹ, tập trung vào **Chấm ca trực (gồm ca 4h `B1`, `B2`, ca 8h `A`/`B`/`C`, ca 12h `A1`/`C1`/`H`/`R`, ca 16h `AB`)**, **Ước tính thu nhập**, **Ghi chép chi tiêu** và **Quản lý tài khoản nhân viên**.

## Tài khoản đăng nhập nhanh (Mặc định)

| Vai trò | Tên đăng nhập | Mật khẩu |
| :--- | :--- | :--- |
| **Nhân viên mẫu** | `nv1` (hoặc `NV001`, `nv1@longhai.vn`) | `123456` |
| **Quản trị Admin** | `admin` (hoặc `ADMIN`, `admin@longhai.vn`) | `admin123` |

- Nhân viên có thể **tự tạo tài khoản** tại `/register` bằng tên ngắn / số điện thoại / email.
- Nếu nhân viên **quên mật khẩu**, Admin tìm tài khoản tại `/admin` và bấm **Đặt lại MK = `123456`**.

## Deploy nhanh 1-click lên Render (Miễn phí)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/lehongson2005/longhai)

> File [`render.yaml`](./render.yaml) và [`Dockerfile`](./Dockerfile) đã được thiết lập sẵn (`node:22-trixie-slim`, tự build Frontend + Backend, healthcheck `/api/health`). Lưu ý: trên gói Render Free, dữ liệu file SQLite có thể reset khi container khởi động lại hoặc deploy mới.

## Tài liệu chi tiết & Chạy Local

Xem hướng dẫn đầy đủ trong [`smart-salary-tracker/README.md`](./smart-salary-tracker/README.md).
