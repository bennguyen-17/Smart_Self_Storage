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

import { Card, Carousel, type CardType } from "@/components/ui/apple-cards-carousel"

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
  // Dữ liệu chi tiết cho Apple Cards Carousel
  const cardsData: CardType[] = [
    // THẺ 1: Sơ đồ kho 2D tương tác
    {
      category: "Linh hoạt 100% · Toàn thành phố",
      title: "Khám phá sơ đồ kho 2D, tự do chọn ô kho ưng ý",
      src: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=1200&q=80",
      content: (
        <div className="space-y-6">
          <div className="rounded-2xl bg-blue-50/70 p-6 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60">
            <h4 className="text-xl font-bold text-foreground sm:text-2xl mb-2">
              Chủ động chọn kho trực tuyến 24/7
            </h4>
            <p className="text-muted-foreground text-base leading-relaxed">
              Hệ thống cung cấp sơ đồ 2D thời gian thực giúp bạn theo dõi từng vị trí ô kho, trạng thái trống/đã thuê, kích thước và đơn giá minh bạch tại 7 cơ sở khắp toàn quốc.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border bg-card p-4 text-center">
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400">7 Cơ sở</div>
              <div className="text-sm text-muted-foreground mt-1">Toàn quốc, vị trí đắc địa</div>
            </div>
            <div className="rounded-2xl border bg-card p-4 text-center">
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400">24/7</div>
              <div className="text-sm text-muted-foreground mt-1">Tự do mở cửa bằng mã PIN</div>
            </div>
            <div className="rounded-2xl border bg-card p-4 text-center">
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400">22–25°C</div>
              <div className="text-sm text-muted-foreground mt-1">Kho mát điều hòa chuẩn</div>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="font-bold text-foreground text-lg">Ưu điểm nổi bật:</h5>
            <ul className="space-y-2.5 text-muted-foreground">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                <span>Chọn trực tiếp ô kho trên sơ đồ 2D tương tác.</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                <span>Nhận mã PIN mở cửa riêng biệt gửi ngay về điện thoại sau khi đặt.</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                <span>Camera an ninh đa góc &amp; bảo hiểm tài sản toàn diện 24/7.</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 flex flex-wrap gap-4">
            <LandingLink to={ROUTES.book} size="lg" className="w-full sm:w-auto shadow-lg shadow-blue-500/20">
              {CTA.book}
              <ArrowRight className="size-4.5 ml-2" />
            </LandingLink>
          </div>
        </div>
      ),
    },

    // THẺ 2 - 5: Các kích thước kho chuẩn S, M, L, XL
    ...USE_CASES.map((u) => {
      const Icon = USE_CASE_ICONS[u.id] || Sparkles
      const unit = UNITS.find((unit) => unit.size === u.size)

      return {
        category: `Cỡ ${u.size} · ${unit?.name || "Tủ kho"}`,
        title: u.title,
        src: u.image?.src || "https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&w=1200&q=80",
        content: (
          <div className="space-y-6">
            <div className="rounded-2xl bg-muted/60 p-6 border">
              <div className="flex items-center gap-3 mb-2">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border bg-card p-5">
                <h5 className="font-bold text-foreground text-sm uppercase tracking-wider text-muted-foreground mb-2">
                  Sức chứa tối ưu
                </h5>
                <p className="text-foreground font-medium leading-relaxed">
                  {unit?.fits}
                </p>
              </div>

              <div className="rounded-2xl border bg-card p-5">
                <h5 className="font-bold text-foreground text-sm uppercase tracking-wider text-muted-foreground mb-2">
                  Bảng giá tham khảo
                </h5>
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {unit?.pricePerMonth.toLocaleString("vi-VN")} đ
                  <span className="text-sm font-normal text-muted-foreground"> / tháng</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  hoặc {unit?.pricePerDay.toLocaleString("vi-VN")} đ / ngày (tiền cọc: {unit?.deposit.toLocaleString("vi-VN")} đ)
                </div>
              </div>
            </div>

            {/* Tiện ích đi kèm */}
            <div className="space-y-2.5">
              <h5 className="font-bold text-foreground text-base">Tiện ích đi kèm:</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-500" />
                  <span>Mã PIN bảo mật riêng</span>
                </div>
                <div className="flex items-center gap-2">
                  <ThermometerSnowflake className="size-4 text-sky-500" />
                  <span>Hỗ trợ kho mát 22-25°C</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-blue-500" />
                  <span>7 cơ sở thuận tiện đi lại</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <span>Hỗ trợ xe nâng &amp; bốc dỡ</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <LandingLink to={ROUTES.book} size="lg" className="w-full sm:w-auto shadow-lg shadow-blue-500/20">
                {CTA.book}
                <ArrowRight className="size-4.5 ml-2" />
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
    }),
  ]

  const carouselItems = cardsData.map((card, index) => (
    <Card key={card.src + index} card={card} index={index} />
  ))

  return (
    <section
      id="use-cases"
      aria-labelledby="use-cases-title"
      className="relative overflow-hidden py-(--l-section-space)"
    >
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="use-cases-title"
          badge={USE_CASES_SECTION.badge}
          title={USE_CASES_SECTION.title}
          lead={USE_CASES_SECTION.lead}
        />
      </div>

      {/* APPLE CARDS CAROUSEL */}
      <div className="w-full mt-4">
        <Carousel items={carouselItems} />
      </div>
    </section>
  )
}

