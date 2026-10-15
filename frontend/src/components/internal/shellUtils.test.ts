import { describe, expect, test } from "vitest"

import { csvCell, toCsv } from "./csv"
import { matchesQuery, normalizeText } from "./textSearch"

describe("normalizeText / matchesQuery: tìm không phân biệt dấu và hoa thường", () => {
  test.each([
    { input: "Cầu Giấy", expected: "cau giay" },
    { input: "  ĐÀ NẴNG ", expected: "da nang" },
    { input: "Thủ Đức", expected: "thu duc" },
  ])("normalizeText('$input') → '$expected'", ({ input, expected }) => {
    expect(normalizeText(input)).toBe(expected)
  })

  test.each([
    { query: "", fields: ["HN-01"], ok: true },
    { query: "   ", fields: ["HN-01"], ok: true },
    { query: "cau giay", fields: ["SmartStorage Cầu Giấy", "HN-01"], ok: true },
    { query: "hn-01", fields: ["SmartStorage Cầu Giấy", "HN-01"], ok: true },
    { query: "1042", fields: [1042, null], ok: true },
    { query: "quận 7", fields: ["Quận 1"], ok: false },
    { query: "x", fields: [null, undefined], ok: false },
  ])("'$query' trong $fields → $ok", ({ query, fields, ok }) => {
    expect(matchesQuery(query, fields)).toBe(ok)
  })
})

describe("csvCell / toCsv: file mở đúng trong Excel", () => {
  test.each([
    { value: "HN-01", expected: "HN-01" },
    { value: 113500000, expected: "113500000" },
    { value: null, expected: "" },
    { value: "Số 391, Cầu Giấy", expected: '"Số 391, Cầu Giấy"' },
    { value: 'Kho "VIP"', expected: '"Kho ""VIP"""' },
    { value: "dòng 1\ndòng 2", expected: '"dòng 1\ndòng 2"' },
  ])("csvCell($value) → $expected", ({ value, expected }) => {
    expect(csvCell(value)).toBe(expected)
  })

  test("toCsv: dòng tiêu đề + các dòng, ngăn cách CRLF", () => {
    expect(toCsv(["Mã", "Tên"], [["HN-01", "Cầu Giấy"], ["HN-02", "Thanh Xuân, HN"]])).toBe(
      'Mã,Tên\r\nHN-01,Cầu Giấy\r\nHN-02,"Thanh Xuân, HN"'
    )
  })
})
