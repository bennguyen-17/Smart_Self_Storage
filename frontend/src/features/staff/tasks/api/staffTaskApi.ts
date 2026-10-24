import apiClient from "@/lib/apiClient"
import { unwrapApiData } from "@/lib/api"

import type { StaffTask } from "../types"

/** GET /api/staff/tasks/mine — việc của Staff đang đăng nhập trong ca hiện tại. */
export async function listMyTasks(): Promise<StaffTask[]> {
  const body = await apiClient.get("/staff/tasks/mine")
  return unwrapApiData<StaffTask[]>(body) ?? []
}

/** PATCH /api/staff/tasks/{taskId}/done — Staff báo hoàn thành việc. */
export async function completeTask(taskId: number): Promise<void> {
  await apiClient.patch(`/staff/tasks/${taskId}/done`)
}
