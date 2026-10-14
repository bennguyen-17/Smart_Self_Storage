import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom"

import { useTheme } from "@/components/common/theme-provider"
import { useAuth } from "@/context/AuthContext"
import TabPlaceholder from "@/features/manager-portal/components/TabPlaceholder"
import { resolveIsDark } from "@/features/internal-shell/resolveIsDark"
import { getRoleTitle, normalizeRole } from "@/lib/roles"

import { DEFAULT_ADMIN_TAB, findAdminTab } from "../adminTabs"
import AdminNavbar from "../components/AdminNavbar"

/**
 * Cổng Quản trị hệ thống (Vỹ). Mỗi trang có link riêng /admin/<trang>, chuyển trang bằng navbar.
 * Chặn quyền do RoleProtectedRoute chung của nhóm đảm nhận (route "/admin/*" trong app/App.tsx).
 * Body chỉ gồm tiêu đề trang, bộ lọc và bảng của trang đó.
 */
function AdminPortalPage() {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const { user, signOut } = useAuth()
  const params = useParams()
  const [search] = useSearchParams()

  const section = params["*"]?.split("/")[0]
  const tab = findAdminTab(section)
  if (!tab) {
    // Link cũ dạng /admin?tab=audit vẫn dẫn đúng trang; còn lại về trang mặc định
    const legacy = findAdminTab(search.get("tab"))
    return <Navigate to={`/admin/${legacy?.key ?? DEFAULT_ADMIN_TAB}`} replace />
  }

  const isDark = resolveIsDark(theme)
  const Panel = tab.component

  const logout = () => {
    signOut()
    navigate("/internal_login", { replace: true })
  }

  return (
    <div className="staff-portal flex min-h-screen flex-col antialiased">
      <AdminNavbar
        fullName={user?.fullName ?? "Quản trị viên"}
        roleLabel={getRoleTitle(normalizeRole(user?.role))}
        email={user?.email}
        isDark={isDark}
        onToggleTheme={() => setTheme(isDark ? "light" : "dark")}
        onLogout={logout}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-title text-xl font-black tracking-tight">{tab.title}</h1>
        {Panel ? <Panel /> : <TabPlaceholder tab={tab} />}
      </main>
    </div>
  )
}

export default AdminPortalPage
