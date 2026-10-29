import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, test, vi } from "vitest"

import { downloadCsv } from "@/components/internal/csv"

import { todayInVietnam } from "@/lib/format"

import { getManagerDashboard } from "../api/reportApi"
import { presetRange } from "../reportRules"
import FacilityReportPanel from "./FacilityReportPanel"

vi.mock("@/lib/apiClient", () => ({ default: {}, isMockMode: () => true }))
vi.mock("@/components/internal/csv", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/internal/csv")>()
  return { ...actual, downloadCsv: vi.fn() }
})

vi.mock("../api/reportApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/reportApi")>()
  return { ...actual, getManagerDashboard: vi.fn(actual.getManagerDashboard) }
})

beforeEach(() => {
  vi.mocked(downloadCsv).mockClear()
  vi.mocked(getManagerDashboard).mockClear()
})

async function renderPanel() {
  const user = userEvent.setup()
  render(<FacilityReportPanel />)
  await screen.findByText("SmartStorage Cầu Giấy (HN-01)")
  return user
}

describe("FacilityReportPanel: báo cáo cơ sở dạng biểu đồ (US-33)", () => {
  test("mặc định hiện biểu đồ: vành khuyên ô kho, giữa ghi % lấp đầy, chú thích bên cạnh kèm số", async () => {
    await renderPanel()
    expect(screen.getByRole("button", { name: /biểu đồ/i })).toHaveAttribute("aria-pressed", "true")
    const units = screen.getByRole("region", { name: "Ô kho" })
    expect(within(units).getByText("84%")).toBeInTheDocument()
    expect(within(units).getByText("lấp đầy")).toBeInTheDocument()
    expect(within(units).getByText("40 ô")).toBeInTheDocument()
    expect(within(units).getByRole("img", { name: /cơ cấu 50 ô kho: đang thuê 40 ô \(80%\)/i })).toBeInTheDocument()
    expect(within(units).getByText("Còn trống")).toBeInTheDocument()
  })

  test("doanh thu thuần là con số chính; hoàn tiền ghi 'trừ ra'; cọc đang giữ nằm ngoài khối doanh thu", async () => {
    await renderPanel()
    const revenue = screen.getByRole("region", { name: "Doanh thu" })
    expect(within(revenue).getByText(/114\.500\.000/)).toBeInTheDocument()
    expect(within(revenue).getByText("(trừ ra)")).toBeInTheDocument()
    const items = within(revenue).getByRole("list", { name: "Cơ cấu doanh thu" })
    expect(within(items).queryByText(/cọc/i)).not.toBeInTheDocument()
    const deposits = screen.getByRole("region", { name: "Tiền cọc" })
    expect(within(deposits).getByText(/không tính vào doanh thu/i)).toBeInTheDocument()
  })

  test("chuyển sang Bảng số liệu → đủ 5 bảng (cho người không đọc được biểu đồ / màu)", async () => {
    const user = await renderPanel()
    await user.click(screen.getByRole("button", { name: /bảng số liệu/i }))
    for (const name of ["Ô kho", "Hợp đồng", "Doanh thu", "Tiền cọc", "Yêu cầu hỗ trợ & SLA"]) {
      expect(screen.getByRole("table", { name })).toBeInTheDocument()
    }
  })

  test("Xuất CSV → tải file đúng tên cơ sở, có dòng doanh thu thuần", async () => {
    const user = await renderPanel()
    await user.click(screen.getByRole("button", { name: /xuất csv/i }))
    const [filename, csv] = vi.mocked(downloadCsv).mock.calls[0]
    expect(filename).toMatch(/^bao-cao-HN-01-\d{4}-\d{2}-\d{2}\.csv$/)
    expect(csv).toContain("Doanh thu,Doanh thu thuần,114500000")
  })
})

describe("FacilityReportPanel: lọc theo khoảng thời gian", () => {
  test("mặc định Từ trước đến nay; chọn Tháng trước → tải lại đúng khoảng, ghi rõ phạm vi số liệu", async () => {
    const user = await renderPanel()
    expect(vi.mocked(getManagerDashboard).mock.calls[0][1]).toEqual({ from: "", to: "" })
    expect(screen.getByText("Từ trước đến nay", { selector: "span" })).toBeInTheDocument()
    await user.selectOptions(screen.getByRole("combobox", { name: /khoảng thời gian/i }), "LAST_MONTH")
    const expected = presetRange("LAST_MONTH", todayInVietnam())!
    expect(vi.mocked(getManagerDashboard).mock.calls.at(-1)?.[1]).toEqual(expected)
    expect(screen.getByLabelText("Từ ngày")).toHaveValue(expected.from)
    expect(screen.getByText(/doanh thu, hoàn tiền và yêu cầu hỗ trợ tính trong khoảng này/i)).toBeInTheDocument()
  })

  test("tự sửa ngày → chuyển sang Tùy chọn", async () => {
    await renderPanel()
    fireEvent.change(screen.getByLabelText("Từ ngày"), { target: { value: "2026-10-01" } })
    expect(screen.getByRole("combobox", { name: /khoảng thời gian/i })).toHaveValue("CUSTOM")
    expect(screen.getByText("Từ 01/10/2026")).toBeInTheDocument()
  })

  test("khoảng ngày ngược → báo lỗi, không gọi API", async () => {
    await renderPanel()
    const calls = vi.mocked(getManagerDashboard).mock.calls.length
    fireEvent.change(screen.getByLabelText("Từ ngày"), { target: { value: "2026-10-23" } })
    fireEvent.change(screen.getByLabelText("Đến ngày"), { target: { value: "2026-10-01" } })
    expect(screen.getByRole("alert")).toHaveTextContent(/ngày bắt đầu phải trước/i)
    expect(vi.mocked(getManagerDashboard).mock.calls.length).toBe(calls + 1)
  })
})
