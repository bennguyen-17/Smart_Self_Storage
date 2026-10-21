import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, test, vi } from "vitest"

import { downloadCsv } from "@/components/internal/csv"

import { listActivityLogs } from "../api/auditApi"
import type { ActivityLogEntry } from "../types"
import AuditLogPanel from "./AuditLogPanel"

vi.mock("@/lib/apiClient", () => ({ default: {}, isMockMode: () => true }))
vi.mock("@/components/internal/csv", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/components/internal/csv")>()
  return { ...actual, downloadCsv: vi.fn() }
})

vi.mock("../api/auditApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/auditApi")>()
  return { ...actual, listActivityLogs: vi.fn(actual.listActivityLogs) }
})

beforeEach(async () => {
  vi.mocked(downloadCsv).mockClear()
  const actual =
    await vi.importActual<typeof import("../api/auditApi")>("../api/auditApi")
  vi.mocked(listActivityLogs).mockImplementation(actual.listActivityLogs)
})

/** 45 lần đăng nhập, mới nhất là #45 */
const MANY: ActivityLogEntry[] = Array.from({ length: 45 }, (_, i) => ({
  activityLogId: i + 1,
  accountId: 3,
  actorName: `Người dùng ${i + 1}`,
  actorRole: "MANAGER",
  action: i === 0 ? "LOGIN_FAILED" : "LOGIN_SUCCESS",
  description: "Login successful",
  createdAt: `2026-10-14T10:${String(i).padStart(2, "0")}:00`,
  ipAddress: "127.0.0.1",
}))

const bodyRows = () =>
  within(screen.getByRole("table")).getAllByRole("row").slice(1)

/** Phần lớn dữ liệu mẫu là thao tác nội bộ (Manager, Staff, hệ thống) → mở tab Nội bộ */
async function renderOnInternalTab() {
  const user = userEvent.setup()
  render(<AuditLogPanel />)
  await user.click(screen.getByRole("tab", { name: /nội bộ/i }))
}

describe("AuditLogPanel: chia 2 tab Khách hàng / Nội bộ", () => {
  test("mặc định tab Khách hàng: chỉ có thao tác của khách; mỗi tab ghi số bản ghi", async () => {
    render(<AuditLogPanel />)
    expect(await screen.findByRole("tab", { name: "Khách hàng 2" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("tab", { name: "Nội bộ 10" })).toHaveAttribute("aria-selected", "false")
    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1)
    expect(rows).toHaveLength(2)
    for (const r of rows) expect(within(r).getByText("CUSTOMER")).toBeInTheDocument()
  })

  test("tab Nội bộ: có Manager, Staff và tác vụ tự động của hệ thống, không có khách", async () => {
    await renderOnInternalTab()
    await screen.findByText("Nhắc hạn hợp đồng (còn 7 ngày)")
    const table = screen.getByRole("table")
    expect(within(table).getAllByText("MANAGER").length).toBeGreaterThan(0)
    expect(within(table).getAllByText("STAFF").length).toBeGreaterThan(0)
    expect(within(table).queryByText("CUSTOMER")).not.toBeInTheDocument()
  })

  test("Xuất CSV theo tab đang xem, tên file ghi rõ loại nhật ký", async () => {
    const user = userEvent.setup()
    render(<AuditLogPanel />)
    await screen.findByRole("tab", { name: "Khách hàng 2" })
    await user.click(screen.getByRole("button", { name: /xuất csv/i }))
    const [filename, csv] = vi.mocked(downloadCsv).mock.calls[0]
    expect(filename).toMatch(/^nhat-ky-khach-hang-/)
    expect(csv.split("\r\n")).toHaveLength(3)
  })
})

describe("AuditLogPanel: nhật ký hoạt động khớp bảng ActivityLog (US-30)", () => {
  test("cột Thời gian, Người thực hiện, Hành động, Mô tả, IP; tác vụ tự động ghi là Hệ thống", async () => {
    await renderOnInternalTab()
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
    await renderOnInternalTab()
    await screen.findByText("Nhắc hạn hợp đồng (còn 7 ngày)")
    expect(
      within(screen.getByRole("table")).queryByRole("button")
    ).not.toBeInTheDocument()
  })

  test("lọc theo người và theo loại hành động", async () => {
    const user = userEvent.setup()
    await renderOnInternalTab()
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
    await renderOnInternalTab()
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
    await renderOnInternalTab()
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

describe("AuditLogPanel: phân trang khi có nhiều log", () => {
  async function renderMany() {
    vi.mocked(listActivityLogs).mockResolvedValue(MANY)
    const user = userEvent.setup()
    await renderOnInternalTab()
    await screen.findByText("Người dùng 45")
    return user
  }

  test("mặc định 10 dòng mỗi trang, ghi rõ đang xem dòng nào trong tổng số", async () => {
    await renderMany()
    expect(bodyRows()).toHaveLength(10)
    const nav = screen.getByRole("navigation", { name: "Phân trang" })
    expect(nav).toHaveTextContent("Hiển thị 1 – 10 trong tổng số 45 bản ghi")
    expect(
      within(nav).getByRole("button", { name: "Trang 1" })
    ).toHaveAttribute("aria-current", "page")
    expect(
      within(nav).getByRole("button", { name: "Trang trước" })
    ).toBeDisabled()
  })

  test("sang trang cuối → còn 5 dòng cũ nhất, nút Trang sau bị khóa", async () => {
    const user = await renderMany()
    const nav = screen.getByRole("navigation", { name: "Phân trang" })
    await user.click(within(nav).getByRole("button", { name: "Trang 5" }))
    expect(bodyRows()).toHaveLength(5)
    expect(screen.getByText("Người dùng 1")).toBeInTheDocument()
    expect(nav).toHaveTextContent("Hiển thị 41 – 45")
    expect(
      within(nav).getByRole("button", { name: "Trang sau" })
    ).toBeDisabled()
  })

  test("đổi số dòng mỗi trang → về trang 1, hiện đủ", async () => {
    const user = await renderMany()
    await user.click(screen.getByRole("button", { name: "Trang sau" }))
    await user.selectOptions(
      screen.getByRole("combobox", { name: /số dòng mỗi trang/i }),
      "50"
    )
    expect(bodyRows()).toHaveLength(45)
    expect(
      screen.getByRole("navigation", { name: "Phân trang" })
    ).toHaveTextContent("Hiển thị 1 – 45")
  })

  test("đang ở trang cuối mà lọc lại → quay về trang 1 của kết quả lọc", async () => {
    const user = await renderMany()
    await user.click(screen.getByRole("button", { name: "Trang 5" }))
    await user.selectOptions(
      screen.getByRole("combobox", { name: /hành động/i }),
      "LOGIN_SUCCESS"
    )
    // Lọc xong vẫn còn 44 dòng (5 trang): phải về trang 1 chứ không đứng lại trang 5
    expect(bodyRows()).toHaveLength(10)
    expect(screen.getByText("Người dùng 45")).toBeInTheDocument()
    expect(
      screen.getByRole("navigation", { name: "Phân trang" })
    ).toHaveTextContent("Hiển thị 1 – 10 trong tổng số 44")
  })

  test("Xuất CSV xuất toàn bộ kết quả lọc, không chỉ trang đang xem", async () => {
    const user = await renderMany()
    await user.click(screen.getByRole("button", { name: /xuất csv/i }))
    const [, csv] = vi.mocked(downloadCsv).mock.calls[0]
    expect(csv.split("\r\n")).toHaveLength(46)
  })
})
