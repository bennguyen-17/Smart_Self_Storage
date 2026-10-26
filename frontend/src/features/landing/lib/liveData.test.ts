import { describe, expect, test } from "vitest"

import type { PublicFacilityRow, PublicPrice } from "../api/landingApi"
import { FACILITIES } from "../content/facilities"
import { UNITS } from "../content/units"
import { availabilityLabel, facilityKey, mergeFacilities, mergeUnitPrices } from "./liveData"

const price = (size: string, monthly: number, surcharge = 0, status = "ACTIVE"): PublicPrice => ({
  unitTypeId: 1,
  size,
  dailyPrice: monthly / 20,
  monthlyPrice: monthly,
  depositAmount: monthly / 2,
  climateSurchargePercent: surcharge,
  status,
})

describe("mergeUnitPrices: giá lấy từ bảng giá BOM", () => {
  test("cỡ có giá thật thì thay; giữ ảnh, mô tả, sức chứa viết sẵn", () => {
    const merged = mergeUnitPrices(UNITS, [price("S", 700_000), price("m", 1_300_000)])
    const s = merged.find((u) => u.size === "S")!
    expect(s).toMatchObject({ pricePerMonth: 700_000, pricePerDay: 35_000, deposit: 350_000, name: "Tủ cá nhân" })
    expect(merged.find((u) => u.size === "M")!.pricePerMonth).toBe(1_300_000)
    // Cỡ BE không trả thì giữ giá viết sẵn
    expect(merged.find((u) => u.size === "XL")!.pricePerMonth).toBe(4_000_000)
  })

  test.each([
    ["dòng kho điều hòa (có phụ phí)", price("L", 9_999_000, 20)],
    ["dòng giá đã ngưng", price("L", 9_999_000, 0, "INACTIVE")],
  ])("bỏ qua %s", (_, row) => {
    expect(mergeUnitPrices(UNITS, [row]).find((u) => u.size === "L")!.pricePerMonth).toBe(2_400_000)
  })

  test("chưa tải được giá thì giữ nguyên bảng viết sẵn", () => {
    expect(mergeUnitPrices(UNITS, undefined)).toEqual(UNITS)
  })
})

describe("mergeFacilities: cơ sở và số ô trống", () => {
  const rows: PublicFacilityRow[] = [
    { facilityId: 1, facilityCode: "HN-01", facilityName: "SmartStorage Cầu Giấy (mới)", address: "391 Cầu Giấy", status: "ACTIVE" },
    { facilityId: 2, facilityCode: "HN-02", facilityName: null, address: null, status: "INACTIVE" },
  ]

  test("khớp mã có hoặc không gạch nối; tên, địa chỉ, trạng thái từ BE; điểm nổi bật giữ nguyên", () => {
    const merged = mergeFacilities(FACILITIES, rows, { "HN-01": 12, "HN-02": 0 })
    const hn01 = merged.find((f) => f.code === "HN01")!
    expect(hn01).toMatchObject({ name: "SmartStorage Cầu Giấy (mới)", address: "391 Cầu Giấy", available: 12, paused: false })
    expect(hn01.highlights.length).toBeGreaterThan(0)
    const hn02 = merged.find((f) => f.code === "HN02")!
    expect(hn02).toMatchObject({ name: "SmartStorage Thanh Xuân", paused: true, available: 0 })
    // Cơ sở BE không trả về: vẫn hiện, chưa biết số ô
    expect(merged.find((f) => f.code === "CT01")).toMatchObject({ available: null, paused: false })
    expect(merged).toHaveLength(FACILITIES.length)
  })

  test.each([
    ["HN-01", "HN01"],
    ["hcm-02", "HCM02"],
  ])("facilityKey(%s) = %s", (raw, key) => {
    expect(facilityKey(raw)).toBe(key)
  })
})

describe("availabilityLabel", () => {
  test.each([
    [{ available: 5, paused: false }, "Còn 5 ô trống"],
    [{ available: 0, paused: false }, "Đang hết ô trống"],
    [{ available: 5, paused: true }, "Tạm ngưng nhận khách"],
    [{ available: null, paused: false }, null],
  ])("%o → %s", (f, label) => {
    expect(availabilityLabel(f)).toBe(label)
  })
})
