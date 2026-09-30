import { Navigate, Route, Routes } from "react-router-dom";
import { Agentation } from "agentation";

import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import CustomerPortal from "@/pages/CustomerPortal";
import ReservationManagementPage from "@/features/reservations/pages/ReservationManagementPage";
import FloorPlanPage from "@/features/floor-plan/pages/FloorPlanPage";

function App() {
  return (
    <>
      <Routes>
        {/* Trang chủ: Xem sơ đồ kho 2D & Đặt cọc (Tâm & Bảo) */}
        <Route path="/" element={<CustomerPortal />} />
        <Route path="/portal" element={<CustomerPortal />} />

        {/* Trang Xác thực: Đăng ký & Đăng nhập (Khánh & Vy) */}
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* US-06: Quản lý đơn đặt cọc & No-Show (Vỹ) */}
        <Route path="/staff/reservations" element={<ReservationManagementPage />} />

        {/* US-03: Sơ đồ 2D chọn ô kho (Vỹ), chờ chốt cách ghép vào CustomerPortal */}
        <Route path="/floor-plan" element={<FloorPlanPage />} />

        {/* Đường dẫn lạ tự chuyển về trang chủ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {import.meta.env.VITE_ENABLE_AGENTATION === "true" && <Agentation />}
    </>
  );
}

export default App;
import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Agentation } from "agentation";

import AuthPage from "@/pages/AuthPage";
import InternalLoginPage from "@/pages/InternalLoginPage";
import CustomerPortal from "@/pages/CustomerPortal";
import LandingPage from "@/features/landing/pages/LandingPage";

// Route Guard: Bắt buộc phải đăng nhập thì mới được vào xem sơ đồ và đặt kho
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
        {/* Trang chủ: Landing page (Vỹ) */}
        <Route path="/" element={<LandingPage />} />

        {/* Các trang Xác thực khách hàng & nội bộ */}
        <Route path="/customer_login" element={<AuthPage />} />
        <Route path="/login" element={<Navigate to="/customer_login" replace />} />
        <Route path="/register" element={<Navigate to="/customer_login?tab=register" replace />} />
        <Route path="/internal_login" element={<InternalLoginPage />} />

        {/* Cổng Đặt kho & Sơ đồ 2D: Chỉ cho phép vào sau khi đã đăng nhập */}
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
