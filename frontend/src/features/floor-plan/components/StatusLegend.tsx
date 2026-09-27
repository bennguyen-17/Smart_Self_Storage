import { cn } from "cn"

import type { StatusGroup, UnitDetailResponse } from "../types"
import { STATUS_STYLES, statusGroupOf } from "../unitDisplay"

const ORDER: StatusGroup[] = ["AVAILABLE", "HOLD", "TAKEN", "MAINTENANCE"]

/** Chú thích 4 màu trạng thái, kèm số ô mỗi loại trên tầng đang xem */
function StatusLegend({ units }: { units: UnitDetailResponse[] }) {
  const counts = units.reduce<Record<string, number>>((acc, u) => {
    const group = statusGroupOf(u.status)
    acc[group] = (acc[group] ?? 0) + 1
    return acc
  }, {})

  return (
    <ul
      aria-label="Chú thích trạng thái ô kho"
      className="flex flex-wrap gap-x-5 gap-y-2 text-sm"
    >
      {ORDER.map((group) => (
        <li key={group} className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={cn(
              "size-4 rounded border-2",
              STATUS_STYLES[group].swatch
            )}
          />
          {STATUS_STYLES[group].label}
          <span className="text-muted-foreground">({counts[group] ?? 0})</span>
        </li>
      ))}
    </ul>
  )
}

export default StatusLegend
