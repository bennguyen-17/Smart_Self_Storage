import { useEffect, useId, useRef, useState } from "react"
import { Link } from "react-router-dom"
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "motion/react"
import { LogOut, Menu, Moon, Sun, User, Warehouse, X } from "lucide-react"

import { useTheme } from "@/components/common/theme-provider"
import { useAuthSession } from "@/hooks/useAuthSession"
import { cn } from "@/lib/utils"

import { navSections } from "../content/sections"
import { CTA, ROUTES, SITE } from "../content/site"
import { DURATION, EASE_OUT_QUART } from "../motion/presets"
import { useActiveSection } from "../hooks/useActiveSection"
import { useSystemDark } from "../hooks/useSystemDark"
import { LandingLink } from "./LandingButton"

const NAV_IDS = navSections.map((s) => s.id)

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()
  const active = useActiveSection(NAV_IDS)
  const { scrollY } = useScroll()
  const { isAuthenticated, user, logout } = useAuthSession()

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24))

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [menuOpen])

  return (
    <header
      className={cn(
        "sticky top-0 z-(--l-z-sticky) border-b bg-background/95 transition-[border-color,box-shadow] duration-200",
        scrolled ? "border-border shadow-sm" : "border-transparent"
      )}
    >
      <div
        className={cn(
          "flex w-full items-center justify-between gap-6 px-6 transition-[height] duration-400 ease-[cubic-bezier(0.25,1,0.5,1)] sm:px-10 lg:px-12",
          scrolled ? "h-15" : "h-(--l-header-h)"
        )}
      >
        <a
          href="#top"
          className="flex items-center gap-3 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50 group"
        >
          <span className="flex size-10 sm:size-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Warehouse className="size-5 sm:size-6" aria-hidden />
          </span>
          <div>
            <span className="text-lg sm:text-xl font-black tracking-tight text-foreground block leading-tight">
              Smart Storage
              <span className="sr-only">, về đầu trang</span>
            </span>
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground hidden sm:block">
              Hệ thống cho thuê kho tự quản thông minh 24/7
            </span>
          </div>
        </a>

        <nav aria-label="Điều hướng trang" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {navSections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  aria-current={active === s.id ? "true" : undefined}
                  className="relative block rounded-full px-3.5 py-2 text-[0.9375rem] font-medium text-foreground/80 transition-colors duration-200 outline-none hover:text-(--l-link) focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current]:text-foreground"
                >
                  {s.navLabel}
                  {active === s.id && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full bg-(--l-cta)"
                      transition={{
                        duration: DURATION.base,
                        ease: EASE_OUT_QUART,
                      }}
                    />
                  )}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {!isAuthenticated ? (
            <Link
              to={ROUTES.login}
              className="hidden h-11 items-center rounded-full px-4 text-[0.9375rem] font-medium transition-colors outline-none hover:bg-(--l-surface-quiet) focus-visible:ring-3 focus-visible:ring-ring/50 sm:inline-flex"
            >
              {CTA.login}
            </Link>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5">
              <Link
                to={ROUTES.book}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/70 px-3.5 text-xs sm:text-sm font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/60 shadow-xs"
                title="Vào Cổng Khách Hàng / Quản lý kho"
              >
                <div className="flex size-6 items-center justify-center rounded-full bg-blue-600 text-white font-black text-[11px]">
                  {user?.fullName ? user.fullName[0].toUpperCase() : <User className="size-3.5" />}
                </div>
                <span className="max-w-[120px] truncate">{user?.fullName || "Kho của tôi"}</span>
              </Link>
              <button
                type="button"
                onClick={logout}
                title="Đăng xuất"
                className="inline-flex size-10 items-center justify-center rounded-full text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition outline-none"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          )}

          <LandingLink
            to={ROUTES.book}
            size="md"
            className="hidden sm:inline-flex"
          >
            {isAuthenticated ? "Vào quản lý kho" : CTA.book}
          </LandingLink>

          <button
            ref={menuButtonRef}
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full outline-none hover:bg-(--l-surface-quiet) focus-visible:ring-3 focus-visible:ring-ring/50 lg:hidden"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? (
              <X className="size-5" aria-hidden />
            ) : (
              <Menu className="size-5" aria-hidden />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {menuOpen && (
          <motion.div
            id={menuId}
            key="mobile-menu"
            className="overflow-hidden border-t border-border lg:hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: DURATION.base, ease: EASE_OUT_QUART }}
          >
            <nav
              aria-label={`Menu ${SITE.brand}`}
              className="mx-auto max-w-7xl px-4 py-3 sm:px-6"
            >
              <ul className="flex flex-col">
                {navSections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex min-h-12 items-center rounded-xl px-3 font-medium outline-none hover:bg-(--l-surface-quiet) focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {s.navLabel}
                    </a>
                  </li>
                ))}

                {!isAuthenticated ? (
                  <li className="sm:hidden">
                    <Link
                      to={ROUTES.login}
                      onClick={() => setMenuOpen(false)}
                      className="flex min-h-12 items-center rounded-xl px-3 font-medium outline-none hover:bg-(--l-surface-quiet) focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {CTA.login}
                    </Link>
                  </li>
                ) : (
                  <>
                    <li className="sm:hidden">
                      <Link
                        to={ROUTES.book}
                        onClick={() => setMenuOpen(false)}
                        className="flex min-h-12 items-center justify-between rounded-xl px-3 font-semibold text-blue-600 outline-none hover:bg-blue-50/50 dark:text-blue-400 dark:hover:bg-blue-950/30"
                      >
                        <div className="flex items-center gap-2">
                          <User className="size-4" />
                          <span>{user?.fullName ? user.fullName : "Quản lý kho của tôi"}</span>
                        </div>
                        <span className="text-xs font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/60 dark:text-blue-300 px-2 py-0.5 rounded-full">
                          Vào kho
                        </span>
                      </Link>
                    </li>
                    <li className="sm:hidden">
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false)
                          logout()
                        }}
                        className="flex w-full min-h-12 items-center gap-2 rounded-xl px-3 font-medium text-rose-600 outline-none hover:bg-rose-50/50 focus-visible:ring-3 focus-visible:ring-ring/50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                      >
                        <LogOut className="size-4" />
                        <span>Đăng xuất</span>
                      </button>
                    </li>
                  </>
                )}
              </ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

function ThemeToggle() {
  // Suy ra từ state của ThemeProvider (không đọc class trên <html>, vì class
  // chỉ được gắn trong effect của provider, sau lần render đầu của component này).
  const