import { KeyRoundIcon, RepeatIcon, XCircleIcon } from "lucide-react"

import { formatDate, formatVnd } from "@/lib/format"

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
    className:
      "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  },
  ACTIVE: {
    label: "🟢 ĐANG SỬ DỤNG",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  OVERDUE: {
    label: "🚨 QUÁ HẠN",
    className: "bg-rose-600 text-white",
  },
  CANCELED: {
    label: "❌ ĐÃ HỦY ĐƠN",
    className:
      "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
}

function badgeOf(status: string | null | undefined) {
  if (status && STATUS_BADGE[status]) return STATUS_BADGE[status]
  return {
    label: status ?? "—",
    className:
      "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  }
}

/** Modal chi tiết khách hàng & hợp đồng — bám prototype + thao tác US-16 */
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
      title="Chi tiết thông tin Khách hàng & Hợp đồng"
      maxWidth="max-w-lg"
      icon={<KeyRoundIcon className="size-5" />}
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
  const canAct = contract.contractStatus === "PENDING_CHECKIN"

  return (
    <>
      <div className="space-y-2 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-4 text-center text-white shadow-inner">
        <div className="text-xl font-black tracking-tight text-white">
          {contract.customerName ?? "—"}
        </div>
        <div className="flex items-center justify-center">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>
      </div>

      <div className="space-y-3 text-xs">
        <div className="inner-box space-y-2 rounded-2xl border p-3.5">
          <div className="border-b pb-1 text-[10px] font-bold tracking-wider text-muted uppercase">
            1. Thông tin Định danh & Liên hệ
          </div>
          <div className="space-y-1.5 text-title">
            <Field label="Mã đặt chỗ" value={contract.reservationCode} mono />
            <Field
              label="Số điện thoại"
              value={contract.customerPhone ?? "—"}
              mono
            />
            <Field label="Trạng thái hồ sơ" value={contract.reservationStatus ?? "—"} />
          </div>
        </div>

        <div className="inner-box space-y-2 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-3.5">
          <div className="border-b border-blue-200 pb-1 text-[10px] font-bold tracking-wider text-blue-700 uppercase dark:border-blue-800/40 dark:text-blue-400">
            2. Thông tin Ô kho & Bàn giao
          </div>
          <div className="space-y-1.5 text-title">
            <Row
              label="Vị trí Ô kho"
              value={`Kho ${contract.unitCode ?? "—"} (${contract.floorName ?? "—"})`}
            />
            {contract.unitStatus && (
              <Row label="Trạng thái ô" value={contract.unitStatus} />
            )}
            <Row
              label="Ngày hẹn nhận kho"
              value={formatDate(contract.checkInDate)}
            />
            <Row label="Tổng tiền (DEP)" value={formatVnd(contract.depAmount)} />
            <Row
              label="Đã thu"
              value={formatVnd(contract.depPaidAmount)}
              valueClass="text-green-600 dark:text-green-400"
            />
            <Row
              label="Còn phải thu tại quầy"
              value={formatVnd(contract.depRemainingAmount)}
              valueClass="text-blue-600 dark:text-blue-400"
            />
          </div>
        </div>
      </div>

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

function Field({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div>
      <span className="block text-[10px] text-muted">{label}:</span>
      <span className={`text-sm font-bold text-title ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  )
}

function Row({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted">{label}:</span>
      <b className={`text-right ${valueClass ?? "text-title"}`}>{value}</b>
    </div>
  )
}

export default StaffCustomerDetailModal
