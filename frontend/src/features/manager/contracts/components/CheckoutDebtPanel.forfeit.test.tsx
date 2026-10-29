import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, test, vi } from "vitest"

import { addDays, todayInVietnam } from "@/lib/format"

import type { FacilityContract } from "../types"
import CheckoutDebtPanel from "./CheckoutDebtPanel"

vi.mock("@/lib/apiClient", () => ({ default: {}, isMockMode: () => false }))
vi.mock("@/features/manager/managerContext", () => ({
  getManagerContext: () => ({ facilityId: 1, accountId: 3, fullName: "Trần Văn Quản Lý", isDemo: false }),
}))

const today = todayInVietnam()
function contract(id: number, customerName: string, patch: Partial<FacilityContract>): FacilityContract {
  return {
    contractId: id,
    contractCode: `CTR-HN01-0${id}`,
    customerName,
    customerPhone: "0912345678",
    unitCode: `HN01-F1-M0${id}`,
    startDate: addDays(today, -120),
    endDate: addDays(today, -5),
    status: "OVERDUE",
    depositAmount: 1_000_000,
    checkoutStage: "NONE",
    fees: [],
    ...patch,
  }
}

const CONTRACTS = [
  contract(1, "Khách Một", {}),
  contract(2, "Khách Hai", { endDate: addDays(today, -35) }),
  contract(3, "Khách Ba", { status: "FORFEITED", endDate: addDays(today, -60) }),
  contract(4, "Khách Bốn", { status: "COMPLETED", checkoutStage: "HANDED_OVER" }),
]

const api = vi.hoisted(() => ({ markForfeitProcessed: vi.fn() }))
vi.mock("../api/contractApi", () => ({
  listFacilityContracts: vi.fn(async () => CONTRACTS),
  markForfeitProcessed: api.markForfeitProcessed,
}))

describe("CheckoutDebtPanel: quá hạn trên 30 ngày cần lập hồ sơ thanh lý", () => {
  test("ghi số ngày quá hạn; quá 30 ngày hoặc FORFEITED có cảnh báo; COMPLETED không còn trong danh sách", async () => {
    render(<CheckoutDebtPanel />)
    const row = (name: string) => (screen.getByText(name).closest("tr") as HTMLElement)
    await screen.findByText("Khách Một")
    expect(within(row("Khách Một")).getByText("Quá hạn 5 ngày", { selector: "p" })).toBeInTheDocument()
    expect(within(row("Khách Một")).queryByText(/thanh lý tài sản/i)).not.toBeInTheDocument()
    expect(within(row("Khách Hai")).getByText(/cần lập hồ sơ niêm phong/i)).toBeInTheDocument()
    expect(within(row("Khách Ba")).getByText("Đã tịch thu, thanh lý tài sản")).toBeInTheDocument()
    expect(within(row("Khách Ba")).getByText(/cần lập hồ sơ niêm phong/i)).toBeInTheDocument()
    expect(screen.queryByText("Khách Bốn")).not.toBeInTheDocument()
  })

  test("lọc 'Quá hạn từ 30 ngày' chỉ còn hồ sơ cần thanh lý", async () => {
    const user = userEvent.setup()
    render(<CheckoutDebtPanel />)
    await screen.findByText("Khách Một")
    await user.selectOptions(screen.getByRole("combobox", { name: /cần xử lý/i }), "FORFEIT")
    const names = within(screen.getByRole("table")).getAllByRole("row").slice(1).map((r) => r.querySelector("p")?.textContent)
    expect(names).toEqual(["Khách Hai", "Khách Ba"])
  })
})

describe("CheckoutDebtPanel: Manager xác nhận đã xử lý tài sản", () => {
  test("chỉ hợp đồng FORFEITED mới có nút; quá hạn 35 ngày (BE chưa chuyển) chỉ có cảnh báo", async () => {
    render(<CheckoutDebtPanel />)
    await screen.findByText("Khách Một")
    expect(screen.getByRole("button", { name: "Xác nhận đã xử lý tài sản hợp đồng CTR-HN01-03" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /xử lý tài sản hợp đồng CTR-HN01-02/ })).not.toBeInTheDocument()
  })

  test("chưa ghi chú → báo lỗi, KHÔNG gọi API; ghi chú đủ → gọi API, đóng ngăn và tải lại", async () => {
    api.markForfeitProcessed.mockReset().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<CheckoutDebtPanel />)
    await user.click(await screen.findByRole("button", { name: "Xác nhận đã xử lý tài sản hợp đồng CTR-HN01-03" }))
    const sheet = await screen.findByRole("dialog", { name: "Xác nhận đã xử lý tài sản" })
    await user.click(within(sheet).getByRole("button", { name: "Xác nhận đã xử lý tài sản" }))
    expect(within(sheet).getByText("Nhập ghi chú xử lý tài sản")).toBeInTheDocument()
    expect(api.markForfeitProcessed).not.toHaveBeenCalled()
    await user.type(within(sheet).getByLabelText(/ghi chú xử lý tài sản/i), "Đã cắt khóa lúc 09:00, có camera")
    await user.click(within(sheet).getByRole("button", { name: "Xác nhận đã xử lý tài sản" }))
    expect(api.markForfeitProcessed).toHaveBeenCalledWith(expect.anything(), 3, "Đã cắt khóa lúc 09:00, có camera")
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  test("BE từ chối → giữ ngăn mở, hiện nguyên câu lỗi của BE", async () => {
    api.markForfeitProcessed.mockReset().mockRejectedValue(new Error("Hợp đồng đã được xác nhận xử lý tài sản."))
    const user = userEvent.setup()
    render(<CheckoutDebtPanel />)
    await user.click(await screen.findByRole("button", { name: "Xác nhận đã xử lý tài sản hợp đồng CTR-HN01-03" }))
    const sheet = await screen.findByRole("dialog", { name: "Xác nhận đã xử lý tài sản" })
    await user.type(within(sheet).getByLabelText(/ghi chú xử lý tài sản/i), "Đã cắt khóa lúc 09:00, có camera")
    await user.click(within(sheet).getByRole("button", { name: "Xác nhận đã xử lý tài sản" }))
    expect(await within(sheet).findByRole("alert")).toHaveTextContent("Hợp đồng đã được xác nhận xử lý tài sản.")
  })
})
