import { cn } from "@/lib/utils"

interface SectionHeadingProps {
  id: string
  title: string
  lead?: string
  align?: "start" | "center"
  className?: string
}

export function SectionHeading({
  id,
  title,
  lead,
  align = "start",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex max-w-[40rem] flex-col gap-3",
        align === "center" && "mx-auto items-center text-center",
        className
      )}
    >
      <h2
        id={id}
        className="text-[clamp(1.75rem,1.4rem+1.4vw,2.5rem)] leading-[1.2] font-bold tracking-[-0.02em] text-foreground"
      >
        {title}
      </h2>
      {lead && <p className="text-muted-foreground">{lead}</p>}
    </div>
  )
}
