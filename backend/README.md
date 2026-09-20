# Backend (Java Spring Boot)

Hướng dẫn chạy server dành cho team Backend.

LƯU Ý QUAN TRỌNG TRƯỚC KHI CHẠY:
Vì dự án có sử dụng MySQL và Spring Data JPA, server sẽ BÁO LỖI VÀ KHÔNG CHẠY ĐƯỢC nếu bạn chưa cấu hình Database.
Bạn cần bật MySQL dưới máy tính, tạo sẵn một database, sau đó mở file:
src/main/resources/application.properties
Và thêm các dòng cấu hình kết nối database (url, username, password) trước khi bấm Run.

Cách chạy code:
1. Mở phần mềm IntelliJ IDEA (hoặc Eclipse/VS Code).
2. Chọn Open -> Trỏ vào thư mục backend.
3. Đợi Maven tự động tải các thư viện (Dependencies).
4. Mở file src/main/java/com/swp391/backend/BackendApplication.java.
5. Bấm nút Run để khởi động Server Spring Boot.
