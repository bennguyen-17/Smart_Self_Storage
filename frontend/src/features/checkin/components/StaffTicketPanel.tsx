import { useState } from "react"
import {
  ArchiveIcon,
  CircleCheckIcon,
  ClipboardCheckIcon,
  ClockIcon,
  HeadphonesIcon,
  IdCardIcon,
  InfoIcon,
  KeyRoundIcon,
  UserCheckIcon,
  WrenchIcon,
} from "lucide-react"
import { cn } from "cn"
import { toast } from "sonner"

import StaffInspectionModal, {
  type InspectionTarget,
} from "./StaffInspectionModal"

type TicketStatus = "SUBMITTED" | "IN_PROGRESS" | "RESOLVED"

interface Ticket {
  id: string
  title: string
  codeClass: string
  badge: string
  badgeClass: string
  rows: { label: string; value: string }[]
  quote: string
}

const TICKETS: Ticket[] = [
  {
    id: "9901",
    title: "Mở Khóa Ô Kho Hộ",
    codeClass: "text-blue-600",
    badge: "13m 45s SLA",
    badgeClass:
      "text-rose-600 bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 animate-pulse",
    rows: [
      { label: "Vị trí ô kho:", value: "Kho F2-M205 (Tầng 2)" },
      { label: "Khách hàng:", value: "Nguyễn Văn Khách • 0988 123 719" },
    ],
    quote:
      "Quên chìa khóa cơ ở nhà, đang đứng trước kho cần Staff lên đối chiếu CCCD và hỗ trợ mở khóa gấp.",
  },
  {
    id: "9905",
    title: "Trả Kho Sớm Trước Hạn",
    codeClass: "text-emerald-600",
    badge: "Hẹn 14:00 Hôm nay",
    badgeClass:
      "text-blue-600 bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200",
    rows: [
      { label: "Vị trí ô kho:", value: "Kho F1-S105 (Tầng 1)" },
      { label: "Khách hàng:", value: "Trần Thị B • 0912 345 678" },
    ],
    quote:
      "Đã dọn đồ xong trước hạn theo BR-38/39, hẹn nhân viên cùng ra kho kiểm tra hiện trạng và thanh lý cọc.",
  },
  {
    id: "9902",
    title: "Báo Cáo Cơ Sở Vật Chất",
    codeClass: "text-amber-600",
    badge: "Còn 08m 10s",
    badgeClass:
      "text-amber-600 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200",
    rows: [
      { label: "Vị trí sự cố:", value: "Dãy 1 - Tầng 1 (Kho F1-M102)" },
      { label: "Người báo:", value: "Lê Văn C • 0977 888 999" },
    ],
    quote:
      "Bóng đèn trần Dãy 1 gần cửa kho F1-M102 bị chớp nháy liên tục, nhờ kỹ thuật kiểm tra thay bóng.",
  },
]

const FILTERS: { key: "ALL" | TicketStatus; label: string }[] = [
  { key: "ALL", label: "Tất Cả" },
  { key: "SUBMITTED", label: "Chờ Tiếp Nhận" },
  { key: "IN_PROGRESS", label: "Đang Xử Lý" },
  { key: "RESOLVED", label: "Đã Hoàn Tất" },
]

/** Ticket 9905 (trả kho sớm) mở modal nghiệm thu — bám prototype */
const INSPECTION_TARGET: InspectionTarget = {
  contractCode: "HD-CG-2026-902",
  customerName: "Trần Thị B",
  unitCode: "F1-S105",
  depositAmount: 1_000_000,
}

/** TAB 2: Hỗ trợ kỹ thuật & xử lý ticket sự cố — bám prototype staff_portal.html */
function StaffTicketPanel() {
  const [inspection, setInspection] = useState<InspectionTarget | null>(null)
  const [filter, setFilter] = useState<"ALL" | TicketStatus>("ALL")
  const [statuses, setStatuses] = useState<Record<string, TicketStatus>>({
    "9901": "SUBMITTED",
    "9905": "IN_PROGRESS",
    "9902": "IN_PROGRESS",
  })

  function countOf(status: TicketStatus): number {
    return Object.values(statuses).filter((s) => s === status).length
  }

  function setStatus(id: string, status: TicketStatus) {
    setStatuses((prev) => ({ ...prev, [id]: status }))
  }

  const visible = TICKETS.filter(
    (t) => filter === "ALL" || statuses[t.id] === filter
  )

  return (
    <>
      <div className="space-y-5">
        {/* TOP HEADER BANNER */}
        <div className="card-box space-y-4 rounded-3xl border p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b pb-4 lg:flex-row lg:items-center">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-lg font-bold text-slate-950 shadow-sm">
                <HeadphonesIcon className="size-5" />
              </div>
              <div>
                <h3 className="text-title flex items-center gap-2 text-sm font-extrabold uppercase sm:text-base">
                  TRUNG TÂM TIẾP NHẬN &amp; XỬ LÝ SỰ CỐ (SUPPORT TICKETS)
                </h3>
                <p className="text-xs text-muted">
                  Cam kết thời gian phản hồi SLA 15 phút (BR-32, BR-41) • Khung
                  giờ làm việc: 08:00 - 20:00 hàng ngày
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
                Ca Trực Đang Hoạt Động (08:00 - 20:00)
              </span>
            </div>
          </div>

          {/* FILTER TABS & QUICK COUNTS */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="inner-box inline-flex gap-1 rounded-2xl border p-1">
              {FILTERS.map((f) => {
                const active = f.key === filter
                const count = f.key === "ALL" ? TICKETS.length : countOf(f.key)
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      "cursor-pointer rounded-xl px-3.5 py-1.5 transition",
                      active
                        ? "bg-blue-600 font-extrabold text-white shadow-sm"
                        : "font-bold text-muted hover:text-blue-600"
                    )}
                  >
                    {f.label} ({count})
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted">
              <InfoIcon className="size-3.5 text-amber-500" /> Quá 15 phút chưa
              tiếp nhận sẽ tự động gửi cảnh báo lên Facility Manager.
            </div>
          </div>
        </div>

        {/* TICKET CARDS GRID */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              status={statuses[ticket.id]}
              onStatus={(status) => setStatus(ticket.id, status)}
              onInspect={
                ticket.id === "9905"
                  ? () => setInspection(INSPECTION_TARGET)
                  : undefined
              }
            />
          ))}
        </div>
      </div>

      <StaffInspectionModal
        target={inspection}
        onClose={() => setInspection(null)}
      />
    </>
  )
}

