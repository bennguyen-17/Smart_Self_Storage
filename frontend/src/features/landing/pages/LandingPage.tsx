import { Fragment, useState, type ReactNode } from "react"
import { MotionConfig } from "motion/react"

import "../landing.css"
import { ESTIMATOR, type EstimatorPresetId } from "../content/copy"
import { enabledSections, type SectionId } from "../content/sections"
import { SITE } from "../content/site"
import { recommendUnit } from "../lib/estimate"
import { EASE_OUT_QUART, MOTION_ENABLED } from "../motion/presets"
import {
  EstimatorSection,
  type EstimatorState,
} from "../components/EstimatorSection"
import { FacilitiesSection } from "../components/FacilitiesSection"
import { FaqSection } from "../components/FaqSection"
import { FinalCtaSection } from "../components/FinalCtaSection"
import { HeroSection } from "../components/HeroSection"
import { LandingFooter } from "../components/LandingFooter"
import { LandingHeader } from "../components/LandingHeader"
import { MobileCtaBar } from "../components/MobileCtaBar"
import { PricingSection } from "../components/PricingSection"
import { ProcessSection } from "../components/ProcessSection"
import { TestimonialsSection } from "../components/TestimonialsSection"
import { UseCasesSection } from "../components/UseCasesSection"

const INITIAL_ESTIMATE: EstimatorState = {
  volume: 0,
  climate: false,
  presetId: null,
}

export default function LandingPage() {
  const [estimate, setEstimate] = useState<EstimatorState>(INITIAL_ESTIMATE)
  const rec = recommendUnit(estimate.volume)
  const suggested = rec.kind === "fit" ? rec.unit.size : null

  const applyPreset = (presetId: EstimatorPresetId) => {
    const preset = ESTIMATOR.presets.find((p) => p.id === presetId)
    if (preset)
      setEstimate((s) => ({ ...s, volume: preset.volumeM3, presetId }))
  }

  // Thứ tự và bật/tắt section lấy từ content/sections.ts.
  const renderSection = (id: SectionId): ReactNode => {
    switch (id) {
      case "use-cases":
        return <UseCasesSection onTry={applyPreset} />
      case "estimator":
        return <EstimatorSection state={estimate} onChange={setEstimate} />
      case "pricing":
        return <PricingSection suggested={suggested} />
      case "facilities":
        return <FacilitiesSection />
      case "process":
        return <ProcessSection />
      case "testimonials":
        return <TestimonialsSection />
      case "faq":
        return <FaqSection />
      case "final-cta":
        return <FinalCtaSection />
    }
  }

  return (
    <MotionConfig
      reducedMotion={MOTION_ENABLED ? "user" : "always"}
      transition={{ ease: EASE_OUT_QUART }}
    >
      <title>{SITE.title}</title>
      <meta name="description" content={SITE.description} />
      <div id="top" className="landing min-h-svh bg-background text-foreground">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-(--l-z-sheet) focus:rounded-full focus:bg-background focus:px-4 focus:py-2 focus:ring-3 focus:ring-ring/50"
        >
          Bỏ qua điều hướng
        </a>
        <LandingHeader />
        <main id="main">
          <HeroSection />
          {enabledSections.map((s) => (
            <Fragment key={s.id}>{renderSection(s.id)}</Fragment>
          ))}
        </main>
        <LandingFooter />
        <MobileCtaBar />
      </div>
    </MotionConfig>
  )
}
