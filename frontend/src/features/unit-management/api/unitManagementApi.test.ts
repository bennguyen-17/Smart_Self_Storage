import { beforeEach, describe, expect, test, vi } from "vitest"

import type { ManagerContext } from "../types"

// Giả lập apiClient để kiểm FE gọi đúng method, path, header, body mà không cần BE
const env = vi.hoisted(() => ({ mockMode: false }))
const http = vi.hoisted(() => ({
  get: vi.fn(),
  patch: vi.fn(),
  post: vi.fn(),
}))
vi.mock("@/lib/apiClient", () => ({ default: http, isMockMode: () => env.mockMode }))

const { changeUnitType, getManagerUnits, MissingFacilityError, startMaintenance } = await import(
  "./unitManagementApi"
)

const CTX: ManagerContext = { facilityId: 1, accountId: 3, fullName: "Trần Văn Quản Lý", isDemo: false }
const NO_FACILITY: ManagerContext = { ...CTX, facilityId: null }

beforeEach(() => {
  env.mockMode = false
  http.get.mockReset().mockResolvedValue([])
  http.patch.mockReset().mockResolvedValue({ unitCode: "HN01-F1-M01" })
  http.post.mockReset().mockResolvedValue({ unitCode: "HN01-F1-M01" })
})

describe("unitManagementApi: gọi đúng API BE của Manager", () => {
  test("lấy danh sách ô: GET /manager/units kèm header cơ sở + người thao tác và bộ lọc", async () => {
    await getManagerUnits(CTX, { floorId: 2, status: "AVAILABLE" })
    expect(http.get).toHaveBeenCalledWith("/manager/units", {
      params: { floorId: 2, status: "AVAILABLE" },
      headers: { "X-Facility-Id": "1", "X-Account-Id": "3" },
    })
  })

  test("đổi loại kho: PATCH /manager/units/{mã}/type với body { unitTypeId }", async () => {
    await changeUnitType(CTX, "HN01-F1-M01", 5)
    expect(http.patch).toHaveBeenCalledWith(
      "/manager/units/HN01-F1-M01/type",
      { unitTypeId: 5 },
      { headers: { "X-Facility-Id": "1", "X-Account-Id": "3" } }
    )
  })

  test("đưa vào bảo trì: POST /manager/units/{mã}/maintenance kèm ghi chú đã cắt khoảng trắng", async () => {
    await startMaintenance(CTX, "HN01-F1-M01", "  Rò nước trần  ")
    expect(http.post).toHaveBeenCalledWith("/manager/units/HN01-F1-M01/maintenance", { note: "Rò nước trần" }, {
      headers: { "X-Facility-Id": "1", "X-Account-Id": "3" },
    })
  })

  test("thiếu cơ sở của quản lý → báo lỗi rõ ràng, KHÔNG gọi BE với cơ sở đoán bừa", async () => {
    await expect(getManagerUnits(NO_FACILITY, {})).rejects.toBeInstanceOf(MissingFacilityError)
    await expect(startMaintenance(NO_FACILITY, "X", "ghi chú")).rejects.toBeInstanceOf(MissingFacilityError)
    expect(http.get).not.toHaveBeenCalled()
    expect(http.post).not.toHaveBeenCalled()
  })

  test("chế độ mock: không gọi mạng", async () => {
    env.mockMode = true
    const units = await getManagerUnits(CTX, {})
    expect(units.length).toBeGreaterThan(0)
    expect(http.get).not.toHaveBeenCalled()
  })
})
