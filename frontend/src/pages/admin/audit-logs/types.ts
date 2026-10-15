// US-30: nhật ký hoạt động hệ thống cho Admin.
// Khớp bảng ActivityLog có sẵn trong DB (activityLogId, accountId, action, description, createdAt, ipAddress):
// BE đã GHI các thao tác vào bảng này, chỉ còn thiếu API ĐỌC (contract FE đề xuất ở qa-log Q-32).
// actorName / actorRole là BE join từ bảng Account; thao tác tự động của hệ thống thì accountId = null.

export interface ActivityLogEntry {
  activityLogId: number
  accountId: number | null
  actorName: string | null
  /** ADMIN, BOM, MANAGER, STAFF, CUSTOMER */
  actorRole: string | null
  /** Mã hành động BE ghi, ví dụ "APPROVE_FEE_DISCOUNT", "EXPIRY_REMINDER_T7" */
  action: string
  /** Mô tả BE ghi kèm (có thể là tiếng Việt hoặc tiếng Anh) */
  description: string | null
  /** LocalDateTime giờ Việt Nam, ví dụ "2026-10-14T09:12:00" */
  createdAt: string
  ipAddress: string | null
}

export interface ActivityFilter {
  query: string
  /** Mã nhóm hành động (xem actionGroup) hoặc "ALL" */
  action: string
  from: string
  to: string
}
