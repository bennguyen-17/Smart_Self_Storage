import apiClient from "@/lib/apiClient"

/**
 * POST /api/staff/shifts/current/start — Staff bắt đầu ca hiện tại.
 * BE chỉ cho bắt đầu khi đang trong giờ ca được xếp và đổi StaffShift sang ATTENDED.
 */
export async function startCurrentShift(): Promise<void> {
  await apiClient.post("/staff/shifts/current/start")
}

/**
 * POST /api/staff/shifts/current/end — Staff kết thúc ca làm việc / bàn giao ca.
 * Chuyển trạng thái StaffShift sang COMPLETED.
 */
export async function endCurrentShift(): Promise<void> {
  await apiClient.post("/staff/shifts/current/end")
}
