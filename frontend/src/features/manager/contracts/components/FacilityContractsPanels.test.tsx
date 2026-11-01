import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, test, vi } from "vitest"

import { resetFacilityContractsMock } from "../api/contractApi.mock"
import CustomersContractsPanel from "./CustomersContractsPanel"

vi.mock("@/lib/apiClient", () => ({ default: {}, isMockMode: () => true }))

beforeEach(() => {
  resetFacilityContractsMock()
})

const bodyRows = () => within(screen.getByRole("table")).getAllByRole("row").slice(1)

describe("CustomersContractsPanel: quản lí hợp đồng của cơ sở", () => {
  test("hiện thời hạn còn lại và trạng thái hợp đồng", async () => {
    render(<CustomersContractsPanel />)
    const row = (await screen.findByText("Đỗ Thị Thu")).closest("tr") as HTMLElement
    expect(within(row).getByText("Quá 12 ngày")).toBeInTheDocument()
    expect(within(row).getByText("Quá hạn")).toBeInTheDocument()
    expect(bodyRows()).toHaveLength(7)
  })

  test("không có nút sửa / xóa; mã hợp đồng là nút xem chi tiết", async () => {
    render(<CustomersContractsPanel />)
    await screen.findByText("Nguyễn Văn An")
    expect(within(screen.getByRole("table")).queryByRole("button", { name: /sửa|xóa/i })).not.toBeInTheDocument()
    for (const r of bodyRows()) {
      expect(within(r).getByRole("button", { name: /^Xem chi tiết hợp đồng / })).toBeInTheDocument()
    }
  })
})

describe("Chi tiết hợp đồng (bấm mã hợp đồng)", () => {
  test("hiện khách, ô kho, thời hạn, tiền cọc, tiến độ trả kho và các khoản phạt kèm trạng thái", async () => {
    const user = userEvent.setup()
    render(<CustomersContractsPanel />)
    const row = (await screen.findByText("Đỗ Thị Thu")).closest("tr") as HTMLElement
    const code = within(row).getByRole("button", { name: /^Xem chi tiết hợp đồng / })
    await user.click(code)

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText(code.textContent ?? "")).toBeInTheDocument()
    expect(within(dialog).getByText("Đỗ Thị Thu")).toBeInTheDocument()
    // Tiến độ trả kho đọc từ trạng thái hợp đồng (quá hạn), không từ checkoutStage
    expect(within(dialog).getByText("Khách đang giữ kho (đã quá hạn)")).toBeInTheDocument()
    expect(within(dialog).getByText("Quá 12 ngày")).toBeInTheDocument()
    expect(within(dialog).getByText("Tiền cọc")).toBeInTheDocument()
    expect(within(dialog).getByText("Trả kho:")).toBeInTheDocument()

    const fees = within(dialog).getByRole("table", { name: /phạt và truy thu/ })
    expect(within(fees).getByText("PEN-7001")).toBeInTheDocument()
    expect(within(fees).getByText("Chưa thu")).toBeInTheDocument()
    expect(within(dialog).getByText(/Chưa thu 600\.000/)).toBeInTheDocument()
  })

  test("hợp đồng không có khoản phạt thì nói rõ, không hiện bảng rỗng", async () => {
    const user = userEvent.setup()
    render(<CustomersContractsPanel />)
    const row = (await screen.findByText("Nguyễn Văn An")).closest("tr") as HTMLElement
    await user.click(within(row).getByRole("button", { name: /^Xem chi tiết hợp đồng / }))
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText(/chưa phát sinh khoản phạt hay truy thu nào/)).toBeInTheDocument()
    expect(within(dialog).queryByRole("table")).not.toBeInTheDocument()
  })
})
