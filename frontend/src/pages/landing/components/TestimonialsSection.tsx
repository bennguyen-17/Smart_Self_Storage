import { Star } from "lucide-react"

import { TESTIMONIALS_SECTION } from "../content/copy"
import { RevealItem, RevealList } from "./Reveal"
import { SectionHeading } from "./SectionHeading"

export function TestimonialsSection() {
  const { title, items, illustrative, illustrativeNote, badge } = TESTIMONIALS_SECTION

  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-title"
      className="relative overflow-hidden py-(--l-section-space)"
    >
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            id="testimonials-title"
            badge={badge}
            title={title}
          />
          {illustrative && (
            <p className="rounded-full bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border/50">
              {illustrativeNote}
            </p>
          )}
        </div>

        <RevealList className="grid gap-6 md:grid-cols-3">
          {items.map((t) => (
            <RevealItem key={t.name}>
              <figure className="flex h-full flex-col gap-4 rounded-2xl l-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
                <div className="flex gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <blockquote className="text-[1.0625rem] leading-relaxed text-foreground/90">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-auto border-t border-border/60 pt-4">
                  <span className="block font-bold text-foreground">{t.name}</span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {t.context}
                  </span>
                </figcaption>
              </figure>
            </RevealItem>
          ))}
        </RevealList>
      </div>
    </section>
  )
}
