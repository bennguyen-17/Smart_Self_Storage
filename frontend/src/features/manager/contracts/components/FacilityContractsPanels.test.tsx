import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, test, vi } from "vitest"

import { resetFacilityContractsMock } from "../api/contractApi.mock"
import CustomersContractsPanel from "./CustomersContractsPanel"

vi.mock("@/lib/apiClient", () => ({ default: {}, isMockMode: () => true }))
// Ảnh hợp đồng tải kèm token: giả lập trả object URL
vi.mock("@/components/internal/images/imageApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/components/internal/images/imageApi")>()),
  loadImageObjectUrl: vi.fn(async (url: string) => `blob:${url}`),
}))

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
    expect(within(dialog).getByText("Trạng thái kho hiện tại:")).toBeInTheDocument()

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

  test("hợp đồng đã kết thúc → ô thời hạn ghi \"Đã kết thúc\" (không để trống); đang hiệu lực → còn bao nhiêu ngày", async () => {
    const user = userEvent.setup()
    render(<CustomersContractsPanel />)
    const ended = (await screen.findByText("Vũ Thị Hương")).closest("tr") as HTMLElement
    await user.click(within(ended).getByRole("button", { name: /^Xem chi tiết hợp đồng / }))
    expect(within(await screen.findByRole("dialog")).getByText("Đã kết thúc")).toBeInTheDocument()
    await user.keyboard("{Escape}")

    const active = screen.getByText("Nguyễn Văn An").closest("tr") as HTMLElement
    await user.click(within(active).getByRole("button", { name: /^Xem chi tiết hợp đồng / }))
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).queryByText("Đã kết thúc")).not.toBeInTheDocument()
    expect(within(dialog).getByText(/^Còn [0-9]+ ngày$/)).toBeInTheDocument()
  })

  test("hợp đồng đã trả kho → có mục ảnh nghiệm thu Staff chụp; bấm ảnh thì phóng to", async () => {
    const user = userEvent.setup()
    render(<CustomersContractsPanel />)
    const ended = (await screen.findByText("Vũ Thị Hương")).closest("tr") as HTMLElement
    await user.click(within(ended).getByRole("button", { name: /^Xem chi tiết hợp đồng / }))
    const dialog = await screen.findByRole("dialog")
    const gallery = within(dialog).getByRole("list", { name: "Ảnh nghiệm thu" })
    expect(within(gallery).getAllByRole("button")).toHaveLength(2)
    expect(await within(gallery).findByRole("img", { name: "Ảnh nghiệm thu 1" })).toHaveAttribute("src", "blob:/api/images/901")
    await user.click(within(gallery).getByRole("button", { name: "Xem ảnh nghiệm thu 1" }))
    expect(await screen.findByText(/Nguyễn Văn Hùng/)).toBeInTheDocument()
  })

  test("hợp đồng đang thuê → không hiện mục ảnh nghiệm thu", async () => {
    const user = userEvent.setup()
    render(<CustomersContractsPanel />)
    const active = (await screen.findByText("Nguyễn Văn An")).closest("tr") as HTMLElement
    await user.click(within(active).getByRole("button", { name: /^Xem chi tiết hợp đồng / }))
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).queryByText("Ảnh nghiệm thu trả kho")).not.toBeInTheDocument()
  })

  test("từ chi tiết mở được văn bản hợp đồng pháp lý (bản dùng chung với khách, tải PDF)", async () => {
    const user = userEvent.setup()
    render(<CustomersContractsPanel />)
    const row = (await screen.findByText("Nguyễn Văn An")).closest("tr") as HTMLElement
    await user.click(within(row).getByRole("button", { name: /^Xem chi tiết hợp đồng / }))
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: /xem văn bản hợp đồng/i }))
    expect(await screen.findByText("Tải PDF")).toBeInTheDocument()
  })

  test("cột Thao tác luôn có nút Chi tiết ở mọi hàng, bấm mở ngăn chi tiết", async () => {
    const user = userEvent.setup()
    render(<CustomersContractsPanel />)
    await screen.findByText("Nguyễn Văn An")
    for (const r of bodyRows()) expect(within(r).getByRole("button", { name: /^Chi tiết hợp đồng / })).toBeInTheDocument()
    const row = screen.getByText("Nguyễn Văn An").closest("tr") as HTMLElement
    await user.click(within(row).getByRole("button", { name: /^Chi tiết hợp đồng / }))
    expect(await screen.findByRole("dialog")).toHaveTextContent("Nguyễn Văn An")
  })
})
