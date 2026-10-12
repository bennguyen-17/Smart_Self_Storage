import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import { resetManagerUnitsMock } from "../api/unitManagementApi.mock"
import UnitManagementPanel from "./UnitManagementPanel"

// Mặc định chạy dữ liệu mẫu; một test tắt mock để kiểm trường hợp thiếu cơ sở khi chạy thật
const env = vi.hoisted(() => ({ mockMode: true }))
vi.mock("@/lib/apiClient", () => ({
  default: { get: vi.fn(), patch: vi.fn(), post: vi.fn() },
  isMockMode: () => env.mockMode,
  isTokenValid: () => true,
}))

async function renderPanel() {
  const user = userEvent.setup()
  render(<UnitManagementPanel />)
  await screen.findByText("HN01-F1-M01")
  return { user }
}

function row(unitCode: string) {
  return screen.getByText(unitCode).closest("tr") as HTMLElement
}

beforeEach(() => {
  env.mockMode = true
  resetManagerUnitsMock()
})
afterEach(() => localStorage.clear())

describe("UnitManagementPanel: quản lý ô kho tại cơ sở (US-13)", () => {
  test("không có nút Thêm/Xóa ô và không có ô nhập giá", async () => {
    await renderPanel()
    expect(screen.queryByRole("button", { name: /thêm|xóa/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument()
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
  })

  test.each([
    { unitCode: "HN01-G-XL02", reason: /chỉ đổi được loại kho khi ô đang trống/i, note: "ô đang thuê" },
    { unitCode: "HN01-F1-L02", reason: /chỉ đổi được loại kho khi ô đang trống/i, note: "ô đã đặt cọc" },
    { unitCode: "HN01-F1-S01", reason: /chưa có phiên bản kho điều hòa/i, note: "Size S trống nhưng không có bản điều hòa" },
  ])("không đổi được loại kho: $note → nút khóa kèm lý do", async ({ unitCode, reason }) => {
    await renderPanel()
    const btn = within(row(unitCode)).getByRole("button", { name: /sang kho/i })
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute("title", expect.stringMatching(reason))
  })

  test("ô đang có khách thì nút Bảo trì bị khóa", async () => {
    await renderPanel()
    for (const code of ["HN01-G-XL02", "HN01-F1-S02", "HN01-F1-L02"]) {
      expect(within(row(code)).getByRole("button", { name: /bảo trì/i })).toBeDisabled()
    }
  })

  test("đổi ô M trống sang kho điều hòa: có bước xác nhận, xong thì bảng cập nhật", async () => {
    const { user } = await renderPanel()
    await user.click(within(row("HN01-F1-M01")).getByRole("button", { name: /sang kho điều hòa/i }))
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText(/phụ thu 20%/i)).toBeInTheDocument()
    await user.click(within(dialog).getByRole("button", { name: /xác nhận/i }))
    // Bảng tải lại sau khi lưu: mỗi lần kiểm phải tìm lại hàng mới, không giữ tham chiếu hàng cũ
    await waitFor(() => expect(within(row("HN01-F1-M01")).getByText(/Size M - Climate/i)).toBeInTheDocument(), {
      timeout: 3000,
    })
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  test("đưa ô trống vào bảo trì → trạng thái đổi thành Bảo trì", async () => {
    const { user } = await renderPanel()
    await user.click(within(row("HN01-F1-S01")).getByRole("button", { name: /bảo trì/i }))
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: /xác nhận/i }))
    await waitFor(() => expect(within(row("HN01-F1-S01")).getByText("Bảo trì / vệ sinh")).toBeInTheDocument(), {
      timeout: 3000,
    })
  })

  test("bấm chip trạng thái để lọc: chỉ còn ô đúng trạng thái", async () => {
    const { user } = await renderPanel()
    await user.click(screen.getByRole("button", { name: /^Bảo trì \/ vệ sinh \(2\)$/ }))
    const bodyRows = screen.getAllByRole("row").slice(1)
    expect(bodyRows).toHaveLength(2)
    for (const r of bodyRows) expect(within(r).getByText("Bảo trì / vệ sinh")).toBeInTheDocument()
  })

  test("chạy thật mà tài khoản chưa gắn cơ sở → báo rõ, không tự đoán cơ sở", async () => {
    env.mockMode = false
    localStorage.setItem("user", JSON.stringify({ id: 3, fullName: "Trần Văn Quản Lý", role: "3" }))
    render(<UnitManagementPanel />)
    expect(await screen.findByText(/chưa được gắn cơ sở/i)).toBeInTheDocument()
    expect(screen.queryByText("HN01-F1-M01")).not.toBeInTheDocument()
  })
})
