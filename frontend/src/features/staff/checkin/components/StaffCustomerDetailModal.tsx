import { useState } from "react"
import { IdCardIcon, Edit3Icon, CheckIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { updateCustomerCccd } from "../api/checkinApi"

import { formatDate, formatVnd } from "@/lib/format"

import type { StaffReservationItem } from "../types"
import ProtoModal from "@/features/staff/components/ProtoModal"

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
  CANCELLED: {
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
  const [isEditingCccd, setIsEditingCccd] = useState(false)
  const [cccdValue, setCccdValue] = useState(contract.customerIdNumber ?? "")
  const [isSavingCccd, setIsSavingCccd] = useState(false)

  const handleSaveCccd = async () => {
    if (!/^\d{12}$/.test(cccdValue.trim())) {
      toast.error("Số CCCD phải gồm đúng 12 chữ số.")
      return
    }
    setIsSavingCccd(true)
    try {
      await updateCustomerCccd(contract.reservationId, cccdValue.trim())
      contract.customerIdNumber = cccdValue.trim()
      toast.success("Hiệu chỉnh số CCCD khách hàng thành công!")
      setIsEditingCccd(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Lỗi khi cập nhật CCCD")
    } finally {
      setIsSavingCccd(false)
    }
  }

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
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted">Số CCCD (Định danh):</span>
                {!isEditingCccd && (
                  <button
                    type="button"
                    onClick={() => {
                      setCccdValue(contract.customerIdNumber ?? "")
                      setIsEditingCccd(true)
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-500 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3Icon className="size-3" /> Hiệu chỉnh
                  </button>
                )}
              </div>
              {isEditingCccd ? (
                <div className="flex items-center gap-1.5 mt-1">
                  <input
                    type="text"
                    maxLength={12}
                    value={cccdValue}
                    onChange={(e) => setCccdValue(e.target.value.replace(/\D/g, ""))}
                    placeholder="Nhập 12 số CCCD thẻ gốc"
                    className="w-full text-xs font-mono font-bold px-2.5 py-1.5 rounded-lg border border-blue-500 bg-white dark:bg-slate-900 focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    disabled={isSavingCccd}
                    onClick={handleSaveCccd}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <CheckIcon className="size-3.5" /> Lưu
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingCccd(false)}
                    className="px-2 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer shrink-0"
                  >
                    <XIcon className="size-3.5" />
                  </button>
                </div>
              ) : (
                <span className="text-title font-mono text-sm font-bold block mt-0.5">
                  {contract.customerIdNumber ?? "—"}
                </span>
              )}
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
              <span className="text-title font-mono text-sm font-bold">
                {contract.customerEmail ?? "—"}
              </span>
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
              <b className="text-title">Kho {contract.unitCode ?? "—"}</b>
            </div>
            <div className="flex items-center justify-between">
              <span>Thời gian thuê:</span>
              <b className="text-title">{contract.rentalDuration ?? "—"}</b>
            </div>
            <div className="flex items-center justify-between">
              <span>Ngày bắt đầu:</span>
              <b className="text-title">
                {formatDate(contract.reservationStartDate)}
              </b>
            </div>
            <div className="flex items-center justify-between">
              <span>Ngày kết thúc:</span>
              <b className="text-rose-600 dark:text-rose-400">
                {formatDate(contract.reservationEndDate)}
              </b>
            </div>
            {contract.contractStatus === "OVERDUE" && (
              <>
                <div className="flex items-center justify-between">
                  <span>Số ngày quá hạn:</span>
                  <b className="text-rose-600">
                    {contract.overdueDays ?? 0} ngày
                  </b>
                </div>
                <div className="flex items-center justify-between">
                  <span>Phạt chưa nộp:</span>
                  <b className="text-rose-600">
                    {formatVnd(contract.unpaidPenaltyAmount)}
                  </b>
                </div>
              </>
            )}
            {/* TIỀN THUÊ KHO & TIỀN CỌC */}
            <div className="flex items-center justify-between">
              <span>Tiền thuê kho:</span>
              <b className="text-title font-mono font-bold">
                {formatVnd(contract.rentalAmount ?? contract.depRemainingAmount)}
              </b>
            </div>
            <div className="flex items-center justify-between">
              <span>Tiền cọc giữ chỗ:</span>
              <b className="text-amber-600 dark:text-amber-400 font-mono font-bold">
                {formatVnd(contract.depositAmount ?? contract.depPaidAmount)}
              </b>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200/80 pt-1.5 dark:border-slate-800">
              <span className="font-bold">Tổng giá trị hợp đồng:</span>
              <b className="text-title font-mono font-extrabold text-sm text-blue-600 dark:text-blue-400">
                {formatVnd(contract.depAmount ?? ((contract.rentalAmount ?? 0) + (contract.depositAmount ?? 0)))}
              </b>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200/60 pt-1 dark:border-slate-800">
              <span>Tình trạng thanh toán:</span>
              {contract.contractStatus === "ACTIVE" ? (
                <b className="text-emerald-600 dark:text-emerald-400 font-bold">
                  Đã thanh toán đủ 100%
                </b>
              ) : (contract.depRemainingAmount ?? 0) > 0 ? (
                <b className="text-rose-600 dark:text-rose-400 font-bold">
                  Cần thu tại quầy: {formatVnd(contract.depRemainingAmount ?? contract.rentalAmount)}
                </b>
              ) : (
                <b className="text-emerald-600 dark:text-emerald-400 font-bold">
                  Đã cọc online (100% Tiền cọc)
                </b>
              )}
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
