import {
  BanIcon,
  EyeIcon,
  InboxIcon,
  PackageOpenIcon,
  TriangleAlertIcon,
  UserCheckIcon,
} from "lucide-react"
import { cn } from "cn"

import type { StaffReservationItem } from "../types"

interface CheckinContractTableProps {
  rows: StaffReservationItem[] | undefined
  isLoading: boolean
  error: string | undefined
  onRetry: () => void
  onOpenDetail: (item: StaffReservationItem) => void
  onCheckin: (item: StaffReservationItem) => void
  onCheckout: (item: StaffReservationItem) => void
  /** unitCode → nhãn "Size M (3m²)" để hiển thị cạnh vị trí kho */
  unitMeta?: Record<string, string>
}

const CODE_COLOR: Record<string, string> = {
  PENDING_CHECKIN: "text-blue-600",
  ACTIVE: "text-emerald-600",
  OVERDUE: "text-rose-600",
  CANCELED: "text-slate-500",
}

const UNIT_COLOR: Record<string, string> = {
  PENDING_CHECKIN: "text-blue-600",
  OVERDUE: "text-rose-600",
  CANCELED: "text-slate-500",
}

/** Dòng phụ dưới mã HĐ (bám prototype) */
function codeSubtitle(status: string | null): string | null {
  if (status === "CANCELED") return "Đã hoàn tiền cọc"
  return null
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
            <th className="w-[15%] px-4 py-3.5 text-center">Chi tiết</th>
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
              const meta = item.unitCode ? unitMeta?.[item.unitCode] : undefined
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
                    <span
                      className={cn(
                        "block font-bold",
                        CODE_COLOR[item.contractStatus ?? ""] ??
                          "text-slate-600"
                      )}
                    >
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
                    <span
                      className={cn(
                        "block font-bold",
                        UNIT_COLOR[item.contractStatus ?? ""] ?? "text-title"
                      )}
                    >
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
                    />
                  </td>

                  <td className="px-4 py-3.5 text-center align-middle">
                    <button
                      type="button"
                      onClick={() => onOpenDetail(item)}
                      className="mx-auto flex cursor-pointer items-center space-x-1 rounded-xl bg-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-700 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200"
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
}: {
  item: StaffReservationItem
  onCheckin: (item: StaffReservationItem) => void
  onCheckout: (item: StaffReservationItem) => void
}) {
  if (item.contractStatus === "PENDING_CHECKIN") {
    return (
      <button
        type="button"
        onClick={() => onCheckin(item)}
        className="flex w-36 cursor-pointer items-center justify-center space-x-1.5 rounded-xl bg-blue-600 px-3 py-2 text-[11px] font-extrabold whitespace-nowrap text-white shadow-sm transition hover:bg-blue-700"
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
        className="flex w-36 cursor-pointer items-center justify-center space-x-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-extrabold whitespace-nowrap text-white shadow-sm transition hover:bg-emerald-700"
      >
        <PackageOpenIcon className="size-3.5" />
        <span>Xác nhận trả kho</span>
      </button>
    )
  }

  if (item.contractStatus === "OVERDUE") {
    return (
      <span className="flex w-36 items-center justify-center space-x-1.5 rounded-xl border border-rose-300 bg-rose-100 px-3 py-2 text-[11px] font-extrabold whitespace-nowrap text-rose-800 shadow-sm dark:border-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
        <TriangleAlertIcon className="size-3" />
        <span>QUÁ HẠN</span>
      </span>
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
