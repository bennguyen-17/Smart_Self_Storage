import { useNavigate, useSearchParams } from "react-router-dom"
import { AnimatePresence, motion } from "motion/react"
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
      <div role="tablist" className="mb-4 flex shrink-0 rounded-xl bg-muted/80 p-1">
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
                "h-auto flex-1 rounded-lg py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer",
                isActive
                  ? "bg-card text-foreground shadow-xs hover:bg-card"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </Button>
          )
        })}
      </div>

      {/* ANIMATED FORM CONTENT */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex-1 flex flex-col justify-center"
        >
          {activeTab === "register" ? <RegisterForm /> : <LoginForm />}
        </motion.div>
      </AnimatePresence>
    </AuthLayout>
  )
}

export default AuthPage