import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import { listFacilityLogs } from "@/features/manager/activity/api/activityApi"
import { listManualGateOpenLogs } from "@/features/manager/gate-logs/api/gateLogApi"
import { listRefunds } from "@/features/manager/refunds/api/refundApi"
import { listManagerTickets } from "@/features/manager/tickets/api/ticketApi"

import { markSeen, readLastSeen } from "./unreadRules"
import { UNREAD_POLL_MS, useUnreadCounts } from "./useUnreadCounts"

vi.mock("@/features/manager/managerContext", () => ({
  getManagerContext: () => ({ facilityId: 1, accountId: 3, fullName: "Quản lý", isDemo: false }),
}))
vi.mock("@/features/manager/activity/api/activityApi", () => ({ listFacilityLogs: vi.fn() }))
vi.mock("@/features/manager/gate-logs/api/gateLogApi", () => ({ listManualGateOpenLogs: vi.fn() }))
vi.mock("@/features/manager/refunds/api/refundApi", () => ({ listRefunds: vi.fn() }))
vi.mock("@/features/manager/tickets/api/ticketApi", () => ({ listManagerTickets: vi.fn() }))

const SEEN = Date.parse("2026-11-01T10:00:00")
const AFTER = "2026-11-01T10:05:00"
const BEFORE = "2026-11-01T09:00:00"

const log = (actorRole: string, createdAt: string) => ({ actorRole, createdAt }) as never

beforeEach(() => {
  vi.mocked(listRefunds).mockResolvedValue([{ issuedAt: AFTER }, { issuedAt: BEFORE }] as never)
  vi.mocked(listManagerTickets).mockResolvedValue([{ createdAt: AFTER }, { createdAt: AFTER }, { createdAt: AFTER }] as never)
  vi.mocked(listManualGateOpenLogs).mockResolvedValue([{ openedAt: AFTER, createdAt: AFTER }] as never)
  // 4 thao tác mới của nhân viên; thao tác của Manager và của khách không tính
  vi.mocked(listFacilityLogs).mockResolvedValue([
    log("STAFF", AFTER), log("STAFF", AFTER), log("STAFF", AFTER), log("STAFF", AFTER),
    log("STAFF", BEFORE), log("MANAGER", AFTER), log("CUSTOMER", AFTER),
  ])
  for (const tab of ["refunds", "activity", "tickets", "gate-logs"] as const) markSeen(3, tab, SEEN)
})
afterEach(() => {
  localStorage.clear()
  vi.useRealTimers()
})

describe("useUnreadCounts: chấm đếm mục mới trên thanh điều hướng Manager", () => {
  test("đếm mục sau lần cuối xem của từng trang; trang đang mở luôn 0", async () => {
    const { result } = renderHook(() => useUnreadCounts("units"))
    await waitFor(() => expect(result.current).toEqual({ refunds: 1, activity: 4, tickets: 3, "gate-logs": 1 }))
  })

  test("mở trang Sự cố → chấm của trang đó về 0 và mốc đã xem được cập nhật", async () => {
    const { result, rerender } = renderHook(({ tab }) => useUnreadCounts(tab), { initialProps: { tab: "units" } })
    await waitFor(() => expect(result.current.tickets).toBe(3))
    rerender({ tab: "tickets" })
    expect(result.current.tickets).toBe(0)
    expect(readLastSeen(3, "tickets")).toBeGreaterThan(SEEN)
    // Rời trang Sự cố: ticket cũ đã xem, không hiện lại
    rerender({ tab: "units" })
    await waitFor(() => expect(result.current.tickets).toBe(0))
    expect(result.current.refunds).toBe(1)
  })

  test("lần đầu dùng (chưa có mốc): không hiện số, lấy bây giờ làm mốc", async () => {
    localStorage.clear()
    const { result } = renderHook(() => useUnreadCounts("units"))
    await waitFor(() => expect(result.current).toEqual({ refunds: 0, activity: 0, tickets: 0, "gate-logs": 0 }))
    expect(readLastSeen(3, "refunds")).not.toBeNull()
  })

  test("một API lỗi thì các trang khác vẫn đếm bình thường", async () => {
    vi.mocked(listRefunds).mockRejectedValue(new Error("403"))
    const { result } = renderHook(() => useUnreadCounts("units"))
    await waitFor(() => expect(result.current.tickets).toBe(3))
    expect(result.current.refunds).toBeUndefined()
  })

  test("quay lại tab Manager → kiểm tra ngay, không đợi 30 giây", async () => {
    const { result } = renderHook(() => useUnreadCounts("units"))
    await waitFor(() => expect(result.current.tickets).toBe(3))
    vi.mocked(listManagerTickets).mockResolvedValue(Array.from({ length: 6 }, () => ({ createdAt: AFTER })) as never)
    act(() => {
      window.dispatchEvent(new Event("focus"))
    })
    await waitFor(() => expect(result.current.tickets).toBe(6))
  })

  test("tự kiểm tra lại sau 30 giây: ticket mới đến thì số tăng", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const { result } = renderHook(() => useUnreadCounts("units"))
    await waitFor(() => expect(result.current.tickets).toBe(3))
    vi.mocked(listManagerTickets).mockResolvedValue(Array.from({ length: 5 }, () => ({ createdAt: AFTER })) as never)
    await act(() => vi.advanceTimersByTimeAsync(UNREAD_POLL_MS))
    await waitFor(() => expect(result.current.tickets).toBe(5))
  })
})
