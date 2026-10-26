import { useMemo, useState } from "react"
import { InboxIcon, PencilIcon, RotateCwIcon, SnowflakeIcon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/internal/components/PanelKit"
import { usePagedRows } from "@/components/internal/usePagedRows"
import { shortFloorName, unitSizeOf, UNIT_SIZES } from "@/features/floorplan/unitDisplay"
import { useAsyncData } from "@/hooks/useAsyncData"
import type { StorageCondition } from "@/types"

import { getManagerFloors, getManagerUnits } from "../api/unitManagementApi"
import { getManagerContext } from "@/features/manager/managerContext"
import type { ManagerUnit, PhysicalUnitStatus } from "../types"
import { normalizeUnitStatus, UNIT_STATUS_META, unitPrice } from "../unitRules"
import { formatVnd } from "@/lib/format"
import UnitEditSheet from "./UnitEditSheet"

const STATUS_ORDER: PhysicalUnitStatus[] = ["AVAILABLE", "HOLD", "RESERVED", "OCCUPIED", "UNDER_MAINTENANCE"]


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
  const { slice, pagination } = usePagedRows(rows, `${floorId}|${condition}|${size}|${status}`)
  const floorName = (id: number) =>
    shortFloorName(floors.data?.find((f) => f.floorId === id)?.floorName ?? `Tầng ${id}`)

  const isFiltered = floorId !== "ALL" || condition !== "ALL" || size !== "ALL" || status !== "ALL"

  function handleResetFilters() {
    setFloorId("ALL")
    setCondition("ALL")
    setSize("ALL")
    setStatus("ALL")
  }

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
          {/* Cụm bộ lọc 1 hàng ngang duy nhất */}
          <div className="card-box flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white/90 p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900/80">
            {/* Vế trái: Dàn chip lọc theo trạng thái */}
            <div role="group" aria-label="Lọc theo trạng thái ô kho" className="flex flex-wrap items-center gap-2">
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

            {/* Vế phải: 3 dropdown lọc nhanh + nút đặt lại */}
            <div className="flex flex-wrap items-center gap-2.5">
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
                label="Loại"
                value={condition}
                onChange={(v) => setCondition(v as StorageCondition | "ALL")}
                options={[
                  { value: "ALL", label: "Tất cả loại" },
                  { value: "NORMAL", label: "Kho thường" },
                  { value: "CLIMATE_CONTROLLED", label: "Kho điều hòa" },
                ]}
              />
              <FilterSelect
                label="Size"
                value={size}
                onChange={setSize}
                options={[{ value: "ALL", label: "Tất cả size" }, ...UNIT_SIZES.map((s) => ({ value: s, label: `Size ${s}` }))]}
              />
              {isFiltered && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  title="Đặt lại tất cả bộ lọc về mặc định"
                >
                  Đặt lại
                </button>
              )}
            </div>
          </div>

          <div className="card-box relative overflow-x-auto rounded-2xl border border-slate-200/80 shadow-sm dark:border-slate-800">
            <table className="w-full text-center text-xs">
              <caption className="sr-only">Danh sách ô kho của cơ sở</caption>
              <thead className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
                <tr>
                  <th scope="col" className="w-[13%] px-4 py-3 text-center font-bold">Mã ô</th>
                  <th scope="col" className="w-[13%] px-4 py-3 text-center font-bold">Vị trí tầng</th>
                  <th scope="col" className="w-[12%] px-4 py-3 text-center font-bold">Kích thước</th>
                  <th scope="col" className="w-[14%] px-4 py-3 text-center font-bold">Loại kho</th>
                  <th scope="col" className="w-[18%] px-4 py-3 text-center font-bold">Giá thuê</th>
                  <th scope="col" className="w-[16%] px-4 py-3 text-center font-bold">Trạng thái</th>
                  <th scope="col" className="w-[14%] px-4 py-3 text-center font-bold">Thao tác</th>
                </tr>
              </thead>
              <tbody aria-busy={units.isLoading} className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {units.isLoading &&
                  Array.from({ length: 5 }, (_, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td colSpan={7} className="px-4 py-3.5 text-center">
                        <div className="mx-auto h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                      </td>
                    </tr>
                  ))}
                {!units.isLoading && rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <InboxIcon aria-hidden="true" className="mx-auto mb-2 size-8 text-slate-400 dark:text-slate-500" />
                      <p className="font-semibold text-slate-600 dark:text-slate-400">Không có ô kho phù hợp bộ lọc</p>
                    </td>
                  </tr>
                )}
                {!units.isLoading &&
                  slice.rows.map((u) => (
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

          {!units.isLoading && <Pagination {...pagination} unit="ô kho" />}
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
  const size = unitSizeOf(unit)
  const cleanTypeName = (unit.typeName ?? "")
    .replace(/\s*-\s*climate\b/i, "")
    .replace(/\s*\([^)]*\)/g, "")
    .trim()
  const sizeLabel = size ? `Size ${size}` : cleanTypeName
  const price = unitPrice(unit)

  return (
    <tr className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
      {/* Cột 1: Mã ô */}
      <td className="px-4 py-3.5 align-middle text-center whitespace-nowrap">
        <span className="block font-mono text-sm font-bold tracking-tight text-slate-900 dark:text-white">
          {unit.unitCode}
        </span>
      </td>

      {/* Cột 2: Vị trí tầng */}
      <td className="px-4 py-3.5 align-middle text-center whitespace-nowrap">
        <div className="text-sm font-normal text-slate-700 dark:text-slate-300">
          {floorLabel}
        </div>
      </td>

      {/* Cột 3: Kích thước */}
      <td className="px-4 py-3.5 align-middle text-center whitespace-nowrap">
        <span className="text-sm font-normal text-slate-700 dark:text-slate-300">
          {sizeLabel}
        </span>
      </td>

      {/* Cột 4: Loại kho */}
      <td className="px-4 py-3.5 align-middle text-center whitespace-nowrap">
        <div className="flex items-center justify-center">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-sm font-normal",
              unit.isClimate ? "text-cyan-600 dark:text-cyan-400" : "text-slate-700 dark:text-slate-300"
            )}
          >
            {unit.isClimate && <SnowflakeIcon aria-label="Kho điều hòa" className="size-4 text-cyan-500 shrink-0" />}
            <span>{unit.isClimate ? "Kho điều hòa" : "Kho thường"}</span>
          </span>
        </div>
      </td>

      {/* Cột 5: Giá thuê (chỉ xem; giá do BOM đặt theo loại kho, đã gồm phụ phí kho điều hòa) */}
      <td className="px-4 py-3.5 align-middle text-center whitespace-nowrap">
        {price ? (
          <div className="text-sm">
            <p className="font-semibold text-slate-900 tabular-nums dark:text-white">{formatVnd(price.monthly)}/tháng</p>
            <p className="text-[11px] text-slate-500 tabular-nums dark:text-slate-400">
              {formatVnd(price.daily)}/ngày
              {price.deposit !== null && ` · cọc ${formatVnd(price.deposit)}`}
            </p>
            {price.surchargePercent > 0 && (
              <p className="text-[11px] text-cyan-700 dark:text-cyan-400">Đã gồm +{price.surchargePercent}% kho điều hòa</p>
            )}
          </div>
        ) : (
          <span className="text-xs text-slate-500 dark:text-slate-400">Chưa có giá</span>
        )}
      </td>

      {/* Cột 6: Trạng thái */}
      <td className="px-4 py-3.5 align-middle text-center whitespace-nowrap">
        <div className="flex items-center justify-center">
          <span
            className={cn(
              "inline-flex min-w-[104px] items-center justify-center rounded-full border px-3.5 py-1.5 text-xs font-bold whitespace-nowrap shadow-2xs",
              meta?.className
            )}
          >
            {meta?.label ?? unit.status}
          </span>
        </div>
      </td>

      {/* Cột 7: Thao tác */}
      <td className="px-4 py-3.5 align-middle text-center whitespace-nowrap">
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Chỉnh sửa ô ${unit.unitCode}`}
            className="inline-flex min-w-[96px] cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <PencilIcon aria-hidden="true" className="size-3.5 text-slate-500" />
            <span>Chỉnh sửa</span>
          </button>
        </div>
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
    <label className="flex items-center gap-2 text-xs font-semibold">
      <span className="text-slate-600 dark:text-slate-400 whitespace-nowrap">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="inner-box text-title min-w-32 cursor-pointer rounded-xl border border-slate-200/90 bg-white px-2.5 py-1.5 text-xs font-semibold outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800"
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
        "cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap shadow-2xs transition backdrop-blur-sm",
        active
          ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-500/20"
          : "border-slate-200/90 bg-white/80 text-slate-700 hover:bg-white hover:text-slate-900 dark:border-slate-700/80 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-800"
      )}
    >
      {label}
    </button>
  )
}

export default UnitManagementPanel
