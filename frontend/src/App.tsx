import { Navigate, Route, Routes } from "react-router-dom"
import { Agentation } from "agentation"

// Public & Landing pages
import LandingPage from "@/pages/landing/LandingPage"
import AuthPage from "@/pages/auth/AuthPage"
import InternalLoginPage from "@/pages/auth/InternalLoginPage"
import FloorPlanPage from "@/pages/floorplan/FloorPlanPage"
import PaymentResultPage from "@/pages/payment/PaymentResultPage"

// Customer Portal & Feature pages
import PortalPage from "@/pages/customer/portal/PortalPage"
import RentPage from "@/pages/customer/rent/RentPage"
import StoragePage from "@/pages/customer/storage/StoragePage"
import PinPage from "@/pages/customer/pin/PinPage"
import SupportPage from "@/pages/customer/support/SupportPage"

// Staff pages
import StaffPortalLayout from "@/pages/staff/StaffPortalLayout"
import StaffCheckinPage from "@/pages/staff/StaffCheckinPage"
import StaffSupportPage from "@/pages/staff/StaffSupportPage"
import StaffPinPage from "@/pages/staff/StaffPinPage"
import ReservationManagementPage from "@/pages/staff/ReservationManagementPage"

// Manager & Admin pages
import ManagerPortalPage from "@/pages/manager/ManagerPortalPage"
import AdminPortalPage from "@/pages/admin/AdminPortalPage"

// BOM pages
import BomLayout from "@/pages/bom/BomLayout"
import BomDashboardPage from "@/pages/bom/BomDashboardPage"
import BomFacilitiesPage from "@/pages/bom/BomFacilitiesPage"
import BomPricingPage from "@/pages/bom/BomPricingPage"
import BomPoliciesPage from "@/pages/bom/BomPoliciesPage"
import BomReportsPage from "@/pages/bom/BomReportsPage"

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
        <Route path="/login" element={<Navigate to="/customer_login" replace />} />
        <Route path="/register" element={<Navigate to="/customer_login?tab=register" replace />} />
        <Route path="/internal_login" element={<InternalLoginPage />} />

        {/* US-03: Sơ đồ 2D chọn ô kho */}
        <Route path="/floorplan" element={<FloorPlanPage />} />
        <Route path="/floor-plan" element={<Navigate to="/floorplan" replace />} />

        {/* Cổng Khách Hàng: Trang chủ Dashboard & các màn hình chức năng */}
        <Route
          path="/portal"
          element={
            <CustomerProtectedRoute>
              <PortalPage />
            </CustomerProtectedRoute>
          }
        />
        <Route
          path="/customer"
          element={
            <CustomerProtectedRoute>
              <PortalPage />
            </CustomerProtectedRoute>
          }
        />

        {/* Màn hình 1: Thuê kho (Sơ đồ 2D & Đặt cọc) */}
        <Route
          path="/rent"
          element={
            <CustomerProtectedRoute>
              <RentPage />
            </CustomerProtectedRoute>
          }
        />
        <Route path="/portal/rent" element={<Navigate to="/rent" replace />} />

        {/* Màn hình 2: Kho của tôi (Quản lý hợp đồng & đồ) */}
        <Route
          path="/storage"
          element={
            <CustomerProtectedRoute>
              <StoragePage />
            </CustomerProtectedRoute>
          }
        />
        <Route path="/my-storage" element={<Navigate to="/storage" replace />} />
        <Route path="/portal/storage" element={<Navigate to="/storage" replace />} />
        <Route path="/portal/my-storage" element={<Navigate to="/storage" replace />} />

        {/* Màn hình 3: Mã PIN mở cửa 24/7 */}
        <Route
          path="/pin"
          element={
            <CustomerProtectedRoute>
              <PinPage />
            </CustomerProtectedRoute>
          }
        />
        <Route path="/gate-pin" element={<Navigate to="/pin" replace />} />
        <Route path="/portal/pin" element={<Navigate to="/pin" replace />} />
        <Route path="/portal/gate-pin" element={<Navigate to="/pin" replace />} />

        {/* Màn hình 4: Gửi hỗ trợ & Kênh liên hệ khẩn cấp */}
        <Route
          path="/support"
          element={
            <CustomerProtectedRoute>
              <SupportPage />
            </CustomerProtectedRoute>
          }
        />
        <Route path="/portal/support" element={<Navigate to="/support" replace />} />

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
          path="/admin/*"
          element={
            <RoleProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminPortalPage />
            </RoleProtectedRoute>
          }
        />

        {/* Kết quả thanh toán từ Cổng VNPay */}
        <Route path="/payment/result" element={<PaymentResultPage />} />
        <Route path="/payment_result" element={<PaymentResultPage />} />
        <Route path="/payment-result" element={<PaymentResultPage />} />

        {/* Đường dẫn lạ tự động quay về trang đăng nhập */}
        <Route path="*" element={<Navigate to="/customer_login" replace />} />
      </Routes>

      {import.meta.env.VITE_ENABLE_AGENTATION === "true" && <Agentation />}
    </>
  )
}

export default App
