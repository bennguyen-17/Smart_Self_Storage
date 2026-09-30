import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { motion } from "motion/react"
import { CheckCircle2, ShieldHalf } from "lucide-react"

import BrandLogo from "@/components/BrandLogo"
import SiteFooter from "@/components/SiteFooter"
import ThemeToggle from "@/components/ThemeToggle"
import VietnamMap from "@/components/VietnamMap"
import VantaDotsBackground from "@/components/three-background/VantaDotsBackground"
import { Card, CardContent } from "@/components/ui/card"

interface AuthLayoutProps {
  children: ReactNode
}

function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative flex h-screen min-h-screen max-h-screen flex-col overflow-hidden bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
      {/* 3D VANTA DOTS ANIMATED BACKGROUND */}
      <VantaDotsBackground />

      {/* HEADER */}
      <header className="sticky top-0 z-30 flex h-16 sm:h-18 w-full shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/70 dark:border-white/10 dark:bg-slate-950/75 px-6 backdrop-blur-md transition-colors sm:px-10 lg:px-12">
        <BrandLogo />

        <div className="flex items-center gap-2.5">
          <Link
            to="/internal_login"
            className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-sm transition hover:bg-slate-100 dark:border-white/15 dark:bg-slate-900/80 dark:text-white dark:hover:bg-slate-800 sm:inline-flex"
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
          {/* CỘT TRÁI: BẢN ĐỒ MẠNG LƯỚI KHO (ANIMATED) - CHIẾM 7/12 (LỚN HƠN CỘT PHẢI, CỐ ĐỊNH 540px) */}
          <motion.section
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative hidden h-[540px] flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white/55 dark:border-white/15 dark:bg-slate-950/20 p-6 shadow-xl backdrop-blur-md group lg:col-span-7 lg:flex transition-colors"
          >
            {/* Ambient Inside Glow */}
            <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl transition-all duration-700 group-hover:bg-blue-500/20" />

            <div className="z-10 flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="size-3 animate-pulse rounded-full bg-emerald-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                  Mạng lưới kho tự quản toàn quốc
                </h2>
              </div>

              <span className="rounded-full border border-primary/20 bg-primary/10 text-primary dark:border-primary/30 dark:bg-primary/20 px-3 py-1 text-xs font-semibold sm:text-sm">
                7/7 Cơ sở trực tuyến 24/7
              </span>
            </div>

            <div className="relative z-10 flex flex-1 items-center justify-center py-0.5">
              <VietnamMap />
            </div>

            <div className="z-10 flex items-center justify-between border-t border-slate-200/80 dark:border-white/10 pt-3 text-sm text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-2 font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
                Kho thông minh mở cửa 24/7
              </span>
            </div>
          </motion.section>

          {/* CỘT PHẢI: FORM (ANIMATED) - CHIẾM 5/12 (CÙNG CHIỀU CAO CỐ ĐỊNH 540px) */}
          <motion.section
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="col-span-1 w-full lg:col-span-5 flex"
          >
            <Card className="w-full h-auto lg:h-[540px] flex flex-col justify-start rounded-3xl border border-slate-200/80 bg-white/60 dark:border-white/15 dark:bg-slate-950/20 shadow-xl backdrop-blur-md [--card-spacing:--spacing(6)] text-slate-900 dark:text-slate-100 transition-colors">
              <CardContent className="h-full flex flex-col justify-between overflow-y-auto">{children}</CardContent>
            </Card>
          </motion.section>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

export default AuthLayout