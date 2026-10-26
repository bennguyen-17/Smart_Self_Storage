import { describe, expect, test } from "vitest"

import { customerStatus, filterCustomers, minutesUntilUnlock } from "./customerRules"
import type { AdminCustomer } from "./types"

const c = (over: Partial<AdminCustomer>): AdminCustomer => ({
  accountId: 1,
  fullName: "Nguyễn Thành Long",
  phone: "0912345678",
  email: "long@example.com",
  status: "ACTIVE",
  lockUntil: null,
  ...over,
})

const LIST = [
  c({ accountId: 1 }),
  c({
    accountId: 2,
    fullName: "Trần Thu Hà",
    phone: "0987654321",
    email: "ha@example.com",
    status: "LOCKED",
    lockUntil: "2026-10-26T09:15:00",
  }),
  c({ accountId: 3, fullName: "An Bình", phone: "0900111222", status: "UNVERIFIED" }),
]

describe("filterCustomers", () => {
  test("người đang bị khóa lên đầu, còn lại theo tên", () => {
    expect(filterCustomers(LIST, { query: "", status: "ALL" }).map((x) => x.accountId)).toEqual([2, 3, 1])
  })

  test.each([
    [{ query: "", status: "LOCKED" as const }, [2]],
    [{ query: "", status: "ACTIVE" as const }, [1]],
    [{ query: "", status: "OTHER" as const }, [3]],
    [{ query: "thu ha", status: "ALL" as const }, [2]],
    [{ query: "0900111", status: "ALL" as const }, [3]],
    [{ query: "long@", status: "LOCKED" as const }, []],
  ])("%o → %o", (filter, ids) => {
    expect(filterCustomers(LIST, filter).map((x) => x.accountId)).toEqual(ids)
  })
})

describe("customerStatus", () => {
  test.each([
    ["ACTIVE", "Đang hoạt động", "green"],
    ["locked", "Đang bị khóa", "red"],
    ["UNVERIFIED", "Chưa xác thực email", "amber"],
    ["LẠ", "LẠ", "slate"],
  ])("%s → %s", (raw, label, tone) => {
    expect(customerStatus(raw)).toEqual({ label, tone })
  })
})

describe("minutesUntilUnlock", () => {
  const now = new Date("2026-10-26T09:00:00")
  test.each([
    [null, 0],
    ["2026-10-26T09:15:00", 15],
    ["2026-10-26T09:00:30", 1],
    ["2026-10-26T08:59:00", 0],
  ])("khóa đến %s → còn %s phút", (until, minutes) => {
    expect(minutesUntilUnlock(until, now)).toBe(minutes)
  })
})
