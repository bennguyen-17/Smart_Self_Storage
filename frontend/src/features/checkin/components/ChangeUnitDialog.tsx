import { useMemo, useState } from "react"
import { RepeatIcon, SnowflakeIcon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { useAsyncData } from "@/hooks/useAsyncData"
import { formatVnd } from "@/lib/format"
import { unitAreaOf, unitSizeOf } from "@/features/floor-plan/unitDisplay"

import {
  changeUnit,
  checkinErrorMessage,
  fetchAllUnits,
} from "../api/checkinApi"
import type { StaffChangeUnitResponse } from "../types"
import type { CheckinTarget } from "./StaffCustomerDetailModal"
import ProtoModal from "./ProtoModal"

interface ChangeUnitDialogProps {
  contract: CheckinTarget | null
  onClose: () => void
  onChanged: (response: StaffChangeUnitResponse) => void
}

function ChangeUnitDialog({
  contract,
  onClose,
  onChanged,
}: ChangeUnitDialogProps) {
  return (
    <ProtoModal
      open={contract !== null}
      onClose={onClose}
      title="Đổi ô kho tại quầy"
      subtitle={
        contract
          ? `Ô hiện tại ${contract.unitCode ?? "—"} · ${contract.customerName ?? ""}`
          : undefined
      }
      icon={<RepeatIcon className="size-5" />}
      maxWidth="max-w-2xl"
    >
      {contract && (
        <Body contract={contract} onClose={onClose} onChanged={onChanged} />
      )}
    </ProtoModal>
  )
}

function Body({
  contract,
  onClose,
  onChanged,
}: {
  contract: CheckinTarget
  onClose: () => void
  onChanged: (response: StaffChangeUnitResponse) => void
}) {
  const [newUnitCode, setNewUnitCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Gợi ý ô trống cùng tầng với ô hiện tại (BE không trả facilityId cho FE).
  const { data: units } = useAsyncData("checkin:all-units", fetchAllUnits)
  const currentUnit = useMemo(
    () => (units ?? []).find((u) => u.unitCode === contract.unitCode) ?? null,
    [units, contract.unitCode]
  )
  const suggestions = useMemo(() => {
    if (!currentUnit) return []
    return (units ?? []).filter(
      (u) =>
        u.status === "AVAILABLE" &&
        u.floorId === currentUnit.floorId &&
        u.unitCode !== contract.unitCode
    )
  }, [units, currentUnit, contract.unitCode])

  async function handleConfirm() {
    const code = newUnitCode.trim()
    if (!code) return
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      const response = await changeUnit(contract.reservationId, {
        newUnitCode: code,
      })
      const detail =
        response.refundAmount && response.refundAmount > 0
          ? `Hoàn phần dư: ${formatVnd(response.refundAmount)}`
          : `Còn phải thu: ${formatVnd(response.remainingDue ?? 0)}`
      toast.success("Đổi ô kho thành công", {
        description: `${contract.unitCode} → ${response.newUnitCode}. ${detail}`,
      })
      onChanged(response)
    } catch (error) {
      setErrorMsg(checkinErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <p className="text-xs text-muted">
        Nhập mã ô kho mới (ô phải đang AVAILABLE cùng cơ sở). Hệ thống tự tính
        lại tiền thuê/cọc và hoàn phần dư nếu có.
      </p>

      <div className="flex items-center justify-between gap-3 rounded-2xl border p-3.5 text-xs">
        <span className="text-muted">Ô hiện tại</span>
        <span className="font-mono font-bold text-title">
          {contract.unitCode ?? "—"}
        </span>
      </div>

      <div className="space-y-1.5">
        <label
          className="text-xs font-medium text-muted"
          htmlFor="change-unit-code"
        >
          Mã ô kho mới <span className="text-rose-500">*</span>
        </label>
        <input
          id="change-unit-code"
          value={newUnitCode}
          onChange={(event) => setNewUnitCode(event.target.value)}
          placeholder="VD: F2-M206"
          spellCheck={false}
          className="portal-input w-full rounded-xl border px-3 py-2.5 font-mono text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {suggestions.length > 0 && (
        <div className="rounded-2xl border p-2">
          <div className="px-1 pb-1 text-[10px] font-bold tracking-wider text-muted uppercase">
            Gợi ý ô trống cùng tầng ({suggestions.length}) — bấm để chọn
          </div>
          <div className="max-h-40 overflow-y-auto">
            <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {suggestions.map((unit) => {
                const area = unitAreaOf(unit)
                return (
                  <li key={String(unit.unitId)}>
                    <button
                      type="button"
                      onClick={() => setNewUnitCode(unit.unitCode)}
                      className={cn(
                        "flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border-2 px-3 py-2 text-left text-xs transition-colors",
                        newUnitCode === unit.unitCode
                          ? "border-blue-600 bg-blue-500/10"
                          : "border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800"
                      )}
                    >
                      <span className="flex flex-col">
                        <span className="font-mono font-bold text-title">
                          {unit.unitCode}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-muted">
                          {unit.typeName ?? unitSizeOf(unit) ?? ""}
                          {area != null ? ` · ${area} m²` : ""}
                          {unit.isClimate && (
                            <SnowflakeIcon className="size-3" />
                          )}
                        </span>
                      </span>
                      <span className="text-right text-[11px]">
                        <span className="block font-bold text-title">
                          {formatVnd(unit.monthlyPrice)}/tháng
                        </span>
                        <span className="block text-muted">
                          Cọc {formatVnd(unit.depositAmount)}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
          {errorMsg}
        </div>
      )}

      <div className="flex items-center space-x-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="flex-1 cursor-pointer rounded-xl bg-slate-200 py-3 text-xs font-extrabold text-slate-800 transition hover:bg-slate-300 disabled:opacity-60 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Hủy bỏ
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isSubmitting || newUnitCode.trim().length === 0}
          className="flex flex-1 cursor-pointer items-center justify-center space-x-1.5 rounded-xl bg-blue-600 py-3 text-xs font-extrabold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-60"
        >
          <RepeatIcon className="size-4" />
          <span>{isSubmitting ? "Đang xử lý..." : "Xác nhận đổi ô kho"}</span>
        </button>
      </div>
    </>
  )
}

export default ChangeUnitDialog
