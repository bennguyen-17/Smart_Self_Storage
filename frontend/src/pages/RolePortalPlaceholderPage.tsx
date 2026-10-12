import { Link, useNavigate } from "react-router-dom"
import {
  ClockIcon,
  LogOutIcon,
  MoonIcon,
  ShieldCheckIcon,
  SunIcon,
  WarehouseIcon,
} from "lucide-react"
import { toast } from "sonner"

import { useTheme } from "@/components/common/theme-provider"
import { useAuth } from "@/context/AuthContext"
import {
  getRoleBadgeClass,
  getRolePortalName,
  getRoleTitle,
  normalizeRole,
} from "@/lib/roles"

interface RolePortalPlaceholderPageProps {
  portalType: "BOM" | "MANAGER" | "ADMIN"
}

function resolveIsDark(theme: string): boolean {
  if (theme === "dark") return true
  if (theme === "light") return false
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  )
}

/**
 * Trang thông báo cho các cổng chưa triển khai (BOM, Manager, Admin).
 * Chỉ hiển thị thông báo "Trang ... đang được cập nhật" và chứng minh phân quyền thành công,
 * không sinh dữ liệu giả hay tính năng bịa đặt.
 */
function RolePortalPlaceholderPage({
  portalType,
}: RolePortalPlaceholderPageProps) {
  const { theme, setTheme } = useTheme()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const isDark = resolveIsDark(theme)
  const userRole = normalizeRole(user?.role)
  const roleTitle = getRoleTitle(portalType)
  const portalName = getRolePortalName(portalType)
  const badgeClass = getRoleBadgeClass(portalType)

  function handleLogout() {
    signOut()
    toast.success("Đã đăng xuất khỏi phiên làm việc.")
    navigate("/internal_login")
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 antialiased dark:bg-slate-950">
      {/* TOPBAR */}
      <header className="sticky top-0 z-50 flex h-16 w-full shrink-0 items-center justify-between border-b bg-white px-6 shadow-sm transition-colors dark:bg-slate-900 sm:px-10">
        <div className="flex shrink-0 items-center space-x-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
            <WarehouseIcon className="size-5" strokeWidth={2.5} />
          </div>
          <div>
            <span className="block text-base leading-tight font-bold text-foreground">
              Smart Storage
            </span>
            <span className="block text-[11px] font-medium text-muted-foreground">
              Hệ thống cho thuê kho tự quản thông minh 24/7
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center space-x-3">
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="flex cursor-pointer items-center space-x-2 rounded-xl border px-3 py-1.5 text-xs font-bold whitespace-nowrap shadow-sm transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {isDark ? (
              <MoonIcon className="size-3.5 shrink-0 text-indigo-400" />
            ) : (
              <SunIcon className="size-3.5 shrink-0 text-amber-500" />
            )}
            <span className="hidden text-xs md:inline">
              {isDark ? "Giao diện Tối" : "Giao diện Sáng"}
            </span>
          </button>

          {user && (
            <div className="hidden items-center space-x-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 sm:flex dark:border-slate-800 dark:bg-slate-800/80">
              <div className="text-left">
                <div className="text-xs font-extrabold text-foreground">
                  {user.fullName || "Người dùng nội bộ"}
                </div>
                <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                  {roleTitle}
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            title="Đăng xuất tài khoản"
            className="flex cursor-pointer items-center space-x-1.5 rounded-xl border border-rose-200/70 px-3 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50 dark:border-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-950/40"
          >
            <LogOutIcon className="size-3.5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT: CHỈ HIỂN THỊ THÔNG BÁO ĐANG CẬP NHẬT */}
      <main className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg dark:border-slate-800 dark:bg-slate-900 sm:p-12">
          {/* ICON */}
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-3xl bg-amber-50 text-amber-600 shadow-inner dark:bg-amber-950/40 dark:text-amber-400">
            <ClockIcon className="size-10 stroke-[2.2]" />
          </div>

          {/* BADGE CHỨNG MINH PHÂN QUYỀN */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
            <ShieldCheckIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span>Xác thực thành công • Quyền hạn: {portalType}</span>
          </div>

          {/* TIÊU ĐỀ */}
          <h1 className="mb-3 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Trang {portalName} đang được cập nhật
          </h1>

          {/* MÔ TẢ */}
          <p className="mb-8 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Tài khoản của bạn đã được hệ thống phân quyền chính xác vào phân hệ{" "}
            <span className={`rounded-md px-2 py-0.5 text-xs font-extrabold ${badgeClass}`}>
              {roleTitle}
            </span>
            . Giao diện chức năng dành riêng cho vai trò này hiện đang trong quá trình cập nhật.
          </p>

          {/* HÀNH ĐỘNG */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/internal_login"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Về Cổng Đăng Nhập
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700"
            >
              <LogOutIcon className="mr-2 size-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default RolePortalPlaceholderPage
