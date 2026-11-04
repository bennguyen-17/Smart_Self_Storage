import { passwordRules } from "@/lib/validation"

/** Trang đổi mật khẩu dùng chung cho đổi lần đầu (bắt buộc) và đổi chủ động. */
export const PASSWORD_CHANGE_PATH = "/doi-mat-khau"

export interface PasswordChangeValues {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

/** Tài khoản nội bộ vừa được Admin tạo bằng mật khẩu tạm phải đổi trước khi vào cổng. */
export function isPasswordChangeRequired(user: { mustChangePassword?: boolean } | null | undefined): boolean {
  return Boolean(user?.mustChangePassword)
}

/**
 * Trả về thông báo lỗi đầu tiên, hoặc null nếu hợp lệ.
 * Mật khẩu mới được trim giống backend (LoginService.changePassword) để FE/BE kiểm tra cùng một chuỗi.
 */
export function validatePasswordChange(values: PasswordChangeValues): string | null {
  if (!values.currentPassword) {
    return "Vui lòng nhập mật khẩu hiện tại."
  }

  const newPassword = values.newPassword.trim()
  if (!newPassword) {
    return "Vui lòng nhập mật khẩu mới."
  }

  if (newPassword === values.currentPassword.trim()) {
    return "Mật khẩu mới phải khác mật khẩu hiện tại."
  }

  const failedRule = passwordRules.find((rule) => !rule.test(newPassword))
  if (failedRule) {
    return `Mật khẩu mới chưa đạt yêu cầu: ${failedRule.label.toLowerCase()}.`
  }

  if (newPassword !== values.confirmPassword.trim()) {
    return "Mật khẩu xác nhận không khớp."
  }

  return null
}
