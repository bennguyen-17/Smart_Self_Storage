import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AxiosError, type AxiosResponse } from "axios"
import { toast } from "sonner"
import { beforeEach, describe, expect, test, vi } from "vitest"

import type { ManagerTicketItem } from "../types"
import { listManagerTickets, managerAcceptTicket, managerResolveTicket } from "../api/ticketApi"
import ManagerTicketPanel from "./ManagerTicketPanel"
import ResolveTicketModal from "./ResolveTicketModal"

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))
vi.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: { facilityId: 1 } }) }))
vi.mock("../api/ticketApi", () => ({
  listManagerTickets: vi.fn(),
  managerAcceptTicket: vi.fn(),
  managerResolveTicket: vi.fn(),
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

  test("tiếp nhận thất bại thì toast nhận chuỗi, không nhận object của BE", async () => {
    vi.mocked(listManagerTickets).mockResolvedValue([TICKET])
    vi.mocked(managerAcceptTicket).mockRejectedValue(beError(400, "Ticket đã có người nhận"))
    render(<ManagerTicketPanel />)

    await userEvent.click(await screen.findByRole("button", { name: /Tiếp nhận xử lý/ }))

    expect(toast.error).toHaveBeenCalledWith("Không thể tiếp nhận ticket: Ticket đã có người nhận")
  })
})

describe("ResolveTicketModal: báo lỗi rõ lý do", () => {
  test("đóng ticket thất bại thì hiện câu lỗi của BE và không đóng popup", async () => {
    vi.mocked(managerResolveTicket).mockRejectedValue(beError(400, "Ticket đã được giải quyết"))
    const onClose = vi.fn()
    render(<ResolveTicketModal ticket={TICKET} onClose={onClose} onResolved={vi.fn()} />)

    await userEvent.click(screen.getByRole("button", { name: /Xác nhận đóng ticket/ }))

    expect(toast.error).toHaveBeenCalledWith("Không thể đóng ticket: Ticket đã được giải quyết")
    expect(onClose).not.toHaveBeenCalled()
  })
})
