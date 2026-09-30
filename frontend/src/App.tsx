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
