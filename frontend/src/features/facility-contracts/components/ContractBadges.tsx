import { StatusBadge, type BadgeTone } from "@/features/internal-shell/components/PanelKit"
import { formatVnd } from "@/lib/format"

import { CHECKOUT_STAGE_LABEL, CONTRACT_STATUS_LABEL, daysRemaining, unpaidTotal } from "../contractRules"
import type { CheckoutStage, ContractStatus, FacilityContract } from "../types"

const STATUS_TONE: Record<ContractStatus, BadgeTone> = {
  PENDING_CHECKIN: "amber",
  ACTIVE: "green",
  OVERDUE: "red",
  TERMINATED: "slate",
}

const STAGE_TONE: Record<CheckoutStage, BadgeTone> = { NONE: "slate", INSPECTED: "amber", HANDED_OVER: "blue" }

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  return <StatusBadge tone={STATUS_TONE[status]}>{CONTRACT_STATUS_LABEL[status]}</StatusBadge>
}

export function CheckoutStageBadge({ stage }: { stage: CheckoutStage }) {
  return <StatusBadge tone={STAGE_TONE[stage]}>{CHECKOUT_STAGE_LABEL[stage]}</StatusBadge>
}

/** "Còn 30 ngày" / "Hết hạn hôm nay" / "Quá 4 ngày" với màu theo mức độ gấp */
export function DaysLeft({ contract, today }: { contract: FacilityContract; today: string }) {
  if (contract.status === "TERMINATED") return <span className="text-muted">—</span>
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
