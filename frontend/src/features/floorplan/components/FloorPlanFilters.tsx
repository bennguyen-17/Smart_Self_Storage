import type { ReactNode } from "react"
import { cn } from "cn"

import type { ClimateFilter, Facility, Floor, SizeFilter } from "../types"
import { SIZE_AREA_M2, UNIT_SIZES, shortFloorName } from "../unitDisplay"

const CLIMATE_OPTIONS: { value: ClimateFilter; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "NORMAL", label: "Kho thường" },
  { value: "CLIMATE_CONTROLLED", label: "Kho điều hòa" },
]

interface FloorPlanFiltersProps {
  facilities: Facility[]
  facilityId: number | null
  onFacilityChange: (facilityId: number) => void
  floors: Floor[] | undefined
  floorId: number | null
  onFloorChange: (floorId: number) => void
  size: SizeFilter
  onSizeChange: (size: SizeFilter) => void
  climate: ClimateFilter
  onClimateChange: (climate: ClimateFilter) => void
}

function FloorPlanFilters(props: FloorPlanFiltersProps) {
  const { facilities, facilityId, floors, floorId, size, climate } = props

  return (
    <section
      aria-label="Bộ lọc sơ đồ kho"
      className="grid gap-4 rounded-xl border bg-card p-4 lg:grid-cols-2"
    >
      <div className="space-y-1.5">
        <label htmlFor="facility-select" className="text-sm font-semibold">
          Cơ sở
        </label>
        <select
          id="facility-select"
          value={facilityId ?? ""}
          onChange={(e) => props.onFacilityChange(Number(e.target.value))}
          className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {facilities.map((f) => (
            <option key={f.facilityId} value={f.facilityId}>
              {f.facilityName}
            </option>
          ))}
        </select>
      </div>

      <FilterGroup label="Tầng">
        {floors === undefined ? (
          <span className="text-sm text-muted-foreground">Đang tải tầng…</span>
        ) : (
          floors.map((fl) => (
            <Chip
              key={fl.floorId}
              active={fl.floorId === floorId}
              onClick={() => props.onFloorChange(fl.floorId)}
              title={fl.floorName}
            >
              {shortFloorName(fl.floorName)}
            </Chip>
          ))
        )}
      </FilterGroup>

      <FilterGroup label="Kích thước">
        <Chip active={size === "ALL"} onClick={() => props.onSizeChange("ALL")}>
          Tất cả
        </Chip>
        {UNIT_SIZES.map((s) => (
          <Chip
            key={s}
            active={size === s}
            onClick={() => props.onSizeChange(s)}
          >
            Size {s} · {SIZE_AREA_M2[s]} m²
          </Chip>
        ))}
      </FilterGroup>

      <FilterGroup label="Loại kho">
        {CLIMATE_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            active={climate === opt.value}
            onClick={() => props.onClimateChange(opt.value)}
          >
            {opt.label}
          </Chip>
        ))}
      </FilterGroup>
    </section>
  )
}

function FilterGroup({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div role="group" aria-label={label} className="space-y-1.5">
      <p className="text-sm font-semibold">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

interface ChipProps {
  active: boolean
  onClick: () => void
  title?: string
  children: ReactNode
}

function Chip({ active, onClick, title, children }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      title={title}
      className={cn(
        "rounded-full border px-3 py-1 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-background hover:bg-muted"
      )}
    >
      {children}
    </button>
  )
}

export default FloorPlanFilters
