import { useCallback, useEffect, useState } from "react"
import {
  ArchiveIcon,
  CheckCircle2Icon,
  CircleCheckIcon,
  ClipboardCheckIcon,
  ClockIcon,
  HeadphonesIcon,
  IdCardIcon,
  InfoIcon,
  KeyRoundIcon,
  SearchIcon,
  UserCheckIcon,
  WrenchIcon,
} from "lucide-react"
import { cn } from "cn"
import { toast } from "sonner"

import apiClient, { isMockMode } from "@/lib/apiClient"

import StaffInspectionModal, {
  type InspectionTarget,
} from "./StaffInspectionModal"
import StaffUnlockModal, { type UnlockTicketInfo } from "./StaffUnlockModal"

type TicketStatus = "SUBMITTED" | "IN_PROGRESS" | "RESOLVED"

export interface TicketItem {
  id: string | number
  ticketCode: string
  title: string
  type: string // "INCIDENT" | "EARLY_TERMINATION"
  status: TicketStatus
  customerId?: number
  customerName?: string
  customerPhone?: string
  identityNumber?: string
  unitCode?: string
  contractId?: number
  contractCode?: string
  description?: string
  desiredDate?: string
  slaDeadline?: string
  isSlaBreached?: boolean
  createdAt?: string
}

