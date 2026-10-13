// US-29: tài khoản nội bộ (Staff, Facility Manager, BOM, Admin) do Admin quản lý.
// Contract FE đề xuất cho BE (chưa có API, xem qa-log). Khi BE làm xong thì chỉ cần khớp lại kiểu ở đây.

export type InternalRole = "ADMIN" | "BOM" | "MANAGER" | "STAFF"

export type AccountStatus = "ACTIVE" | "LOCKED"

export interface InternalAccount {
  accountId: number
  fullName: string
  email: string
  phone: string | null
  role: InternalRole
  /** Cơ sở được gán; null = toàn hệ thống (BOM, Admin) */
  facilityId: number | null
  status: AccountStatus
  /** Tài khoản mới tạo phải đổi mật khẩu tạm ở lần đăng nhập đầu */
  mustChangePassword: boolean
  lastLoginAt: string | null
}

export interface AccountFormValues {
  fullName: string
  email: string
  phone: string
  role: InternalRole
  /** "" khi chưa chọn */
  facilityId: number | ""
}

export interface AccountFilter {
  query: string
  role: InternalRole | "ALL"
  facilityId: number | "ALL"
  status: AccountStatus | "ALL"
}
