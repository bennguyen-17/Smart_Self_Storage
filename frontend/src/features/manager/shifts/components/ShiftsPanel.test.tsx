import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, test, vi } from "vitest"

import { saveShift } from "../api/shiftApi"
import { resetShiftsMock } from "../api/shiftApi.mock"
import ShiftsPanel from "./ShiftsPanel"

vi.mock("@/lib/apiClient", () => ({ default: {}, isMockMode: () => true }))
vi.mock("../api/shiftApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/shiftApi")>()
  return { ...actual, saveShift: vi.fn(actual.saveShift) }
})

beforeEach(() => {
  resetShiftsMock()
  vi.mocked(saveShift).mockClear()
})

async function renderPanel() {
  const user = userEvent.setup()
  render(<ShiftsPanel />)
  await screen.findByRole("region", { name: "Ca Sáng" })
  return user
}

const card = (name: string) => screen.getByRole("region", { name })
const picker = (name: string) => within(card(name)).getByRole("combobox", { name: `Người trực ${name}` })

// Dữ liệu mẫu (shiftApi.mock): Ca Sáng còn 2 người (dữ liệu cũ), Ca Chiều 1 người, Ca Tối trống
describe("ShiftsPanel: mỗi ca 1 người trực, đổi người (nhóm chốt 03/11)", () => {
  test("dải 7 ngày T2 → CN (mở cả tuần); các ca và giờ ca lấy từ dữ liệu", async () => {
    await renderPanel()
    const days = within(screen.getByRole("group", { name: /chọn ngày trong tuần/i })).getAllByRole("button")
    expect(days).toHaveLength(7)
    expect(days[0]).toHaveTextContent(/^T2/)
    expect(days[5]).toHaveTextContent(/^T7/)
    expect(days[6]).toHaveTextContent(/^CN/)
    expect(within(card("Ca Sáng")).getByText("08:00 – 12:00")).toBeInTheDocument()
    expect(within(card("Ca Tối")).getByText("16:00 – 20:00")).toBeInTheDocument()
  })

  test("ca trống → cảnh báo rõ; ca có người → hiện tên người trực", async () => {
    await renderPanel()
    expect(within(card("Ca Tối")).getByText("Ca chưa có người trực")).toBeInTheDocument()
    expect(within(card("Ca Tối")).getByText("Chưa có người")).toBeInTheDocument()
    expect(within(card("Ca Chiều")).getByText("Hoàng Minh Tuấn", { selector: "p" })).toBeInTheDocument()
    expect(picker("Ca Chiều")).toHaveValue("5")
  })

  test("ô chọn chỉ có nhân viên cơ sở mình, đang hoạt động; không có nút thêm / bỏ người", async () => {
    await renderPanel()
    expect(within(picker("Ca Sáng")).getAllByRole("option").map((o) => o.textContent)).toEqual([
      "— Chưa xếp người —",
      "Bùi Thị Lan",
      "Hoàng Minh Tuấn",
      "Nguyễn Văn Nhân Viên 1",
    ])
    expect(screen.queryByRole("button", { name: /^thêm$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /^Bỏ /i })).not.toBeInTheDocument()
  })

  test("đổi người Ca Tối sang người đã trực ca khác → cảnh báo; Lưu gửi đúng 1 người", async () => {
    const user = await renderPanel()
    expect(within(card("Ca Tối")).getByRole("button", { name: /lưu ca tối/i })).toBeDisabled()
    await user.selectOptions(picker("Ca Tối"), "4")
    expect(within(card("Ca Tối")).getByText(/Bùi Thị Lan cũng đang trực Ca Sáng hôm nay/)).toBeInTheDocument()
    await user.click(within(card("Ca Tối")).getByRole("button", { name: /lưu ca tối/i }))
    expect(saveShift).toHaveBeenCalledWith(expect.anything(), expect.any(String), 3, [4])
    await waitFor(() => expect(within(card("Ca Tối")).getByText("Có người trực")).toBeInTheDocument(), { timeout: 3000 })
  })

  test("dữ liệu cũ có 2 người trong ca → nhắc chuẩn hóa; Lưu ghi lại đúng 1 người", async () => {
    const user = await renderPanel()
    expect(within(card("Ca Sáng")).getByText(/Ca đang có 2 người/)).toBeInTheDocument()
    await user.click(within(card("Ca Sáng")).getByRole("button", { name: /lưu ca sáng/i }))
    expect(saveShift).toHaveBeenCalledWith(expect.anything(), expect.any(String), 1, [1])
  })

  test("ngày đã qua (tuần trước) → chỉ xem: khóa ô chọn và nút Lưu, không áp dụng cho cả tuần", async () => {
    const user = await renderPanel()
    await user.click(screen.getByRole("button", { name: "Tuần trước" }))
    await waitFor(() => expect(within(card("Ca Sáng")).getByText(/Ngày đã qua: chỉ xem/)).toBeInTheDocument())
    expect(picker("Ca Sáng")).toBeDisabled()
    expect(within(card("Ca Sáng")).getByRole("button", { name: /lưu ca sáng/i })).toBeDisabled()
    expect(screen.getByRole("button", { name: /áp dụng lịch ngày này cho cả tuần/i })).toBeDisabled()
  })

  test("hôm nay vẫn đổi được người (không hiện chỉ xem)", async () => {
    await renderPanel()
    expect(within(card("Ca Sáng")).queryByText(/Ngày đã qua/)).not.toBeInTheDocument()
  })

  test("áp dụng lịch T2 tuần sau cho cả tuần → hỏi xác nhận, ghi đè 6 ngày còn lại × 3 ca, mỗi ca đúng người của ngày nguồn", async () => {
    const user = await renderPanel()
    await user.click(screen.getByRole("button", { name: "Tuần sau" }))
    const group = screen.getByRole("group", { name: /chọn ngày trong tuần/i })
    await user.click(within(group).getAllByRole("button")[0])
    await waitFor(() => expect(picker("Ca Chiều")).toHaveValue("5"))

    await user.click(screen.getByRole("button", { name: /áp dụng lịch ngày này cho cả tuần/i }))
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText(/sẽ bị ghi đè/)).toHaveTextContent(/T3 .*T7 .*CN/)
    expect(saveShift).not.toHaveBeenCalled()

    await user.click(within(dialog).getByRole("button", { name: "Áp dụng" }))
    await waitFor(() => expect(saveShift).toHaveBeenCalledTimes(6 * 3), { timeout: 8000 })
    const calls = vi.mocked(saveShift).mock.calls
    expect(new Set(calls.map((c) => c[1])).size).toBe(6)
    expect(calls.filter((c) => c[2] === 1).every((c) => JSON.stringify(c[3]) === "[1]")).toBe(true)
    expect(calls.filter((c) => c[2] === 2).every((c) => JSON.stringify(c[3]) === "[5]")).toBe(true)
    expect(calls.filter((c) => c[2] === 3).every((c) => c[3].length === 0)).toBe(true)
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument(), { timeout: 8000 })
  }, 20_000)

  test("bấm ngày khác trong tuần → đổi ngày đang chọn", async () => {
    const user = await renderPanel()
    const group = screen.getByRole("group", { name: /chọn ngày trong tuần/i })
    const target = within(group)
      .getAllByRole("button")
      .find((b) => b.getAttribute("aria-pressed") !== "true")!
    await user.click(target)
    expect(target).toHaveAttribute("aria-pressed", "true")
  })
})
