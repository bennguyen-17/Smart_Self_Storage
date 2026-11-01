// Luật quản lý tài khoản nội bộ (US-29). Hàm thuần, kiểm bằng bảng DDT trong accountRules.test.ts.

import type { AccountFilter, AccountFormValues, InternalAccount, InternalRole } from "./types"

export const INTERNAL_ROLES: readonly InternalRole[] = ["STAFF", "MANAGER", "BOM", "ADMIN"]

/**
 * Mật khẩu ban đầu BE đặt cho mọi tài khoản nội bộ mới (AdminAccountController.createAccount).
 * Chưa có SMTP gửi mật khẩu tạm, nên Admin báo trực tiếp cho người dùng; đổi ở BE thì sửa ở đây.
 */
export const INITIAL_INTERNAL_PASSWORD = "123456"

export const ROLE_LABEL: Record<InternalRole, string> = {
  STAFF: "Nhân viên cơ sở",
  MANAGER: "Quản lý cơ sở",
  BOM: "Ban giám đốc",
  ADMIN: "Quản trị hệ thống",
}

/** Staff và Manager làm việc tại một cơ sở cụ thể; BOM và Admin quản lý toàn hệ thống */
export function roleNeedsFacility(role: InternalRole): boolean {
  return role === "STAFF" || role === "MANAGER"
}

export type AccountFormErrors = Partial<Record<"fullName" | "email" | "phone" | "facilityId", string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^0\d{9}$/

/** Độ dài tối đa theo bảng Account (fullName VARCHAR(100), email VARCHAR(255)); dài hơn thì BE báo lỗi SQL */
export const FULL_NAME_MAX = 100
export const EMAIL_MAX = 255

/**
 * Kiểm form tạo / sửa tài khoản. Rỗng nghĩa là hợp lệ.
 * AC: Staff/Manager tạo mà không gán cơ sở → bị chặn.
 * Tạo mới bắt buộc số điện thoại: đăng nhập nội bộ dùng số điện thoại (bỏ trống thì BE tự đặt số ngẫu nhiên, người dùng không đăng nhập được).
 */
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

/** Cơ sở thực sự lưu: BOM/Admin luôn là toàn hệ thống dù form còn giữ lựa chọn cũ */
export function effectiveFacilityId(values: Pick<AccountFormValues, "role" | "facilityId">): number | null {
  if (!roleNeedsFacility(values.role)) return null
  return values.facilityId === "" ? null : values.facilityId
}

/** Admin không được tự khóa hay tự đổi vai trò của chính mình (tránh mất quyền quản trị) */
export function isSelf(account: InternalAccount, currentAccountId: number | null): boolean {
  return currentAccountId !== null && account.accountId === currentAccountId
}

function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase().trim()
}

/** Lọc danh sách tài khoản theo từ khóa (tên, email, SĐT), vai trò, cơ sở và trạng thái */
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
