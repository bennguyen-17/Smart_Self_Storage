import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom"

import { useAuth } from "@/context/AuthContext"
import { getRoleTitle, normalizeRole } from "@/lib/roles"

import { DEFAULT_ADMIN_TAB, findAdminTab } from "@/features/admin/adminTabs"
import AdminNavbar from "@/features/admin/components/AdminNavbar"

function AdminPortalPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  // BE trả thêm phone, facilityId trong user dù kiểu AuthUser chưa khai báo
  const extra = user as (typeof user & { phone?: string | null; facilityId?: number | null }) | null
  const params = useParams()
  const [search] = useSearchParams()

  const section = params["*"]?.split("/")[0]
  const tab = findAdminTab(section)
  if (!tab) {
    // Link cũ dạng /admin?tab=audit vẫn dẫn đúng trang; còn lại về trang mặc định
    const legacy = findAdminTab(search.get("tab"))
    return <Navigate to={`/admin/${legacy?.key ?? DEFAULT_ADMIN_TAB}`} replace />
  }

  const Panel = tab.component

  const logout = () => {
    signOut()
    navigate("/internal_login", { replace: true })
  }

  return (
    // Ép dùng font chung của dự án để khớp với modal/drawer render qua portal bên ngoài .staff-portal
    <div className="staff-portal antialiased" style={{ fontFamily: "var(--font-sans)" }}>
      <AdminNavbar
        profile={{
          accountId: user?.id ?? null,
          fullName: user?.fullName ?? "Quản trị viên",
          roleLabel: getRoleTitle(normalizeRole(user?.role)),
          email: user?.email ?? null,
          phone: extra?.phone ?? null,
          facilityId: extra?.facilityId ?? null,
        }}
        onLogout={logout}
      >
        <h1 className="text-title text-xl font-black tracking-tight">{tab.title}</h1>
        {Panel && <Panel />}
      </AdminNavbar>
    </div>
  )
}

export default AdminPortalPage
