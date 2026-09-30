import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface SectionHeadingProps {
  id: string
  title: ReactNode
  lead?: string
  badge?: string
  align?: "start" | "center"
  className?: string
}

export function SectionHeading({
  id,
  title,
  lead,
  badge,
  align = "start",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex max-w-[44rem] flex-col gap-3.5",
        align === "center" && "mx-auto items-center text-center",
        className
      )}
    >
      {badge && (
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-blue-500/10 px-3.5 py-1 text-xs font-semibold tracking-wide text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
          {badge}
        </span>
      )}
      <h2
        id={id}
        className="text-[clamp(1.85rem,1.5rem+1.5vw,2.75rem)] leading-[1.18] font-extrabold tracking-[-0.025em] text-foreground"
      >
        {title}
      </h2>
      {lead && (
        <p className="text-base text-muted-foreground sm:text-lg sm:leading-relaxed">
          {lead}
        </p>
      )}
    </div>
  )
}
