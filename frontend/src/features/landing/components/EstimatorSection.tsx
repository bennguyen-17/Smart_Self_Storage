import { useId } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowRight, Snowflake } from "lucide-react"

import { formatVnd } from "../lib/format"
import { cn } from "@/lib/utils"

import { ESTIMATOR, type EstimatorPresetId } from "../content/copy"
import { CTA, ROUTES } from "../content/site"
import { monthlyPrice, recommendUnit } from "../lib/estimate"
import { DURATION, EASE_OUT_QUART } from "../motion/presets"
import { AnimatedNumber } from "./AnimatedNumber"
import { CallLink, LandingLink } from "./LandingButton"
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
      className="py-(--l-section-space)"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="estimator-title"
          title={ESTIMATOR.title}
          lead={ESTIMATOR.lead}
        />

        <Reveal className="grid gap-6 rounded-(--l-radius-panel) bg-(--l-surface) p-5 sm:p-8 lg:grid-cols-[1.1fr_1fr] lg:gap-10 lg:p-10">
          <div className="flex flex-col gap-8">
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-3 text-sm font-medium text-muted-foreground">
                Chọn nhanh
              </legend>
              <div className="flex flex-wrap gap-2">
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
                        "relative isolate inline-flex min-h-11 items-center rounded-full px-4 text-[0.9375rem] font-medium transition-colors duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        selected
                          ? "text-white"
                          : "bg-(--l-surface-quiet) text-foreground hover:bg-[color-mix(in_oklch,var(--l-surface-quiet),var(--foreground)_6%)]"
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

            <div className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-4">
                <label
                  htmlFor={sliderId}
                  className="text-sm font-medium text-muted-foreground"
                >
                  {ESTIMATOR.slider.label}
                </label>
                <output
                  htmlFor={sliderId}
                  className="text-2xl font-bold tabular-nums"
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
                className="l-range"
                style={{ ["--fill" as string]: fill }}
              />
              <div
                className="flex justify-between text-xs text-muted-foreground tabular-nums"
                aria-hidden
              >
                <span>{min} m³</span>
                <span>{max} m³</span>
              </div>
            </div>

            <label
              htmlFor={climateId}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-(--l-radius-field) bg-background px-4 py-3 ring-1 ring-foreground/10"
            >
              <input
                id={climateId}
                type="checkbox"
                checked={state.climate}
                onChange={(e) =>
                  onChange({ ...state, climate: e.target.checked })
                }
                className="size-5 shrink-0 accent-(--l-cta)"
              />
              <Snowflake
                className="size-4 shrink-0 text-(--l-link)"
                aria-hidden
              />
              <span className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                <span className="font-medium">{ESTIMATOR.climateLabel}</span>
                <span className="text-sm text-muted-foreground">
                  {ESTIMATOR.climateHint}
                </span>
              </span>
            </label>
          </div>

          <div
            aria-live="polite"
            className="flex min-h-[18rem] flex-col rounded-(--l-radius-card) bg-background p-6 ring-1 ring-foreground/10 sm:p-8"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={rec.kind}
                className="flex h-full flex-1 flex-col gap-4"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: DURATION.fast, ease: EASE_OUT_QUART }}
              >
                {rec.kind === "empty" && (
                  <>
                    <h3 className="text-xl font-semibold">
                      {ESTIMATOR.emptyTitle}
                    </h3>
                    <p className="text-muted-foreground">
                      {ESTIMATOR.emptyBody}
                    </p>
                  </>
                )}

                {rec.kind === "overflow" && (
                  <>
                    <h3 className="text-xl font-semibold">
                      {ESTIMATOR.overflowTitle}
                    </h3>
                    <p className="text-muted-foreground">
                      {ESTIMATOR.overflowBody}
                    </p>
                    <div className="mt-auto flex flex-wrap gap-3 pt-2">
                      <LandingLink to={ROUTES.book}>{CTA.book}</LandingLink>
                      <CallLink />
                    </div>
                  </>
                )}

                {rec.kind === "fit" && (
                  <>
                    <p className="text-sm font-medium text-muted-foreground">
                      {ESTIMATOR.resultPrefix}
                    </p>
                    <h3 className="text-2xl font-bold">
                      Cỡ {rec.unit.size} · {rec.unit.name}
                    </h3>
                    <p className="text-muted-foreground">
                      {rec.unit.dimensions} · {rec.unit.volumeM3} m³.{" "}
                      {rec.unit.fits}
                    </p>
                    <dl className="mt-auto grid grid-cols-2 gap-4 border-t border-border pt-5">
                      <div>
                        <dt className="text-sm text-muted-foreground">
                          Giá thuê
                        </dt>
                        <dd className="text-2xl font-bold text-(--l-link) tabular-nums">
                          <AnimatedNumber
                            value={monthlyPrice(rec.unit, {
                              climate: state.climate,
                            })}
                            format={formatPrice}
                          />
                          <span className="ml-1 text-sm font-normal text-muted-foreground">
                            {ESTIMATOR.perMonth}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">
                          {ESTIMATOR.depositLabel}
                        </dt>
                        <dd className="text-2xl font-bold tabular-nums">
                          {formatVnd(rec.unit.deposit)}
                        </dd>
                      </div>
                    </dl>
                    <LandingLink to={ROUTES.book} className="self-start">
                      {CTA.bookThisSize}
                      <ArrowRight aria-hidden />
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
