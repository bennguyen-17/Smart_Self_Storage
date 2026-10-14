import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, test, vi } from "vitest"

import { downloadCsv } from "@/features/internal-shell/csv"

import AuditLogPanel from "./AuditLogPanel"

vi.mock("@/lib/apiClient", () => ({ default: {}, isMockMode: () => true }))
vi.mock("@/features/internal-shell/csv", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/internal-shell/csv")>()
  return { ...actual, downloadCsv: vi.fn() }
})

beforeEach(() => vi.mocked(downloadCsv).mockClear())

const bodyRows = () =>
  within(screen.getByRole("table")).getAllByRole("row").slice(1)

describe("AuditLogPanel: nhật ký hoạt động khớp bảng ActivityLog (US-30)", () => {
  test("cột Thời gian, Người thực hiện, Hành động, Mô tả, IP; tác vụ tự động ghi là Hệ thống", async () => {
    render(<AuditLogPanel />)
    await screen.findByText("Nhắc hạn hợp đồng (còn 7 ngày)")
    const headers = within(screen.getByRole("table"))
      .getAllByRole("columnheader")
      .map((h) => h.textContent)
    expect(headers).toEqual([
      "Thời gian",
      "Người thực hiện",
      "Hành động",
      "Mô tả",
      "IP",
    ])
    expect(screen.getAllByText("Hệ thống").length).toBeGreaterThan(0)
    expect(
      screen.getByText("Nhắc hạn hợp đồng (còn 7 ngày)")
    ).toBeInTheDocument()
  })

  test("chỉ xem: trong bảng không có nút sửa / xóa", async () => {
    render(<AuditLogPanel />)
    await screen.findByText("Nhắc hạn hợp đồng (còn 7 ngày)")
    expect(
      within(screen.getByRole("table")).queryByRole("button")
    ).not.toBeInTheDocument()
  })

  test("lọc theo người và theo loại hành động", async () => {
    const user = userEvent.setup()
    render(<AuditLogPanel />)
    await screen.findByText("Nhắc hạn hợp đồng (còn 7 ngày)")
    await user.type(screen.getByRole("searchbox"), "tran van quan ly")
    for (const r of bodyRows())
      expect(within(r).getByText("Trần Văn Quản Lý")).toBeInTheDocument()
    await user.selectOptions(
      screen.getByRole("combobox", { name: /hành động/i }),
      "APPROVE_FEE_DISCOUNT"
    )
    expect(bodyRows()).toHaveLength(1)
    expect(within(bodyRows()[0]).getByText(/PEN-7001/)).toBeInTheDocument()
  })

  test("khoảng ngày ngược → báo lỗi, bảng rỗng, không xuất được", async () => {
    render(<AuditLogPanel />)
    await screen.findByText("Nhắc hạn hợp đồng (còn 7 ngày)")
    fireEvent.change(screen.getByLabelText("Từ ngày"), {
      target: { value: "2099-01-02" },
    })
    fireEvent.change(screen.getByLabelText("Đến ngày"), {
      target: { value: "2099-01-01" },
    })
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /ngày bắt đầu phải trước/i
    )
    expect(screen.getByRole("button", { name: /xuất csv/i })).toBeDisabled()
  })

  test("Xuất CSV xuất đúng các dòng đang lọc", async () => {
    const user = userEvent.setup()
    render(<AuditLogPanel />)
    await screen.findByText("Nhắc hạn hợp đồng (còn 7 ngày)")
    await user.selectOptions(
      screen.getByRole("combobox", { name: /hành động/i }),
      "LOGIN_FAILED"
    )
    await user.click(screen.getByRole("button", { name: /xuất csv/i }))
    const [, csv] = vi.mocked(downloadCsv).mock.calls[0]
    expect(csv.split("\r\n")).toHaveLength(2)
    expect(csv).toContain("Đăng nhập thất bại")
  })
})
