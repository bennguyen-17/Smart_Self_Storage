import { useState } from "react"
import {
  CalendarPlusIcon,
  CheckCircle2Icon,
  KeyRoundIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { formatDate, formatVnd } from "@/lib/format"

import { checkinErrorMessage, renewAtCounter } from "../api/checkinApi"
import {
  RENEWAL_PACKAGES,
  renewalAmount,
  renewalPackageLabel,
} from "../lib/overdueRules"
import type { RenewAtCounterResponse } from "../types"
import type { CheckinTarget } from "./StaffCustomerDetailModal"
import ProtoModal from "./ProtoModal"

interface RenewAtCounterDialogProps {
  contract: CheckinTarget | null
  onClose: () => void
  onRenewed: (response: RenewAtCounterResponse) => void
}

/** US-20: Gia hạn hợp đồng tại quầy khi đang OVERDUE (BR-29). */
function RenewAtCounterDialog({
  contract,
  onClose,
  onRenewed,
}: RenewAtCounterDialogProps) {
  if (contract === null) return null
  return (
    <RenewAtCounterBody
      key={contract.reservationId}
      contract={contract}
      onClose={onClose}
      onRenewed={onRenewed}
    />
  )
}

function RenewAtCounterBody({
  contract,
  onClose,
  onRenewed,
}: {
  contract: CheckinTarget
  onClose: () => void
  onRenewed: (response: RenewAtCounterResponse) => void
}) {
  const [result, setResult] = useState<RenewAtCounterResponse | null>(null)

  function handleClose() {
    if (result) {
      onRenewed(result)
      return
    }
    onClose()
  }

  return (
    <ProtoModal
      open
      onClose={handleClose}
      title={result ? "Gia hạn tại quầy hoàn tất" : "Gia hạn tại quầy"}
      subtitle={`${contract.reservationCode} · ${contract.customerName ?? ""}`}
      icon={
        result ? (
          <CheckCircle2Icon className="size-5" />
        ) : (
          <CalendarPlusIcon className="size-5" />
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
  onSuccess: (response: RenewAtCounterResponse) => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [months, setMonths] = useState<number>(1)
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK_TRANSFER">(
    "CASH"
  )

  const unpaidPenalty = contract.unpaidPenaltyAmount ?? 0
  const blockedByPenalty = unpaidPenalty > 0
  const preview = renewalAmount(contract.monthlyPrice, months)

  async function handleConfirm() {
    if (blockedByPenalty) return
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      const response = await renewAtCounter(contract.reservationId, {
        months,
        paymentMethod,
      })
      toast.success("Gia hạn tại quầy thành công", {
        description: `Hợp đồng ${response.reservationCode ?? contract.reservationCode} đã về ACTIVE.`,
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
        <Row
          label="Hạn thuê hiện tại"
          value={formatDate(contract.reservationEndDate)}
        />
        <Row
          label="Số ngày quá hạn"
          value={`${contract.overdueDays ?? 0} ngày`}
        />
        <Row
          label="Phạt chưa nộp"
          value={formatVnd(unpaidPenalty)}
          strong={blockedByPenalty}
        />
        <Row
          label="Giá thuê / tháng"
          value={formatVnd(contract.monthlyPrice)}
        />
      </div>

      <div className="space-y-2">
        <div className="text-[10px] font-bold tracking-wider text-muted uppercase">
          Chọn thời hạn gia hạn (chuẩn 30 ngày/tháng)
        </div>
        <div className="flex flex-wrap gap-2">
          {RENEWAL_PACKAGES.map((option) => {
            const active = option === months
            return (
              <button
                key={option}
                type="button"
                onClick={() => setMonths(option)}
                aria-pressed={active}
                className={cn(
                  "cursor-pointer rounded-xl border px-3 py-1.5 text-[11px] font-extrabold shadow-sm transition",
                  active
                    ? "border-transparent bg-blue-600 text-white"
                    : "border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                )}
              >
                {renewalPackageLabel(option)}
              </button>
            )
          })}
        </div>
      </div>

      <div className="inner-box space-y-2 rounded-2xl border p-3.5 text-xs">
        <Row
          label="Tiền gia hạn dự kiến"
          value={preview == null ? "—" : formatVnd(preview)}
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
            <option value="BANK_TRANSFER">Chuyển khoản / Quẹt thẻ</option>
          </select>
        </div>
      </div>

      {blockedByPenalty && (
        <div className="flex items-start space-x-2 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
          <span>
            Còn <b>{formatVnd(unpaidPenalty)}</b> tiền phạt chưa nộp. Vui lòng
            thu phạt trước khi gia hạn tại quầy.
          </span>
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
          disabled={isSubmitting || blockedByPenalty || preview == null}
          className="flex flex-1 cursor-pointer items-center justify-center space-x-1.5 rounded-xl bg-blue-600 py-3 text-xs font-extrabold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-60"
        >
          <CalendarPlusIcon className="size-4" />
          <span>
            {isSubmitting
              ? "Đang xử lý..."
              : `Xác nhận gia hạn ${months} tháng`}
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
  result: RenewAtCounterResponse
  onDone: () => void
}) {
  return (
    <>
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-3.5 text-xs text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
        <div className="mb-1 flex items-center space-x-2 font-black">
          <CheckCircle2Icon className="size-4" />
          <span>Hợp đồng đã trở lại ACTIVE</span>
        </div>
        <p className="text-emerald-800/90 dark:text-emerald-300/90">
          Đã thu đủ tiền gia hạn, xuất hóa đơn EXT và khôi phục quyền sinh mã
          PIN 24/7 cho khách.
        </p>
      </div>

      <div className="inner-box space-y-2 rounded-2xl border p-3.5 text-xs">
        <Row label="Hợp đồng" value={result.reservationCode ?? "—"} />
        <Row label="Trạng thái hợp đồng" value={result.contractStatus ?? "—"} />
        <Row
          label="Hóa đơn gia hạn (EXT)"
          value={result.invoiceNumber ?? "—"}
        />
        <Row label="Chiết khấu" value={`${result.discountPercent ?? 0}%`} />
        <Row
          label="Đã thu tại quầy"
          value={formatVnd(result.amount ?? 0)}
          strong
        />
        <Row label="Hạn thuê mới" value={formatDate(result.newExpiryDate)} />
      </div>

      <div className="rounded-2xl border border-blue-300 bg-blue-50 p-3.5 text-xs dark:border-blue-800 dark:bg-blue-950/30">
        <div className="flex items-center space-x-1.5 font-black text-blue-700 dark:text-blue-400">
          <KeyRoundIcon className="size-3.5" />
          <span>Quyền ra vào đã mở lại</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-4 border-t border-blue-200 pt-1.5 dark:border-blue-900">
          <span className="text-muted">Mã PIN cổng 24/7</span>
          <span className="font-mono text-lg font-black tracking-widest text-blue-600 dark:text-blue-400">
            {result.gatePin ?? "—"}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted">
          Khách có thể sinh mã PIN mới trên Web Portal mỗi lần ra vào như bình
          thường.
        </p>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={onDone}
          className="w-full cursor-pointer rounded-xl bg-blue-600 py-3 text-xs font-extrabold text-white shadow-md transition hover:bg-blue-700"
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
            ? "text-base font-black text-blue-600 dark:text-blue-400"
            : "text-title font-bold"
        }
      >
        {value}
      </span>
    </div>
  )
}

export default RenewAtCounterDialog
