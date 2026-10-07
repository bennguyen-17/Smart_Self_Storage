import { useState } from "react"
import { KeyRoundIcon } from "lucide-react"
import { toast } from "sonner"

import { getErrorMessage } from "@/lib/api"
import { formatVnd } from "@/lib/format"

import { confirmCheckin } from "../api/checkinApi"
import { CHECKIN_HOURS, isWithinCheckinHours } from "../constants"
import type { CheckinContract } from "../types"
import ProtoModal from "./ProtoModal"

interface ConfirmCheckinDialogProps {
  contract: CheckinContract | null
  onClose: () => void
  onConfirmed: (updated: CheckinContract) => void
}

function ConfirmCheckinDialog({
  contract,
  onClose,
  onConfirmed,
}: ConfirmCheckinDialogProps) {
  return (
    <ProtoModal
      open={contract !== null}
      onClose={onClose}
      title="Xác nhận Check-in & Bàn giao kho"
      subtitle={contract ? `${contract.code} · ${contract.customerName}` : undefined}
      icon={<KeyRoundIcon className="size-5" />}
    >
      {contract && (
        <Body
          contract={contract}
          onClose={onClose}
          onConfirmed={onConfirmed}
        />
      )}
    </ProtoModal>
  )
}

function Body({
  contract,
  onClose,
  onConfirmed,
}: {
  contract: CheckinContract
  onClose: () => void
  onConfirmed: (updated: CheckinContract) => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const collectAmount = contract.remainingAmount
  const outsideHours = !isWithinCheckinHours()

  async function handleConfirm() {
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      const updated = await confirmCheckin(contract.code, {
        collectedAmount: collectAmount,
        paymentMethod: "CASH",
      })
      toast.success("Check-in thành công", {
        description: `Hợp đồng ${updated.code} đã chuyển sang ĐANG THUÊ. PIN cổng: ${updated.gatePin}`,
      })
      onConfirmed(updated)
    } catch (error) {
      setErrorMsg(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="inner-box space-y-2 rounded-2xl border p-3.5 text-xs">
        <Row
          label="Tiền thuê lần đầu (thu tại quầy)"
          value={formatVnd(contract.rentalAmount)}
        />
        <Row
          label="Tiền cọc đã thu (online)"
          value={formatVnd(contract.paidAmount)}
        />
        <Row
          label="Tổng cần thu tại quầy"
          value={formatVnd(collectAmount)}
          strong
        />
        <Row label="Hình thức thanh toán" value="Tiền mặt (CASH)" />
      </div>

      {outsideHours && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
          <b>Ngoài khung giờ Check-in (BR-19):</b> khung giờ bàn giao chuẩn là{" "}
          {CHECKIN_HOURS.start}:00 – {CHECKIN_HOURS.end}:00 hằng ngày. Vẫn có thể
          xác nhận nếu có thỏa thuận riêng với khách.
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
          disabled={isSubmitting}
          className="flex flex-1 cursor-pointer items-center justify-center space-x-1.5 rounded-xl bg-blue-600 py-3 text-xs font-extrabold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-60"
        >
          <KeyRoundIcon className="size-4" />
          <span>
            {isSubmitting
              ? "Đang xử lý..."
              : `Xác nhận thu ${formatVnd(collectAmount)}`}
          </span>
        </button>
      </div>
    </>
  )
}

function Row({
  label,
  value,
  strong,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-1.5 first:border-t-0 first:pt-0 dark:border-slate-800">
      <span className="text-muted">{label}</span>
      <span
        className={
          strong
            ? "text-base font-black text-blue-600 dark:text-blue-400"
            : "font-bold text-title"
        }
      >
        {value}
      </span>
    </div>
  )
}

export default ConfirmCheckinDialog
