import { describe, expect, test } from "vitest"

import { initials } from "./initials"

describe("initials: chữ viết tắt trên avatar", () => {
  test.each([
    { name: "Trần Văn Quản Lý", expected: "QL" },
    { name: "Trần Văn Quản Lý (HN-01)", expected: "QL" },
    { name: "Quản Trị Viên Hệ Thống", expected: "HT" },
    { name: "Mai", expected: "M" },
    { name: "  đỗ   minh  ", expected: "ĐM" },
    { name: "", expected: "?" },
    { name: "(HN-01)", expected: "?" },
  ])("'$name' → $expected", ({ name, expected }) => {
    expect(initials(name)).toBe(expected)
  })
})
