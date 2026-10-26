// Admin tìm và mở khóa tài khoản khách (đề: "Manage user accounts"; BR-03: sai mật khẩu 5 lần bị khóa 15 phút,
// Admin mở khóa sớm được). Khớp AdminCustomerResponse của BE (/api/admin/customers).

export interface AdminCustomer {
  accountId: number
  fullName: string | null
  phone: string | null
  email: string | null
  /** BE trả "LOCKED" khi đang bị khóa do sai mật khẩu; còn lại là trạng thái tài khoản (ACTIVE, UNVERIFIED, CLOSED…) */
  status: string
  /** Khóa đến lúc nào (chỉ có khi LOCKED) */
  lockUntil: string | null
}

export type CustomerStatusFilter = "ALL" | "LOCKED" | "ACTIVE" | "OTHER"

export interface CustomerFilter {
  query: string
  status: CustomerStatusFilter
}
