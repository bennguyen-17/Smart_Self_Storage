import { IdCardIcon } from "lucide-react"

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
    className: "bg-rose-600 text-white animate-pulse",
  },
  CANCELED: {
    label: "❌ ĐÃ HỦY ĐƠN",
    className: "bg-slate-200 text-slate-700",
  },
}

function badgeOf(status: string | null | undefined) {
  return (
    (status && STATUS_BADGE[status]) || {
      label: status ?? "—",
      className: "bg-slate-200 text-slate-700",
    }
  )
}

/** Modal chi tiết khách hàng & hợp đồng — bám prototype staff_portal.html */
function StaffCustomerDetailModal({
  contract,
  onClose,
}: StaffCustomerDetailModalProps) {
  return (
    <ProtoModal
      open={contract !== null}
      onClose={onClose}
      title="Chi tiết thông tin khách hàng & hợp đồng"
      icon={<IdCardIcon className="size-5" />}
      maxWidth="max-w-lg"
    >
      {contract && <Body contract={contract} onClose={onClose} />}
    </ProtoModal>
  )
}

function Body({
  contract,
  onClose,
}: {
  contract: CheckinTarget
  onClose: () => void
}) {
  const badge = badgeOf(contract.contractStatus)

  return (
    <>
      {/* CUSTOMER SUMMARY BANNER */}
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
        {/* SECTION 1: IDENTITY & CONTACT */}
        <div className="inner-box space-y-2 rounded-2xl border p-3.5">
          <div className="border-b pb-1 text-[10px] font-bold tracking-wider text-muted uppercase">
            1. Thông tin Định danh &amp; Liên hệ
          </div>
          <div className="text-title space-y-1.5">
            <div>
              <span className="block text-[10px] text-muted">Số CCCD:</span>
              <span className="text-title font-mono text-sm font-bold">—</span>
            </div>
            <div>
              <span className="block text-[10px] text-muted">
                Số điện thoại:
              </span>
              <span className="text-title font-mono text-sm font-bold">
                {contract.customerPhone ?? "—"}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-muted">Email:</span>
              <span className="text-title font-mono text-sm font-bold">—</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: UNIT */}
        <div className="inner-box space-y-2 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-3.5">
          <div className="border-b border-blue-200 pb-1 text-[10px] font-bold tracking-wider text-blue-700 uppercase dark:border-blue-800/40 dark:text-blue-400">
            2. Thông tin Ô kho &amp; Hình thức Bàn giao
          </div>
          <div className="text-title space-y-1.5">
            <div className="flex items-center justify-between">
              <span>Vị trí Ô kho:</span>
              <b className="text-title">
                Kho {contract.unitCode ?? "—"}
                {contract.floorName ? ` (${contract.floorName})` : ""}
              </b>
            </div>
            <div className="flex items-center justify-between">
              <span>Thời gian thuê:</span>
              <b className="text-title">—</b>
            </div>
            <div className="flex items-center justify-between">
              <span>Ngày bắt đầu:</span>
              <b className="text-title">{contract.checkInDate ?? "—"}</b>
            </div>
            <div className="flex items-center justify-between">
              <span>Ngày kết thúc:</span>
              <b className="text-title">—</b>
            </div>
            <div className="flex items-center justify-between">
              <span>Cọc:</span>
              <b className="text-green-600">{formatVnd(contract.depAmount)}</b>
            </div>
          </div>
        </div>
      </div>

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
