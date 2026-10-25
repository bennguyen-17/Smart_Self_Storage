import { describe, expect, test } from "vitest"

import {
  canChangeStorageType,
  canStartMaintenance,
  changeTypeBlockReason,
  climateCounterpartTypeId,
  initialUnitDraft,
  MAINTENANCE_NOTE_MAX,
  maintenanceNoteError,
  normalizeUnitStatus,
  planUnitEdit,
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
    { typeId: 4, expected: 7, note: "XL thường → XL điều hòa" },
    { typeId: 7, expected: 4, note: "XL điều hòa → XL thường" },
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

describe("maintenanceNoteError: ghi chú không bắt buộc, chỉ giới hạn độ dài nếu có", () => {
  test.each([
    { name: "trống", note: "", ok: true },
    { name: "khoảng trắng", note: "   \n ", ok: true },
    { name: "1 ký tự", note: "x", ok: true },
    { name: "câu bình thường", note: "Bóng đèn hỏng, cần thay", ok: true },
    { name: "đúng 500 ký tự", note: "a".repeat(MAINTENANCE_NOTE_MAX), ok: true },
    { name: "500 ký tự + khoảng trắng 2 đầu", note: `  ${"a".repeat(MAINTENANCE_NOTE_MAX)}  `, ok: true },
    { name: "501 ký tự", note: "a".repeat(MAINTENANCE_NOTE_MAX + 1), ok: false },
  ])("$name → hợp lệ: $ok", ({ note, ok }) => {
    expect(maintenanceNoteError(note) === null).toBe(ok)
  })
})

// typeId 2 = M thường ↔ 5 = M điều hòa; typeId 1 = S (không có bản điều hòa)
const M_TRONG = { status: "AVAILABLE", unitTypeId: 2, isClimate: false }
const M_DIEU_HOA = { status: "AVAILABLE", unitTypeId: 5, isClimate: true }
const S_TRONG = { status: "AVAILABLE", unitTypeId: 1, isClimate: false }
const M_DANG_THUE = { status: "OCCUPIED", unitTypeId: 2, isClimate: false }
const M_BAO_TRI = { status: "UNDER_MAINTENANCE", unitTypeId: 2, isClimate: false }

describe("initialUnitDraft: bản nháp ban đầu đúng hiện trạng", () => {
  test.each([
    { unit: M_TRONG, expected: { climate: false, maintenance: false, note: "" } },
    { unit: M_DIEU_HOA, expected: { climate: true, maintenance: false, note: "" } },
    { unit: M_BAO_TRI, expected: { climate: false, maintenance: true, note: "" } },
    { unit: { ...M_BAO_TRI, status: "MAINTENANCE" }, expected: { climate: false, maintenance: true, note: "" } },
  ])("$unit.status / điều hòa=$unit.isClimate", ({ unit, expected }) => {
    expect(initialUnitDraft(unit)).toEqual(expected)
  })
})

describe("planUnitEdit: Sửa ô kho → gọi API nào, theo thứ tự nào", () => {
  test.each([
    { name: "không đổi gì", unit: M_TRONG, draft: { climate: false, maintenance: false, note: "" }, ops: [], noteError: false },
    { name: "M thường → điều hòa", unit: M_TRONG, draft: { climate: true, maintenance: false, note: "" }, ops: [{ kind: "change-type", targetTypeId: 5 }], noteError: false },
    { name: "M điều hòa → thường", unit: M_DIEU_HOA, draft: { climate: false, maintenance: false, note: "" }, ops: [{ kind: "change-type", targetTypeId: 2 }], noteError: false },
    { name: "bảo trì không cần ghi chú", unit: M_TRONG, draft: { climate: false, maintenance: true, note: "" }, ops: [{ kind: "maintenance", note: "" }], noteError: false },
    { name: "bảo trì kèm ghi chú (cắt khoảng trắng)", unit: M_TRONG, draft: { climate: false, maintenance: true, note: "  Kẹt khóa " }, ops: [{ kind: "maintenance", note: "Kẹt khóa" }], noteError: false },
    {
      name: "đổi loại + bảo trì: đổi loại trước",
      unit: M_TRONG,
      draft: { climate: true, maintenance: true, note: "Vệ sinh" },
      ops: [{ kind: "change-type", targetTypeId: 5 }, { kind: "maintenance", note: "Vệ sinh" }],
      noteError: false,
    },
    { name: "ô đang thuê: bỏ qua mọi thay đổi", unit: M_DANG_THUE, draft: { climate: true, maintenance: true, note: "x" }, ops: [], noteError: false },
    { name: "Size S không có bản điều hòa", unit: S_TRONG, draft: { climate: true, maintenance: false, note: "" }, ops: [], noteError: false },
    { name: "ô đang bảo trì: không gửi lại lệnh bảo trì", unit: M_BAO_TRI, draft: { climate: false, maintenance: true, note: "" }, ops: [], noteError: false },
  ])("$name", ({ unit, draft, ops, noteError }) => {
    const plan = planUnitEdit(unit, draft)
    expect(plan.ops).toEqual(ops)
    expect(plan.noteError !== null).toBe(noteError)
  })
})
