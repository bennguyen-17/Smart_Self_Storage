import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import { changeUnitType, startMaintenance } from "../api/unitManagementApi"
import { resetManagerUnitsMock } from "../api/unitManagementApi.mock"
import UnitManagementPanel from "./UnitManagementPanel"

// Giữ hàm API thật (chạy mock) nhưng theo dõi được panel gọi với tham số gì
vi.mock("../api/unitManagementApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/unitManagementApi")>()
  return {
    ...actual,
    changeUnitType: vi.fn(actual.changeUnitType),
    startMaintenance: vi.fn(actual.startMaintenance),
  }
})

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

async function openEdit(user: ReturnType<typeof userEvent.setup>, unitCode: string) {
  await user.click(screen.getByRole("button", { name: `Sửa ô ${unitCode}` }))
  return screen.findByRole("dialog", { name: `Sửa ô ${unitCode}` })
}

beforeEach(() => {
  env.mockMode = true
  resetManagerUnitsMock()
  vi.mocked(startMaintenance).mockClear()
  vi.mocked(changeUnitType).mockClear()
})
afterEach(() => localStorage.clear())

describe("UnitManagementPanel: bảng ô kho + nút Sửa (US-13)", () => {
  test("mỗi hàng chỉ có nút Sửa; không có Thêm/Xóa ô và không có ô nhập giá", async () => {
    await renderPanel()
    expect(within(row("HN01-F1-M01")).getAllByRole("button")).toHaveLength(1)
    expect(screen.queryByRole("button", { name: /thêm|xóa/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument()
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
  })

  test("mở Sửa mà chưa đổi gì → nút Lưu bị khóa", async () => {
    const { user } = await renderPanel()
    const sheet = await openEdit(user, "HN01-F1-M01")
    expect(within(sheet).getByRole("button", { name: /lưu thay đổi/i })).toBeDisabled()
  })

  test.each([
    { unitCode: "HN01-G-XL02", locked: /kho điều hòa/i, reason: /chỉ đổi được loại kho khi ô đang trống/i, note: "ô thường đang thuê" },
    { unitCode: "HN01-F1-L02", locked: /kho thường/i, reason: /chỉ đổi được loại kho khi ô đang trống/i, note: "ô điều hòa đã đặt cọc" },
    { unitCode: "HN01-F1-S01", locked: /kho điều hòa/i, reason: /chưa có phiên bản kho điều hòa/i, note: "Size S không có bản điều hòa" },
  ])("không đổi được loại kho: $note → lựa chọn còn lại bị khóa kèm lý do", async ({ unitCode, locked, reason }) => {
    const { user } = await renderPanel()
    const sheet = await openEdit(user, unitCode)
    expect(within(sheet).getByRole("radio", { name: locked })).toBeDisabled()
    expect(within(sheet).getByText(reason)).toBeInTheDocument()
  })

  test.each(["HN01-G-XL02", "HN01-F1-S02", "HN01-F1-L02"])("ô đang có khách (%s) → không chọn được Bảo trì", async (unitCode) => {
    const { user } = await renderPanel()
    const sheet = await openEdit(user, unitCode)
    expect(within(sheet).getByRole("radio", { name: /bảo trì/i })).toBeDisabled()
    expect(within(sheet).getByText(/chưa đưa vào bảo trì được/i)).toBeInTheDocument()
  })

  test("đổi ô M trống sang kho điều hòa → lưu, bảng cập nhật, ngăn đóng", async () => {
    const { user } = await renderPanel()
    const sheet = await openEdit(user, "HN01-F1-M01")
    await user.click(within(sheet).getByRole("radio", { name: /kho điều hòa/i }))
    await user.click(within(sheet).getByRole("button", { name: /lưu thay đổi/i }))
    expect(changeUnitType).toHaveBeenCalledWith(expect.anything(), "HN01-F1-M01", 5)
    await waitFor(() => expect(within(row("HN01-F1-M01")).getByText(/Size M - Climate/i)).toBeInTheDocument(), {
      timeout: 3000,
    })
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  test("chọn Bảo trì mà chưa ghi chú sự cố → báo lỗi, KHÔNG gọi API", async () => {
    const { user } = await renderPanel()
    const sheet = await openEdit(user, "HN01-F1-S01")
    await user.click(within(sheet).getByRole("radio", { name: /bảo trì/i }))
    await user.type(within(sheet).getByLabelText(/ghi chú sự cố/i), "   ")
    await user.click(within(sheet).getByRole("button", { name: /lưu thay đổi/i }))
    expect(within(sheet).getByText(/vui lòng ghi chú sự cố/i)).toBeInTheDocument()
    expect(within(sheet).getByLabelText(/ghi chú sự cố/i)).toHaveAttribute("aria-invalid", "true")
    expect(startMaintenance).not.toHaveBeenCalled()
    expect(within(row("HN01-F1-S01")).getByText("Còn trống")).toBeInTheDocument()
  })

  test("đưa ô trống vào bảo trì kèm ghi chú → gọi API với ghi chú, trạng thái đổi", async () => {
    const { user } = await renderPanel()
    const sheet = await openEdit(user, "HN01-F1-S01")
    await user.click(within(sheet).getByRole("radio", { name: /bảo trì/i }))
    await user.type(within(sheet).getByLabelText(/ghi chú sự cố/i), "Khóa cửa bị kẹt")
    await user.click(within(sheet).getByRole("button", { name: /lưu thay đổi/i }))
    expect(startMaintenance).toHaveBeenCalledWith(expect.anything(), "HN01-F1-S01", "Khóa cửa bị kẹt")
    await waitFor(() => expect(within(row("HN01-F1-S01")).getByText("Bảo trì / vệ sinh")).toBeInTheDocument(), {
      timeout: 3000,
    })
  })

  test("ô đang bảo trì: không mở lại cho thuê từ đây (việc của nhân viên nghiệm thu)", async () => {
    const { user } = await renderPanel()
    const sheet = await openEdit(user, "HN01-G-XL05")
    expect(within(sheet).getByRole("radio", { name: /sẵn sàng cho thuê/i })).toBeDisabled()
    expect(within(sheet).getByText(/nhân viên cơ sở nghiệm thu/i)).toBeInTheDocument()
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
