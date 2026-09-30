import { motion } from "motion/react"
import { Check, Sparkles } from "lucide-react"

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
  /** Cỡ đang được bộ ước tính gợi ý, để nhấn thẻ tương ứng. */
  suggested: UnitSize | null
}

export function PricingSection({ suggested }: PricingSectionProps) {
  return (
    <section
      id="pricing"
      aria-labelledby="pricing-title"
      className="relative overflow-hidden py-(--l-section-space)"
    >
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="pricing-title"
          badge={PRICING_SECTION.badge}
          title={PRICING_SECTION.title}
          lead={PRICING_SECTION.lead}
        />

        <RevealList className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {UNITS.map((u) => {
            const isSuggested = suggested === u.size
            return (
              <RevealItem key={u.size} className="relative">
                {isSuggested && (
                  <motion.div
                    layoutId="pricing-suggested"
                    aria-hidden
                    className="absolute -inset-1 rounded-[calc(var(--l-radius-card)+6px)] ring-2 ring-blue-500 shadow-lg shadow-blue-500/30"
                    transition={{
                      duration: DURATION.base,
                      ease: EASE_OUT_QUART,
                    }}
                  />
                )}
                <article
                  className={cn(
                    "relative flex h-full flex-col gap-5 rounded-(--l-radius-card) p-7 ring-1 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-2 hover:shadow-xl motion-reduce:hover:translate-y-0",
                    isSuggested
                      ? "bg-blue-50/80 ring-blue-500/40 dark:bg-blue-950/40 dark:ring-blue-400/50"
                      : "bg-background/90 ring-border/70 dark:bg-card/80"
                  )}
                >
                  <header className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        Cỡ {u.size}
                      </span>
                      {isSuggested ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
                          <Sparkles className="size-3" />
                          {PRICING_SECTION.suggested}
                        </span>
                      ) : (
                        u.tag && (
                          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground/80 dark:bg-card">
                            {u.tag}
                          </span>
                        )
                      )}
                    </div>
                    <h3 className="text-xl leading-[1.35] font-bold text-foreground">
                      {u.name}
                    </h3>
                    <p className="text-xs font-medium text-muted-foreground">
                      {u.dimensions} · {u.areaM2} m² · {u.volumeM3} m³
                    </p>
                  </header>

                  <p className="tabular-nums">
                    <span className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                      {formatVnd(u.pricePerMonth)}
                    </span>
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      {PRICING_SECTION.perMonth}
                    </span>
                  </p>

                  <dl className="grid grid-cols-2 gap-3 rounded-xl bg-muted/40 p-3 text-xs dark:bg-muted/20">
                    <div>
                      <dt className="text-muted-foreground">
                        {PRICING_SECTION.perDay}
                      </dt>
                      <dd className="font-bold tabular-nums text-foreground">
                        {formatVnd(u.pricePerDay)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">
                        {PRICING_SECTION.deposit}
                      </dt>
                      <dd className="font-bold tabular-nums text-foreground">
                        {formatVnd(u.deposit)}
                      </dd>
                    </div>
                  </dl>

                  <p className="flex gap-2 text-[0.9375rem] text-foreground/90">
                    <Check
                      className="mt-0.5 size-4.5 shrink-0 text-blue-500 dark:text-blue-400"
                      aria-hidden
                    />
                    <span>{u.fits}</span>
                  </p>

                  <LandingLink
                    to={ROUTES.book}
                    variant={isSuggested ? "primary" : "soft"}
                    size="md"
                    className="mt-auto w-full shadow-sm"
                  >
                    {CTA.book}
                    <span className="sr-only"> cỡ {u.size}</span>
                  </LandingLink>
                </article>
              </RevealItem>
            )
          })}
        </RevealList>

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
