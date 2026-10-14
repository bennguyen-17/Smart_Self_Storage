import { BanIcon, CircleCheckIcon, ClockIcon, UserXIcon } from "lucide-react"
import { cn } from "cn"

import type { Reservation } from "../types"

type BadgeInput = Pick<Reservation, "status" | "cancelReason"> & {
  refundStatus?: Reservation["refundStatus"]
}

function getBadge({ status, cancelReason, refundStatus }: BadgeInput) {
  if (status === "CANCELED" && cancelReason === "NO_SHOW") {
    return {
      label: "HỦY CỌC (QUÁ HẠN CHECK-IN)",
      Icon: BanIcon,
      className:
        "border-rose-300 bg-slate-100 text-rose-700 dark:border-rose-800 dark:bg-slate-800 dark:text-rose-300",
    }
  }
  if (status === "CANCELED") {
    if (refundStatus === "REFUNDED") {
      return {
        label: "KHÁCH HỦY • ĐÃ HOÀN TIỀN (REFUNDED)",
        Icon: CircleCheckIcon,
        className:
          "border-emerald-400 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
      }
    }
    if (refundStatus === "PENDING") {
      return {
        label: "KHÁCH HỦY • CHỜ HOÀN TIỀN (PENDING)",
        Icon: ClockIcon,
        className:
          "border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/70 dark:text-amber-300",
      }
    }
    return {
      label: "KHÁCH TỰ HỦY",
      Icon: UserXIcon,
      className:
        "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
    }
  }
  if (status === "ACTIVE") {
    return {
      label: "ĐÃ NHẬN KHO",
      Icon: CircleCheckIcon,
      className:
        "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    }
  }
  return {
    label: "CHỜ NHẬN KHO",
    Icon: ClockIcon,
    className:
      "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  }
}

function ReservationStatusBadge(props: BadgeInput) {
  const { label, Icon, className } = getBadge(props)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold tracking-wide whitespace-nowrap",
        className
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {label}
    </span>
  )
}

export default ReservationStatusBadge
