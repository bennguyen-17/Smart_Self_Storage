import { formatDate } from "@/lib/format"

import type { ManagerTicketItem } from "./types"

type TicketLike = Pick<ManagerTicketItem, "status" | "type" | "desiredDate" | "assignedStaffId">

// Ticket trả kho sớm chỉ tiếp nhận được từ ngày hẹn trở đi
export function isWaitingForReturnDate(ticket: TicketLike, today: string): boolean {
  if (ticket.type !== "EARLY_TERMINATION" || !ticket.desiredDate) return false
  return ticket.desiredDate.slice(0, 10) > today
}

// Sự cố INCIDENT được BE gán sẵn cho nhân viên trong ca nhưng vẫn giữ trạng thái chờ tiếp nhận
export function ticketProgress(ticket: TicketLike, today: string): string {
  switch (ticket.status) {
    case "RESOLVED":
      return "Nhân viên đã giải quyết xong"
    case "CANCELLED":
      return "Khách đã hủy yêu cầu"
    case "IN_PROGRESS":
      return "Nhân viên đang xử lý"
    default:
      if (isWaitingForReturnDate(ticket, today)) return `Chờ đến ngày hẹn ${formatDate(ticket.desiredDate!.slice(0, 10))}`
      if (ticket.assignedStaffId) return "Đã phân cho nhân viên trong ca, chờ tiếp nhận"
      return "Chờ nhân viên trong ca tiếp nhận"
  }
}

// Lọc theo cơ sở phía FE phòng trường hợp API trả dư dữ liệu cơ sở khác
export function ticketsOfFacility<T extends { facilityId?: number | null }>(tickets: readonly T[], facilityId: number | null): T[] {
  if (facilityId === null) return []
  return tickets.filter((t) => t.facilityId === facilityId)
}
