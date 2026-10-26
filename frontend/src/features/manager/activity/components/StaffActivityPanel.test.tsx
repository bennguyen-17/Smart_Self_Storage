import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, test, vi } from "vitest"

import type { FacilityLogEntry, StaffActivityDay } from "../types"
import StaffActivityPanel from "./StaffActivityPanel"

const api = vi.hoisted(() => ({ getStaffActivity: vi.fn(), listFacilityLogs: vi.fn() }))
vi.mock("../api/activityApi", () => api)
vi.mock("@/lib/apiClient", () => ({ default: {}, isMockMode: () => false }))
vi.mock("@/hooks/useAuthSession", () => ({ getStoredUser: () => ({ id: 3, facilityId: 1, fullName: "Trần Văn Quản" }) }))
vi.mock("@/lib/format", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/format")>()),
  todayInVietnam: () => "2026-10-26",
}))

const DAY: StaffActivityDay = {
  date: "2026-10-26",
  shifts: [
    {
      shiftId: 1,
      shiftName: "Ca Sáng",
      startTime: "00:00",
      endTime: "12:00",
      staff: [
        {
          employeeId: 8,
          accountId: 10,
          fullName: "Nguyễn Văn Hùng",
          attended: true,
          checkIns: 2,
          checkouts: 0,
          ticketsResolved: 1,
          maintenanceDone: 1,
          tasksDone: 1,
          avgTicketAcceptMinutes: 4,
        },
        {
          employeeId: 9,
          accountId: 11,
          fullName: "Bùi Tuấn Kiệt",
          attended: false,
          checkIns: 0,
          checkouts: 0,
          ticketsResolved: 0,
          maintenanceDone: 0,
          tasksDone: 0,
          avgTicketAcceptMinutes: null,
        },
      ],
    },
    { shiftId: 2, shiftName: "Ca Chiều", startTime: "12:00", endTime: "16:00", staff: [] },
  ],
}

const LOGS: FacilityLogEntry[] = [
  {
    activityLogId: 1,
    accountId: 10,
    actorName: "Nguyễn Văn Hùng",
    actorRole: "STAFF",
    action: "COMPLETE_MAINTENANCE",
    description: "Hoàn tất bảo trì ô HN01-G-XL05",
    createdAt: "2026-10-26T09:00:00",
    ipAddress: null,
    facilityId: 1,
    facilityCode: "HN-01",
  },
  {
    activityLogId: 2,
    accountId: 11,
    actorName: "Bùi Tuấn Kiệt",
    actorRole: "STAFF",
    action: "RESOLVE_TICKET",
    description: "Đóng ticket TCK-202610-006",
    createdAt: "2026-10-26T10:00:00",
    ipAddress: null,
    facilityId: 1,
    facilityCode: "HN-01",
  },
]

beforeEach(() => {
  api.getStaffActivity.mockReset().mockResolvedValue(DAY)
  api.listFacilityLogs.mockReset().mockResolvedValue(LOGS)
  Element.prototype.scrollIntoView = vi.fn()
})

describe("StaffActivityPanel: hoạt động nhân viên và nhật ký cơ sở", () => {
  test("bảng theo ca: chỉ ca có người; tổng trong ngày; ai chưa vào ca sau giờ bắt đầu thì báo đỏ", async () => {
    render(<StaffActivityPanel />)
    await screen.findByRole("heading", { name: /Ca Sáng/ })
    expect(screen.queryByRole("heading", { name: /Ca Chiều/ })).not.toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("1/2 lượt trực đã vào ca")
    expect(screen.getByRole("status")).toHaveTextContent("Nhận kho: 2")

    const hung = screen.getByRole("button", { name: "Xem nhật ký của Nguyễn Văn Hùng" }).closest("tr") as HTMLElement
    expect(within(hung).getByText("Đã vào ca")).toBeInTheDocument()
    expect(within(hung).getByText("4 phút")).toBeInTheDocument()
    // Ca bắt đầu 00:00 nên lúc nào chạy test cũng đã tới giờ
    const kiet = screen.getByRole("button", { name: "Xem nhật ký của Bùi Tuấn Kiệt" }).closest("tr") as HTMLElement
    expect(within(kiet).getByText("Chưa vào ca (đã tới giờ)")).toBeInTheDocument()
  })

  test("nhật ký: nhãn tiếng Việt, vai trò tiếng Việt; bấm tên nhân viên thì lọc nhật ký của người đó", async () => {
    const user = userEvent.setup()
    render(<StaffActivityPanel />)
    await screen.findByText("Hoàn tất bảo trì ô HN01-G-XL05")
    expect(screen.getByText("Hoàn tất bảo trì")).toBeInTheDocument()
    expect(screen.getAllByText("Nhân Viên Vận Hành")).toHaveLength(2)

    await user.click(screen.getByRole("button", { name: "Xem nhật ký của Bùi Tuấn Kiệt" }))
    expect(screen.getByLabelText("Nhân viên")).toHaveValue("11")
    expect(screen.queryByText("Hoàn tất bảo trì ô HN01-G-XL05")).not.toBeInTheDocument()
    expect(screen.getByText("Đóng ticket TCK-202610-006")).toBeInTheDocument()
  })

  test("ngày chưa xếp ai thì hướng dẫn sang trang Phân công", async () => {
    api.getStaffActivity.mockResolvedValue({ date: "2026-10-26", shifts: [] })
    api.listFacilityLogs.mockResolvedValue([])
    render(<StaffActivityPanel />)
    expect(await screen.findByText(/chưa có ai được xếp ca\. Xếp người trực ở trang Phân công/)).toBeInTheDocument()
    expect(screen.getByText("Chưa có thao tác nào trong ngày")).toBeInTheDocument()
  })

  test("lỗi nhật ký không làm mất bảng hoạt động", async () => {
    api.listFacilityLogs.mockRejectedValue(new Error("Lỗi mạng"))
    render(<StaffActivityPanel />)
    await screen.findByRole("heading", { name: /Ca Sáng/ })
    expect(await screen.findByText("Không tải được nhật ký")).toBeInTheDocument()
  })
})
