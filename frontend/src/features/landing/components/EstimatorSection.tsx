import { useId } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowRight, Sparkles, Snowflake } from "lucide-react"

import { formatVnd } from "../lib/format"
import { cn } from "@/lib/utils"

import { ESTIMATOR, type EstimatorPresetId } from "../content/copy"
import { CTA, ROUTES } from "../content/site"
import { monthlyPrice, recommendUnit } from "../lib/estimate"
import { DURATION, EASE_OUT_QUART } from "../motion/presets"
import { AnimatedNumber } from "./AnimatedNumber"
import { LandingLink } from "./LandingButton"
import { Reveal } from "./Reveal"
import { SectionHeading } from "./SectionHeading"

export interface EstimatorState {
  volume: number
  climate: boolean
  presetId: EstimatorPresetId | null
}

interface EstimatorSectionProps {
  state: EstimatorState
  onChange: (next: EstimatorState) => void
}

const formatM3 = (n: number) =>
  `${n.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} m³`
const formatPrice = (n: number) => formatVnd(Math.round(n / 1000) * 1000)

export function EstimatorSection({ state, onChange }: EstimatorSectionProps) {
  const sliderId = useId()
  const climateId = useId()
  const rec = recommendUnit(state.volume)
  const { min, max, step } = ESTIMATOR.slider
  const fill = `${((state.volume - min) / (max - min)) * 100}%`

  return (
    <section
      id="estimator"
      aria-labelledby="estimator-title"
      className="relative overflow-hidden py-(--l-section-space)"
    >
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="estimator-title"
          badge={ESTIMATOR.badge}
          title={ESTIMATOR.title}
          lead={ESTIMATOR.lead}
        />

        <Reveal className="grid gap-8 rounded-(--l-radius-panel) l-card p-6 shadow-xl sm:p-9 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:p-12">
          <div className="flex flex-col gap-8">
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-2 text-sm font-semibold tracking-wide text-foreground/80">
                Gợi ý chọn nhanh theo nhu cầu
              </legend>
              <div className="flex flex-wrap gap-2.5">
                {ESTIMATOR.presets.map((p) => {
                  const selected = state.presetId === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        onChange({
                          ...state,
                          volume: p.volumeM3,
                          presetId: p.id,
                        })
                      }
                      className={cn(
                        "relative isolate inline-flex min-h-11 items-center rounded-full px-4 text-[0.9375rem] font-medium transition-all duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        selected
                          ? "text-white shadow-md shadow-blue-500/30"
                          : "bg-muted/70 text-foreground hover:bg-muted dark:bg-card/70 dark:hover:bg-card"
                      )}
                    >
                      {selected && (
                        <motion.span
                          layoutId="estimator-chip"
                          className="absolute inset-0 -z-10 rounded-full bg-(--l-cta)"
                          transition={{
                            duration: DURATION.base,
                            ease: EASE_OUT_QUART,
                          }}
                        />
                      )}
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <div className="flex flex-col gap-3.5 rounded-2xl bg-muted/30 p-5 ring-1 ring-border/50 dark:bg-card/30">
              <div className="flex items-baseline justify-between gap-4">
                <label
                  htmlFor={sliderId}
                  className="text-sm font-semibold text-foreground/80"
                >
                  {ESTIMATOR.slider.label}
                </label>
                <output
                  htmlFor={sliderId}
                  className="rounded-lg bg-blue-500/10 px-3 py-1 text-2xl font-black text-blue-600 tabular-nums dark:bg-blue-400/15 dark:text-blue-400"
                >
                  {formatM3(state.volume)}
                </output>
              </div>
              <input
                id={sliderId}
                type="range"
                min={min}
                max={max}
                step={step}
                value={state.volume}
                aria-valuetext={formatM3(state.volume)}
                onChange={(e) =>
                  onChange({
                    ...state,
                    volume: Number(e.target.value),
                    presetId: null,
                  })
                }
                className="l-range my-1"
                style={{ ["--fill" as string]: fill }}
              />
              <div
                className="flex justify-between text-xs font-medium text-muted-foreground tabular-nums"
                aria-hidden
              >
                <span>{min} m³</span>
                <span>{max} m³</span>
              </div>
            </div>


          </div>

          <div
            aria-live="polite"
            className="flex min-h-[20rem] flex-col rounded-(--l-radius-card) bg-background p-6 shadow-md ring-1 ring-border/60 sm:p-8 dark:bg-card"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={rec.kind}
                className="flex h-full flex-1 flex-col gap-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: DURATION.fast, ease: EASE_OUT_QUART }}
              >
                {rec.kind === "empty" && (
                  <div className="flex h-full flex-col justify-center gap-3 py-6 text-center">
                    <h3 className="text-xl font-bold text-foreground">
                      {ESTIMATOR.emptyTitle}
                    </h3>
                    <p className="text-muted-foreground">
                      {ESTIMATOR.emptyBody}
                    </p>
                  </div>
                )}

                {rec.kind === "overflow" && (
                  <>
                    <h3 className="text-xl font-bold text-foreground">
                      {ESTIMATOR.overflowTitle}
                    </h3>
                    <p className="text-muted-foreground">
                      {ESTIMATOR.overflowBody}
                    </p>
                    <div className="mt-auto flex flex-wrap gap-3 pt-2">
                      <LandingLink to={ROUTES.book} size="lg">{CTA.book}</LandingLink>
                    </div>
                  </>
                )}

                {rec.kind === "fit" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-400/15 dark:text-blue-300">
                        <Sparkles className="size-3" />
                        {ESTIMATOR.resultPrefix}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-foreground sm:text-3xl">
                      Cỡ {rec.unit.size} · {rec.unit.name}
                    </h3>
                    <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">
                      {rec.unit.dimensions} · {rec.unit.volumeM3} m³.{" "}
                      {rec.unit.fits}
                    </p>
                    <dl className="mt-auto grid grid-cols-2 gap-4 border-t border-border/70 pt-5">
                      <div>
                        <dt className="text-xs font-medium text-muted-foreground">
                          Giá thuê ước tính
                        </dt>
                        <dd className="text-2xl font-extrabold text-blue-600 tabular-nums dark:text-blue-400">
                          <AnimatedNumber
                            value={monthlyPrice(rec.unit, {
                              climate: state.climate,
                            })}
                            format={formatPrice}
                          />
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            {ESTIMATOR.perMonth}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-muted-foreground">
                          {ESTIMATOR.depositLabel}
                        </dt>
                        <dd className="text-2xl font-extrabold tabular-nums text-foreground">
                          {formatVnd(rec.unit.deposit)}
                        </dd>
                      </div>
                    </dl>
                    <LandingLink to={ROUTES.book} size="lg" className="self-start shadow-md shadow-blue-500/25">
                      {CTA.bookThisSize}
                      <ArrowRight aria-hidden className="size-5 transition-transform group-hover:translate-x-1" />
                    </LandingLink>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
