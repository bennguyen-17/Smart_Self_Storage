import { useState } from "react"
import {
  Banknote,
  Boxes,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  Clock,
    RotateCw,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { formatDate, formatVnd } from "@/lib/format"
import { checkinErrorMessage, collectPenalty, renewAtCounter } from "../api/checkinApi"
import type { RenewAtCounterResponse } from "../types"
import type { CheckinTarget } from "./StaffCustomerDetailModal"

interface RenewAtCounterDialogProps {
  contract: CheckinTarget | null
  onClose: () => void
  onRenewed: (response: RenewAtCounterResponse) => void
  onPenaltyCollected?: () => void
}

/**
 * US-20: Gia hạn hợp đồng tại quầy bằng tiền mặt (CASH).
 * Đồng bộ giao diện và cách tính toán gói gia hạn giống như Cổng Khách hàng (Customer Portal).
 */
export default function RenewAtCounterDialog({
  contract,
  onClose,
  onRenewed,
  onPenaltyCollected,
}: RenewAtCounterDialogProps) {
  if (contract === null) return null
  return (
    <RenewAtCounterBody
      key={contract.reservationId}
      contract={contract}
      onClose={onClose}
      onRenewed={onRenewed}
      onPenaltyCollected={onPenaltyCollected}
    />
  )
}

function RenewAtCounterBody({
  contract,
  onClose,
  onRenewed,
  onPenaltyCollected,
}: {
  contract: CheckinTarget
  onClose: () => void
  onRenewed: (response: RenewAtCounterResponse) => void
  onPenaltyCollected?: () => void
}) {
  const [result, setResult] = useState<RenewAtCounterResponse | null>(null)
  const [penaltyWasCollected, setPenaltyWasCollected] = useState(false)

  function handleClose() {
    if (result) {
      onRenewed(result)
      return
    }
    if (penaltyWasCollected) {
      onPenaltyCollected?.()
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden space-y-4 p-5 sm:p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 modal-animate-pop">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
          <div className="flex items-center space-x-3">
            <div className="size-10 rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
              {result ? <CheckCircle2 className="size-5" /> : <RotateCw className="size-5" />}
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white uppercase tracking-tight">
                {result ? "GIA HẠN TẠI QUẦY HOÀN TẤT" : "GIA HẠN HỢP ĐỒNG TẠI QUẦY"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {result
                  ? `${result.reservationCode ?? contract.reservationCode} · Đã thu tiền mặt & khôi phục hiệu lực`
                  : `${contract.reservationCode} · ${contract.customerName ?? "Khách hàng"}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {!result ? (
          <Body
            contract={contract}
            onClose={handleClose}
            onSuccess={setResult}
            onPenaltyCollected={() => {
              setPenaltyWasCollected(true)
              onPenaltyCollected?.()
            }}
          />
        ) : (
          <SuccessPanel contract={contract} result={result} onDone={handleClose} />
        )}
      </div>
    </div>
  )
}

function Body({
  contract,
  onClose,
  onSuccess,
  onPenaltyCollected,
}: {
  contract: CheckinTarget
  onClose: () => void
  onSuccess: (response: RenewAtCounterResponse) => void
  onPenaltyCollected?: () => void
}) {
  const [selectedDays, setSelectedDays] = useState(30)
  const [discountRate, setDiscountRate] = useState(0)
  const [packageLabel, setPackageLabel] = useState("1 Tháng")
  const [isCustomDays, setIsCustomDays] = useState(false)
  const [customDaysInput, setCustomDaysInput] = useState("14")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Tiền phạt quá hạn (nếu có)
  const [unpaidPenalty, setUnpaidPenalty] = useState(contract.unpaidPenaltyAmount ?? 0)
  const [isCollectingPenalty, setIsCollectingPenalty] = useState(false)
  const blockedByPenalty = unpaidPenalty > 0

  const packages = [
    { days: 30, months: 1, label: "1 Tháng", discountRate: 0, discountText: "" },
    { days: 60, months: 2, label: "2 Tháng", discountRate: 0, discountText: "" },
    { days: 90, months: 3, label: "3 Tháng", discountRate: 0.05, discountText: "-5%" },
    { days: 180, months: 6, label: "6 Tháng", discountRate: 0.1, discountText: "-10%" },
    { days: 360, months: 12, label: "12 Tháng", discountRate: 0.15, discountText: "-15%" },
  ]

  const handleSelectPackage = (days: number, label: string, discount: number) => {
    setIsCustomDays(false)
    setSelectedDays(days)
    setPackageLabel(label)
    setDiscountRate(discount)
  }

  const handleToggleCustom = () => {
    setIsCustomDays(true)
    if (!customDaysInput) setCustomDaysInput("14")
  }

  const effectiveDays = isCustomDays
    ? Math.max(7, parseInt(customDaysInput, 10) || 7)
    : selectedDays

  // Giá tính theo tháng (30 ngày)
  const monthlyRate =
    (contract.monthlyPrice && contract.monthlyPrice > 0)
      ? contract.monthlyPrice
      : (contract.rentalAmount && contract.rentalAmount > 0)
      ? contract.rentalAmount
      : 1200000

  const rawTotal = (monthlyRate / 30) * effectiveDays
  const discountAmount = rawTotal * (isCustomDays ? 0 : discountRate)
  const finalTotal = Math.round(rawTotal - discountAmount)

  // Parse ngày hiện tại hỗ trợ YYYY-MM-DD và DD/MM/YYYY
  const parseDate = (dStr?: string | null): Date | null => {
    if (!dStr) return null
    if (dStr.includes("-")) {
      const parts = dStr.split("T")[0].split("-")
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
      }
    }
    if (dStr.includes("/")) {
      const parts = dStr.split("/")
      if (parts.length === 3) {
        return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10))
      }
    }
    const d = new Date(dStr)
    return isNaN(d.getTime()) ? null : d
  }

  const formatDateDisplay = (d: Date | null): string => {
    if (!d) return ""
    const day = String(d.getDate()).padStart(2, "0")
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  const currentExpiryDate = parseDate(contract.reservationEndDate || contract.endDate)
  const formattedCurrentExpiry = currentExpiryDate ? formatDateDisplay(currentExpiryDate) : (contract.reservationEndDate || contract.endDate || "—")

  // Tính ngày hết hạn mới sau gia hạn (Nếu OVERDUE thì tính từ hôm nay theo BR-29)
  const calculateNewExpiryDate = (): string => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let baseDate = currentExpiryDate ? new Date(currentExpiryDate) : new Date(today)
    baseDate.setHours(0, 0, 0, 0)

    if (baseDate < today) {
      baseDate = new Date(today)
    }

    const newDate = new Date(baseDate)
    newDate.setDate(newDate.getDate() + effectiveDays)
    return formatDateDisplay(newDate)
  }

  const newExpiryFormatted = calculateNewExpiryDate()

  // Thu phạt nhanh nếu có
  async function handleQuickCollectPenalty() {
    setIsCollectingPenalty(true)
    setErrorMsg(null)
    try {
      await collectPenalty(contract.reservationId, { paymentMethod: "CASH" })
      toast.success("Thu phạt quá hạn thành công", {
        description: `Đã thu ${formatVnd(unpaidPenalty)} bằng tiền mặt. Bạn có thể gia hạn ngay bây giờ.`,
      })
      contract.unpaidPenaltyAmount = 0
      setUnpaidPenalty(0)
      onPenaltyCollected?.()
    } catch (error) {
      setErrorMsg(checkinErrorMessage(error))
    } finally {
      setIsCollectingPenalty(false)
    }
  }

  // Xác nhận gia hạn bằng tiền mặt
  async function handleConfirm() {
    if (blockedByPenalty) return
    setIsSubmitting(true)
    setErrorMsg(null)

    const selectedPkg = packages.find((p) => p.days === selectedDays)
    const monthsToSend = isCustomDays
      ? Math.max(1, Math.round(effectiveDays / 30))
      : (selectedPkg?.months || Math.max(1, Math.round(selectedDays / 30)))

    try {
      const response = await renewAtCounter(contract.reservationId, {
        months: monthsToSend,
        days: isCustomDays ? effectiveDays : undefined,
        paymentMethod: "CASH",
      })
      toast.success("Gia hạn tại quầy thành công", {
        description: `Hợp đồng ${response.reservationCode ?? contract.reservationCode} đã về ACTIVE (${isCustomDays ? `${effectiveDays} ngày` : packageLabel}).`,
      })
      onSuccess(response)
    } catch (error) {
      setErrorMsg(checkinErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const isOverdue = (contract.overdueDays ?? 0) > 0

  return (
    <div className="space-y-4">
      {/* Thông tin hợp đồng & ô kho */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3 text-xs">
        {/* Hàng 1: Mã ô kho (to rõ) + Size bên dưới, Cơ sở / Tầng bên phải */}
        <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-slate-200 dark:border-slate-700">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <Boxes className="size-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="font-black text-slate-900 dark:text-white text-base font-mono tracking-tight whitespace-nowrap">
                {contract.unitCode || "Ô kho"}
              </span>
            </div>
            {contract.unitSize && (
              <div className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100/90 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 max-w-full">
                <span className="truncate">
                  {contract.unitSize.toLowerCase().startsWith('size') ? contract.unitSize : `Size ${contract.unitSize}`}
                </span>
              </div>
            )}
          </div>

          <div className="text-right shrink-0 max-w-[50%]">
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Vị trí kho
            </div>
            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-0.5 line-clamp-2">
              {contract.floorName || "Tại quầy"}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 pt-0.5">
          <span className="flex items-center gap-1.5">
            <Calendar className="size-3.5 text-slate-400" />
            <span>Hạn hiện tại:</span>
            <strong className="text-slate-900 dark:text-white font-mono">{formattedCurrentExpiry}</strong>
          </span>
          {isOverdue ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
              <Clock className="size-3" />
              <span>Quá hạn {contract.overdueDays} ngày</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <Clock className="size-3" />
              <span>Đang hiệu lực</span>
            </span>
          )}
        </div>
      </div>

      {/* Chọn Gói Gia Hạn Thêm */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">
            Chọn Gói Gia Hạn Thêm:
          </label>
          {isCustomDays && (
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
              (Tối thiểu 7 ngày)
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {packages.map((pkg) => {
            const isSelected = !isCustomDays && selectedDays === pkg.days
            return (
              <button
                key={pkg.days}
                type="button"
                onClick={() => handleSelectPackage(pkg.days, pkg.label, pkg.discountRate)}
                className={`py-2 px-1 rounded-xl text-center font-bold text-xs transition-all cursor-pointer border ${
                  isSelected
                    ? "border-2 border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 shadow-xs"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-400"
                }`}
              >
                <div>{pkg.label}</div>
                {pkg.discountText && (
                  <span className="text-[10px] text-emerald-600 font-extrabold block">
                    {pkg.discountText}
                  </span>
                )}
              </button>
            )
          })}

          <button
            type="button"
            onClick={handleToggleCustom}
            className={`py-2 px-1 rounded-xl text-center font-bold text-xs transition-all cursor-pointer border ${
              isCustomDays
                ? "border-2 border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 shadow-xs"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-400"
            }`}
          >
            <div>Tùy chọn</div>
          </button>
        </div>

        {isCustomDays && (
          <div className="mt-2 p-3 bg-blue-50/60 dark:bg-slate-800/60 rounded-xl border border-blue-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-200">
              Số ngày gia hạn thêm (tối thiểu 7 ngày):
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="7"
                max="720"
                value={customDaysInput}
                onChange={(e) => setCustomDaysInput(e.target.value)}
                className="w-20 px-3 py-1 text-center font-black rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
              />
              <span className="font-bold text-slate-500">ngày</span>
            </div>
          </div>
        )}
      </div>

      {/* Bảng tính chi tiết tiền gia hạn */}
      <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 space-y-2 text-xs">
        <div className="flex justify-between text-slate-600 dark:text-slate-300">
          <span>Thời gian gia hạn thêm:</span>
          <strong className="text-slate-900 dark:text-white font-mono">
            {effectiveDays} Ngày ({isCustomDays ? "Tùy chọn" : packageLabel})
          </strong>
        </div>

        <div className="flex justify-between text-slate-600 dark:text-slate-300">
          <span>Hạn trả kho mới sau gia hạn:</span>
          <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
            {newExpiryFormatted} (+{effectiveDays} ngày)
          </strong>
        </div>

        <div className="flex justify-between text-slate-600 dark:text-slate-300">
          <span>Tiền gia hạn ({effectiveDays} ngày):</span>
          <strong className="text-slate-900 dark:text-white font-mono">
            {rawTotal.toLocaleString("vi-VN")} đ
          </strong>
        </div>

        {!isCustomDays && discountRate > 0 && (
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
            <span className="flex items-center gap-1">
              <Sparkles className="size-3" />
              <span>Chiết khấu ưu đãi (-{Math.round(discountRate * 100)}%):</span>
            </span>
            <span className="font-mono">-{discountAmount.toLocaleString("vi-VN")} đ</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1 text-slate-600 dark:text-slate-300">
          <span>Hình thức thanh toán:</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Banknote className="size-3.5" />
            <span>Tiền mặt (CASH) tại quầy</span>
          </span>
        </div>

        <div className="flex justify-between items-center pt-2.5 border-t border-blue-200 dark:border-blue-800 text-sm">
          <span className="font-bold text-slate-900 dark:text-white">
            Tổng tiền thanh toán gia hạn:
          </span>
          <span className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400 font-mono">
            {finalTotal.toLocaleString("vi-VN")} VNĐ
          </span>
        </div>
      </div>

      {/* Cảnh báo nợ phạt quá hạn */}
      {blockedByPenalty && (
        <div className="flex flex-col gap-2 rounded-2xl border border-rose-300 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
          <div className="flex items-start space-x-2">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-rose-600" />
            <span>
              Còn <b>{formatVnd(unpaidPenalty)}</b> tiền phạt quá hạn chưa nộp. Vui lòng thu phạt trước khi gia hạn hợp đồng.
            </span>
          </div>
          <button
            type="button"
            disabled={isCollectingPenalty}
            onClick={handleQuickCollectPenalty}
            className="self-end cursor-pointer rounded-xl bg-rose-600 hover:bg-rose-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition disabled:opacity-60"
          >
            {isCollectingPenalty ? "Đang thu phạt..." : `Thu phạt ${formatVnd(unpaidPenalty)} (Tiền mặt)`}
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* Nút hành động */}
      <div className="flex items-center space-x-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="flex-1 cursor-pointer rounded-2xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 py-3.5 text-xs font-extrabold text-slate-800 dark:text-slate-200 transition disabled:opacity-60"
        >
          Hủy bỏ
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isSubmitting || blockedByPenalty || finalTotal <= 0}
          className="flex-2 cursor-pointer rounded-2xl bg-blue-600 hover:bg-blue-700 py-3.5 text-xs font-extrabold text-white shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <CalendarPlus className="size-4" />
          <span>
            {isSubmitting
              ? "Đang xử lý..."
              : `Xác nhận gia hạn (${finalTotal.toLocaleString("vi-VN")} đ)`}
          </span>
        </button>
      </div>
    </div>
  )
}

function SuccessPanel({
  contract,
  result,
  onDone,
}: {
  contract: CheckinTarget
  result: RenewAtCounterResponse
  onDone: () => void
}) {
  return (
    <div className="space-y-3.5">
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-3.5 text-xs text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
        <div className="mb-1 flex items-center space-x-2 font-black">
          <CheckCircle2 className="size-4 text-emerald-600" />
          <span>Hợp đồng đã trở lại ACTIVE</span>
        </div>
        <p className="text-emerald-800/90 dark:text-emerald-300/90">
          Đã thu đủ tiền gia hạn bằng tiền mặt tại quầy, xuất hóa đơn EXT và khôi phục quyền sinh mã PIN 24/7 cho khách.
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-2 text-xs">
        <Row label="Mã hợp đồng" value={result.reservationCode ?? contract.reservationCode} />
        <Row label="Khách hàng" value={contract.customerName ?? "—"} />
        <Row label="Ô kho" value={contract.unitCode ?? "—"} />
        <Row label="Trạng thái" value={result.contractStatus ?? "ACTIVE"} />
        <Row label="Hóa đơn gia hạn (EXT)" value={result.invoiceNumber ?? "—"} />
        {result.discountPercent != null && result.discountPercent > 0 && (
          <Row label="Chiết khấu ưu đãi" value={`${result.discountPercent}%`} />
        )}
        <Row
          label="Đã thu tiền mặt tại quầy"
          value={formatVnd(result.amount ?? 0)}
          strong
        />
        <Row label="Hạn thuê mới" value={formatDate(result.newExpiryDate)} />
      </div>



      <div className="pt-2">
        <button
          type="button"
          onClick={onDone}
          className="w-full cursor-pointer rounded-2xl bg-blue-600 hover:bg-blue-700 py-3.5 text-xs font-extrabold text-white shadow-md transition"
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
    <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-1.5 first:border-t-0 first:pt-0 dark:border-slate-700">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span
        className={
          strong
            ? "text-base font-black text-blue-600 dark:text-blue-400 font-mono"
            : "font-bold text-slate-800 dark:text-slate-200 font-mono"
        }
      >
        {value}
      </span>
    </div>
  )
}
