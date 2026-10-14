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

async function openShift(user: ReturnType<typeof userEvent.setup>, name: RegExp) {
  render(<ShiftsPanel />)
  await screen.findByText("Hoàng Minh Tuấn")
  await user.click(screen.getByRole("button", { name }))
  return screen.findByRole("dialog")
}

describe("ShiftsPanel: phân ca nhân viên (US-32)", () => {
  test("bảng 3 ca; ca tối chưa có người được báo rõ, kèm việc còn thiếu", async () => {
    render(<ShiftsPanel />)
    const evening = (await screen.findByText("Ca tối")).closest("tr") as HTMLElement
    expect(within(evening).getByText("Chưa có người trực")).toBeInTheDocument()
    expect(within(evening).getByText("Xử lý sự cố")).toBeInTheDocument()
  })

  test("chỉ chọn được nhân viên cơ sở mình, đang hoạt động, chưa có trong ca", async () => {
    const user = userEvent.setup()
    const sheet = await openShift(user, /phân công ca sáng/i)
    const select = within(sheet).getByRole("combobox", { name: /nhân viên của cơ sở/i })
    const names = within(select).getAllByRole("option").map((o) => o.textContent)
    expect(names).toEqual(["Chọn nhân viên", "Hoàng Minh Tuấn"])
  })

  test("thêm người vào ca tối rồi lưu → gửi đúng danh sách, bảng cập nhật", async () => {
    const user = userEvent.setup()
    const sheet = await openShift(user, /phân công ca tối/i)
    expect(within(sheet).getByRole("button", { name: /lưu phân công/i })).toBeDisabled()
    await user.selectOptions(within(sheet).getByRole("combobox", { name: /nhân viên của cơ sở/i }), "8")
    await user.selectOptions(within(sheet).getByRole("combobox", { name: /việc phụ trách/i }), "INCIDENT")
    await user.click(within(sheet).getByRole("button", { name: /thêm vào ca/i }))
    expect(within(sheet).getByText(/cũng trực ca sáng hôm nay/i)).toBeInTheDocument()
    await user.click(within(sheet).getByRole("button", { name: /lưu phân công/i }))
    expect(saveShift).toHaveBeenCalledWith(expect.anything(), expect.any(String), "EVENING", [
      { accountId: 8, fullName: "Bùi Thị Lan", duty: "INCIDENT" },
    ])
    const evening = () => screen.getByText("Ca tối").closest("tr") as HTMLElement
    await waitFor(() => expect(within(evening()).getByText("Bùi Thị Lan")).toBeInTheDocument(), { timeout: 3000 })
  })
})
