import { useState } from "react"
import {
  BanknoteIcon,
  CheckCircle2Icon,
  ClockIcon,
  KeyRoundIcon,
  PackageIcon,
  UserIcon,
} from "lucide-react"
import { toast } from "sonner"

import { formatDate, formatVnd } from "@/lib/format"
import { checkinErrorMessage, confirmCheckin } from "../api/checkinApi"
import {
  CHECKIN_HOURS,
  checkinDateStatus,
  isWithinCheckinHours,
} from "../constants"
import type { StaffCheckInResponse } from "../types"
import type { CheckinTarget } from "./StaffCustomerDetailModal"
import ProtoModal from "./ProtoModal"

interface ConfirmCheckinDialogProps {
  contract: CheckinTarget | null
  onClose: () => void
  onConfirmed: (response: StaffCheckInResponse) => void
}

function ConfirmCheckinDialog({
  contract,
  onClose,
  onConfirmed,
}: ConfirmCheckinDialogProps) {
  if (contract === null) return null
  return (
    <CheckinDialogBody
      key={contract.reservationId}
      contract={contract}
      onClose={onClose}
      onConfirmed={onConfirmed}
    />
  )
}

function CheckinDialogBody({
  contract,
  onClose,
  onConfirmed,
}: {
  contract: CheckinTarget
  onClose: () => void
  onConfirmed: (response: StaffCheckInResponse) => void
}) {
  const [result, setResult] = useState<StaffCheckInResponse | null>(null)

  function handleClose() {
    if (result) {
      onConfirmed(result)
      return
    }
    onClose()
  }

  return (
    <ProtoModal
      open
      onClose={handleClose}
      title={
        result ? "Bàn giao kho hoàn tất" : "Xác nhận Check-in & Bàn giao kho"
      }
      subtitle={`${contract.reservationCode} · ${contract.customerName ?? ""}`}
      icon={
        result ? (
          <CheckCircle2Icon className="size-5" />
        ) : (
          <KeyRoundIcon className="size-5" />
        )
      }
    >
      {!result && (
        <Body contract={contract} onClose={onClose} onSuccess={setResult} />
      )}
      {result && <SuccessPanel result={result} onDone={handleClose} />}
    </ProtoModal>
  )
}

