import { describe, expect, test } from "vitest"

import {
  canChangeStorageType,
  canStartMaintenance,
  changeTypeBlockReason,
  climateCounterpartTypeId,
  normalizeUnitStatus,
} from "./unitRules"

describe("normalizeUnitStatus: đọc được cả bộ trạng thái mới và cũ của DB", () => {
  test.each([
    { input: "AVAILABLE", expected: "AVAILABLE" },
    { input: "HOLD", expected: "HOLD" },
    { input: "RESERVED", expected: "RESERVED" },
    { input: "OCCUPIED", expected: "OCCUPIED" },
    { input: "UNDER_MAINTENANCE", expected: "UNDER_MAINTENANCE" },
    { input: "RENTED", expected: "OCCUPIED" },
    { input: "MAINTENANCE", expected: "UNDER_MAINTENANCE" },
    { input: "OVERDUE", expected: "OCCUPIED" },
    { input: " available ", expected: "AVAILABLE" },
    { input: "BROKEN", expected: null },
    { input: "", expected: null },
    { input: null, expected: null },
  ])("$input → $expected", ({ input, expected }) => {
    expect(normalizeUnitStatus(input)).toBe(expected)
  })
})

describe("climateCounterpartTypeId: đổi Thường ↔ Điều hòa cùng size", () => {
  test.each([
    { typeId: 1, expected: null, note: "S chưa có bản điều hòa" },
    { typeId: 2, expected: 5, note: "M thường → M điều hòa" },
    { typeId: 3, expected: 6, note: "L thường → L điều hòa" },
    { typeId: 4, expected: null, note: "XL chưa có bản điều hòa" },
    { typeId: 5, expected: 2, note: "M điều hòa → M thường" },
    { typeId: 6, expected: 3, note: "L điều hòa → L thường" },
    { typeId: null, expected: null, note: "thiếu loại kho" },
  ])("$note", ({ typeId, expected }) => {
    expect(climateCounterpartTypeId(typeId)).toBe(expected)
  })
})

describe("canChangeStorageType: chỉ ô trống và có loại tương ứng mới được đổi", () => {
  test.each([
    { status: "AVAILABLE", typeId: 2, expected: true },
    { status: "AVAILABLE", typeId: 6, expected: true },
    { status: "AVAILABLE", typeId: 1, expected: false },
    { status: "HOLD", typeId: 2, expected: false },
    { status: "RESERVED", typeId: 2, expected: false },
    { status: "OCCUPIED", typeId: 2, expected: false },
    { status: "RENTED", typeId: 2, expected: false },
    { status: "UNDER_MAINTENANCE", typeId: 2, expected: false },
  ])("$status / loại $typeId → $expected", ({ status, typeId, expected }) => {
    expect(canChangeStorageType(status, typeId)).toBe(expected)
  })

  test("lý do bị khóa được giải thích rõ", () => {
    expect(changeTypeBlockReason("OCCUPIED", 2)).toMatch(/ô đang trống/)
    expect(changeTypeBlockReason("AVAILABLE", 1)).toMatch(/chưa có phiên bản kho điều hòa/)
    expect(changeTypeBlockReason("AVAILABLE", 2)).toBeNull()
  })
})

describe("canStartMaintenance: ô đang có khách thì không được đưa vào bảo trì", () => {
  test.each([
    { status: "AVAILABLE", expected: true },
    { status: "HOLD", expected: false },
    { status: "RESERVED", expected: false },
    { status: "OCCUPIED", expected: false },
    { status: "RENTED", expected: false },
    { status: "UNDER_MAINTENANCE", expected: false },
    { status: "MAINTENANCE", expected: false },
  ])("$status → $expected", ({ status, expected }) => {
    expect(canStartMaintenance(status)).toBe(expected)
  })
})
