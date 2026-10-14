import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, test, vi } from "vitest"

import { applyFeeDiscount } from "../api/contractApi"
import { resetFacilityContractsMock } from "../api/contractApi.mock"
import CheckoutDebtPanel from "./CheckoutDebtPanel"
import CustomersContractsPanel from "./CustomersContractsPanel"

vi.mock("@/lib/apiClient", () => ({ default: {}, isMockMode: () => true }))
vi.mock("../api/contractApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/contractApi")>()
  return { ...actual, applyFeeDiscount: vi.fn(actual.applyFeeDiscount) }
})

beforeEach(() => {
  resetFacilityContractsMock()
  vi.mocked(applyFeeDiscount).mockClear()
})

const bodyRows = () => within(screen.getByRole("table")).getAllByRole("row").slice(1)

describe("CustomersContractsPanel: khách & hợp đồng của cơ sở", () => {
  test("hiện thời hạn còn lại và công nợ; lọc 'Còn nợ' chỉ còn hợp đồng nợ", async () => {
    const user = userEvent.setup()
    render(<CustomersContractsPanel />)
    const row = (await screen.findByText("Đỗ Thị Thu")).closest("tr") as HTMLElement
    expect(within(row).getByText("Quá 12 ngày")).toBeInTheDocument()
    expect(within(row).getByText(/còn nợ 600\.000/i)).toBeInTheDocument()
    await user.selectOptions(screen.getByRole("combobox", { name: /thanh toán/i }), "DEBT")
    for (const r of bodyRows()) expect(within(r).getByText(/còn nợ/i)).toBeInTheDocument()
    expect(bodyRows()).toHaveLength(3)
  })

  test("không có nút sửa/xóa: trang chỉ để theo dõi", async () => {
    render(<CustomersContractsPanel />)
    await screen.findByText("Nguyễn Văn An")
    expect(within(screen.getByRole("table")).queryByRole("button")).not.toBeInTheDocument()
  })
})

describe("CheckoutDebtPanel: trả kho & công nợ, miễn / giảm phí (US-31)", () => {
  async function openDiscount(user: ReturnType<typeof userEvent.setup>, invoice: string) {
    render(<CheckoutDebtPanel />)
    await user.click(await screen.findByRole("button", { name: new RegExp(`miễn / giảm .* ${invoice}`, "i") }))
    return screen.findByRole("dialog", { name: /miễn \/ giảm phí/i })
  }

  test("chỉ liệt kê hồ sơ cần theo dõi (không có HĐ bình thường hay đã thanh lý hết nợ)", async () => {
    render(<CheckoutDebtPanel />)
    await screen.findByText("Đỗ Thị Thu")
    expect(screen.queryByText("Nguyễn Văn An")).not.toBeInTheDocument()
    expect(screen.queryByText("Vũ Thị Hương")).not.toBeInTheDocument()
    expect(screen.getByText("Lê Hoàng Nam")).toBeInTheDocument()
  })

  test("thiếu lý do → báo lỗi, KHÔNG gọi API", async () => {
    const user = userEvent.setup()
    const sheet = await openDiscount(user, "PEN-7001")
    await user.type(within(sheet).getByLabelText(/phần trăm giảm/i), "50")
    await user.click(within(sheet).getByRole("button", { name: /xác nhận giảm phí/i }))
    expect(within(sheet).getByText(/nhập lý do miễn \/ giảm/i)).toBeInTheDocument()
    expect(applyFeeDiscount).not.toHaveBeenCalled()
  })

  test("giảm vượt khoản phí → bị chặn", async () => {
    const user = userEvent.setup()
    const sheet = await openDiscount(user, "PEN-7001")
    await user.click(within(sheet).getByRole("radio", { name: /giảm số tiền/i }))
    await user.type(within(sheet).getByLabelText(/số tiền giảm/i), "700000")
    await user.type(within(sheet).getByLabelText(/lý do/i), "Khách gặp sự cố cổng tại cơ sở")
    await user.click(within(sheet).getByRole("button", { name: /xác nhận giảm phí/i }))
    expect(within(sheet).getByText(/không vượt quá số tiền của khoản phí/i)).toBeInTheDocument()
    expect(applyFeeDiscount).not.toHaveBeenCalled()
  })

  test("miễn toàn bộ kèm lý do → gửi 100%, khoản phí biến khỏi danh sách nợ", async () => {
    const user = userEvent.setup()
    const sheet = await openDiscount(user, "PEN-7001")
    await user.click(within(sheet).getByRole("radio", { name: /miễn toàn bộ/i }))
    expect(within(sheet).getByText("0 ₫")).toBeInTheDocument()
    await user.type(within(sheet).getByLabelText(/lý do/i), "Lỗi hệ thống tính phạt sai ngày")
    await user.click(within(sheet).getByRole("button", { name: /xác nhận miễn phí/i }))
    expect(applyFeeDiscount).toHaveBeenCalledWith(expect.anything(), 7001, { discountPercent: 100, reason: "Lỗi hệ thống tính phạt sai ngày" })
    await waitFor(() => expect(screen.queryByRole("button", { name: /PEN-7001/ })).not.toBeInTheDocument(), { timeout: 3000 })
  })
})
