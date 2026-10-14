import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import { resetReservationsMock } from "../api/reservationApi.mock"
import RefundQueuePanel from "./RefundQueuePanel"

// Chạy bằng dữ liệu mẫu (mock) để kiểm cả luồng: danh sách → xử lý → phiếu rời hàng đợi
vi.mock("@/lib/apiClient", () => ({ default: {}, isMockMode: () => true }))

beforeEach(() => {
  resetReservationsMock()
  localStorage.setItem("user", JSON.stringify({ id: 5, fullName: "Nguyễn Văn Nhân Viên 1", role: "STAFF" }))
})
afterEach(() => localStorage.clear())

describe("RefundQueuePanel: hàng đợi hoàn cọc chờ xử lý (US-26)", () => {
  test("liệt kê phiếu đang chờ với số tiền, lý do; KHÔNG liệt kê phiếu đã hoàn", async () => {
    render(<RefundQueuePanel reloadKey={0} onRefunded={vi.fn()} />)
    const row = (await screen.findByText("RES-TX-1100-C7YU")).closest("tr") as HTMLElement
    expect(within(row).getByText(/500\.000/)).toBeInTheDocument()
    expect(within(row).getByText("Khách tự hủy")).toBeInTheDocument()
    expect(screen.queryByText("RES-CG-9922-OKRF")).not.toBeInTheDocument()
  })

  test("xử lý một phiếu: hiện STK khách, xác nhận xong thì phiếu rời hàng đợi và báo trang cha", async () => {
    const user = userEvent.setup()
    const onRefunded = vi.fn()
    render(<RefundQueuePanel reloadKey={0} onRefunded={onRefunded} />)
    await user.click(await screen.findByRole("button", { name: /xử lý hoàn cọc đơn RES-TX-1100-C7YU/i }))

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("190367891234 (Techcombank) - Lý Hải Phong")).toBeInTheDocument()
    await user.click(within(dialog).getByRole("button", { name: /ảnh biên lai mẫu/i }))
    await user.click(within(dialog).getByRole("button", { name: /xác nhận đã chuyển khoản/i }))

    await waitFor(() => expect(onRefunded).toHaveBeenCalledTimes(1), { timeout: 3000 })
    expect(await screen.findByText(/không có phiếu hoàn cọc nào đang chờ/i, {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})
