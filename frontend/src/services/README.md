# HƯỚNG DẪN TÍCH HỢP SWAGGER API (SMART SELF STORAGE FRONTEND)

Tất cả dữ liệu trong giao diện đã được **tách biệt 100% khỏi các component UI** và chuyển về tầng Dịch vụ (`src/services/`).

---

## 1. Cấu trúc các file Service

| File Service | Chức năng | Các API Swagger tương ứng |
|---|---|---|
| `apiClient.js` | Axios client cấu hình chung | Tự động đính kèm `Bearer Token`, timeout, bắt lỗi |
| `customerService.js` | Thông tin khách hàng | `GET /customers/profile`<br>`PUT /customers/profile` |
| `facilityService.js` | Cơ sở chi nhánh & Sơ đồ ô kho 2D | `GET /branches`<br>`GET /storage-units?branchCode={code}&floor={floor}` |
| `contractService.js` | Kho của tôi, Hợp đồng & Mã PIN | `GET /contracts/my-contracts`<br>`GET /gate-pins/live?branchCode={code}`<br>`POST /contracts/{id}/extend` |
| `bookingService.js` | Đặt cọc giữ chỗ ô kho & VietQR | `POST /bookings/deposit`<br>`GET /bookings/{code}/status` |
| `supportService.js` | Gửi yêu cầu hỗ trợ kỹ thuật (Ticket) | `POST /support/tickets` |

---

## 2. Cách ráp nối khi bạn làm API có Swagger

### Bước 1: Mở file `.env`
Đổi cờ `VITE_USE_MOCK` sang `false` và trỏ đúng đường dẫn Backend Spring Boot:
```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_USE_MOCK=false
```

### Bước 2: Kiểm tra đường dẫn Endpoint trong file Service
Mỗi hàm trong thư mục `src/services/` đều đã được đánh dấu sẵn chú thích Swagger. Ví dụ trong `contractService.js`:
```javascript
/**
 * Lấy danh sách hợp đồng kho đang sở hữu
 * SWAGGER ENDPOINT: GET /api/v1/contracts/my-contracts
 */
export const getMyContracts = async () => {
  if (isMockMode()) {
    return { success: true, data: MOCK_CONTRACTS };
  }

  // Nếu đường dẫn Swagger của nhóm là /api/v1/user/contracts, chỉ cần sửa dòng này:
  const res = await apiClient.get('/contracts/my-contracts');
  return { success: true, data: res.data || res };
};
```

👉 **Tuyệt đối KHÔNG CẦN sửa code trong các file JSX** (`CustomerPortal.jsx`, `StorageMap2D.jsx`, `MyStorageTab.jsx`, `CustomerProfileModal.jsx`). Giao diện sẽ tự động cập nhật dữ liệu trả về từ Swagger!
