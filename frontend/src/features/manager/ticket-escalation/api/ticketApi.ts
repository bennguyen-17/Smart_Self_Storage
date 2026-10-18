import apiClient from "@/lib/apiClient"
import type { ManagerTicketItem } from "../types"

export async function listManagerTickets(facilityId?: number | null): Promise<ManagerTicketItem[]> {
  const url = facilityId ? `/manager/tickets?facilityId=${facilityId}` : "/manager/tickets"
  const res: any = await apiClient.get(url)
  return Array.isArray(res) ? res : []
}

export async function managerAcceptTicket(ticketId: number): Promise<ManagerTicketItem> {
  const res: any = await apiClient.post(`/manager/tickets/${ticketId}/accept`)
  return res
}

export async function managerResolveTicket(ticketId: number, note: string): Promise<ManagerTicketItem> {
  const res: any = await apiClient.post(`/manager/tickets/${ticketId}/resolve`, { note })
  return res
}
