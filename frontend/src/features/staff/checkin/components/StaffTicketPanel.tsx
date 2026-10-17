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
    let isTodayOrPast = true
    if (ticket.desiredDate) {
      try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const parts = ticket.desiredDate.split(/[-T ]/)
        if (parts.length >= 3) {
          const year = parseInt(parts[0], 10)
          const month = parseInt(parts[1], 10) - 1
          const day = parseInt(parts[2], 10)
          const d = new Date(year, month, day)
          isTodayOrPast = today.getTime() >= d.getTime()
        }
      } catch {}
    }
    return {
      text: ticket.desiredDate
        ? isTodayOrPast
          ? `Đã đến hẹn: ${ticket.desiredDate}`
          : `Hẹn ngày: ${ticket.desiredDate}`
        : "Hẹn Hôm Nay",
      className: isTodayOrPast
        ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
        : "border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
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
      contractId: ticket.contractId,
      ticketId: typeof ticket.id === "number" ? ticket.id : undefined,
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

        {/* TICKET VIEW (LIST OR GRID) */}
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
          /* DẠNG DANH SÁCH (TABLE / LIST VIEW) */
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm dark:border-slate-800">
            <table className="w-full min-w-[920px] text-left text-xs">
              <thead className="border-b bg-slate-100 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:bg-slate-800/80 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3.5">Mã &amp; Loại Ticket</th>
                  <th className="px-4 py-3.5">Vị trí Ô Kho</th>
                  <th className="px-4 py-3.5">Khách Hàng</th>
                  <th className="max-w-[280px] px-4 py-3.5">Nội Dung Yêu Cầu</th>
                  <th className="px-4 py-3.5">Thời Hạn / Hẹn</th>
                  <th className="px-4 py-3.5">Trạng Thái</th>
                  <th className="px-4 py-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filtered.map((ticket) => {
                  const sla = getSlaInfo(ticket, now)
                  const isUnlock =
                    ticket.type === "INCIDENT" &&
                    (ticket.title.toLowerCase().includes("mở khóa") ||
                      ticket.title.toLowerCase().includes("khóa") ||
                      ticket.description?.toLowerCase().includes("chìa"))
                  const isEarlyTerm = ticket.type === "EARLY_TERMINATION"
                  const isReturnDue =
                    !ticket.desiredDate ||
                    (() => {
                      try {
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        const parts = ticket.desiredDate.split(/[-T ]/)
                        if (parts.length >= 3) {
                          const year = parseInt(parts[0], 10)
                          const month = parseInt(parts[1], 10) - 1
                          const day = parseInt(parts[2], 10)
                          const d = new Date(year, month, day)
                          return today.getTime() >= d.getTime()
                        }
                        return true
                      } catch {
                        return true
                      }
                    })()
                  const typeColor = isUnlock
                    ? "text-amber-600 dark:text-amber-400"
                    : isEarlyTerm
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-blue-600 dark:text-blue-400"

                  return (
                    <tr
                      key={ticket.id}
                      className="transition hover:bg-blue-500/5 dark:hover:bg-slate-800/50"
                    >
                      {/* Cột 1: Mã & Loại Ticket */}
                      <td className="px-4 py-3.5 align-middle">
                        <span className="font-mono text-xs font-black text-blue-600 dark:text-blue-400">
                          #{ticket.ticketCode}
                        </span>
                        <div
                          className={cn(
                            "mt-0.5 flex items-center gap-1.5 text-xs font-bold",
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
                        </div>
                      </td>

                      {/* Cột 2: Vị trí Ô Kho */}
                      <td className="px-4 py-3.5 align-middle font-mono font-bold text-slate-800 dark:text-slate-200">
                        {ticket.unitCode ? `Kho ${ticket.unitCode}` : "Cổng / Ra vào"}
                      </td>

                      {/* Cột 3: Khách Hàng */}
                      <td className="px-4 py-3.5 align-middle">
                        <div className="font-extrabold text-slate-900 dark:text-white">
                          {ticket.customerName ||
                            (ticket.customerId
                              ? `Khách hàng #${ticket.customerId}`
                              : "—")}
                        </div>
                        {ticket.customerPhone && (
                          <div className="text-[11px] text-muted">
                            {ticket.customerPhone}
                          </div>
                        )}
                      </td>

                      {/* Cột 4: Nội dung yêu cầu */}
                      <td className="max-w-[280px] px-4 py-3.5 align-middle">
                        <p className="line-clamp-2 text-[11px] text-slate-600 italic dark:text-slate-300">
                          {ticket.description
                            ? `"${ticket.description}"`
                            : "—"}
                        </p>
                      </td>

                      {/* Cột 5: Thời hạn SLA */}
                      <td className="px-4 py-3.5 align-middle">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black whitespace-nowrap",
                            sla.className
                          )}
                        >
                          <ClockIcon className="mr-1 inline size-2.5" />
                          {sla.text}
                        </span>
                      </td>

                      {/* Cột 6: Trạng thái */}
                      <td className="px-4 py-3.5 align-middle">
                        <span
                          className={cn(
                            "rounded-md border px-2 py-0.5 text-[10px] font-extrabold whitespace-nowrap",
                            ticket.status === "SUBMITTED"
                              ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                              : ticket.status === "IN_PROGRESS"
                                ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                          )}
                        >
                          {ticket.status === "SUBMITTED"
                            ? "⌛ Chờ Tiếp Nhận"
                            : ticket.status === "IN_PROGRESS"
                              ? "⚙ Đang Xử Lý"
                              : "✓ Đã Hoàn Tất"}
                        </span>
                      </td>

                      {/* Cột 7: Thao tác */}
                      <td className="px-4 py-3.5 align-middle text-right">
                        {ticket.status === "SUBMITTED" && (
                          <button
                            type="button"
                            onClick={() => handleClaim(ticket)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700"
                          >
                            <UserCheckIcon className="size-3.5" />
                            <span>Tiếp Nhận</span>
                          </button>
                        )}

                        {ticket.status === "IN_PROGRESS" && isUnlock && (
                          <button
                            type="button"
                            onClick={() => handleOpenUnlock(ticket)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700"
                          >
                            <IdCardIcon className="size-3.5" />
                            <span>Mở Khóa</span>
                          </button>
                        )}

                        {ticket.status === "IN_PROGRESS" && isEarlyTerm && (
                          <div className="flex items-center justify-end gap-1.5">
                            {isReturnDue ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenInspection(ticket)}
                                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-extrabold text-white shadow-xs transition hover:bg-emerald-700"
                                  title="Nghiệm thu ô kho & thanh lý cọc"
                                >
                                  <ClipboardCheckIcon className="size-3.5" />
                                  <span>Xác nhận trả kho</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleResolveGeneral(ticket)}
                                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                                  title="Đóng ticket hoàn tất"
                                >
                                  <CircleCheckIcon className="size-3.5" />
                                  <span>Đóng ticket</span>
                                </button>
                              </>
                            ) : (
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                                  Chờ đến hẹn ({ticket.desiredDate})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenInspection(ticket)}
                                  className="cursor-pointer text-[10px] text-blue-600 underline hover:text-blue-700 dark:text-blue-400"
                                  title="Khách đến sớm hơn lịch hẹn"
                                >
                                  Khách đến sớm? Xác nhận
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {ticket.status === "IN_PROGRESS" &&
                          !isUnlock &&
                          !isEarlyTerm && (
                            <button
                              type="button"
                              onClick={() => handleResolveGeneral(ticket)}
                              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700"
                            >
                              <CircleCheckIcon className="size-3.5" />
                              <span>Đóng Ticket</span>
                            </button>
                          )}

                        {ticket.status === "RESOLVED" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CircleCheckIcon className="size-3.5" />
                            <span>Đã Đóng</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INSPECTION MODAL */}
      <StaffInspectionModal
        target={inspectionTarget}
        onClose={handleCloseInspection}
        onConfirmed={handleCloseInspection}
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
