# Hướng Dẫn Cài Đặt & Khởi Chạy Hệ Thống Smart Self Storage

Hệ thống quản lý chuỗi kho tự quản thông minh (Smart Self-Storage Management System) - SWP391.

---

## 1. Yêu Cầu Môi Trường (Prerequisites)

* **Java**: OpenJDK 21 LTS
* **Node.js**: v18+ hoặc v20+ LTS
* **Database**: MySQL 8.0+ / MariaDB 10.4+
* **Build Tools**: Maven Wrapper (`mvnw`), npm

---

## 2. Thiết Lập Cơ Sở Dữ Liệu (Database Setup)

1. Mở MySQL Server trên máy của bạn (Port mặc định: `3306`).
2. Khởi tạo cấu trúc cơ sở dữ liệu và dữ liệu mẫu:
   ```bash
   # Cách 1: Chạy file hoàn chỉnh
   mysql -u root -p < database/db-script.sql

   # Cách 2: Chạy riêng schema và seed
   mysql -u root -p < database/schema.sql
   mysql -u root -p < database/seed.sql
   ```
3. Thông tin kết nối mặc định:
   * **Database**: `smart_storage`
   * **Username**: `root`
   * **Password**: `123456` (Cấu hình lại trong `backend/src/main/resources/application.properties` nếu khác)

---

## 3. Khởi Chạy Backend (Spring Boot)

```bash
cd backend
# Windows:
.\mvnw.cmd spring-boot:run

# Linux / macOS:
./mvnw spring-boot:run
```
* **Backend API Base URL**: `http://localhost:8080`
* **Swagger API Documentation**: `http://localhost:8080/swagger-ui/index.html`

---

## 4. Khởi Chạy Frontend (React + Vite + TypeScript)

```bash
cd frontend
npm install
npm run dev
```
* **Frontend Local URL**: `http://localhost:5173`

---

## 5. Tài Khoản Thử Nghiệm Mặc Định (Seed Accounts)

* **Admin**: `admin@smartstorage.vn` / `Password@123`
* **BOM (Ban Giám Đốc)**: `bom@smartstorage.vn` / `Password@123`
* **Quản lý (Manager)**: `manager1@smartstorage.vn` / `Password@123`
* **Nhân viên (Staff)**: `staff1@smartstorage.vn` / `Password@123`
* **Khách hàng (Customer)**: SĐT `0901234567` hoặc `minh.nguyen@example.com` / `Password@123`
