import { ArrowRight, Sparkles } from "lucide-react"

import { FINAL_CTA } from "../content/copy"
import { CTA, ROUTES } from "../content/site"
import { LandingLink } from "./LandingButton"
import { Reveal } from "./Reveal"

export function FinalCtaSection() {
  return (
    <section
      id="final-cta"
      aria-labelledby="final-cta-title"
      className="relative overflow-hidden py-(--l-section-space)"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal className="relative overflow-hidden flex flex-col items-start gap-6 rounded-(--l-radius-panel) bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 px-6 py-10 text-white shadow-2xl shadow-blue-500/30 sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:py-13">
          {/* Subtle background glow circles */}
          <div
            aria-hidden
            className="absolute -top-24 -right-24 size-80 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none"
          />
          <div
            aria-hidden
            className="absolute -bottom-24 -left-24 size-80 rounded-full bg-indigo-400/30 blur-3xl pointer-events-none"
          />

          <div className="relative z-10 flex max-w-[34rem] flex-col gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md w-fit">
              <Sparkles className="size-3" />
              {FINAL_CTA.badge}
            </span>
            <h2
              id="final-cta-title"
              className="text-[clamp(1.75rem,1.4rem+1.4vw,2.5rem)] leading-[1.15] font-black tracking-[-0.025em] text-white"
            >
              {FINAL_CTA.title}
            </h2>
            <p className="text-sm text-blue-100 sm:text-base leading-relaxed">{FINAL_CTA.lead}</p>
          </div>

          <div className="relative z-10 flex flex-wrap gap-3.5">
            <LandingLink to={ROUTES.book} variant="inverse" size="lg" className="shadow-lg shadow-black/20">
              {CTA.book}
              <ArrowRight aria-hidden className="size-4.5 transition-transform group-hover:translate-x-1" />
            </LandingLink>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
