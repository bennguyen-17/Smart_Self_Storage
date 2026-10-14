import { Navigate, Route, Routes } from "react-router-dom"
import { Agentation } from "agentation"

import AuthPage from "@/pages/AuthPage"
import InternalLoginPage from "@/pages/InternalLoginPage"
import CustomerPortal from "@/pages/CustomerPortal"
import RolePortalPlaceholderPage from "@/pages/RolePortalPlaceholderPage"
import LandingPage from "@/features/landing/pages/LandingPage"
import ReservationManagementPage from "@/features/reservations/pages/ReservationManagementPage"
import StaffPortalLayout from "@/features/checkin/pages/StaffPortalLayout"
import StaffCheckinPage from "@/features/checkin/pages/StaffCheckinPage"
import StaffSupportPage from "@/features/checkin/pages/StaffSupportPage"
import StaffPinPage from "@/features/checkin/pages/StaffPinPage"
import FloorPlanPage from "@/features/floor-plan/pages/FloorPlanPage"
import ManagerPortalPage from "@/features/manager-portal/pages/ManagerPortalPage"
import AdminPortalPage from "@/features/admin-portal/pages/AdminPortalPage"
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute"
import { isTokenValid } from "@/lib/apiClient"

// Route Guard độc lập cho Cổng Khách Hàng (không phụ thuộc vào cổng nội bộ)
function CustomerProtectedRoute({ children }: { children: React.ReactNode }) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null

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

        {/* Cổng Khách Hàng (Bảo vệ độc lập bằng token khách hàng) */}
        <Route
          path="/portal"
          element={
            <CustomerProtectedRoute>
              <CustomerPortal />
            </CustomerProtectedRoute>
          }
        />

        {/* Cổng Nhân Viên Vận Hành: mỗi nghiệp vụ một URL riêng (Role STAFF, MANAGER, ADMIN) */}
        <Route
          path="/staff"
          element={
            <RoleProtectedRoute allowedRoles={["STAFF", "MANAGER", "ADMIN"]}>
              <StaffPortalLayout />
            </RoleProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/staff/checkin" replace />} />
          <Route path="checkin" element={<StaffCheckinPage />} />
          <Route path="support" element={<StaffSupportPage />} />
          <Route path="pin" element={<StaffPinPage />} />
        </Route>

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
          path="/manager/*"
          element={
            <RoleProtectedRoute allowedRoles={["MANAGER", "ADMIN"]}>
              {/* Khung Cổng Quản lý cơ sở (builder: Vỹ) */}
              <ManagerPortalPage />
            </RoleProtectedRoute>
          }
        />

        {/* Cổng Ban Giám Đốc: BOM Portal (Role BOM, ADMIN) */}
        <Route
          path="/bom"
          element={
            <RoleProtectedRoute allowedRoles={["BOM", "ADMIN"]}>
              <RolePortalPlaceholderPage portalType="BOM" />
            </RoleProtectedRoute>
          }
        />

        {/* Cổng Quản Trị Hệ Thống: Admin Portal (Role ADMIN) */}
        <Route
          path="/admin/*"
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
