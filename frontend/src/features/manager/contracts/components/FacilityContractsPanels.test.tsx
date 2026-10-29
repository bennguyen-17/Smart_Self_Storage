import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, test, vi } from "vitest"

import { resetFacilityContractsMock } from "../api/contractApi.mock"
import CheckoutDebtPanel from "./CheckoutDebtPanel"
import CustomersContractsPanel from "./CustomersContractsPanel"

vi.mock("@/lib/apiClient", () => ({ default: {}, isMockMode: () => true }))

beforeEach(() => {
  resetFacilityContractsMock()
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

describe("CheckoutDebtPanel: trả kho & công nợ", () => {
  test("chỉ liệt kê hồ sơ cần theo dõi (không có HĐ bình thường hay đã thanh lý hết nợ)", async () => {
    render(<CheckoutDebtPanel />)
    await screen.findByText("Đỗ Thị Thu")
    expect(screen.queryByText("Nguyễn Văn An")).not.toBeInTheDocument()
    expect(screen.queryByText("Vũ Thị Hương")).not.toBeInTheDocument()
    expect(screen.getByText("Lê Hoàng Nam")).toBeInTheDocument()
  })

  test("phí chưa thu chỉ để xem (số tiền, mã hóa đơn); không còn nút miễn / giảm", async () => {
    render(<CheckoutDebtPanel />)
    const row = (await screen.findByText("Đỗ Thị Thu")).closest("tr") as HTMLElement
    expect(within(row).getByText("PEN-7001")).toBeInTheDocument()
    expect(within(row).getByText(/600\.000/)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /miễn|giảm/i })).not.toBeInTheDocument()
  })
})
