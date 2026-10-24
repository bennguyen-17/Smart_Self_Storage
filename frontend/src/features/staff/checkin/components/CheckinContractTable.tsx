import {
  BanIcon,
  CalendarPlusIcon,
  CheckCircle2Icon,
  EyeIcon,
  InboxIcon,
  PackageOpenIcon,
  ReceiptTextIcon,
  UserCheckIcon,
} from "lucide-react"
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
  onOpenDetail: (item: StaffReservationItem) => void
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
  if (item.contractStatus === "ACTIVE" && (item.returnRequested || item.cancelReason === "EARLY_TERMINATION")) {
    const returnDateStr = item.desiredReturnDate ? formatDate(item.desiredReturnDate) : null
    return returnDateStr ? `Khách hẹn trả: ${returnDateStr}` : "Khách hẹn trả kho"
  }
  return null
}

/** Nhãn size dự phòng từ mã ô kho ("F2-M205" → "Size M (3m²)") khi chưa tải được danh sách ô. */
function sizeMetaFromCode(unitCode: string): string | undefined {
  const size = unitSizeFromCode(unitCode)
  return size ? `Size ${size} (${SIZE_AREA_M2[size]}m²)` : undefined
}

/** Bảng hợp đồng 5 cột — bám prototype staff_portal.html */
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
      <table className="w-full text-left text-xs">
        <thead className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
          <tr>
            <th scope="col" className="px-4 py-3 font-bold">Mã Hợp Đồng</th>
            <th scope="col" className="px-4 py-3 font-bold">Thông tin Khách hàng</th>
            <th scope="col" className="px-4 py-3 font-bold">Mã kho</th>
            <th scope="col" className="px-4 py-3 font-bold">Trạng thái</th>
            <th scope="col" className="px-4 py-3 text-right font-bold">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
          {isLoading &&
            Array.from({ length: 4 }, (_, i) => (
              <tr key={i} className="border-b last:border-0">
                {Array.from({ length: 5 }, (_, j) => (
                  <td key={j} className="px-4 py-3.5">
                    <div className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  </td>
                ))}
              </tr>
            ))}

          {!isLoading && rows?.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center">
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
                    "transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40",
                    item.contractStatus === "CANCELLED" && "opacity-75"
                  )}
                  data-status={item.contractStatus ?? ""}
                >
                  <td className="px-4 py-3.5 align-middle font-mono whitespace-nowrap">
                    <span className="block font-bold text-slate-900 dark:text-white">
                      {item.reservationCode}
                    </span>
                    {subtitle && (
                      <span className="block text-[11px] font-normal font-sans text-slate-500 dark:text-slate-400 mt-0.5">
                        {subtitle}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 align-middle">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {item.customerName ?? "—"}
                    </div>
                  </td>

                  <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                    <span className="text-sm font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {item.unitCode ?? "—"}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 align-middle">
                    <StatusAction
                      item={item}
                      onCheckin={onCheckin}
                      onCheckout={onCheckout}
                      onCollectPenalty={onCollectPenalty}
                      onRenew={onRenew}
                    />
                  </td>

                  <td className="px-4 py-3.5 align-middle text-right">
                    <button
                      type="button"
                      onClick={() => onOpenDetail(item)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      <EyeIcon className="size-3.5 text-slate-400 group-hover:text-slate-600 dark:text-slate-400" />
                      <span>Xem chi tiết</span>
                    </button>
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
    return (
      <button
        type="button"
        onClick={() => onCheckin(item)}
        className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold whitespace-nowrap text-blue-700 transition hover:bg-blue-100 shadow-2xs dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50"
      >
        <UserCheckIcon className="size-3.5" />
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
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          title="Khách hàng đã gửi yêu cầu trả kho. Xử lý nghiệm thu tại tab Hỗ trợ xử lý Ticket."
        >
          <span className="size-2 rounded-full bg-emerald-500" />
          <span>
            {returnDateStr
              ? `Đang thuê (Hẹn trả: ${returnDateStr})`
              : "Đang thuê (Hẹn trả)"}
          </span>
        </span>
      )
    }

    return (
      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
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
          className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-3 py-1 text-xs font-bold whitespace-nowrap text-rose-700 transition hover:bg-rose-100 shadow-2xs dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/50"
        >
          <ReceiptTextIcon className="size-3.5" />
          <span>Thu phạt</span>
        </button>
      )
    }

    return (
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => onRenew(item)}
          className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-blue-700 transition hover:bg-blue-100 shadow-2xs dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50"
        >
          <CalendarPlusIcon className="size-3.5" />
          <span>Gia hạn</span>
        </button>
        <button
          type="button"
          onClick={() => onCheckout(item)}
          className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-amber-700 transition hover:bg-amber-100 shadow-2xs dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/50"
          title="Nhận bàn giao & trả kho (nghiệm thu hoàn cọc)"
        >
          <PackageOpenIcon className="size-3.5" />
          <span>Trả kho</span>
        </button>
      </div>
    )
  }

  if (item.contractStatus === "TERMINATED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
        <CheckCircle2Icon className="size-3.5 text-emerald-600" />
        <span>Đã thanh lý trả kho</span>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100/80 px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap text-slate-500 shadow-2xs dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
      <BanIcon className="size-3" />
      <span>ĐÃ HỦY ĐƠN</span>
    </span>
  )
}

export default CheckinContractTable
