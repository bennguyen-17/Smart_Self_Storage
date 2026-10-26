export type ManagerTicketStatus = "ALL" | "ESCALATED" | "SUBMITTED" | "IN_PROGRESS" | "RESOLVED"

export interface ManagerTicketItem {
  id: number
  ticketCode: string
  type: string
  status: "ESCALATED" | "SUBMITTED" | "IN_PROGRESS" | "RESOLVED"
  customerId?: number
  customerName?: string
  customerPhone?: string
  facilityId?: number
  facilityName?: string
  unitCode?: string
  contractId?: number
  title?: string
  description?: string
  desiredDate?: string | null
  assignedStaffId?: number | null
  assignedStaffName?: string | null
  slaDeadline?: string | null
  isSlaBreached?: boolean
  identityVerified?: boolean
  resolutionNote?: string | null
  createdAt?: string
  resolvedAt?: string | null
}
