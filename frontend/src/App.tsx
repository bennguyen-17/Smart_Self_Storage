import { Navigate, Route, Routes } from "react-router-dom";
import { Agentation } from "agentation";

import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import CustomerPortal from "@/pages/CustomerPortal";

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

        {/* Đường dẫn lạ tự chuyển về trang chủ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {import.meta.env.VITE_ENABLE_AGENTATION === "true" && <Agentation />}
    </>
  );
}

export default App;