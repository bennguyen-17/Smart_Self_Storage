import { motion } from "motion/react"
import { ArrowRight, Clock3, ShieldCheck, Sparkles } from "lucide-react"

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
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 text-[0.9375rem] font-medium text-foreground/90 max-w-xl"
          >
            {HERO.trust.map((t) => {
              const Icon = TRUST_ICONS[t.icon]
              return (
                <li
                  key={t.label}
                  className="flex items-center gap-2.5 rounded-xl bg-muted/60 px-4 py-2 ring-1 ring-border/50 backdrop-blur-sm dark:bg-card/50 shadow-sm"
                >
                  <Icon className="size-5 text-blue-500 dark:text-blue-400 shrink-0" aria-hidden />
                  <span className="leading-tight">{t.label}</span>
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
            className="group relative overflow-hidden rounded-(--l-radius-panel) p-2 shadow-2xl ring-1 ring-border/60 transition-transform duration-500 hover:scale-[1.01]"
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
        </figure>
      </div>
    </section>
  )
}
