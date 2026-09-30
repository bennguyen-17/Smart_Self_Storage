import { Link } from "react-router-dom"
import { Warehouse } from "lucide-react"

import { FOOTER } from "../content/copy"
import { CITIES } from "../content/facilities"
import { navSections } from "../content/sections"
import { CTA, HOTLINE, ROUTES, SITE } from "../content/site"

const linkClass =
  "rounded-md outline-none transition-colors hover:text-(--l-link) focus-visible:ring-3 focus-visible:ring-ring/50"

export function LandingFooter() {
  return (
    <footer className="border-t border-border pb-28 md:pb-0">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div className="flex flex-col gap-3">
          <span className="flex items-center gap-3 text-lg font-semibold tracking-tight">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Warehouse className="size-4.5" aria-hidden />
            </span>
            {SITE.brand}
          </span>
          <p className="text-muted-foreground">{FOOTER.tagline}</p>
          <p>
            <span className="text-muted-foreground">
              {FOOTER.hotlineLabel}:{" "}
            </span>
            {HOTLINE.tel ? (
              <a
                href={`tel:${HOTLINE.tel}`}
                className={`font-semibold tabular-nums ${linkClass}`}
              >
                {HOTLINE.display}
              </a>
            ) : (
              <span className="font-semibold tabular-nums">
                {HOTLINE.display}
              </span>
            )}
          </p>
        </div>

        <nav aria-label="Liên kết cuối trang">
          <ul className="flex flex-col gap-2.5">
            {navSections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className={linkClass}>
                  {s.navLabel}
                </a>
              </li>
            ))}
            <li>
              <Link to={ROUTES.login} className={linkClass}>
                {CTA.login}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="flex flex-col gap-2.5">
          <p className="font-semibold">Có mặt tại</p>
          <ul className="flex flex-col gap-2.5 text-muted-foreground">
            {CITIES.map((c) => (
              <li key={c.id}>{c.label}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="border-t border-border py-6 text-sm text-muted-foreground">
          {FOOTER.copyright}
        </p>
      </div>
    </footer>
  )
}
