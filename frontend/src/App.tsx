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