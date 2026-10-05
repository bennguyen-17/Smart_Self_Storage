# Smart Self Storage (Hệ thống quản lý kho lưu trữ tự phục vụ thông minh)

Hệ thống quản trị và đặt chỗ kho tự lưu trữ thông minh (Smart Self-Storage Management System) - Đồ án tốt nghiệp môn **SWP391** tại Đại học FPT.

---

## 👥 Thành viên nhóm (Team Members)
- **Bảo** - Backend Developer
- **Khánh** - Backend Developer
- **Tâm** - Frontend Developer
- **Vy** - Frontend Developer
- **Vỹ** - Frontend Developer

---

## 🛠️ Công nghệ sử dụng (Tech Stack)
- **Frontend:** React.js (Vite), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Java Spring Boot 3, Spring Security, Spring Data JPA, OpenAPI Swagger
- **Database:** MySQL (23 bảng quan hệ)

---

## 📌 QUY CHUẨN COMMIT CODE (GITHUB DESKTOP)

Để phục vụ chấm điểm Git Log và kiểm tra tiến độ Sprint, cả nhóm thống nhất chuẩn commit bằng **Tiếng Anh** gắn với mã **User Story (US)**.

### 1. Quy định 2 ô nhập liệu trên GitHub Desktop
* **`Summary (required)` (BẮT BUỘC):** Tiêu đề commit bằng tiếng Anh, viết đúng theo cú pháp bên dưới (tối đa dưới 72 ký tự).
* **`Description` (TÙY CHỌN):** Không bắt buộc. Chỉ điền khi làm task dài, cần gạch đầu dòng giải thích chi tiết các file đã sửa hoặc logic nghiệp vụ.

### 2. Cú pháp chuẩn trong ô Summary
```text
<type>(us-xx-be): <short summary in english>
<type>(us-xx-fe): <short summary in english>
```
*(Nếu là công việc chung không thuộc riêng US nào thì thay scope bằng: `be`, `fe` hoặc `db`)*

### 3. Danh sách `type` và ví dụ mẫu (1 ví dụ mỗi loại)

| Type | Mục đích sử dụng | Ví dụ mẫu trong ô Summary |
| :--- | :--- | :--- |
| **`feat`** | Thêm tính năng mới, API mới, tạo màn hình/component mới | `feat(us-13-be): add API to change storage unit type` |
| **`fix`** | Sửa lỗi, fix bug logic hoặc lỗi giao diện | `fix(us-13-be): fix facility permission check` |
| **`style`** | Chỉnh CSS, màu sắc, bố cục giao diện (không đổi logic) | `style(us-01-fe): update login button colors and layout` |
| **`refactor`** | Tối ưu, dọn dẹp, tái cấu trúc code sạch hơn | `refactor(us-13-be): clean up storage service logic` |
| **`chore`** | Cập nhật file SQL, cài thư viện, sửa file config | `chore(db): update support ticket table script` |
| **`docs`** | Viết tài liệu README, chú thích Swagger API | `docs(be): update contract API documentation` |

### 4. Lưu ý bắt buộc để không bị trừ điểm
1. **Luôn dùng tiếng Anh**, bắt đầu bằng động từ nguyên mẫu: `add`, `create`, `update`, `fix`, `implement`, `remove`...
2. **Viết chữ thường sau dấu hai chấm**, không có dấu chấm ở cuối câu.
3. **Tuyệt đối không commit vô nghĩa:** Không ghi `update`, `fix bug`, `done`, `test`, `abcxyz`.

---

## 🚀 Hướng dẫn khởi chạy dự án (Getting Started)

### 1. Khởi chạy Backend (Java Spring Boot)
1. Cài đặt **JDK 21 LTS** hoặc mới hơn.
2. Bật dịch vụ MySQL và tạo cơ sở dữ liệu `smart_storage` (chạy script tại `database/db-script.sql`).
3. Cấu hình thông tin tài khoản kết nối MySQL trong file:
   `backend/src/main/resources/application.properties`
4. Khởi chạy server bằng lệnh:
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```
5. Truy cập Swagger UI kiểm tra API tại: `http://localhost:8080/swagger-ui/index.html`

### 2. Khởi chạy Frontend (React + Vite)
1. Cài đặt **Node.js** (phiên bản 18+).
2. Di chuyển vào thư mục frontend và cài đặt thư viện:
   ```bash
   cd frontend
   npm install
   ```
3. Chạy môi trường phát triển:
   ```bash
   npm run dev
   ```
4. Mở trình duyệt tại địa chỉ: `http://localhost:5173`

---

## 📋 Quy tắc làm việc của Team
1. Nhận task nào trên Jira thì vào GitHub Desktop chuyển sang đúng nhánh (Branch) đó để code.
2. Code xong ngày nào phải Commit và Push lên GitHub ngày đó theo đúng quy chuẩn commit ở trên.
3. Trước khi merge code vào nhánh chính (`main`/`develop`), bắt buộc phải tạo Pull Request (PR) và test kỹ để không làm gãy luồng của người khác.
