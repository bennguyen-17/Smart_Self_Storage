import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"

import "./index.css"
import App from "./app/App"
import { AuthProvider } from "@/context/AuthContext"
import { ThemeProvider } from "@/components/common/theme-provider"
import { Toaster } from "@/components/ui/sonner"

const rootElement = document.getElementById("root")
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
        <Toaster richColors position="top-center" />
      </ThemeProvider>
    </StrictMode>
  )
}