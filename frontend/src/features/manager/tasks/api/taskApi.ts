// API giao việc cho Staff (BE đã có: ManagerStaffTaskController).
// BE xác định cơ sở qua header X-Facility-Id (gắn ở đây, component không cần biết).

import { unwrapApiData } from "@/lib/api"
import apiClient from "@/lib/apiClient"
import { managerHeaders } from "@/features/manager/managerContext"
import type { ManagerContext } from "@/features/manager/units/types"

import type { CreateTaskRequest, StaffTask } from "../types"

/** GET /api/manager/tasks?date=YYYY-MM-DD: việc đã giao trong ngày của cơ sở */
export async function listTasks(ctx: ManagerContext, date: string): Promise<StaffTask[]> {
  return (
    unwrapApiData<StaffTask[]>(
      await apiClient.get("/manager/tasks", { params: { date }, headers: managerHeaders(ctx) })
    ) ?? []
  )
}

/** POST /api/manager/tasks: giao một việc cho Staff đang được xếp vào ca */
export async function createTask(ctx: ManagerContext, req: CreateTaskRequest): Promise<StaffTask> {
  return unwrapApiData<StaffTask>(await apiClient.post("/manager/tasks", req, { headers: managerHeaders(ctx) }))
}

/** PATCH /api/manager/tasks/{taskId}/cancel: chỉ hủy được việc đang chờ */
export async function cancelTask(ctx: ManagerContext, taskId: number): Promise<StaffTask> {
  return unwrapApiData<StaffTask>(
    await apiClient.patch(`/manager/tasks/${taskId}/cancel`, null, { headers: managerHeaders(ctx) })
  )
}
