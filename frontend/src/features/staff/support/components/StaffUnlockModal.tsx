import { useEffect, useState } from "react"
import { CheckCircle2Icon, IdCardIcon, KeyRoundIcon, ShieldAlertIcon } from "lucide-react"
import { toast } from "sonner"

import apiClient, { isMockMode } from "@/lib/apiClient"
import ProtoModal from "@/features/staff/components/ProtoModal"

export interface UnlockTicketInfo {
  id: string | number
  ticketCode: string
  unitCode?: string
  customerName?: string
  phone?: string
  identityNumber?: string
}

interface StaffUnlockModalProps {
  ticket: UnlockTicketInfo | null
  onClose: () => void
  onResolved: () => void
}

interface UnlockDetail {
  ticketId: number | string
  ticketCode: string
  unitCode?: string
  customerName?: string
  phone?: string
  identityNumber?: string
}

/** US-23: Modal đối chiếu CCCD khách hàng và xác nhận mở khóa ô kho */
function StaffUnlockModal({
  ticket,
  onClose,
  onResolved,
}: StaffUnlockModalProps) {
  const [detail, setDetail] = useState<UnlockDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [cardChecked, setCardChecked] = useState(false)
  const [matchChecked, setMatchChecked] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!ticket) {
      setDetail(null)
      setCardChecked(false)
      setMatchChecked(false)
      return
    }

    setCardChecked(false)
    setMatchChecked(false)

    // Fallback data from ticket
    const initialData: UnlockDetail = {
      ticketId: ticket.id,
      ticketCode: ticket.ticketCode,
      unitCode: ticket.unitCode || "F2-M205",
      customerName: ticket.customerName || "Nguyễn Văn Khách",
      phone: ticket.phone || "0988 123 719",
      identityNumber: ticket.identityNumber || "079201008899",
    }
    setDetail(initialData)

    if (!isMockMode() && typeof ticket.id === "number") {
      setLoading(true)
      apiClient
        .get(`/staff/tickets/${ticket.id}/unlock-detail`)
        .then((res: any) => {
          if (res) {
            setDetail({
              ticketId: res.ticketId ?? ticket.id,
              ticketCode: res.ticketCode ?? ticket.ticketCode,
              unitCode: res.unitCode ?? initialData.unitCode,
              customerName: res.customerName ?? initialData.customerName,
              phone: res.phone ?? initialData.phone,
              identityNumber: res.identityNumber ?? initialData.identityNumber,
            })
          }
        })
        .catch(() => {
          // Keep initialData on error
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [ticket])

  const canConfirm = cardChecked && matchChecked && !submitting

  async function handleConfirm() {
    if (!ticket || !detail) return
    setSubmitting(true)
    try {
      if (!isMockMode() && typeof ticket.id === "number") {
        await apiClient.post(`/staff/tickets/${ticket.id}/resolve-unlock`, {
          identityVerified: true,
          note: `Staff đã kiểm tra trực tiếp CCCD số ${detail.identityNumber || "hợp lệ"} trùng khớp 100% và hỗ trợ mở khóa ô kho.`,
        })
      }
      toast.success(
        `Xác thực thành công! Đã gửi lệnh mở khóa ô ${detail.unitCode} cho khách hàng.`
      )
      onResolved()
      onClose()
    } catch (err: any) {
      toast.error(
        err?.response?.data || "Không thể hoàn tất mở khóa, vui lòng thử lại."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ProtoModal
      open={ticket !== null}
      onClose={onClose}
      title="Đối chiếu CCCD & Mở khóa ô kho khẩn cấp"
      subtitle="Quy trình xác thực danh tính khách hàng nghiêm ngặt (US-23)"
      icon={<KeyRoundIcon className="size-5 text-amber-500" />}
      maxWidth="max-w-lg"
    >
      {detail && (
        <div className="space-y-4 text-xs">
          {/* HEADER ALERT */}
          <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-amber-900 dark:text-amber-200">
            <ShieldAlertIcon className="size-5 shrink-0 text-amber-500" />
            <div className="text-[11px] leading-relaxed">
              <b className="font-extrabold uppercase">Cảnh báo an ninh:</b> Nhân viên chỉ được mở khóa khi khách hàng trực tiếp xuất trình thẻ CCCD/CMND bản gốc trùng khớp với hồ sơ hợp đồng.
            </div>
          </div>

          {/* CUSTOMER & CONTRACT INFO */}
          <div className="inner-box space-y-2.5 rounded-2xl border p-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold tracking-wider text-muted uppercase text-[10px]">
                Hồ sơ Hợp đồng lưu trữ
              </span>
              <span className="font-mono font-black text-blue-600">
                #{detail.ticketCode}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="block text-[10px] text-muted">Họ và tên:</span>
                <span className="text-sm font-extrabold text-title">
                  {detail.customerName}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-muted">Ô kho yêu cầu:</span>
                <span className="font-mono text-sm font-black text-blue-600 dark:text-blue-400">
                  {detail.unitCode}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-muted">Số điện thoại:</span>
                <span className="font-mono font-bold text-title">
                  {detail.phone}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-muted">Số CCCD / CMND:</span>
                <span className="font-mono text-sm font-black tracking-wider text-emerald-600 dark:text-emerald-400">
                  {detail.identityNumber || "Chưa cập nhật"}
                </span>
              </div>
            </div>
          </div>

          {/* VERIFICATION CHECKLIST */}
          <div className="space-y-2 rounded-2xl border border-blue-500/20 bg-blue-50/50 p-4 dark:bg-blue-950/20">
            <div className="text-[11px] font-black tracking-wide text-blue-900 uppercase dark:text-blue-300">
              Biên bản đối chiếu tại chỗ:
            </div>

            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5 transition hover:border-blue-400 dark:border-slate-800 dark:bg-slate-900">
              <input
                type="checkbox"
                checked={cardChecked}
                onChange={(e) => setCardChecked(e.target.checked)}
                className="mt-0.5 size-4 rounded text-blue-600"
              />
              <span className="text-[11.5px] font-medium text-slate-800 dark:text-slate-200">
                Khách hàng đã xuất trình bản chính <b>Căn cước công dân (CCCD / VNeID)</b>.
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5 transition hover:border-blue-400 dark:border-slate-800 dark:bg-slate-900">
              <input
                type="checkbox"
                checked={matchChecked}
                onChange={(e) => setMatchChecked(e.target.checked)}
                className="mt-0.5 size-4 rounded text-blue-600"
              />
              <span className="text-[11.5px] font-medium text-slate-800 dark:text-slate-200">
                Xác nhận họ tên và số CCCD thực tế <b>trùng khớp 100%</b> với thông tin trên hệ thống.
              </span>
            </label>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 cursor-pointer rounded-xl border py-2.5 text-xs font-bold text-title transition hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="flex flex-1 cursor-pointer items-center justify-center space-x-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2Icon className="size-4" />
              <span>{submitting ? "Đang xử lý..." : "Xác nhận & Mở khóa"}</span>
            </button>
          </div>
        </div>
      )}
    </ProtoModal>
  )
}

export default StaffUnlockModal
