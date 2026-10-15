import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { motion } from "motion/react"
import { ArrowLeft } from "lucide-react"

import BrandLogo from "@/components/common/BrandLogo"
import ThemeToggle from "@/components/common/ThemeToggle"
import VantaDotsBackground from "@/components/common/three-background/VantaDotsBackground"

interface InternalAuthLayoutProps {
  children: ReactNode
}

function InternalAuthLayout({ children }: InternalAuthLayoutProps) {
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
      {/* 3D VANTA DOTS ANIMATED BACKGROUND */}
      <VantaDotsBackground />

      {/* HEADER */}
      <header className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/70 dark:border-white/10 dark:bg-slate-950/75 px-6 backdrop-blur-md transition-colors sm:px-10">
        <BrandLogo internal />

        <div className="flex items-center gap-3">
          <Link
            to="/customer_login"
            className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-white/80 px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur-sm transition hover:bg-slate-100 dark:border-white/15 dark:bg-slate-900/80 dark:text-white dark:hover:bg-slate-800 sm:inline-flex"
          >
            <ArrowLeft className="size-3" />
            <span>Cổng Khách Hàng</span>
          </Link>

          <ThemeToggle />
        </div>
      </header>

      {/* MAIN */}
      <main className="relative z-10 flex flex-1 items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white/80 dark:border-white/15 dark:bg-slate-950/20 p-7 shadow-xl backdrop-blur-md sm:p-8 text-slate-900 dark:text-slate-100 transition-colors">
          {children}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 flex w-full shrink-0 flex-wrap items-center justify-between gap-y-1 border-t border-slate-200/80 bg-white/70 px-6 py-3 text-xs text-slate-500 dark:border-white/10 dark:bg-slate-950/75 dark:text-slate-400 backdrop-blur-md sm:px-10">
        <div>© 2026 Smart Storage • Cổng thông tin nội bộ • FPT University</div>
        <div>• Bảo mật nội bộ</div>
      </footer>
    </div>
  )
}

export default InternalAuthLayout
