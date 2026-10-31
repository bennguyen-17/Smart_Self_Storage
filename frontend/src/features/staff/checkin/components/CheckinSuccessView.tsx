import { CheckCircle2Icon, ChevronRightIcon, KeyRoundIcon, ShieldCheckIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"
import type { StaffCheckInResponse, StaffReservationLookup } from "../types"

interface CheckinSuccessViewProps {
  actionSuccess: StaffCheckInResponse
  contract: StaffReservationLookup
  unitCode?: string
  floorName?: string
}

export default function CheckinSuccessView({
  actionSuccess,
  contract,
  unitCode,
  floorName,
}: CheckinSuccessViewProps) {
  const navigate = useNavigate()
  const activeUnit = unitCode || contract.unitCode
  const activeFloor = floorName || contract.floorName
  const displayFloor = activeFloor?.replace(/\s*\(.*?\)/g, "").trim() || activeFloor

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
          đã được kích hoạt.
        </p>

        <div className="mx-auto mt-6 grid max-w-lg grid-cols-2 gap-4">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white/80 p-4 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Ô kho bàn giao
            </span>
            <p className="mt-1 font-mono text-xl font-black text-blue-600 dark:text-blue-400">
              {activeUnit}
            </p>
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white/80 p-4 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Bàn giao phương thức mở kho
            </span>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
              <KeyRoundIcon className="size-4 shrink-0" />
              <span>Chìa khóa cơ vật lý</span>
            </p>
          </div>
        </div>

        <div className="mx-auto mt-4 max-w-lg rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5 text-left text-xs dark:border-blue-900/60 dark:bg-blue-950/30">
          <div className="flex items-start gap-2.5">
            <ShieldCheckIcon className="size-4.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-blue-900 dark:text-blue-200">
                Quyền mở cổng chính 24/7
              </p>
              <p className="mt-0.5 text-blue-800/80 dark:text-blue-300/80">
                Khách hàng tự lấy <strong>mã PIN động (15 giây)</strong> trên Web Portal mỗi khi đến cơ sở để mở cửa.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center">
          <button
            type="button"
            onClick={() => navigate("/staff/checkin")}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-7 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-700 active:scale-95"
          >
            <span>Về danh sách hợp đồng</span>
            <ChevronRightIcon className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
