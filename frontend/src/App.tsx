import { Navigate, Route, Routes } from "react-router-dom"
import { Agentation } from "agentation";

import LoginPage from "@/pages/LoginPage"
import RegisterPage from "@/pages/RegisterPage"

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/register" replace />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
      {import.meta.env.VITE_ENABLE_AGENTATION === "true" && <Agentation />}
    </>
  )
}

export default App
