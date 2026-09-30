import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Agentation } from "agentation";

import AuthPage from "@/pages/AuthPage";
import InternalLoginPage from "@/pages/InternalLoginPage";
import CustomerPortal from "@/pages/CustomerPortal";
import LandingPage from "@/features/landing/pages/LandingPage";
import ReservationManagementPage from "@/features/reservations/pages/ReservationManagementPage";
import FloorPlanPage from "@/features/floor-plan/pages/FloorPlanPage";

// Route Guard: Bắt buộc đăng nhập mới được vào xem sơ đồ và đặt kho
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) {
    return <Navigate to="/customer_login" replace />;
  }
  return <>{children}</>;
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

        {/* US-06: Quản lý đơn đặt cọc & No-Show */}
        <Route path="/staff/reservations" element={<ReservationManagementPage />} />

        {/* US-03: Sơ đồ 2D chọn ô kho */}
        <Route path="/floor-plan" element={<FloorPlanPage />} />

        {/* Cổng Đặt kho & Sơ đồ 2D (Bảo vệ bằng ProtectedRoute) */}
        <Route
          path="/portal"
          element={
            <ProtectedRoute>
              <CustomerPortal />
            </ProtectedRoute>
          }
        />

        {/* Đường dẫn lạ tự động quay về trang đăng nhập */}
        <Route path="*" element={<Navigate to="/customer_login" replace />} />
      </Routes>
      {import.meta.env.VITE_ENABLE_AGENTATION === "true" && <Agentation />}
    </>
  );
}

export default App;