import { beforeEach, describe, expect, test, vi } from "vitest"

import type { ManagerContext } from "@/features/manager/units/types"

const env = vi.hoisted(() => ({ mockMode: false }))
const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock("@/lib/apiClient", () => ({ default: http, isMockMode: () => env.mockMode }))

const { listFacilityContracts, markForfeitProcessed } = await import("./contractApi")
const { resetFacilityContractsMock } = await import("./contractApi.mock")

const CTX: ManagerContext = { facilityId: 1, accountId: 3, fullName: "Trần Văn Quản Lý", isDemo: false }

beforeEach(() => {
  env.mockMode = false
  http.get.mockReset().mockResolvedValue([])
  http.post.mockReset().mockResolvedValue({ success: true })
  resetFacilityContractsMock()
})

describe("contractApi", () => {
  test("danh sách: GET /manager/contracts kèm header cơ sở", async () => {
    await listFacilityContracts(CTX)
    expect(http.get).toHaveBeenCalledWith("/manager/contracts", { headers: { "X-Facility-Id": "1", "X-Account-Id": "3" } })
  })

})

describe("contractApi: gộp cách viết trạng thái hủy", () => {
  test("BE trả CANCELLED → giao diện nhận CANCELED", async () => {
    http.get.mockResolvedValue([{ contractId: 1, status: "CANCELLED", fees: [] }])
    const [c] = await listFacilityContracts(CTX)
    expect(c.status).toBe("CANCELLED")
  })
})

describe("contractApi: xác nhận đã xử lý tài sản", () => {
  test("POST đúng đường dẫn, ghi chú đã bỏ khoảng trắng thừa, kèm header cơ sở", async () => {
    await markForfeitProcessed(CTX, 203, "  Đã cắt khóa, có camera  ")
    expect(http.post).toHaveBeenCalledWith(
      "/manager/contracts/203/forfeit-processed",
      { note: "Đã cắt khóa, có camera" },
      { headers: { "X-Facility-Id": "1", "X-Account-Id": "3" } }
    )
  })
})
