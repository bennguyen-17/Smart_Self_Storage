import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, test, vi } from "vitest"

import { addDays, todayInVietnam } from "@/lib/format"

import type { FacilityContract } from "../types"
import CustomersContractsPanel from "./CustomersContractsPanel"

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
  contract(4, "Khách Bốn", { status: "FORFEITED", endDate: addDays(today, -70), forfeitProcessed: true }),
]

const api = vi.hoisted(() => ({ markForfeitProcessed: vi.fn() }))
vi.mock("../api/contractApi", () => ({
  listFacilityContracts: vi.fn(async () => CONTRACTS),
  markForfeitProcessed: api.markForfeitProcessed,
}))

const row = (name: string) => screen.getByText(name).closest("tr") as HTMLElement
const LINK = "https://drive.example.com/bien-ban-thanh-ly.jpg"

describe("Quản lí hợp đồng: thanh lý tài sản quá hạn", () => {
  test("chỉ hợp đồng đã chuyển Tịch thu mới có nút; quá hạn 35 ngày (BE chưa chuyển) ghi 'Chờ chuyển tịch thu'; đã xử lý ghi 'Đã thanh lý'", async () => {
    render(<CustomersContractsPanel />)
    await screen.findByText("Khách Một")
    expect(within(row("Khách Một")).queryByRole("button", { name: /Thanh lý tài sản/ })).not.toBeInTheDocument()
    expect(within(row("Khách Hai")).queryByRole("button", { name: /Thanh lý tài sản/ })).not.toBeInTheDocument()
    expect(within(row("Khách Hai")).getByText("Chờ chuyển tịch thu")).toBeInTheDocument()
    expect(within(row("Khách Ba")).getByRole("button", { name: /Thanh lý tài sản/ })).toBeInTheDocument()
    expect(within(row("Khách Bốn")).getByText("Đã thanh lý")).toBeInTheDocument()
  })

  test("chưa dán link ảnh minh chứng thì không xác nhận được; dán link → gọi API kèm link, đóng hộp thoại", async () => {
    api.markForfeitProcessed.mockReset().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<CustomersContractsPanel />)
    await user.click(within(await screen.findByText("Khách Ba").then(() => row("Khách Ba"))).getByRole("button", { name: /Thanh lý tài sản/ }))
    const dialog = await screen.findByRole("dialog")
    const confirm = within(dialog).getByRole("button", { name: "Xác nhận thanh lý tài sản" })
    expect(confirm).toBeDisabled()
    await user.type(within(dialog).getByLabelText(/link ảnh/i), LINK)
    await user.click(confirm)
    expect(api.markForfeitProcessed).toHaveBeenCalledWith(expect.anything(), 3, expect.stringContaining(LINK))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  test("BE từ chối → giữ hộp thoại mở, hiện nguyên câu lỗi của BE", async () => {
    api.markForfeitProcessed.mockReset().mockRejectedValue(new Error("Hợp đồng đã được xác nhận xử lý tài sản."))
    const user = userEvent.setup()
    render(<CustomersContractsPanel />)
    await screen.findByText("Khách Ba")
    await user.click(within(row("Khách Ba")).getByRole("button", { name: /Thanh lý tài sản/ }))
    const dialog = await screen.findByRole("dialog")
    await user.type(within(dialog).getByLabelText(/link ảnh/i), LINK)
    await user.click(within(dialog).getByRole("button", { name: "Xác nhận thanh lý tài sản" }))
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Hợp đồng đã được xác nhận xử lý tài sản.")
  })

  test("từ hộp thoại chi tiết: hợp đồng đã tịch thu có nút thanh lý, bấm thì chuyển sang hộp thoại thanh lý", async () => {
    const user = userEvent.setup()
    render(<CustomersContractsPanel />)
    await screen.findByText("Khách Ba")
    await user.click(screen.getByRole("button", { name: "Xem chi tiết hợp đồng CTR-HN01-03" }))
    const detail = await screen.findByRole("dialog")
    await user.click(within(detail).getByRole("button", { name: /Thanh lý tài sản/ }))
    expect(await screen.findByRole("button", { name: "Xác nhận thanh lý tài sản" })).toBeInTheDocument()
  })

  test("chi tiết hợp đồng quá hạn 35 ngày (chưa chuyển) giải thích phải chờ hệ thống, không có nút", async () => {
    const user = userEvent.setup()
    render(<CustomersContractsPanel />)
    await screen.findByText("Khách Hai")
    await user.click(screen.getByRole("button", { name: "Xem chi tiết hợp đồng CTR-HN01-02" }))
    const detail = await screen.findByRole("dialog")
    expect(within(detail).getByText(/Hệ thống sẽ chuyển sang "Tịch thu" lúc 00:00/)).toBeInTheDocument()
    expect(within(detail).queryByRole("button", { name: /Thanh lý tài sản/ })).not.toBeInTheDocument()
  })
})
