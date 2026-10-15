import { motion } from "motion/react"
import { ArrowRight } from "lucide-react"

import { HERO } from "../content/copy"
import { CTA } from "../content/site"
import {
  MOTION_ENABLED,
  clipReveal,
  heroItem,
  heroStagger,
} from "../motion/presets"

export function HeroSection() {
  const initial = MOTION_ENABLED ? "hidden" : false

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden pt-4 pb-8 lg:pt-8 lg:pb-14">
      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-14 lg:px-8">
        <motion.div
          className="flex flex-col gap-7 lg:col-span-6"
          variants={heroStagger}
          initial={initial}
          animate="shown"
        >
          <motion.h1
            id="hero-title"
            variants={heroItem}
            className="text-[clamp(2.75rem,2.1rem+3.2vw,4.85rem)] leading-[1.08] font-black tracking-[-0.035em] text-foreground"
          >
            <span className="l-gradient-title">{HERO.title}</span>
          </motion.h1>

          <motion.p
            variants={heroItem}
            className="max-w-[34rem] text-base leading-relaxed text-muted-foreground sm:text-lg sm:leading-relaxed font-normal"
          >
            {HERO.lead}
          </motion.p>

          <motion.div
            variants={heroItem}
            className="flex flex-wrap items-center gap-4 pt-2"
          >
            <a
              href="#use-cases"
              className="group l-hero-cta-btn inline-flex h-14 sm:h-16 items-center justify-center gap-3 rounded-full px-8 sm:px-10 text-lg sm:text-xl font-black text-white shadow-2xl transition-all duration-300 cursor-pointer"
            >
              <span className="l-hero-cta-text">{CTA.explore}</span>
              <ArrowRight
                aria-hidden
                className="size-5 sm:size-6 text-white transition-transform duration-300 group-hover:translate-x-1.5"
              />
            </a>
          </motion.div>
        </motion.div>

        <figure className="relative lg:col-span-6">
          <motion.div
            variants={clipReveal}
            initial={initial}
            animate="shown"
            className="group relative overflow-hidden rounded-[2.25rem] p-2.5 shadow-2xl ring-1 ring-border/60 transition-transform duration-500 hover:scale-[1.01]"
          >
            <div className="overflow-hidden rounded-[calc(2.25rem-10px)]">
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
                className="aspect-[4/3] w-full min-h-[380px] sm:min-h-[440px] lg:min-h-[520px] bg-(--l-surface) object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </motion.div>
        </figure>
      </div>
    </section>
  )
}
