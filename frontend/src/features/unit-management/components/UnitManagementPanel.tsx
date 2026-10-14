import { useMemo, useState } from "react"
import { InboxIcon, PencilIcon, RotateCwIcon, SnowflakeIcon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { shortFloorName, unitSizeOf, UNIT_SIZES } from "@/features/floor-plan/unitDisplay"
import { useAsyncData } from "@/hooks/useAsyncData"
import { formatVnd } from "@/lib/format"
import type { StorageCondition } from "@/types"

import { getManagerFloors, getManagerUnits } from "../api/unitManagementApi"
import { getManagerContext } from "../managerContext"
import type { ManagerUnit, PhysicalUnitStatus } from "../types"
import { normalizeUnitStatus, UNIT_STATUS_META } from "../unitRules"
import UnitEditSheet from "./UnitEditSheet"

const STATUS_ORDER: PhysicalUnitStatus[] = ["AVAILABLE", "HOLD", "RESERVED", "OCCUPIED", "UNDER_MAINTENANCE"]

/**
 * US-13: Facility Manager xem ô kho của cơ sở mình (bộ lọc + bảng) và bấm "Sửa" để đổi loại kho
 * hoặc đưa ô vào bảo trì trong ngăn chỉnh sửa bên phải.
 */
function UnitManagementPanel() {
  const ctx = useMemo(() => getManagerContext(), [])
  const [floorId, setFloorId] = useState<number | "ALL">("ALL")
  const [condition, setCondition] = useState<StorageCondition | "ALL">("ALL")
  const [size, setSize] = useState<string>("ALL")
  const [status, setStatus] = useState<PhysicalUnitStatus | "ALL">("ALL")
  const [reloadCount, setReloadCount] = useState(0)
  const [editing, setEditing] = useState<ManagerUnit | null>(null)

  const floors = useAsyncData(`floors#${reloadCount}`, () => getManagerFloors(ctx))
  const units = useAsyncData(`units:${floorId}:${condition}#${reloadCount}`, () =>
    getManagerUnits(ctx, {
      floorId: floorId === "ALL" ? undefined : floorId,
      storageCondition: condition === "ALL" ? undefined : condition,
    })
  )

  // Size và trạng thái lọc ở FE: BE chưa lọc theo size, và cần đếm số ô theo từng trạng thái
  const bySize = (units.data ?? []).filter((u) => size === "ALL" || unitSizeOf(u) === size)
  const counts = STATUS_ORDER.reduce<Record<string, number>>((acc, s) => {
    acc[s] = bySize.filter((u) => normalizeUnitStatus(u.status) === s).length
    return acc
  }, {})
  const rows = bySize.filter((u) => status === "ALL" || normalizeUnitStatus(u.status) === status)
  const floorName = (id: number) =>
    shortFloorName(floors.data?.find((f) => f.floorId === id)?.floorName ?? `Tầng ${id}`)

  function handleSaved(message: string | null) {
    if (message) {
      toast.success(message)
      setEditing(null)
    }
    setReloadCount((n) => n + 1)
  }

  const error = floors.error ?? units.error

  return (
    <section aria-label="Danh sách ô kho của cơ sở" className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Không tải được danh sách ô kho</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            {error}
            {ctx.facilityId !== null && (
              <Button variant="outline" size="sm" onClick={() => setReloadCount((n) => n + 1)}>
                <RotateCwIcon aria-hidden="true" /> Thử lại
              </Button>
            )}
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Bộ lọc */}
          <div className="card-box flex flex-wrap items-end gap-3 rounded-2xl border p-4 shadow-sm">
            <FilterSelect
              label="Tầng"
              value={String(floorId)}
              onChange={(v) => setFloorId(v === "ALL" ? "ALL" : Number(v))}
              options={[
                { value: "ALL", label: "Tất cả tầng" },
                ...(floors.data ?? []).map((f) => ({ value: String(f.floorId), label: shortFloorName(f.floorName) })),
              ]}
            />
            <FilterSelect
              label="Loại kho"
              value={condition}
              onChange={(v) => setCondition(v as StorageCondition | "ALL")}
              options={[
                { value: "ALL", label: "Tất cả" },
                { value: "NORMAL", label: "Kho thường" },
                { value: "CLIMATE_CONTROLLED", label: "Kho điều hòa" },
              ]}
            />
            <FilterSelect
              label="Kích thước"
              value={size}
              onChange={setSize}
              options={[{ value: "ALL", label: "Tất cả size" }, ...UNIT_SIZES.map((s) => ({ value: s, label: `Size ${s}` }))]}
            />
          </div>

          {/* Đếm theo trạng thái, bấm để lọc */}
          <div role="group" aria-label="Lọc theo trạng thái ô kho" className="flex flex-wrap gap-2">
            <StatusChip active={status === "ALL"} onClick={() => setStatus("ALL")} label={`Tất cả (${bySize.length})`} />
            {STATUS_ORDER.map((s) => (
              <StatusChip
                key={s}
                active={status === s}
                onClick={() => setStatus(s)}
                label={`${UNIT_STATUS_META[s].label} (${counts[s] ?? 0})`}
              />
            ))}
          </div>

          <div className="card-box relative overflow-x-auto rounded-2xl border shadow-sm">
            <table className="w-full min-w-[820px] text-left text-xs">
              <caption className="sr-only">Danh sách ô kho của cơ sở</caption>
              <thead className="text-muted border-b text-[11px] uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-bold">Mã ô</th>
                  <th scope="col" className="px-4 py-3 font-bold">Tầng</th>
                  <th scope="col" className="px-4 py-3 font-bold">Loại kho</th>
                  <th scope="col" className="px-4 py-3 text-right font-bold">Giá ngày / tháng</th>
                  <th scope="col" className="px-4 py-3 font-bold">Trạng thái</th>
                  <th scope="col" className="px-4 py-3 text-right font-bold"><span className="sr-only">Thao tác</span></th>
                </tr>
              </thead>
              <tbody aria-busy={units.isLoading}>
                {units.isLoading &&
                  Array.from({ length: 5 }, (_, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                      </td>
                    </tr>
                  ))}
                {!units.isLoading && rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center">
                      <InboxIcon aria-hidden="true" className="text-muted mx-auto mb-2 size-7" />
                      <p className="text-title font-semibold">Không có ô kho phù hợp bộ lọc</p>
                    </td>
                  </tr>
                )}
                {!units.isLoading &&
                  rows.map((u) => (
                    <UnitRow
                      key={u.unitCode}
                      unit={u}
                      floorLabel={floorName(u.floorId)}
                      onEdit={() => setEditing(u)}
                    />
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editing && (
        <UnitEditSheet
          key={editing.unitCode}
          unit={editing}
          floorLabel={floorName(editing.floorId)}
          ctx={ctx}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </section>
  )
}

function UnitRow({ unit, floorLabel, onEdit }: { unit: ManagerUnit; floorLabel: string; onEdit: () => void }) {
  const st = normalizeUnitStatus(unit.status)
  const meta = st ? UNIT_STATUS_META[st] : null

  return (
    <tr className="border-b transition-colors last:border-0 hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
      <td className="text-title px-4 py-3 font-mono font-bold whitespace-nowrap">{unit.unitCode}</td>
      <td className="px-4 py-3 whitespace-nowrap">{floorLabel}</td>
      <td className="px-4 py-3">
        <span className="flex items-center gap-1.5">
          {unit.isClimate && <SnowflakeIcon aria-label="Kho điều hòa" className="size-3.5 text-cyan-500" />}
          {unit.typeName ?? "—"}
        </span>
      </td>
      <td className="px-4 py-3 text-right whitespace-nowrap">
        {formatVnd(unit.dailyPrice)} / {formatVnd(unit.monthlyPrice)}
      </td>
      <td className="px-4 py-3">
        <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold whitespace-nowrap", meta?.className)}>
          {meta?.label ?? unit.status}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <Button variant="outline" size="sm" onClick={onEdit} aria-label={`Sửa ô ${unit.unitCode}`}>
          <PencilIcon aria-hidden="true" />
          Sửa
        </Button>
      </td>
    </tr>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-bold">
      <span className="text-title">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="inner-box text-title min-w-36 cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-purple-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function StatusChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-full border px-3 py-1 text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none",
        active ? "border-transparent bg-purple-600 text-white shadow" : "inner-box text-title hover:border-purple-400"
      )}
    >
      {label}
    </button>
  )
}

export default UnitManagementPanel
