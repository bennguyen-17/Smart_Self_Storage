import { useEffect, useId, useRef, useState } from "react"
import { Link } from "react-router-dom"
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "motion/react"
import { Menu, Moon, Sun, Warehouse, X } from "lucide-react"

import { useTheme } from "@/components/theme-provider"
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
        "sticky top-0 z-(--l-z-sticky) border-b bg-background/80 backdrop-blur-md transition-[border-color,box-shadow] duration-200",
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
          <span className="flex size-10 sm:size-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Warehouse className="size-5 sm:size-6" aria-hidden />
          </span>
          <span className="text-lg sm:text-xl font-black tracking-tight text-foreground">
            <span className="text-blue-600 dark:text-blue-500">Smart</span> Self Storage
            <span className="sr-only">, về đầu trang</span>
          </span>
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
          <Link
            to={ROUTES.login}
            className="hidden h-11 items-center rounded-full px-4 text-[0.9375rem] font-medium transition-colors outline-none hover:bg-(--l-surface-quiet) focus-visible:ring-3 focus-visible:ring-ring/50 sm:inline-flex"
          >
            {CTA.login}
          </Link>
          <LandingLink
            to={ROUTES.book}
            size="md"
            className="hidden sm:inline-flex"
          >
            {CTA.book}
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
                <li className="sm:hidden">
                  <Link
                    to={ROUTES.login}
                    className="flex min-h-12 items-center rounded-xl px-3 font-medium outline-none hover:bg-(--l-surface-quiet) focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {CTA.login}
                  </Link>
                </li>
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
  const { theme, setTheme } = useTheme()
  const systemDark = useSystemDark()
  const isDark = theme === "dark" || (theme === "system" && systemDark)

  const toggle = () => setTheme(isDark ? "light" : "dark")

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"
      }
      className="inline-flex size-11 items-center justify-center rounded-full transition-colors outline-none hover:bg-(--l-surface-quiet) focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {isDark ? (
        <Sun className="size-5" aria-hidden />
      ) : (
        <Moon className="size-5" aria-hidden />
      )}
    </button>
  )
}
