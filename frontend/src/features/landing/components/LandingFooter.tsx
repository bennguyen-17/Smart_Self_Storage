import { Link } from "react-router-dom"
import { ArrowRight, ChevronRight, MapPin, ShieldCheck, Warehouse } from "lucide-react"

import { FOOTER } from "../content/copy"
import { type CityId, CITIES } from "../content/facilities"
import { navSections } from "../content/sections"
import { CTA, ROUTES, SITE } from "../content/site"
import { useAuthSession } from "@/hooks/useAuthSession"

interface LandingFooterProps {
  onSelectCity?: (cityId: CityId) => void
}

export function LandingFooter({ onSelectCity }: LandingFooterProps) {
  const { isAuthenticated } = useAuthSession()

  const handleCityClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    cityId: CityId
  ) => {
    e.preventDefault()
    onSelectCity?.(cityId)
    const facilitiesEl = document.getElementById("facilities")
    if (facilitiesEl) {
      facilitiesEl.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <footer className="relative overflow-hidden border-t border-border/80 bg-gradient-to-b from-transparent via-muted/30 to-muted/70 pb-24 md:pb-0 dark:via-card/20 dark:to-card/50">
      <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 sm:grid-cols-2 lg:grid-cols-12 lg:gap-7 lg:px-8">
        {/* Cột 1: Thương hiệu & Giới thiệu */}
        <div className="flex flex-col gap-3.5 lg:col-span-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/30">
              <Warehouse className="size-4.5" aria-hidden />
            </span>
            <span className="text-lg font-black tracking-tight text-foreground">
              {SITE.brand}
            </span>
          </div>

          <p className="max-w-[34ch] text-sm leading-relaxed text-muted-foreground">
            {FOOTER.tagline}
          </p>

          <div className="flex items-center gap-2 pt-0.5 text-xs font-medium text-muted-foreground">
            <span className="flex size-2 rounded-full bg-blue-500" />
            <span>Mở cửa tự động & hỗ trợ trực tuyến 24/7</span>
          </div>
        </div>

        {/* Cột 2: Khám phá dịch vụ */}
        <div className="flex flex-col gap-3.5 lg:col-span-3">
          <p className="text-xs font-bold tracking-wider uppercase text-foreground">
            Khám phá dịch vụ
          </p>
          <nav aria-label="Khám phá dịch vụ">
            <ul className="flex flex-col gap-2.5 text-sm">
              {navSections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="group inline-flex items-center gap-1.5 text-muted-foreground transition-all duration-200 hover:translate-x-1 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <ChevronRight className="size-3.5 text-muted-foreground/50 transition-colors group-hover:text-blue-500" />
                    <span>{s.navLabel}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Cột 3: Mạng lưới chi nhánh */}
        <div className="flex flex-col gap-3.5 lg:col-span-3">
          <p className="text-xs font-bold tracking-wider uppercase text-foreground">
            Mạng lưới cơ sở
          </p>
          <ul className="flex flex-col gap-2.5 text-sm">
            {CITIES.map((c) => (
              <li key={c.id}>
                <a
                  href="#facilities"
                  onClick={(e) => handleCityClick(e, c.id)}
                  className="group inline-flex cursor-pointer items-center gap-2 text-muted-foreground transition-all duration-200 hover:translate-x-1 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <MapPin className="size-3.5 text-blue-500/70 transition-colors group-hover:text-blue-500" />
                  <span>{c.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Cột 4: Truy cập nhanh */}
        <div className="flex flex-col gap-3.5 lg:col-span-2">
          <p className="text-xs font-bold tracking-wider uppercase text-foreground">
            Tài khoản & Đặt kho
          </p>
          <ul className="flex flex-col gap-2.5 text-sm">
            <li>
              <Link
                to={ROUTES.book}
                className="group inline-flex items-center gap-1.5 font-semibold text-blue-600 transition-all duration-200 hover:translate-x-1 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <span>{CTA.book}</span>
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
            <li>
              {!isAuthenticated ? (
                <Link
                  to={ROUTES.login}
                  className="group inline-flex items-center gap-1.5 text-muted-foreground transition-all duration-200 hover:translate-x-1 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <ChevronRight className="size-3.5 text-muted-foreground/50 transition-colors group-hover:text-blue-500" />
                  <span>{CTA.login}</span>
                </Link>
              ) : (
                <Link
                  to={ROUTES.book}
                  className="group inline-flex items-center gap-1.5 text-muted-foreground transition-all duration-200 hover:translate-x-1 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <ChevronRight className="size-3.5 text-muted-foreground/50 transition-colors group-hover:text-blue-500" />
                  <span>Quản lý kho của tôi</span>
                </Link>
              )}
            </li>
            <li className="pt-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Hệ thống mở 24/7
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="relative z-10 border-t border-border/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <p>{FOOTER.copyright}</p>
          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="size-3.5 text-blue-500" />
              Bảo mật tiêu chuẩn quốc tế
            </span>
            <span>Điều khoản dịch vụ</span>
            <span>Chính sách bảo mật</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
