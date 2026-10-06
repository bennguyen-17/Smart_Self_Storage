# Smart Self Storage (Hệ thống quản lý kho lưu trữ tự phục vụ thông minh)


## 👥 Thành viên nhóm (Team Members)
- **Bảo** - Backend Developer
- **Khánh** - Backend Developer
- **Tâm** - Frontend Developer
- **Vy** - Frontend Developer
- **Vỹ** - Frontend Developer

---

## 🛠️ Công nghệ sử dụng (Tech Stack)
- **Frontend:** React.js (Vite), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Java Spring Boot, Spring Security, Spring Data JPA, OpenAPI Swagger
- **Database:** MySQL

---

## 📌 QUY CHUẨN COMMIT CODE & PULL REQUEST (PR)
### 1. Cú pháp chuẩn duy nhất (Commit Summary & PR Title)
```text
<type>(us-xx-be): <short summary in english>
<type>(us-xx-fe): <short summary in english>
```
* **Khi làm task chung không thuộc riêng US nào:** Thay scope bằng `(be)`, `(fe)` hoặc `(db)`.

### 2. Danh sách `type` và ví dụ mẫu (1 ví dụ mỗi loại)

| Type | Mục đích sử dụng | Ví dụ mẫu (Commit & PR Title) |
| :--- | :--- | :--- |
| **`feat`** | Thêm tính năng mới, API mới, tạo màn hình/component mới | `feat(us-13-be): add API to change storage unit type` |
| **`fix`** | Sửa lỗi, fix bug logic hoặc lỗi giao diện | `fix(us-13-be): fix facility permission check` |
| **`style`** | Chỉnh CSS, màu sắc, bố cục giao diện (không đổi logic) | `style(us-01-fe): update login button colors and layout` |
| **`refactor`** | Tối ưu, dọn dẹp, tái cấu trúc code sạch hơn | `refactor(us-13-be): clean up storage service logic` |
| **`chore`** | Cập nhật file SQL, cài thư viện, sửa file config | `chore(db): update support ticket table script` |
| **`docs`** | Viết tài liệu README, chú thích Swagger API | `docs(be): update contract API documentation` |
