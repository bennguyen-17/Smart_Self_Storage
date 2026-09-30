import {
  ArrowDown,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  GraduationCap,
  MapPin,
  ShieldCheck,
  Sparkles,
  Store,
  SunMedium,
  ThermometerSnowflake,
  Truck,
} from "lucide-react"

import { Card, type CardType } from "@/components/ui/apple-cards-carousel"

import {
  USE_CASES,
  USE_CASES_SECTION,
  type EstimatorPresetId,
} from "../content/copy"
import { isSectionEnabled } from "../content/sections"
import { CTA, ROUTES } from "../content/site"
import { UNITS } from "../content/units"
import { LandingLink } from "./LandingButton"
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
  // 4 THẺ GÓI KHO CHUẨN S, M, L, XL
  const cardsData: CardType[] = USE_CASES.map((u) => {
    const Icon = USE_CASE_ICONS[u.id] || Sparkles
    const unit = UNITS.find((unit) => unit.size === u.size)

    return {
      category: `Cỡ ${u.size} · ${unit?.name || "Tủ kho"}`,
      title: u.title,
      src:
        u.image?.src ||
        "https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&w=1200&q=80",
      content: (
        <div className="space-y-6">
          <div className="rounded-2xl border bg-muted/60 p-6">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <Icon className="size-5" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-foreground">
                  Cỡ {u.size}: {unit?.name} ({unit?.dimensions})
                </h4>
                <p className="text-sm text-muted-foreground">
                  Diện tích {unit?.areaM2} m² • Thể tích {unit?.volumeM3} m³
                </p>
              </div>
            </div>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              {u.body}
            </p>
          </div>

          {/* Chi tiết sức chứa & Bảng giá */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border bg-card p-5">
              <h5 className="mb-2 text-sm font-bold tracking-wider text-muted-foreground uppercase">
                Sức chứa tối ưu
              </h5>
              <p className="font-medium leading-relaxed text-foreground">
                {unit?.fits}
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-5">
              <h5 className="mb-2 text-sm font-bold tracking-wider text-muted-foreground uppercase">
                Bảng giá tham khảo
              </h5>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {unit?.pricePerMonth.toLocaleString("vi-VN")} đ
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}
                  / tháng
                </span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                hoặc {unit?.pricePerDay.toLocaleString("vi-VN")} đ / ngày (tiền
                cọc: {unit?.deposit.toLocaleString("vi-VN")} đ)
              </div>
            </div>
          </div>

          {/* Tiện ích đi kèm */}
          <div className="space-y-2.5">
            <h5 className="text-base font-bold text-foreground">
              Tiện ích đi kèm:
            </h5>
            <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-500" />
                <span>Mã PIN bảo mật riêng 24/7</span>
              </div>
              <div className="flex items-center gap-2">
                <ThermometerSnowflake className="size-4 text-sky-500" />
                <span>Kho mát điều hòa 22-25°C</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-blue-500" />
                <span>7 cơ sở hiện đại toàn quốc</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span>Hỗ trợ bốc dỡ &amp; ghép kho</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <LandingLink
              to={ROUTES.book}
              size="lg"
              className="w-full shadow-lg shadow-blue-500/20 sm:w-auto"
            >
              {CTA.book}
              <ArrowRight className="ml-2 size-4.5" />
            </LandingLink>

            {isSectionEnabled("estimator") && (
              <a
                href="#estimator"
                onClick={() => onTry(u.presetId)}
                className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold text-foreground transition hover:bg-muted"
              >
                {USE_CASES_SECTION.tryLabel}
                <ArrowDown className="size-4 text-blue-600 dark:text-blue-400" />
              </a>
            )}
          </div>
        </div>
      ),
    }
  })

  return (
    <section
      id="use-cases"
      aria-labelledby="use-cases-title"
      className="relative overflow-hidden py-(--l-section-space)"
    >
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        {/* TIÊU ĐỀ SECTION */}
        <SectionHeading
          id="use-cases-title"
          badge={USE_CASES_SECTION.badge}
          title={USE_CASES_SECTION.title}
          lead={USE_CASES_SECTION.lead}
        />

        {/* KHUNG DIV RIÊNG BỌC GỌN 4 CARD VỪA KHUNG TRANG */}
        <div className="w-full">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5 md:gap-6">
            {cardsData.map((card, index) => (
              <Card key={card.src + index} card={card} index={index} />
            ))}
          </div>
        </div>

        {/* KHUNG BANNER 2D LINH HOẠT ĐẶT DƯỚI GỌN GÀNG */}
        <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-blue-500/30 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-transparent p-5 sm:flex-row sm:p-6 shadow-sm dark:border-blue-400/30">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 font-extrabold text-white shadow-md shadow-blue-500/25">
              2D
            </div>
            <div>
              <h4 className="text-base font-bold text-foreground sm:text-lg">
                Nhu cầu lưu kho khác hoặc cần diện tích lớn?
              </h4>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Khám phá sơ đồ kho 2D tương tác để tự do lựa chọn vị trí và kích cỡ ô kho ưng ý nhất tại 7 cơ sở 24/7.
              </p>
            </div>
          </div>

          <LandingLink
            to={ROUTES.book}
            size="md"
            className="w-full shrink-0 justify-center shadow-md shadow-blue-500/20 sm:w-auto"
          >
            {CTA.book}
            <ArrowRight className="ml-1.5 size-4" />
          </LandingLink>
        </div>
      </div>
    </section>
  )
}


