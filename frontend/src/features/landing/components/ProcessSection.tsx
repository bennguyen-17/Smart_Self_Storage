import { motion } from "motion/react"

import { PROCESS_SECTION } from "../content/copy"
import {
  DURATION,
  EASE_OUT_QUART,
  MOTION_ENABLED,
  VIEWPORT,
  fadeUp,
  staggerChildren,
} from "../motion/presets"
import { SectionHeading } from "./SectionHeading"

export function ProcessSection() {
  const initial = MOTION_ENABLED ? "hidden" : false

  return (
    <section
      id="process"
      aria-labelledby="process-title"
      className="relative overflow-hidden bg-muted/40 py-(--l-section-space) dark:bg-muted/15"
    >
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="process-title"
          badge={PROCESS_SECTION.badge}
          title={PROCESS_SECTION.title}
        />

        <motion.ol
          className="relative grid gap-8 md:grid-cols-4 md:gap-6"
          variants={staggerChildren}
          initial={initial}
          whileInView="shown"
          viewport={VIEWPORT}
        >
          {/* Đường nối các bước: vẽ dần từ trái sang khi cuộn tới (desktop). */}
          <motion.span
            aria-hidden
            className="absolute top-7 right-[12.5%] left-[12.5%] hidden h-1 origin-left rounded-full bg-blue-500/25 md:block"
            variants={{
              hidden: { scaleX: 0 },
              shown: {
                scaleX: 1,
                transition: {
                  duration: DURATION.slow * 1.5,
                  ease: EASE_OUT_QUART,
                },
              },
            }}
          />
          {PROCESS_SECTION.steps.map((step, i) => (
            <motion.li
              key={step.title}
              variants={fadeUp}
              className="relative flex flex-col gap-3.5 rounded-2xl l-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg md:items-center md:text-center md:bg-transparent md:backdrop-blur-none md:border-none md:shadow-none md:p-0"
            >
              <span className="flex size-14 items-center justify-center rounded-2xl bg-blue-600 text-xl font-black text-white shadow-lg shadow-blue-500/30 ring-4 ring-background">
                {i + 1}
              </span>
              <h3 className="text-xl leading-[1.35] font-bold text-foreground">
                {step.title}
              </h3>
              <p className="max-w-[28ch] text-[0.9375rem] leading-relaxed text-muted-foreground">{step.body}</p>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  )
}
