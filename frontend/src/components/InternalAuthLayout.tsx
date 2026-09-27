import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

import BrandLogo from "@/components/BrandLogo"
import ThemeToggle from "@/components/ThemeToggle"

interface InternalAuthLayoutProps {
  children: ReactNode
}

function InternalAuthLayout({ children }: InternalAuthLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* HEADER */}
      <header className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center justify-between border-b bg-card px-6 sm:px-10">
        <BrandLogo internal />

        <div className="flex items-center gap-3">
          <Link
            to="/customer_login"
            className="hidden items-center gap-1.5 rounded-lg border bg-background px-3.5 py-2 text-xs font-semibold shadow-sm transition hover:bg-muted sm:inline-flex"
          >
            <ArrowLeft className="size-3" />
            <span>Cổng Khách Hàng</span>
          </Link>

          <ThemeToggle />
        </div>
      </header>

      {/* MAIN */}
      <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md rounded-2xl border bg-card p-7 shadow-sm sm:p-8">
          {children}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="flex w-full shrink-0 flex-wrap items-center justify-between gap-y-1 border-t bg-card px-6 py-3 text-xs text-muted-foreground sm:px-10">
        <div>© 2026 Smart Storage • Cổng thông tin nội bộ • FPT University</div>
        <div>• Bảo mật nội bộ</div>
      </footer>
    </div>
  )
}

export default InternalAuthLayout
