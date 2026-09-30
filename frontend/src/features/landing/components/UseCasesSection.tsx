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

        <RevealList className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {USE_CASES.map((u) => {
            const Icon = USE_CASE_ICONS[u.id] || Sparkles
            const unit = UNITS.find((unit) => unit.size === u.size)
            return (
              <RevealItem
                key={u.id}
                className="group flex flex-col rounded-(--l-radius-card) l-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl sm:p-7"
              >
                <article className="flex h-full flex-col">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20 dark:bg-blue-400/15 dark:text-blue-400">
                      <Icon className="size-5.5" aria-hidden />
                    </span>
                    {unit && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-400/15 dark:text-blue-300">
                        Cỡ {unit.size} · {unit.name}
                      </span>
                    )}
                  </div>

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
                        className="group/btn inline-flex min-h-10 items-center gap-1.5 rounded-full px-1 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
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
          <RevealItem className="group flex flex-col justify-between rounded-(--l-radius-card) border border-blue-500/30 bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-transparent p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl sm:p-7 dark:border-blue-400/30">
            <article className="flex h-full flex-col">
              <div className="mb-4 flex items-center justify-between">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/30">
                  <Sparkles className="size-5.5 animate-pulse" aria-hidden />
                </span>
                <span className="inline-flex items-center rounded-full bg-blue-600/15 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-300">
                  Linh hoạt 100%
                </span>
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
