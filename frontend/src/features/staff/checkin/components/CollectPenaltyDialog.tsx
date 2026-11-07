import { useState } from "react"
import { CheckCircle2Icon, ReceiptTextIcon } from "lucide-react"
import { toast } from "sonner"

import { formatVnd } from "@/lib/format"

import { checkinErrorMessage, collectPenalty } from "../api/checkinApi"
import { OVERDUE_PENALTY_PER_DAY, penaltyTotal } from "../lib/overdueRules"
import type { CollectPenaltyResponse } from "../types"
import type { CheckinTarget } from "./StaffCustomerDetailModal"
import ProtoModal from "@/features/staff/components/ProtoModal"

interface CollectPenaltyDialogProps {
  contract: CheckinTarget | null
  onClose: () => void
  onCollected: (response: CollectPenaltyResponse) => void
}

/** Thu tiền phạt quá hạn hợp đồng trực tiếp tại quầy. */
function CollectPenaltyDialog({
  contract,
  onClose,
  onCollected,
}: CollectPenaltyDialogProps) {
  if (contract === null) return null
  // key theo reservationId để state `result` tự reset khi đổi hợp đồng.
  return (
    <CollectPenaltyBody
      key={contract.reservationId}
      contract={contract}
      onClose={onClose}
      onCollected={onCollected}
    />
  )
}

function CollectPenaltyBody({
  contract,
  onClose,
  onCollected,
}: {
  contract: CheckinTarget
  onClose: () => void
  onCollected: (response: CollectPenaltyResponse) => void
}) {
  const [result, setResult] = useState<CollectPenaltyResponse | null>(null)

  function handleClose() {
    if (result) {
      onCollected(result)
      return
    }
    onClose()
  }

  return (
    <ProtoModal
      open
      onClose={handleClose}
      title={result ? "Đã thu phạt quá hạn" : "Thu phạt quá hạn tại quầy"}
      subtitle={`${contract.reservationCode} · ${contract.customerName ?? ""}`}
      icon={
        result ? (
          <CheckCircle2Icon className="size-5" />
        ) : (
          <ReceiptTextIcon className="size-5" />
        )
      }
    >
      {!result && (
        <Body contract={contract} onClose={onClose} onSuccess={setResult} />
      )}
      {result && <SuccessPanel result={result} onDone={handleClose} />}
    </ProtoModal>
  )
}

function Body({
  contract,
  onClose,
  onSuccess,
}: {
  contract: CheckinTarget
  onClose: () => void
  onSuccess: (response: CollectPenaltyResponse) => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const overdueDays = contract.overdueDays ?? 0
  const total = contract.unpaidPenaltyAmount ?? penaltyTotal(overdueDays)
  const canCollect = total > 0

  async function handleConfirm() {
    if (!canCollect) return
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      const response = await collectPenalty(contract.reservationId, {
        paymentMethod: "CASH",
      })
      toast.success("Thu phạt thành công", {
        description: `Đã xuất hóa đơn ${response.invoiceNumber ?? "PEN"} và gộp toàn bộ ngày phạt.`,
      })
      onSuccess(response)
    } catch (error) {
      setErrorMsg(checkinErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="inner-box space-y-2 rounded-2xl border p-3.5 text-xs">
        <Row label="Số ngày quá hạn" value={`${overdueDays} ngày`} />
        <Row
          label="Phí phạt mỗi ngày"
          value={formatVnd(OVERDUE_PENALTY_PER_DAY)}
        />
        <Row label="Tổng tiền phạt cần thu" value={formatVnd(total)} strong />
        <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-1.5 dark:border-slate-800">
          <span className="text-muted">Hình thức thanh toán</span>
          <span className="text-title font-bold">Tiền mặt</span>
        </div>
      </div>



      {!canCollect && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
          Không có khoản phạt nào đang chờ thu cho hợp đồng này.
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
          className="flex flex-1 cursor-pointer items-center justify-center space-x-1.5 rounded-xl bg-rose-600 py-3 text-xs font-extrabold text-white shadow-md transition hover:bg-rose-700 disabled:opacity-60"
        >
          <ReceiptTextIcon className="size-4" />
          <span>
            {isSubmitting
              ? "Đang xử lý..."
              : `Xác nhận thu ${formatVnd(total)}`}
          </span>
        </button>
      </div>
    </>
  )
}

function SuccessPanel({
  result,
  onDone,
}: {
  result: CollectPenaltyResponse
  onDone: () => void
}) {
  return (
    <>
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-3.5 text-xs text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
        <div className="mb-1 flex items-center space-x-2 font-black">
          <CheckCircle2Icon className="size-4" />
          <span>Đã thu đủ tiền phạt quá hạn</span>
        </div>
        <p className="text-emerald-800/90 dark:text-emerald-300/90">
          Các khoản phạt đã chuyển sang PAID và được gộp vào hóa đơn phạt duy
          nhất. Hợp đồng vẫn giữ trạng thái OVERDUE.
        </p>
      </div>

      <div className="inner-box space-y-2 rounded-2xl border p-3.5 text-xs">
        <Row label="Hợp đồng" value={result.reservationCode ?? "—"} />
        <Row label="Hóa đơn phạt (PEN)" value={result.invoiceNumber ?? "—"} />
        <Row
          label="Số ngày phạt đã thu"
          value={`${result.overdueDays ?? 0} ngày`}
        />
        <Row
          label="Đã thu tại quầy"
          value={formatVnd(result.collectedAmount ?? 0)}
          strong
        />
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
        <p>
          Đã thu đủ tiền phạt quá hạn và xuất hóa đơn. Khách hàng có thể tiếp tục thực hiện <b>Gia hạn tại quầy</b> nếu muốn tiếp tục thuê kho.
        </p>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={onDone}
          className="w-full cursor-pointer rounded-xl bg-rose-600 py-3 text-xs font-extrabold text-white shadow-md transition hover:bg-rose-700"
        >
          Hoàn tất &amp; Đóng
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
            ? "text-base font-black text-rose-600 dark:text-rose-400"
            : "text-title font-bold"
        }
      >
        {value}
      </span>
    </div>
  )
}

export default CollectPenaltyDialog
