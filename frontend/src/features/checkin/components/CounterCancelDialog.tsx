import { useState } from "react"
import { TriangleAlertIcon, XCircleIcon } from "lucide-react"
import { toast } from "sonner"

import { formatVnd } from "@/lib/format"

import { checkinErrorMessage, counterCancel } from "../api/checkinApi"
import { CANCEL_FORFEIT_RATE, CANCEL_POLICY_TEXT } from "../constants"
import type { StaffCancelReservationResponse } from "../types"
import type { CheckinTarget } from "./StaffCustomerDetailModal"
import ProtoModal from "./ProtoModal"

interface CounterCancelDialogProps {
  contract: CheckinTarget | null
  onClose: () => void
  onCanceled: (response: StaffCancelReservationResponse) => void
}

function CounterCancelDialog({
  contract,
  onClose,
  onCanceled,
}: CounterCancelDialogProps) {
  return (
    <ProtoModal
      open={contract !== null}
      onClose={onClose}
      title="Hủy hợp đồng tại quầy"
      subtitle={
        contract
          ? `${contract.reservationCode} · ${contract.customerName ?? ""}`
          : undefined
      }
      icon={<XCircleIcon className="size-5" />}
    >
      {contract && (
        <Body contract={contract} onClose={onClose} onCanceled={onCanceled} />
      )}
    </ProtoModal>
  )
}

function Body({
  contract,
  onClose,
  onCanceled,
}: {
  contract: CheckinTarget
  onClose: () => void
  onCanceled: (response: StaffCancelReservationResponse) => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Ước tính theo BR-17 (hủy tại quầy); BE là nơi tính con số cuối cùng.
  const paid = contract.depPaidAmount ?? 0
  const estimatedRefund = Math.round(paid * (1 - CANCEL_FORFEIT_RATE))
  const estimatedPenalty = paid - estimatedRefund

  async function handleConfirm() {
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      const response = await counterCancel(contract.reservationId)
      toast.success("Đã hủy tại quầy", {
        description: `Hoàn ${formatVnd(response.refundAmount)} · Quỹ phạt giữ ${formatVnd(response.penaltyAmount)}`,
      })
      onCanceled(response)
    } catch (error) {
      setErrorMsg(checkinErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="rounded-2xl border border-rose-300 bg-rose-50 p-3.5 text-xs text-rose-900 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200">
        <div className="mb-1 flex items-center space-x-2 font-black">
          <TriangleAlertIcon className="size-4" />
          <span>Khách mất 50% tiền cọc (BR-17)</span>
        </div>
        <ul className="list-disc space-y-1 pl-4 text-rose-800/90 dark:text-rose-300/90">
          {CANCEL_POLICY_TEXT.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <div className="inner-box space-y-2 rounded-2xl border p-3.5 text-xs">
        <Row label="Tiền cọc đã thu" value={formatVnd(paid)} />
        <Row
          label="Hoàn lại cho khách (dự kiến 50%)"
          value={formatVnd(estimatedRefund)}
          valueClass="text-emerald-600 dark:text-emerald-400"
        />
        <Row
          label="Ghi nhận quỹ phạt giữ chỗ (dự kiến 50%)"
          value={formatVnd(estimatedPenalty)}
          valueClass="text-rose-600 dark:text-rose-400"
        />
        <p className="pt-1 text-[11px] text-muted">
          * Số tiền cuối cùng do hệ thống tính lại (BR-17: hoàn 100% nếu hủy ≥ 4
          ngày trước ngày nhận kho).
        </p>
      </div>

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
          Giữ lại
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="flex flex-1 cursor-pointer items-center justify-center space-x-1.5 rounded-xl bg-rose-600 py-3 text-xs font-extrabold text-white shadow-md transition hover:bg-rose-700 disabled:opacity-60"
        >
          <XCircleIcon className="size-4" />
          <span>
            {isSubmitting ? "Đang xử lý..." : "Xác nhận hủy tại quầy"}
          </span>
        </button>
      </div>
    </>
  )
}

function Row({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-1.5 first:border-t-0 first:pt-0 dark:border-slate-800">
      <span className="text-muted">{label}</span>
      <span className={`font-bold ${valueClass ?? "text-title"}`}>{value}</span>
    </div>
  )
}

export default CounterCancelDialog
