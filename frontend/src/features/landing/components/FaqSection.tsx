import { useId, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

import { FAQ_SECTION } from "../content/copy"
import { DURATION, EASE_OUT_QUART } from "../motion/presets"
import { Reveal } from "./Reveal"
import { SectionHeading } from "./SectionHeading"

export function FaqSection() {
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set([FAQ_SECTION.items[0].id]))
  const baseId = useId()

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="relative overflow-hidden bg-muted/40 py-(--l-section-space) dark:bg-muted/15"
    >
      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.6fr] lg:px-8">
        <SectionHeading
          id="faq-title"
          badge={FAQ_SECTION.badge}
          title={FAQ_SECTION.title}
        />

        <Reveal>
          <ul className="flex flex-col divide-y divide-border/60 rounded-(--l-radius-card) l-card px-3 shadow-sm sm:px-5">
            {FAQ_SECTION.items.map((item) => {
              const isOpen = open.has(item.id)
              const buttonId = `${baseId}-${item.id}-q`
              const panelId = `${baseId}-${item.id}-a`
              return (
                <li key={item.id} className="py-1">
                  <h3>
                    <button
                      id={buttonId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => toggle(item.id)}
                      className="flex min-h-16 w-full items-center justify-between gap-4 rounded-xl px-3 py-4 text-left text-lg font-bold transition-colors outline-none hover:text-blue-600 focus-visible:ring-3 focus-visible:ring-ring/50 dark:hover:text-blue-400"
                    >
                      <span className="text-foreground">{item.question}</span>
                      <ChevronDown
                        aria-hidden
                        className={cn(
                          "size-5 shrink-0 text-muted-foreground transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]",
                          isOpen && "rotate-180 text-blue-500"
                        )}
                      />
                    </button>
                  </h3>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={panelId}
                        role="region"
                        aria-labelledby={buttonId}
                        key="panel"
                        className="overflow-hidden"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          duration: DURATION.base,
                          ease: EASE_OUT_QUART,
                        }}
                      >
                        <p className="max-w-[68ch] px-3 pb-5 text-[0.9375rem] leading-relaxed text-muted-foreground">
                          {item.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              )
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
