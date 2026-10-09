import { useState, type ChangeEvent } from "react"
import {
  CameraIcon,
  ClipboardCheckIcon,
  ListChecksIcon,
  UploadIcon,
} from "lucide-react"
import { toast } from "sonner"

import { formatVnd } from "@/lib/format"

import ProtoModal from "./ProtoModal"

export interface InspectionTarget {
  contractCode: string
  customerName: string
  unitCode: string
  depositAmount: number | null
}

interface StaffInspectionModalProps {
  target: InspectionTarget | null
  onClose: () => void
}

/** Bảng giá hư hại chuẩn BR-28 */
const DAMAGE_ITEMS = [
  { id: "cleaning", label: "1. Vệ sinh kho (rác/bẩn nặng)", fee: 150_000 },
  { id: "key", label: "2. Mất chìa khóa cơ", fee: 200_000 },
  { id: "paint", label: "3. Trầy xước vách/khoan lỗ", fee: 300_000 },
  { id: "electric", label: "4. Hỏng bóng đèn/ổ cắm", fee: 300_000 },
  { id: "dent", label: "5. Móp méo/thủng vách ngăn", fee: 500_000 },
  { id: "door", label: "6. Hư hỏng cửa/khóa chính", fee: 1_000_000 },
]

/** Modal Nghiệm thu hiện trạng trả kho & Quyết toán cọc — bám prototype staff_portal.html */
function StaffInspectionModal({ target, onClose }: StaffInspectionModalProps) {
  return (
    <ProtoModal
      open={target !== null}
      onClose={onClose}
      maxWidth="max-w-2xl"
      title="Biên bản nghiệm thu hiện trạng trả kho (BR-28)"
      subtitle="Kiểm tra hư hại đối chiếu bảng giá niêm yết & Quyết toán cọc (BR-29)"
      icon={<ClipboardCheckIcon className="size-5" />}
    >
      {target && (
        <Body key={target.contractCode} target={target} onClose={onClose} />
      )}
    </ProtoModal>
  )
}

function Body({
  target,
  onClose,
}: {
  target: InspectionTarget
  onClose: () => void
}) {
  const [damages, setDamages] = useState<string[]>([])
  const [photo, setPhoto] = useState<string | null>(null)

  const deposit = target.depositAmount ?? 0
  const totalDamage = DAMAGE_ITEMS.filter((item) =>
    damages.includes(item.id)
  ).reduce((sum, item) => sum + item.fee, 0)
  const balance = deposit - totalDamage

  function toggle(id: string) {
    setDamages((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) setPhoto(URL.createObjectURL(file))
  }

  function submit() {
    if (balance < 0) {
      toast.warning(
        `Cọc âm (BR-29): thu thêm ${formatVnd(Math.abs(balance))} tại quầy trước khi mang đồ ra.`
      )
    } else {
      toast.success(
        `Đã chốt biên bản nghiệm thu — hoàn cọc ${formatVnd(balance)} (BR-28/29).`
      )
    }
    onClose()
  }

  return (
    <>
      {/* CONTRACT & UNIT SUMMARY */}
      <div className="inner-box flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3.5 text-xs">
        <div>
          <span className="block text-[10px] font-bold text-muted uppercase">
            Hợp đồng:
          </span>
          <span className="font-mono text-sm font-bold text-blue-600">
            {target.contractCode}
          </span>
        </div>
        <div>
          <span className="block text-[10px] font-bold text-muted uppercase">
            Khách hàng:
          </span>
          <span className="text-title font-bold">{target.customerName}</span>
        </div>
        <div>
          <span className="block text-[10px] font-bold text-muted uppercase">
            Ô kho trả:
          </span>
          <span className="text-title font-mono text-sm font-bold">
            {target.unitCode}
          </span>
        </div>
        <div>
          <span className="block text-[10px] font-bold text-muted uppercase">
            Tiền cọc gốc:
          </span>
          <span className="font-mono text-sm font-black text-emerald-600">
            {formatVnd(deposit)}
          </span>
        </div>
      </div>

      {/* DAMAGE CHECKLIST */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-title flex items-center gap-1.5 text-xs font-black tracking-wide uppercase">
            <ListChecksIcon className="size-3.5 text-blue-600" /> Danh mục Kiểm
            tra Hư hại (Bảng giá chuẩn BR-28):
          </span>
          <span className="text-[10px] text-muted">
            Tích chọn nếu phát hiện vi phạm
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
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
                    className="size-3.5 rounded text-amber-600"
                  />
                  <span className="text-title text-[11px] font-bold">
                    {item.label}
                  </span>
                </div>
                <span className="font-mono text-[11px] font-extrabold text-amber-600">
                  +{formatVnd(item.fee)}
                </span>
              </label>
            )
          })}
        </div>
      </div>

      {/* PHOTO EVIDENCE */}
      <div className="inner-box space-y-2 rounded-2xl border p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-title flex items-center gap-1.5 font-bold">
            <CameraIcon className="size-3.5 text-blue-600" /> Bằng chứng Hình
            ảnh Hiện trường (Bắt buộc nếu có phạt):
          </span>
          <label className="flex cursor-pointer items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-blue-500">
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
            <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-blue-400">
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
              Chưa có ảnh đính kèm (Nếu kho nguyên vẹn 100%, có thể bỏ qua bước
              này).
            </span>
          )}
        </div>
      </div>

      {/* SETTLEMENT SUMMARY */}
      <div className="space-y-2 rounded-2xl border border-blue-500/30 bg-blue-50/40 p-4 text-xs dark:bg-blue-950/20">
        <div className="flex items-center justify-between text-muted">
          <span>Tiền cọc gốc ban đầu:</span>
          <span className="text-title font-mono font-bold">
            {formatVnd(deposit)}
          </span>
        </div>
        <div className="flex items-center justify-between text-muted">
          <span>Tổng chi phí khấu trừ (Hư hại + Vệ sinh):</span>
          <span className="font-mono font-bold text-rose-600">
            - {formatVnd(totalDamage)}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-300 pt-2 dark:border-slate-700">
          <span className="text-title text-sm font-extrabold">
            KẾT QUẢ QUYẾT TOÁN CỌC:
          </span>
          <div className="text-right">
            {balance >= 0 ? (
              <>
                <span className="font-mono text-base font-black text-emerald-600">
                  Hoàn lại: {formatVnd(balance)}
                </span>
                <p className="text-[10px] text-muted">
                  Hệ thống chuyển khoản tự động trong 24-48h (BR-30)
                </p>
              </>
            ) : (
              <>
                <span className="font-mono text-base font-black text-rose-600">
                  CỌC ÂM! THU THÊM: {formatVnd(Math.abs(balance))}
                </span>
                <p className="text-[10px] text-muted">
                  Khách bắt buộc nộp khoản này tại quầy mới được mang đồ ra!
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex items-center space-x-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="text-title flex-1 cursor-pointer rounded-xl border py-3 text-xs font-bold transition hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Hủy bỏ
        </button>
        <button
          type="button"
          onClick={submit}
          className="flex flex-1 cursor-pointer items-center justify-center space-x-2 rounded-xl bg-emerald-600 py-3 text-xs font-black text-white shadow-lg transition hover:bg-emerald-500"
        >
          <ClipboardCheckIcon className="size-4" />
          <span>CHỐT BIÊN BẢN &amp; THANH LÝ HỢP ĐỒNG</span>
        </button>
      </div>
    </>
  )
}

export default StaffInspectionModal