function Body({
  contract,
  onClose,
  onSuccess,
}: {
  contract: CheckinTarget
  onClose: () => void
  onSuccess: (response: StaffCheckInResponse) => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const collectAmount = contract.depRemainingAmount ?? 0
  const outsideHours = !isWithinCheckinHours()
  const startDate = contract.reservationStartDate
  const dateStatus = checkinDateStatus(startDate)
  const dateBlocker =
    dateStatus === "before"
      ? `Chưa đến ngày check-in. Khách hẹn nhận kho vào ${formatDate(startDate)}.`
      : dateStatus === "after"
        ? `Đã quá ngày check-in. Ngày nhận kho của khách là ${formatDate(startDate)}.`
        : null

  async function handleConfirm() {
    if (dateBlocker) {
      setErrorMsg(dateBlocker)
      return
    }
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      const response = await confirmCheckin(contract.reservationId, {
        collectedAmount: collectAmount,
        paymentMethod: "CASH",
      })
      toast.success("Check-in thành công", {
        description: `Hợp đồng ${response.reservationCode ?? contract.reservationCode} đã chuyển sang ĐANG THUÊ.`,
      })
      onSuccess(response)
    } catch (error) {
      setErrorMsg(checkinErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* THÔNG TIN KHÁCH HÀNG & Ô KHO BÀN GIAO */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-slate-50/70 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex items-center gap-2">
          <UserIcon className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="font-bold text-slate-900 dark:text-white">
            {contract.customerName ?? "Khách hàng"}
          </span>
          {contract.customerPhone && (
            <span className="text-muted font-mono text-[11px]">
              ({contract.customerPhone})
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <PackageIcon className="size-3.5 text-slate-400 shrink-0" />
          <span className="text-muted text-[11px]">Ô kho:</span>
          <span className="rounded-md bg-blue-100 px-2 py-0.5 font-mono text-xs font-black text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            {contract.unitCode ?? "—"}
          </span>
        </div>
      </div>

      {dateBlocker && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-300 bg-rose-50/80 p-3 text-xs text-rose-800 dark:border-rose-800/70 dark:bg-rose-950/30 dark:text-rose-300">
          <ClockIcon className="mt-0.5 size-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <div className="leading-relaxed">
            <span className="font-bold">Không thể check-in. </span>
            {dateBlocker}
          </div>
        </div>
      )}

      {/* KHỐI THU TIỀN TẠI QUẦY (HERO CARD) */}
      {collectAmount > 0 ? (
        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-white p-4 shadow-xs dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <BanknoteIcon className="size-4 text-blue-600 dark:text-blue-400" />
              Tiền thuê cần thu tại quầy
            </span>
            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
              Tiền mặt tại quầy
            </span>
          </div>

          <div className="text-3xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight">
            {formatVnd(collectAmount)}
          </div>

          {/* Chi tiết khấu trừ cọc */}
          <div className="pt-2.5 border-t border-slate-200/70 dark:border-slate-800/80 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span>Tổng giá trị hợp đồng:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatVnd(contract.depAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <CheckCircle2Icon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                Đã cọc online (100% Tiền cọc):
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                - {formatVnd(contract.depPaidAmount)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-300/80 bg-emerald-50/70 dark:border-emerald-800/60 dark:bg-emerald-950/30 p-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <CheckCircle2Icon className="size-5" />
          </div>
          <div>
            <p className="text-xs font-black text-emerald-900 dark:text-emerald-300">
              Đã thanh toán đủ 100% online
            </p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
              Khách hàng đã hoàn tất toàn bộ tiền thuê và tiền cọc. Không cần thu thêm tiền tại quầy.
            </p>
          </div>
        </div>
      )}

      {/* CẢNH BÁO NGOÀI KHUNG GIỜ QUY CHUẨN (NẾU CÓ) */}
      {outsideHours && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-300">
          <ClockIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Khung giờ quy chuẩn: </span>
            Khung giờ bàn giao kho là {CHECKIN_HOURS.start}:00 – {CHECKIN_HOURS.end}:00. Nhân viên vẫn có thể linh hoạt bàn giao ngoài giờ khi có khách đến nhận.
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* CỤM NÚT THAO TÁC RÕ RÀNG, KHÔNG BỊ NHẢY DÒNG */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="w-28 sm:w-32 cursor-pointer rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200 disabled:opacity-60 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Hủy bỏ
        </button>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={isSubmitting || dateBlocker !== null}
          className="flex-1 cursor-pointer flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-black text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 disabled:opacity-60 whitespace-nowrap"
        >
          {isSubmitting ? (
            <span>Đang xử lý...</span>
          ) : (
            <>
              <KeyRoundIcon className="size-4" />
              <span>
                {collectAmount > 0
                  ? "Xác nhận thu tiền & Bàn giao"
                  : "Xác nhận bàn giao kho"}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

/** US-17: xác nhận bàn giao — PIN đã kích hoạt và biên lai thanh toán. */
function SuccessPanel({
  result,
  onDone,
}: {
  result: StaffCheckInResponse
  onDone: () => void
}) {
  return (
    <div className="space-y-3.5">
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-3.5 text-xs text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
        <div className="mb-1 flex items-center space-x-2 font-black">
          <CheckCircle2Icon className="size-4" />
          <span>Đã thu đủ 100% tiền thuê &amp; bàn giao kho thành công</span>
        </div>
        <p className="text-emerald-800/90 dark:text-emerald-300/90">
          Hợp đồng đã kích hoạt có hiệu lực (ĐANG THUÊ) và ô kho đã bàn giao cho khách. Thông báo xác nhận và biên lai thanh toán đã được gửi đến khách hàng.
        </p>
      </div>

      <div className="inner-box space-y-2 rounded-2xl border p-3.5 text-xs">
        <Row label="Mã hợp đồng" value={result.reservationCode ?? "—"} />
        <Row label="Trạng thái hợp đồng" value={result.contractStatus ?? "—"} />
        <Row label="Trạng thái ô kho" value={result.unitStatus ?? "—"} />
        <Row
          label="Đã thu tại quầy"
          value={formatVnd(result.collectedAmount ?? 0)}
          strong
        />
      </div>

      <div className="rounded-2xl border border-blue-300 bg-blue-50 p-3.5 text-xs dark:border-blue-800 dark:bg-blue-950/30">
        <div className="text-[10px] font-bold tracking-wider text-blue-700 uppercase dark:text-blue-400">
          Bàn giao vật tư &amp; mã mở khóa
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-4">
          <span className="text-muted">Chìa khóa cơ</span>
          <span className="text-title font-bold">Đã bàn giao</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-4 border-t border-blue-200 pt-1.5 dark:border-blue-900">
          <span className="text-muted">Mã PIN mở cổng (24/7)</span>
          <span className="font-mono text-lg font-black tracking-widest text-blue-600 dark:text-blue-400">
            {result.gatePin ?? "—"}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted">
          Mã PIN động bảo mật — khách có thể lấy mã mới trên ứng dụng mỗi lần ra vào.
        </p>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={onDone}
          className="w-full cursor-pointer rounded-xl bg-blue-600 py-3 text-xs font-black text-white shadow-md transition hover:bg-blue-700"
        >
          Hoàn tất &amp; Đóng
        </button>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  strong,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-1.5 first:border-t-0 first:pt-0 dark:border-slate-800">
      <span className="text-muted">{label}</span>
      <span
        className={
          strong
            ? "text-base font-black text-blue-600 dark:text-blue-400"
            : "text-title font-bold"
        }
      >
        {value}
      </span>
    </div>
  )
}

export default ConfirmCheckinDialog
