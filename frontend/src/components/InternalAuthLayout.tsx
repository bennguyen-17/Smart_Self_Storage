import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { motion } from "motion/react"
import { ArrowLeft } from "lucide-react"

import BrandLogo from "@/components/BrandLogo"
import ThemeToggle from "@/components/ThemeToggle"
import VantaFogBackground from "@/components/VantaFogBackground"

interface InternalAuthLayoutProps {
  children: ReactNode
}

function InternalAuthLayout({ children }: InternalAuthLayoutProps) {
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
      <header className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center justify-between border-b border-sky-100/80 bg-white/75 px-6 backdrop-blur-md transition-colors sm:px-10 dark:border-slate-800 dark:bg-slate-950/75">
        <BrandLogo internal />

        <div className="flex items-center gap-3">
          <Link
            to="/customer_login"
            className="hidden items-center gap-1.5 rounded-lg border border-sky-200/60 bg-white/80 px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm transition hover:bg-sky-50/80 dark:border-slate-700 dark:bg-slate-900/80 dark:hover:bg-slate-800 sm:inline-flex"
          >
            <ArrowLeft className="size-3" />
            <span>Cổng Khách Hàng</span>
          </Link>

          <ThemeToggle />
        </div>
      </header>

      {/* MAIN */}
      <main className="relative z-10 flex flex-1 items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md rounded-3xl border border-sky-100/80 bg-white/90 p-7 shadow-xl shadow-sky-950/5 backdrop-blur-xl sm:p-8 dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-none">
          {children}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 flex w-full shrink-0 flex-wrap items-center justify-between gap-y-1 border-t border-sky-100/80 bg-white/75 px-6 py-3 text-xs text-muted-foreground backdrop-blur-md sm:px-10 dark:border-slate-800 dark:bg-slate-950/75">
        <div>© 2026 Smart Storage • Cổng thông tin nội bộ • FPT University</div>
        <div>• Bảo mật nội bộ</div>
      </footer>
    </div>
  )
}

export default InternalAuthLayout
