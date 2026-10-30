import StorageMap2D from "@/features/customer/rent/components/StorageMap2D"
import type { UnitDetailResponse } from "@/types"
import { RepeatIcon, XIcon } from "lucide-react"
import type { StaffReservationLookup } from "../types"

interface CheckinUnitChangeModalProps {
  isOpen: boolean
  onClose: () => void
  contract: StaffReservationLookup
  contractFacility: string
  mapFloor: number
  setMapFloor: (fl: number) => void
  confirmingUnit: UnitDetailResponse | null
  selectedUnit: UnitDetailResponse | null
  onInitiateUnitChange: (u: any) => void
  onApplyUnitChange: () => void
  onCancelConfirmUnit: () => void
  isCalculatingConfirm: boolean
  getUnitTypeAndClimateDisplay: (
    unitCode?: string | null,
    typeName?: string | null,
    size?: string | null,
    isClimate?: boolean | null,
    unitDetail?: UnitDetailResponse | null
  ) => string
}

export default function CheckinUnitChangeModal({
  isOpen,
  onClose,
  contract,
  contractFacility,
  mapFloor,
  setMapFloor,
  confirmingUnit,
  selectedUnit,
  onInitiateUnitChange,
  onApplyUnitChange,
  onCancelConfirmUnit,
  isCalculatingConfirm,
  getUnitTypeAndClimateDisplay,
}: CheckinUnitChangeModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-3 sm:p-6 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-6xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-6 py-4 dark:border-slate-800 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400">
              <RepeatIcon className="size-4.5" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Sơ đồ kho 2D
              </h3>
              <div>
                <span className="inline-block rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 font-mono text-[11px] font-bold text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                  Ô hiện tại: {contract.unitCode}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
            title="Đóng sơ đồ"
          >
            <XIcon className="size-5" />
          </button>
        </div>

        {/* Modal Body: Sơ đồ kho 2D */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <StorageMap2D
            compact
            lockFacility
            facility={contractFacility}
            onFacilityChange={() => {}}
            currentFloor={mapFloor}
            onSelectFloor={(fl) => setMapFloor(fl)}
            selectedUnit={
              confirmingUnit
                ? { id: confirmingUnit.unitCode }
                : selectedUnit
                  ? { id: selectedUnit.unitCode }
                  : null
            }
            onSelectUnit={(u) => onInitiateUnitChange(u)}
            copyableUnitCode
            currentUnitCode={contract.unitCode}
          />
        </div>

        {/* Modal Footer: Thanh đối soát & chốt chọn ô */}
        {confirmingUnit && (
          <div className="border-t border-slate-200 bg-white p-3.5 sm:px-6 dark:border-slate-800 dark:bg-slate-900 animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">Đổi sang:</span>{" "}
                <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                  {confirmingUnit.unitCode}
                </span>{" "}
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  (
                  {getUnitTypeAndClimateDisplay(
                    confirmingUnit.unitCode,
                    confirmingUnit.typeName,
                    confirmingUnit.size,
                    confirmingUnit.isClimate,
                    confirmingUnit
                  )}
                  )
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onCancelConfirmUnit}
                  className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
                >
                  Bỏ chọn
                </button>
                <button
                  type="button"
                  onClick={onApplyUnitChange}
                  disabled={isCalculatingConfirm}
                  className="cursor-pointer rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition disabled:opacity-50"
                >
                  Xác nhận đổi ô
                </button>
              </div>
            </div>
          </div>
        )}

        {!confirmingUnit && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3 dark:border-slate-800 dark:bg-slate-850 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              {selectedUnit ? `Đang áp dụng ô đổi: ${selectedUnit.unitCode}` : "Chưa chọn ô kho thay thế"}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
            >
              Đóng sơ đồ
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
