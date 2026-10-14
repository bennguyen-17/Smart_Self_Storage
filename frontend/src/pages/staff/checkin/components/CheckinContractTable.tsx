import {
  BanIcon,
  CalendarPlusIcon,
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
} from "@/pages/floorplan/unitDisplay"

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
function codeSubtitle(status: string | null): string | null {
  if (status === "CANCELED") return "Đã hoàn tiền cọc"
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
    <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm dark:border-slate-800">
      <table className="w-full table-fixed text-left text-sm">
        <thead className="border-b bg-slate-100 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:bg-slate-800/80 dark:text-slate-400">
          <tr>
            <th className="w-[15%] px-4 py-3.5">Mã Hợp Đồng / Đặt Chỗ</th>
            <th className="w-[15%] px-4 py-3.5">Thông tin Khách hàng</th>
            <th className="w-[15%] px-4 py-3.5">Kho &amp; Vị trí</th>
            <th className="w-[15%] px-4 py-3.5">Trạng thái</th>
            <th className="w-[15%] px-4 py-3.5">Chi tiết</th>
          </tr>
        </thead>
        <tbody className="text-title divide-y divide-slate-200 dark:divide-slate-800">
          {isLoading &&
            Array.from({ length: 4 }, (_, i) => (
              <tr key={i}>
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
                <InboxIcon className="mx-auto mb-2 size-8 text-muted" />
                <p className="font-medium text-muted">Không có hợp đồng nào</p>
              </td>
            </tr>
          )}

          {!isLoading &&
            rows?.map((item) => {
              const subtitle = codeSubtitle(item.contractStatus)
              const meta = item.unitCode
                ? (unitMeta?.[item.unitCode] ?? sizeMetaFromCode(item.unitCode))
                : undefined
              return (
                <tr
                  key={item.reservationId}
                  className={cn(
                    "transition hover:bg-blue-500/5",
                    item.contractStatus === "CANCELED" && "opacity-75"
                  )}
                  data-status={item.contractStatus ?? ""}
                >
                  <td className="px-4 py-3.5 align-middle font-mono font-bold">
                    <span className="text-title block font-bold">
                      {item.reservationCode}
                    </span>
                    {subtitle && (
                      <span className="block text-[11px] font-normal text-muted">
                        {subtitle}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 align-middle">
                    <div className="text-title text-sm font-extrabold">
                      {item.customerName ?? "—"}
                    </div>
                  </td>

                  <td className="px-4 py-3.5 align-middle">
                    <span className="text-title block font-bold">
                      Kho {item.unitCode ?? "—"}
                    </span>
                    <span className="block text-[11px] text-muted">
                      {[item.floorName, meta].filter(Boolean).join(" • ")}
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

                  <td className="px-4 py-3.5 align-middle">
                    <button
                      type="button"
                      onClick={() => onOpenDetail(item)}
                      className="flex cursor-pointer items-center space-x-1 rounded-xl bg-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-700 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <EyeIcon className="size-3.5" />
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
        className="flex w-36 cursor-pointer items-center justify-center space-x-1.5 rounded-xl border border-blue-300 bg-blue-100 px-3 py-2 text-[11px] font-extrabold whitespace-nowrap text-blue-700 transition hover:bg-blue-200 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/50"
      >
        <UserCheckIcon className="size-3.5" />
        <span>Check-in</span>
      </button>
    )
  }

  if (item.contractStatus === "ACTIVE") {
    return (
      <button
        type="button"
        onClick={() => onCheckout(item)}
        className="flex w-36 cursor-pointer items-center justify-center space-x-1.5 rounded-xl border border-emerald-300 bg-emerald-100 px-3 py-2 text-[11px] font-extrabold whitespace-nowrap text-emerald-700 transition hover:bg-emerald-200 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
      >
        <PackageOpenIcon className="size-3.5" />
        <span>Xác nhận trả kho</span>
      </button>
    )
  }

  if (item.contractStatus === "OVERDUE") {
    // US-20: thu phạt quá hạn & gia hạn tại quầy
    return (
      <div className="flex w-36 flex-col gap-1">
        <button
          type="button"
          onClick={() => onCollectPenalty(item)}
          className="flex w-full cursor-pointer items-center justify-center space-x-1.5 rounded-xl border border-rose-300 bg-rose-100 px-3 py-1.5 text-[11px] font-extrabold whitespace-nowrap text-rose-700 transition hover:bg-rose-200 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300 dark:hover:bg-rose-900/50"
        >
          <ReceiptTextIcon className="size-3.5" />
          <span>Thu phạt</span>
        </button>
        <button
          type="button"
          onClick={() => onRenew(item)}
          className="flex w-full cursor-pointer items-center justify-center space-x-1.5 rounded-xl border border-rose-300 bg-rose-100 px-3 py-1.5 text-[11px] font-extrabold whitespace-nowrap text-rose-800 shadow-sm transition hover:bg-rose-200 dark:border-rose-800 dark:bg-rose-950/80 dark:text-rose-300"
        >
          <CalendarPlusIcon className="size-3.5" />
          <span>Gia hạn</span>
        </button>
      </div>
    )
  }

  return (
    <span className="flex w-36 items-center justify-center space-x-1.5 rounded-xl border border-slate-300 bg-slate-200 px-3 py-2 text-[11px] font-extrabold whitespace-nowrap text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
      <BanIcon className="size-3" />
      <span>ĐÃ HỦY ĐƠN</span>
    </span>
  )
}

export default CheckinContractTable
