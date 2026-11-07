import {
  InboxIcon,
} from "lucide-react"
import StaffShiftRequiredCard from "@/features/staff/components/StaffShiftRequiredCard"
import { cn } from "cn"

import {
  SIZE_AREA_M2,
  unitSizeFromCode,
} from "@/features/floorplan/unitDisplay"
import { formatDate, todayInVietnam } from "@/lib/format"

import type { StaffReservationItem } from "../types"

interface CheckinContractTableProps {
  rows: StaffReservationItem[] | undefined
  isLoading: boolean
  error: string | undefined
  onRetry: () => void
  onOpenDetail?: (item: StaffReservationItem) => void
  onCheckin: (item: StaffReservationItem) => void
  onCheckout: (item: StaffReservationItem) => void
  /** Mở hộp thoại hủy giữ chỗ tại quầy (bảo lưu 50% tiền cọc, hoàn 50%) */
  onCancel?: (item: StaffReservationItem) => void
  /** Mở hộp thoại thu phạt quá hạn tại quầy */
  onCollectPenalty: (item: StaffReservationItem) => void
  /** Mở hộp thoại gia hạn hợp đồng tại quầy */
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

/** Bảng hợp đồng 5 cột chuẩn UI đồng bộ Customer */
function CheckinContractTable({
  rows,
  isLoading,
  error,
  onRetry,
  onOpenDetail,
  onCheckin,
  onCheckout,
  onCancel,
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
            <th scope="col" className="py-3 px-3 text-center whitespace-nowrap">Thông Tin Khách Hàng</th>
            <th scope="col" className="py-3 px-3 text-center whitespace-nowrap">Mã Kho</th>
            <th scope="col" className="py-3 px-3 text-center whitespace-nowrap">Trạng Thái</th>
            <th scope="col" className="py-3 px-3 text-center whitespace-nowrap">Hành Động</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
          {isLoading &&
            Array.from({ length: 4 }, (_, i) => (
              <tr key={i} className="border-b last:border-0">
                {Array.from({ length: 5 }, (_, j) => (
                  <td key={j} className="py-3.5 px-3 text-center">
                    <div className="mx-auto h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  </td>
                ))}
              </tr>
            ))}

          {!isLoading && rows?.length === 0 && (
            <tr>
              <td colSpan={5} className="py-12 px-4 text-center">
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
                      <StatusBadge item={item} />
                    </div>
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap align-middle text-center">
                    <div className="flex items-center justify-center">
                      <ActionButtons
                        item={item}
                        onCheckin={onCheckin}
                        onCheckout={onCheckout}
                        onCancel={onCancel}
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

function StatusBadge({ item }: { item: StaffReservationItem }) {
  if (item.contractStatus === "PENDING_CHECKIN") {
    const rawDate = item.checkInDate || item.reservationStartDate
    const checkInDay = rawDate ? rawDate.slice(0, 10) : ""
    const todayStr = todayInVietnam()

    if (checkInDay && checkInDay > todayStr) {
      return (
        <span
          className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium border bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
          title={`Chưa đến ngày check-in. Khách hẹn nhận kho vào ${formatDate(rawDate)}.`}
        >
          <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-amber-500"></span>
          Hẹn nhận: {formatDate(rawDate)}
        </span>
      )
    }

    if (checkInDay && checkInDay < todayStr) {
      return (
        <span
          className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium border bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
          title="Đã quá hạn ngày hẹn check-in (No-Show)."
        >
          <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-rose-500"></span>
          Quá hạn nhận kho
        </span>
      )
    }

    return (
      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium border bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
        <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-amber-500"></span>
        Chờ check-in
      </span>
    )
  }

  if (item.contractStatus === "ACTIVE") {
    const isReturnRequested = Boolean(item.returnRequested)
    if (isReturnRequested) {
      const returnDateStr = item.desiredReturnDate
        ? formatDate(item.desiredReturnDate)
        : null
      return (
        <span
          className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium border bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700"
          title="Khách hàng đã gửi yêu cầu trả kho. Xử lý nghiệm thu tại tab Hỗ trợ xử lý Ticket."
        >
          <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-amber-500 animate-pulse"></span>
          {returnDateStr ? `Chờ trả kho (${returnDateStr})` : "Chờ trả kho"}
        </span>
      )
    }

    return (
      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium border bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
        <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-emerald-500"></span>
        Đang thuê
      </span>
    )
  }

  if (item.contractStatus === "OVERDUE") {
    return (
      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium border bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800">
        <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-rose-500"></span>
        Quá hạn
      </span>
    )
  }

  if (item.contractStatus === "FORFEITED") {
    return (
      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium border bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800">
        <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-rose-500 animate-pulse"></span>
        Chờ thanh lý
      </span>
    )
  }

  if (item.contractStatus === "TERMINATED") {
    return (
      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700">
        <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-slate-500"></span>
        Đã thanh lý
      </span>
    )
  }

  return (
    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700">
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-slate-400"></span>
      Đã hủy cọc
    </span>
  )
}

function ActionButtons({
  item,
  onCheckin,
  onCheckout,
  onCancel,
  onCollectPenalty,
  onRenew,
}: {
  item: StaffReservationItem
  onCheckin: (item: StaffReservationItem) => void
  onCheckout: (item: StaffReservationItem) => void
  onCancel?: (item: StaffReservationItem) => void
  onCollectPenalty: (item: StaffReservationItem) => void
  onRenew: (item: StaffReservationItem) => void
}) {
  if (item.contractStatus === "PENDING_CHECKIN") {
    const rawDate = item.checkInDate || item.reservationStartDate
    const checkInDay = rawDate ? rawDate.slice(0, 10) : ""
    const todayStr = todayInVietnam()

    if (checkInDay && checkInDay > todayStr) {
      return (
        <span className="text-slate-400 dark:text-slate-600 font-mono text-base select-none" title="Không có hành động khả dụng">
          —
        </span>
      )
    }

    return (
      <div className="inline-flex items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={() => onCheckin(item)}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-200 dark:border-blue-700 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap active:scale-95"
          title="Thực hiện nhận bàn giao và check-in cho khách"
        >
          Check-in
        </button>
      </div>
    )
  }

  if (item.contractStatus === "ACTIVE") {
    const isReturnRequested = Boolean(item.returnRequested)
    if (isReturnRequested) {
      return (
        <span className="text-slate-400 dark:text-slate-600 font-mono text-base select-none" title="Xử lý nghiệm thu tại tab Ticket">
          —
        </span>
      )
    }

    const today = todayInVietnam()
    const rawEndDate = (item.reservationEndDate || item.endDate || "").slice(0, 10)
    const isLastDay = Boolean(rawEndDate && rawEndDate === today)

    if (isLastDay) {
      return (
        <div className="inline-flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => onRenew(item)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-200 dark:border-blue-700 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap active:scale-95"
          >
            Gia hạn
          </button>
          <button
            type="button"
            onClick={() => onCheckout(item)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-600 hover:text-white border border-amber-200 dark:border-amber-700 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap active:scale-95"
            title="Nhận bàn giao & trả kho (nghiệm thu hoàn cọc)"
          >
            Trả kho
          </button>
        </div>
      )
    }

    return (
      <span className="text-slate-400 dark:text-slate-600 font-mono text-base select-none" title="Không có hành động khả dụng">
        —
      </span>
    )
  }

  const isLiquidation =
    item.contractStatus === "FORFEITED" ||
    (item.contractStatus === "OVERDUE" && (item.overdueDays ?? 0) >= (item.overdueLiquidationDays ?? 30))

  if (isLiquidation) {
    return (
      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-rose-500 animate-pulse"></span>
        Chờ thanh lý
      </span>
    )
  }

  if (item.contractStatus === "OVERDUE") {
    const hasUnpaidPenalty = (item.unpaidPenaltyAmount ?? 0) > 0
    if (hasUnpaidPenalty) {
      return (
        <button
          type="button"
          onClick={() => onCollectPenalty(item)}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-200 dark:border-rose-800 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap active:scale-95"
        >
          Thu phạt
        </button>
      )
    }

    return (
      <div className="inline-flex items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={() => onRenew(item)}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-200 dark:border-blue-700 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap active:scale-95"
        >
          Gia hạn
        </button>
        <button
          type="button"
          onClick={() => onCheckout(item)}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-600 hover:text-white border border-amber-200 dark:border-amber-700 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap active:scale-95"
          title="Nhận bàn giao & trả kho (nghiệm thu hoàn cọc)"
        >
          Trả kho
        </button>
      </div>
    )
  }

  return (
    <span className="text-slate-400 dark:text-slate-600 font-mono text-base select-none" title="Không có hành động khả dụng">
      —
    </span>
  )
}

export default CheckinContractTable;
