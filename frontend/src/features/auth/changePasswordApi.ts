import apiClient from "@/lib/apiClient"

export interface PasswordChangeResult {
  success: boolean
  message?: string
}

/**
 * POST /api/auth/change-password  body { oldPassword, newPassword }
 * BE đổi mật khẩu, tự hạ cờ mustChangePassword và trả { success, message }. Không cấp token mới.
 */
export async function changePassword(oldPassword: string, newPassword: string): Promise<PasswordChangeResult> {
  const response = await apiClient.post("/auth/change-password", { oldPassword, newPassword })
  return response as unknown as PasswordChangeResult
}
