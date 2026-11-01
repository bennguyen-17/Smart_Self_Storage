import { useState, useEffect, type ChangeEvent } from "react"
import {
  CameraIcon,
  ClipboardCheckIcon,
  ListChecksIcon,
  UploadIcon,
} from "lucide-react"
import { toast } from "sonner"

import apiClient from "@/lib/apiClient"
import { formatVnd } from "@/lib/format"

import ProtoModal from "@/features/staff/components/ProtoModal"

export interface InspectionTarget {
  contractId?: number | null
  reservationId?: number | null
  ticketId?: number | null
  contractCode: string
  customerName: string
  unitCode: string
  depositAmount: number | null
}

interface StaffInspectionModalProps {
  target: InspectionTarget | null
  onClose: () => void
  onConfirmed?: () => void
}

/** Bảng giá hư hại niêm yết */
const DAMAGE_ITEMS = [
  { id: "cleaning", label: "1. Vệ sinh kho (rác/bẩn nặng)", fee: 150_000 },
  { id: "key", label: "2. Mất chìa khóa cơ", fee: 200_000 },
  { id: "paint", label: "3. Trầy xước vách/khoan lỗ", fee: 300_000 },
  { id: "electric", label: "4. Hỏng bóng đèn/ổ cắm", fee: 300_000 },
  { id: "dent", label: "5. Móp méo/thủng vách ngăn", fee: 500_000 },
  { id: "door", label: "6. Hư hỏng cửa/khóa chính", fee: 1_000_000 },
]

function StaffInspectionModal({ target, onClose, onConfirmed }: StaffInspectionModalProps) {
  return (
    <ProtoModal
      open={target !== null}
      onClose={onClose}
      maxWidth="max-w-2xl"
      title="Biên bản nghiệm thu hiện trạng trả kho"
      subtitle="Kiểm tra hư hại đối chiếu bảng giá niêm yết & Quyết toán cọc"
      icon={<ClipboardCheckIcon className="size-5" />}
    >
      {target && (
        <Body
          key={target.contractId || target.contractCode}
          target={target}
          onClose={onClose}
          onConfirmed={onConfirmed}
        />
      )}
    </ProtoModal>
  )
}

