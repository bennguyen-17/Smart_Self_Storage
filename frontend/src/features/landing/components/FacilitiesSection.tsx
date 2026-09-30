import { useId, useRef, useState, type KeyboardEvent } from "react"
import { AnimatePresence, motion } from "motion/react"
import { MapPin, Snowflake } from "lucide-react"

import { cn } from "@/lib/utils"

import { FACILITIES_SECTION } from "../content/copy"
import { CITIES, FACILITIES, type CityId } from "../content/facilities"
import { DURATION, EASE_OUT_QUART } from "../motion/presets"
import { Reveal } from "./Reveal"
import { SectionHeading } from "./SectionHeading"

export function FacilitiesSection() {
  const [city, setCity] = useState<CityId>(CITIES[0].id)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const baseId = useId()
  const list = FACILITIES.filter((f) => f.city === city)

  // WAI-ARIA Tabs: ←/→/Home/End chuyển tab, roving tabindex.
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = CITIES.length - 1
    const next =
      e.key === "ArrowRight"
        ? index === last
          ? 0
          : index + 1
        : e.key === "ArrowLeft"
          ? index === 0
            ? last
            : index - 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : null
    if (next === null) return
    e.preventDefault()
    setCity(CITIES[next].id)
    tabRefs.current[next]?.focus()
  }

  return (
    <section
      id="facilities"
      aria-labelledby="facilities-title"
      className="py-(--l-section-space)"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="facilities-title"
          title={FACILITIES_SECTION.title}
          lead={FACILITIES_SECTION.lead}
        />

        <Reveal className="flex flex-col gap-6">
          <div
            role="tablist"
            aria-label="Chọn thành phố"
            className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-full bg-(--l-surface-quiet) p-1"
          >
            {CITIES.map((c, i) => {
              const selected = c.id === city
              return (
                <button
                  key={c.id}
                  ref={(el) => {
                    tabRefs.current[i] = el
                  }}
                  type="button"
                  role="tab"
                  id={`${baseId}-tab-${c.id}`}
                  aria-selected={selected}
                  aria-controls={`${baseId}-panel`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setCity(c.id)}
                  onKeyDown={(e) => onKeyDown(e, i)}
                  className={cn(
                    "relative isolate min-h-11 shrink-0 rounded-full px-5 text-[0.9375rem] font-medium transition-colors duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    selected
                      ? "text-white"
                      : "text-foreground hover:text-(--l-link)"
                  )}
                >
                  {selected && (
                    <motion.span
                      layoutId="city-tab"
                      className="absolute inset-0 -z-10 rounded-full bg-(--l-cta)"
                      transition={{
                        duration: DURATION.base,
                        ease: EASE_OUT_QUART,
                      }}
                    />
                  )}
                  {c.label}
                </button>
              )
            })}
          </div>

          <div
            id={`${baseId}-panel`}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-${city}`}
            tabIndex={0}
            className="rounded-(--l-radius-card) outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.ul
                key={city}
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DURATION.fast, ease: EASE_OUT_QUART }}
              >
                {list.map((f) => (
                  <li
                    key={f.code}
                    className="flex flex-col gap-3 rounded-(--l-radius-card) bg-(--l-surface) p-7"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl leading-[1.35] font-semibold">
                        {f.name}
                      </h3>
                      {f.isClimate && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-(--l-soft-bg) px-2.5 py-0.5 text-xs font-medium text-(--l-soft-fg)">
                          <Snowflake className="size-3.5" aria-hidden />
                          {FACILITIES_SECTION.climateBadge}
                        </span>
                      )}
                    </div>
                    <p className="flex gap-2 text-[0.9375rem] text-muted-foreground">
                      <MapPin className="mt-1 size-4 shrink-0" aria-hidden />
                      {f.address}
                    </p>
                    <ul className="flex flex-col gap-1.5 text-[0.9375rem]">
                      {f.highlights.map((h) => (
                        <li key={h} className="flex gap-2">
                          <span
                            aria-hidden
                            className="mt-2.5 size-1.5 shrink-0 rounded-full bg-(--l-cta)"
                          />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </motion.ul>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
