import { useState } from "react"
import { CheckCircle2Icon, KeyRoundIcon } from "lucide-react"
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
  if (contract === null) return null
  // key theo reservationId để state `result` tự reset khi đổi hợp đồng.
  return (
    <CheckinDialogBody
      key={contract.reservationId}
      contract={contract}
      onClose={onClose}
      onConfirmed={onConfirmed}
    />
  )
}

/** US-17: sau khi bàn giao, hiển thị PIN đã kích hoạt và thông tin hoàn tất bàn giao trước khi đóng. */
function CheckinDialogBody({
  contract,
  onClose,
  onConfirmed,
}: {
  contract: CheckinTarget
  onClose: () => void
  onConfirmed: (response: StaffCheckInResponse) => void
}) {
  const [result, setResult] = useState<StaffCheckInResponse | null>(null)

  function handleClose() {
    if (result) {
      onConfirmed(result)
      return
    }
    onClose()
  }

  return (
    <ProtoModal
      open
      onClose={handleClose}
      title={
        result ? "Bàn giao kho hoàn tất" : "Xác nhận Check-in & Bàn giao kho"
      }
      subtitle={`${contract.reservationCode} · ${contract.customerName ?? ""}`}
      icon={
        result ? (
          <CheckCircle2Icon className="size-5" />
        ) : (
          <KeyRoundIcon className="size-5" />
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
  onSuccess: (response: StaffCheckInResponse) => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const collectAmount = contract.depRemainingAmount ?? 0
  const outsideHours = !isWithinCheckinHours()

  async function handleConfirm() {
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      const response = await confirmCheckin(contract.reservationId, {
        collectedAmount: collectAmount,
        paymentMethod: "CASH",
      })
      toast.success("Check-in thành công", {
        description: `Hợp đồng ${response.reservationCode ?? contract.reservationCode} đã chuyển sang ĐANG THUÊ.`,
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
        <Row label="Tổng giá trị hợp đồng" value={formatVnd(contract.depAmount)} />
        <Row label="Đã cọc online (100% Tiền cọc)" value={formatVnd(contract.depPaidAmount)} />
        <Row
          label="Tiền thuê cần thu tại quầy"
          value={formatVnd(collectAmount)}
          strong
        />
        <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-1.5 dark:border-slate-800">
          <span className="text-muted">Hình thức thanh toán</span>
          <span className="text-title font-bold">
            {collectAmount > 0 ? "Tiền mặt tại quầy" : "Đã thanh toán đủ online"}
          </span>
        </div>
      </div>

      {collectAmount <= 0 && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
          Khách hàng đã thanh toán đủ 100% tiền thuê &amp; cọc online. Bấm xác nhận để kích hoạt hợp đồng có hiệu lực và cấp mã PIN.
        </div>
      )}

      {outsideHours && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
          <b>Ngoài khung giờ Check-in:</b> khung giờ bàn giao quy định là{" "}
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
          disabled={isSubmitting}
          className="flex flex-1 cursor-pointer items-center justify-center space-x-1.5 rounded-xl bg-blue-600 py-3 text-xs font-extrabold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-60"
        >
          <KeyRoundIcon className="size-4" />
          <span>
            {isSubmitting
              ? "Đang xử lý..."
              : collectAmount > 0
                ? `Xác nhận thu ${formatVnd(collectAmount)} & Kích hoạt`
                : "Xác nhận bàn giao & Kích hoạt"}
          </span>
        </button>
      </div>
    </>
  )
}

/** US-17: xác nhận bàn giao — PIN đã kích hoạt và biên lai thanh toán. */
function SuccessPanel({
  result,
  onDone,
}: {
  result: StaffCheckInResponse
  onDone: () => void
}) {
  return (
    <>
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-3.5 text-xs text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
        <div className="mb-1 flex items-center space-x-2 font-black">
          <CheckCircle2Icon className="size-4" />
          <span>Đã thu đủ 100% tiền thuê & bàn giao kho</span>
        </div>
        <p className="text-emerald-800/90 dark:text-emerald-300/90">
          Hợp đồng đã chuyển ACTIVE và ô kho đã bàn giao cho khách. Email xác
          nhận và biên lai thanh toán đã được gửi đến khách hàng.
        </p>
      </div>

      <div className="inner-box space-y-2 rounded-2xl border p-3.5 text-xs">
        <Row label="Hợp đồng" value={result.reservationCode ?? "—"} />
        <Row label="Trạng thái hợp đồng" value={result.contractStatus ?? "—"} />
        <Row label="Trạng thái ô kho" value={result.unitStatus ?? "—"} />
        <Row
          label="Đã thu tại quầy"
          value={formatVnd(result.collectedAmount ?? 0)}
          strong
        />
      </div>

      <div className="rounded-2xl border border-blue-300 bg-blue-50 p-3.5 text-xs dark:border-blue-800 dark:bg-blue-950/30">
        <div className="text-[10px] font-bold tracking-wider text-blue-700 uppercase dark:text-blue-400">
          Bàn giao vật tư & kích hoạt PIN
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-4">
          <span className="text-muted">Chìa khóa cơ</span>
          <span className="text-title font-bold">Đã bàn giao</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-4 border-t border-blue-200 pt-1.5 dark:border-blue-900">
          <span className="text-muted">Mã PIN cổng 24/7</span>
          <span className="font-mono text-lg font-black tracking-widest text-blue-600 dark:text-blue-400">
            {result.gatePin ?? "—"}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted">
          PIN động 15 giây — khách bấm lấy mã mới trên Web Portal mỗi lần ra
          vào.
        </p>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={onDone}
          className="w-full cursor-pointer rounded-xl bg-blue-600 py-3 text-xs font-extrabold text-white shadow-md transition hover:bg-blue-700"
        >
          Hoàn tất & Đóng
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
            : "text-title font-bold"
        }
      >
        {value}
      </span>
    </div>
  )
}

export default ConfirmCheckinDialog
