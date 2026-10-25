import { useState, type ReactNode } from "react"
import { CheckCircle2Icon, InfoIcon, SnowflakeIcon, WarehouseIcon, WrenchIcon } from "lucide-react"
import { cn } from "cn"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { getErrorMessage } from "@/lib/api"

import { changeUnitType, startMaintenance } from "../api/unitManagementApi"
import type { ManagerContext, ManagerUnit } from "../types"
import {
  canStartMaintenance,
  changeTypeBlockReason,
  initialUnitDraft,
  normalizeUnitStatus,
  planUnitEdit,
  UNIT_STATUS_META,
  type UnitEditDraft,
} from "../unitRules"

interface UnitEditSheetProps {
  unit: ManagerUnit
  floorLabel?: string
  ctx: ManagerContext
  onClose: () => void
  onSaved: (message: string | null) => void
}

function UnitEditSheet({ unit, ctx, onClose, onSaved }: UnitEditSheetProps) {
  const [draft, setDraft] = useState<UnitEditDraft>(() => initialUnitDraft(unit))
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const statusKey = normalizeUnitStatus(unit.status)
  const meta = statusKey ? UNIT_STATUS_META[statusKey] : null
  const typeBlock = changeTypeBlockReason(unit.status, unit.unitTypeId)
  const underMaintenance = statusKey === "UNDER_MAINTENANCE"
  const maintenanceBlock = underMaintenance
    ? "Ô đang trong quá trình bảo trì. Nhân viên cơ sở nghiệm thu xong sẽ mở lại cho thuê."
    : canStartMaintenance(unit.status)
      ? null
      : "Ô đang có khách giữ chỗ, đặt cọc hoặc đang thuê nên chưa đưa vào bảo trì được."

  const plan = planUnitEdit(unit, draft)
  const set = (patch: Partial<UnitEditDraft>) => setDraft((d) => ({ ...d, ...patch }))

  const hasClimateChange = draft.climate !== Boolean(unit.isClimate)
  const hasMaintenanceChange = draft.maintenance && !underMaintenance

  async function save() {
    setSubmitting(true)
    setServerError(null)
    let done = 0
    try {
      for (const op of plan.ops) {
        if (op.kind === "change-type") await changeUnitType(ctx, unit.unitCode, op.targetTypeId)
        else await startMaintenance(ctx, unit.unitCode, op.note)
        done++
      }
      onSaved(`Đã lưu thay đổi cho ô ${unit.unitCode}`)
    } catch (err) {
      setServerError(getErrorMessage(err))
      if (done > 0) onSaved(null)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !submitting && onClose()}>
      <DialogContent
        className="top-0 right-0 left-auto flex h-dvh max-h-dvh w-full max-w-full translate-x-0 translate-y-0 flex-col gap-0 rounded-none p-0 sm:max-w-md data-open:slide-in-from-right-10 data-open:zoom-in-100 data-closed:slide-out-to-right-10 data-closed:zoom-out-100"
      >
        <DialogHeader className="border-b border-slate-200/80 bg-slate-50/70 p-4 pr-12 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <WarehouseIcon className="size-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>
                Sửa ô <span className="font-mono text-blue-600 dark:text-blue-400">{unit.unitCode}</span>
              </span>
            </DialogTitle>
            {meta && (
              <span
                className={cn(
                  "inline-flex items-center justify-center rounded-full border px-3 py-0.5 text-xs font-bold whitespace-nowrap shadow-2xs",
                  meta.className
                )}
              >
                {meta.label}
              </span>
            )}
          </div>
          <DialogDescription className="sr-only">
            Chỉnh sửa loại kho và trạng thái bảo trì cho ô {unit.unitCode}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          {/* Section 1: Cấu hình loại kho */}
          <fieldset className="space-y-3" disabled={submitting}>
            <div className="flex items-center justify-between">
              <legend className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Loại kho
              </legend>
              {hasClimateChange && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                  <CheckCircle2Icon className="size-3.5" />
                  Sẽ đổi sang {draft.climate ? "Kho điều hòa" : "Kho thường"}
                </span>
              )}
            </div>

            <ChoiceCard
              name="storage-type"
              checked={!draft.climate}
              onChange={() => set({ climate: false })}
              icon={<WarehouseIcon className="size-4.5 text-slate-600 dark:text-slate-300" aria-hidden="true" />}
              title="Kho thường"
              detail="Nhiệt độ phòng tự nhiên, thông thoáng tiêu chuẩn."
              blocked={typeBlock !== null && Boolean(unit.isClimate)}
            />
            <ChoiceCard
              name="storage-type"
              checked={draft.climate}
              onChange={() => set({ climate: true })}
              icon={<SnowflakeIcon className="size-4.5 text-cyan-500" aria-hidden="true" />}
              title="Kho điều hòa"
              detail="Kiểm soát nhiệt độ & độ ẩm 24/7 (phụ thu theo bảng giá điều hòa)."
              blocked={typeBlock !== null && !unit.isClimate}
            />
            {typeBlock && <LockedReason>{typeBlock}</LockedReason>}
          </fieldset>

          {/* Section 2: Tình trạng ô kho */}
          <fieldset className="space-y-3" disabled={submitting}>
            <div className="flex items-center justify-between">
              <legend className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Tình trạng ô kho
              </legend>
              {hasMaintenanceChange && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  <CheckCircle2Icon className="size-3.5" />
                  Sẽ chuyển sang Bảo trì
                </span>
              )}
            </div>

            <ChoiceCard
              name="unit-condition"
              checked={!draft.maintenance}
              onChange={() => set({ maintenance: false })}
              icon={<WarehouseIcon className="size-4.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />}
              title="Sẵn sàng cho thuê"
              detail="Ô hiển thị trên sơ đồ để khách đặt thuê khi còn trống."
              blocked={underMaintenance}
            />
            <ChoiceCard
              name="unit-condition"
              checked={draft.maintenance}
              onChange={() => set({ maintenance: true })}
              icon={<WrenchIcon className="size-4.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />}
              title="Bảo trì"
              detail="Tạm dừng cho thuê để vệ sinh, kiểm tra hoặc bảo dưỡng ô kho."
              blocked={maintenanceBlock !== null && !underMaintenance}
            />
            {maintenanceBlock && <LockedReason>{maintenanceBlock}</LockedReason>}
          </fieldset>

          {serverError && (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
              {serverError}
            </p>
          )}
        </div>

        <DialogFooter className="m-0 flex-row justify-end gap-2.5 rounded-none border-t border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={submitting || plan.ops.length === 0}
            title={plan.ops.length === 0 ? "Chưa có thay đổi nào" : undefined}
            onClick={save}
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && <Spinner className="size-3.5" />}
            <span>
              Lưu thay đổi{plan.ops.length > 0 ? ` (${plan.ops.length})` : ""}
            </span>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function LockedReason({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 rounded-xl border border-amber-200 bg-amber-50/70 p-2.5 text-[11px] font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
      <InfoIcon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
      <span>{children}</span>
    </p>
  )
}

function ChoiceCard({
  name,
  checked,
  onChange,
  icon,
  title,
  detail,
  blocked,
}: {
  name: string
  checked: boolean
  onChange: () => void
  icon: ReactNode
  title: string
  detail: string
  blocked: boolean
}) {
  return (
    <label
      className={cn(
        "group relative flex cursor-pointer items-start gap-3.5 rounded-2xl border p-3.5 transition-all",
        checked
          ? "border-blue-500 bg-blue-50/70 shadow-xs dark:border-blue-500 dark:bg-blue-950/30"
          : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:bg-slate-800/40",
        blocked && "cursor-not-allowed opacity-60 hover:border-slate-200 hover:bg-white dark:hover:bg-slate-900/40"
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        disabled={blocked}
        onChange={onChange}
        className="sr-only"
      />
      <div
        aria-hidden="true"
        className={cn(
          "mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full border transition-all",
          checked
            ? "border-blue-600 bg-blue-600 text-white shadow-2xs"
            : "border-slate-300 bg-white group-hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800",
          blocked && "opacity-50"
        )}
      >
        {checked && <div className="size-2 rounded-full bg-white shadow-xs" />}
      </div>

      <span className="min-w-0 flex-1 space-y-0.5">
        <span className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          {icon}
          <span>{title}</span>
        </span>
        <span className="block text-xs font-normal text-slate-500 dark:text-slate-400 leading-relaxed">
          {detail}
        </span>
      </span>
    </label>
  )
}

export default UnitEditSheet
