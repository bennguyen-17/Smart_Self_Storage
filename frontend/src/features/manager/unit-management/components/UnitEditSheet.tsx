import { useState, type ReactNode } from "react"
import { InfoIcon, SnowflakeIcon, WarehouseIcon, WrenchIcon } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { unitSizeOf } from "@/features/floorplan/unitDisplay"
import { getErrorMessage } from "@/lib/api"
import { formatVnd } from "@/lib/format"

import { changeUnitType, startMaintenance } from "../api/unitManagementApi"
import type { ManagerContext, ManagerUnit } from "../types"
import {
  canStartMaintenance,
  changeTypeBlockReason,
  initialUnitDraft,
  MAINTENANCE_NOTE_MAX,
  normalizeUnitStatus,
  planUnitEdit,
  UNIT_STATUS_META,
  type UnitEditDraft,
} from "../unitRules"

interface UnitEditSheetProps {
  unit: ManagerUnit
  floorLabel: string
  ctx: ManagerContext
  onClose: () => void
  /** Đã lưu xong (hoặc lưu được một phần): trang cần tải lại bảng */
  onSaved: (message: string | null) => void
}

/**
 * Ngăn "Sửa ô kho" trượt từ bên phải: bảng vẫn hiện phía sau để Manager không mất vị trí đang xem.
 * Chỉ cho sửa những gì luật cho phép; lựa chọn bị khóa luôn kèm lý do.
 * Khi lưu, gọi đúng các API BE đang có: đổi loại kho trước, rồi mới đưa vào bảo trì.
 */
