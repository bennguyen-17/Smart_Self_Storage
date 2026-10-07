import { useMemo, useState } from "react"
import { RepeatIcon, SnowflakeIcon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { useAsyncData } from "@/hooks/useAsyncData"
import { getErrorMessage } from "@/lib/api"
import { formatVnd } from "@/lib/format"
import { getFloors } from "@/features/floor-plan/api/floorPlanApi"
import { unitAreaOf, unitSizeOf } from "@/features/floor-plan/unitDisplay"
import type { UnitSize } from "@/features/floor-plan/types"

import { changeUnit, getAvailableUnits } from "../api/checkinApi"
import type { ChangeUnitPreview, CheckinContract } from "../types"
import ProtoModal from "./ProtoModal"

interface ChangeUnitDialogProps {
  contract: CheckinContract | null
  onClose: () => void
  onChanged: (updated: CheckinContract) => void
}

const SIZE_OPTIONS: ("ALL" | UnitSize)[] = ["ALL", "XL", "L", "M", "S"]

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
          ? `Ô hiện tại ${contract.unitCode} · ${contract.customerName}`
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
  contract: CheckinContract
  onClose: () => void
  onChanged: (updated: CheckinContract) => void
}) {
  const [floorId, setFloorId] = useState<number>(contract.floorId)
  const [sizeFilter, setSizeFilter] = useState<"ALL" | UnitSize>("ALL")
  const [selectedUnitCode, setSelectedUnitCode] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { data: floorsData } = useAsyncData(`floors|${contract.facilityId}`, () =>
    getFloors(contract.facilityId)
  )
  const floors = floorsData ?? []

  const {
    data: unitsData,
    error: unitsError,
    isLoading: isLoadingUnits,
  } = useAsyncData(`units|${contract.facilityId}|${floorId}`, () =>
    getAvailableUnits({ facilityId: contract.facilityId, floorId })
  )

  const units = useMemo(
    () =>
      (unitsData ?? []).filter(
        (u) => u.status === "AVAILABLE" && u.unitCode !== contract.unitCode
      ),
    [unitsData, contract.unitCode]
  )

  const visibleUnits = useMemo(
    () =>
      units.filter((u) => sizeFilter === "ALL" || unitSizeOf(u) === sizeFilter),
    [units, sizeFilter]
  )

  const selectedUnit = useMemo(
    () => units.find((u) => u.unitCode === selectedUnitCode) ?? null,
    [units, selectedUnitCode]
  )

  const preview = useMemo<ChangeUnitPreview | null>(() => {
    if (!selectedUnit) return null
    const newRentalAmount =
      (contract.rentalType === "MONTHLY"
        ? selectedUnit.monthlyPrice
        : selectedUnit.dailyPrice) ?? 0
    const newDepositAmount = selectedUnit.depositAmount ?? 0
    const newTotal = newRentalAmount + newDepositAmount
    const remaining = newTotal - contract.paidAmount
    return {
      newUnit: selectedUnit,
      newRentalAmount,
      newDepositAmount,
      newTotal,
      paidAmount: contract.paidAmount,
      remainingAmount: Math.max(remaining, 0),
      refundAmount: remaining < 0 ? -remaining : 0,
    }
  }, [selectedUnit, contract])

  async function handleConfirm() {
    if (!preview) return
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      const updated = await changeUnit(contract.code, {
        newUnitCode: preview.newUnit.unitCode,
        newRentalAmount: preview.newRentalAmount,
        newDepositAmount: preview.newDepositAmount,
      })
      toast.success("Đổi ô kho thành công", {
        description: `${contract.unitCode} → ${preview.newUnit.unitCode}`,
      })
      onChanged(updated)
    } catch (error) {
      setErrorMsg(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <p className="text-xs text-muted">
        Ô mới chuyển thẳng AVAILABLE → RESERVED (ngoại lệ BR-11, không qua HOLD).
      </p>

      {/* BỘ LỌC TẦNG / SIZE */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <label className="font-medium text-muted" htmlFor="change-unit-floor">
          Tầng:
        </label>
        <select
          id="change-unit-floor"
          value={floorId}
          onChange={(event) => setFloorId(Number(event.target.value))}
          className="portal-input h-8 rounded-lg border px-2.5 text-xs outline-none"
        >
          {floors.map((floor) => (
            <option key={floor.floorId} value={floor.floorId}>
              {floor.floorName}
            </option>
          ))}
        </select>

        <label className="font-medium text-muted" htmlFor="change-unit-size">
          Size:
        </label>
        <select
          id="change-unit-size"
          value={sizeFilter}
          onChange={(event) =>
            setSizeFilter(event.target.value as "ALL" | UnitSize)
          }
          className="portal-input h-8 rounded-lg border px-2.5 text-xs outline-none"
        >
          {SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size === "ALL" ? "Tất cả size" : `Size ${size}`}
            </option>
          ))}
        </select>
      </div>

      {/* DANH SÁCH Ô TRỐNG */}
      <div className="max-h-56 overflow-y-auto rounded-2xl border p-2">
        {isLoadingUnits && (
          <p className="px-2 py-6 text-xs text-muted">Đang tải ô kho trống…</p>
        )}
        {!isLoadingUnits && unitsError && (
          <p className="px-2 py-4 text-xs text-rose-600">{unitsError}</p>
        )}
        {!isLoadingUnits && !unitsError && visibleUnits.length === 0 && (
          <p className="px-2 py-4 text-xs text-muted">
            Không có ô kho trống phù hợp ở tầng này.
          </p>
        )}
        {!isLoadingUnits && !unitsError && visibleUnits.length > 0 && (
          <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {visibleUnits.map((unit) => {
              const isSelected = selectedUnitCode === unit.unitCode
              const area = unitAreaOf(unit)
              return (
                <li key={String(unit.unitId)}>
                  <button
                    type="button"
                    onClick={() => setSelectedUnitCode(unit.unitCode)}
                    aria-pressed={isSelected}
                    className={cn(
                      "flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border-2 px-3 py-2 text-left text-xs transition-colors",
                      isSelected
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
        )}
      </div>

      {/* BẢNG CHÊNH LỆCH */}
      {preview && (
        <div className="inner-box space-y-2 rounded-2xl border p-3.5 text-xs">
          <Row
            label="Ô mới"
            value={`${preview.newUnit.unitCode} · ${preview.newUnit.typeName ?? ""}`}
          />
          <Row
            label="Tiền thuê mới"
            value={formatVnd(preview.newRentalAmount)}
          />
          <Row label="Cọc mới" value={formatVnd(preview.newDepositAmount)} />
          <Row
            label="Tổng mới (thuê + cọc)"
            value={formatVnd(preview.newTotal)}
          />
          <Row
            label="Đã thu (giữ nguyên)"
            value={formatVnd(preview.paidAmount)}
          />
          {preview.refundAmount > 0 ? (
            <Row
              label="Hoàn phần dư cho khách"
              value={formatVnd(preview.refundAmount)}
              valueClass="text-emerald-600 dark:text-emerald-400"
            />
          ) : (
            <Row
              label="Còn phải thu tại quầy"
              value={formatVnd(preview.remainingAmount)}
              valueClass="text-blue-600 dark:text-blue-400"
              strong
            />
          )}
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
          disabled={isSubmitting || !selectedUnit}
          className="flex flex-1 cursor-pointer items-center justify-center space-x-1.5 rounded-xl bg-blue-600 py-3 text-xs font-extrabold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-60"
        >
          <RepeatIcon className="size-4" />
          <span>{isSubmitting ? "Đang xử lý..." : "Xác nhận đổi ô kho"}</span>
        </button>
      </div>
    </>
  )
}

function Row({
  label,
  value,
  valueClass,
  strong,
}: {
  label: string
  value: string
  valueClass?: string
  strong?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-1.5 first:border-t-0 first:pt-0 dark:border-slate-800">
      <span className="text-muted">{label}</span>
      <span
        className={cn(
          "font-bold text-title",
          strong && "text-base font-black",
          valueClass
        )}
      >
        {value}
      </span>
    </div>
  )
}

export default ChangeUnitDialog
