import { StatusBadge, type BadgeTone } from "@/components/internal/components/PanelKit"
import { formatVnd } from "@/lib/format"

import { CHECKOUT_PROGRESS_LABEL, CONTRACT_STATUS_LABEL, daysRemaining, isClosedContract, unpaidTotal } from "../contractRules"
import type { ContractStatus, FacilityContract } from "../types"

const STATUS_TONE: Record<ContractStatus, BadgeTone> = {
  PENDING_CHECKIN: "amber",
  ACTIVE: "green",
  OVERDUE: "red",
  TERMINATED: "blue",
  COMPLETED: "slate",
  FORFEITED: "red",
  CANCELLED: "slate",
}


export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  // Trạng thái BE mới thêm mà FE chưa biết: vẫn hiện mã, màu trung tính, không vỡ giao diện
  return <StatusBadge tone={STATUS_TONE[status] ?? "slate"}>{CONTRACT_STATUS_LABEL[status] ?? status}</StatusBadge>
}

/** Tiến độ giữ / trả kho theo trạng thái hợp đồng */
export function CheckoutProgressBadge({ status }: { status: ContractStatus }) {
  return <StatusBadge tone={STATUS_TONE[status] ?? "slate"}>{CHECKOUT_PROGRESS_LABEL[status] ?? status}</StatusBadge>
}

/** "Còn 30 ngày" / "Hết hạn hôm nay" / "Quá 4 ngày" với màu theo mức độ gấp */
export function DaysLeft({ contract, today }: { contract: FacilityContract; today: string }) {
  if (isClosedContract(contract.status)) return <span className="text-muted">—</span>
  const days = daysRemaining(contract.endDate, today)
  if (days < 0) return <span className="font-bold text-rose-600 dark:text-rose-400">Quá {-days} ngày</span>
  if (days === 0) return <span className="font-bold text-amber-700 dark:text-amber-300">Hết hạn hôm nay</span>
  return (
    <span className={days <= 7 ? "font-bold text-amber-700 dark:text-amber-300" : "text-title font-semibold"}>
      Còn {days} ngày
    </span>
  )
}

export function PaymentState({ contract }: { contract: FacilityContract }) {
  const debt = unpaidTotal(contract)
  return debt > 0 ? (
    <StatusBadge tone="red">Còn nợ {formatVnd(debt)}</StatusBadge>
  ) : (
    <StatusBadge tone="green">Đã thanh toán đủ</StatusBadge>
  )
}
