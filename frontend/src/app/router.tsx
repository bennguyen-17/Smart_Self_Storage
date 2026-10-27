import React from "react"
import { Navigate, Route, Routes, useParams } from "react-router-dom"

// Public & Landing pages
import LandingPage from "@/features/landing/LandingPage"
import AuthPage from "@/features/auth/AuthPage"
import InternalLoginPage from "@/features/auth/InternalLoginPage"
import FloorPlanPage from "@/features/floorplan/FloorPlanPage"
import PaymentResultPage from "@/features/payment/PaymentResultPage"

// Customer Portal & Feature pages
import PortalPage from "@/features/customer/portal/PortalPage"
import RentPage from "@/features/customer/rent/RentPage"
import StoragePage from "@/features/customer/storage/StoragePage"
import PinPage from "@/features/customer/pin/PinPage"
import SupportPage from "@/features/customer/support/SupportPage"

// Staff pages
import StaffPortalLayout from "@/features/staff/StaffPortalLayout"
import CheckinPanel from "@/features/staff/checkin/components/CheckinPanel"
import StaffTicketPanel from "@/features/staff/support/components/StaffTicketPanel"
import StaffPinPanel from "@/features/staff/pin/components/StaffPinPanel"
import StaffTasksPanel from "@/features/staff/tasks/components/StaffTasksPanel"

// Manager & Admin pages
import ManagerPortalPage from "@/features/manager/ManagerPortalPage"
import AdminPortalPage from "@/features/admin/AdminPortalPage"

// BOM pages
import BomLayout from "@/features/bom/BomLayout"
import BomFacilitiesPage from "@/features/bom/pages/BomFacilitiesPage"
import BomPricingPage from "@/features/bom/pages/BomPricingPage"
import BomReportsPage from "@/features/bom/pages/BomReportsPage"

import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute"
import { isTokenValid } from "@/lib/http"

// Route Guard độc lập cho Cổng Khách Hàng
export function CustomerProtectedRoute({ children }: { children: React.ReactNode }) {
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

export function AppRouter() {
  return (
    <Routes>
      {/* Trang chủ: Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Sơ đồ kho 2D trực quan */}
      <Route path="/storage-plan" element={<FloorPlanPage />} />
      <Route path="/floorplan" element={<FloorPlanPage />} />

      {/* Đăng nhập / Đăng ký Khách Hàng */}
      <Route path="/customer_login" element={<AuthPage />} />
      <Route path="/login" element={<AuthPage />} />

      {/* Đăng nhập Cán bộ Nội bộ */}
      <Route path="/internal-login" element={<InternalLoginPage />} />
      <Route path="/internal_login" element={<InternalLoginPage />} />
      <Route path="/staff-login" element={<InternalLoginPage />} />
      <Route path="/staff_login" element={<InternalLoginPage />} />

      {/* Cổng Khách Hàng: Customer Portal */}
      <Route
        path="/portal"
        element={
          <CustomerProtectedRoute>
            <PortalPage />
          </CustomerProtectedRoute>
        }
      />
      <Route
        path="/rent"
        element={
          <CustomerProtectedRoute>
            <RentPage />
          </CustomerProtectedRoute>
        }
      />
      <Route
        path="/storage"
        element={
          <CustomerProtectedRoute>
            <StoragePage />
          </CustomerProtectedRoute>
        }
      />
      <Route
        path="/pin"
        element={
          <CustomerProtectedRoute>
            <PinPage />
          </CustomerProtectedRoute>
        }
      />
      <Route
        path="/support"
        element={
          <CustomerProtectedRoute>
            <SupportPage />
          </CustomerProtectedRoute>
        }
      />

      {/* Cổng Nhân Viên: Staff Portal (Role STAFF) */}
      <Route
        path="/staff"
        element={
          <RoleProtectedRoute allowedRoles={["STAFF"]}>
            <StaffPortalLayout />
          </RoleProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/staff/checkin" replace />} />
        <Route path="checkin" element={<CheckinPanel />} />
        <Route path="support" element={<StaffTicketPanel />} />
        <Route path="tasks" element={<StaffTasksPanel />} />
        <Route path="pin" element={<StaffPinPanel />} />
      </Route>

      {/* Cổng Quản Lý Cơ Sở: Manager Portal (Role MANAGER) */}
      <Route
        path="/manager/*"
        element={
          <RoleProtectedRoute allowedRoles={["MANAGER"]}>
            <ManagerPortalPage />
          </RoleProtectedRoute>
        }
      />

      {/* Cổng Ban Giám Đốc: BOM Portal (Role BOM) */}
      <Route
        path="/bom"
        element={
          <RoleProtectedRoute allowedRoles={["BOM"]}>
            <BomLayout />
          </RoleProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/bom/facilities" replace />} />
        <Route path="facilities" element={<BomFacilitiesPage />} />
        <Route path="facilities/:facilityId" element={<BomFacilitiesPage />} />
        <Route path="pricing" element={<BomPricingPage />} />
        <Route path="policies" element={<Navigate to="/bom/facilities" replace />} />
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
  )
}

export default AppRouter
