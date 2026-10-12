import { useId, useState } from "react"
import {
  CheckCircle2Icon,
  ExternalLinkIcon,
  FileCheck2Icon,
  ImageIcon,
  ImageOffIcon,
  TriangleAlertIcon,
  UploadIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { getStoredUser } from "@/hooks/useAuthSession"
import { getErrorMessage } from "@/lib/api"
import { isMockMode } from "@/lib/apiClient"
import { formatDateTime, formatVnd } from "@/lib/format"

import { confirmRefund } from "../api/reservationApi"
import { getRefundBlockers, REFUND_BLOCKER_LABEL } from "../refundRules"
import type { Reservation } from "../types"

/** Ảnh biên lai mẫu, CHỈ dùng khi demo ở chế độ mock */
const MOCK_SAMPLE_EVIDENCE_URL =
  "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80"

interface RefundBackOfficeSectionProps {
  reservation: Reservation
  onRefundSuccess: () => void
}

/**
 * Khối hoàn cọc back-office: nhân viên chuyển khoản ngoài, tải biên lai và xác nhận để đổi sang REFUNDED.
 * Nguyên tắc: thiếu dữ liệu thật (STK khách, biên lai, mã giao dịch, nhân viên) thì hiện rõ là thiếu
 * và khóa nút xác nhận, không bao giờ tự điền giá trị mẫu.
 */
function RefundBackOfficeSection({
  reservation,
  onRefundSuccess,
}: RefundBackOfficeSectionProps) {
  const [evidenceUrl, setEvidenceUrl] = useState("")
  const [transactionRef, setTransactionRef] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null)
  const fileInputId = useId()
  const transactionInputId = useId()
  const staffInputId = useId()

  // Nhân viên thực hiện lấy từ phiên đăng nhập, không cho gõ tay để nhật ký đối soát đúng người
  const staffName = getStoredUser()?.fullName ?? null
  const blockers = getRefundBlockers({
    bankAccount: reservation.bankAccount,
    evidenceUrl,
    transactionRef,
    staffName,
  })

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setEvidenceUrl(reader.result)
          setErrorMsg(null)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmitRefund = async () => {
    if (blockers.length > 0 || !staffName) return
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      // Mã giao dịch là tùy chọn: chỉ gửi khi nhân viên có nhập
      await confirmRefund(reservation.reservationCode, {
        evidenceUrl,
        note: transactionRef.trim() || undefined,
        staffName,
      })
      onRefundSuccess()
    } catch (err) {
      setErrorMsg(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (reservation.refundStatus === "REFUNDED") {
    const evidence = reservation.refundEvidenceUrl

    return (
      <div className="space-y-3 rounded-xl border border-emerald-300 bg-emerald-50/50 p-4 dark:border-emerald-800 dark:bg-emerald-950/20">
        <div className="flex items-center justify-between border-b border-emerald-200 pb-2.5 dark:border-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2Icon className="size-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                Chứng Từ Hoàn Cọc Đã Xác Nhận
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Đã chuyển khoản ngoài và đối soát chứng từ thành công
              </p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-xs">
            REFUNDED
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
          <div>
            <span className="text-muted-foreground">Số tiền đã hoàn:</span>
            <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">
              {formatVnd(reservation.refundAmount ?? 0)}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Thời điểm xác nhận:</span>
            <p className="font-semibold">{formatDateTime(reservation.refundedAt)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Nhân viên thực hiện:</span>
            <p className="font-semibold">{reservation.refundStaffName || "—"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Mã giao dịch / ghi chú đối soát:</span>
            <p className="font-semibold break-words">{reservation.refundNote || "—"}</p>
          </div>
        </div>

        {/* BẰNG CHỨNG BIÊN LAI / EVIDENCE IMAGE */}
        <div className="pt-2">
          <span className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
            Ảnh chụp biên lai ủy nhiệm chi (Evidence):
          </span>
          {evidence ? (
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setPreviewModalImg(evidence)}
                aria-label="Xem phóng to ảnh biên lai"
                className="group relative cursor-pointer overflow-hidden rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-sm transition hover:ring-2 hover:ring-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
              >
                <img
                  src={evidence}
                  alt="Biên lai chuyển khoản"
                  className="h-28 w-44 object-cover transition duration-200 group-hover:scale-105"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                  <span className="text-xs font-bold text-white flex items-center gap-1">
                    <ExternalLinkIcon className="size-3.5" /> Xem phóng to
                  </span>
                </span>
              </button>
              <p className="text-[11px] text-muted-foreground max-w-xs leading-relaxed">
                Biên lai đã được lưu trữ trong hồ sơ đối soát và gửi đính kèm email xác nhận cho khách hàng.
              </p>
            </div>
          ) : (
            <p className="flex items-center gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50/60 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
              <ImageOffIcon aria-hidden="true" className="size-4" />
              Chưa có ảnh biên lai trong hồ sơ. Cần bổ sung chứng từ để đối soát.
            </p>
          )}
        </div>

        {previewModalImg && (
          <div
            onClick={() => setPreviewModalImg(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
          >
            <div className="relative max-h-[90vh] max-w-xl overflow-hidden rounded-2xl bg-white p-2 dark:bg-slate-900 shadow-2xl">
              <img
                src={previewModalImg}
                alt="Phóng to biên lai"
                className="max-h-[80vh] w-auto rounded-lg object-contain"
              />
              <div className="p-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-400">
                Nhấp bất kỳ đâu để đóng
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Khi PENDING: Giao diện cho nhân viên tải ảnh và xác nhận
  return (
    <div className="space-y-3.5 rounded-xl border border-amber-300 bg-amber-50/40 p-4 dark:border-amber-700 dark:bg-amber-950/20">
      <div className="flex items-center justify-between border-b border-amber-200 pb-2.5 dark:border-amber-800">
        <div className="flex items-center gap-2">
          <FileCheck2Icon className="size-5 text-amber-600 dark:text-amber-400" />
          <div>
            <h4 className="text-sm font-bold text-amber-950 dark:text-amber-200">
              Quy Trình Hoàn Tiền Cọc Back-office
            </h4>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
              Chuyển khoản bên ngoài và tải biên lai xác nhận chuyển trạng thái sang REFUNDED
            </p>
          </div>
        </div>
        <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-slate-950 shadow-xs">
          CHỜ XỬ LÝ
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 rounded-lg bg-white/80 p-3 text-xs dark:bg-slate-900/60 sm:grid-cols-2">
        <div>
          <span className="text-muted-foreground">Số tiền cọc hoàn lại:</span>
          <p className="text-sm font-black text-amber-600 dark:text-amber-400">
            {formatVnd(
              reservation.refundAmount ??
                (reservation.depositAmount - (reservation.forfeitedAmount ?? 0))
            )}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Tài khoản thụ hưởng của khách:</span>
          {reservation.bankAccount ? (
            <p className="font-bold text-slate-800 dark:text-slate-200">
              {reservation.bankAccount}
            </p>
          ) : (
            <p className="flex items-center gap-1 font-bold text-rose-700 dark:text-rose-300">
              <TriangleAlertIcon aria-hidden="true" className="size-3.5 shrink-0" />
              Chưa có số tài khoản. Liên hệ khách bổ sung trước khi chuyển khoản.
            </p>
          )}
        </div>
      </div>

      {/* FORM UPLOAD EVIDENCE & CONFIRM */}
      <div className="space-y-3">
        <div>
          <label
            htmlFor={fileInputId}
            className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1"
          >
            Tải lên ảnh chụp biên lai chuyển khoản (Evidence Upload):{" "}
            <span className="text-rose-500">*</span>
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              id={fileInputId}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white file:cursor-pointer hover:file:bg-blue-500"
            />
            {isMockMode() && (
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
                <ImageIcon className="size-3.5 mr-1" /> Dùng ảnh biên lai mẫu (demo)
              </Button>
            )}
          </div>
        </div>

        {evidenceUrl && (
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
            <img
              src={evidenceUrl}
              alt="Ảnh biên lai"
              className="h-16 w-24 rounded object-cover border"
            />
            <div className="text-xs">
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2Icon className="size-3.5" /> Đã chọn ảnh biên lai
              </span>
              <p className="text-[11px] text-muted-foreground">
                Sẵn sàng lưu vào hồ sơ đối soát của đơn cọc.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div>
            <label
              htmlFor={staffInputId}
              className="block text-[11px] font-semibold text-muted-foreground mb-0.5"
            >
              Nhân viên thực hiện:
            </label>
            <input
              id={staffInputId}
              type="text"
              readOnly
              value={staffName ?? "Chưa đăng nhập"}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 outline-none cursor-default"
            />
          </div>
          <div>
            <label
              htmlFor={transactionInputId}
              className="block text-[11px] font-semibold text-muted-foreground mb-0.5"
            >
              Mã giao dịch ngân hàng (tùy chọn):
            </label>
            <input
              id={transactionInputId}
              type="text"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="VD: FT2610028891"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs outline-none placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {blockers.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-white/70 p-2.5 text-xs dark:border-amber-800 dark:bg-slate-900/50">
            <p className="font-semibold text-amber-900 dark:text-amber-200">
              Cần bổ sung trước khi xác nhận:
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-amber-800 dark:text-amber-300">
              {blockers.map((b) => (
                <li key={b}>{REFUND_BLOCKER_LABEL[b]}</li>
              ))}
            </ul>
          </div>
        )}

        {errorMsg && (
          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
            {errorMsg}
          </p>
        )}

        <Button
          type="button"
          onClick={handleSubmitRefund}
          disabled={isSubmitting || blockers.length > 0}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 cursor-pointer"
        >
          {isSubmitting ? (
            <Spinner className="size-4 mr-2" />
          ) : (
            <UploadIcon className="size-4 mr-2" />
          )}
          Xác nhận đã chuyển khoản & Lưu biên lai hoàn cọc
        </Button>
      </div>
    </div>
  )
}

export default RefundBackOfficeSection
