import {
  InboxIcon,
} from "lucide-react"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/api"
import StaffShiftRequiredCard from "@/features/staff/components/StaffShiftRequiredCard"
import { cn } from "cn"

import {
  SIZE_AREA_M2,
  unitSizeFromCode,
} from "@/features/floorplan/unitDisplay"
import { formatDate } from "@/lib/format"

import type { StaffReservationItem } from "../types"

interface CheckinContractTableProps {
  rows: StaffReservationItem[] | undefined
  isLoading: boolean
  error: string | undefined
  onRetry: () => void
  onOpenDetail?: (item: StaffReservationItem) => void
  onCheckin: (item: StaffReservationItem) => void
  onCheckout: (item: StaffReservationItem) => void
  /** US-20: mở dialog thu phạt quá hạn tại quầy */
  onCollectPenalty: (item: StaffReservationItem) => void
  /** US-20: mở dialog gia hạn tại quầy */
  onRenew: (item: StaffReservationItem) => void
  /** unitCode → nhãn "Size M (3m²)" để hiển thị cạnh vị trí kho */
  unitMeta?: Record<string, string>
}

/** Dòng phụ dưới mã HĐ (bám prototype) */
function codeSubtitle(item: StaffReservationItem): string | null {
  if (item.contractStatus === "TERMINATED") return "Hợp đồng đã thanh lý"
  if (item.contractStatus === "CANCELLED") return "Đã hoàn tiền cọc"
  return null
}

/** Nhãn size dự phòng từ mã ô kho ("F2-M205" → "Size M (3m²)") khi chưa tải được danh sách ô. */
function sizeMetaFromCode(unitCode: string): string | undefined {
  const size = unitSizeFromCode(unitCode)
  return size ? `Size ${size} (${SIZE_AREA_M2[size]}m²)` : undefined
}

