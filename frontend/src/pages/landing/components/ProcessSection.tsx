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
            className="absolute top-10 right-[12.5%] left-[12.5%] hidden h-1 origin-left rounded-full bg-gradient-to-r from-sky-400/40 via-blue-500/40 to-indigo-500/40 md:block"
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
              className="group relative flex flex-col items-center text-center gap-3.5 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl border bg-white/85 border-slate-800/25 shadow-md hover:border-blue-700/60 hover:shadow-blue-500/10 dark:bg-slate-900/80 dark:border-cyan-200/35 dark:hover:border-cyan-300/70 dark:shadow-[0_8px_30px_rgba(56,189,248,0.12)]"
            >
              {/* Nút số 1 2 3 4 hiệu ứng Gradient phát sáng */}
              <span className="relative z-10 flex size-12 sm:size-13 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 text-lg sm:text-xl font-black text-white shadow-lg shadow-sky-500/30 ring-4 ring-white/90 dark:ring-slate-900/90 transition-transform duration-300 group-hover:scale-110">
                {i + 1}
              </span>

              <h3 className="text-base sm:text-lg leading-[1.35] font-bold text-foreground transition-colors group-hover:text-blue-600 dark:group-hover:text-sky-400">
                {step.title}
              </h3>

              <p className="max-w-[28ch] text-xs sm:text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  )
}
