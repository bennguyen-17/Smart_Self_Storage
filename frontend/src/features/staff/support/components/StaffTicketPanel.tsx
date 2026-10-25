import { useCallback, useEffect, useState } from "react"
import {
  ArchiveIcon,
  CheckCircle2Icon,
  CircleCheckIcon,
  ClipboardCheckIcon,
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
import { getErrorMessage } from "@/lib/api"
import StaffShiftRequiredCard from "@/features/staff/components/StaffShiftRequiredCard"

import StaffInspectionModal, {
  type InspectionTarget,
} from "@/features/staff/checkin/components/StaffInspectionModal"
import StaffUnlockModal, { type UnlockTicketInfo } from "./StaffUnlockModal"
import StaffShiftBadge from "@/features/staff/components/StaffShiftBadge"

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
  assignedStaffId?: number
  assignedStaffName?: string
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

const FILTERS: { key: "ALL" | TicketStatus; label: string }[] = [
  { key: "ALL", label: "Tất Cả" },
  { key: "SUBMITTED", label: "Chờ Tiếp Nhận" },
  { key: "IN_PROGRESS", label: "Đang Xử Lý" },
  { key: "RESOLVED", label: "Đã Hoàn Tất" },
]

function formatTicketTimeInfo(ticket: TicketItem) {
  if (ticket.status === "RESOLVED") {
    return { text: "—", className: "text-slate-400 font-medium" }
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
        ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-medium"
        : "border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 font-medium",
    }
  }

  if (ticket.desiredDate) {
    return {
      text: `Hẹn: ${ticket.desiredDate}`,
      className: "border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 font-medium",
    }
  }

  if (ticket.createdAt) {
    try {
      const d = new Date(ticket.createdAt)
      if (!isNaN(d.getTime())) {
        const hh = String(d.getHours()).padStart(2, "0")
        const mm = String(d.getMinutes()).padStart(2, "0")
        const dd = String(d.getDate()).padStart(2, "0")
        const MM = String(d.getMonth() + 1).padStart(2, "0")
        return {
          text: `${hh}:${mm} - ${dd}/${MM}`,
          className: "text-slate-600 dark:text-slate-300 font-medium",
        }
      }
    } catch {}
  }

  return { text: "—", className: "text-slate-400 font-medium" }
}

