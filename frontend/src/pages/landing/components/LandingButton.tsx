import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { Phone } from "lucide-react"

import { cn } from "@/lib/utils"

import { isSectionEnabled } from "../content/sections"
import { CTA, HOTLINE } from "../content/site"

type Variant = "primary" | "soft" | "ghost" | "inverse" | "outline-inverse"
type Size = "md" | "lg"

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap outline-none select-none " +
  "transition-[background-color,color,box-shadow,translate] duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] " +
  "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px " +
  "[&_svg]:size-4 [&_svg]:shrink-0"

const variants: Record<Variant, string> = {
  primary: "bg-(--l-cta) text-white hover:bg-(--l-cta-hover)",
  soft: "bg-(--l-soft-bg) text-(--l-soft-fg) hover:bg-[color-mix(in_oklch,var(--l-soft-bg),var(--foreground)_6%)]",
  ghost: "text-foreground hover:bg-(--l-surface-quiet)",
  inverse: "bg-white text-(--l-cta-hover) hover:bg-white/90",
  "outline-inverse":
    "bg-transparent text-white ring-1 ring-white/70 hover:bg-(--l-cta-hover)",
}

const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-12 px-6 text-base",
}

interface CommonProps {
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
}

type LandingLinkProps = CommonProps &
  ({ to: string; href?: never } | { href: string; to?: never }) & {
    onClick?: () => void
  }

/** Nút dạng link của landing: `to` cho route nội bộ, `href` cho anchor hoặc tel:. */
export function LandingLink({
  variant = "primary",
  size = "lg",
  className,
  children,
  ...rest
}: LandingLinkProps) {
  const classes = cn(base, variants[variant], sizes[size], className)
  if (rest.to !== undefined) {
    return (
      <Link to={rest.to} className={classes} onClick={rest.onClick}>
        {children}
      </Link>
    )
  }
  return (
    <a href={rest.href} className={classes} onClick={rest.onClick}>
      {children}
    </a>
  )
}

interface CallLinkProps extends Omit<CommonProps, "children"> {
  label?: string
  /** Hiện số hotline cạnh nhãn (desktop). */
  showNumber?: boolean
}

/**
 * Nút gọi tư vấn. Khi HOTLINE.tel là null (số giả), nút không gọi mà cuộn tới FAQ,
 * để không ai bấm nhầm gọi vào số không thuộc về mình. Nếu FAQ đang tắt thì chỉ hiện số.
 */
export function CallLink({
  variant = "soft",
  size = "lg",
  className,
  label = CTA.call,
  showNumber = false,
}: CallLinkProps) {
  const href = HOTLINE.tel
    ? `tel:${HOTLINE.tel}`
    : isSectionEnabled("faq")
      ? "#faq"
      : null

  if (href === null) {
    return (
      <span
        className={cn(
          base,
          variants[variant],
          sizes[size],
          "pointer-events-none",
          className
        )}
      >
        <Phone aria-hidden />
        <span>{HOTLINE.display}</span>
      </span>
    )
  }

  return (
    <LandingLink
      href={href}
      variant={variant}
      size={size}
      className={className}
    >
      <Phone aria-hidden />
      <span>{label}</span>
      {showNumber && (
        <span className="hidden font-semibold tabular-nums sm:inline">
          {HOTLINE.display}
        </span>
      )}
    </LandingLink>
  )
}
