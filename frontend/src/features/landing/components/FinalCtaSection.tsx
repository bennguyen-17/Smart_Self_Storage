import { ArrowRight } from "lucide-react"

import { FINAL_CTA } from "../content/copy"
import { CTA, ROUTES } from "../content/site"
import { CallLink, LandingLink } from "./LandingButton"
import { Reveal } from "./Reveal"

export function FinalCtaSection() {
  return (
    <section
      id="final-cta"
      aria-labelledby="final-cta-title"
      className="py-(--l-section-space)"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="flex flex-col items-start gap-6 rounded-(--l-radius-panel) bg-(--l-cta) px-6 py-12 text-white sm:px-12 lg:flex-row lg:items-center lg:justify-between lg:py-16">
          <div className="flex max-w-[36rem] flex-col gap-3">
            <h2
              id="final-cta-title"
              className="text-[clamp(1.75rem,1.4rem+1.4vw,2.5rem)] leading-[1.2] font-bold tracking-[-0.02em]"
            >
              {FINAL_CTA.title}
            </h2>
            <p className="text-white">{FINAL_CTA.lead}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <LandingLink to={ROUTES.book} variant="inverse">
              {CTA.book}
              <ArrowRight aria-hidden />
            </LandingLink>
            <CallLink showNumber variant="outline-inverse" />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
