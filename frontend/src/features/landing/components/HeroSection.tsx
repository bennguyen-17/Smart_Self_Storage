import { motion } from "motion/react"
import { ArrowRight, Clock3, ShieldCheck, Sparkles, Thermometer } from "lucide-react"

import { HERO, type TrustIcon } from "../content/copy"
import { CTA, ROUTES } from "../content/site"
import {
  MOTION_ENABLED,
  clipReveal,
  heroItem,
  heroStagger,
} from "../motion/presets"
import { LandingLink } from "./LandingButton"

const TRUST_ICONS: Record<TrustIcon, typeof Clock3> = {
  clock: Clock3,
  thermometer: Thermometer,
  shield: ShieldCheck,
}

export function HeroSection() {
  const initial = MOTION_ENABLED ? "hidden" : false

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden pt-2 pb-6 lg:pt-4 lg:pb-10">
      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-8 px-4 pt-2 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:pt-4">
        <motion.div
          className="flex flex-col gap-6 lg:col-span-6"
          variants={heroStagger}
          initial={initial}
          animate="shown"
        >
          {/* Badge nổi bật */}
          <motion.div variants={heroItem} className="w-fit">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-blue-600 shadow-sm backdrop-blur-md dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300">
              <Sparkles className="size-3.5 animate-pulse text-blue-500 dark:text-blue-400" />
              {HERO.badge}
            </span>
          </motion.div>

          <motion.h1
            id="hero-title"
            variants={heroItem}
            className="text-[clamp(2.35rem,1.8rem+2.8vw,4rem)] leading-[1.12] font-black tracking-[-0.03em] text-foreground"
          >
            <span className="l-gradient-title">{HERO.title}</span>
          </motion.h1>

          <motion.p
            variants={heroItem}
            className="max-w-[34rem] text-lg leading-relaxed text-muted-foreground sm:text-xl"
          >
            {HERO.lead}
          </motion.p>

          <motion.div
            variants={heroItem}
            className="flex flex-wrap items-center gap-3.5 pt-2"
          >
            <LandingLink href="#use-cases" size="lg" className="shadow-lg shadow-blue-500/25 cursor-pointer">
              {CTA.explore}
              <ArrowRight aria-hidden className="size-5 transition-transform duration-200 group-hover:translate-x-1" />
            </LandingLink>
          </motion.div>

          <motion.ul
            variants={heroItem}
            className="flex flex-wrap gap-x-6 gap-y-3 pt-4 text-[0.9375rem] font-medium text-foreground/90"
          >
            {HERO.trust.map((t) => {
              const Icon = TRUST_ICONS[t.icon]
              return (
                <li
                  key={t.label}
                  className="flex items-center gap-2.5 rounded-full bg-muted/60 px-3.5 py-1.5 ring-1 ring-border/50 backdrop-blur-sm dark:bg-card/50"
                >
                  <Icon className="size-4.5 text-blue-500 dark:text-blue-400" aria-hidden />
                  <span>{t.label}</span>
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
            className="group relative overflow-hidden rounded-(--l-radius-panel) p-2 shadow-2xl ring-1 ring-border/60 backdrop-blur-md transition-transform duration-500 hover:scale-[1.01]"
          >
            <div className="overflow-hidden rounded-[calc(var(--l-radius-panel)-8px)]">
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
                className="aspect-[3/2] w-full bg-(--l-surface) object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </motion.div>
          <figcaption className="mt-2 text-right text-xs text-muted-foreground/80">
            {HERO.image.credit}
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
