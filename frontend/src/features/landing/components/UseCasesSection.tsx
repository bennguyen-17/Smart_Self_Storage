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
          {/* 1 Thẻ to nổi bật nằm bên TRÁI (Col 1, trải dài 2 hàng) */}
          <RevealItem className="group flex flex-col justify-between overflow-hidden rounded-(--l-radius-card) border border-blue-500/30 bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-transparent p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl sm:p-6 md:col-span-2 lg:col-span-1 lg:row-span-2 dark:border-blue-400/30">
            <article className="flex h-full flex-col justify-between gap-4">
              <div className="flex flex-col gap-3.5">
                {/* Visual Image Banner */}
                <div className="relative h-48 w-full overflow-hidden rounded-2xl bg-muted sm:h-56 lg:h-60">
                  <img
                    src="https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=800&q=80"
                    alt="Hệ thống kho tự quản thông minh 2D"
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-108"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-950/85 via-blue-900/30 to-black/20" />

                  <div className="absolute inset-x-3.5 top-3.5 flex items-center justify-between">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/30">
                      <Sparkles className="size-4.5 animate-pulse" aria-hidden />
                    </span>
                    <span className="inline-flex items-center rounded-full bg-blue-600/90 px-3 py-0.5 text-xs font-semibold text-white shadow-sm backdrop-blur-md">
                      Linh hoạt 100%
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="mb-1.5 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    Nhu cầu lưu kho khác?
                  </h3>
                  <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">
                    Khám phá sơ đồ kho 2D tương tác để tự do lựa chọn vị trí và kích cỡ ô kho ưng ý nhất theo nhu cầu thực tế của bạn.
                  </p>
                </div>

                {/* 3 Thẻ thống kê nổi bật */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="flex flex-col items-center justify-center rounded-xl bg-blue-500/10 p-2 text-center ring-1 ring-blue-500/15 dark:bg-blue-400/10">
                    <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">7 Cơ sở</span>
                    <span className="text-[0.7rem] text-muted-foreground">Toàn thành phố</span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl bg-blue-500/10 p-2 text-center ring-1 ring-blue-500/15 dark:bg-blue-400/10">
                    <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">24/7</span>
                    <span className="text-[0.7rem] text-muted-foreground">Mở kho tự do</span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl bg-blue-500/10 p-2 text-center ring-1 ring-blue-500/15 dark:bg-blue-400/10">
                    <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">22–25°C</span>
                    <span className="text-[0.7rem] text-muted-foreground">Kho mát chuẩn</span>
                  </div>
                </div>

                {/* Tiện ích nổi bật */}
                <ul className="space-y-2 text-sm text-foreground/85">
                  <li className="flex items-center gap-2.5">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-600 dark:text-blue-400">✓</span>
                    <span>Tự do chọn vị trí ô kho qua sơ đồ 2D</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-600 dark:text-blue-400">✓</span>
                    <span>Hỗ trợ ghép nhiều kho diện tích lớn</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-600 dark:text-blue-400">✓</span>
                    <span>Bảo mật vân tay & camera an ninh 24/7</span>
                  </li>
                </ul>

                {/* Khối hộp thông tin sơ đồ 2D tiện lợi */}
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 dark:bg-blue-500/10">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white shadow-sm">
                      2D
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-foreground">Sơ đồ tầng trực quan</div>
                      <div className="text-[0.75rem] text-muted-foreground">Xem trạng thái trống & chọn kho ngay trên bản đồ</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <LandingLink to={ROUTES.book} size="md" className="w-full justify-center shadow-lg shadow-blue-500/25">
                  {CTA.book}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </LandingLink>
              </div>
            </article>
          </RevealItem>

          {/* 4 Thẻ nhỏ cho 4 kích cỡ chuẩn S, M, L, XL nằm bên PHẢI (2x2) */}
          {USE_CASES.map((u) => {
            const Icon = USE_CASE_ICONS[u.id] || Sparkles
            const unit = UNITS.find((unit) => unit.size === u.size)
            return (
              <RevealItem
                key={u.id}
                className="group flex flex-col overflow-hidden rounded-(--l-radius-card) l-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl sm:p-6"
              >
                <article className="flex h-full flex-col">
                  {/* Card Image Banner */}
                  {u.image && (
                    <div className="relative mb-4 h-40 w-full overflow-hidden rounded-2xl bg-muted sm:h-44">
                      <img
                        src={u.image.src}
                        alt={u.image.alt || u.title}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-108"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10" />

                      {/* Floating Icon & Size Badge */}
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

                  <div className="mt-auto pt-4">
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
        </RevealList>
      </div>
    </section>
  )
}
