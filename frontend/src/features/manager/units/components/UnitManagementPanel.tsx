import { useCallback, useMemo, useState } from "react"
import { InboxIcon, PencilIcon, RotateCwIcon, SnowflakeIcon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { sanitizeErrorMessage } from "@/components/internal/readableError"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/internal/components/PanelKit"
import { usePagedRows } from "@/components/internal/usePagedRows"
import { shortFloorName, unitSizeOf } from "@/features/floorplan/unitDisplay"
import { useAsyncData } from "@/hooks/useAsyncData"

import { getManagerFloors, getManagerUnits } from "../api/unitManagementApi"
import { getManagerContext } from "@/features/manager/managerContext"
import type { ManagerUnit, PhysicalUnitStatus } from "../types"
import { normalizeUnitStatus, UNIT_STATUS_META, unitPrice } from "../unitRules"
import { formatVnd } from "@/lib/format"
import UnitEditSheet from "./UnitEditSheet"

const STATUS_ORDER: PhysicalUnitStatus[] = ["AVAILABLE", "HOLD", "RESERVED", "OCCUPIED", "UNDER_MAINTENANCE"]


function UnitManagementPanel() {
  const ctx = useMemo(() => getManagerContext(), [])
  const [searchQuery, setSearchQuery] = useState("")
  const [status, setStatus] = useState<PhysicalUnitStatus | "ALL">("ALL")
  const [reloadCount, setReloadCount] = useState(0)
  const [editing, setEditing] = useState<ManagerUnit | null>(null)

  const floors = useAsyncData(`floors#${reloadCount}`, () => getManagerFloors(ctx))
  const units = useAsyncData(`units#${reloadCount}`, () =>
    getManagerUnits(ctx, {})
  )

  // useCallback: useMemo tìm kiếm bên dưới dùng hàm này, giữ cùng một hàm khi danh sách tầng không đổi
  const floorName = useCallback(
    (id: number) => shortFloorName(floors.data?.find((f) => f.floorId === id)?.floorName ?? `Tầng ${id}`),
    [floors.data]
  )

  const keyword = searchQuery.trim().toLowerCase()

  const searchedUnits = useMemo(() => {
    return (units.data ?? []).filter((u) => {
      if (!keyword) return true
      const code = (u.unitCode ?? "").toLowerCase()
      const fl = floorName(u.floorId).toLowerCase()
      const sz = (unitSizeOf(u) || u.size || "").toLowerCase()
      const isClim = u.storageCondition === "CLIMATE_CONTROLLED" || u.isClimate
      const cond = isClim ? "điều hòa kho mát lạnh" : "thường tiêu chuẩn"
      const type = (u.typeName ?? "").toLowerCase()
      return (
        code.includes(keyword) ||
        fl.includes(keyword) ||
        sz.includes(keyword) ||
        `size ${sz}`.includes(keyword) ||
        cond.includes(keyword) ||
        type.includes(keyword)
      )
    })
  }, [units.data, keyword, floorName])

  const counts = STATUS_ORDER.reduce<Record<string, number>>((acc, s) => {
    acc[s] = searchedUnits.filter((u) => normalizeUnitStatus(u.status) === s).length
    return acc
  }, {})

  const rows = searchedUnits.filter((u) => status === "ALL" || normalizeUnitStatus(u.status) === status)
  const { slice, pagination } = usePagedRows(rows, `${keyword}|${status}`)

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
          <AlertDescription className="flex flex-wrap items-center gap-2 [overflow-wrap:anywhere]">
            {sanitizeErrorMessage(error)}
            {ctx.facilityId !== null && (
              <Button variant="outline" size="sm" onClick={() => setReloadCount((n) => n + 1)}>
                <RotateCwIcon aria-hidden="true" /> Thử lại
              </Button>
            )}
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Cụm Tìm kiếm ô kho - đặt phía trên */}
          <div className="card-box flex flex-col justify-between gap-3 rounded-2xl border p-4 shadow-sm md:flex-row md:items-center">
            <div className="flex max-w-xl flex-1 space-x-2">
              <div className="relative flex-1">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo mã ô kho, vị trí tầng, kích thước hoặc loại kho..."
                  className="inner-box w-full rounded-xl border border-slate-200/80 px-3.5 py-2 pl-9 text-xs font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700"
                />
                <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400 z-10"></i>
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="shrink-0 cursor-pointer rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Xóa tìm
                </button>
              )}
            </div>
          </div>

          {/* Dàn chip lọc theo trạng thái - nằm ngay phía dưới thanh tìm kiếm (chuẩn như Check-in) */}
          <div role="group" aria-label="Lọc theo trạng thái ô kho" className="flex flex-wrap items-center gap-2">
            <StatusChip active={status === "ALL"} onClick={() => setStatus("ALL")} label={`Tất cả (${searchedUnits.length})`} />
            {STATUS_ORDER.map((s) => (
              <StatusChip
                key={s}
                active={status === s}
                onClick={() => setStatus(s)}
                label={`${UNIT_STATUS_META[s].label} (${counts[s] ?? 0})`}
              />
            ))}
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
