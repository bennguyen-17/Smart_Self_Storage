export interface AdminCustomer {
  accountId: number
  fullName: string | null
  phone: string | null
  email: string | null
  // LOCKED (tạm khóa do sai mật khẩu), ACTIVE, UNVERIFIED, CLOSED
  status: string
  // Chỉ có giá trị khi status là LOCKED
  lockUntil: string | null
}

export type CustomerStatusFilter = "ALL" | "LOCKED" | "ACTIVE" | "OTHER"

export interface CustomerFilter {
  query: string
  status: CustomerStatusFilter
}
