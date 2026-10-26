import { beforeEach, describe, expect, test, vi } from "vitest"

const http = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock("@/lib/apiClient", () => ({ default: http, isMockMode: () => false }))

const { availabilityByFacility, countAvailableUnits, getPublicFacilities, getPublicPrices } = await import("./landingApi")

beforeEach(() => {
  http.get.mockReset().mockResolvedValue([])
})

describe("landingApi: chỉ gọi API công khai", () => {
  test("bảng giá và cơ sở", async () => {
    await getPublicPrices()
    await getPublicFacilities()
    expect(http.get).toHaveBeenCalledWith("/prices")
    expect(http.get).toHaveBeenCalledWith("/facilities")
  })

  test("đếm ô trống theo cơ sở", async () => {
    http.get.mockResolvedValue([{ unitCode: "A" }, { unitCode: "B" }])
    await expect(countAvailableUnits(3)).resolves.toBe(2)
    expect(http.get).toHaveBeenCalledWith("/units/filter", { params: { facilityId: 3, status: "AVAILABLE" } })
  })

  test("một cơ sở lỗi thì bỏ qua cơ sở đó, các cơ sở khác vẫn có số", async () => {
    http.get.mockImplementation((_url: string, opts: { params: { facilityId: number } }) =>
      opts.params.facilityId === 2 ? Promise.reject(new Error("Lỗi mạng")) : Promise.resolve([{}, {}, {}])
    )
    const rows = [
      { facilityId: 1, facilityCode: "HN-01", facilityName: null, address: null, status: "ACTIVE" },
      { facilityId: 2, facilityCode: "HN-02", facilityName: null, address: null, status: "ACTIVE" },
    ]
    await expect(availabilityByFacility(rows)).resolves.toEqual({ "HN-01": 3 })
  })
})
