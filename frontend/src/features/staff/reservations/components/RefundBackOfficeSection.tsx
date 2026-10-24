import { useState } from "react"
import { CheckCircle2Icon, ExternalLinkIcon, ImageOffIcon } from "lucide-react"

import { formatDateTime, formatVnd } from "@/lib/format"

import type { Reservation } from "../types"
import RefundConfirmForm from "./RefundConfirmForm"

interface RefundBackOfficeSectionProps {
  reservation: Reservation
  onRefundSuccess: () => void
}

/**
 * Khối hoàn cọc trong chi tiết đơn: đã hoàn thì hiện chứng từ đối soát,
 * còn chờ hoàn thì hiện form xác nhận (dùng chung với hàng đợi "Hoàn cọc chờ xử lý").
 */
function RefundBackOfficeSection({
  reservation,
  onRefundSuccess,
}: RefundBackOfficeSectionProps) {
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null)

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
            Ảnh chụp biên lai ủy nhiệm chi:
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

  // Khi PENDING: nhân viên chuyển khoản ngoài, đính kèm biên lai và xác nhận
  return (
    <RefundConfirmForm
      paymentId={reservation.refundPaymentId}
      refundAmount={
        reservation.refundAmount ??
        reservation.depositAmount - (reservation.forfeitedAmount ?? 0)
      }
      bankAccount={reservation.bankAccount}
      onConfirmed={onRefundSuccess}
    />
  )
}

export default RefundBackOfficeSection
