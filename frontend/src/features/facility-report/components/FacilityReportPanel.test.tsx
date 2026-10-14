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

describe("FacilityReportPanel: báo cáo cơ sở (US-33)", () => {
  test("hiện đủ 5 bảng số liệu của cơ sở mình", async () => {
    render(<FacilityReportPanel />)
    expect(await screen.findByText("SmartStorage Cầu Giấy (HN-01)")).toBeInTheDocument()
    for (const name of ["Ô kho", "Hợp đồng", "Doanh thu", "Tiền cọc & miễn giảm", "Yêu cầu hỗ trợ & SLA"]) {
      expect(screen.getByRole("table", { name })).toBeInTheDocument()
    }
  })

  test("cọc đang giữ nằm ở bảng riêng, ghi rõ không tính vào doanh thu", async () => {
    render(<FacilityReportPanel />)
    const revenue = await screen.findByRole("table", { name: "Doanh thu" })
    expect(within(revenue).queryByText(/cọc/i)).not.toBeInTheDocument()
    const deposits = screen.getByRole("table", { name: "Tiền cọc & miễn giảm" })
    expect(within(deposits).getByText(/không tính vào doanh thu/i)).toBeInTheDocument()
  })

  test("Xuất CSV → tải file đúng tên cơ sở, có dòng doanh thu thuần", async () => {
    const user = userEvent.setup()
    render(<FacilityReportPanel />)
    await screen.findByText("SmartStorage Cầu Giấy (HN-01)")
    await user.click(screen.getByRole("button", { name: /xuất csv/i }))
    expect(downloadCsv).toHaveBeenCalledTimes(1)
    const [filename, csv] = vi.mocked(downloadCsv).mock.calls[0]
    expect(filename).toMatch(/^bao-cao-HN-01-\d{4}-\d{2}-\d{2}\.csv$/)
    expect(csv).toContain("Doanh thu,Doanh thu thuần,114500000")
  })
})
