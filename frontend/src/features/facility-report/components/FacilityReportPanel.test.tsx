import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, test, vi } from "vitest"

import { downloadCsv } from "@/features/internal-shell/csv"

import FacilityReportPanel from "./FacilityReportPanel"

vi.mock("@/lib/apiClient", () => ({ default: {}, isMockMode: () => true }))
vi.mock("@/features/internal-shell/csv", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/internal-shell/csv")>()
  return { ...actual, downloadCsv: vi.fn() }
})

beforeEach(() => vi.mocked(downloadCsv).mockClear())

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
    const deposits = screen.getByRole("region", { name: "Tiền cọc & miễn giảm" })
    expect(within(deposits).getByText(/không tính vào doanh thu/i)).toBeInTheDocument()
  })

  test("chuyển sang Bảng số liệu → đủ 5 bảng (cho người không đọc được biểu đồ / màu)", async () => {
    const user = await renderPanel()
    await user.click(screen.getByRole("button", { name: /bảng số liệu/i }))
    for (const name of ["Ô kho", "Hợp đồng", "Doanh thu", "Tiền cọc & miễn giảm", "Yêu cầu hỗ trợ & SLA"]) {
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