const INITIAL_FALLBACK_TICKETS: TicketItem[] = [
  {
    id: 9901,
    ticketCode: "TCK-9901",
    title: "Mở Khóa Ô Kho Hộ (Quên Chìa)",
    type: "INCIDENT",
    status: "SUBMITTED",
    customerName: "Nguyễn Văn Khách",
    customerPhone: "0988 123 719",
    identityNumber: "079201008899",
    unitCode: "F2-M205",
    contractCode: "HD-CG-2026-801",
    description:
      "Quên chìa khóa cơ ở nhà, đang đứng trước kho cần Staff lên đối chiếu CCCD và hỗ trợ mở khóa gấp.",
    slaDeadline: new Date(
      Date.now() + 13 * 60 * 1000 + 45 * 1000
    ).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 9905,
    ticketCode: "TCK-9905",
    title: "Trả Kho Sớm Trước Hạn",
    type: "EARLY_TERMINATION",
    status: "IN_PROGRESS",
    customerName: "Trần Thị B",
    customerPhone: "0912 345 678",
    identityNumber: "079198007766",
    unitCode: "F1-S105",
    contractCode: "HD-CG-2026-902",
    description:
      "Đã dọn đồ xong trước hạn, hẹn nhân viên cùng ra kho kiểm tra hiện trạng và thanh lý cọc.",
    desiredDate: "14:00 Hôm nay",
    createdAt: new Date().toISOString(),
  },
  {
    id: 9902,
    ticketCode: "TCK-9902",
    title: "Báo Cáo Cơ Sở Vật Chất (Đèn Trần Hỏng)",
    type: "INCIDENT",
    status: "IN_PROGRESS",
    customerName: "Lê Văn C",
    customerPhone: "0977 888 999",
    unitCode: "F1-M102",
    contractCode: "HD-CG-2026-750",
    description:
      "Bóng đèn trần Dãy 1 gần cửa kho F1-M102 bị chớp nháy liên tục, nhờ kỹ thuật kiểm tra thay bóng.",
    slaDeadline: new Date(Date.now() + 8 * 60 * 1000 + 10 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
]

const FILTERS: { key: "ALL" | TicketStatus; label: string }[] = [
  { key: "ALL", label: "Tất Cả" },
  { key: "SUBMITTED", label: "Chờ Tiếp Nhận" },
  { key: "IN_PROGRESS", label: "Đang Xử Lý" },
  { key: "RESOLVED", label: "Đã Hoàn Tất" },
]

function getSlaInfo(ticket: TicketItem, now: number) {
  if (ticket.status === "RESOLVED") {
    return { text: "Đã Hoàn Tất", className: "text-muted", isBreached: false }
  }

  if (ticket.type === "EARLY_TERMINATION") {
    return {
      text: ticket.desiredDate ? `Hẹn: ${ticket.desiredDate}` : "Hẹn Hôm Nay",
      className: "text-muted",
      isBreached: false,
    }
  }

  if (!ticket.slaDeadline) {
    return { text: "15m SLA", className: "text-muted", isBreached: false }
  }

  const deadlineMs = new Date(ticket.slaDeadline).getTime()
  const diffSec = Math.floor((deadlineMs - now) / 1000)

  if (diffSec <= 0) {
    return {
      text: "SLA Quá Hạn",
      className: "text-rose-600 dark:text-rose-400",
      isBreached: true,
    }
  }

  const m = Math.floor(diffSec / 60)
  const s = diffSec % 60
  const timeStr = `${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s SLA`

  return {
    text: timeStr,
    className: m < 5 ? "text-rose-600 dark:text-rose-400" : "text-muted",
    isBreached: false,
  }
}

/** TAB 2: Hỗ trợ kỹ thuật & xử lý ticket sự cố động — kết nối API Staff Tickets & SLA (US-22, US-23) */
function StaffTicketPanel() {
  const [tickets, setTickets] = useState<TicketItem[]>(INITIAL_FALLBACK_TICKETS)
  const [filter, setFilter] = useState<"ALL" | TicketStatus>("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [now, setNow] = useState(Date.now())

  // Modals state
  const [inspectionTarget, setInspectionTarget] =
    useState<InspectionTarget | null>(null)
  const [inspectionTicketId, setInspectionTicketId] = useState<
    string | number | null
  >(null)
  const [unlockTarget, setUnlockTarget] = useState<UnlockTicketInfo | null>(
    null
  )

  // Real-time SLA timer
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(timer)
  }, [])

  const fetchTickets = useCallback(async () => {
    try {
      if (!isMockMode()) {
        const res: any = await apiClient.get("/staff/tickets")
        if (Array.isArray(res) && res.length > 0) {
          const mapped: TicketItem[] = res.map((t: any) => ({
            id: t.id,
            ticketCode: t.ticketCode || `TCK-${t.id}`,
            title:
              t.title ||
              (t.type === "EARLY_TERMINATION"
                ? "Trả Kho Sớm Trước Hạn"
                : "Báo Cáo Sự Cố Ô Kho"),
            type: t.type || "INCIDENT",
            status: t.status || "SUBMITTED",
            customerId: t.customerId,
            customerName: t.customerName || `Khách hàng #${t.customerId || ""}`,
            customerPhone: t.customerPhone || "0988 xxx xxx",
            unitCode: t.unitCode || "—",
            contractId: t.contractId,
            contractCode:
              t.contractCode ||
              (t.contractId ? `HD-${t.contractId}` : undefined),
            description: t.description || "Không có mô tả chi tiết.",
            desiredDate: t.desiredDate ? String(t.desiredDate) : undefined,
            slaDeadline: t.slaDeadline ? String(t.slaDeadline) : undefined,
            isSlaBreached: t.isSlaBreached,
            createdAt: t.createdAt,
          }))
          setTickets(mapped)
          return
        }
      }
      // If mock mode or empty backend data, retain rich fallback
      setTickets(INITIAL_FALLBACK_TICKETS)
    } catch {
      setTickets(INITIAL_FALLBACK_TICKETS)
    }
  }, [])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  function updateStatus(id: string | number, nextStatus: TicketStatus) {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: nextStatus } : t))
    )
  }

  async function handleClaim(ticket: TicketItem) {
    try {
      if (!isMockMode() && typeof ticket.id === "number") {
        await apiClient.post(`/staff/tickets/${ticket.id}/accept`)
      }
      updateStatus(ticket.id, "IN_PROGRESS")
      toast.success(
        `Nhân viên đã tiếp nhận Ticket #${ticket.ticketCode} (IN_PROGRESS).`
      )
    } catch (err: any) {
      toast.error(
        err?.response?.data || "Không thể tiếp nhận ticket, vui lòng thử lại."
      )
    }
  }

  async function handleResolveGeneral(ticket: TicketItem) {
    try {
      if (!isMockMode() && typeof ticket.id === "number") {
        await apiClient.post(`/staff/tickets/${ticket.id}/resolve`, {
          note: "Staff đã kiểm tra, bảo trì và hoàn tất sự cố tại chỗ.",
        })
      }
      updateStatus(ticket.id, "RESOLVED")
      toast.success(
        `Ticket #${ticket.ticketCode} đã xử lý hoàn tất (RESOLVED).`
      )
    } catch (err: any) {
      toast.error(
        err?.response?.data || "Không thể đóng ticket, vui lòng thử lại."
      )
    }
  }

  function handleOpenInspection(ticket: TicketItem) {
    setInspectionTicketId(ticket.id)
    setInspectionTarget({
      contractCode:
        ticket.contractCode ||
        (ticket.contractId
          ? `HD-CG-2026-${ticket.contractId}`
          : `HD-${ticket.unitCode || "902"}`),
      customerName: ticket.customerName || "Khách hàng trả kho",
      unitCode: ticket.unitCode || "F1-S105",
      depositAmount: 1_000_000,
    })
  }

  function handleCloseInspection() {
    if (inspectionTicketId !== null) {
      // Mark as resolved
      updateStatus(inspectionTicketId, "RESOLVED")
      if (!isMockMode() && typeof inspectionTicketId === "number") {
        apiClient
          .post(`/staff/tickets/${inspectionTicketId}/resolve`, {
            note: "Biên bản nghiệm thu hoàn tất, hợp đồng đã thanh lý cọc.",
          })
          .catch(() => {})
      }
    }
    setInspectionTarget(null)
    setInspectionTicketId(null)
  }

  function handleOpenUnlock(ticket: TicketItem) {
    setUnlockTarget({
      id: ticket.id,
      ticketCode: ticket.ticketCode,
      unitCode: ticket.unitCode,
      customerName: ticket.customerName,
      phone: ticket.customerPhone,
      identityNumber: ticket.identityNumber,
    })
  }

  // Filter & Search logic
  const query = searchQuery.trim().toLowerCase()
  const filtered = tickets.filter((t) => {
    if (filter !== "ALL" && t.status !== filter) return false
    if (!query) return true
    return (
      t.ticketCode.toLowerCase().includes(query) ||
      t.title.toLowerCase().includes(query) ||
      (t.customerName && t.customerName.toLowerCase().includes(query)) ||
      (t.unitCode && t.unitCode.toLowerCase().includes(query)) ||
      (t.description && t.description.toLowerCase().includes(query))
    )
  })

  function countOf(status: TicketStatus): number {
    return tickets.filter((t) => t.status === status).length
  }

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
                  Cam kết thời gian phản hồi SLA 15 phút • Khung giờ trực quầy:
                  08:00 - 20:00 hàng ngày
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
                Ca Trực Hoạt Động (08:00 - 20:00)
              </span>
            </div>
          </div>

          {/* SEARCH & FILTERS */}
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div className="inner-box inline-flex flex-wrap gap-1 rounded-2xl border p-1 text-xs">
              {FILTERS.map((f) => {
                const active = f.key === filter
                const count = f.key === "ALL" ? tickets.length : countOf(f.key)
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

            <div className="relative w-full max-w-xs">
              <SearchIcon className="pointer-events-none absolute top-2.5 left-3 size-3.5 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã ticket, tên khách, ô kho..."
                className="inner-box text-title w-full rounded-xl border py-1.5 pr-3 pl-8 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-muted">
            <InfoIcon className="size-3.5 text-amber-500" /> Quá 15 phút chưa
            tiếp nhận sẽ tự động gửi cảnh báo lên Facility Manager.
          </div>
        </div>

        {/* TICKET CARDS GRID */}
        {filtered.length === 0 ? (
          <div className="card-box flex flex-col items-center justify-center rounded-2xl border py-12 text-center text-muted">
            <CheckCircle2Icon className="mb-2 size-10 text-muted" />
            <h4 className="text-title text-sm font-bold">
              Không có ticket nào trong danh mục này
            </h4>
            <p className="text-xs">
              Tất cả yêu cầu đã được xử lý hoặc không khớp với bộ lọc.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((ticket) => {
              const sla = getSlaInfo(ticket, now)
              const isUnlock =
                ticket.type === "INCIDENT" &&
                (ticket.title.toLowerCase().includes("mở khóa") ||
                  ticket.title.toLowerCase().includes("khóa") ||
                  ticket.description?.toLowerCase().includes("chìa"))
              const isEarlyTerm = ticket.type === "EARLY_TERMINATION"
              const typeColor = isUnlock
                ? "text-amber-600 dark:text-amber-400"
                : isEarlyTerm
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-blue-600 dark:text-blue-400"

              return (
                <div
                  key={ticket.id}
                  className="card-box staff-ticket-card flex flex-col justify-between space-y-3 rounded-2xl border p-4 shadow-sm"
                >
                  <div className="space-y-2.5">
                    {/* CARD HEADER */}
                    <div className="flex items-start justify-between gap-2 border-b pb-2.5">
                      <div>
                        <span className="font-mono text-xs font-black text-blue-600 dark:text-blue-400">
                          #{ticket.ticketCode}
                        </span>
                        <h5
                          className={cn(
                            "mt-0.5 flex items-center gap-1.5 text-sm font-extrabold",
                            typeColor
                          )}
                        >
                          {isUnlock ? (
                            <KeyRoundIcon className="size-3.5 shrink-0" />
                          ) : isEarlyTerm ? (
                            <ArchiveIcon className="size-3.5 shrink-0" />
                          ) : (
                            <WrenchIcon className="size-3.5 shrink-0" />
                          )}
                          <span>{ticket.title}</span>
                        </h5>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[10px] font-black whitespace-nowrap",
                          sla.className
                        )}
                      >
                        <ClockIcon className="mr-1 inline size-2.5" />
                        {sla.text}
                      </span>
                    </div>

                    {/* CARD DETAILS */}
                    <div className="space-y-1.5 text-xs">
                      {ticket.unitCode && (
                        <div className="flex items-center justify-between gap-3 text-muted">
                          <span className="shrink-0">Vị trí ô kho:</span>
                          <span className="text-title text-right font-mono font-bold">
                            Kho {ticket.unitCode}
                          </span>
                        </div>
                      )}

                      {ticket.customerName && (
                        <div className="flex items-center justify-between gap-3 text-muted">
                          <span className="shrink-0">Khách hàng:</span>
                          <span className="text-title text-right font-bold">
                            {ticket.customerName}
                            {ticket.customerPhone
                              ? ` • ${ticket.customerPhone}`
                              : ""}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-muted">
                        <span>Trạng thái:</span>
                        <span className="text-title rounded-md border px-2 py-0.5 text-[10px] font-extrabold">
                          {ticket.status === "SUBMITTED"
                            ? "⌛ SUBMITTED (Chờ Tiếp Nhận)"
                            : ticket.status === "IN_PROGRESS"
                              ? "⚙ IN_PROGRESS (Đang Xử Lý)"
                              : "✓ RESOLVED (Đã Hoàn Tất)"}
                        </span>
                      </div>
                    </div>

                    {/* NOTE / QUOTE */}
                    {ticket.description && (
                      <div className="inner-box rounded-xl border p-2.5 text-[11px] leading-relaxed text-slate-600 italic dark:text-slate-300">
                        "{ticket.description}"
                      </div>
                    )}
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex flex-col gap-1.5 border-t pt-2">
                    {ticket.status === "SUBMITTED" && (
                      <button
                        type="button"
                        onClick={() => handleClaim(ticket)}
                        className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
                      >
                        <UserCheckIcon className="size-3.5" />
                        <span>Tiếp Nhận Xử Lý (Claim)</span>
                      </button>
                    )}

                    {ticket.status === "IN_PROGRESS" && isUnlock && (
                      <button
                        type="button"
                        onClick={() => handleOpenUnlock(ticket)}
                        className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
                      >
                        <IdCardIcon className="size-3.5" />
                        <span>Đối Chiếu CCCD &amp; Mở Khóa</span>
                      </button>
                    )}

                    {ticket.status === "IN_PROGRESS" && isEarlyTerm && (
                      <button
                        type="button"
                        onClick={() => handleOpenInspection(ticket)}
                        className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 text-xs font-extrabold text-white shadow-sm transition hover:bg-blue-700"
                      >
                        <ClipboardCheckIcon className="size-3.5" />
                        <span>Mở Biên Bản Nghiệm Thu &amp; Quyết Toán</span>
                      </button>
                    )}

                    {ticket.status === "IN_PROGRESS" &&
                      !isUnlock &&
                      !isEarlyTerm && (
                        <button
                          type="button"
                          onClick={() => handleResolveGeneral(ticket)}
                          className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
                        >
                          <CircleCheckIcon className="size-3.5" />
                          <span>Xác Nhận Đã Sửa Xong ➔ Đóng Ticket</span>
                        </button>
                      )}

                    {ticket.status === "RESOLVED" && (
                      <button
                        type="button"
                        disabled
                        className="flex w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-slate-200 py-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <CircleCheckIcon className="size-3.5 text-muted" />
                        <span>Đã Đóng Ticket Hoàn Tất</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* INSPECTION MODAL */}
      <StaffInspectionModal
        target={inspectionTarget}
        onClose={handleCloseInspection}
      />

      {/* UNLOCK MODAL */}
      <StaffUnlockModal
        ticket={unlockTarget}
        onClose={() => setUnlockTarget(null)}
        onResolved={() => {
          if (unlockTarget) updateStatus(unlockTarget.id, "RESOLVED")
        }}
      />
    </>
  )
}

export default StaffTicketPanel
