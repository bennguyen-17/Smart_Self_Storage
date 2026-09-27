import { useNavigate, useSearchParams } from "react-router-dom"
import { cn } from "cn"

import AuthLayout from "@/components/AuthLayout"
import LoginForm from "@/components/LoginForm"
import RegisterForm from "@/components/RegisterForm"
import { Button } from "@/components/ui/button"

const TABS = [
  { label: "Đăng nhập", value: "login", href: "/customer_login" },
  { label: "Đăng ký", value: "register", href: "/customer_login?tab=register" },
]

function AuthPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const activeTab = searchParams.get("tab") === "register" ? "register" : "login"

  return (
    <AuthLayout>
      {/* TAB SWITCHER */}
      <div role="tablist" className="mb-5 flex rounded-2xl bg-muted p-1">
        {TABS.map((tab) => {
          const isActive = tab.value === activeTab

          return (
            <Button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              variant="ghost"
              onClick={() => navigate(tab.href)}
              className={cn(
                "h-auto flex-1 rounded-xl py-2 text-xs font-semibold",
                isActive
                  ? "bg-card text-foreground shadow-sm hover:bg-card"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </Button>
          )
        })}
      </div>

      {activeTab === "register" ? <RegisterForm /> : <LoginForm />}
    </AuthLayout>
  )
}

export default AuthPage
