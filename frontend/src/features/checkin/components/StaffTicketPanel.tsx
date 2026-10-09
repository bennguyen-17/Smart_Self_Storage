import { useState } from "react"
import { toast } from "sonner"

/** TAB 2: KHO BÃI, SỰ CỐ SLA & BẢO TRÌ — bám prototype (US-22/23, dữ liệu tĩnh) */
function StaffTicketPanel() {
  const [checks, setChecks] = useState([true, true, true])

  function toggle(index: number) {
    setChecks((prev) => prev.map((v, i) => (i === index ? !v : v)))
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {/* CỘT 1: TICKET SỰ CỐ SLA */}
      <div className="card-box flex flex-col justify-between space-y-4 rounded-2xl border p-5 shadow-lg">
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center space-x-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-600 text-sm text-white shadow">
                🎧
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
            <span className="rounded-full border border-red-300 bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-800">
              2 Ticket
            </span>
          </div>

          <div className="space-y-3">
            <TicketCard
              id="9901"
              title="#TCK-9901 - Kẹt chìa / PIN"
              sla="14m 22s SLA"
              slaClass="text-red-600 bg-red-100 animate-pulse"
              content='"Kẹt chìa khóa cơ Tầng 2 kho F2-M205, nhờ hỗ trợ gấp."'
              action="✓ Đã xử lý (Đóng Ticket)"
            />
            <TicketCard
              id="9902"
              title="#TCK-9902 - Hỏng đèn hành lang"
              sla="28m 10s SLA"
              slaClass="text-amber-600 bg-amber-100"
              content='"Bóng đèn Dãy 1 Tầng 1 bị chớp nháy."'
              action="✓ Thay đèn xong (Đóng Ticket)"
            />
          </div>
        </div>
      </div>

      {/* CỘT 2: BẢO TRÌ Ô KHO (BR-34) */}
      <div className="card-box flex flex-col justify-between space-y-4 rounded-2xl border p-5 shadow-lg">
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center space-x-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-600 text-sm text-white shadow">
                🧹
              </span>
              <div>
                <h4 className="text-xs font-extrabold tracking-wide text-title uppercase">
                  Bảo trì Ô kho
                </h4>
                <span className="font-mono text-[10px] font-bold text-teal-600">
                  Dọn dẹp chuyển Available
                </span>
              </div>
            </div>
          </div>

          <div className="inner-box space-y-3 rounded-xl border p-3.5 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <b className="text-xs text-title">Kho F1-M102 (Tầng 1)</b>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-extrabold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                MAINTENANCE
              </span>
            </div>

            <div className="space-y-1.5 text-[11px] font-bold text-title">
              {[
                "✓ Quét dọn & hút bụi sàn",
                "✓ Khử khuẩn ô kho",
                "✓ Kiểm tra cửa & đèn",
              ].map((label, i) => (
                <label
                  key={label}
                  className="flex cursor-pointer items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    checked={checks[i]}
                    onChange={() => toggle(i)}
                    className="size-3.5 rounded text-teal-600"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                if (checks.some((c) => !c)) {
                  toast.warning("Hoàn tất đủ 3 mục bảo trì trước khi chuyển ô kho!")
                  return
                }
                toast.success(
                  "✨ Đã chuyển ô kho F1-M102 sang AVAILABLE (sẵn sàng cho thuê)."
                )
              }}
              className="w-full cursor-pointer rounded-xl bg-teal-600 py-2.5 text-xs font-black text-white shadow transition hover:bg-teal-700"
            >
              ✨ CHUYỂN Ô KHO SANG AVAILABLE
            </button>
          </div>
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
  action,
}: {
  id: string
  title: string
  sla: string
  slaClass: string
  content: string
  action: string
}) {
  return (
    <div className="inner-box space-y-2 rounded-xl border p-3.5 text-xs">
      <div className="flex items-start justify-between">
        <b className="text-xs font-bold text-title">{title}</b>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${slaClass}`}>
          {sla}
        </span>
      </div>
      <p className="rounded-lg border bg-white p-2 text-[11px] leading-relaxed text-muted dark:bg-slate-900">
        {content}
      </p>
      <button
        type="button"
        onClick={() => toast.success(`Đã đóng Ticket #${id} trong SLA 30 phút!`)}
        className="w-full cursor-pointer rounded-lg bg-blue-600 py-1.5 text-[11px] font-bold text-white transition hover:bg-blue-700"
      >
        {action}
      </button>
    </div>
  )
}

export default StaffTicketPanel
