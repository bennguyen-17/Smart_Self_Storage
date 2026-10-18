// Nhật ký kiểm soát ra vào cổng cơ sở (Mã PIN động IoT 24/7 và Thẻ Master thủ công)

export interface GateLog {
  auditLogId: number
  accountId: number | null
  facilityId: number | null
  customerId: number | null
  action: string
  openedAt: string
  reason: string | null
  createdAt: string
  
  // Thông tin người ra vào cổng:
  personName?: string
  personPhone?: string
  personRole?: string
  identityNumber?: string
  facilityName?: string
  gateName?: string
  accessMethod?: string
  staffName?: string
}

export interface GateLogFilter {
  /** Tìm theo tên khách, SĐT, CCCD, mã khách, nhân viên hoặc vị trí cổng */
  query: string
  /** Lọc theo phương thức: ALL | PIN | MANUAL */
  method: "ALL" | "PIN" | "MANUAL"
  /** YYYY-MM-DD, tính theo ngày mở cổng, gồm cả 2 đầu; "" là không giới hạn */
  from: string
  to: string
}
