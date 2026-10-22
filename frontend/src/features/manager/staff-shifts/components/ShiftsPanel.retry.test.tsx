import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, test, vi } from "vitest"

import ShiftsPanel from "./ShiftsPanel"

const api = vi.hoisted(() => ({
  listFacilityStaff: vi.fn(),
  getDaySchedule: vi.fn(),
  saveShift: vi.fn(),
}))
vi.mock("../api/shiftApi", () => api)
vi.mock("@/lib/apiClient", () => ({ default: {}, isMockMode: () => false }))
vi.mock("@/features/manager/unit-management/managerContext", () => ({
  getManagerContext: () => ({ facilityId: 1, accountId: 3, fullName: "Trần Văn Quản Lý", isDemo: false }),
}))

describe("ShiftsPanel: lỗi tải nhân viên rồi bấm Thử lại", () => {
  test("Thử lại gọi lại cả API nhân viên, trang hiện lại bình thường", async () => {
    api.listFacilityStaff
      .mockRejectedValueOnce(new Error("Không thể kết nối đến máy chủ Backend."))
      .mockResolvedValue([{ employeeId: 3, fullName: "Nguyễn Văn Nhân Viên 1", phone: null, facilityId: 1, status: "ACTIVE" }])
    api.getDaySchedule.mockImplementation(async (_ctx: unknown, date: string) => ({
      date,
      shifts: [{ shiftId: 1, shiftName: "Ca Sáng", startTime: "08:00", endTime: "12:00", staff: [] }],
    }))
    const user = userEvent.setup()
    render(<ShiftsPanel />)
    await user.click(await screen.findByRole("button", { name: /thử lại/i }))
    expect(await screen.findByRole("region", { name: "Ca Sáng" })).toBeInTheDocument()
    expect(api.listFacilityStaff).toHaveBeenCalledTimes(2)
  })
})
