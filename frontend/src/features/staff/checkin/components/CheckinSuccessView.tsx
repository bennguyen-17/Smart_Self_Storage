import { ArrowLeftIcon, CheckCircle2Icon, ChevronRightIcon, PrinterIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"
import type { StaffCheckInResponse, StaffReservationLookup } from "../types"

interface CheckinSuccessViewProps {
  actionSuccess: StaffCheckInResponse
  contract: StaffReservationLookup
}

export default function CheckinSuccessView({ actionSuccess, contract }: CheckinSuccessViewProps) {
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-4 animate-in fade-in duration-300">
      <div className="rounded-3xl border border-emerald-300 bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white p-8 text-center shadow-lg dark:border-emerald-900 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
          <CheckCircle2Icon className="size-9 stroke-[2.5]" />
        </div>

        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          Bàn Giao &amp; Kích Hoạt Kho Thành Công!
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Hợp đồng{" "}
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
            {actionSuccess.reservationCode ?? contract.reservationCode}
          </span>{" "}
          của khách hàng{" "}
          <span className="font-bold text-slate-800 dark:text-slate-100">
            {contract.customerName}
          </span>{" "}
          đã chính thức chuyển sang trạng thái <strong>ĐANG THUÊ</strong>.
        </p>

        <div className="mx-auto mt-6 grid max-w-lg grid-cols-2 gap-4 text-left">
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Ô kho bàn giao
            </span>
            <p className="mt-1 font-mono text-xl font-black text-blue-600 dark:text-blue-400">
              {contract.unitCode}
            </p>
            <p className="text-xs text-muted mt-0.5">{contract.floorName}</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Mã PIN mở cổng của khách
            </span>
            <p className="mt-1 font-mono text-xl font-black text-emerald-600 dark:text-emerald-400">
              {actionSuccess.gatePin ?? "Đã gửi SMS / App"}
            </p>
            <p className="text-xs text-muted mt-0.5">Thời hạn: Suốt thời gian thuê</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <PrinterIcon className="size-4" />
            <span>In biên bản bàn giao</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/staff/checkin")}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-700"
          >
            <span>Về danh sách hợp đồng</span>
            <ChevronRightIcon className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
