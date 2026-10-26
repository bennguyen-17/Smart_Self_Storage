import { beforeEach, describe, expect, test, vi } from "vitest"

import type { ManagerContext } from "@/features/manager/units/types"

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn() }))
vi.mock("@/lib/apiClient", () => ({ default: http, isMockMode: () => false }))

const { cancelTask, createTask, listTasks } = await import("./taskApi")

const CTX: ManagerContext = { facilityId: 1, accountId: 3, fullName: "Trần Văn Quản", isDemo: false }
const HEADERS = { headers: { "X-Facility-Id": "1", "X-Account-Id": "3" } }

beforeEach(() => {
  http.get.mockReset().mockResolvedValue([])
  http.post.mockReset().mockResolvedValue({ taskId: 1 })
  http.patch.mockReset().mockResolvedValue({ taskId: 1, status: "CANCELED" })
})

describe("taskApi", () => {
  test("danh sách: GET /manager/tasks theo ngày, kèm header cơ sở", async () => {
    await listTasks(CTX, "2026-10-26")
    expect(http.get).toHaveBeenCalledWith("/manager/tasks", { params: { date: "2026-10-26" }, ...HEADERS })
  })

  test("BE trả null thì coi là danh sách rỗng", async () => {
    http.get.mockResolvedValue(null)
    await expect(listTasks(CTX, "2026-10-26")).resolves.toEqual([])
  })

  test("giao việc: POST body đúng như form đã chuyển", async () => {
    const body = { taskType: "MAINTENANCE" as const, employeeId: 8, date: "2026-10-26", shiftId: 1, unitCode: "HN01-G-XL05" }
    await createTask(CTX, body)
    expect(http.post).toHaveBeenCalledWith("/manager/tasks", body, HEADERS)
  })

  test("hủy: PATCH /manager/tasks/{id}/cancel", async () => {
    await cancelTask(CTX, 12)
    expect(http.patch).toHaveBeenCalledWith("/manager/tasks/12/cancel", null, HEADERS)
  })

  test("tài khoản chưa gắn cơ sở thì báo lỗi rõ, không gọi BE", async () => {
    await expect(listTasks({ ...CTX, facilityId: null }, "2026-10-26")).rejects.toThrow(/chưa được gắn cơ sở/)
    expect(http.get).not.toHaveBeenCalled()
  })
})
