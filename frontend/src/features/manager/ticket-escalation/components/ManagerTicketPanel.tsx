import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertTriangleIcon,
  ArchiveIcon,
  CheckCircle2Icon,
  CircleCheckIcon,
  ClockIcon,
  HeadphonesIcon,
  IdCardIcon,
  KeyRoundIcon,
  RefreshCwIcon,
  SearchIcon,
  ShieldAlertIcon,
  UserCheckIcon,
  WrenchIcon,
} from "lucide-react"
import { cn } from "cn"
import { toast } from "sonner"

import { useAuth } from "@/context/AuthContext"
import type { ManagerTicketItem, ManagerTicketStatus } from "../types"
import { listManagerTickets, managerAcceptTicket } from "../api/ticketApi"
import ResolveTicketModal from "./ResolveTicketModal"

const STATUS_FILTERS: { key: ManagerTicketStatus; label: string }[] = [
  { key: "ALL", label: "Tất cả" },
  { key: "ESCALATED", label: "🚨 Cần Quản lý xử lý" },
  { key: "SUBMITTED", label: "Chờ tiếp nhận" },
  { key: "IN_PROGRESS", label: "Đang xử lý" },
  { key: "RESOLVED", label: "Đã hoàn tất" },
]

export default function ManagerTicketPanel() {
  const { user } = useAuth()
  const extra = user as (typeof user & { facilityId?: number | null }) | null
  const facilityId = extra?.facilityId ?? null

  const [tickets, setTickets] = useState<ManagerTicketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<ManagerTicketStatus>("ALL")
  const [typeFilter, setTypeFilter] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [now, setNow] = useState(Date.now())
  const [resolvingTicket, setResolvingTicket] = useState<ManagerTicketItem | null>(null)

  // Realtime countdown timer
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(timer)
  }, [])

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true)
      const data = await listManagerTickets(facilityId)
      setTickets(data)
    } catch {
      toast.error("Không thể tải danh sách ticket của cơ sở")
    } finally {
      setLoading(false)
    }
  }, [facilityId])

  useEffect(() => {
    fetchTickets()
    // Auto-refresh every 30s
    const interval = setInterval(fetchTickets, 30000)
    return () => clearInterval(interval)
  }, [fetchTickets])

  // Manager trực tiếp bấm Tiếp nhận ticket
  async function handleAccept(ticket: ManagerTicketItem) {
    try {
      const updated = await managerAcceptTicket(ticket.id)
      toast.success(`Quản lý đã tiếp nhận Ticket #${ticket.ticketCode} (IN_PROGRESS).`)
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, ...updated, status: "IN_PROGRESS" } : t)))
    } catch (err: any) {
      toast.error(err?.response?.data || "Không thể tiếp nhận ticket, vui lòng thử lại.")
    }
  }

  // Thống kê số lượng theo nhóm
  const counts = useMemo(() => {
    return {
      total: tickets.length,
      escalated: tickets.filter((t) => t.status === "ESCALATED").length,
      submitted: tickets.filter((t) => t.status === "SUBMITTED").length,
      inProgress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
      resolved: tickets.filter((t) => t.status === "RESOLVED").length,
    }
  }, [tickets])

  // Lọc và tìm kiếm
  const filteredTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return tickets.filter((t) => {
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false
      if (typeFilter !== "ALL" && t.type !== typeFilter) return false
      if (!q) return true
      return (
        t.ticketCode.toLowerCase().includes(q) ||
        (t.unitCode && t.unitCode.toLowerCase().includes(q)) ||
        (t.customerName && t.customerName.toLowerCase().includes(q)) ||
        (t.customerPhone && t.customerPhone.toLowerCase().includes(q)) ||
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q))
      )
    })
  }, [tickets, statusFilter, typeFilter, searchQuery])

  function getSlaBadge(ticket: ManagerTicketItem) {
    if (ticket.status === "RESOLVED") {
      return (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          ✓ Đã hoàn tất
        </span>
      )
    }

    if (ticket.status === "ESCALATED" || ticket.isSlaBreached) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-2.5 py-1 text-[11px] font-black text-rose-700 animate-pulse dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
          <AlertTriangleIcon className="size-3 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>Quá hạn 15p - Chuyển Quản lý</span>
        </span>
      )
    }

    if (ticket.type === "EARLY_TERMINATION") {
      return (
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
          {ticket.desiredDate ? `Hẹn: ${ticket.desiredDate}` : "Trả kho sớm"}
        </span>
      )
    }

    if (!ticket.slaDeadline) {
      return <span className="text-slate-400 text-xs">—</span>
    }

    const deadlineMs = new Date(ticket.slaDeadline).getTime()
    const diffSec = Math.floor((deadlineMs - now) / 1000)

    if (diffSec <= 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-2.5 py-1 text-[11px] font-black text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
          <ClockIcon className="size-3" />
          <span>Quá hạn SLA</span>
        </span>
      )
    }

    const m = Math.floor(diffSec / 60)
    const s = diffSec % 60
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
        <ClockIcon className="size-3" />
        <span>Còn {m}m {s}s SLA</span>
      </span>
    )
  }

  function getTypeIcon(type: string, title?: string) {
    const t = (type || "").toUpperCase()
    const titleLower = (title || "").toLowerCase()
    if (t === "EARLY_TERMINATION") return <ArchiveIcon className="size-3.5 text-indigo-500" />
    if (t === "UNLOCK" || titleLower.includes("mở khóa")) return <KeyRoundIcon className="size-3.5 text-amber-500" />
    return <WrenchIcon className="size-3.5 text-blue-500" />
  }

  return (
    <section aria-label="Xử lý sự cố & Escalation" className="space-y-5">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Card 1: Escalated (Cần xử lý) */}
        <div
          onClick={() => setStatusFilter("ESCALATED")}
          className={cn(
            "card-box cursor-pointer rounded-2xl border p-4 shadow-sm transition hover:scale-[1.02]",
            statusFilter === "ESCALATED"
              ? "border-rose-500 bg-rose-500/10 ring-2 ring-rose-500/30"
              : counts.escalated > 0
                ? "border-rose-300 bg-rose-50/70 dark:border-rose-900 dark:bg-rose-950/30"
                : "border-slate-200 dark:border-slate-800"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400">🚨 Chuyển Quản lý</span>
            {counts.escalated > 0 && <span className="size-2 rounded-full bg-rose-500 animate-ping" />}
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-300">
            {counts.escalated}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Quá 15p chưa ai nhận</p>
        </div>

        {/* Card 2: Chờ tiếp nhận */}
        <div
          onClick={() => setStatusFilter("SUBMITTED")}
          className={cn(
            "card-box cursor-pointer rounded-2xl border p-4 shadow-sm transition hover:scale-[1.02]",
            statusFilter === "SUBMITTED"
              ? "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30"
              : "border-slate-200 dark:border-slate-800"
          )}
        >
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400">⏳ Chờ tiếp nhận</span>
          <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-300">
            {counts.submitted}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Trong thời hạn SLA</p>
        </div>

        {/* Card 3: Đang xử lý */}
        <div
          onClick={() => setStatusFilter("IN_PROGRESS")}
          className={cn(
            "card-box cursor-pointer rounded-2xl border p-4 shadow-sm transition hover:scale-[1.02]",
            statusFilter === "IN_PROGRESS"
              ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30"
              : "border-slate-200 dark:border-slate-800"
          )}
        >
          <span className="text-xs font-bold text-blue-700 dark:text-blue-400">⚙️ Đang xử lý</span>
          <div className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-300">
            {counts.inProgress}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Đã tiếp nhận xử lý</p>
        </div>

        {/* Card 4: Đã hoàn tất */}
        <div
          onClick={() => setStatusFilter("RESOLVED")}
          className={cn(
            "card-box cursor-pointer rounded-2xl border p-4 shadow-sm transition hover:scale-[1.02]",
            statusFilter === "RESOLVED"
              ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30"
              : "border-slate-200 dark:border-slate-800"
          )}
        >
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">✅ Đã giải quyết</span>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-300">
            {counts.resolved}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Hoàn tất đóng ticket</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-box flex flex-col justify-between gap-3 rounded-2xl border p-4 shadow-sm md:flex-row md:items-center">
        <div className="flex max-w-xl flex-1 space-x-2">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute top-2.5 left-3.5 size-4 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo Mã Ticket, Tên khách hàng, SĐT hoặc Vị trí ô kho..."
              className="inner-box w-full rounded-xl border border-slate-200/80 px-3.5 py-2 pl-9 text-xs font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="inner-box rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none dark:border-slate-700"
          >
            <option value="ALL">Tất cả loại yêu cầu</option>
            <option value="INCIDENT">Sự cố kỹ thuật</option>
            <option value="UNLOCK">Mở khóa hộ</option>
            <option value="EARLY_TERMINATION">Trả kho trước hạn</option>
            <option value="MAINTENANCE">Bảo trì thiết bị</option>
          </select>
          <button
            type="button"
            onClick={fetchTickets}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            title="Làm mới danh sách"
          >
            <RefreshCwIcon className={cn("size-3.5", loading && "animate-spin")} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((f) => {
          const active = f.key === statusFilter
          const count =
            f.key === "ALL"
              ? tickets.length
              : f.key === "ESCALATED"
                ? counts.escalated
                : f.key === "SUBMITTED"
                  ? counts.submitted
                  : f.key === "IN_PROGRESS"
                    ? counts.inProgress
                    : counts.resolved
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap shadow-2xs transition",
                active
                  ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                  : "border-slate-200/90 bg-white/80 text-slate-700 hover:bg-white hover:text-slate-900 dark:border-slate-700/80 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-800"
              )}
            >
              {f.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Table List View */}
      {filteredTickets.length === 0 ? (
        <div className="card-box flex flex-col items-center justify-center rounded-2xl border py-12 text-center text-muted">
          <CheckCircle2Icon className="mb-2 size-10 text-emerald-500/70" />
          <h4 className="text-title text-sm font-bold">Không có yêu cầu nào cần xử lý</h4>
          <p className="text-xs text-slate-500">Tất cả ticket đều đã được xử lý hoặc không khớp với bộ lọc.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm dark:border-slate-800">
          <table className="w-full min-w-[1060px] text-center text-xs">
            <thead className="border-b bg-slate-100 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:bg-slate-800/80 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3.5 text-center whitespace-nowrap">Mã &amp; Loại</th>
                <th className="px-4 py-3.5 text-center whitespace-nowrap">Vị trí / Ô Kho</th>
                <th className="px-4 py-3.5 text-center whitespace-nowrap">Khách Hàng</th>
                <th className="min-w-[220px] max-w-[360px] px-4 py-3.5 text-center whitespace-nowrap">Nội Dung Yêu Cầu</th>
                <th className="px-4 py-3.5 text-center whitespace-nowrap">SLA &amp; Thời Hạn</th>
                <th className="px-4 py-3.5 text-center whitespace-nowrap">Trạng Thái</th>
                <th className="px-4 py-3.5 text-center whitespace-nowrap">Người Phụ Trách</th>
                <th className="px-4 py-3.5 text-center whitespace-nowrap">Hành Động Của Quản Lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredTickets.map((ticket) => {
                const isEscalated = ticket.status === "ESCALATED"
                return (
                  <tr
                    key={ticket.id}
                    className={cn(
                      "transition hover:bg-slate-50/70 dark:hover:bg-slate-800/50",
                      isEscalated && "bg-rose-50/40 dark:bg-rose-950/20"
                    )}
                  >
                    {/* Cột 1: Mã & Loại Ticket */}
                    <td className="px-4 py-3.5 align-middle text-center whitespace-nowrap">
                      <div className="flex flex-col items-center justify-center">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          #{ticket.ticketCode}
                        </span>
                        <div className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {getTypeIcon(ticket.type, ticket.title)}
                          <span>{ticket.title || ticket.type}</span>
                        </div>
                      </div>
                    </td>

                    {/* Cột 2: Vị trí / Ô kho */}
                    <td className="px-4 py-3.5 align-middle text-center font-mono font-bold whitespace-nowrap text-slate-800 dark:text-slate-200">
                      {ticket.unitCode || "Cơ sở / Cổng"}
                      {ticket.facilityName && (
                        <div className="text-[10px] font-normal text-slate-400">
                          {ticket.facilityName}
                        </div>
                      )}
                    </td>

                    {/* Cột 3: Khách hàng */}
                    <td className="px-4 py-3.5 align-middle text-center whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {ticket.customerName || `Khách hàng #${ticket.customerId}`}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {ticket.customerPhone || "—"}
                      </div>
                    </td>

                    {/* Cột 4: Nội dung */}
                    <td className="min-w-[220px] max-w-[360px] px-4 py-3.5 align-middle text-center">
                      <p className="text-xs text-slate-600 italic dark:text-slate-300 leading-relaxed break-words">
                        {ticket.description ? `"${ticket.description}"` : "—"}
                      </p>
                    </td>

                    {/* Cột 5: SLA & Thời hạn */}
                    <td className="px-4 py-3.5 align-middle text-center whitespace-nowrap">
                      {getSlaBadge(ticket)}
                    </td>

                    {/* Cột 6: Trạng thái */}
                    <td className="px-4 py-3.5 align-middle text-center whitespace-nowrap">
                      <span
                        className={cn(
                          "rounded-md border px-2 py-0.5 text-[10px] font-extrabold whitespace-nowrap",
                          ticket.status === "ESCALATED"
                            ? "border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                            : ticket.status === "SUBMITTED"
                              ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                              : ticket.status === "IN_PROGRESS"
                                ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                        )}
                      >
                        {ticket.status === "ESCALATED"
                          ? "🚨 ĐÃ CHUYỂN QUẢN LÝ"
                          : ticket.status === "SUBMITTED"
                            ? "⌛ Chờ tiếp nhận"
                            : ticket.status === "IN_PROGRESS"
                              ? "⚙ Đang xử lý"
                              : "✓ Đã giải quyết"}
                      </span>
                    </td>

                    {/* Cột 7: Người phụ trách */}
                    <td className="px-4 py-3.5 align-middle text-center whitespace-nowrap">
                      {ticket.assignedStaffName ? (
                        <div className="flex flex-col items-center">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {ticket.assignedStaffName}
                          </span>
                          <span className="text-[10px] text-blue-600 dark:text-blue-400">
                            (ID #{ticket.assignedStaffId})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Chưa tiếp nhận</span>
                      )}
                    </td>

                    {/* Cột 8: Hành động của Quản lý */}
                    <td className="px-4 py-3.5 align-middle text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                        {/* Khi ticket là ESCALATED hoặc SUBMITTED: Quản lý bấm Tiếp nhận */}
                        {(ticket.status === "ESCALATED" || ticket.status === "SUBMITTED") && (
                          <button
                            type="button"
                            onClick={() => handleAccept(ticket)}
                            className={cn(
                              "inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap text-white shadow-xs transition hover:opacity-90",
                              ticket.status === "ESCALATED" ? "bg-rose-600 hover:bg-rose-700" : "bg-blue-600 hover:bg-blue-700"
                            )}
                          >
                            <UserCheckIcon className="size-3.5" />
                            <span>Tiếp nhận xử lý</span>
                          </button>
                        )}

                        {/* Khi ticket đang IN_PROGRESS: Quản lý trực tiếp Đóng / Giải quyết */}
                        {ticket.status === "IN_PROGRESS" && (
                          <button
                            type="button"
                            onClick={() => setResolvingTicket(ticket)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold whitespace-nowrap text-white shadow-xs transition hover:bg-emerald-700"
                          >
                            <CircleCheckIcon className="size-3.5" />
                            <span>Đóng / Giải quyết</span>
                          </button>
                        )}

                        {/* Khi ticket đã RESOLVED: Hiển thị kết quả */}
                        {ticket.status === "RESOLVED" && (
                          <div className="flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2Icon className="size-4" />
                              <span>Đã giải quyết</span>
                            </span>
                            {ticket.resolutionNote && (
                              <span
                                className="max-w-[180px] truncate text-[10px] text-slate-500 italic"
                                title={ticket.resolutionNote}
                              >
                                "{ticket.resolutionNote}"
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal giải quyết ticket */}
      <ResolveTicketModal
        ticket={resolvingTicket}
        onClose={() => setResolvingTicket(null)}
        onResolved={(updated) => {
          setTickets((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)))
        }}
      />
    </section>
  )
}
