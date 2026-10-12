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
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute"

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

        {/* Cổng Khách Hàng (Bảo vệ bằng RoleProtectedRoute - Role CUSTOMER) */}
        <Route
          path="/portal"
          element={
            <RoleProtectedRoute allowedRoles={["CUSTOMER"]}>
              <CustomerPortal />
            </RoleProtectedRoute>
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
              <RolePortalPlaceholderPage portalType="MANAGER" />
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
          path="/admin"
          element={
            <RoleProtectedRoute allowedRoles={["ADMIN"]}>
              <RolePortalPlaceholderPage portalType="ADMIN" />
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