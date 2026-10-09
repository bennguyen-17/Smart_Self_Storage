import { EyeIcon, InboxIcon, UserCheckIcon } from "lucide-react"
import { cn } from "cn"
import { toast } from "sonner"

import { formatVnd } from "@/lib/format"

import type { StaffReservationItem } from "../types"

interface CheckinContractTableProps {
  rows: StaffReservationItem[] | undefined
  isLoading: boolean
  error: string | undefined
  onRetry: () => void
  onOpenDetail: (item: StaffReservationItem) => void
  onCheckin: (item: StaffReservationItem) => void
}

const CODE_COLOR: Record<string, string> = {
  PENDING_CHECKIN: "text-blue-600",
  ACTIVE: "text-emerald-600",
  OVERDUE: "text-rose-600",
  CANCELED: "text-slate-500",
}

/** Dòng phụ dưới mã HĐ (bám prototype) */
function codeSubtitle(item: StaffReservationItem): string {
  switch (item.contractStatus) {
    case "PENDING_CHECKIN":
      return `Cọc: ${formatVnd(item.depAmount)} (Online)`
    case "ACTIVE":
      return `Thuê ${formatVnd(item.depAmount)} (Đã thanh toán)`
    case "OVERDUE":
      return "Quá hạn"
    case "CANCELED":
      return "Đã hoàn tiền cọc"
    default:
      return ""
  }
}

/** Chip "Hình thức bàn giao" (BE chưa trả field này → suy theo trạng thái) */
function HandoverChip({ status }: { status: string | null }) {
  const base =
    "inline-flex w-44 items-center justify-center whitespace-nowrap rounded-xl border px-3 py-1.5 text-[11px] font-bold"
  if (status === "PENDING_CHECKIN") {
    return (
      <span
        className={cn(
          base,
          "border-slate-300/80 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        )}
      >
        🔑 Chìa vật lý + 💳 Thẻ từ
      </span>
    )
  }
  if (status === "ACTIVE") {
    return (
      <span
        className={cn(
          base,
          "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
        )}
      >
        ✓ Đã bàn giao 02 chìa + Thẻ
      </span>
    )
  }
  if (status === "OVERDUE") {
    return (
      <span
        className={cn(
          base,
          "border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300"
        )}
      >
        🔒 Khóa Kép Tự động
      </span>
    )
  }
  return (
    <span
      className={cn(
        base,
        "border-slate-300 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
      )}
    >
      Chưa bàn giao
    </span>
  )
}

/** Bảng hợp đồng 6 cột — bám prototype self_storage_prototype.html */
function CheckinContractTable({
  rows,
  isLoading,
  error,
  onRetry,
  onOpenDetail,
  onCheckin,
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

  const headers = [
    "Mã Hợp Đồng / Đặt Chỗ",
    "Thông tin Khách hàng",
    "Kho & Vị trí",
    "Hình thức Bàn giao",
    "Trạng thái & Thao tác Vận hành",
    "Chi tiết",
  ]

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm dark:border-slate-800">
      <table className="w-full min-w-[1000px] text-left text-xs">
        <thead className="text-[10.5px] font-black tracking-wider uppercase">
          <tr>
            {headers.map((header, i) => (
              <th
                key={header}
                className={cn("p-3.5", i === headers.length - 1 && "text-center")}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="font-medium text-title">
          {isLoading &&
            Array.from({ length: 4 }, (_, i) => (
              <tr key={i} className="border-b">
                {Array.from({ length: 6 }, (_, j) => (
                  <td key={j} className="p-3.5">
                    <div className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  </td>
                ))}
              </tr>
            ))}

          {!isLoading && rows?.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-12 text-center">
                <InboxIcon className="mx-auto mb-2 size-8 text-muted" />
                <p className="font-medium text-muted">Không có hợp đồng nào</p>
              </td>
            </tr>
          )}

          {!isLoading &&
            rows?.map((item) => (
              <tr
                key={item.reservationId}
                className={cn(
                  "border-b border-slate-200 transition hover:bg-blue-500/5 dark:border-slate-800",
                  item.contractStatus === "CANCELED" && "opacity-75"
                )}
                data-status={item.contractStatus ?? ""}
              >
                <td className="p-3.5 align-middle font-mono font-bold">
                  <span
                    className={cn(
                      "block font-black",
                      CODE_COLOR[item.contractStatus ?? ""] ?? "text-slate-600"
                    )}
                  >
                    #{item.reservationCode}
                  </span>
                  <span
                    className={cn(
                      "block text-[10px] font-normal",
                      item.contractStatus === "OVERDUE"
                        ? "font-bold text-rose-600"
                        : "text-muted"
                    )}
                  >
                    {codeSubtitle(item)}
                  </span>
                </td>

                <td className="p-3.5 align-middle">
                  <div className="font-extrabold text-title">
                    {item.customerName ?? "—"}
                  </div>
                  <div className="text-[10px] text-muted">
                    SĐT: {item.customerPhone ?? "—"}
                  </div>
                </td>

                <td className="p-3.5 align-middle">
                  <span
                    className={cn(
                      "block font-black",
                      item.contractStatus === "PENDING_CHECKIN"
                        ? "text-blue-600"
                        : item.contractStatus === "OVERDUE"
                          ? "text-rose-600"
                          : item.contractStatus === "CANCELED"
                            ? "text-slate-500"
                            : "text-title"
                    )}
                  >
                    Kho {item.unitCode ?? "—"}
                  </span>
                  <span className="block text-[10px] text-muted">
                    {item.floorName ?? ""}
                  </span>
                </td>

                <td className="p-3.5 align-middle">
                  <HandoverChip status={item.contractStatus} />
                </td>

                <td className="p-3.5 align-middle">
                  <StatusAction item={item} onCheckin={onCheckin} />
                </td>

                <td className="p-3.5 text-center align-middle">
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
            ))}
        </tbody>
      </table>
    </div>
  )
}

function StatusAction({
  item,
  onCheckin,
}: {
  item: StaffReservationItem
  onCheckin: (item: StaffReservationItem) => void
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
        onClick={() =>
          toast.info("Chức năng Xác nhận trả kho (check-out) chưa thuộc US-16.")
        }
        className="flex w-36 cursor-pointer items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-extrabold whitespace-nowrap text-white shadow-sm transition hover:bg-emerald-700"
      >
        Xác nhận trả kho
      </button>
    )
  }

  if (item.contractStatus === "OVERDUE") {
    return (
      <span className="flex w-36 items-center justify-center rounded-xl border border-rose-300 bg-rose-100 px-3 py-2 text-[11px] font-extrabold whitespace-nowrap text-rose-800 shadow-sm dark:border-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
        ⚠ QUÁ HẠN
      </span>
    )
  }

  return (
    <span className="flex w-36 items-center justify-center rounded-xl bg-slate-200 px-3 py-2 text-[11px] font-extrabold whitespace-nowrap text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-400">
      ĐÃ HỦY ĐƠN
    </span>
  )
}

export default CheckinContractTable
