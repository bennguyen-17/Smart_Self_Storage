import type { AccountFilter, AccountFormValues, InternalAccount, InternalRole } from "./types"

export const INTERNAL_ROLES: readonly InternalRole[] = ["STAFF", "MANAGER", "BOM", "ADMIN"]

// Mật khẩu mặc định BE cấp cho tài khoản nội bộ mới, cần khớp với AdminAccountController
export const INITIAL_INTERNAL_PASSWORD = "123456@Test"

export const ROLE_LABEL: Record<InternalRole, string> = {
  STAFF: "Nhân viên cơ sở",
  MANAGER: "Quản lý cơ sở",
  BOM: "Ban giám đốc",
  ADMIN: "Quản trị hệ thống",
}

// Chỉ Staff và Manager gắn với một cơ sở cụ thể
export function roleNeedsFacility(role: InternalRole): boolean {
  return role === "STAFF" || role === "MANAGER"
}

export type AccountFormErrors = Partial<Record<"fullName" | "email" | "phone" | "facilityId", string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^0\d{9}$/

// Khớp giới hạn cột VARCHAR bảng Account
export const FULL_NAME_MAX = 100
export const EMAIL_MAX = 255

// Tạo mới bắt buộc SĐT vì tài khoản nội bộ đăng nhập bằng SĐT
export function validateAccountForm(values: AccountFormValues, { requirePhone = false } = {}): AccountFormErrors {
  const errors: AccountFormErrors = {}
  if (values.fullName.trim().length < 2) errors.fullName = "Nhập họ tên (ít nhất 2 ký tự)"
  else if (values.fullName.trim().length > FULL_NAME_MAX) errors.fullName = `Họ tên tối đa ${FULL_NAME_MAX} ký tự`
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = "Email không hợp lệ"
  else if (values.email.trim().length > EMAIL_MAX) errors.email = `Email tối đa ${EMAIL_MAX} ký tự`
  const phone = values.phone.replace(/\s/g, "")
  if (!phone && requirePhone) errors.phone = "Nhập số điện thoại (dùng để đăng nhập)"
  else if (phone && !PHONE_PATTERN.test(phone)) errors.phone = "Số điện thoại gồm 10 số, bắt đầu bằng 0"
  if (roleNeedsFacility(values.role) && values.facilityId === "") {
    errors.facilityId = "Nhân viên và quản lý cơ sở phải được gán một cơ sở"
  }
  return errors
}

// BOM và Admin luôn lưu facilityId = null dù form còn giữ lựa chọn trước đó
export function effectiveFacilityId(values: Pick<AccountFormValues, "role" | "facilityId">): number | null {
  if (!roleNeedsFacility(values.role)) return null
  return values.facilityId === "" ? null : values.facilityId
}

// Chặn Admin tự khóa hoặc tự đổi vai trò của chính mình
export function isSelf(account: InternalAccount, currentAccountId: number | null): boolean {
  return currentAccountId !== null && account.accountId === currentAccountId
}

function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase().trim()
}

export function filterAccounts(accounts: readonly InternalAccount[], filter: AccountFilter): InternalAccount[] {
  const q = normalizeText(filter.query)
  return accounts.filter((a) => {
    if (filter.role !== "ALL" && a.role !== filter.role) return false
    if (filter.facilityId !== "ALL" && a.facilityId !== filter.facilityId) return false
    if (filter.status !== "ALL" && a.status !== filter.status) return false
    if (!q) return true
    return normalizeText(`${a.fullName} ${a.email} ${a.phone ?? ""}`).includes(q)
  })
}