const STATUS_BADGE: Record<TicketStatus, { label: string; className: string }> =
  {
    SUBMITTED: {
      label: "⌛ SUBMITTED (Chờ Tiếp Nhận)",
      className: "bg-amber-100 text-amber-800 border-amber-300",
    },
    IN_PROGRESS: {
      label: "⚙ IN_PROGRESS (Đang Xử Lý)",
      className: "bg-blue-100 text-blue-800 border-blue-300",
    },
    RESOLVED: {
      label: "✓ RESOLVED (Đã Hoàn Tất)",
      className: "bg-emerald-100 text-emerald-800 border-emerald-300",
    },
  }

function TicketIcon({ id }: { id: string }) {
  if (id === "9901") return <KeyRoundIcon className="size-3.5 text-amber-500" />
  if (id === "9905")
    return <ArchiveIcon className="size-3.5 text-emerald-600" />
  return <WrenchIcon className="size-3.5 text-blue-600" />
}

function TicketCard({
  ticket,
  status,
  onStatus,
  onInspect,
}: {
  ticket: Ticket
  status: TicketStatus
  onStatus: (status: TicketStatus) => void
  onInspect?: () => void
}) {
  const badge = STATUS_BADGE[status]

  function claim() {
    onStatus("IN_PROGRESS")
    toast.success(`Nhân viên đã tiếp nhận Ticket #${ticket.id} (IN_PROGRESS).`)
  }

  function resolve() {
    onStatus("RESOLVED")
    toast.success(`Ticket #${ticket.id} đã xử lý hoàn tất (RESOLVED).`)
  }

  return (
    <div className="card-box staff-ticket-card flex flex-col justify-between space-y-3 rounded-2xl border p-4 shadow-sm">
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-2 border-b pb-2.5">
          <div>
            <span
              className={cn("font-mono text-xs font-black", ticket.codeClass)}
            >
              #{`TCK-${ticket.id}`}
            </span>
            <h5 className="text-title mt-0.5 flex items-center gap-1.5 text-sm font-extrabold">
              <TicketIcon id={ticket.id} /> {ticket.title}
            </h5>
          </div>
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 text-[10px] font-black whitespace-nowrap",
              ticket.badgeClass
            )}
          >
            <ClockIcon className="mr-1 inline size-2.5" />
            {ticket.badge}
          </span>
        </div>

        <div className="space-y-1.5 text-xs">
          {ticket.rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3 text-muted"
            >
              <span className="shrink-0">{row.label}</span>
              <span className="text-title text-right font-bold">
                {row.value}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between text-muted">
            <span>Trạng thái:</span>
            <span
              className={cn(
                "rounded-md border px-2 py-0.5 text-[10px] font-extrabold",
                badge.className
              )}
            >
              {badge.label}
            </span>
          </div>
        </div>

        <div className="inner-box rounded-xl border p-2.5 text-[11px] leading-relaxed text-slate-600 italic dark:text-slate-300">
          "{ticket.quote}"
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-col gap-1.5 border-t pt-2">
        {status === "SUBMITTED" && (
          <button
            type="button"
            onClick={claim}
            className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            <UserCheckIcon className="size-3.5" />
            <span>Tiếp Nhận Xử Lý (Claim)</span>
          </button>
        )}

        {status === "IN_PROGRESS" && ticket.id === "9901" && (
          <button
            type="button"
            onClick={resolve}
            className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <IdCardIcon className="size-3.5" />
            <span>Đối Chiếu CCCD &amp; Mở Khóa (BR-31)</span>
          </button>
        )}

        {status === "IN_PROGRESS" && ticket.id === "9905" && (
          <button
            type="button"
            onClick={onInspect}
            className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-extrabold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <ClipboardCheckIcon className="size-3.5" />
            <span>Mở Biên Bản Nghiệm Thu &amp; Quyết Toán (BR-28/29)</span>
          </button>
        )}

        {status === "IN_PROGRESS" && ticket.id === "9902" && (
          <button
            type="button"
            onClick={resolve}
            className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            <CircleCheckIcon className="size-3.5" />
            <span>Xác Nhận Đã Sửa Xong ➔ Đóng Ticket</span>
          </button>
        )}

        {status === "RESOLVED" && (
          <button
            type="button"
            disabled
            className="flex w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-slate-200 py-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <CircleCheckIcon className="size-3.5" />
            <span>Đã Đóng Ticket</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default StaffTicketPanel
