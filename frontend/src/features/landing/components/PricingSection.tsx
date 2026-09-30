import { motion } from "motion/react"
import { Check } from "lucide-react"

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
      className="bg-(--l-surface) py-(--l-section-space)"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="pricing-title"
          title={PRICING_SECTION.title}
          lead={PRICING_SECTION.lead}
        />

        <RevealList className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {UNITS.map((u) => {
            const isSuggested = suggested === u.size
            return (
              <RevealItem key={u.size} className="relative">
                {isSuggested && (
                  <motion.div
                    layoutId="pricing-suggested"
                    aria-hidden
                    className="absolute -inset-1 rounded-[calc(var(--l-radius-card)+4px)] ring-2 ring-(--l-cta)"
                    transition={{
                      duration: DURATION.base,
                      ease: EASE_OUT_QUART,
                    }}
                  />
                )}
                <article
                  className={cn(
                    "relative flex h-full flex-col gap-5 rounded-(--l-radius-card) p-7 ring-1 ring-foreground/10 transition-[translate,box-shadow] duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-1 hover:shadow-(--l-shadow-lift) motion-reduce:hover:translate-y-0",
                    isSuggested ? "bg-(--l-soft-bg)" : "bg-background"
                  )}
                >
                  <header className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-(--l-link)">
                        Cỡ {u.size}
                      </span>
                      {isSuggested ? (
                        <span className="rounded-full bg-(--l-cta) px-2.5 py-0.5 text-xs font-medium text-white">
                          {PRICING_SECTION.suggested}
                        </span>
                      ) : (
                        u.tag && (
                          <span className="rounded-full bg-(--l-surface-quiet) px-2.5 py-0.5 text-xs font-medium">
                            {u.tag}
                          </span>
                        )
                      )}
                    </div>
                    <h3 className="text-xl leading-[1.35] font-semibold">
                      {u.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {u.dimensions} · {u.areaM2} m² · {u.volumeM3} m³
                    </p>
                  </header>

                  <p className="tabular-nums">
                    <span className="text-3xl font-bold tracking-tight">
                      {formatVnd(u.pricePerMonth)}
                    </span>
                    <span className="ml-1 text-sm text-muted-foreground">
                      {PRICING_SECTION.perMonth}
                    </span>
                  </p>

                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground">
                        {PRICING_SECTION.perDay}
                      </dt>
                      <dd className="font-medium tabular-nums">
                        {formatVnd(u.pricePerDay)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">
                        {PRICING_SECTION.deposit}
                      </dt>
                      <dd className="font-medium tabular-nums">
                        {formatVnd(u.deposit)}
                      </dd>
                    </div>
                  </dl>

                  <p className="flex gap-2 text-[0.9375rem] text-foreground/85">
                    <Check
                      className="mt-1 size-4 shrink-0 text-(--l-link)"
                      aria-hidden
                    />
                    {u.fits}
                  </p>

                  <LandingLink
                    to={ROUTES.book}
                    variant={isSuggested ? "primary" : "soft"}
                    size="md"
                    className="mt-auto w-full"
                  >
                    {CTA.book}
                    <span className="sr-only"> cỡ {u.size}</span>
                  </LandingLink>
                </article>
              </RevealItem>
            )
          })}
        </RevealList>

        <ul className="flex flex-col gap-2 text-[0.9375rem] text-muted-foreground md:flex-row md:flex-wrap md:gap-x-8">
          {PRICING_NOTES.map((n) => (
            <li key={n} className="flex gap-2">
              <span
                aria-hidden
                className="mt-2.5 size-1.5 shrink-0 rounded-full bg-(--l-cta)"
              />
              {n}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
