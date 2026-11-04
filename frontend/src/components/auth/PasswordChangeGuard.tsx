import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"

import { useAuth } from "@/context/AuthContext"
import { isTokenValid } from "@/lib/http"
import { normalizeRole } from "@/lib/roles"

/**
 * Chỉ cho tài khoản nội bộ đã đăng nhập vào trang đổi mật khẩu.
 * Không dùng RoleProtectedRoute để tránh vòng lặp redirect khi cờ mustChangePassword còn bật.
 */
function PasswordChangeGuard({ children }: { children: ReactNode }) {
  const { user, token, isAuthenticated } = useAuth()

  if (!isAuthenticated || !user || !isTokenValid(token)) {
    return <Navigate to="/internal_login" replace />
  }

  if (normalizeRole(user.role) === "CUSTOMER") {
    return <Navigate to="/customer_login" replace />
  }

  return <>{children}</>
}

export default PasswordChangeGuard