/** Bảng hợp đồng 4 cột */
function CheckinContractTable({
  rows,
  isLoading,
  error,
  onRetry,
  onOpenDetail,
  onCheckin,
  onCheckout,
  onCollectPenalty,
  onRenew,
  unitMeta,
}: CheckinContractTableProps) {
  if (error) {
    const isShiftError =
      error.toLowerCase().includes("bắt đầu ca") ||
      error.toLowerCase().includes("ca được phân công")

    if (isShiftError) {
      return <StaffShiftRequiredCard onStarted={onRetry} />
    }

    return (
      <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
        <p className="font-bold">Không tải được danh sách hợp đồng</p>
        <p className="mt-1 text-xs">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 cursor-pointer rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-rose-700"
        >
          Thử lại
        </button>
      </div>
    )
  }

  return (
    <div className="card-box relative overflow-x-auto rounded-2xl border border-slate-200/80 shadow-sm dark:border-slate-800">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            <th scope="col" className="py-3 px-4 text-center whitespace-nowrap">Mã Hợp Đồng</th>
            <th scope="col" className="py-3 px-3 text-center whitespace-nowrap">Thông tin Khách hàng</th>
            <th scope="col" className="py-3 px-3 text-center whitespace-nowrap">Mã kho</th>
            <th scope="col" className="py-3 px-3 text-center whitespace-nowrap">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
          {isLoading &&
            Array.from({ length: 4 }, (_, i) => (
              <tr key={i} className="border-b last:border-0">
                {Array.from({ length: 4 }, (_, j) => (
                  <td key={j} className="py-3.5 px-3 text-center">
                    <div className="mx-auto h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  </td>
                ))}
              </tr>
            ))}

          {!isLoading && rows?.length === 0 && (
            <tr>
              <td colSpan={4} className="py-12 px-4 text-center">
                <InboxIcon className="mx-auto mb-2 size-8 text-slate-400 dark:text-slate-500" />
                <p className="font-semibold text-slate-600 dark:text-slate-400">Không có hợp đồng nào</p>
              </td>
            </tr>
          )}

          {!isLoading &&
            rows?.map((item) => {
              const subtitle = codeSubtitle(item)
              return (
                <tr
                  key={item.reservationId}
                  className={cn(
                    "hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors group",
                    item.contractStatus === "CANCELLED" && "opacity-75"
                  )}
                  data-status={item.contractStatus ?? ""}
                >
                  <td className="py-3 px-4 whitespace-nowrap align-middle text-center">
                    {onOpenDetail ? (
                      <div className="flex flex-col items-center justify-center">
                        <button
                          type="button"
                          onClick={() => onOpenDetail(item)}
                          title="Bấm để xem chi tiết hợp đồng"
                          className="inline-flex items-center justify-center w-[185px] py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-600 font-mono font-semibold text-xs transition-all duration-150 shadow-2xs hover:shadow-xs cursor-pointer text-center"
                        >
                          {item.reservationCode}
                        </button>
                        {subtitle && (
                          <span className="block text-xs font-normal font-sans text-slate-500 dark:text-slate-400 mt-1">
                            {subtitle}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <span className="inline-flex items-center justify-center w-[185px] py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 font-mono font-semibold text-xs">
                          {item.reservationCode}
                        </span>
                        {subtitle && (
                          <span className="block text-xs font-normal font-sans text-slate-500 dark:text-slate-400 mt-1">
                            {subtitle}
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap align-middle text-center">
                    <span className="font-normal text-slate-800 dark:text-slate-200 text-sm">
                      {item.customerName ?? "—"}
                    </span>
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap align-middle text-center">
                    <span className="font-normal text-slate-800 dark:text-slate-200 text-sm">
                      {item.unitCode ?? "—"}
                    </span>
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap align-middle text-center">
                    <div className="flex items-center justify-center">
                      <StatusAction
                        item={item}
                        onCheckin={onCheckin}
                        onCheckout={onCheckout}
                        onCollectPenalty={onCollectPenalty}
                        onRenew={onRenew}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
        </tbody>
      </table>
    </div>
  )
}

function StatusAction({
  item,
  onCheckin,
  onCheckout,
  onCollectPenalty,
  onRenew,
}: {
  item: StaffReservationItem
  onCheckin: (item: StaffReservationItem) => void
  onCheckout: (item: StaffReservationItem) => void
  onCollectPenalty: (item: StaffReservationItem) => void
  onRenew: (item: StaffReservationItem) => void
}) {
  if (item.contractStatus === "PENDING_CHECKIN") {
    const rawDate = item.checkInDate || item.reservationStartDate
    const checkInDay = rawDate ? rawDate.slice(0, 10) : ""
    const todayStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(new Date())

    if (checkInDay && checkInDay > todayStr) {
      return (
        <span
          className="inline-flex items-center justify-center min-w-[104px] rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap text-slate-500 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
          title={`Chưa đến ngày check-in. Khách hẹn nhận kho vào ${formatDate(rawDate)}.`}
        >
          <span>Hẹn nhận: {formatDate(rawDate)}</span>
        </span>
      )
    }

    if (checkInDay && checkInDay < todayStr) {
      return (
        <span
          className="inline-flex items-center justify-center min-w-[104px] rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap text-rose-600 shadow-2xs dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400"
          title="Đã quá hạn ngày hẹn check-in (No-Show). Hệ thống tự động hủy đơn và tịch thu cọc."
        >
          <span>Quá hạn nhận</span>
        </span>
      )
    }

    return (
      <button
        type="button"
        onClick={() => onCheckin(item)}
        className="inline-flex cursor-pointer items-center justify-center min-w-[104px] rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-bold whitespace-nowrap text-blue-700 transition hover:bg-blue-100 shadow-2xs dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50"
      >
        <span>Check-in</span>
      </button>
    )
  }

  if (item.contractStatus === "ACTIVE") {
    const isReturnRequested = Boolean(
      item.returnRequested || item.cancelReason === "EARLY_TERMINATION"
    )
    if (isReturnRequested) {
      const returnDateStr = item.desiredReturnDate
        ? formatDate(item.desiredReturnDate)
        : null
      return (
        <span
          className="inline-flex items-center justify-center min-w-[104px] rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold whitespace-nowrap text-emerald-700 shadow-2xs dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          title="Khách hàng đã gửi yêu cầu trả kho. Xử lý nghiệm thu tại tab Hỗ trợ xử lý Ticket."
        >
          <span>
            {returnDateStr
              ? `Đang thuê (Hẹn trả: ${returnDateStr})`
              : "Đang thuê (Hẹn trả)"}
          </span>
        </span>
      )
    }

    return (
      <span className="inline-flex items-center justify-center min-w-[104px] rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold whitespace-nowrap text-emerald-700 shadow-2xs dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
        Đang thuê
      </span>
    )
  }

  if (item.contractStatus === "OVERDUE") {
    // Nếu khách còn nợ phạt -> chỉ hiện nút Thu phạt. Sau khi thu phạt -> hiển thị 2 nút: Gia hạn hoặc Trả kho
    const hasUnpaidPenalty = (item.unpaidPenaltyAmount ?? 0) > 0
    if (hasUnpaidPenalty) {
      return (
        <button
          type="button"
          onClick={() => onCollectPenalty(item)}
          className="inline-flex cursor-pointer items-center justify-center min-w-[104px] rounded-full border border-rose-300 bg-rose-50 px-3.5 py-1.5 text-xs font-bold whitespace-nowrap text-rose-700 transition hover:bg-rose-100 shadow-2xs dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/50"
        >
          <span>Thu phạt</span>
        </button>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center gap-1.5 sm:flex-row">
        <button
          type="button"
          onClick={() => onRenew(item)}
          className="inline-flex cursor-pointer items-center justify-center min-w-[84px] rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold whitespace-nowrap text-blue-700 transition hover:bg-blue-100 shadow-2xs dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50"
        >
          <span>Gia hạn</span>
        </button>
        <button
          type="button"
          onClick={() => onCheckout(item)}
          className="inline-flex cursor-pointer items-center justify-center min-w-[84px] rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold whitespace-nowrap text-amber-700 transition hover:bg-amber-100 shadow-2xs dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/50"
          title="Nhận bàn giao & trả kho (nghiệm thu hoàn cọc)"
        >
          <span>Trả kho</span>
        </button>
      </div>
    )
  }

  if (item.contractStatus === "TERMINATED") {
    return (
      <span className="inline-flex items-center justify-center min-w-[104px] rounded-full border border-slate-300 bg-slate-100 px-3.5 py-1.5 text-xs font-bold whitespace-nowrap text-slate-600 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
        <span>Đã thanh lý trả kho</span>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center justify-center min-w-[104px] rounded-full border border-slate-200 bg-slate-100/80 px-3.5 py-1.5 text-xs font-bold whitespace-nowrap text-slate-500 shadow-2xs dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
      <span>ĐÃ HỦY ĐƠN</span>
    </span>
  )
}

export default CheckinContractTable
