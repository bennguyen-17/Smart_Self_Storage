import { useId, useRef, useState, type KeyboardEvent } from "react"
import { AnimatePresence, motion } from "motion/react"
import { MapPin } from "lucide-react"

import { cn } from "@/lib/utils"

import { FACILITIES_SECTION } from "../content/copy"
import { CITIES, FACILITIES, type CityId } from "../content/facilities"
import { DURATION, EASE_OUT_QUART } from "../motion/presets"
import { Reveal } from "./Reveal"
import { SectionHeading } from "./SectionHeading"

interface FacilitiesSectionProps {
  selectedCity?: CityId
  onCityChange?: (city: CityId) => void
}

export function FacilitiesSection({
  selectedCity,
  onCityChange,
}: FacilitiesSectionProps) {
  const [internalCity, setInternalCity] = useState<CityId>(CITIES[0].id)
  const city = selectedCity ?? internalCity
  const handleCitySelect = (cId: CityId) => {
    setInternalCity(cId)
    onCityChange?.(cId)
  }

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
    handleCitySelect(CITIES[next].id)
    tabRefs.current[next]?.focus()
  }

  return (
    <section
      id="facilities"
      aria-labelledby="facilities-title"
      className="relative overflow-hidden py-(--l-section-space)"
    >
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="facilities-title"
          title={FACILITIES_SECTION.title}
          lead={FACILITIES_SECTION.lead}
        />

        <Reveal className="flex flex-col gap-5">
          <div
            role="tablist"
            aria-label="Chọn thành phố"
            className="flex w-fit max-w-full gap-1.5 overflow-x-auto rounded-full bg-muted/70 p-1.5 ring-1 ring-border/50 backdrop-blur-md dark:bg-card/70"
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
                  onClick={() => handleCitySelect(c.id)}
                  onKeyDown={(e) => onKeyDown(e, i)}
                  className={cn(
                    "relative isolate min-h-9.5 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    selected
                      ? "text-white shadow-md shadow-blue-500/30"
                      : "text-foreground hover:text-blue-600 dark:hover:text-blue-400"
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
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: DURATION.fast, ease: EASE_OUT_QUART }}
              >
                {list.map((f) => (
                  <li
                    key={f.code}
                    className="flex flex-col gap-3 rounded-(--l-radius-card) l-card p-5.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg leading-[1.35] font-bold text-foreground">
                        {f.name}
                      </h3>
                    </div>
                    <p className="flex gap-2 text-sm text-muted-foreground">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-blue-500" aria-hidden />
                      <span>{f.address}</span>
                    </p>
                    <ul className="flex flex-col gap-1.5 pt-0.5 text-sm text-foreground/90">
                      {f.highlights.map((h) => (
                        <li key={h} className="flex items-center gap-2">
                          <span
                            aria-hidden
                            className="size-1.5 shrink-0 rounded-full bg-blue-500"
                          />
                          <span>{h}</span>
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
