import { useId, useState } from "react"
import { CheckCircle2Icon, FileCheck2Icon, ImageIcon, TriangleAlertIcon, UploadIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { getStoredUser } from "@/hooks/useAuthSession"
import { readableError } from "@/components/internal/readableError"
import { isMockMode } from "@/lib/apiClient"
import { formatVnd } from "@/lib/format"

import { confirmRefund } from "../api/refundApi"
import type { ConfirmRefundPayload } from "../types"
import { EVIDENCE_URL_MAX, getRefundBlockers, REFUND_BLOCKER_LABEL } from "../refundRules"

/** Ảnh biên lai mẫu, CHỈ dùng khi demo ở chế độ mock */
const MOCK_SAMPLE_EVIDENCE_URL =
  "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80"

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
 * Form hoàn cọc back-office: nhân viên chuyển khoản ngoài, đính kèm biên lai rồi xác nhận.
 * Nguyên tắc: thiếu dữ liệu thật (phiếu hoàn, STK khách, biên lai, nhân viên) thì hiện rõ là thiếu
 * và khóa nút xác nhận, không bao giờ tự điền giá trị mẫu.
 * Khi chạy thật, biên lai là LINK (BE chưa có API tải ảnh và chỉ lưu 255 ký tự); chọn file ảnh chỉ có khi demo.
 */
function RefundConfirmForm({
  paymentId,
  refundAmount,
  bankAccount,
  onConfirmed,
  submit = confirmRefund,
}: RefundConfirmFormProps) {
  const demo = isMockMode()
  const [evidenceUrl, setEvidenceUrl] = useState("")
  const [transactionRef, setTransactionRef] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const linkInputId = useId()
  const fileInputId = useId()
  const transactionInputId = useId()
  const staffInputId = useId()

  // Nhân viên thực hiện lấy từ phiên đăng nhập, không cho gõ tay để nhật ký đối soát đúng người
  const staffName = getStoredUser()?.fullName ?? null
  const blockers = getRefundBlockers({
    paymentId,
    bankAccount,
    evidenceUrl,
    allowDataUrl: demo,
    transactionRef,
    staffName,
  })
  const isImage = evidenceUrl.startsWith("data:image/") || evidenceUrl === MOCK_SAMPLE_EVIDENCE_URL

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setEvidenceUrl(reader.result)
        setErrorMsg(null)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (blockers.length > 0 || !paymentId) return
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      // Mã giao dịch là tùy chọn: lớp API chỉ gửi khi nhân viên có nhập
      await submit(paymentId, { evidenceUrl, transactionRef })
      onConfirmed()
    } catch (err) {
      setErrorMsg(readableError(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs outline-none placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:ring-1 focus:ring-amber-500"

  return (
    <div className="space-y-3.5 rounded-xl border border-amber-300 bg-amber-50/40 p-4 dark:border-amber-700 dark:bg-amber-950/20">
      <div className="flex items-center justify-between gap-2 border-b border-amber-200 pb-2.5 dark:border-amber-800">
        <div className="flex items-center gap-2">
          <FileCheck2Icon aria-hidden="true" className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <h4 className="text-sm font-bold text-amber-950 dark:text-amber-200">Hoàn tiền cọc cho khách</h4>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
              Chuyển khoản ngoài hệ thống, đính kèm biên lai rồi xác nhận để hoàn tất phiếu hoàn.
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-slate-950 shadow-xs">
          CHỜ XỬ LÝ
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 rounded-lg bg-white/80 p-3 text-xs dark:bg-slate-900/60 sm:grid-cols-2">
        <div>
          <span className="text-muted-foreground">Số tiền cọc hoàn lại:</span>
          <p className="text-sm font-black text-amber-600 dark:text-amber-400">{formatVnd(refundAmount)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Tài khoản thụ hưởng của khách:</span>
          {bankAccount ? (
            <p className="font-bold break-words text-slate-800 dark:text-slate-200">{bankAccount}</p>
          ) : (
            <p className="flex items-center gap-1 font-bold text-rose-700 dark:text-rose-300">
              <TriangleAlertIcon aria-hidden="true" className="size-3.5 shrink-0" />
              Chưa có số tài khoản. Liên hệ khách bổ sung trước khi chuyển khoản.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor={linkInputId} className="mb-1 block text-xs font-bold text-slate-800 dark:text-slate-200">
            Link biên lai chuyển khoản <span className="text-rose-500">*</span>
          </label>
          <input
            id={linkInputId}
            type="url"
            inputMode="url"
            value={isImage ? "" : evidenceUrl}
            maxLength={EVIDENCE_URL_MAX + 50}
            onChange={(e) => {
              setEvidenceUrl(e.target.value)
              setErrorMsg(null)
            }}
            placeholder="VD: https://drive.google.com/… (ảnh chụp ủy nhiệm chi)"
            aria-describedby={`${linkInputId}-hint`}
            className={inputClass}
          />
          <p id={`${linkInputId}-hint`} className="mt-0.5 text-[11px] text-muted-foreground">
            Tải ảnh biên lai lên Drive hoặc hệ thống lưu trữ của công ty, rồi dán link chia sẻ vào đây.
          </p>
        </div>

        {demo && (
          <div>
            <label htmlFor={fileInputId} className="mb-1 block text-[11px] font-semibold text-muted-foreground">
              Hoặc chọn ảnh biên lai từ máy (chỉ khi chạy demo):
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                id={fileInputId}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="text-xs file:mr-2 file:cursor-pointer file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-blue-500"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEvidenceUrl(MOCK_SAMPLE_EVIDENCE_URL)
                  setErrorMsg(null)
                }}
                className="text-xs"
              >
                <ImageIcon aria-hidden="true" className="mr-1 size-3.5" /> Dùng ảnh biên lai mẫu
              </Button>
            </div>
          </div>
        )}

        {isImage && (
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
            <img src={evidenceUrl} alt="Ảnh biên lai" className="h-16 w-24 rounded border object-cover" />
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
              <CheckCircle2Icon aria-hidden="true" className="size-3.5" /> Đã chọn ảnh biên lai
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div>
            <label htmlFor={staffInputId} className="mb-0.5 block text-[11px] font-semibold text-muted-foreground">
              Nhân viên thực hiện:
            </label>
            <input
              id={staffInputId}
              type="text"
              readOnly
              value={staffName ?? "Chưa đăng nhập"}
              className="w-full cursor-default rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
            />
          </div>
          <div>
            <label
              htmlFor={transactionInputId}
              className="mb-0.5 block text-[11px] font-semibold text-muted-foreground"
            >
              Mã giao dịch ngân hàng (tùy chọn):
            </label>
            <input
              id={transactionInputId}
              type="text"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="VD: FT2610028891"
              className={inputClass}
            />
          </div>
        </div>

        {blockers.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-white/70 p-2.5 text-xs dark:border-amber-800 dark:bg-slate-900/50">
            <p className="font-semibold text-amber-900 dark:text-amber-200">Cần bổ sung trước khi xác nhận:</p>
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

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || blockers.length > 0}
          className="w-full cursor-pointer bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-500"
        >
          {isSubmitting ? <Spinner className="mr-2 size-4" /> : <UploadIcon aria-hidden="true" className="mr-2 size-4" />}
          Xác nhận đã chuyển khoản hoàn cọc
        </Button>
      </div>
    </div>
  )
}

export default RefundConfirmForm
