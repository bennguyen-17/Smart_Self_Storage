import { Navigate, Route, Routes } from "react-router-dom"
import { Agentation } from "agentation";

import AuthPage from "@/pages/AuthPage"
import InternalLoginPage from "@/pages/InternalLoginPage"

function App() {
  return (
    <>
      <Routes>
        <Route path="/customer_login" element={<AuthPage />} />
        <Route path="/internal_login" element={<InternalLoginPage />} />
        <Route path="*" element={<Navigate to="/customer_login" replace />} />
      </Routes>
      {import.meta.env.VITE_ENABLE_AGENTATION === "true" && <Agentation />}
    </>
  )
}

export default App
