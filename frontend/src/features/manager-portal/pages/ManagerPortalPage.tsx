import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom"

import { useAuth } from "@/context/AuthContext"
import { getRoleTitle, normalizeRole } from "@/lib/roles"

import ManagerNavbar from "../components/ManagerNavbar"
import TabPlaceholder from "../components/TabPlaceholder"
import { DEFAULT_MANAGER_TAB, findManagerTab } from "../managerTabs"

/**
 * Cổng Quản lý cơ sở (Vỹ). Mỗi trang có link riêng /manager/<trang>, chuyển trang bằng navbar.
 * Chặn quyền do RoleProtectedRoute chung của nhóm đảm nhận (route "/manager/*" trong app/App.tsx).
 * Body chỉ gồm tiêu đề trang, bộ lọc và bảng của trang đó.
 */
function ManagerPortalPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  // BE trả thêm phone, facilityId trong user dù kiểu AuthUser chưa khai báo
  const extra = user as (typeof user & { phone?: string | null; facilityId?: number | null }) | null
  const params = useParams()
  const [search] = useSearchParams()

  const section = params["*"]?.split("/")[0]
  const tab = findManagerTab(section)
  if (!tab) {
    // Link cũ dạng /manager?tab=gate-logs vẫn dẫn đúng trang; còn lại về trang mặc định
    const legacy = findManagerTab(search.get("tab"))
    return <Navigate to={`/manager/${legacy?.key ?? DEFAULT_MANAGER_TAB}`} replace />
  }

  const Panel = tab.component

  const logout = () => {
    signOut()
    navigate("/internal_login", { replace: true })
  }

  return (
    // Dùng Inter (font của dự án) cho cả trang: class chung .staff-portal ưu tiên Plus Jakarta Sans,
    // trong khi popup / ngăn bên được gắn ra ngoài trang nên chỉ có Inter → 2 font trên một màn hình.
    <div className="staff-portal flex min-h-screen flex-col antialiased" style={{ fontFamily: "var(--font-sans)" }}>
      <ManagerNavbar
        profile={{
          accountId: user?.id ?? null,
          fullName: user?.fullName ?? "Quản lý cơ sở",
          roleLabel: getRoleTitle(normalizeRole(user?.role)),
          email: user?.email ?? null,
          phone: extra?.phone ?? null,
          facilityId: extra?.facilityId ?? null,
        }}
        onLogout={logout}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-title text-xl font-black tracking-tight">{tab.title}</h1>
        {Panel ? <Panel /> : <TabPlaceholder tab={tab} />}
      </main>
    </div>
  )
}

export default ManagerPortalPage
