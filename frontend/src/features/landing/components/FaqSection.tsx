import { useId, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  ChevronDown,
  Clock,
  ShieldCheck,
  Calendar,
  ShieldAlert,
  Zap,
} from "lucide-react"

import { cn } from "@/lib/utils"

import { FAQ_SECTION } from "../content/copy"
import { DURATION, EASE_OUT_QUART } from "../motion/presets"
import { Reveal } from "./Reveal"
import { SectionHeading } from "./SectionHeading"

const FAQ_ICONS: Record<string, typeof Clock> = {
  access: Clock,
  climate: ShieldCheck,
  duration: Calendar,
  banned: ShieldAlert,
  booking: Zap,
}

export function FaqSection() {
  const [open, setOpen] = useState<ReadonlySet<string>>(
    new Set([FAQ_SECTION.items[0].id])
  )
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
      className="relative overflow-hidden border-y border-border/40 bg-gradient-to-b from-slate-100/60 via-slate-100/90 to-slate-100/60 py-(--l-section-space) dark:from-slate-900/60 dark:via-slate-900/90 dark:to-slate-900/60"
    >
      {/* Ambient Lighting Glows */}
      <div className="pointer-events-none absolute -top-24 left-1/4 -z-10 size-96 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-600/15" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 -z-10 size-96 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-600/15" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.6fr] lg:gap-14 lg:px-8">
        {/* Left Column: Heading */}
        <div>
          <SectionHeading
            id="faq-title"
            title={
              <span>
                Giải đáp tận tâm,{" "}
                <span className="l-gradient-title font-black">
                  an tâm trải nghiệm
                </span>
              </span>
            }
            lead="Mọi thắc mắc thường gặp về mã PIN mở cửa tự động, chính sách giá minh bạch và quy trình thuê kho 24/7."
          />
        </div>

        {/* Right Column: Clean Accordion List */}
        <Reveal>
          <ul className="flex flex-col gap-3.5">
            {FAQ_SECTION.items.map((item) => {
              const isOpen = open.has(item.id)
              const buttonId = `${baseId}-${item.id}-q`
              const panelId = `${baseId}-${item.id}-a`
              const Icon = FAQ_ICONS[item.id] || Clock

              return (
                <li
                  key={item.id}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border transition-all duration-200 shadow-sm",
                    isOpen
                      ? "border-blue-500/50 bg-blue-50/90 shadow-md dark:border-blue-700/60 dark:bg-blue-950/40"
                      : "bg-card/90 border-border/80 hover:border-blue-500/40 hover:bg-card dark:bg-card/70 dark:hover:bg-card/90"
                  )}
                >
                  <h3>
                    <button
                      id={buttonId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => toggle(item.id)}
                      className="flex min-h-16 w-full items-center justify-between gap-4 p-4.5 sm:px-5 sm:py-4.5 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 flex-1">
                        <div
                          className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                            isOpen
                              ? "bg-blue-600 text-white shadow-xs"
                              : "bg-background/80 text-muted-foreground shadow-xs group-hover:text-foreground"
                          )}
                        >
                          <Icon className="size-4.5" />
                        </div>

                        <span
                          className={cn(
                            "text-base sm:text-lg font-bold transition-colors leading-snug",
                            isOpen
                              ? "text-blue-600 dark:text-blue-300 font-extrabold"
                              : "text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400"
                          )}
                        >
                          {item.question}
                        </span>
                      </div>

                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full transition-transform duration-300",
                          isOpen
                            ? "bg-blue-600 text-white rotate-180 shadow-xs"
                            : "bg-muted/80 text-muted-foreground group-hover:bg-muted group-hover:text-foreground dark:bg-card"
                        )}
                      >
                        <ChevronDown aria-hidden className="size-4" />
                      </div>
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
                        <div className="px-5 pb-5 pt-1 sm:pl-16 sm:pr-6">
                          <div className="rounded-xl border-l-2 border-blue-500 bg-background/60 p-3.5 pl-4 dark:bg-card/60">
                            <p className="text-[0.9375rem] leading-relaxed text-muted-foreground dark:text-slate-300 font-normal">
                              {item.answer}
                            </p>
                          </div>
                        </div>
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


