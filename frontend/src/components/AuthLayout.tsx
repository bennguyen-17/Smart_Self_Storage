import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { motion } from "motion/react"
import { CheckCircle2, ShieldHalf } from "lucide-react"

import BrandLogo from "@/components/BrandLogo"
import SiteFooter from "@/components/SiteFooter"
import ThemeToggle from "@/components/ThemeToggle"
import VietnamMap from "@/components/VietnamMap"
import VantaFogBackground from "@/components/VantaFogBackground"
import { Card, CardContent } from "@/components/ui/card"

interface AuthLayoutProps {
  children: ReactNode
}

function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-slate-950/5">
      {/* 3D VANTA FOG ANIMATED BACKGROUND */}
      <VantaFogBackground
        highlightColor={0xffc300}
        midtoneColor={0xff1f00}
        lowlightColor={0x2d00ff}
        baseColor={0xffebeb}
        blurFactor={0.6}
        zoom={1.0}
        speed={1.0}
        className="pointer-events-auto absolute inset-0 z-0"
      />

      {/* HEADER */}
      <header className="sticky top-0 z-30 flex h-16 sm:h-18 w-full shrink-0 items-center justify-between border-b border-sky-100/80 bg-white/75 px-6 backdrop-blur-md transition-colors sm:px-10 lg:px-12 dark:border-slate-800 dark:bg-slate-950/75">
        <BrandLogo />

        <div className="flex items-center gap-3">
          <Link
            to="/internal_login"
            className="hidden items-center gap-2 rounded-xl border border-sky-200/60 bg-white/80 px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm backdrop-blur-sm transition hover:bg-sky-50/80 dark:border-slate-700 dark:bg-slate-900/80 dark:hover:bg-slate-800 sm:inline-flex"
          >
            <ShieldHalf className="size-4 text-primary" />
            <span>Cổng Nhân Viên &amp; Quản Lý</span>
          </Link>

          <ThemeToggle />
        </div>
      </header>

      {/* MAIN */}
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="grid w-full grid-cols-1 items-center gap-8 lg:grid-cols-12">
          {/* CỘT TRÁI: BẢN ĐỒ MẠNG LƯỚI KHO (ANIMATED) */}
          <motion.section
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative hidden h-[540px] flex-col justify-between overflow-hidden rounded-3xl border border-sky-100/80 bg-white/85 p-6 shadow-xl shadow-sky-950/5 backdrop-blur-xl group lg:col-span-7 lg:flex dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-none"
          >
            {/* Ambient Inside Glow */}
            <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-400/15 blur-3xl transition-all duration-700 group-hover:bg-sky-400/25 dark:bg-blue-500/10 dark:group-hover:bg-blue-500/20" />

            <div className="z-10 flex items-center justify-between border-b border-sky-100/70 pb-3.5 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="size-3 animate-pulse rounded-full bg-emerald-500" />
                <h2 className="text-base font-bold text-foreground sm:text-lg">
                  Mạng lưới kho tự quản toàn quốc
                </h2>
              </div>

              <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary sm:text-sm">
                7/7 Cơ sở trực tuyến 24/7
              </span>
            </div>

            <div className="relative z-10 flex flex-1 items-center justify-center py-1">
              <VietnamMap />
            </div>

            <div className="z-10 flex items-center justify-between border-t border-sky-100/70 pt-3 text-sm text-muted-foreground dark:border-slate-800">
              <span className="flex items-center gap-2 font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
                Kho thông minh mở cửa 24/7
              </span>
            </div>
          </motion.section>

          {/* CỘT PHẢI: FORM (ANIMATED) */}
          <motion.section
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="col-span-1 w-full lg:col-span-5"
          >
            <Card className="w-full rounded-3xl border border-sky-100/80 bg-white/90 shadow-xl shadow-sky-950/5 backdrop-blur-xl [--card-spacing:--spacing(6)] dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-none">
              <CardContent>{children}</CardContent>
            </Card>
          </motion.section>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

export default AuthLayout
