export interface ActivityLogEntry {
  activityLogId: number
  // null với các tác vụ tự động của hệ thống
  accountId: number | null
  actorName: string | null
  // ADMIN, BOM, MANAGER, STAFF, CUSTOMER
  actorRole: string | null
  action: string
  description: string | null
  // ISO LocalDateTime giờ VN
  createdAt: string
  ipAddress: string | null
}

export interface ActivityFilter {
  query: string
  // Mã nhóm hành động hoặc "ALL"
  action: string
  from: string
  to: string
}
