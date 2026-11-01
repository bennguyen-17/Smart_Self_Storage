import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AxiosError, type AxiosResponse } from "axios"
import { toast } from "sonner"
import { beforeEach, describe, expect, test, vi } from "vitest"

import type { ManagerTicketItem } from "../types"
import { listManagerTickets } from "../api/ticketApi"
import ManagerTicketPanel from "./ManagerTicketPanel"

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))
vi.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: { facilityId: 1 } }) }))
vi.mock("../api/ticketApi", () => ({
  listManagerTickets: vi.fn(),
}))

// Lỗi giống axios trả về khi BE từ chối, kèm câu lỗi của BE
function beError(status: number, message: string) {
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    status,
    data: { success: false, message },
  } as AxiosResponse)
}

const TICKET: ManagerTicketItem = {
  id: 6,
  ticketCode: "TCK-202610-006",
  type: "MAINTENANCE",
  status: "SUBMITTED",
  customerName: "Nguyễn Thành Long",
  unitCode: "HN01-G-XL02",
  description: "kho bị rò rỉ",
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("ManagerTicketPanel: tải và làm mới danh sách", () => {
  test("bấm Làm mới thì tải lại", async () => {
    vi.mocked(listManagerTickets).mockResolvedValue([TICKET])
    render(<ManagerTicketPanel />)
    await screen.findByText(/TCK-202610-006/)
    await userEvent.click(screen.getByRole("button", { name: /Làm mới/ }))
    await waitFor(() => expect(listManagerTickets).toHaveBeenCalledTimes(2))
  })

  test("tự tải lại sau mỗi 30 giây; rời trang thì dừng", async () => {
    vi.useFakeTimers()
    try {
      vi.mocked(listManagerTickets).mockResolvedValue([TICKET])
      const { unmount } = render(<ManagerTicketPanel />)
      expect(listManagerTickets).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(30_000)
      expect(listManagerTickets).toHaveBeenCalledTimes(2)
      unmount()
      await vi.advanceTimersByTimeAsync(60_000)
      expect(listManagerTickets).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe("ManagerTicketPanel: báo lỗi rõ lý do", () => {
  test("tải danh sách bị BE từ chối thì hiện câu lỗi của BE", async () => {
    vi.mocked(listManagerTickets).mockRejectedValue(
      beError(403, "Bạn không có quyền truy cập chức năng này (403 Forbidden)!"),
    )
    render(<ManagerTicketPanel />)

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Không thể tải danh sách ticket của cơ sở: Bạn không có quyền truy cập chức năng này (403 Forbidden)!",
      ),
    )
  })
})

const T = (patch: Partial<ManagerTicketItem>): ManagerTicketItem => ({ ...TICKET, ...patch })

describe("ManagerTicketPanel: Manager chỉ theo dõi, không tiếp nhận hay đóng ticket", () => {
  test("không có nút Tiếp nhận hay Đóng / Giải quyết ở bất kỳ trạng thái nào", async () => {
    vi.mocked(listManagerTickets).mockResolvedValue([
      T({ id: 1, ticketCode: "TCK-1", status: "SUBMITTED" }),
      T({ id: 2, ticketCode: "TCK-2", status: "IN_PROGRESS", assignedStaffId: 10, assignedStaffName: "Nguyễn Văn Hùng" }),
      T({ id: 3, ticketCode: "TCK-3", status: "RESOLVED", assignedStaffId: 10, assignedStaffName: "Nguyễn Văn Hùng", resolutionNote: "Đã thay khóa" }),
    ])
    render(<ManagerTicketPanel />)
    await screen.findByText(/TCK-1/)
    expect(screen.queryByRole("button", { name: /tiếp nhận xử lý/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /đóng.*giải quyết/i })).not.toBeInTheDocument()
    expect(screen.getByText("Chờ nhân viên trong ca tiếp nhận")).toBeInTheDocument()
    expect(screen.getByText("Nhân viên đang xử lý")).toBeInTheDocument()
    expect(screen.getByText("Nhân viên đã giải quyết xong")).toBeInTheDocument()
    expect(screen.getByText(/Đã thay khóa/)).toBeInTheDocument()
  })

  test("sự cố được hệ thống tự phân cho nhân viên trong ca nhưng chưa tiếp nhận → hiện tên kèm ghi chú", async () => {
    vi.mocked(listManagerTickets).mockResolvedValue([
      T({ type: "INCIDENT", status: "SUBMITTED", assignedStaffId: 11, assignedStaffName: "Lê Thị Ánh Tuyết" }),
    ])
    render(<ManagerTicketPanel />)
    const row = (await screen.findByText("Lê Thị Ánh Tuyết")).closest("tr") as HTMLElement
    expect(within(row).getByText("Đã phân, chưa tiếp nhận")).toBeInTheDocument()
    expect(within(row).getByText("Đã phân cho nhân viên trong ca, chờ tiếp nhận")).toBeInTheDocument()
  })
})
