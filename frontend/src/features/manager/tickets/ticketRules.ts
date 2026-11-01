// Luật hiển thị trang "Sự cố cơ sở" của Manager. Manager chỉ theo dõi: nhân viên trong ca tiếp nhận và giải quyết ticket.
// Hàm thuần, kiểm bằng bảng test trong ticketRules.test.ts.

import { formatDate } from "@/lib/format"

import type { ManagerTicketItem } from "./types"

type TicketLike = Pick<ManagerTicketItem, "status" | "type" | "desiredDate" | "assignedStaffId">

/** Ticket trả kho sớm có ngày hẹn sau hôm nay: nhân viên chỉ tiếp nhận được đúng ngày hẹn */
export function isWaitingForReturnDate(ticket: TicketLike, today: string): boolean {
  if (ticket.type !== "EARLY_TERMINATION" || !ticket.desiredDate) return false
  return ticket.desiredDate.slice(0, 10) > today
}

/**
 * Câu mô tả ticket đang ở bước nào, để Manager theo dõi mà không thao tác.
 * Sự cố (INCIDENT) được BE tự phân cho nhân viên trong ca ít việc nhất lúc khách gửi,
 * nhưng vẫn ở "Chờ tiếp nhận" cho tới khi nhân viên đó bấm tiếp nhận.
 */
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
