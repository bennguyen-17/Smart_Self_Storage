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
        "flex max-w-[39rem] flex-col gap-2.5",
        align === "center" && "mx-auto items-center text-center",
        className
      )}
    >
      {badge && (
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
          {badge}
        </span>
      )}
      <h2
        id={id}
        className="text-[clamp(1.65rem,1.35rem+1.3vw,2.35rem)] leading-[1.18] font-extrabold tracking-[-0.025em] text-foreground"
      >
        {title}
      </h2>
      {lead && (
        <p className="text-sm text-muted-foreground sm:text-base sm:leading-relaxed">
          {lead}
        </p>
      )}
    </div>
  )
}
