import { EyeIcon, UserCheckIcon, InboxIcon } from "lucide-react"
import { cn } from "cn"
import { toast } from "sonner"

import type { CheckinContract, ContractStatus } from "../types"

interface CheckinContractTableProps {
  rows: CheckinContract[] | undefined
  isLoading: boolean
  error: string | undefined
  onRetry: () => void
  onOpenDetail: (contract: CheckinContract) => void
  onCheckin: (contract: CheckinContract) => void
}

const CODE_COLOR: Record<ContractStatus, string> = {
  PENDING_CHECKIN: "text-blue-600",
  ACTIVE: "text-emerald-600",
  OVERDUE: "text-rose-600",
  CANCELED: "text-slate-500",
}

function subNote(contract: CheckinContract): string | null {
  if (contract.status === "OVERDUE") return "Quá hạn 3 ngày"
  if (contract.status === "CANCELED") return "Đã hoàn tiền cọc"
  return null
}

/** Bảng hợp đồng — bám prototype staff.html */
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

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm dark:border-slate-800">
      <table className="w-full table-fixed text-left text-sm">
        <thead className="text-[11px] font-bold tracking-wider uppercase">
          <tr>
            <th className="w-[18%] px-4 py-3.5">Mã Hợp Đồng / Đặt Chỗ</th>
            <th className="w-[18%] px-4 py-3.5">Thông tin Khách hàng</th>
            <th className="w-[22%] px-4 py-3.5">Kho & Vị trí</th>
            <th className="w-[24%] px-4 py-3.5">Trạng thái</th>
            <th className="w-[18%] px-4 py-3.5 text-center">Chi tiết</th>
          </tr>
        </thead>
        <tbody className="text-title">
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
                <p className="font-medium text-muted">
                  Không có hợp đồng nào
                </p>
              </td>
            </tr>
          )}

          {!isLoading &&
            rows?.map((contract) => (
              <tr
                key={contract.code}
                className="transition-colors"
                data-status={contract.status}
              >
                <td className="px-4 py-3.5 align-middle">
                  <span
                    className={cn(
                      "block font-mono font-bold",
                      CODE_COLOR[contract.status]
                    )}
                  >
                    {contract.code}
                  </span>
                  {subNote(contract) && (
                    <span
                      className={cn(
                        "block text-[11px] font-bold",
                        contract.status === "OVERDUE"
                          ? "text-rose-600"
                          : "text-muted"
                      )}
                    >
                      {subNote(contract)}
                    </span>
                  )}
                </td>

                <td className="px-4 py-3.5 align-middle">
                  <div className="text-sm font-extrabold text-title">
                    {contract.customerName}
                  </div>
                </td>

                <td className="px-4 py-3.5 align-middle">
                  <span className="block font-bold text-blue-600">
                    Kho {contract.unitCode}
                  </span>
                  <span className="block text-[11px] text-muted">
                    {contract.floorName} • {contract.sizeLabel}
                  </span>
                </td>

                <td className="px-4 py-3.5 align-middle">
                  <StatusAction contract={contract} onCheckin={onCheckin} />
                </td>

                <td className="px-4 py-3.5 text-center align-middle">
                  <button
                    type="button"
                    onClick={() => onOpenDetail(contract)}
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
  contract,
  onCheckin,
}: {
  contract: CheckinContract
  onCheckin: (contract: CheckinContract) => void
}) {
  if (contract.status === "PENDING_CHECKIN") {
    return (
      <button
        type="button"
        onClick={() => onCheckin(contract)}
        className="flex w-36 cursor-pointer items-center justify-center space-x-1.5 rounded-xl bg-blue-600 px-3 py-2 text-[11px] font-extrabold whitespace-nowrap text-white shadow-sm transition hover:bg-blue-700"
      >
        <UserCheckIcon className="size-3.5" />
        <span>Check-in</span>
      </button>
    )
  }

  if (contract.status === "ACTIVE") {
    return (
      <button
        type="button"
        onClick={() =>
          toast.info(
            "Chức năng Xác nhận trả kho (check-out) chưa thuộc phạm vi US-16."
          )
        }
        className="flex w-36 cursor-pointer items-center justify-center space-x-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-extrabold whitespace-nowrap text-white shadow-sm transition hover:bg-emerald-700"
      >
        <UserCheckIcon className="size-3.5" />
        <span>Xác nhận trả kho</span>
      </button>
    )
  }

  if (contract.status === "OVERDUE") {
    return (
      <span className="flex w-36 items-center justify-center space-x-1.5 rounded-xl border border-rose-300 bg-rose-100 px-3 py-2 text-[11px] font-extrabold whitespace-nowrap text-rose-800 shadow-sm dark:border-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
        <span>QUÁ HẠN</span>
      </span>
    )
  }

  return (
    <span className="flex w-36 items-center justify-center space-x-1.5 rounded-xl border border-slate-300 bg-slate-200 px-3 py-2 text-[11px] font-extrabold whitespace-nowrap text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
      <span>ĐÃ HỦY ĐƠN</span>
    </span>
  )
}

export default CheckinContractTable
