import { useId, useState } from "react"
import { FileCheck2Icon, TriangleAlertIcon, UploadIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { getStoredUser } from "@/hooks/useAuthSession"
import { readableError } from "@/components/internal/readableError"
import ImagePicker, { type PickedImage } from "@/components/internal/images/ImagePicker"
import { formatVnd } from "@/lib/format"

import { confirmRefund } from "../api/refundApi"
import type { ConfirmRefundPayload } from "../types"
import { EVIDENCE_URL_MAX, getRefundBlockers, REFUND_BLOCKER_LABEL } from "../refundRules"

export interface RefundConfirmFormProps {
  /** paymentId của phiếu hoàn tiền (hóa đơn REF); thiếu thì không xác nhận được */
  paymentId: number | null | undefined
  refundAmount: number
  /** "STK (Ngân hàng) - Chủ TK" lấy từ BE; null nghĩa là khách chưa cung cấp */
  bankAccount: string | null | undefined
  onConfirmed: () => void
  /** Hàm gửi xác nhận; mặc định là API của Staff. Cổng Manager truyền hàm của mình */
  submit?: (paymentId: number, payload: ConfirmRefundPayload) => Promise<void>
}

/**
 * Form hoàn cọc: Chuyển khoản ngoài hệ thống, đính kèm biên lai rồi xác nhận.
 * Bố cục gọn gàng, tinh tế, bỏ trường mã giao dịch ngân hàng theo yêu cầu.
 */
function RefundConfirmForm({
  paymentId,
  refundAmount,
  bankAccount,
  onConfirmed,
  submit = confirmRefund,
}: RefundConfirmFormProps) {
  const [receipt, setReceipt] = useState<PickedImage[]>([])
  const [evidenceUrl, setEvidenceUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const linkInputId = useId()
  const staffInputId = useId()

  // Nhân viên thực hiện lấy từ phiên đăng nhập
  const staffName = getStoredUser()?.fullName ?? null
  const blockers = getRefundBlockers({
    paymentId,
    bankAccount,
    evidenceUrl,
    receiptImageId: receipt[0]?.imageId ?? null,
    transactionRef: "",
    staffName,
  })

  const handleSubmit = async () => {
    if (blockers.length > 0 || !paymentId) return
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      await submit(paymentId, {
        receiptImageId: receipt[0]?.imageId ?? null,
        evidenceUrl,
        transactionRef: "",
      })
      onConfirmed()
    } catch (err) {
      setErrorMsg(readableError(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs outline-none placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:ring-1 focus:ring-amber-500"

  return (
    <div className="space-y-4 pt-1">
      {/* 1. Thẻ tóm tắt thông tin hoàn cọc */}
      <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 to-amber-100/40 p-4 dark:border-amber-800/60 dark:from-amber-950/30 dark:to-amber-900/20 space-y-3.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400">
              <FileCheck2Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Số tiền hoàn lại
              </p>
              <p className="text-xl font-black text-amber-600 dark:text-amber-400">
                {formatVnd(refundAmount)}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 border border-amber-500/30">
            Chờ xử lý
          </span>
        </div>

        {/* Thông tin tài khoản nhận tiền */}
        <div className="rounded-xl bg-white/90 p-3.5 text-xs dark:bg-slate-900/80 border border-amber-200/60 dark:border-amber-900/40 shadow-2xs">
          <span className="font-semibold text-slate-500 dark:text-slate-400 block mb-1">
            Tài khoản thụ hưởng của khách:
          </span>
          {bankAccount ? (
            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-relaxed break-words">
              {bankAccount}
            </p>
          ) : (
            <p className="flex items-center gap-1.5 font-semibold text-rose-600 dark:text-rose-400">
              <TriangleAlertIcon className="h-4 w-4 shrink-0" />
              Chưa có số tài khoản. Liên hệ khách hàng bổ sung trước khi chuyển khoản.
            </p>
          )}
        </div>
      </div>

      {/* 2. Khu vực tải ảnh biên lai */}
      <div className="space-y-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 shadow-2xs">
        <ImagePicker
          label="Ảnh biên lai chuyển khoản"
          category="REFUND_RECEIPT"
          max={1}
          value={receipt}
          onChange={(next) => {
            setReceipt(next)
            setErrorMsg(null)
          }}
          disabled={isSubmitting}
        />

        {receipt.length === 0 && (
          <details className="text-xs">
            <summary className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer font-semibold transition select-none">
              Không tải được ảnh? Dán link biên lai
            </summary>
            <div className="mt-2 space-y-1">
              <label htmlFor={linkInputId} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Link biên lai chuyển khoản
              </label>
              <input
                id={linkInputId}
                type="url"
                inputMode="url"
                value={evidenceUrl}
                maxLength={EVIDENCE_URL_MAX + 50}
                onChange={(e) => {
                  setEvidenceUrl(e.target.value)
                  setErrorMsg(null)
                }}
                placeholder="VD: https://drive.google.com/… (link ảnh ủy nhiệm chi)"
                className={inputClass}
              />
            </div>
          </details>
        )}

        {/* Thông tin nhân viên thực hiện */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <label htmlFor={staffInputId} className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
            Nhân viên thực hiện:
          </label>
          <input
            id={staffInputId}
            type="text"
            readOnly
            value={staffName ?? "Chưa đăng nhập"}
            className="w-full cursor-default rounded-xl border border-slate-200 bg-slate-100/80 px-3 py-2 text-xs font-semibold text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
          />
        </div>
      </div>

      {/* 3. Cảnh báo bổ sung nếu còn thiếu */}
      {blockers.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs dark:border-amber-800 dark:bg-amber-950/30">
          <p className="font-bold text-amber-900 dark:text-amber-200">Cần bổ sung trước khi xác nhận:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-amber-800 dark:text-amber-300">
            {blockers.map((b) => (
              <li key={b}>{REFUND_BLOCKER_LABEL[b]}</li>
            ))}
          </ul>
        </div>
      )}

      {errorMsg && (
        <p role="alert" className="[overflow-wrap:anywhere] text-xs font-semibold text-rose-600 dark:text-rose-400">
          {errorMsg}
        </p>
      )}

      {/* 4. Nút bấm Xác nhận */}
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting || blockers.length > 0}
        className="w-full cursor-pointer rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? <Spinner className="mr-2 size-4" /> : <UploadIcon aria-hidden="true" className="mr-2 size-4" />}
        Xác nhận đã chuyển khoản hoàn cọc
      </Button>
    </div>
  )
}

export default RefundConfirmForm
