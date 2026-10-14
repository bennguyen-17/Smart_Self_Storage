// US-30: nhật ký hệ thống (System Audit Log) cho Admin.
// BE CHƯA có API đọc: kiểu dưới đây là contract FE đề xuất (GET /api/admin/audit-logs, xem qa-log).
// Mỗi bản ghi có đủ trường theo quy định ghi log: người, vai trò, cơ sở, hành động, đối tượng, trước/sau, thời gian, IP.

export type AuditAction =
  | "LOGIN"
  | "LOGIN_FAILED"
  | "ACCOUNT_CREATED"
  | "ACCOUNT_LOCKED"
  | "ROLE_CHANGED"
  | "CONTRACT_STATUS_CHANGED"
  | "UNIT_STATUS_CHANGED"
  | "PAYMENT_COLLECTED"
  | "FEE_DISCOUNTED"
  | "CONFIG_CHANGED"
  | "MANUAL_GATE_OPEN"

export interface AuditLogEntry {
  logId: number
  accountId: number | null
  actorName: string
  actorRole: string
  facilityCode: string | null
  action: AuditAction | string
  /** Đối tượng bị tác động, ví dụ "CTR-HN01-0103", "HN01-F1-S01", "account #12" */
  target: string | null
  before: string | null
  after: string | null
  /** LocalDateTime giờ Việt Nam, ví dụ "2026-10-14T09:12:00" */
  createdAt: string
  ipAddress: string | null
}

export interface AuditFilter {
  query: string
  action: AuditAction | "ALL"
  from: string
  to: string
}
