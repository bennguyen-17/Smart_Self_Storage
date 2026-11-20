export interface GateLog {
  auditLogId: number
  accountId: number | null
  facilityId: number | null
  customerId: number | null
  action: string
  openedAt: string
  reason: string | null
  createdAt: string
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
  query: string
  method: "ALL" | "PIN" | "MANUAL"
  // YYYY-MM-DD (gồm cả 2 đầu), chuỗi rỗng là không giới hạn
  from: string
  to: string
}
