import { unwrapApiData } from "@/lib/api"
import apiClient from "@/lib/apiClient"
import type { ManagerTicketItem } from "../types"

export async function listManagerTickets(facilityId?: number | null): Promise<ManagerTicketItem[]> {
  const url = facilityId ? `/manager/tickets?facilityId=${facilityId}` : "/manager/tickets"
  const list = unwrapApiData<ManagerTicketItem[]>(await apiClient.get(url))
  return Array.isArray(list) ? list : []
}

export async function managerAcceptTicket(ticketId: number): Promise<ManagerTicketItem> {
  return unwrapApiData<ManagerTicketItem>(await apiClient.post(`/manager/tickets/${ticketId}/accept`))
}

export async function managerResolveTicket(ticketId: number, note: string): Promise<ManagerTicketItem> {
  return unwrapApiData<ManagerTicketItem>(await apiClient.post(`/manager/tickets/${ticketId}/resolve`, { note }))
}
