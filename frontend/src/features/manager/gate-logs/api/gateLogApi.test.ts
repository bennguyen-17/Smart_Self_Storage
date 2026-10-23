import { beforeEach, describe, expect, test, vi } from "vitest"

// Giả lập apiClient để kiểm FE gọi đúng API mà không cần BE
const env = vi.hoisted(() => ({ mockMode: false }))
const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))
vi.mock("@/lib/apiClient", () => ({ default: http, isMockMode: () => env.mockMode }))

const { listManualGateOpenLogs, MANUAL_GATE_OPEN_LOGS_PATH } = await import("./gateLogApi")

beforeEach(() => {
  env.mockMode = false
  http.get.mockReset().mockResolvedValue([])
})

describe("gateLogApi: nhật ký mở cổng thủ công (chỉ đọc)", () => {
  test("GET đúng path hiện có của BE", async () => {
    await listManualGateOpenLogs()
    expect(http.get).toHaveBeenCalledWith(MANUAL_GATE_OPEN_LOGS_PATH)
    expect(MANUAL_GATE_OPEN_LOGS_PATH).toBe("/manager/audit-logs/manual-gate-open")
  })

  test("BE trả null → coi như danh sách rỗng", async () => {
    http.get.mockResolvedValue(null)
    await expect(listManualGateOpenLogs()).resolves.toEqual([])
  })

  test("chế độ mock: không gọi mạng, có dữ liệu mẫu", async () => {
    env.mockMode = true
    const logs = await listManualGateOpenLogs()
    expect(logs.length).toBeGreaterThan(0)
    // Dữ liệu mẫu có cả lượt nhập mã PIN và lượt mở bằng Thẻ Master
    expect(logs.some((l) => l.action.toUpperCase().includes("MANUAL"))).toBe(true)
    expect(logs.some((l) => !l.action.toUpperCase().includes("MANUAL"))).toBe(true)
    expect(http.get).not.toHaveBeenCalled()
  })
})
