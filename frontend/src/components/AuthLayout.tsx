import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { motion } from "motion/react"
import { CheckCircle2, ShieldHalf } from "lucide-react"

import BrandLogo from "@/components/BrandLogo"
import SiteFooter from "@/components/SiteFooter"
import ThemeToggle from "@/components/ThemeToggle"
import VietnamMap from "@/components/VietnamMap"
import VantaFogBackground from "@/components/three-background/VantaFogBackground"
import { Card, CardContent } from "@/components/ui/card"

interface AuthLayoutProps {
  children: ReactNode
}

function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative flex h-screen min-h-screen max-h-screen flex-col overflow-hidden">
      {/* 3D VANTA FOG ANIMATED BACKGROUND */}
      <VantaFogBackground />

      {/* HEADER */}
      <header className="sticky top-0 z-30 flex h-13 sm:h-14 w-full shrink-0 items-center justify-between border-b border-sky-100/80 bg-white/75 px-4 sm:px-6 lg:px-8 backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-950/75">
        <BrandLogo />

        <div className="flex items-center gap-2.5">
          <Link
            to="/internal_login"
            className="hidden items-center gap-1.5 rounded-lg border border-sky-200/60 bg-white/80 px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs backdrop-blur-sm transition hover:bg-sky-50/80 dark:border-slate-700 dark:bg-slate-900/80 dark:hover:bg-slate-800 sm:inline-flex"
          >
            <ShieldHalf className="size-3.5 text-primary" />
            <span>Cổng Nội Bộ</span>
          </Link>

          <ThemeToggle />
        </div>
      </header>

      {/* MAIN: Fits in viewport without vertical scrolling */}
      <main className="relative z-10 mx-auto flex w-full max-w-[1100px] flex-1 min-h-0 items-center justify-center p-3 sm:p-4">
        <div className="grid w-full grid-cols-1 items-center gap-5 lg:grid-cols-12 max-h-full">
          {/* CỘT TRÁI: BẢN ĐỒ MẠNG LƯỚI KHO (ANIMATED) - CHIẾM 7/12 (LỚN HƠN CỘT PHẢI, CỐ ĐỊNH 465px) */}
          <motion.section
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative hidden h-[465px] flex-col justify-between overflow-hidden rounded-2xl border border-sky-100/80 bg-white/85 p-4 shadow-md backdrop-blur-xl group lg:col-span-7 lg:flex dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-none"
          >
            {/* Ambient Inside Glow */}
            <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-400/15 blur-3xl transition-all duration-700 group-hover:bg-sky-400/25 dark:bg-blue-500/10 dark:group-hover:bg-blue-500/20" />

            <div className="z-10 flex items-center justify-between border-b border-sky-100/70 pb-2 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
                <h2 className="text-xs sm:text-sm font-bold text-foreground">
                  Mạng lưới kho tự quản toàn quốc
                </h2>
              </div>

              <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                7/7 Cơ sở trực tuyến 24/7
              </span>
            </div>

            <div className="relative z-10 flex flex-1 items-center justify-center py-0.5">
              <VietnamMap />
            </div>

            <div className="z-10 flex items-center justify-between border-t border-sky-100/70 pt-2 text-[11px] text-muted-foreground dark:border-slate-800">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" />
                Kho thông minh mở cửa 24/7
              </span>
            </div>
          </motion.section>

          {/* CỘT PHẢI: FORM (ANIMATED) - CHIẾM 5/12 (CÙNG CHIỀU CAO CỐ ĐỊNH 465px) */}
          <motion.section
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="col-span-1 w-full lg:col-span-5 flex"
          >
            <Card className="w-full h-auto lg:h-[465px] flex flex-col justify-start rounded-2xl border border-sky-100/80 bg-white/90 shadow-md backdrop-blur-xl [--card-spacing:--spacing(3.5)] dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-none">
              <CardContent className="p-3.5 sm:p-4.5 h-full flex flex-col justify-between overflow-y-auto">{children}</CardContent>
            </Card>
          </motion.section>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

export default AuthLayout
