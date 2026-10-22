import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  ArrowRight,
  Box,
  CheckCircle2,
  Home,
  Luggage,
  Package,
  Receipt,
  Users,
} from "lucide-react"

import { formatVnd } from "../lib/format"
import { cn } from "@/lib/utils"

import { PRICING_SECTION } from "../content/copy"
import { CTA, ROUTES } from "../content/site"
import { PRICING_NOTES, UNITS, type UnitSize } from "../content/units"
import { DURATION, EASE_OUT_QUART } from "../motion/presets"
import { LandingLink } from "./LandingButton"
import { RevealItem, RevealList } from "./Reveal"
import { SectionHeading } from "./SectionHeading"

interface PricingSectionProps {
  /** Cỡ đang được gợi ý (ví dụ Cỡ M) */
  suggested?: UnitSize | null
}

type ViewMode = "capacity" | "pricing"

export function PricingSection({ suggested = "M" }: PricingSectionProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("capacity")

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-title"
      className="relative overflow-hidden py-(--l-section-space)"
    >
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="pricing-title"
          title={PRICING_SECTION.title}
          lead={PRICING_SECTION.lead}
        />

        {/* NÚT GẠT ĐÔI CHUYỂN ĐỔI CHẾ ĐỘ XEM (TOGGLE VIEW) */}
        <div className="mx-auto flex items-center justify-center">
          <div
            role="tablist"
            aria-label="Chế độ xem bảng giá hoặc sức chứa"
            className="inline-flex rounded-2xl bg-muted/80 p-1.5 ring-1 ring-border/70 shadow-inner dark:bg-card/70"
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "capacity"}
              onClick={() => setViewMode("capacity")}
              className={cn(
                "relative flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                viewMode === "capacity"
                  ? "text-blue-900 shadow-sm dark:text-blue-100"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {viewMode === "capacity" && (
                <motion.span
                  layoutId="pricing-view-pill"
                  className="absolute inset-0 rounded-xl bg-white shadow-sm ring-1 ring-border/50 dark:bg-blue-950/70 dark:ring-blue-500/30"
                  transition={{ duration: DURATION.base, ease: EASE_OUT_QUART }}
                />
              )}
              <Package className="relative z-10 size-4 text-blue-600 dark:text-blue-400" />
              <span className="relative z-10">{PRICING_SECTION.capacityTab}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "pricing"}
              onClick={() => setViewMode("pricing")}
              className={cn(
                "relative flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                viewMode === "pricing"
                  ? "text-blue-900 shadow-sm dark:text-blue-100"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {viewMode === "pricing" && (
                <motion.span
                  layoutId="pricing-view-pill"
                  className="absolute inset-0 rounded-xl bg-white shadow-sm ring-1 ring-border/50 dark:bg-blue-950/70 dark:ring-blue-500/30"
                  transition={{ duration: DURATION.base, ease: EASE_OUT_QUART }}
                />
              )}
              <Receipt className="relative z-10 size-4 text-blue-600 dark:text-blue-400" />
              <span className="relative z-10">{PRICING_SECTION.pricingTab}</span>
            </button>
          </div>
        </div>

        {/* 4 CARD CỠ KHO CÓ HÌNH ẢNH THỰC TẾ & NỘI DUNG TINH GỌN */}
        <RevealList className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {UNITS.map((u) => {
            const isSuggested = suggested === u.size
            return (
              <RevealItem key={u.size} className="relative">
                <article
                  className={cn(
                    "relative flex h-full flex-col justify-between gap-4 rounded-(--l-radius-card) p-5 ring-1 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-1.5 hover:shadow-xl motion-reduce:hover:translate-y-0",
                    isSuggested
                      ? "bg-blue-50/70 ring-blue-500/50 dark:bg-blue-950/40 dark:ring-blue-400/50"
                      : "bg-card ring-border/70 dark:bg-card/80"
                  )}
                >
                  {/* 1. ẢNH KHO THỰC TẾ TRỰC QUAN */}
                  <div className="relative aspect-16/10 w-full overflow-hidden rounded-xl bg-muted ring-1 ring-border/50">
                    <img
                      src={u.image}
                      alt={`Kho tự quản cỡ ${u.size} - ${u.name}`}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-500 hover:scale-105"
                    />

                    {/* Badge Cỡ & Diện tích ở góc ảnh */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span
                        className={cn(
                          "rounded-lg px-2.5 py-1 text-xs font-black tracking-wide uppercase shadow-sm",
                          isSuggested
                            ? "bg-blue-600 text-white"
                            : "bg-black/75 text-white backdrop-blur-xs"
                        )}
                      >
                        Cỡ {u.size}
                      </span>
                      <span className="rounded-lg bg-black/60 px-2 py-1 text-[11px] font-semibold text-white/95 backdrop-blur-xs">
                        {u.areaM2} m²
                      </span>
                    </div>

                    {/* Tag nổi bật ở góc phải ảnh */}
                    {u.tag && (
                      <div className="absolute top-2.5 right-2.5">
                        <span className="rounded-lg bg-blue-600/90 px-2 py-1 text-[11px] font-bold text-white shadow-sm backdrop-blur-xs">
                          {u.tag}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 2. TIÊU ĐỀ & KÍCH THƯỚC */}
                  <div className="flex flex-col gap-0.5">
                    <h3 className="text-xl font-black text-foreground">
                      {u.name}
                    </h3>
                    <p className="text-xs font-medium text-muted-foreground">
                      {u.dimensions} · Trần cao 2.0m
                    </p>
                  </div>

                  {/* 3. THÂN CARD: ĐỔI MƯỢT GIỮA 2 CHẾ ĐỘ XEM */}
                  <div className="flex flex-1 flex-col justify-between gap-3 py-1">
                    <AnimatePresence mode="wait" initial={false}>
                      {viewMode === "capacity" ? (
                        <motion.div
                          key="capacity"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{
                            duration: DURATION.fast,
                            ease: EASE_OUT_QUART,
                          }}
                          className="flex flex-1 flex-col gap-3"
                        >
                          {/* Không gian tương đương ngắn gọn */}
                          <div className="flex items-center gap-2 rounded-xl bg-blue-50/80 p-2.5 text-xs font-semibold text-blue-900 ring-1 ring-blue-500/20 dark:bg-blue-950/40 dark:text-blue-200">
                            <Home className="size-4 shrink-0 text-blue-600 dark:text-blue-400" />
                            <span className="line-clamp-1">
                              {u.equivalent}
                            </span>
                          </div>

                          {/* 3 Dòng sức chứa tối đa ngắn gọn, rõ ràng */}
                          <ul className="flex flex-col gap-2.5 text-xs">
                            <li className="flex items-center gap-2.5 font-medium text-foreground">
                              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-400/15 dark:text-blue-400">
                                <Box className="size-4" />
                              </div>
                              <span className="line-clamp-1">
                                <strong>Thùng carton:</strong> {u.capacityHighlights[0].label}
                              </span>
                            </li>

                            <li className="flex items-center gap-2.5 font-medium text-foreground">
                              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-400/15 dark:text-blue-400">
                                <Luggage className="size-4" />
                              </div>
                              <span className="line-clamp-1">
                                <strong>Vali du lịch:</strong> {u.capacityHighlights[1].label}
                              </span>
                            </li>

                            <li className="flex items-start gap-2.5 font-medium text-foreground">
                              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400 mt-0.5">
                                <CheckCircle2 className="size-4" />
                              </div>
                              <span className="line-clamp-2">
                                <strong>Đồ lớn:</strong> {u.capacityHighlights[2].label}
                              </span>
                            </li>
                          </ul>

                          {/* Giá tóm tắt */}
                          <div className="mt-auto flex items-baseline justify-between border-t border-border/70 pt-2 text-xs">
                            <span className="text-muted-foreground">
                              Giá chỉ từ:
                            </span>
                            <span className="text-base font-black text-blue-600 tabular-nums dark:text-blue-400">
                              {formatVnd(u.pricePerMonth)}/tháng
                            </span>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="pricing"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{
                            duration: DURATION.fast,
                            ease: EASE_OUT_QUART,
                          }}
                          className="flex flex-1 flex-col gap-3"
                        >
                          {/* Giá chính to rõ */}
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-black text-foreground tabular-nums">
                                {formatVnd(u.pricePerMonth)}
                              </span>
                              <span className="text-xs font-normal text-muted-foreground">
                                {PRICING_SECTION.perMonth}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              hoặc {formatVnd(u.pricePerDay)}/ngày · Cọc {formatVnd(u.deposit)}
                            </span>
                          </div>

                          {/* Bảng chiết khấu dài hạn gọn gàng */}
                          <div className="rounded-xl border border-border/70 bg-muted/30 p-2.5 text-xs dark:bg-muted/15 space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground">Gói 3 tháng (-5%):</span>
                              <span className="font-bold tabular-nums text-foreground">
                                {formatVnd(Math.round(u.pricePerMonth * 0.95))}/tháng
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground">Gói 6 tháng (-10%):</span>
                              <span className="font-bold tabular-nums text-foreground">
                                {formatVnd(Math.round(u.pricePerMonth * 0.9))}/tháng
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              <span>Gói 12 tháng (-15%):</span>
                              <span className="font-black tabular-nums">
                                {formatVnd(Math.round(u.pricePerMonth * 0.85))}/tháng
                              </span>
                            </div>
                          </div>

                          {/* Đối tượng phù hợp */}
                          <div className="mt-auto flex items-start gap-1.5 text-xs text-muted-foreground">
                            <Users className="size-3.5 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <span className="line-clamp-2">
                              <strong>Phù hợp:</strong> {u.idealFor}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 4. NÚT ĐẶT KHO */}
                  <LandingLink
                    to={`${ROUTES.book}?size=${u.size}`}
                    variant={isSuggested ? "primary" : "soft"}
                    size="md"
                    className="w-full justify-center shadow-sm"
                  >
                    <span>{CTA.book} Cỡ {u.size}</span>
                    <ArrowRight className="size-4" />
                  </LandingLink>
                </article>
              </RevealItem>
            )
          })}
        </RevealList>

        {/* CHÍNH SÁCH NIÊM YẾT DƯỚI CÙNG */}
        <ul className="flex flex-col gap-2.5 text-[0.9375rem] text-muted-foreground md:flex-row md:flex-wrap md:gap-x-8">
          {PRICING_NOTES.map((n) => (
            <li key={n} className="flex items-center gap-2">
              <span
                aria-hidden
                className="size-1.5 shrink-0 rounded-full bg-blue-500"
              />
              <span>{n}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
