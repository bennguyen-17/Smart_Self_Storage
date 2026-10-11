import { IdCardIcon, KeyRoundIcon, RepeatIcon, XCircleIcon } from "lucide-react"

import { formatVnd } from "@/lib/format"

import type { StaffReservationItem } from "../types"
import ProtoModal from "./ProtoModal"

/** Item có thể kèm thêm field của lookup (unitStatus, contractPdfUrl). */
export type CheckinTarget = StaffReservationItem & {
  unitStatus?: string | null
  contractPdfUrl?: string | null
}

interface StaffCustomerDetailModalProps {
  contract: CheckinTarget | null
  onClose: () => void
  onCheckin: (contract: CheckinTarget) => void
  onChangeUnit: (contract: CheckinTarget) => void
  onCancel: (contract: CheckinTarget) => void
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PENDING_CHECKIN: {
    label: "⌛ CHỜ CHECK-IN",
    className: "bg-amber-100 text-amber-900",
  },
  ACTIVE: {
    label: "🟢 ĐANG SỬ DỤNG",
    className: "bg-emerald-100 text-emerald-800",
  },
  OVERDUE: {
    label: "🚨 QUÁ HẠN",
    className: "bg-rose-600 text-white",
  },
  CANCELED: {
    label: "❌ ĐÃ HỦY ĐƠN",
    className: "bg-slate-200 text-slate-700",
  },
}

const HANDOVER_TEXT: Record<string, string> = {
  PENDING_CHECKIN: "🔑 02 Chìa khóa cơ vật lý + 🔢 PIN 24/7 Smart Lock",
  ACTIVE: "✓ Đã bàn giao 02 chìa khóa + PIN 24/7",
  OVERDUE: "🔒 Tạm khóa kép Smart Lock 24/7",
  CANCELED: "Chưa bàn giao vật tư",
}

function badgeOf(status: string | null | undefined) {
  return (
    (status && STATUS_BADGE[status]) || {
      label: status ?? "—",
      className: "bg-slate-200 text-slate-700",
    }
  )
}

/** Modal chi tiết — bám prototype self_storage_prototype.html + thao tác US-16 */
function StaffCustomerDetailModal({
  contract,
  onClose,
  onCheckin,
  onChangeUnit,
  onCancel,
}: StaffCustomerDetailModalProps) {
  return (
    <ProtoModal
      open={contract !== null}
      onClose={onClose}
      title="CHI TIẾT THÔNG TIN KHÁCH HÀNG & HỢP ĐỒNG"
      subtitle="Bàn trực ca vận hành Self-Storage 391"
      maxWidth="max-w-lg"
      icon={<IdCardIcon className="size-5" />}
    >
      {contract && (
        <Body
          contract={contract}
          onClose={onClose}
          onCheckin={onCheckin}
          onChangeUnit={onChangeUnit}
          onCancel={onCancel}
        />
      )}
    </ProtoModal>
  )
}

function Body({
  contract,
  onClose,
  onCheckin,
  onChangeUnit,
  onCancel,
}: {
  contract: CheckinTarget
  onClose: () => void
  onCheckin: (contract: CheckinTarget) => void
  onChangeUnit: (contract: CheckinTarget) => void
  onCancel: (contract: CheckinTarget) => void
}) {
  const badge = badgeOf(contract.contractStatus)
  const handover =
    HANDOVER_TEXT[contract.contractStatus ?? ""] ?? "Chưa bàn giao vật tư"
  const canAct = contract.contractStatus === "PENDING_CHECKIN"

  return (
    <>
      {/* CUSTOMER SUMMARY BANNER */}
      <div className="space-y-2 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-4 text-white shadow-inner">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-black text-white">
            {contract.customerName ?? "—"}
            {contract.customerPhone ? ` (SĐT: ${contract.customerPhone})` : ""}
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>
        <div className="font-mono text-[11px] text-blue-200">
          #{contract.reservationCode}
          {contract.depAmount != null
            ? ` (Cọc: ${formatVnd(contract.depAmount)} Online)`
            : ""}
        </div>
      </div>

      <div className="space-y-3 text-xs">
        {/* SECTION 1: EKYC */}
        <div className="inner-box space-y-2 rounded-2xl border p-3.5">
          <div className="flex items-center justify-between border-b pb-1">
            <span className="text-[10px] font-bold tracking-wider text-muted uppercase">
              1. Xác thực Hồ sơ Định danh eKYC
            </span>
            <span className="text-[10px] font-extrabold text-emerald-600">
              ✓ eKYC Hợp lệ 100%
            </span>
          </div>
          <div className="text-title">
            <span className="block text-[10px] text-muted">
              Số CCCD / Đăng ký eKYC:
            </span>
            <span className="font-mono text-sm font-bold text-blue-600">
              —
            </span>
          </div>
        </div>

        {/* SECTION 2: UNIT & HANDOVER */}
        <div className="inner-box space-y-2 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-3.5">
          <div className="border-b border-blue-200 pb-1 text-[10px] font-bold tracking-wider text-blue-700 uppercase dark:border-blue-800/40 dark:text-blue-400">
            2. Thông tin Ô kho & Hình thức Bàn giao
          </div>
          <div className="space-y-1.5 text-title">
            <div className="flex items-center justify-between">
              <span>Vị trí Ô kho:</span>
              <b className="text-blue-600">
                Kho {contract.unitCode ?? "—"} ({contract.floorName ?? "—"})
              </b>
            </div>
            <div className="flex items-center justify-between border-t pt-1.5">
              <span>Vật tư bàn giao:</span>
              <b className="text-title text-[11px]">{handover}</b>
            </div>
          </div>
        </div>
      </div>

      {/* THAO TÁC US-16 (chỉ với hợp đồng chờ check-in) */}
      {canAct && (
        <div className="space-y-2 rounded-2xl border border-dashed border-slate-300 p-3 dark:border-slate-700">
          <div className="text-[10px] font-bold tracking-wider text-muted uppercase">
            Thao tác tại quầy (BR-20)
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onCheckin(contract)}
              className="flex flex-1 cursor-pointer items-center justify-center space-x-1.5 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-extrabold whitespace-nowrap text-white shadow-md transition hover:bg-blue-700"
            >
              <KeyRoundIcon className="size-3.5" />
              <span>Check-in</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeUnit(contract)}
              className="flex flex-1 cursor-pointer items-center justify-center space-x-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-extrabold whitespace-nowrap text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <RepeatIcon className="size-3.5" />
              <span>Đổi ô kho</span>
            </button>
            <button
              type="button"
              onClick={() => onCancel(contract)}
              className="flex flex-1 cursor-pointer items-center justify-center space-x-1.5 rounded-xl bg-rose-600 px-3 py-2.5 text-xs font-extrabold whitespace-nowrap text-white shadow-md transition hover:bg-rose-700"
            >
              <XCircleIcon className="size-3.5" />
              <span>Hủy tại quầy</span>
            </button>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onClose}
          className="w-full cursor-pointer rounded-xl bg-slate-900 py-3 text-xs font-extrabold text-white shadow-lg transition hover:bg-slate-800 dark:bg-slate-800"
        >
          Đóng Cửa Sổ Chi Tiết Khách Hàng
        </button>
      </div>
    </>
  )
}

export default StaffCustomerDetailModal
