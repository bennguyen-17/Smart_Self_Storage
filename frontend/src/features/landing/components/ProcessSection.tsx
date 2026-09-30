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
      className="bg-(--l-surface) py-(--l-section-space)"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 sm:px-6 lg:px-8">
        <SectionHeading id="process-title" title={PROCESS_SECTION.title} />

        <motion.ol
          className="relative grid gap-10 md:grid-cols-4 md:gap-6"
          variants={staggerChildren}
          initial={initial}
          whileInView="shown"
          viewport={VIEWPORT}
        >
          {/* Đường nối các bước: vẽ dần từ trái sang khi cuộn tới (desktop). */}
          <motion.span
            aria-hidden
            className="absolute top-6 right-[12.5%] left-[12.5%] hidden h-0.5 origin-left rounded-full bg-(--l-cta)/30 md:block"
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
              className="relative flex flex-col gap-3 md:items-center md:text-center"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-(--l-cta) text-lg font-bold text-white ring-8 ring-(--l-surface)">
                {i + 1}
              </span>
              <h3 className="text-xl leading-[1.35] font-semibold">
                {step.title}
              </h3>
              <p className="max-w-[28ch] text-muted-foreground">{step.body}</p>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  )
}