function formatTicketCode(code: string | undefined, ticketId?: string | number): string {
  if (!code) return "TCK-202610-001"
  let clean = code.trim().replace(/^#/, "")

  // Đã chuẩn định dạng TCK-YYYYMM-XXX
  if (/^TCK-\d{6}-\d{3,4}$/.test(clean)) {
    return clean
  }

  // Nếu là mã cũ dạng TCK-206148 (6 số ngẫu nhiên) hoặc TCK-TRM-xxx, TCK-INC-xxx
  // Chuẩn hóa đồng nhất theo mã tuần tự TCK-202610-XXX
  if (ticketId !== undefined && ticketId !== null) {
    const parsed = typeof ticketId === "number" ? ticketId : parseInt(String(ticketId), 10)
    if (!isNaN(parsed) && parsed > 0) {
      const seq = String(parsed % 1000).padStart(3, "0")
      return `TCK-202610-${seq}`
    }
  }

  const numMatch = clean.match(/\d+$/)
  const seq = numMatch ? String(parseInt(numMatch[0], 10) % 1000).padStart(3, "0") : "001"
  return `TCK-202610-${seq}`
}

function getTicketTypeDisplayName(ticket: TicketItem): string {
  const type = (ticket.type ?? "").toUpperCase()
  if (type === "EARLY_TERMINATION") {
    return "Yêu cầu trả kho sớm"
  }
  if (type === "UNLOCK") {
    return "Mở khóa khẩn cấp"
  }
  if (type === "MAINTENANCE") {
    return "Bảo trì / Sửa chữa"
  }
  let title = (ticket.title || "").trim()
  title = title.replace(/\s*-\s*Ô\s*kho\s+.*$/i, "").trim()
  if (title.startsWith("Yêu cầu hỗ trợ: ")) {
    title = title.replace("Yêu cầu hỗ trợ: ", "").trim()
  }
  const tLower = title.toLowerCase()
  if (tLower.includes("mở khóa") || tLower.includes("quên chìa") || tLower.includes("khóa")) {
    return "Mở khóa khẩn cấp"
  }
  if (tLower.includes("xe kéo") || tLower.includes("thiết bị")) {
    return "Hỗ trợ thiết bị kho"
  }
  if (tLower.includes("mã pin") || tLower.includes("cổng")) {
    return "Báo sự cố kỹ thuật"
  }
  if (tLower.includes("đèn") || tLower.includes("hỏng") || tLower.includes("sửa")) {
    return "Bảo trì cơ sở vật chất"
  }
  if (tLower.includes("độ ẩm") || tLower.includes("kho mát")) {
    return "Kiểm tra kỹ thuật kho"
  }
  if (type === "INCIDENT") {
    return "Báo sự cố kỹ thuật"
  }
  if (type === "OTHER") {
    return "Hỗ trợ khách hàng"
  }
  return title || "Yêu cầu hỗ trợ"
}

/** TAB 2: Hỗ trợ kỹ thuật & xử lý ticket sự cố động — kết nối API Staff Tickets & SLA (US-22, US-23) */
function StaffTicketPanel() {
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [filter, setFilter] = useState<"ALL" | TicketStatus>("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [shiftError, setShiftError] = useState<string | null>(null)

  // Modals state
  const [inspectionTarget, setInspectionTarget] =
    useState<InspectionTarget | null>(null)
  const [inspectionTicketId, setInspectionTicketId] = useState<
    string | number | null
  >(null)
  const [unlockTarget, setUnlockTarget] = useState<UnlockTicketInfo | null>(
    null
  )

  const fetchTickets = useCallback(async () => {
    try {
      if (!isMockMode()) {
        const res: any = await apiClient.get("/staff/tickets")
        setShiftError(null)
        if (Array.isArray(res)) {
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
            assignedStaffId: t.assignedStaffId,
            assignedStaffName: t.assignedStaffName,
            createdAt: t.createdAt,
          }))
          setTickets(mapped)
          return
        }
      }
      if (isMockMode()) {
        setTickets([])
      } else {
        setTickets([])
      }
      setShiftError(null)
    } catch (err: any) {
      const msg = getErrorMessage(err)
      const lower = msg.toLowerCase()
      const isShiftErr =
        err?.response?.status === 403 ||
        lower.includes("bắt đầu ca") ||
        lower.includes("ca được phân công") ||
        lower.includes("tiếp nhận ca") ||
        lower.includes("ca trực") ||
        lower.includes("chưa tiếp nhận ca") ||
        lower.includes("quyền") ||
        lower.includes("chưa được gắn cơ sở")

      if (isShiftErr) {
        setShiftError(msg)
        setTickets([])
        return
      }
      if (isMockMode()) {
        setTickets([])
      } else {
        setTickets([])
      }
      setShiftError(null)
    }
  }, [])

  useEffect(() => {
    fetchTickets()
    const handleShiftChange = () => {
      fetchTickets()
    }
    window.addEventListener("staff-shift-changed", handleShiftChange)
    return () => {
      window.removeEventListener("staff-shift-changed", handleShiftChange)
    }
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
      if (ticket.type === "EARLY_TERMINATION") {
        handleOpenInspection(ticket)
      }
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
        `Ticket #${ticket.ticketCode} đã xử lý hoàn tất.`
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

  // Đóng modal khi bấm Hủy bỏ hoặc dấu X - KHÔNG thanh lý HĐ, KHÔNG đóng ticket
  function handleCloseInspection() {
    setInspectionTarget(null)
    setInspectionTicketId(null)
  }

  // Chỉ khi nhân viên bấm "Chốt biên bản & Trả kho" thành công mới đóng ticket và cập nhật
  async function handleConfirmInspection() {
    if (inspectionTicketId !== null) {
      updateStatus(inspectionTicketId, "RESOLVED")
      if (!isMockMode() && typeof inspectionTicketId === "number") {
        try {
          await apiClient.post(`/staff/tickets/${inspectionTicketId}/resolve`, {
            note: "Biên bản nghiệm thu hoàn tất, hợp đồng đã thanh lý cọc.",
          })
        } catch {
          // ignore error if resolve already handled by checkout confirm
        }
      }
    }
    setInspectionTarget(null)
    setInspectionTicketId(null)
    fetchTickets()
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
        {/* Tiêu đề trang - Nằm trực tiếp trên nền ambient xanh mờ như CheckinPanel */}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <HeadphonesIcon className="size-5 text-blue-600 dark:text-blue-400" />
            <span>Tiếp nhận &amp; hỗ trợ xử lý sự cố</span>
          </h1>
        </div>

        {/* Cụm Tìm kiếm - Thẻ card kính mờ độc lập */}
        <div className="card-box flex flex-col justify-between gap-3 rounded-2xl border p-4 shadow-sm md:flex-row md:items-center">
          <div className="flex max-w-xl flex-1 space-x-2">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute top-2.5 left-3.5 size-4 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo Mã Ticket, Tên khách hàng, SĐT hoặc Mã kho..."
                className="inner-box w-full rounded-xl border border-slate-200/80 px-3.5 py-2 pl-9 text-xs font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700"
              />
            </div>
            <button
              type="button"
              className="shrink-0 cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-blue-700"
            >
              Tra cứu
            </button>
          </div>

          <StaffShiftBadge />
        </div>

        {/* Cụm Filter Chips theo trạng thái - Nằm trực tiếp trên nền như CheckinPanel */}
        <div role="group" aria-label="Lọc theo trạng thái ticket" className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => {
            const active = f.key === filter
            const count = f.key === "ALL" ? tickets.length : countOf(f.key)
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap shadow-2xs transition backdrop-blur-sm",
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

        {/* TICKET VIEW (LIST OR GRID) */}
        {shiftError ? (
          <StaffShiftRequiredCard onStarted={fetchTickets} />
        ) : filtered.length === 0 ? (
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
            <table className="w-full min-w-[1060px] text-center text-xs">
              <thead className="border-b bg-slate-100 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:bg-slate-800/80 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Mã &amp; Loại Ticket</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Vị trí Ô Kho</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Khách Hàng</th>
                  <th className="min-w-[220px] max-w-[380px] px-4 py-3.5 text-center whitespace-nowrap">Nội Dung Yêu Cầu</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Thời Gian / Lịch Hẹn</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Trạng Thái</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filtered.map((ticket) => {
                  const timeInfo = formatTicketTimeInfo(ticket)
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

                  return (
                    <tr
                      key={ticket.id}
                      className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/50"
                    >
                      {/* Cột 1: Mã & Loại Ticket */}
                      <td className="px-4 py-3.5 align-middle text-center whitespace-nowrap">
                        <div className="flex flex-col items-center justify-center">
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                            #{formatTicketCode(ticket.ticketCode, ticket.id)}
                          </span>
                          <div className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {isUnlock ? (
                              <KeyRoundIcon className="size-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                            ) : isEarlyTerm ? (
                              <ArchiveIcon className="size-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                            ) : (
                              <WrenchIcon className="size-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                            )}
                            <span>{getTicketTypeDisplayName(ticket)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Vị trí Ô Kho */}
                      <td className="px-4 py-3.5 align-middle text-center font-mono font-bold whitespace-nowrap text-slate-800 dark:text-slate-200">
                        {ticket.unitCode || "Cổng / Ra vào"}
                      </td>

                      {/* Cột 3: Khách Hàng */}
                      <td className="px-4 py-3.5 align-middle text-center whitespace-nowrap">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {ticket.customerName ||
                            (ticket.customerId
                              ? `Khách hàng #${ticket.customerId}`
                              : "—")}
                        </span>
                      </td>

                      {/* Cột 4: Nội dung yêu cầu (hiển thị đầy đủ, không ẩn) */}
                      <td className="min-w-[220px] max-w-[380px] px-4 py-3.5 align-middle text-center">
                        <p className="text-xs text-slate-600 italic dark:text-slate-300 leading-relaxed break-words">
                          {ticket.description
                            ? `"${ticket.description}"`
                            : "—"}
                        </p>
                      </td>

                      {/* Cột 5: Thời gian / Lịch hẹn */}
                      <td className="px-4 py-3.5 align-middle text-center whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-1 text-xs whitespace-nowrap",
                            timeInfo.className
                          )}
                        >
                          {timeInfo.text}
                        </span>
                      </td>

                      {/* Cột 6: Trạng thái */}
                      <td className="px-4 py-3.5 align-middle text-center whitespace-nowrap">
                        <div className="flex flex-col items-center">
                          <span
                            className={cn(
                              "inline-flex min-w-[104px] items-center justify-center rounded-full border px-3.5 py-1.5 text-xs font-bold whitespace-nowrap shadow-2xs",
                              ticket.status === "SUBMITTED"
                                ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                                : ticket.status === "IN_PROGRESS"
                                  ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                            )}
                          >
                            {ticket.status === "SUBMITTED"
                              ? "Chờ Tiếp Nhận"
                              : ticket.status === "IN_PROGRESS"
                                ? "Đang Xử Lý"
                                : "Đã Hoàn Tất"}
                          </span>
                        </div>
                      </td>

                      {/* Cột 7: Thao tác */}
                      <td className="px-4 py-3.5 align-middle text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                          {ticket.status === "SUBMITTED" && (
                            <button
                              type="button"
                              onClick={() => handleClaim(ticket)}
                              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-white shadow-xs transition hover:bg-blue-700"
                            >
                              <UserCheckIcon className="size-3.5" />
                              <span>Tiếp Nhận</span>
                            </button>
                          )}

                          {ticket.status === "IN_PROGRESS" && isUnlock && (
                            <button
                              type="button"
                              onClick={() => handleOpenUnlock(ticket)}
                              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold whitespace-nowrap text-white shadow-xs transition hover:bg-blue-700"
                            >
                              <IdCardIcon className="size-3.5" />
                              <span>Mở Khóa</span>
                            </button>
                          )}

                          {ticket.status === "IN_PROGRESS" && isEarlyTerm && (
                            <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                              {isReturnDue ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenInspection(ticket)}
                                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-extrabold whitespace-nowrap text-white shadow-xs transition hover:bg-emerald-700"
                                    title="Nghiệm thu ô kho & thanh lý cọc"
                                  >
                                    <ClipboardCheckIcon className="size-3.5" />
                                    <span>Xác nhận trả kho</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleResolveGeneral(ticket)}
                                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold whitespace-nowrap text-slate-700 shadow-xs transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                                    title="Đóng ticket hoàn tất"
                                  >
                                    <CircleCheckIcon className="size-3.5" />
                                    <span>Đóng ticket</span>
                                  </button>
                                </>
                              ) : (
                                <div className="flex items-center gap-2 whitespace-nowrap">
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
                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold whitespace-nowrap text-white shadow-xs transition hover:bg-blue-700"
                              >
                                <CircleCheckIcon className="size-3.5" />
                                <span>Đóng Ticket</span>
                              </button>
                            )}

                          {ticket.status === "RESOLVED" && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold whitespace-nowrap text-emerald-600 dark:text-emerald-400">
                              <CircleCheckIcon className="size-4" />
                              <span>Đã Đóng</span>
                            </span>
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
      </div>

      {/* INSPECTION MODAL */}
      <StaffInspectionModal
        target={inspectionTarget}
        onClose={handleCloseInspection}
        onConfirmed={handleConfirmInspection}
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
