import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowRight, Package, Receipt } from "lucide-react"

import { formatVnd } from "../lib/format"
import { cn } from "@/lib/utils"

import { PRICING_SECTION } from "../content/copy"
import { CTA, ROUTES } from "../content/site"
import { type UnitSize } from "../content/units"
import { useLiveUnits } from "../hooks/useLiveLandingData"
import { DURATION, EASE_OUT_QUART } from "../motion/presets"
import { LandingLink } from "./LandingButton"
import { RevealItem, RevealList } from "./Reveal"
import { SectionHeading } from "./SectionHeading"

interface PricingSectionProps {
  /** Cỡ gợi ý (nếu có) */
  suggested?: UnitSize | null
}

type ViewMode = "capacity" | "pricing"

export function PricingSection({ suggested: _suggested }: PricingSectionProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("capacity")
  const units = useLiveUnits()

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-title"
      className="relative overflow-hidden py-(--l-section-space)"
    >
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="pricing-title"
          title={PRICING_SECTION.title}
          lead={PRICING_SECTION.lead}
        />

        {/* NÚT GẠT ĐÔI CHUYỂN ĐỔI CHẾ ĐỘ XEM */}
        <div className="mx-auto flex items-center justify-center">
          <div
            role="tablist"
            aria-label="Chế độ xem bảng giá hoặc sức chứa"
            className="inline-flex rounded-xl bg-muted/80 p-1 ring-1 ring-border/70 shadow-inner dark:bg-card/70"
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "capacity"}
              onClick={() => setViewMode("capacity")}
              className={cn(
                "relative flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 outline-none",
                viewMode === "capacity"
                  ? "text-blue-900 shadow-sm dark:text-blue-100"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {viewMode === "capacity" && (
                <motion.span
                  layoutId="pricing-view-pill"
                  className="absolute inset-0 rounded-lg bg-white shadow-sm ring-1 ring-border/50 dark:bg-blue-950/70 dark:ring-blue-500/30"
                  transition={{ duration: DURATION.base, ease: EASE_OUT_QUART }}
                />
              )}
              <Package className="relative z-10 size-3.5 text-blue-600 dark:text-blue-400" />
              <span className="relative z-10">{PRICING_SECTION.capacityTab}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "pricing"}
              onClick={() => setViewMode("pricing")}
              className={cn(
                "relative flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 outline-none",
                viewMode === "pricing"
                  ? "text-blue-900 shadow-sm dark:text-blue-100"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {viewMode === "pricing" && (
                <motion.span
                  layoutId="pricing-view-pill"
                  className="absolute inset-0 rounded-lg bg-white shadow-sm ring-1 ring-border/50 dark:bg-blue-950/70 dark:ring-blue-500/30"
                  transition={{ duration: DURATION.base, ease: EASE_OUT_QUART }}
                />
              )}
              <Receipt className="relative z-10 size-3.5 text-blue-600 dark:text-blue-400" />
              <span className="relative z-10">{PRICING_SECTION.pricingTab}</span>
            </button>
          </div>
        </div>

        {/* 4 CARD CỠ KHO: DI CHUỘT VÀO CARD NÀO THÌ CARD ĐÓ NỔI BẬT */}
        <RevealList className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {units.map((u) => {
            return (
              <RevealItem key={u.size} className="relative">
                <article className="group relative flex h-full flex-col justify-between gap-3.5 rounded-2xl bg-card p-4 ring-1 ring-border/80 transition-all duration-200 hover:-translate-y-1 hover:ring-2 hover:ring-blue-600 hover:shadow-lg dark:hover:ring-blue-500">
                  {/* 1. ẢNH KHO TỰ NHIÊN, DÀI VÀ RÕ NÉT HƠN */}
                  <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-muted">
                    <img
                      src={u.image}
                      alt={`Kho tự quản ${u.name} - ${u.size}`}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* 2. TIÊU ĐỀ: TÊN KHO - SIZE & KÍCH THƯỚC (CĂN GIỮA, GỌN GÀNG) */}
                  <div className="flex flex-col items-center text-center gap-1 pt-1">
                    <h3 className="text-base font-bold text-foreground transition-colors duration-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {u.name} - {u.size}
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium">
                      {u.dimensions}
                    </p>
                  </div>

                  {/* 3. NỘI DUNG: TAB SỨC CHỨA HOẶC TAB BẢNG GIÁ */}
                  <div className="flex flex-1 flex-col justify-between gap-4 pt-1">
                    <AnimatePresence mode="wait" initial={false}>
                      {viewMode === "capacity" ? (
                        <motion.div
                          key="capacity"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: DURATION.fast, ease: EASE_OUT_QUART }}
                          className="flex min-h-[160px] flex-1 flex-col justify-between gap-3 text-xs"
                        >
                          {/* Sức chứa thực tế dạng bullet point */}
                          <ul className="flex flex-col gap-2 text-foreground/90 pt-1">
                            {u.capacityHighlights.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-muted-foreground/60 select-none">•</span>
                                <span className="leading-snug">{item.label}</span>
                              </li>
                            ))}
                          </ul>

                          {/* Đối tượng phù hợp ở chân thẻ thay cho giá tiền */}
                          <div className="mt-auto rounded-lg bg-muted/40 p-2.5 text-[11.5px] text-muted-foreground ring-1 ring-border/50">
                            <span className="font-semibold text-foreground">Phù hợp: </span>
                            <span>{u.idealFor}</span>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="pricing"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: DURATION.fast, ease: EASE_OUT_QUART }}
                          className="flex min-h-[160px] flex-1 flex-col justify-between gap-3 text-xs"
                        >
                          {/* 3 dòng đơn giá cơ bản */}
                          <div className="space-y-2 pt-1">
                            <div className="flex justify-between items-baseline">
                              <span className="text-muted-foreground">Giá theo tháng:</span>
                              <span className="font-bold text-foreground transition-colors duration-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 tabular-nums">
                                {formatVnd(u.pricePerMonth)}
                              </span>
                            </div>
                            <div className="flex justify-between items-baseline text-muted-foreground">
                              <span>Giá theo ngày:</span>
                              <span className="tabular-nums">{formatVnd(u.pricePerDay)}</span>
                            </div>
                            <div className="flex justify-between items-baseline text-muted-foreground">
                              <span>Tiền cọc:</span>
                              <span className="tabular-nums">{formatVnd(u.deposit)}</span>
                            </div>
                          </div>

                          {/* Giá gói dài hạn: dùng grid 2 cột gọn gàng không bị rớt dòng */}
                          <div className="mt-auto border-t border-border/60 pt-2.5 space-y-1.5 text-muted-foreground">
                            <span className="font-medium text-foreground block text-[11.5px]">Giá thuê theo gói dài hạn:</span>
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground shrink-0">Gói 3 tháng (-5%):</span>
                                <span className="font-semibold text-foreground tabular-nums">
                                  {formatVnd(Math.round(u.pricePerMonth * 0.95))}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground shrink-0">Gói 6 tháng (-10%):</span>
                                <span className="font-semibold text-foreground tabular-nums">
                                  {formatVnd(Math.round(u.pricePerMonth * 0.9))}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground shrink-0">Gói 12 tháng (-15%):</span>
                                <span className="font-semibold text-foreground tabular-nums">
                                  {formatVnd(Math.round(u.pricePerMonth * 0.85))}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 4. NÚT ĐẶT KHO */}
                  <LandingLink
                    to={`${ROUTES.book}?size=${u.size}`}
                    variant="soft"
                    size="md"
                    className="w-full justify-center text-xs font-semibold shadow-xs transition-all duration-200 group-hover:bg-blue-600 group-hover:text-white dark:group-hover:bg-blue-600 dark:group-hover:text-white"
                  >
                    <span>{CTA.book} Cỡ {u.size}</span>
                    <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </LandingLink>
                </article>
              </RevealItem>
            )
          })}
        </RevealList>
      </div>
    </section>
  )
}
