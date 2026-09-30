import { TESTIMONIALS_SECTION } from "../content/copy"
import { RevealItem, RevealList } from "./Reveal"
import { SectionHeading } from "./SectionHeading"

export function TestimonialsSection() {
  const { title, items, illustrative, illustrativeNote } = TESTIMONIALS_SECTION

  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-title"
      className="py-(--l-section-space)"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading id="testimonials-title" title={title} />
          {illustrative && (
            <p className="rounded-full bg-(--l-surface-quiet) px-3 py-1 text-sm text-muted-foreground">
              {illustrativeNote}
            </p>
          )}
        </div>

        <RevealList className="grid gap-6 md:grid-cols-3">
          {items.map((t) => (
            <RevealItem key={t.name}>
              <figure className="flex h-full flex-col gap-5 border-t-2 border-(--l-cta)/25 pt-6">
                <blockquote className="text-lg leading-relaxed text-foreground">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-auto">
                  <span className="block font-semibold">{t.name}</span>
                  <span className="text-sm text-muted-foreground">
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
