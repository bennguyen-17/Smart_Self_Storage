import { useState } from "react"
import { CheckCircle2Icon, ShieldCheckIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import type { ManagerTicketItem } from "../types"
import { managerResolveTicket } from "../api/ticketApi"

interface ResolveTicketModalProps {
  ticket: ManagerTicketItem | null
  onClose: () => void
  onResolved: (updated: ManagerTicketItem) => void
}

const QUICK_NOTES = [
  "Quản lý đã trực tiếp kiểm tra và khắc phục sự cố tại chỗ.",
  "Đã liên hệ trực tiếp khách hàng, xử lý thỏa đáng và hướng dẫn chi tiết.",
  "Đã kiểm tra đối chiếu thông tin và hỗ trợ xử lý kỹ thuật thành công.",
  "Đã cử bảo trì khắc phục hoàn tất thiết bị kho.",
]

export default function ResolveTicketModal({ ticket, onClose, onResolved }: ResolveTicketModalProps) {
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)

  if (!ticket) return null

  async function handleConfirm() {
    const finalNote = note.trim() || QUICK_NOTES[0]
    try {
      setSubmitting(true)
      const updated = await managerResolveTicket(ticket.id, finalNote)
      toast.success(`Đã đóng và giải quyết thành công Ticket #${ticket.ticketCode}`)
      onResolved(updated)
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data || "Không thể đóng ticket, vui lòng thử lại.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <XIcon className="size-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <ShieldCheckIcon className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Quản lý giải quyết &amp; Đóng ticket
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mã yêu cầu: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">#{ticket.ticketCode}</span>
            </p>
          </div>
        </div>

        {/* Thông tin tóm tắt */}
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs space-y-1.5 dark:border-slate-800/80 dark:bg-slate-800/40">
          <div className="flex justify-between">
            <span className="text-slate-500">Khách hàng:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {ticket.customerName || `Khách hàng #${ticket.customerId}`} ({ticket.customerPhone || "—"})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Vị trí / Ô kho:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {ticket.unitCode || "Cơ sở / Cổng"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Yêu cầu:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{ticket.title || ticket.type}</span>
          </div>
          {ticket.description && (
            <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500">Nội dung chi tiết: </span>
              <span className="italic text-slate-700 dark:text-slate-300">"{ticket.description}"</span>
            </div>
          )}
        </div>

        {/* Ghi chú giải quyết */}
        <div className="mt-4 space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
            Ghi chú giải quyết của Quản lý:
          </label>

          <div className="flex flex-wrap gap-1.5">
            {QUICK_NOTES.map((qn, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setNote(qn)}
                className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                + {qn.slice(0, 32)}...
              </button>
            ))}
          </div>

          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nhập nội dung xử lý thực tế hoặc phương án giải quyết cho khách hàng..."
            className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-50"
          >
            <CheckCircle2Icon className="size-4" />
            <span>{submitting ? "Đang lưu..." : "Xác nhận đóng ticket"}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
