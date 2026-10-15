import type { ReactNode } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { LogOutIcon, ShieldAlertIcon } from "lucide-react"

import { useAuth } from "@/context/AuthContext"
import {
  getRoleBadgeClass,
  getRoleDestination,
  getRolePortalName,
  getRoleTitle,
  normalizeRole,
  type UserRole,
} from "@/lib/roles"

interface RoleProtectedRouteProps {
  allowedRoles: UserRole[]
  children: ReactNode
}

/**
 * Route Guard bảo vệ route theo vai trò (RBAC):
 * - Chưa đăng nhập -> redirect về cổng đăng nhập tương ứng.
 * - Đã đăng nhập nhưng sai vai trò -> hiển thị màn hình 403 Access Denied với nút về đúng portal.
 */
function RoleProtectedRoute({
  allowedRoles,
  children,
}: RoleProtectedRouteProps) {
  const { user, isAuthenticated, signOut } = useAuth()
  const navigate = useNavigate()

  // 1. Kiểm tra trạng thái đăng nhập
  if (!isAuthenticated || !user) {
    const isCustomerRoute = allowedRoles.includes("CUSTOMER")
    return (
      <Navigate
        to={isCustomerRoute ? "/customer_login" : "/internal_login"}
        replace
      />
    )
  }

  // 2. Chuẩn hóa vai trò người dùng
  const userRole = normalizeRole(user.role)

  // 3. Kiểm tra quyền truy cập
  if (!allowedRoles.includes(userRole)) {
    const userRoleTitle = getRoleTitle(userRole)
    const userPortalName = getRolePortalName(userRole)
    const userDestination = getRoleDestination(userRole)
    const badgeClass = getRoleBadgeClass(userRole)

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 antialiased dark:bg-slate-950">
        <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-white p-6 text-center shadow-xl dark:border-rose-900/50 dark:bg-slate-900 sm:p-8">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <ShieldAlertIcon className="size-8" />
          </div>

          <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase dark:text-white sm:text-xl">
            403 · Truy Cập Bị Từ Chối
          </h2>

          <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
            Tài khoản <b className="text-foreground">{user.fullName}</b> đang đăng nhập với vai trò:
          </p>

          <div className="mt-2 flex justify-center">
            <span
              className={`rounded-full border px-3 py-1 font-mono text-xs font-black uppercase ${badgeClass}`}
            >
              {userRoleTitle}
            </span>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left text-xs leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
            Trang bạn đang truy cập yêu cầu một trong các quyền:{" "}
            <b className="font-bold text-rose-600 dark:text-rose-400">
              {allowedRoles.join(", ")}
            </b>
            . Bạn không có quyền thao tác tại khu vực này.
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              to={userDestination}
              className="flex w-full items-center justify-center rounded-xl bg-blue-600 py-3 text-xs font-black text-white shadow-md transition hover:bg-blue-700"
            >
              Đi tới {userPortalName} →
            </Link>

            <button
              type="button"
              onClick={() => {
                signOut()
                navigate("/internal_login")
              }}
              className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-300 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <LogOutIcon className="size-3.5" />
              <span>Đăng xuất để đổi tài khoản khác</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 4. Đúng quyền -> Cho phép truy cập
  return <>{children}</>
}

export default RoleProtectedRoute
