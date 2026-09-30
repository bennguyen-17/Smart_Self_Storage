import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { motion } from "motion/react"
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
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-gradient-to-b from-sky-50/70 via-blue-50/40 to-indigo-50/60 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* DYNAMIC PASTEL BLUE RIBBON BACKGROUND */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Ribbon 1: Top-Left flowing pastel cyan-blue wave */}
        <motion.div
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -25, 20, 0],
            rotate: [0, 6, -4, 0],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -left-32 h-[560px] w-[560px] rounded-full bg-gradient-to-tr from-sky-300/45 via-cyan-200/50 to-blue-200/40 blur-3xl dark:from-cyan-900/20 dark:via-blue-900/20 dark:to-transparent"
        />

        {/* Ribbon 2: Bottom-Right flowing pastel sky-indigo wave */}
        <motion.div
          animate={{
            x: [0, -35, 25, 0],
            y: [0, 30, -20, 0],
            rotate: [0, -8, 6, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-40 -right-32 h-[640px] w-[640px] rounded-full bg-gradient-to-bl from-blue-300/50 via-indigo-200/45 to-teal-200/40 blur-3xl dark:from-indigo-900/20 dark:via-sky-900/20 dark:to-transparent"
        />

        {/* Ribbon 3: Center diagonal pastel ribbon streamer */}
        <motion.div
          animate={{
            scale: [1, 1.1, 0.95, 1],
            rotate: [-14, -8, -18, -14],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 left-1/2 h-[420px] w-[900px] -translate-x-1/2 rounded-[140px] bg-gradient-to-r from-teal-200/35 via-sky-200/45 to-indigo-200/35 blur-3xl dark:from-blue-900/15 dark:via-cyan-900/10 dark:to-transparent"
        />

        {/* Ribbon 4: Organic pastel wave vectors */}
        <svg
          className="absolute inset-0 h-full w-full opacity-45 dark:opacity-10"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="auth-ribbon-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#a5b4fc" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#67e8f9" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="auth-ribbon-2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#99f6e4" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#c7d2fe" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <path
            d="M-100,180 C320,40 640,320 1020,160 C1320,30 1520,220 1620,170 L1620,0 L-100,0 Z"
            fill="url(#auth-ribbon-1)"
            filter="blur(35px)"
          />
          <path
            d="M-100,720 C420,580 720,860 1120,670 C1380,530 1520,740 1620,690 L1620,900 L-100,900 Z"
            fill="url(#auth-ribbon-2)"
            filter="blur(40px)"
          />
        </svg>
      </div>

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
