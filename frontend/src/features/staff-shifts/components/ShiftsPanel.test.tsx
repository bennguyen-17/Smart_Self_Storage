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

describe("ShiftsPanel: phân ai trực ca nào (US-32)", () => {
  test("dải 7 ngày thứ 2 → chủ nhật; các ca và giờ ca lấy từ dữ liệu, không chia việc", async () => {
    await renderPanel()
    const days = within(
      screen.getByRole("group", { name: /chọn ngày trong tuần/i })
    ).getAllByRole("button")
    expect(days).toHaveLength(7)
    expect(days[0]).toHaveTextContent(/^T2/)
    expect(days[6]).toHaveTextContent(/^CN/)
    expect(
      days.filter((d) => d.getAttribute("aria-pressed") === "true")
    ).toHaveLength(1)
    expect(
      within(card("Ca Sáng")).getByText("06:00 – 14:00")
    ).toBeInTheDocument()
    expect(
      within(card("Ca Đêm")).getByText("22:00 – 06:00 (qua đêm)")
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/nhiệm vụ|việc phụ trách|còn thiếu/i)
    ).not.toBeInTheDocument()
  })

  test("ca chưa có ai → cảnh báo rõ", async () => {
    await renderPanel()
    const night = card("Ca Đêm")
    expect(
      within(night).getByText("Ca chưa có nhân viên trực")
    ).toBeInTheDocument()
    expect(within(night).getByText("0 người trực")).toBeInTheDocument()
    expect(
      within(card("Ca Sáng")).queryByText("Ca chưa có nhân viên trực")
    ).not.toBeInTheDocument()
  })

  test("ô chọn chỉ có nhân viên cơ sở mình, đang hoạt động, chưa có trong ca", async () => {
    await renderPanel()
    const select = within(card("Ca Sáng")).getByRole("combobox", {
      name: /nhân viên thêm vào ca sáng/i,
    })
    expect(
      within(select)
        .getAllByRole("option")
        .map((o) => o.textContent)
    ).toEqual(["Chọn nhân viên…", "Hoàng Minh Tuấn"])
  })

  test("thêm người đã trực ca khác vào Ca Đêm → cảnh báo; Lưu gửi đúng danh sách employeeId", async () => {
    const user = await renderPanel()
    const night = card("Ca Đêm")
    expect(
      within(night).getByRole("button", { name: /lưu ca đêm/i })
    ).toBeDisabled()
    await user.selectOptions(
      within(night).getByRole("combobox", { name: /nhân viên thêm/i }),
      "4"
    )
    await user.click(within(night).getByRole("button", { name: /^thêm$/i }))
    expect(within(night).getByText("Đã trực Ca Sáng")).toBeInTheDocument()
    await user.click(within(night).getByRole("button", { name: /lưu ca đêm/i }))
    expect(saveShift).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      3,
      [4]
    )
    await waitFor(
      () =>
        expect(
          within(card("Ca Đêm")).getByText("1 người trực")
        ).toBeInTheDocument(),
      { timeout: 3000 }
    )
  })

  test("bỏ người khỏi ca rồi Lưu → gửi danh sách còn lại", async () => {
    const user = await renderPanel()
    const morning = card("Ca Sáng")
    await user.click(
      within(morning).getByRole("button", {
        name: "Bỏ Bùi Thị Lan khỏi Ca Sáng",
      })
    )
    await user.click(
      within(morning).getByRole("button", { name: /lưu ca sáng/i })
    )
    expect(saveShift).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      1,
      [1]
    )
  })

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
