export type InternalRole = "ADMIN" | "BOM" | "MANAGER" | "STAFF"

export type AccountStatus = "ACTIVE" | "LOCKED"

export interface InternalAccount {
  accountId: number
  fullName: string
  email: string
  phone: string | null
  role: InternalRole
  // null với BOM và Admin (toàn hệ thống)
  facilityId: number | null
  status: AccountStatus
  mustChangePassword: boolean
  lastLoginAt: string | null
}

export interface AccountFormValues {
  fullName: string
  email: string
  phone: string
  role: InternalRole
  // "" khi chưa chọn
  facilityId: number | ""
}

export interface AccountFilter {
  query: string
  role: InternalRole | "ALL"
  facilityId: number | "ALL"
  status: AccountStatus | "ALL"
}
