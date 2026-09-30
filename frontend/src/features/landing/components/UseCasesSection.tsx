import { ArrowDown } from "lucide-react"

import { cn } from "@/lib/utils"

import {
  USE_CASES,
  USE_CASES_SECTION,
  type EstimatorPresetId,
} from "../content/copy"
import { isSectionEnabled } from "../content/sections"
import { UNITS } from "../content/units"
import { RevealItem, RevealList } from "./Reveal"
import { SectionHeading } from "./SectionHeading"

interface UseCasesSectionProps {
  onTry: (presetId: EstimatorPresetId) => void
}

export function UseCasesSection({ onTry }: UseCasesSectionProps) {
  const [featured, ...rest] = USE_CASES

  return (
    <section
      id="use-cases"
      aria-labelledby="use-cases-title"
      className="bg-(--l-surface) py-(--l-section-space)"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="use-cases-title"
          title={USE_CASES_SECTION.title}
          lead={USE_CASES_SECTION.lead}
        />

        <RevealList className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
          {featured && (
            <RevealItem className="overflow-hidden rounded-(--l-radius-card) bg-background ring-1 ring-foreground/10 md:col-span-2 lg:col-span-1 lg:row-span-2">
              <article className="flex h-full flex-col">
                {featured.image && (
                  <img
                    src={featured.image.src}
                    alt={featured.image.alt}
                    width={900}
                    height={506}
                    loading="lazy"
                    decoding="async"
                    className="aspect-video w-full bg-(--l-surface-quiet) object-cover lg:aspect-auto lg:min-h-0 lg:flex-1"
                  />
                )}
                <UseCaseBody useCase={featured} onTry={onTry} className="p-7" />
              </article>
            </RevealItem>
          )}
          {rest.map((u) => (
            <RevealItem
              key={u.id}
              className="rounded-(--l-radius-card) bg-background ring-1 ring-foreground/10"
            >
              <article className="h-full">
                <UseCaseBody useCase={u} onTry={onTry} className="h-full p-7" />
              </article>
            </RevealItem>
          ))}
        </RevealList>
      </div>
    </section>
  )
}

function UseCaseBody({
  useCase,
  onTry,
  className,
}: {
  useCase: (typeof USE_CASES)[number]
  onTry: (presetId: EstimatorPresetId) => void
  className?: string
}) {
  const unit = UNITS.find((u) => u.size === useCase.size)
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <h3 className="text-xl leading-[1.35] font-semibold">{useCase.title}</h3>
      <p className="text-muted-foreground">{useCase.body}</p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
        {unit && (
          <span className="rounded-full bg-(--l-soft-bg) px-3 py-1 text-sm font-medium text-(--l-soft-fg)">
            Gợi ý: cỡ {unit.size} · {unit.name}
          </span>
        )}
        {isSectionEnabled("estimator") && (
          <a
            href="#estimator"
            onClick={() => onTry(useCase.presetId)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-[0.9375rem] font-medium text-(--l-link) outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {USE_CASES_SECTION.tryLabel}
            <ArrowDown className="size-4" aria-hidden />
          </a>
        )}
      </div>
    </div>
  )
}
