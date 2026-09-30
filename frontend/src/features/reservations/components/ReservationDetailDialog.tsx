import { useState } from "react"
import { InfoIcon, MailIcon, RotateCwIcon } from "lucide-react"

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

import { getReservation } from "../api/reservationApi"
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
          />
          <DetailFields reservation={data} />

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

export default ReservationDetailDialog
