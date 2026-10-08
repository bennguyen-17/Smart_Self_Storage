import { useState } from "react"
import { KeyRoundIcon } from "lucide-react"
import { toast } from "sonner"

import { formatVnd } from "@/lib/format"

import { checkinErrorMessage, confirmCheckin } from "../api/checkinApi"
import { CHECKIN_HOURS, isWithinCheckinHours } from "../constants"
import type { StaffCheckInResponse } from "../types"
import type { CheckinTarget } from "./StaffCustomerDetailModal"
import ProtoModal from "./ProtoModal"

interface ConfirmCheckinDialogProps {
  contract: CheckinTarget | null
  onClose: () => void
  onConfirmed: (response: StaffCheckInResponse) => void
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
      subtitle={
        contract
          ? `${contract.reservationCode} · ${contract.customerName ?? ""}`
          : undefined
      }
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
  contract: CheckinTarget
  onClose: () => void
  onConfirmed: (response: StaffCheckInResponse) => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK_TRANSFER">(
    "CASH"
  )

  const collectAmount = contract.depRemainingAmount ?? 0
  const canCollect = collectAmount > 0
  const outsideHours = !isWithinCheckinHours()

  async function handleConfirm() {
    if (!canCollect) return
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      const response = await confirmCheckin(contract.reservationId, {
        collectedAmount: collectAmount,
        paymentMethod,
      })
      toast.success("Check-in thành công", {
        description: `Hợp đồng ${response.reservationCode ?? contract.reservationCode} đã chuyển sang ĐANG THUÊ.`,
      })
      onConfirmed(response)
    } catch (error) {
      setErrorMsg(checkinErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="inner-box space-y-2 rounded-2xl border p-3.5 text-xs">
        <Row label="Tổng tiền (DEP)" value={formatVnd(contract.depAmount)} />
        <Row label="Đã thu" value={formatVnd(contract.depPaidAmount)} />
        <Row
          label="Tổng cần thu tại quầy"
          value={formatVnd(collectAmount)}
          strong
        />
        <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-1.5 dark:border-slate-800">
          <span className="text-muted">Hình thức thanh toán</span>
          <select
            value={paymentMethod}
            onChange={(event) =>
              setPaymentMethod(event.target.value as "CASH" | "BANK_TRANSFER")
            }
            className="portal-input h-8 rounded-lg border px-2.5 text-xs outline-none"
          >
            <option value="CASH">Tiền mặt (CASH)</option>
            <option value="BANK_TRANSFER">Chuyển khoản (BANK_TRANSFER)</option>
          </select>
        </div>
      </div>

      {!canCollect && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
          Hợp đồng không có khoản nào cần thu (DEP remaining ≤ 0) → không thể
          check-in.
        </div>
      )}

      {outsideHours && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
          <b>Ngoài khung giờ Check-in (BR-19):</b> khung giờ bàn giao chuẩn là{" "}
          {CHECKIN_HOURS.start}:00 – {CHECKIN_HOURS.end}:00 hằng ngày.
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
          disabled={isSubmitting || !canCollect}
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
