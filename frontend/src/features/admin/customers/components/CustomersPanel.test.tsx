import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AxiosError, type AxiosResponse } from "axios"
import { toast } from "sonner"
import { beforeEach, describe, expect, test, vi } from "vitest"

import type { AdminCustomer } from "../types"
import CustomersPanel from "./CustomersPanel"

const api = vi.hoisted(() => ({ listCustomers: vi.fn(), unlockCustomer: vi.fn() }))
vi.mock("../api/customerApi", () => api)
vi.mock("@/lib/apiClient", () => ({ default: {}, isMockMode: () => false }))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const ACTIVE: AdminCustomer = {
  accountId: 1,
  fullName: "Nguyễn Thành Long",
  phone: "0912345678",
  email: "long@example.com",
  status: "ACTIVE",
  lockUntil: null,
}
const LOCKED: AdminCustomer = {
  accountId: 2,
  fullName: "Trần Thu Hà",
  phone: "0987654321",
  email: "ha@example.com",
  status: "LOCKED",
  lockUntil: "2099-01-01T00:00:00",
}

beforeEach(() => {
  api.listCustomers.mockReset().mockResolvedValue([ACTIVE, LOCKED])
  api.unlockCustomer.mockReset().mockResolvedValue({ ...LOCKED, status: "ACTIVE", lockUntil: null })
  vi.mocked(toast.success).mockReset()
})

const row = (name: string) => screen.getByText(name).closest("tr") as HTMLElement

describe("CustomersPanel: Admin tra cứu và mở khóa tài khoản khách", () => {
  test("người bị khóa lên đầu, có giờ mở khóa và nút Mở khóa; người bình thường không có nút", async () => {
    render(<CustomersPanel />)
    await screen.findByText("Trần Thu Hà")
    expect(screen.getAllByRole("row")[1]).toHaveTextContent("Trần Thu Hà")
    expect(screen.getByRole("status")).toHaveTextContent("1 tài khoản đang bị khóa")
    expect(within(row("Trần Thu Hà")).getByText("Đang bị khóa")).toBeInTheDocument()
    expect(within(row("Nguyễn Thành Long")).queryByRole("button")).not.toBeInTheDocument()
  })

  test("mở khóa: hỏi lại, gọi BE, báo thành công và tải lại", async () => {
    const user = userEvent.setup()
    render(<CustomersPanel />)
    await user.click(await screen.findByRole("button", { name: "Mở khóa tài khoản Trần Thu Hà" }))
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Mở khóa" }))
    expect(api.unlockCustomer).toHaveBeenCalledWith(2)
    expect(toast.success).toHaveBeenCalledWith("Đã mở khóa tài khoản Trần Thu Hà")
    expect(api.listCustomers).toHaveBeenCalledTimes(2)
  })

  test("BE từ chối (đã tự mở) thì hiện câu lỗi trong hộp thoại", async () => {
    api.unlockCustomer.mockRejectedValue(
      new AxiosError("x", "ERR", undefined, undefined, {
        status: 409,
        data: { message: "Tài khoản không ở trạng thái khóa do đăng nhập sai mật khẩu." },
      } as AxiosResponse)
    )
    const user = userEvent.setup()
    render(<CustomersPanel />)
    await user.click(await screen.findByRole("button", { name: "Mở khóa tài khoản Trần Thu Hà" }))
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Mở khóa" }))
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Tài khoản không ở trạng thái khóa")
  })

  test("lọc Đang bị khóa", async () => {
    const user = userEvent.setup()
    render(<CustomersPanel />)
    await screen.findByText("Trần Thu Hà")
    await user.selectOptions(screen.getByLabelText("Trạng thái"), "LOCKED")
    expect(screen.queryByText("Nguyễn Thành Long")).not.toBeInTheDocument()
  })
})
