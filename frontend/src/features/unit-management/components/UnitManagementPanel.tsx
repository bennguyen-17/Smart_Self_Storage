import { useMemo, useState } from "react"
import {
  ArrowLeftRightIcon,
  InboxIcon,
  InfoIcon,
  RotateCwIcon,
  SnowflakeIcon,
  WrenchIcon,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { shortFloorName, unitSizeOf, UNIT_SIZES } from "@/features/floor-plan/unitDisplay"
import { useAsyncData } from "@/hooks/useAsyncData"
import { getErrorMessage } from "@/lib/api"
import { formatVnd } from "@/lib/format"
import type { StorageCondition } from "@/types"

import {
  changeUnitType,
  getManagerFloors,
  getManagerUnits,
  startMaintenance,
} from "../api/unitManagementApi"
import { getManagerContext } from "../managerContext"
import type { ManagerUnit, PhysicalUnitStatus } from "../types"
import {
  canChangeStorageType,
  canStartMaintenance,
  changeTypeBlockReason,
  climateCounterpartTypeId,
  MAINTENANCE_NOTE_MAX,
  maintenanceNoteError,
  normalizeUnitStatus,
  UNIT_STATUS_META,
} from "../unitRules"

const STATUS_ORDER: PhysicalUnitStatus[] = ["AVAILABLE", "HOLD", "RESERVED", "OCCUPIED", "UNDER_MAINTENANCE"]

type PendingAction =
  | { kind: "change-type"; unit: ManagerUnit; targetTypeId: number }
  | { kind: "maintenance"; unit: ManagerUnit }

/** US-13: Facility Manager xem ô kho của cơ sở mình, đổi loại kho và đưa ô vào bảo trì */
function UnitManagementPanel() {
  const ctx = useMemo(() => getManagerContext(), [])
  const [floorId, setFloorId] = useState<number | "ALL">("ALL")
  const [condition, setCondition] = useState<StorageCondition | "ALL">("ALL")
  const [size, setSize] = useState<string>("ALL")
  const [status, setStatus] = useState<PhysicalUnitStatus | "ALL">("ALL")
  const [reloadCount, setReloadCount] = useState(0)
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [note, setNote] = useState("")
  const [noteTouched, setNoteTouched] = useState(false)
  const noteError = pending?.kind === "maintenance" ? maintenanceNoteError(note) : null

  function openPending(action: PendingAction) {
    setNote("")
    setNoteTouched(false)
    setPending(action)
  }

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

  async function confirmPending() {
    if (!pending) return
    if (noteError) {
      setNoteTouched(true)
      return
    }
    setSubmitting(true)
    try {
      if (pending.kind === "change-type") {
        await changeUnitType(ctx, pending.unit.unitCode, pending.targetTypeId)
        toast.success(`Đã đổi loại kho ô ${pending.unit.unitCode}`)
      } else {
        await startMaintenance(ctx, pending.unit.unitCode, note)
        toast.success(`Đã đưa ô ${pending.unit.unitCode} vào bảo trì`)
      }
      setPending(null)
      setReloadCount((n) => n + 1)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const error = floors.error ?? units.error

  return (
    <section aria-label="Quản lý ô kho tại cơ sở" className="space-y-4">
      <div className="card-box space-y-1 rounded-2xl border p-4 shadow-sm">
        <h3 className="text-title flex items-center gap-2 text-sm font-black tracking-wide sm:text-base">
          <WrenchIcon aria-hidden="true" className="size-4 text-purple-500" />
          QUẢN LÝ Ô KHO TẠI CƠ SỞ
        </h3>
        <p className="text-muted text-xs">
          Đổi loại kho Thường ↔ Điều hòa khi ô còn trống, đưa ô trống vào bảo trì. Số lượng và vị trí ô cố
          định theo mặt bằng cơ sở; giá áp dụng theo bảng giá hệ thống, không chỉnh giá riêng từng ô.
        </p>
        {ctx.isDemo && (
          <p className="flex items-center gap-1.5 pt-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
            <InfoIcon aria-hidden="true" className="size-3.5" />
            Đang xem dữ liệu mẫu (cơ sở HN-01).
          </p>
        )}
      </div>

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

          <div className="card-box overflow-x-auto rounded-2xl border shadow-sm">
            <table className="w-full min-w-[820px] text-left text-xs">
              <caption className="sr-only">Danh sách ô kho của cơ sở</caption>
              <thead className="text-muted border-b text-[11px] uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-bold">Mã ô</th>
                  <th scope="col" className="px-4 py-3 font-bold">Tầng</th>
                  <th scope="col" className="px-4 py-3 font-bold">Loại kho</th>
                  <th scope="col" className="px-4 py-3 text-right font-bold">Giá ngày / tháng</th>
                  <th scope="col" className="px-4 py-3 font-bold">Trạng thái</th>
                  <th scope="col" className="px-4 py-3 text-right font-bold">Hành động</th>
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
                      onChangeType={(targetTypeId) => openPending({ kind: "change-type", unit: u, targetTypeId })}
                      onMaintenance={() => openPending({ kind: "maintenance", unit: u })}
                    />
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Dialog open={pending !== null} onOpenChange={(open) => !open && !submitting && setPending(null)}>
        <DialogContent className="sm:max-w-md">
          {pending && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {pending.kind === "change-type"
                    ? `Đổi loại kho ô ${pending.unit.unitCode}?`
                    : `Đưa ô ${pending.unit.unitCode} vào bảo trì?`}
                </DialogTitle>
                <DialogDescription>
                  {pending.kind === "change-type"
                    ? `Chuyển từ ${pending.unit.isClimate ? "Kho điều hòa" : "Kho thường"} sang ${
                        pending.unit.isClimate ? "Kho thường" : "Kho điều hòa"
                      }. Giá thuê sẽ tự áp theo bảng giá của loại kho mới${
                        pending.unit.isClimate ? "." : " (kho điều hòa có phụ thu 20%)."
                      }`
                    : "Ô sẽ chuyển sang trạng thái bảo trì và ẩn khỏi sơ đồ đặt kho của khách cho đến khi nhân viên nghiệm thu hoàn tất."}
                </DialogDescription>
              </DialogHeader>
              {pending.kind === "maintenance" && (
                <div className="space-y-1.5">
                  <label htmlFor="maintenance-note" className="text-title text-xs font-bold">
                    Ghi chú sự cố <span className="text-rose-500">*</span>
                  </label>
                  <Textarea
                    id="maintenance-note"
                    value={note}
                    maxLength={MAINTENANCE_NOTE_MAX + 50}
                    rows={3}
                    disabled={submitting}
                    placeholder="VD: Rò nước trần, khóa cửa kẹt, cần vệ sinh sau khi khách trả kho…"
                    aria-invalid={noteTouched && noteError !== null}
                    aria-describedby="maintenance-note-hint"
                    onChange={(e) => setNote(e.target.value)}
                    onBlur={() => setNoteTouched(true)}
                    className="placeholder:text-slate-400"
                  />
                  <p
                    id="maintenance-note-hint"
                    className={cn(
                      "flex justify-between gap-2 text-[11px]",
                      noteTouched && noteError ? "text-rose-600 dark:text-rose-400" : "text-muted"
                    )}
                  >
                    <span>{noteTouched && noteError ? noteError : "Nhân viên sẽ đọc ghi chú này khi xử lý ô."}</span>
                    <span className="shrink-0 tabular-nums">
                      {note.trim().length}/{MAINTENANCE_NOTE_MAX}
                    </span>
                  </p>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" disabled={submitting} onClick={() => setPending(null)}>
                  Hủy
                </Button>
                <Button
                  disabled={submitting}
                  onClick={confirmPending}
                  className="bg-purple-600 text-white hover:bg-purple-500"
                >
                  {submitting && <Spinner />}
                  Xác nhận
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}

function UnitRow({
  unit,
  floorLabel,
  onChangeType,
  onMaintenance,
}: {
  unit: ManagerUnit
  floorLabel: string
  onChangeType: (targetTypeId: number) => void
  onMaintenance: () => void
}) {
  const st = normalizeUnitStatus(unit.status)
  const meta = st ? UNIT_STATUS_META[st] : null
  const targetTypeId = climateCounterpartTypeId(unit.unitTypeId)
  const typeBlock = changeTypeBlockReason(unit.status, unit.unitTypeId)
  const maintenanceOk = canStartMaintenance(unit.status)

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
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!canChangeStorageType(unit.status, unit.unitTypeId)}
            title={typeBlock ?? undefined}
            onClick={() => targetTypeId !== null && onChangeType(targetTypeId)}
          >
            <ArrowLeftRightIcon aria-hidden="true" />
            {unit.isClimate ? "Sang kho thường" : "Sang kho điều hòa"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!maintenanceOk}
            title={maintenanceOk ? undefined : "Chỉ đưa vào bảo trì được khi ô đang trống"}
            onClick={onMaintenance}
          >
            <WrenchIcon aria-hidden="true" />
            Bảo trì
          </Button>
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
