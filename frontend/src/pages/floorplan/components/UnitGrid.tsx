import { Fragment } from "react"
import { SnowflakeIcon } from "lucide-react"
import { cn } from "cn"

import { formatDateTime } from "@/lib/format"

import type { UnitDetailResponse, UnitSize } from "../types"
import {
  SIZE_AREA_M2,
  STATUS_STYLES,
  UNIT_SIZES,
  statusGroupOf,
  unitAreaOf,
  unitSizeOf,
} from "../unitDisplay"

// Ô lớn hơn cho size lớn hơn để sơ đồ trực quan
const CELL_SIZE: Record<UnitSize, string> = {
  S: "w-24 min-h-16",
  M: "w-28 min-h-20",
  L: "w-32 min-h-24",
  XL: "w-40 min-h-28",
}

interface UnitGridProps {
  units: UnitDetailResponse[]
  onSelect: (unit: UnitDetailResponse) => void
}

/** Lưới 2D: mỗi size là một dãy kho, các dãy ngăn cách bởi hành lang */
function UnitGrid({ units, onSelect }: UnitGridProps) {
  const rows = [...UNIT_SIZES]
    .reverse()
    .map((size) => ({
      size,
      units: units.filter((u) => unitSizeOf(u) === size),
    }))
    .filter((row) => row.units.length > 0)

  return (
    <div className="floor-blueprint-container space-y-4 p-4 sm:p-5">
      {rows.map((row, i) => (
        <Fragment key={row.size}>
          {i > 0 && (
            <div className="floor-corridor-strip" aria-hidden="true">
              Hành lang lối đi nội bộ
            </div>
          )}
          <section aria-label={`Dãy kho Size ${row.size}`}>
            <h3 className="mb-2 text-xs font-bold text-muted-foreground">
              Dãy kho Size {row.size} · {SIZE_AREA_M2[row.size]} m² ·{" "}
              {row.units.length} ô
            </h3>
            <ul className="flex flex-wrap gap-2">
              {row.units.map((unit) => (
                <li key={unit.unitId}>
                  <UnitCell unit={unit} size={row.size} onSelect={onSelect} />
                </li>
              ))}
            </ul>
          </section>
        </Fragment>
      ))}
    </div>
  )
}

interface UnitCellProps {
  unit: UnitDetailResponse
  size: UnitSize
  onSelect: (unit: UnitDetailResponse) => void
}

function UnitCell({ unit, size, onSelect }: UnitCellProps) {
  const group = statusGroupOf(unit.status)
  const style = STATUS_STYLES[group]
  const area = unitAreaOf(unit)
  const holdHint =
    group === "HOLD" && unit.holdExpiresAt
      ? ` · giữ đến ${formatDateTime(unit.holdExpiresAt).slice(-5)}`
      : ""
  const label = `Ô ${unit.unitCode}, ${area ?? "?"} m², ${style.label}${unit.isClimate ? ", kho điều hòa" : ""}${holdHint}`

  const content = (
    <>
      <span className="font-mono text-xs font-bold">{unit.unitCode}</span>
      <span className="text-xs">{area != null ? `${area} m²` : "—"}</span>
      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase opacity-80">
        {unit.isClimate && (
          <SnowflakeIcon aria-hidden="true" className="size-3" />
        )}
        {style.label}
      </span>
    </>
  )
  const className = cn(
    "flex flex-col items-start justify-between gap-0.5 rounded-lg border-2 p-2 text-left transition-colors",
    CELL_SIZE[size],
    style.cell
  )

  if (group === "AVAILABLE") {
    return (
      <button
        type="button"
        onClick={() => onSelect(unit)}
        aria-label={`${label}. Bấm để xem chi tiết`}
        className={cn(
          className,
          "cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        )}
      >
        {content}
      </button>
    )
  }

  return (
    <div
      role="img"
      aria-label={label}
      title={label}
      className={cn(className, "cursor-not-allowed")}
    >
      {content}
    </div>
  )
}

export default UnitGrid
