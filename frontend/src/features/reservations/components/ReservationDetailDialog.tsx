import { useState } from "react"
import {
  CheckCircle2Icon,
  ExternalLinkIcon,
  FileCheck2Icon,
  ImageIcon,
  InfoIcon,
  MailIcon,
  RotateCwIcon,
  UploadIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { useAsyncData } from "@/hooks/useAsyncData"
import { formatDate, formatDateTime, formatVnd } from "@/lib/format"

import { confirmRefund, getReservation } from "../api/reservationApi"
import { NO_SHOW_REASON_TEXT, NO_SHOW_RULES } from "../constants"
import type { Reservation } from "../types"
import NoShowEmailPreview from "./NoShowEmailPreview"
import ReservationStatusBadge from "./ReservationStatusBadge"

interface ReservationDetailDialogProps {
  /** Mã đơn đang xem; null = đóng dialog */
  reservationCode: string | null
  onClose: () => void
}

function ReservationDetailDialog({
  reservationCode,
  onClose,
}: ReservationDetailDialogProps) {
  // Giữ mã cuối cùng để nội dung không bị trống trong lúc dialog chạy hiệu ứng đóng
  const [lastCode, setLastCode] = useState(reservationCode)
  if (reservationCode !== null && reservationCode !== lastCode) {
    setLastCode(reservationCode)
  }

  return (
    <Dialog
      open={reservationCode !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {lastCode && <DetailBody key={lastCode} code={lastCode} />}
      </DialogContent>
    </Dialog>
  )
}

function DetailBody({ code }: { code: string }) {
  const [reloadCount, setReloadCount] = useState(0)
  const [showEmail, setShowEmail] = useState(false)
  const { data, error, isLoading } = useAsyncData(
    `${code}#${reloadCount}`,
    () => getReservation(code)
  )

  return (
    <>
      <DialogHeader>
        <DialogTitle>Chi tiết đơn đặt cọc {code}</DialogTitle>
        <DialogDescription>
          Thông tin đầy đủ của đơn, chỉ hiển thị cho nhân viên có quyền.
        </DialogDescription>
      </DialogHeader>

      {isLoading && (
        <div className="flex items-center gap-2 py-8 text-muted-foreground">
          <Spinner /> Đang tải chi tiết đơn…
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Không tải được chi tiết đơn</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            {error}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReloadCount((n) => n + 1)}
            >
              <RotateCwIcon aria-hidden="true" /> Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {data && (
        <div className="space-y-4">
          <ReservationStatusBadge
            status={data.status}
            cancelReason={data.cancelReason}
            refundStatus={data.refundStatus}
          />
          <DetailFields reservation={data} />

          {/* QUY TRÌNH HOÀN TIỀN BACK-OFFICE (BR-35) */}
          {data.status === "CANCELED" &&
            (data.cancelReason === "CUSTOMER_REQUEST" ||
              (data.refundAmount !== undefined &&
                data.refundAmount !== null &&
                data.refundAmount > 0) ||
              data.refundStatus === "PENDING" ||
              data.refundStatus === "REFUNDED") && (
              <RefundBackOfficeSection
                reservation={data}
                onRefundSuccess={() => setReloadCount((n) => n + 1)}
              />
            )}

          {data.cancelReason === "NO_SHOW" && (
            <>
              <Alert variant="destructive">
                <InfoIcon aria-hidden="true" />
                <AlertTitle>Lý do hủy</AlertTitle>
                <AlertDescription>
                  <p className="font-medium">{NO_SHOW_REASON_TEXT}</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
                    {NO_SHOW_RULES.map((rule) => (
                      <li key={rule}>{rule}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>

              <Button
                variant="outline"
                onClick={() => setShowEmail((v) => !v)}
                aria-expanded={showEmail}
              >
                <MailIcon aria-hidden="true" />
                {showEmail ? "Ẩn mẫu email" : "Xem mẫu email gửi khách"}
              </Button>
              {showEmail && <NoShowEmailPreview reservation={data} />}
            </>
          )}
        </div>
      )}
    </>
  )
}

function DetailFields({ reservation: r }: { reservation: Reservation }) {
  const fields: [string, string][] = [
    ["Mã đặt chỗ", r.reservationCode],
    ["Khách hàng", r.customerName],
    ["Email", r.customerEmail],
    ["Số CCCD", r.cccd],
    ["Cơ sở", `${r.facilityName} (${r.facilityCode})`],
    ["Ô kho", r.unitCode],
    ["Ngày hẹn nhận kho", formatDate(r.checkinDate)],
    ["Tiền cọc đã nộp", formatVnd(r.depositAmount)],
    ["Ngày tạo đơn", formatDateTime(r.createdAt)],
  ]
  if (r.status === "CANCELED") {
    fields.push(
      ["Tiền cọc đã tịch thu", formatVnd(r.forfeitedAmount)],
      [
        r.cancelReason === "NO_SHOW"
          ? "Thời điểm hệ thống tự động hủy"
          : "Thời điểm hủy",
        formatDateTime(r.canceledAt),
      ]
    )
    if (r.refundAmount !== undefined && r.refundAmount !== null && r.refundAmount > 0) {
      fields.push(
        ["Tiền cọc hoàn trả", formatVnd(r.refundAmount)],
        ["Tài khoản thụ hưởng", r.bankAccount || "Chưa cập nhật"],
        [
          "Trạng thái hoàn tiền",
          r.refundStatus === "REFUNDED"
            ? "ĐÃ HOÀN TIỀN (REFUNDED)"
            : "CHỜ ĐỐI SOÁT (PENDING)",
        ]
      )
    }
  }

  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 rounded-lg border p-4 sm:grid-cols-2">
      {fields.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="font-medium break-words">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Component xử lý hoàn cọc Back-office & Upload biên lai đối soát (BR-35) */
function RefundBackOfficeSection({
  reservation,
  onRefundSuccess,
}: {
  reservation: Reservation
  onRefundSuccess: () => void
}) {
  const [evidenceUrl, setEvidenceUrl] = useState("")
  const [staffName, setStaffName] = useState("Trần Thị Thu (Kế toán Back-office)")
  const [note, setNote] = useState("FT2610048891 - Đã chuyển khoản hoàn cọc ngoài qua Internet Banking")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null)

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

  const handleUseSampleEvidence = () => {
    setEvidenceUrl(
      "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80"
    )
    setErrorMsg(null)
  }

  const handleSubmitRefund = async () => {
    if (!evidenceUrl) {
      setErrorMsg("Vui lòng tải lên ảnh chụp biên lai/ủy nhiệm chi chuyển khoản thành công trước khi bấm xác nhận!")
      return
    }
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      await confirmRefund(reservation.reservationCode, {
        evidenceUrl,
        note,
        staffName,
      })
      onRefundSuccess()
    } catch (err: any) {
      setErrorMsg(err?.message || "Có lỗi xảy ra khi xác nhận hoàn tiền")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (reservation.refundStatus === "REFUNDED") {
    const displayImg =
      reservation.refundEvidenceUrl ||
      "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80"

    return (
      <div className="space-y-3 rounded-xl border border-emerald-300 bg-emerald-50/50 p-4 dark:border-emerald-800 dark:bg-emerald-950/20">
        <div className="flex items-center justify-between border-b border-emerald-200 pb-2.5 dark:border-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2Icon className="size-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                Chứng Từ Hoàn Cọc Đã Xác Nhận (BR-35)
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
            <p className="font-semibold">{reservation.refundStaffName || "Kế toán Back-office"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Ghi chú đối soát:</span>
            <p className="font-semibold break-words">{reservation.refundNote || "Đã kiểm tra và lưu chứng từ"}</p>
          </div>
        </div>

        {/* BẰNG CHỨNG BIÊN LAI / EVIDENCE IMAGE */}
        <div className="pt-2">
          <span className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
            Ảnh chụp biên lai ủy nhiệm chi (Evidence):
          </span>
          <div className="flex items-start gap-3">
            <div
              onClick={() => setPreviewModalImg(displayImg)}
              className="group relative cursor-pointer overflow-hidden rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-sm transition hover:ring-2 hover:ring-emerald-500"
            >
              <img
                src={displayImg}
                alt="Biên lai chuyển khoản"
                className="h-28 w-44 object-cover transition duration-200 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  <ExternalLinkIcon className="size-3.5" /> Xem phóng to
                </span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground max-w-xs leading-relaxed">
              Biên lai đã được lưu trữ vĩnh viễn trong nhật ký đối soát kiểm toán và gửi đính kèm email xác nhận cho khách hàng.
            </p>
          </div>
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
              Quy Trình Hoàn Tiền Cọc Back-office (BR-35)
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
          <p className="font-bold text-slate-800 dark:text-slate-200">
            {reservation.bankAccount ||
              "190367891234 (Techcombank) - " + reservation.customerName}
          </p>
        </div>
      </div>

      {/* FORM UPLOAD EVIDENCE & CONFIRM */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
            Tải lên ảnh chụp biên lai chuyển khoản (Evidence Upload):{" "}
            <span className="text-rose-500">*</span>
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white file:cursor-pointer hover:file:bg-blue-500"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUseSampleEvidence}
              className="text-xs"
            >
              <ImageIcon className="size-3.5 mr-1" /> Dùng ảnh biên lai mẫu
            </Button>
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
                Sẵn sàng lưu vào hồ sơ đối soát kiểm toán của đơn cọc.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-0.5">
              Nhân viên thực hiện:
            </label>
            <input
              type="text"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-0.5">
              Mã giao dịch ngân hàng / Ghi chú:
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {errorMsg && (
          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
            {errorMsg}
          </p>
        )}

        <Button
          type="button"
          onClick={handleSubmitRefund}
          disabled={isSubmitting}
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

export default ReservationDetailDialog
