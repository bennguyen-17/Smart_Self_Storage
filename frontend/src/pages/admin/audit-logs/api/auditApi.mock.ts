// Nhật ký mẫu, dùng khi VITE_USE_MOCK=true. Ngày tính theo "hôm nay".
// Mã hành động và cách viết mô tả chép từ code BE đang ghi vào bảng ActivityLog.

import { addDays, todayInVietnam } from "@/lib/format"

import type { ActivityLogEntry } from "../types"

function build(): ActivityLogEntry[] {
  const t = todayInVietnam()
  const at = (offset: number, time: string) => `${addDays(t, offset)}T${time}`
  const manager = {
    accountId: 3,
    actorName: "Trần Văn Quản Lý",
    actorRole: "MANAGER",
  }
  const staff = {
    accountId: 5,
    actorName: "Nguyễn Văn Nhân Viên 1",
    actorRole: "STAFF",
  }
  const customer = {
    accountId: 12,
    actorName: "Lê Minh Khách",
    actorRole: "CUSTOMER",
  }
  const system = { accountId: null, actorName: null, actorRole: null }
  const rows: Omit<ActivityLogEntry, "activityLogId">[] = [
    {
      ...manager,
      action: "APPROVE_FEE_DISCOUNT",
      description:
        "Quản lý duyệt miễn giảm hóa đơn PEN-7001 từ 600000 xuống 300000 VNĐ. Lý do: Khách thân thiết, trễ do nằm viện",
      createdAt: at(0, "09:30:12"),
      ipAddress: "10.10.1.20",
    },
    {
      ...manager,
      action: "LOGIN_FAILED",
      description: "Incorrect password",
      createdAt: at(0, "08:47:03"),
      ipAddress: "203.0.113.9",
    },
    {
      ...staff,
      action: "STAFF_RESERVATION_CHECK_IN",
      description:
        "RES RSV-2041 (id=41): collected 1800000 via CASH; contract=ACTIVE; unit=OCCUPIED; result=SUCCESS",
      createdAt: at(0, "08:15:40"),
      ipAddress: "10.10.1.31",
    },
    {
      ...staff,
      action: "LOGIN_SUCCESS",
      description: "Login successful",
      createdAt: at(0, "07:55:02"),
      ipAddress: "10.10.1.31",
    },
    {
      ...system,
      action: "EXPIRY_REMINDER_T7",
      description:
        "Hệ thống tự động gửi nhắc hạn hợp đồng #103 (ô HN01-F1-M02) sắp hết hạn sau 7 ngày qua Email/Portal.",
      createdAt: at(0, "00:05:00"),
      ipAddress: null,
    },
    {
      ...manager,
      action: "PUT_MAINTENANCE",
      description:
        "Đưa ô kho HN01-F1-S01 vào bảo trì: khóa thông minh báo lỗi pin",
      createdAt: at(-1, "16:20:45"),
      ipAddress: "10.10.1.20",
    },
    {
      ...customer,
      action: "CLICKWRAP_E_CONTRACT_SIGNED",
      description:
        "Khách hàng đã xác nhận Clickwrap thỏa thuận Hợp đồng điện tử cho đơn cọc DEP-5521",
      createdAt: at(-1, "14:02:19"),
      ipAddress: "113.161.4.7",
    },
    {
      ...system,
      action: "NO_SHOW_CANCELED",
      description:
        "Tự động hủy do No-Show hợp đồng #98, ô HN01-F2-L01. Tịch thu 100% tiền cọc do quá hạn check-in.",
      createdAt: at(-2, "00:10:00"),
      ipAddress: null,
    },
    {
      ...staff,
      action: "CONFIRM_CHECKOUT_TERMINATED",
      description:
        "Xác nhận bàn giao trả kho #88 (ô HN01-F1-M05). HĐ -> TERMINATED, ô -> UNDER_MAINTENANCE, PIN vô hiệu hóa.",
      createdAt: at(-3, "10:11:00"),
      ipAddress: "10.10.1.31",
    },
    {
      ...manager,
      action: "COMPLETE_MAINTENANCE",
      description:
        "Nghiệm thu hoàn tất bảo trì, mở lại ô kho HN01-F1-M05 thành AVAILABLE",
      createdAt: at(-3, "15:40:27"),
      ipAddress: "10.10.1.20",
    },
    {
      ...customer,
      action: "EXTEND_CONTRACT",
      description: "Gia hạn hợp đồng #76 thêm 3 tháng",
      createdAt: at(-4, "20:45:00"),
      ipAddress: "113.161.4.7",
    },
    {
      ...manager,
      action: "CONFIRM_REFUND_EXECUTED",
      description: "Xác nhận đã chuyển hoàn 900000 VNĐ cho đơn cọc DEP-5410",
      createdAt: at(-5, "11:30:00"),
      ipAddress: "10.10.1.20",
    },
  ]
  return rows.map((r, i) => ({ ...r, activityLogId: 99300 - i }))
}

export function mockListActivityLogs(): Promise<ActivityLogEntry[]> {
  return new Promise((resolve) => setTimeout(() => resolve(build()), 300))
}
