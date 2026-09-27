import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Agentation } from "agentation";

import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import CustomerPortal from "@/pages/CustomerPortal";

// Route Guard: Bắt buộc phải đăng nhập thì mới được vào xem sơ đồ và đặt kho
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <>
      <Routes>
        {/* Mặc định khi mở web: Bắt buộc vào trang Đăng nhập trước */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Các trang Xác thực: Đăng nhập & Đăng ký */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Cổng Đặt kho & Sơ đồ 2D: Chỉ cho phép vào sau khi đã đăng nhập */}
        <Route
          path="/portal"
          element={
            <ProtectedRoute>
              <CustomerPortal />
            </ProtectedRoute>
          }
        />

        {/* Đường dẫn lạ tự động quay về trang login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      {import.meta.env.VITE_ENABLE_AGENTATION === "true" && <Agentation />}
    </>
  );
}

export default App;