function Body({
  target,
  onClose,
  onConfirmed,
}: {
  target: InspectionTarget
  onClose: () => void
  onConfirmed?: () => void
}) {
  const [damages, setDamages] = useState<string[]>([])
  const [photo, setPhoto] = useState<string | null>(null)
  const [isCompensationCollected, setIsCompensationCollected] = useState(false)

  const [actualDeposit, setActualDeposit] = useState<number>(target.depositAmount ?? 0)
  const [unpaidPenalty, setUnpaidPenalty] = useState<number>(0)
  const [displayContractCode, setDisplayContractCode] = useState<string>(() => {
    if (target.contractCode && target.contractCode.startsWith("CTR-") && target.contractCode.length > 8) {
      return target.contractCode
    }
    return target.contractCode || "—"
  })

  // 1. Ưu tiên lấy từ API preview quyết toán
  useEffect(() => {
    const targetId = target.contractId || target.reservationId
    if (targetId) {
      apiClient.get(`/staff/checkout/${targetId}/preview`)
        .then((res: any) => {
          const data = (res as any)?.data?.data ?? (res as any)?.data ?? res
          if (data?.depositAmount != null) {
            setActualDeposit(Number(data.depositAmount))
          }
          if (data?.unpaidPenalties != null) {
            setUnpaidPenalty(Number(data.unpaidPenalties))
          }
          if (data?.contractCode && typeof data.contractCode === "string" && data.contractCode.trim() !== "") {
            setDisplayContractCode(data.contractCode.trim())
          }
        })
        .catch(() => {})
    }
  }, [target.contractId, target.reservationId])

  // 2. Dự phòng: nếu mã hợp đồng chưa đầy đủ CTR-..., tra cứu từ danh sách hợp đồng cơ sở
  useEffect(() => {
    if (!displayContractCode || displayContractCode.length <= 8 || !displayContractCode.startsWith("CTR-")) {
      apiClient.get("/staff/reservations")
        .then((res: any) => {
          const list = Array.isArray(res) ? res : (res?.data || [])
          if (Array.isArray(list)) {
            const match = list.find((item: any) =>
              (target.contractId && item.contractId === target.contractId) ||
              (target.unitCode && item.unitCode === target.unitCode)
            )
            if (match?.reservationCode) {
              setDisplayContractCode(match.reservationCode)
            }
          }
        })
        .catch(() => {})
    }
  }, [displayContractCode, target.contractId, target.unitCode])

  const deposit = actualDeposit
  const totalDamage = DAMAGE_ITEMS.filter((item) =>
    damages.includes(item.id)
  ).reduce((sum, item) => sum + item.fee, 0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const balance = deposit - totalDamage - unpaidPenalty

  useEffect(() => {
    if (balance >= 0) {
      setIsCompensationCollected(false)
    }
  }, [balance])

  function toggle(id: string) {
    setDamages((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) setPhoto(URL.createObjectURL(file))
  }

  async function submit() {
    setIsSubmitting(true)
    try {
      const damageFee = DAMAGE_ITEMS.filter(
        (item) => item.id !== "cleaning" && damages.includes(item.id)
      ).reduce((sum, item) => sum + item.fee, 0)
      const cleaningFee = damages.includes("cleaning") ? 150_000 : 0
      const targetId = target.contractId || target.reservationId

      if (targetId) {
        await apiClient.post(`/staff/checkout/${targetId}/confirm`, {
          confirmInspection: true,
          collectedCompensation: balance < 0 ? isCompensationCollected : false,
          damageFee,
          cleaningFee,
          inspectionNotes:
            damages.length > 0
              ? `Hư hại/vệ sinh: ${damages.join(", ")}`
              : "Ô kho sạch sẽ nguyên vẹn 100%",
          ticketId: target.ticketId || undefined,
          refundPaymentMethod: "VIETQR",
        })
      }

      if (balance < 0) {
        toast.success(
          `Đã chốt biên bản & xác nhận thu đủ ${formatVnd(Math.abs(balance))} tại quầy thành công.`
        )
      } else {
        toast.success(
          `Đã chốt biên bản nghiệm thu — hoàn cọc ${formatVnd(balance)}.`
        )
      }

      if (onConfirmed) {
        onConfirmed()
      } else {
        onClose()
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Lỗi khi chốt biên bản nghiệm thu!"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* CỤM THÔNG TIN HỢP ĐỒNG & Ô KHO (CĂN GIỮA, KHÔNG BỊ TRUNCATE) */}
      <div className="inner-box grid grid-cols-2 sm:grid-cols-4 gap-3.5 rounded-2xl border p-4 bg-slate-50/60 dark:bg-slate-800/40 text-center">
        <div className="flex flex-col items-center justify-center space-y-1 text-center">
          <span className="block text-[10px] font-bold text-muted uppercase tracking-wider text-center">
            Mã hợp đồng:
          </span>
          <span
            className="font-mono text-[11px] sm:text-xs font-black text-blue-600 dark:text-blue-400 whitespace-nowrap block text-center tracking-tight"
            title={displayContractCode}
          >
            {displayContractCode}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center space-y-1 text-center">
          <span className="block text-[10px] font-bold text-muted uppercase tracking-wider text-center">
            Khách hàng:
          </span>
          <span
            className="text-title text-xs sm:text-sm font-bold whitespace-nowrap block text-center"
            title={target.customerName}
          >
            {target.customerName}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center space-y-1 text-center">
          <span className="block text-[10px] font-bold text-muted uppercase tracking-wider text-center">
            Ô kho trả:
          </span>
          <span className="text-title font-mono text-xs sm:text-sm font-bold whitespace-nowrap block text-center">
            {target.unitCode}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center space-y-1 text-center">
          <span className="block text-[10px] font-bold text-muted uppercase tracking-wider text-center">
            Tiền cọc gốc:
          </span>
          <span className="font-mono text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap block text-center">
            {formatVnd(deposit)}
          </span>
        </div>
      </div>

      {/* DANH MỤC KIỂM TRA HƯ HẠI */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-title flex items-center gap-1.5 text-xs font-black tracking-wide uppercase">
            <ListChecksIcon className="size-3.5 text-blue-600 dark:text-blue-400" />
            <span>Danh mục Kiểm tra Hư hại:</span>
          </span>
          <span className="text-[10px] text-muted whitespace-nowrap">
            Tích chọn nếu phát hiện vi phạm
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-2">
          {DAMAGE_ITEMS.map((item) => {
            const checked = damages.includes(item.id)
            return (
              <label
                key={item.id}
                className="inner-box flex cursor-pointer items-center justify-between rounded-xl border p-2.5 transition hover:border-amber-500"
              >
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(item.id)}
                    className="size-3.5 rounded text-amber-600 focus:ring-amber-500/20"
                  />
                  <span className="text-title text-[11px] font-bold">
                    {item.label}
                  </span>
                </div>
                <span className="font-mono text-[11px] font-extrabold text-amber-600 whitespace-nowrap">
                  +{formatVnd(item.fee)}
                </span>
              </label>
            )
          })}
        </div>
      </div>

      {/* BẰNG CHỨNG HÌNH ẢNH */}
      <div className="inner-box space-y-2 rounded-2xl border p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-title flex items-center gap-1.5 font-bold">
            <CameraIcon className="size-3.5 text-blue-600 dark:text-blue-400" />
            <span>Bằng chứng Hình ảnh Hiện trường (Bắt buộc nếu có phạt):</span>
          </span>
          <label className="flex cursor-pointer items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-blue-500 whitespace-nowrap">
            <UploadIcon className="size-3" /> Tải ảnh chụp
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhoto}
            />
          </label>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {photo ? (
            <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-blue-400 shrink-0">
              <img
                src={photo}
                alt="Ảnh hiện trường"
                className="h-full w-full object-cover"
              />
              <span className="absolute inset-x-0 bottom-0 bg-slate-900/80 text-center text-[8px] font-bold text-white">
                Ảnh 1
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-muted italic">
              Chưa có ảnh đính kèm (Nếu kho nguyên vẹn 100%, có thể bỏ qua bước này).
            </span>
          )}
        </div>
      </div>

      {/* TỔNG KẾT QUYẾT TOÁN CỌC (GỌN GÀNG, BỎ CHỮ 24-48H, KHÔNG XUỐNG DÒNG LỞ DỞ) */}
      <div className="space-y-2 rounded-2xl border border-blue-500/30 bg-blue-50/40 p-4 text-xs dark:bg-blue-950/20">
        <div className="flex items-center justify-between text-muted">
          <span className="text-title flex items-center gap-1.5 font-bold whitespace-nowrap" >Tiền cọc gốc ban đầu:</span>
          <span className="text-title font-mono font-bold whitespace-nowrap">
            {formatVnd(deposit)}
          </span>
        </div>
        <div className="flex items-center justify-between text-muted">
          <span className="text-title flex items-center gap-1.5 font-bold whitespace-nowrap" >Tổng chi phí khấu trừ (Hư hại + Vệ sinh):</span>
          <span className="font-mono font-bold text-rose-600 whitespace-nowrap">
            - {formatVnd(totalDamage)}
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-slate-300/80 pt-2.5 dark:border-slate-700/80">
          <span className="text-title text-xs sm:text-sm font-extrabold uppercase whitespace-nowrap">
            KẾT QUẢ QUYẾT TOÁN CỌC:
          </span>
          <div className="text-right">
            {balance >= 0 ? (
              <span className="font-mono text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                Hoàn lại: {formatVnd(balance)}
              </span>
            ) : (
              <span className="font-mono text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">
                Cần Thu thêm: {formatVnd(Math.abs(balance))}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* XÁC NHẬN ĐÃ THU TIỀN TẠI QUẦY KHI CỌC ÂM */}
      {balance < 0 && (
        <label className="inner-box flex cursor-pointer items-center space-x-2.5 rounded-xl border border-rose-300 bg-rose-50/70 p-3 text-xs text-rose-900 transition hover:border-rose-400 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200">
          <input
            type="checkbox"
            checked={isCompensationCollected}
            onChange={(e) => setIsCompensationCollected(e.target.checked)}
            className="size-4 rounded text-rose-600 focus:ring-rose-500/20 cursor-pointer"
          />
          <span className="font-semibold text-rose-800 dark:text-rose-200">
            Xác nhận khách hàng đã nộp đủ{" "}
            <span className="font-mono font-black text-rose-600 dark:text-rose-400">
              {formatVnd(Math.abs(balance))}
            </span>{" "}
          </span>
        </label>
      )}

      {/* NÚT THAO TÁC */}
      <div className="flex items-center space-x-3 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="text-title h-11 flex-1 cursor-pointer rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-xs font-bold transition hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Hủy bỏ
        </button>
        <button
          type="button"
          disabled={isSubmitting || (balance < 0 && !isCompensationCollected)}
          onClick={submit}
          className="h-11 flex-1 cursor-pointer rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-center"
        >
          {isSubmitting ? "Đang xử lý..." : "Chốt biên bản"}
        </button>
      </div>
    </div>
  )
}

export default StaffInspectionModal
