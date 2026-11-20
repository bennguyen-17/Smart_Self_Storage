import React from "react"
import { Navigate, Route, Routes } from "react-router-dom"

import LandingPage from "@/features/landing/LandingPage"
import AuthPage from "@/features/auth/AuthPage"
import InternalLoginPage from "@/features/auth/InternalLoginPage"
import ChangePasswordPage from "@/features/auth/ChangePasswordPage"
import FloorPlanPage from "@/features/floorplan/FloorPlanPage"
import PaymentResultPage from "@/features/payment/PaymentResultPage"

import PortalPage from "@/features/customer/portal/PortalPage"
import RentPage from "@/features/customer/rent/RentPage"
import StoragePage from "@/features/customer/storage/StoragePage"
import PinPage from "@/features/customer/pin/PinPage"
import SupportPage from "@/features/customer/support/SupportPage"

import StaffPortalLayout from "@/features/staff/StaffPortalLayout"
import CheckinPanel from "@/features/staff/checkin/components/CheckinPanel"
import StaffCheckinProcessPage from "@/features/staff/checkin/components/StaffCheckinProcessPage"
import StaffTicketPanel from "@/features/staff/support/components/StaffTicketPanel"
import StaffPinPanel from "@/features/staff/pin/components/StaffPinPanel"
import StaffFloorPlanPage from "@/features/staff/floorplan/StaffFloorPlanPage"

import ManagerPortalPage from "@/features/manager/ManagerPortalPage"
import AdminPortalPage from "@/features/admin/AdminPortalPage"

import BomLayout from "@/features/bom/BomLayout"
import BomFacilitiesPage from "@/features/bom/pages/BomFacilitiesPage"
import BomPricingPage from "@/features/bom/pages/BomPricingPage"
import BomReportsPage from "@/features/bom/pages/BomReportsPage"

import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute"
import PasswordChangeGuard from "@/components/auth/PasswordChangeGuard"
import { isTokenValid } from "@/lib/http"

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
      <Route path="/" element={<LandingPage />} />

      <Route path="/storage-plan" element={<FloorPlanPage />} />
      <Route path="/floorplan" element={<FloorPlanPage />} />

      <Route path="/customer_login" element={<AuthPage />} />
      <Route path="/login" element={<AuthPage />} />

      <Route path="/internal-login" element={<InternalLoginPage />} />
      <Route path="/internal_login" element={<InternalLoginPage />} />
      <Route path="/staff-login" element={<InternalLoginPage />} />
      <Route path="/staff_login" element={<InternalLoginPage />} />

      <Route
        path="/doi-mat-khau"
        element={
          <PasswordChangeGuard>
            <ChangePasswordPage />
          </PasswordChangeGuard>
        }
      />

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
        <Route path="checkin/:reservationId" element={<StaffCheckinProcessPage />} />
        <Route path="support" element={<StaffTicketPanel />} />
        <Route path="pin" element={<StaffPinPanel />} />
        <Route path="floorplan" element={<StaffFloorPlanPage />} />
      </Route>

      <Route
        path="/manager/*"
        element={
          <RoleProtectedRoute allowedRoles={["MANAGER"]}>
            <ManagerPortalPage />
          </RoleProtectedRoute>
        }
      />

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

      <Route path="/bom-portal" element={<Navigate to="/bom" replace />} />

      <Route
        path="/admin/*"
        element={
          <RoleProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminPortalPage />
          </RoleProtectedRoute>
        }
      />

      <Route path="/payment/result" element={<PaymentResultPage />} />
      <Route path="/payment_result" element={<PaymentResultPage />} />
      <Route path="/payment-result" element={<PaymentResultPage />} />

      <Route path="*" element={<Navigate to="/customer_login" replace />} />
    </Routes>
  )
}

export default AppRouter
