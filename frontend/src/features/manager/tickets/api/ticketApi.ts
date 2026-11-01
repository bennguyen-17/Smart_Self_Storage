import { unwrapApiData } from "@/lib/api"
import apiClient from "@/lib/apiClient"
import type { ManagerTicketItem } from "../types"

/** GET /api/manager/tickets: ticket của cơ sở (Manager chỉ xem; nhân viên trong ca tiếp nhận và giải quyết ở /staff) */
export async function listManagerTickets(facilityId?: number | null): Promise<ManagerTicketItem[]> {
  const url = facilityId ? `/manager/tickets?facilityId=${facilityId}` : "/manager/tickets"
  const list = unwrapApiData<ManagerTicketItem[]>(await apiClient.get(url))
  return Array.isArray(list) ? list : []
}
