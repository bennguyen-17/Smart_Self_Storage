import { beforeEach, describe, expect, test, vi } from "vitest"

// Giả lập apiClient để kiểm FE gửi đúng tham số lọc ngày mà không cần BE
const http = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock("@/lib/apiClient", () => ({ default: http, isMockMode: () => false }))

const { getManagerDashboard } = await import("./reportApi")

const ctx = { facilityId: 1, accountId: 3, fullName: "Trần Văn Quản Lý", isDemo: false }

beforeEach(() => {
  http.get.mockReset().mockResolvedValue({ facilityCode: "HN-01" })
})

describe("reportApi: lọc báo cáo theo khoảng thời gian", () => {
  test.each([
    { name: "từ trước đến nay → không gửi from/to", range: undefined, params: {} },
    { name: "khoảng rỗng → không gửi", range: { from: "", to: "" }, params: {} },
    { name: "đủ 2 đầu", range: { from: "2026-10-01", to: "2026-10-23" }, params: { from: "2026-10-01", to: "2026-10-23" } },
    { name: "chỉ có ngày bắt đầu", range: { from: "2026-10-01", to: "" }, params: { from: "2026-10-01" } },
  ])("$name", async ({ range, params }) => {
    await getManagerDashboard(ctx, range)
    expect(http.get).toHaveBeenCalledWith("/manager/dashboard/overview", {
      params,
      headers: { "X-Facility-Id": "1", "X-Account-Id": "3" },
    })
  })
})
