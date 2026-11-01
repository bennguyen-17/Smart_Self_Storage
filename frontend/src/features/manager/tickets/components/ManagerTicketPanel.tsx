import { useEffect, useMemo, useState } from "react"
import {
  ArchiveIcon,
  CheckCircle2Icon,
  CircleCheckIcon,
  KeyRoundIcon,
  RefreshCwIcon,
  UserCheckIcon,
  WrenchIcon,
} from "lucide-react"
import { cn } from "cn"
import { toast } from "sonner"

import { useAuth } from "@/context/AuthContext"
import { getErrorMessage } from "@/lib/api"
import type { ManagerTicketItem, ManagerTicketStatus } from "../types"
import { listManagerTickets, managerAcceptTicket } from "../api/ticketApi"
import ResolveTicketModal from "./ResolveTicketModal"

const STATUS_FILTERS: { key: ManagerTicketStatus; label: string }[] = [
  { key: "ALL", label: "Tất cả" },
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
  const [resolvingTicket, setResolvingTicket] = useState<ManagerTicketItem | null>(null)

  const [reloadCount, setReloadCount] = useState(0)

  // Tải ngay và tự tải lại mỗi 30s. Chỉ đổi state trong callback khi API trả về (không setState ngay trong effect);
  // `ignore` bỏ qua kết quả về muộn sau khi đã rời trang hoặc đổi cơ sở.
  useEffect(() => {
    let ignore = false
    const load = () =>
      listManagerTickets(facilityId)
        .then(
          (data) => {
            if (!ignore) setTickets(data)
          },
          (err: unknown) => {
            if (!ignore) toast.error(`Không thể tải danh sách ticket của cơ sở: ${getErrorMessage(err)}`)
          }
        )
        .finally(() => {
          if (!ignore) setLoading(false)
        })
    void load()
    const interval = setInterval(load, 30000)
    return () => {
      ignore = true
      clearInterval(interval)
    }
  }, [facilityId, reloadCount])

  // Nút "Làm mới": quay biểu tượng trong lúc tải; lần tải tự động 30s chạy ngầm, không quay
  function refreshTickets() {
    setLoading(true)
    setReloadCount((n) => n + 1)
  }

  // Manager trực tiếp bấm Tiếp nhận ticket
  async function handleAccept(ticket: ManagerTicketItem) {
    try {
      const updated = await managerAcceptTicket(ticket.id)
      toast.success(`Quản lý đã tiếp nhận Ticket #${ticket.ticketCode} (IN_PROGRESS).`)
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, ...updated, status: "IN_PROGRESS" } : t)))
    } catch (err) {
      toast.error(`Không thể tiếp nhận ticket: ${getErrorMessage(err)}`)
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

    if (ticket.type === "EARLY_TERMINATION") {
      return (
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
          {ticket.desiredDate ? `Hẹn: ${ticket.desiredDate}` : "Trả kho sớm"}
        </span>
      )
    }

    if (ticket.desiredDate) {
      return (
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
          Hẹn: {ticket.desiredDate}
        </span>
      )
    }

    if (ticket.createdAt) {
      // new Date không ném lỗi; chuỗi sai cho ra ngày không hợp lệ (NaN) thì rơi xuống "—"
      const d = new Date(ticket.createdAt)
      if (!isNaN(d.getTime())) {
        const hh = String(d.getHours()).padStart(2, "0")
        const mm = String(d.getMinutes()).padStart(2, "0")
        const dd = String(d.getDate()).padStart(2, "0")
        const MM = String(d.getMonth() + 1).padStart(2, "0")
        return (
          <span className="text-slate-600 dark:text-slate-300 text-xs font-medium">
            {hh}:{mm} - {dd}/{MM}
          </span>
        )
      }
    }

    return <span className="text-slate-400 text-xs">—</span>
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
        {/* Card 1: Tổng ticket */}
        <div
          onClick={() => setStatusFilter("ALL")}
          className={cn(
            "card-box cursor-pointer rounded-2xl border p-4 shadow-sm transition hover:scale-[1.02]",
            statusFilter === "ALL"
              ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30"
              : "border-slate-200 dark:border-slate-800"
          )}
        >
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tất cả ticket</span>
          <div className="mt-2 text-2xl font-black text-slate-800 dark:text-slate-100">
            {counts.total}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Yêu cầu tại cơ sở</p>
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
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Chờ tiếp nhận</span>
          <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-300">
            {counts.submitted}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Chưa có người nhận</p>
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
          <span className="text-xs font-bold text-blue-700 dark:text-blue-400">Đang xử lý</span>
          <div className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-300">
            {counts.inProgress}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Đang được xử lý</p>
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
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Đã giải quyết</span>
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
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo Mã Ticket, Tên khách hàng, SĐT hoặc Vị trí ô kho..."
              className="inner-box w-full rounded-xl border border-slate-200/80 px-3.5 py-2 pl-9 text-xs font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700"
            />
            <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400 z-10"></i>
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
            onClick={refreshTickets}
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
                <th className="px-4 py-3.5 text-center whitespace-nowrap">Thời Gian / Lịch Hẹn</th>
                <th className="px-4 py-3.5 text-center whitespace-nowrap">Trạng Thái</th>
                <th className="px-4 py-3.5 text-center whitespace-nowrap">Người Phụ Trách</th>
                <th className="px-4 py-3.5 text-center whitespace-nowrap">Hành Động Của Quản Lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredTickets.map((ticket) => {
                return (
                  <tr
                    key={ticket.id}
                    className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/50"
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
                          "rounded-md border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
                          ticket.status === "SUBMITTED"
                            ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                            : ticket.status === "IN_PROGRESS"
                              ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                        )}
                      >
                        {ticket.status === "SUBMITTED"
                          ? "Chờ tiếp nhận"
                          : ticket.status === "IN_PROGRESS"
                            ? "Đang xử lý"
                            : "Đã giải quyết"}
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
                        {/* Khi ticket là SUBMITTED: Quản lý bấm Tiếp nhận */}
                        {(ticket.status === "SUBMITTED" || ticket.status === "ESCALATED") && (
                          <button
                            type="button"
                            onClick={() => handleAccept(ticket)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-white shadow-xs transition hover:bg-blue-700"
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
