import { describe, expect, test } from "vitest"

import { pageWindow, paginate } from "./pagination"

const items = Array.from({ length: 45 }, (_, i) => i + 1)

describe("paginate: cắt đúng một trang, trang ngoài khoảng thì kẹp lại", () => {
  test.each([
    {
      name: "trang 1",
      page: 1,
      size: 20,
      first: 1,
      last: 20,
      current: 1,
      totalPages: 3,
      from: 1,
      to: 20,
    },
    {
      name: "trang giữa",
      page: 2,
      size: 20,
      first: 21,
      last: 40,
      current: 2,
      totalPages: 3,
      from: 21,
      to: 40,
    },
    {
      name: "trang cuối thiếu dòng",
      page: 3,
      size: 20,
      first: 41,
      last: 45,
      current: 3,
      totalPages: 3,
      from: 41,
      to: 45,
    },
    {
      name: "vượt quá → trang cuối (sau khi lọc bớt)",
      page: 9,
      size: 20,
      first: 41,
      last: 45,
      current: 3,
      totalPages: 3,
      from: 41,
      to: 45,
    },
    {
      name: "trang 0 → trang 1",
      page: 0,
      size: 20,
      first: 1,
      last: 20,
      current: 1,
      totalPages: 3,
      from: 1,
      to: 20,
    },
    {
      name: "đủ chẵn 1 trang",
      page: 1,
      size: 50,
      first: 1,
      last: 45,
      current: 1,
      totalPages: 1,
      from: 1,
      to: 45,
    },
  ])("$name", ({ page, size, first, last, current, totalPages, from, to }) => {
    const slice = paginate(items, page, size)
    expect(slice.rows[0]).toBe(first)
    expect(slice.rows.at(-1)).toBe(last)
    expect(slice).toMatchObject({ page: current, totalPages, from, to })
  })

  test("danh sách rỗng → 1 trang, không có dòng, from = to = 0", () => {
    expect(paginate([], 3, 20)).toEqual({
      rows: [],
      page: 1,
      totalPages: 1,
      from: 0,
      to: 0,
    })
  })
})

describe("pageWindow: trang đầu, trang cuối, 1 trang mỗi bên, chỗ trống là …", () => {
  test.each([
    { page: 1, total: 1, expected: [1] },
    { page: 1, total: 3, expected: [1, 2, 3] },
    { page: 1, total: 20, expected: [1, 2, "…", 20] },
    { page: 5, total: 20, expected: [1, "…", 4, 5, 6, "…", 20] },
    { page: 3, total: 20, expected: [1, 2, 3, 4, "…", 20] },
    { page: 20, total: 20, expected: [1, "…", 19, 20] },
  ])("trang $page / $total → $expected", ({ page, total, expected }) => {
    expect(pageWindow(page, total)).toEqual(expected)
  })
})
