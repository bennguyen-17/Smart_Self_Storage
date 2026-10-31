import { useNavigate, useOutlet } from "react-router-dom"
import { toast } from "sonner"
import { Warehouse, SlidersHorizontal, FileSpreadsheet } from "lucide-react"

import PortalNavbar, { type PortalNavItem } from "@/components/internal/components/PortalNavbar"
import { useAuth } from "@/context/AuthContext"
import { getRoleTitle, normalizeRole } from "@/lib/roles"
import { BomProvider } from "@/features/bom/context/BomContext"

const BOM_NAV_ITEMS: readonly PortalNavItem[] = [
  {
    to: "/bom/facilities",
    label: "Giám Sát & Cơ Sở",
    hint: "Mặt bằng & Tỷ lệ lấp đầy",
    icon: Warehouse,
  },
  {
    to: "/bom/pricing",
    label: "Khung Giá & Phụ Phí",
    hint: "Biểu giá thuê & Phí dịch vụ",
    icon: SlidersHorizontal,
  },
  {
    to: "/bom/reports",
    label: "Báo Cáo Doanh Thu",
    hint: "Dòng tiền & Đối soát tài chính",
    icon: FileSpreadsheet,
  },
]

function BomLayoutContent() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const outlet = useOutlet()
  const extra = user as (typeof user & { phone?: string | null; facilityId?: number | null }) | null

  const logout = async () => {
    try {
      await signOut()
      toast.success("Đã đăng xuất khỏi cổng điều hành BOM")
      navigate("/internal_login", { replace: true })
    } catch {
      toast.error("Lỗi khi đăng xuất")
    }
  }

  const roleTitle = getRoleTitle(normalizeRole(user?.role)) || "Ban Điều Hành (BOM)"

  return (
    <div className="staff-portal antialiased" style={{ fontFamily: "var(--font-sans)" }}>
      <PortalNavbar
        portalName="Cổng Ban giám đốc"
        hidePortalNameText
        items={BOM_NAV_ITEMS}
        profile={{
          accountId: user?.id ?? null,
          fullName: user?.fullName ?? "Ban Điều Hành",
          roleLabel: roleTitle,
          email: user?.email ?? null,
          phone: extra?.phone ?? null,
          facilityId: extra?.facilityId ?? null,
        }}
        onLogout={logout}
      >
        {outlet}
      </PortalNavbar>
    </div>
  )
}

export default function BomLayout() {
  return (
    <BomProvider>
      <BomLayoutContent />
    </BomProvider>
  )
}
