import { Navigate, Route, Routes } from "react-router-dom"
import { Agentation } from "agentation"

import AuthPage from "@/pages/AuthPage"
import InternalLoginPage from "@/pages/InternalLoginPage"
import CustomerPortal from "@/pages/CustomerPortal"
import RolePortalPlaceholderPage from "@/pages/RolePortalPlaceholderPage"
import LandingPage from "@/features/landing/pages/LandingPage"
import ReservationManagementPage from "@/features/reservations/pages/ReservationManagementPage"
import StaffCheckinPage from "@/features/checkin/pages/StaffCheckinPage"
import FloorPlanPage from "@/features/floor-plan/pages/FloorPlanPage"
import BomLayout from "@/features/bom/layouts/BomLayout"
import BomDashboardPage from "@/features/bom/pages/BomDashboardPage"
import BomFacilitiesPage from "@/features/bom/pages/BomFacilitiesPage"
import BomPricingPage from "@/features/bom/pages/BomPricingPage"
import BomPoliciesPage from "@/features/bom/pages/BomPoliciesPage"
import BomReportsPage from "@/features/bom/pages/BomReportsPage"
import ManagerPortalPage from "@/features/manager-portal/pages/ManagerPortalPage"
import AdminPortalPage from "@/features/admin-portal/pages/AdminPortalPage"
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute"
import { isTokenValid } from "@/lib/apiClient"

// Route Guard độc lập cho Cổng Khách Hàng (không phụ thuộc vào cổng nội bộ)
function CustomerProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  if (!isTokenValid(token)) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
    }
    return <Navigate to="/customer_login" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <>
      <Routes>
        {/* Trang chủ: Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Các trang Xác thực khách hàng & Nội bộ */}
        <Route path="/customer_login" element={<AuthPage />} />
        <Route
          path="/login"
          element={<Navigate to="/customer_login" replace />}
        />
        <Route
          path="/register"
          element={<Navigate to="/customer_login?tab=register" replace />}
        />
        <Route path="/internal_login" element={<InternalLoginPage />} />

        {/* US-03: Sơ đồ 2D chọn ô kho */}
        <Route path="/floor-plan" element={<FloorPlanPage />} />

        {/* Cổng Khách Hàng (Customer Portal - Bảo vệ bằng token khách hàng) */}
        <Route
          path="/portal"
          element={
            <CustomerProtectedRoute>
              <CustomerPortal initialTab="home" />
            </CustomerProtectedRoute>
          }
        />
        <Route
          path="/customer"
          element={
            <CustomerProtectedRoute>
              <CustomerPortal initialTab="home" />
            </CustomerProtectedRoute>
          }
        />
        <Route
          path="/rent"
          element={
            <CustomerProtectedRoute>
              <CustomerPortal initialTab="grid" />
            </CustomerProtectedRoute>
          }
        />
        <Route
          path="/my-storage"
          element={
            <CustomerProtectedRoute>
              <CustomerPortal initialTab="access" />
            </CustomerProtectedRoute>
          }
        />

        {/* Cổng Nhân Viên Vận Hành: Check-in tại quầy & Quản lý Ticket (Role STAFF, MANAGER, ADMIN) */}
        <Route
          path="/staff/checkin"
          element={
            <RoleProtectedRoute allowedRoles={["STAFF", "MANAGER", "ADMIN"]}>
              <StaffCheckinPage />
            </RoleProtectedRoute>
          }
        />

        {/* US-06: Quản lý đơn đặt cọc & No-Show (Role STAFF, MANAGER, ADMIN) */}
        <Route
          path="/staff/reservations"
          element={
            <RoleProtectedRoute allowedRoles={["STAFF", "MANAGER", "ADMIN"]}>
              <ReservationManagementPage />
            </RoleProtectedRoute>
          }
        />

        {/* Cổng Quản Lý Chi Nhánh: Manager Portal (Role MANAGER, ADMIN) */}
        <Route
          path="/manager"
          element={
            <RoleProtectedRoute allowedRoles={["MANAGER", "ADMIN"]}>
              {/* Khung Cổng Quản lý cơ sở (builder: Vỹ) */}
              <ManagerPortalPage />
            </RoleProtectedRoute>
          }
        />

        {/* Cổng Ban Giám Đốc: BOM Portal với các Trang Route riêng biệt */}
        <Route
          path="/bom"
          element={
            <RoleProtectedRoute allowedRoles={["BOM", "ADMIN"]}>
              <BomLayout />
            </RoleProtectedRoute>
          }
        >
          <Route index element={<BomDashboardPage />} />
          <Route path="facilities" element={<BomFacilitiesPage />} />
          <Route path="pricing" element={<BomPricingPage />} />
          <Route path="policies" element={<BomPoliciesPage />} />
          <Route path="reports" element={<BomReportsPage />} />
        </Route>

        {/* Alias /bom-portal tự động chuyển tiếp về /bom */}
        <Route path="/bom-portal" element={<Navigate to="/bom" replace />} />

        {/* Cổng Quản Trị Hệ Thống: Admin Portal (Role ADMIN) */}
        <Route
          path="/admin"
          element={
            <RoleProtectedRoute allowedRoles={["ADMIN"]}>
              {/* Khung Cổng Quản trị hệ thống (builder: Vỹ) */}
              <AdminPortalPage />
            </RoleProtectedRoute>
          }
        />

        {/* Đường dẫn lạ tự động quay về trang đăng nhập */}
        <Route path="*" element={<Navigate to="/customer_login" replace />} />
      </Routes>

      {import.meta.env.VITE_ENABLE_AGENTATION === "true" && <Agentation />}
    </>
  )
}

export default App