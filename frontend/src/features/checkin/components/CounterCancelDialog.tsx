import { useState } from "react"
import { TriangleAlertIcon, XCircleIcon } from "lucide-react"
import { toast } from "sonner"

import { getErrorMessage } from "@/lib/api"
import { formatVnd } from "@/lib/format"

import { counterCancel } from "../api/checkinApi"
import { CANCEL_FORFEIT_RATE, CANCEL_POLICY_TEXT } from "../constants"
import type { CheckinContract, CounterCancelResult } from "../types"
import ProtoModal from "./ProtoModal"

interface CounterCancelDialogProps {
  contract: CheckinContract | null
  onClose: () => void
  onCanceled: (result: CounterCancelResult) => void
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
        contract ? `${contract.code} · ${contract.customerName}` : undefined
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
  contract: CheckinContract
  onClose: () => void
  onCanceled: (result: CounterCancelResult) => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const refundAmount = Math.round(
    contract.depositAmount * (1 - CANCEL_FORFEIT_RATE)
  )
  const forfeitedAmount = contract.depositAmount - refundAmount

  async function handleConfirm() {
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      const result = await counterCancel(contract.code, {
        reason: "COUNTER_CANCEL",
      })
      toast.success("Đã hủy tại quầy", {
        description: `Hoàn ${formatVnd(result.refundAmount)} · Quỹ phạt giữ ${formatVnd(result.forfeitedAmount)}`,
      })
      onCanceled(result)
    } catch (error) {
      setErrorMsg(getErrorMessage(error))
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
        <Row
          label="Tiền cọc đã thu"
          value={formatVnd(contract.depositAmount)}
        />
        <Row
          label="Hoàn lại cho khách (50%)"
          value={formatVnd(refundAmount)}
          valueClass="text-emerald-600 dark:text-emerald-400"
        />
        <Row
          label="Ghi nhận quỹ phạt giữ chỗ (50%)"
          value={formatVnd(forfeitedAmount)}
          valueClass="text-rose-600 dark:text-rose-400"
        />
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
            {isSubmitting
              ? "Đang xử lý..."
              : `Xác nhận hủy & hoàn ${formatVnd(refundAmount)}`}
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
