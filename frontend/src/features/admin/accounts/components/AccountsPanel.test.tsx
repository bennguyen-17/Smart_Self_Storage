import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import { resetAccountsMock } from "../api/accountApi.mock"
import AccountsPanel from "./AccountsPanel"

// Chạy bằng dữ liệu mẫu để kiểm cả luồng tạo / phân quyền / khóa
vi.mock("@/lib/apiClient", () => ({ default: {}, isMockMode: () => true }))

const ADMIN = { id: 1, fullName: "Quản Trị Viên Hệ Thống", role: "ADMIN" }

async function renderPanel() {
  const user = userEvent.setup()
  render(<AccountsPanel />)
  await screen.findByText("staff1.hn01@selfstorage391.vn")
  return { user }
}

const row = (text: string) => screen.getByText(text).closest("tr") as HTMLElement

beforeEach(() => {
  resetAccountsMock()
  localStorage.setItem("user", JSON.stringify(ADMIN))
})
afterEach(() => localStorage.clear())

describe("AccountsPanel: Admin quản lý tài khoản nội bộ (US-29)", () => {
  test("không tự khóa / tự đổi vai trò của chính mình", async () => {
    await renderPanel()
    const self = row("admin@selfstorage391.vn")
    expect(within(self).getByRole("button", { name: /phân quyền/i })).toBeDisabled()
    expect(within(self).getByRole("button", { name: /khóa/i })).toBeDisabled()
    expect(within(self).getByRole("button", { name: /khóa/i })).toHaveAttribute("title", expect.stringMatching(/chính mình/))
    expect(within(row("staff1.hn01@selfstorage391.vn")).getByRole("button", { name: /khóa/i })).toBeEnabled()
  })

  test("tạo Staff mà không gán cơ sở → bị chặn, không tạo", async () => {
    const { user } = await renderPanel()
    await user.click(screen.getByRole("button", { name: /tạo tài khoản/i }))
    const dialog = await screen.findByRole("dialog")
    await user.type(within(dialog).getByLabelText(/họ và tên/i), "Nguyễn Văn Mới")
    await user.type(within(dialog).getByLabelText(/^email/i), "nv.moi@selfstorage391.vn")
    await user.click(within(dialog).getByRole("button", { name: /tạo tài khoản/i }))
    expect(within(dialog).getByText(/phải được gán một cơ sở/i)).toBeInTheDocument()
    expect(screen.queryByText("nv.moi@selfstorage391.vn")).not.toBeInTheDocument()
  })

  test("tạo Staff có cơ sở → xuất hiện trong bảng, chờ đổi mật khẩu tạm", async () => {
    const { user } = await renderPanel()
    await user.click(screen.getByRole("button", { name: /tạo tài khoản/i }))
    const dialog = await screen.findByRole("dialog")
    // Chưa có email gửi mật khẩu: form nói rõ mật khẩu ban đầu để Admin báo người dùng
    expect(within(dialog).getByText(/mật khẩu ban đầu 123456/i)).toBeInTheDocument()
    expect(within(dialog).queryByText(/gửi mật khẩu tạm tới email/i)).not.toBeInTheDocument()
    await user.type(within(dialog).getByLabelText(/họ và tên/i), "Nguyễn Văn Mới")
    await user.type(within(dialog).getByLabelText(/^email/i), "nv.moi@selfstorage391.vn")
    await user.selectOptions(within(dialog).getByLabelText(/cơ sở/i), "2")
    await user.click(within(dialog).getByRole("button", { name: /tạo tài khoản/i }))
    const created = await screen.findByText("nv.moi@selfstorage391.vn", {}, { timeout: 3000 })
    expect(within(created.closest("tr")!).getByText(/chờ đổi mật khẩu tạm/i)).toBeInTheDocument()
  })

  test("chọn vai trò Ban giám đốc → ô cơ sở bị khóa ở 'Toàn hệ thống'", async () => {
    const { user } = await renderPanel()
    await user.click(screen.getByRole("button", { name: /tạo tài khoản/i }))
    const dialog = await screen.findByRole("dialog")
    await user.selectOptions(within(dialog).getByLabelText(/vai trò/i), "BOM")
    const facility = within(dialog).getByLabelText(/cơ sở/i)
    expect(facility).toBeDisabled()
    expect(facility).toHaveDisplayValue("Toàn hệ thống")
  })

  test("khóa một tài khoản → có bước xác nhận, xong thì trạng thái 'Đã khóa'", async () => {
    const { user } = await renderPanel()
    await user.click(within(row("staff1.hn01@selfstorage391.vn")).getByRole("button", { name: /khóa/i }))
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: /khóa tài khoản/i }))
    await waitFor(
      () => expect(within(row("staff1.hn01@selfstorage391.vn")).getByText("Đã khóa")).toBeInTheDocument(),
      { timeout: 3000 }
    )
  })

  test("lọc theo vai trò Quản lý cơ sở → chỉ còn quản lý", async () => {
    const { user } = await renderPanel()
    await user.selectOptions(screen.getByRole("combobox", { name: /vai trò/i }), "MANAGER")
    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1)
    expect(rows).toHaveLength(2)
    for (const r of rows) expect(within(r).getByText("Quản lý cơ sở")).toBeInTheDocument()
  })
})
