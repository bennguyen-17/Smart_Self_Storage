import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { CheckCircle2, ShieldHalf } from "lucide-react"

import BrandLogo from "@/components/BrandLogo"
import SiteFooter from "@/components/SiteFooter"
import ThemeToggle from "@/components/ThemeToggle"
import VietnamMap from "@/components/VietnamMap"
import { Card, CardContent } from "@/components/ui/card"

interface AuthLayoutProps {
  children: ReactNode
}

function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* HEADER */}
      <header className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center justify-between border-b bg-card px-6 sm:px-10">
        <BrandLogo />

        <div className="flex items-center gap-3">
          <Link
            to="/internal_login"
            className="hidden items-center gap-2 rounded-lg border bg-background px-3.5 py-2 text-xs font-semibold shadow-sm transition hover:bg-muted sm:inline-flex"
          >
            <ShieldHalf className="size-3.5 text-primary" />
            <span>Cổng Nhân Viên &amp; Quản Lý</span>
          </Link>

          <ThemeToggle />
        </div>
      </header>

      {/* MAIN */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="grid w-full grid-cols-1 items-center gap-8 lg:grid-cols-12">
          {/* CỘT TRÁI: BẢN ĐỒ MẠNG LƯỚI KHO */}
          <section className="hidden h-[540px] flex-col justify-between rounded-3xl border bg-card p-6 shadow-sm lg:col-span-7 lg:flex">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <span className="size-2.5 animate-pulse rounded-full bg-emerald-500" />
                <h2 className="text-sm font-bold">
                  Mạng lưới kho tự quản toàn quốc
                </h2>
              </div>

              <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                7/7 Cơ sở trực tuyến 24/7
              </span>
            </div>

            <div className="relative flex flex-1 items-center justify-center py-1">
              <VietnamMap />
            </div>

            <div className="flex items-center justify-between border-t pt-2.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" />
                Kho thông minh mở cửa 24/7
              </span>
            </div>
          </section>

          {/* CỘT PHẢI: FORM */}
          <section className="col-span-1 w-full lg:col-span-5">
            <Card className="w-full [--card-spacing:--spacing(6)]">
              <CardContent>{children}</CardContent>
            </Card>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

export default AuthLayout
