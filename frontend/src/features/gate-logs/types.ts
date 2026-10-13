// US-18: nhật ký mở cổng thủ công (bằng Thẻ Master / chìa cơ) của cơ sở.

/**
 * Khớp entity AuditLog của BE (action = MANUAL_GATE_OPEN).
 * Thời gian là LocalDateTime giờ Việt Nam, không có hậu tố múi giờ, ví dụ "2026-10-12T14:30:00".
 */
export interface GateLog {
  auditLogId: number
  /** Nhân viên đã mở cổng */
  accountId: number | null
  facilityId: number | null
  /** Mã khách hàng được mở cổng hộ */
  customerId: number | null
  action: string
  openedAt: string
  reason: string | null
  /** Thời điểm ghi nhật ký */
  createdAt: string
}

export interface GateLogFilter {
  /** Tìm theo mã khách hàng, mã nhân viên hoặc lý do */
  query: string
  /** YYYY-MM-DD, tính theo ngày mở cổng, gồm cả 2 đầu; "" là không giới hạn */
  from: string
  to: string
}
