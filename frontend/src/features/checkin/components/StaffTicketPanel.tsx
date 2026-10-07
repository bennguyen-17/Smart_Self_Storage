import { CheckCircle2Icon, WrenchIcon } from "lucide-react"
import { toast } from "sonner"

/** Tab KHO BÃI & SỰ CỐ — bám prototype staff.html (US-22/23, dữ liệu tĩnh) */
function StaffTicketPanel() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {/* CỘT 1: TICKET SỰ CỐ SLA */}
      <div className="card-box flex flex-col justify-between space-y-4 rounded-2xl border p-5 shadow-lg">
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center space-x-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-600 text-white">
                <WrenchIcon className="size-4" />
              </span>
              <div>
                <h4 className="text-xs font-extrabold tracking-wide text-title uppercase">
                  Ticket Sự cố SLA
                </h4>
                <span className="font-mono text-[10px] font-bold text-red-600">
                  Cam kết xử lý 30 phút
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <TicketCard
              id="9901"
              title="TCK-9901 - mở khoá hộ"
              sla="14m 22s SLA"
              slaClass="text-red-600 bg-red-100"
              content='"Kẹt chìa khóa cơ Tầng 2 kho F2-M205, nhờ hỗ trợ gấp."'
            />
            <TicketCard
              id="9902"
              title="TCK-9902 - báo cáo cơ sở vật chất"
              sla="28m 10s SLA"
              slaClass="text-amber-600 bg-amber-100"
              content='"Bóng đèn Dãy 1 Tầng 1 bị chớp nháy."'
            />
          </div>
        </div>
      </div>

      {/* CỘT 2: BẢO DƯỠNG Ô KHO */}
      <div className="card-box flex flex-col justify-between space-y-4 rounded-2xl border p-5 shadow-lg">
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center space-x-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-600 text-white">
                <CheckCircle2Icon className="size-4" />
              </span>
              <h4 className="text-xs font-extrabold tracking-wide text-title uppercase">
                Bảo dưỡng ô kho
              </h4>
            </div>
          </div>

          <div className="inner-box space-y-3 rounded-xl border p-3.5 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <b className="text-xs text-title">Kho F1-M102 (Tầng 1)</b>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-extrabold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                MAINTENANCE
              </span>
            </div>
            <p className="rounded-lg border bg-white p-2 text-[11px] leading-relaxed text-muted dark:bg-slate-900">
              "Vệ sinh kho: quét dọn, lau kho, khử khuẩn, khử mùi,..."
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              toast.success("Hoàn tất Bảo dưỡng & Vệ sinh Kho F1-M102 thành công!")
            }
            className="w-full cursor-pointer rounded-xl bg-teal-600 py-2.5 text-xs font-black text-white shadow transition hover:bg-teal-700"
          >
            HOÀN TẤT BẢO DƯỠNG KHO
          </button>
        </div>
      </div>
    </div>
  )
}

function TicketCard({
  id,
  title,
  sla,
  slaClass,
  content,
}: {
  id: string
  title: string
  sla: string
  slaClass: string
  content: string
}) {
  return (
    <div className="inner-box space-y-2 rounded-xl border p-3.5 text-xs">
      <div className="flex items-start justify-between">
        <b className="text-xs font-bold text-title">{title}</b>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-black ${slaClass}`}
        >
          {sla}
        </span>
      </div>
      <p className="rounded-lg border bg-white p-2 text-[11px] leading-relaxed text-muted dark:bg-slate-900">
        {content}
      </p>
      <button
        type="button"
        onClick={() => toast.success(`Đã xử lý Ticket #${id} trong SLA 30 phút!`)}
        className="w-full cursor-pointer rounded-lg bg-blue-600 py-1.5 text-[11px] font-bold text-white transition hover:bg-blue-700"
      >
        Đã xử lý
      </button>
    </div>
  )
}

export default StaffTicketPanel
