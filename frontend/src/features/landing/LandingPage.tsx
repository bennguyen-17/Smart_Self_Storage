import { Fragment, useState, type ReactNode } from "react"
import { MotionConfig } from "motion/react"

import "@/features/landing/landing.css"
import { type CityId } from "@/features/landing/content/facilities"
import { enabledSections, type SectionId } from "@/features/landing/content/sections"
import { SITE } from "@/features/landing/content/site"
import { recommendUnit } from "@/features/landing/lib/estimate"
import { EASE_OUT_QUART, MOTION_ENABLED } from "@/features/landing/motion/presets"
import {
  EstimatorSection,
  type EstimatorState,
} from "@/features/landing/components/EstimatorSection"
import { FacilitiesSection } from "@/features/landing/components/FacilitiesSection"
import { FaqSection } from "@/features/landing/components/FaqSection"
import { FinalCtaSection } from "@/features/landing/components/FinalCtaSection"
import { HeroSection } from "@/features/landing/components/HeroSection"
import { LandingFooter } from "@/features/landing/components/LandingFooter"
import { LandingHeader } from "@/features/landing/components/LandingHeader"
import { MobileCtaBar } from "@/features/landing/components/MobileCtaBar"
import { PricingSection } from "@/features/landing/components/PricingSection"
import { ProcessSection } from "@/features/landing/components/ProcessSection"
import { TestimonialsSection } from "@/features/landing/components/TestimonialsSection"
import { UseCasesSection } from "@/features/landing/components/UseCasesSection"

const INITIAL_ESTIMATE: EstimatorState = {
  volume: 0,
  climate: false,
  presetId: null,
}

export default function LandingPage() {
  const [estimate, setEstimate] = useState<EstimatorState>(INITIAL_ESTIMATE)
  const [selectedCity, setSelectedCity] = useState<CityId>("HN")
  const rec = recommendUnit(estimate.volume)
  const suggested = rec.kind === "fit" ? rec.unit.size : null

  // Thứ tự và bật/tắt section lấy từ content/sections.ts.
  const renderSection = (id: SectionId): ReactNode => {
    switch (id) {
      case "use-cases":
        return <UseCasesSection />
      case "estimator":
        return <EstimatorSection state={estimate} onChange={setEstimate} />
      case "pricing":
        return <PricingSection suggested={suggested} />
      case "facilities":
        return (
          <FacilitiesSection
            selectedCity={selectedCity}
            onCityChange={setSelectedCity}
          />
        )
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
      <div id="top" className="landing relative min-h-svh bg-background text-foreground">
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
        <LandingFooter onSelectCity={setSelectedCity} />
        <MobileCtaBar />
      </div>
    </MotionConfig>
  )
}