function UnitEditSheet({ unit, floorLabel, ctx, onClose, onSaved }: UnitEditSheetProps) {
  const [draft, setDraft] = useState<UnitEditDraft>(() => initialUnitDraft(unit))
  const [showNoteError, setShowNoteError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const status = normalizeUnitStatus(unit.status)
  const meta = status ? UNIT_STATUS_META[status] : null
  const typeBlock = changeTypeBlockReason(unit.status, unit.unitTypeId)
  const underMaintenance = status === "UNDER_MAINTENANCE"
  const maintenanceBlock = underMaintenance
    ? "Ô đang bảo trì. Nhân viên cơ sở nghiệm thu xong sẽ mở lại cho thuê."
    : canStartMaintenance(unit.status)
      ? null
      : "Ô đang có khách giữ chỗ, đặt cọc hoặc đang thuê nên chưa đưa vào bảo trì được."
  const plan = planUnitEdit(unit, draft)
  const set = (patch: Partial<UnitEditDraft>) => setDraft((d) => ({ ...d, ...patch }))
  const size = unitSizeOf(unit)

  async function save() {
    if (plan.noteError) {
      setShowNoteError(true)
      return
    }
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
      // Bước đầu đã lưu mà bước sau lỗi: báo trang tải lại để bảng đúng với dữ liệu thật
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
        <DialogHeader className="border-b p-4 pr-12">
          <DialogTitle className="text-base font-black">
            Sửa ô <span className="font-mono">{unit.unitCode}</span>
          </DialogTitle>
          <DialogDescription>
            {floorLabel} · {unit.typeName ?? "—"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
            <InfoItem label="Trạng thái hiện tại">
              <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold", meta?.className)}>
                {meta?.label ?? unit.status}
              </span>
            </InfoItem>
            <InfoItem label="Kích thước">{size ? `Size ${size}` : "—"}</InfoItem>
            <InfoItem label="Giá ngày">{formatVnd(unit.dailyPrice)}</InfoItem>
            <InfoItem label="Giá tháng">{formatVnd(unit.monthlyPrice)}</InfoItem>
          </dl>

          <fieldset className="space-y-2" disabled={submitting}>
            <legend className="mb-2 text-sm font-bold">Loại kho</legend>
            <ChoiceCard
              name="storage-type"
              checked={!draft.climate}
              onChange={() => set({ climate: false })}
              icon={<WarehouseIcon className="size-4" aria-hidden="true" />}
              title="Kho thường"
              detail="Giá theo bảng giá kho thường của size này."
              blocked={typeBlock !== null && Boolean(unit.isClimate)}
            />
            <ChoiceCard
              name="storage-type"
              checked={draft.climate}
              onChange={() => set({ climate: true })}
              icon={<SnowflakeIcon className="size-4 text-cyan-500" aria-hidden="true" />}
              title="Kho điều hòa"
              detail="Giá theo bảng giá kho điều hòa, phụ thu 20%."
              blocked={typeBlock !== null && !unit.isClimate}
            />
            {typeBlock && <LockedReason>{typeBlock}</LockedReason>}
          </fieldset>

          <fieldset className="space-y-2" disabled={submitting}>
            <legend className="mb-2 text-sm font-bold">Tình trạng</legend>
            <ChoiceCard
              name="unit-condition"
              checked={!draft.maintenance}
              onChange={() => set({ maintenance: false })}
              icon={<WarehouseIcon className="size-4" aria-hidden="true" />}
              title="Sẵn sàng cho thuê"
              detail="Ô hiện trên sơ đồ đặt kho của khách khi còn trống."
              blocked={underMaintenance}
            />
            <ChoiceCard
              name="unit-condition"
              checked={draft.maintenance}
              onChange={() => set({ maintenance: true })}
              icon={<WrenchIcon className="size-4" aria-hidden="true" />}
              title="Bảo trì / vệ sinh"
              detail="Ẩn ô khỏi sơ đồ của khách cho tới khi nhân viên nghiệm thu."
              blocked={maintenanceBlock !== null && !underMaintenance}
            />
            {maintenanceBlock && <LockedReason>{maintenanceBlock}</LockedReason>}

            {draft.maintenance && !underMaintenance && !maintenanceBlock && (
              <div className="space-y-1.5 pt-1">
                <label htmlFor="maintenance-note" className="text-xs font-bold">
                  Ghi chú sự cố <span className="text-rose-500">*</span>
                </label>
                <Textarea
                  id="maintenance-note"
                  value={draft.note}
                  rows={3}
                  maxLength={MAINTENANCE_NOTE_MAX + 50}
                  placeholder="VD: Rò nước trần, khóa cửa kẹt, cần vệ sinh sau khi khách trả kho…"
                  aria-invalid={showNoteError && plan.noteError !== null}
                  aria-describedby="maintenance-note-hint"
                  onChange={(e) => set({ note: e.target.value })}
                  onBlur={() => setShowNoteError(true)}
                  className="placeholder:text-slate-400"
                />
                <p
                  id="maintenance-note-hint"
                  className={cn(
                    "flex justify-between gap-2 text-[11px]",
                    showNoteError && plan.noteError ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"
                  )}
                >
                  <span>{showNoteError && plan.noteError ? plan.noteError : "Nhân viên sẽ đọc ghi chú này khi xử lý ô."}</span>
                  <span className="shrink-0 tabular-nums">
                    {draft.note.trim().length}/{MAINTENANCE_NOTE_MAX}
                  </span>
                </p>
              </div>
            )}
          </fieldset>

          {serverError && (
            <p role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              {serverError}
            </p>
          )}
        </div>

        <DialogFooter className="m-0 flex-row justify-end gap-2 rounded-none border-t p-4">
          <Button variant="outline" disabled={submitting} onClick={onClose}>
            Hủy
          </Button>
          <Button
            disabled={submitting || plan.ops.length === 0}
            title={plan.ops.length === 0 ? "Chưa có thay đổi nào" : undefined}
            onClick={save}
            className="bg-blue-600 text-white hover:bg-blue-500"
          >
            {submitting && <Spinner />}
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function InfoItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold">{children}</dd>
    </div>
  )
}

function LockedReason({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
      <InfoIcon aria-hidden="true" className="mt-px size-3.5 shrink-0" />
      {children}
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
  /** Lựa chọn không được phép với trạng thái ô hiện tại (lựa chọn đang là hiện trạng thì không khóa) */
  blocked: boolean
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
        checked ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "hover:bg-muted/60",
        blocked && "cursor-not-allowed opacity-60 hover:bg-transparent"
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        disabled={blocked}
        onChange={onChange}
        className="mt-0.5 size-4 accent-blue-600"
      />
      <span className="space-y-0.5">
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          {icon}
          {title}
        </span>
        <span className="block text-xs text-muted-foreground">{detail}</span>
      </span>
    </label>
  )
}

export default UnitEditSheet
