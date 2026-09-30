import {
  ArrowDown,
  ArrowRight,
  Briefcase,
  GraduationCap,
  Sparkles,
  Store,
  SunMedium,
  Truck,
} from "lucide-react"

import { cn } from "@/lib/utils"

import {
  USE_CASES,
  USE_CASES_SECTION,
  type EstimatorPresetId,
} from "../content/copy"
import { isSectionEnabled } from "../content/sections"
import { CTA, ROUTES } from "../content/site"
import { UNITS } from "../content/units"
import { LandingLink } from "./LandingButton"
import { RevealItem, RevealList } from "./Reveal"
import { SectionHeading } from "./SectionHeading"

interface UseCasesSectionProps {
  onTry: (presetId: EstimatorPresetId) => void
}

const USE_CASE_ICONS: Record<string, typeof Truck> = {
  moving: Truck,
  seasonal: SunMedium,
  student: GraduationCap,
  travel: Briefcase,
  homestay: Store,
}

export function UseCasesSection({ onTry }: UseCasesSectionProps) {
  return (
    <section
      id="use-cases"
      aria-labelledby="use-cases-title"
      className="relative overflow-hidden py-(--l-section-space)"
    >
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="use-cases-title"
          badge={USE_CASES_SECTION.badge}
          title={USE_CASES_SECTION.title}
          lead={USE_CASES_SECTION.lead}
        />

        <RevealList className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {USE_CASES.map((u) => {
            const Icon = USE_CASE_ICONS[u.id] || Sparkles
            const unit = UNITS.find((unit) => unit.size === u.size)
            return (
              <RevealItem
                key={u.id}
                className="group flex flex-col overflow-hidden rounded-(--l-radius-card) l-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl sm:p-6"
              >
                <article className="flex h-full flex-col">
                  {/* Card Visual / Image Banner */}
                  {u.image && (
                    <div className="relative mb-5 h-44 w-full overflow-hidden rounded-2xl bg-muted sm:h-48">
                      <img
                        src={u.image.src}
                        alt={u.image.alt || u.title}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-108"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />

                      {/* Floating Category Icon & Size Badge */}
                      <div className="absolute inset-x-3 top-3 flex items-center justify-between">
                        <span className="flex size-9 items-center justify-center rounded-xl bg-white/85 text-blue-600 shadow-sm backdrop-blur-md dark:bg-slate-900/85 dark:text-blue-400">
                          <Icon className="size-4.5" aria-hidden />
                        </span>
                        {unit && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                            Cỡ {unit.size} · {unit.name}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <h3 className="mb-2 text-lg font-bold tracking-tight text-foreground sm:text-xl">
                    {u.title}
                  </h3>
                  <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">
                    {u.body}
                  </p>

                  <div className="mt-auto pt-5">
                    {isSectionEnabled("estimator") && (
                      <a
                        href="#estimator"
                        onClick={() => onTry(u.presetId)}
                        className="group/btn inline-flex min-h-10 items-center gap-1.5 rounded-full text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {USE_CASES_SECTION.tryLabel}
                        <ArrowDown
                          className="size-4 transition-transform duration-200 group-hover/btn:translate-y-0.5"
                          aria-hidden
                        />
                      </a>
                    )}
                  </div>
                </article>
              </RevealItem>
            )
          })}

          {/* Thẻ thứ 6: Tùy chỉnh nhu cầu đặc biệt */}
          <RevealItem className="group flex flex-col justify-between overflow-hidden rounded-(--l-radius-card) border border-blue-500/30 bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-transparent p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl sm:p-6 dark:border-blue-400/30">
            <article className="flex h-full flex-col">
              <div className="relative mb-5 h-44 w-full overflow-hidden rounded-2xl bg-muted sm:h-48">
                <img
                  src="https://images.unsplash.com/photo-1590247813693-5541d1c609fd?auto=format&fit=crop&w=800&q=80"
                  alt="Sơ đồ kho 2D trực quan"
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-108"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-blue-900/30 to-black/20" />

                <div className="absolute inset-x-3 top-3 flex items-center justify-between">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/30">
                    <Sparkles className="size-4.5 animate-pulse" aria-hidden />
                  </span>
                  <span className="inline-flex items-center rounded-full bg-blue-600/90 px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-md">
                    Linh hoạt 100%
                  </span>
                </div>
              </div>

              <h3 className="mb-2 text-lg font-bold tracking-tight text-foreground sm:text-xl">
                Nhu cầu lưu kho khác?
              </h3>
              <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">
                Khám phá ngay sơ đồ kho 2D tương tác để tự do lựa chọn vị trí và kích cỡ ô kho ưng ý nhất.
              </p>

              <div className="mt-auto pt-5">
                <LandingLink to={ROUTES.book} size="md" className="w-full justify-center shadow-md shadow-blue-500/25">
                  {CTA.book}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </LandingLink>
              </div>
            </article>
          </RevealItem>
        </RevealList>
      </div>
    </section>
  )
}
