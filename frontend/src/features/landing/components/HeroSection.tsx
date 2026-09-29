import { motion } from "motion/react"
import { ArrowRight, Clock3, ShieldCheck, Thermometer } from "lucide-react"

import { HERO, type TrustIcon } from "../content/copy"
import { CTA, ROUTES } from "../content/site"
import {
  MOTION_ENABLED,
  clipReveal,
  heroItem,
  heroStagger,
} from "../motion/presets"
import { CallLink, LandingLink } from "./LandingButton"

const TRUST_ICONS: Record<TrustIcon, typeof Clock3> = {
  clock: Clock3,
  thermometer: Thermometer,
  shield: ShieldCheck,
}

export function HeroSection() {
  const initial = MOTION_ENABLED ? "hidden" : false

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 pt-10 pb-16 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-8 lg:pt-16 lg:pb-24">
        <motion.div
          className="flex flex-col gap-7 lg:col-span-6"
          variants={heroStagger}
          initial={initial}
          animate="shown"
        >
          <motion.h1
            id="hero-title"
            variants={heroItem}
            className="max-w-[14ch] text-[clamp(2.25rem,1.6rem+2.6vw,3.75rem)] leading-[1.1] font-bold tracking-[-0.025em] text-foreground"
          >
            {HERO.title}
          </motion.h1>

          <motion.p
            variants={heroItem}
            className="max-w-[34rem] text-lg text-muted-foreground"
          >
            {HERO.lead}
          </motion.p>

          <motion.div
            variants={heroItem}
            className="flex flex-wrap items-center gap-3"
          >
            <LandingLink to={ROUTES.book}>
              {CTA.book}
              <ArrowRight aria-hidden />
            </LandingLink>
            <CallLink showNumber />
          </motion.div>

          <motion.ul
            variants={heroItem}
            className="flex flex-wrap gap-x-6 gap-y-3 pt-2 text-[0.9375rem] text-foreground/85"
          >
            {HERO.trust.map((t) => {
              const Icon = TRUST_ICONS[t.icon]
              return (
                <li key={t.label} className="flex items-center gap-2">
                  <Icon className="size-4.5 text-(--l-link)" aria-hidden />
                  {t.label}
                </li>
              )
            })}
          </motion.ul>
        </motion.div>

        <figure className="relative lg:col-span-6">
          <motion.div
            variants={clipReveal}
            initial={initial}
            animate="shown"
            className="overflow-hidden rounded-(--l-radius-panel)"
          >
            <img
              src={HERO.image.src}
              srcSet={HERO.image.srcSet}
              sizes="(min-width: 1024px) 50vw, 100vw"
              width={HERO.image.width}
              height={HERO.image.height}
              alt={HERO.image.alt}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="aspect-[3/2] w-full bg-(--l-surface) object-cover"
            />
          </motion.div>
          <figcaption className="mt-2 text-right text-xs text-muted-foreground">
            {HERO.image.credit}
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
