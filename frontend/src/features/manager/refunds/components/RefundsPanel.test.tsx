import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, test, vi } from "vitest"

import type { ManagerRefund } from "../types"
import RefundsPanel from "./RefundsPanel"

const api = vi.hoisted(() => ({ listRefunds: vi.fn(), confirmRefund: vi.fn() }))
vi.mock("../api/refundApi", () => api)
vi.mock("@/lib/apiClient", () => ({ default: {}, isMockMode: () => false }))
vi.mock("@/hooks/useAuthSession", () => ({ getStoredUser: () => ({ id: 3, fullName: "Trần Văn Quản Lý" }) }))

const PENDING: ManagerRefund = {
  paymentId: 71,
  invoiceNumber: "REF-HN-01-0071",
  contractId: 101,
  reservationCode: "RES-HN-01-8899-K7X2",
  unitCode: "HN01-F1-S03",
  customerName: "Nguyễn Văn An",
  customerPhone: "0912345678",
  refundAmount: 500_000,
  refundBankName: "Vietcombank",
  refundAccountNumber: "0123456789",
  refundAccountName: "NGUYEN VAN AN",
  cancelReason: "CUSTOMER_REQUEST",
  status: "PENDING",
  issuedAt: "2026-10-01T09:00:00",
}
const NO_ACCOUNT: ManagerRefund = {
  ...PENDING,
  paymentId: 72,
  invoiceNumber: "REF-HN-01-0072",
  customerName: "Trần Thị Bích",
  refundAccountNumber: null,
  issuedAt: "2026-10-02T09:00:00",
}

beforeEach(() => {
  api.listRefunds.mockReset().mockResolvedValue([PENDING, NO_ACCOUNT])
  api.confirmRefund.mockReset().mockResolvedValue(undefined)
})

async function renderPanel() {
  const user = userEvent.setup()
  render(<RefundsPanel />)
  await screen.findByText("Nguyễn Văn An")
  return user
}

const row = (text: string) => screen.getByText(text).closest("tr") as HTMLElement

describe("RefundsPanel: Manager hoàn tiền cho khách (US-26)", () => {
  test("mặc định tải phiếu Chờ hoàn; hiện lý do, số tiền, tài khoản nhận; thiếu STK thì báo rõ", async () => {
    await renderPanel()
    expect(api.listRefunds).toHaveBeenCalledWith("PENDING")
    const first = row("Nguyễn Văn An")
    expect(within(first).getByText("Khách hủy cọc")).toBeInTheDocument()
    expect(within(first).getByText(/500\.000/)).toBeInTheDocument()
    expect(within(first).getByText("0123456789 · Vietcombank · NGUYEN VAN AN")).toBeInTheDocument()
    expect(within(row("Trần Thị Bích")).getByText("Khách chưa cung cấp số tài khoản")).toBeInTheDocument()
  })

  test("tổng hợp phiếu chờ và cảnh báo phiếu đã chờ quá 48 giờ", async () => {
    await renderPanel()
    const status = screen.getByRole("status")
    expect(status).toHaveTextContent("2 phiếu chờ hoàn")
    expect(status).toHaveTextContent(/1\.000\.000/)
    expect(status).toHaveTextContent("2 phiếu đã chờ quá 48 giờ")
  })

  test("đổi bộ lọc sang Đã hoàn → tải lại theo trạng thái đó", async () => {
    const user = await renderPanel()
    api.listRefunds.mockResolvedValue([{ ...PENDING, status: "PAID", transactionCode: "FT2610001" }])
    await user.selectOptions(screen.getByRole("combobox", { name: /trạng thái/i }), "REFUNDED")
    expect(api.listRefunds).toHaveBeenLastCalledWith("REFUNDED")
    expect(await screen.findByText("Mã GD: FT2610001")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /xác nhận đã hoàn/i })).not.toBeInTheDocument()
  })

  test("xác nhận: mở popup, nhập biên lai → gọi API của Manager với đúng phiếu, đóng popup và tải lại", async () => {
    const user = await renderPanel()
    await user.click(screen.getByRole("button", { name: "Xác nhận đã hoàn tiền phiếu REF-HN-01-0071" }))
    const dialog = await screen.findByRole("dialog", { name: /hoàn tiền phiếu REF-HN-01-0071/i })
    await user.type(within(dialog).getByLabelText(/link biên lai/i), "https://drive.google.com/bien-lai-71.png")
    await user.click(within(dialog).getByRole("button", { name: /xác nhận/i }))
    expect(api.confirmRefund).toHaveBeenCalledWith(71, {
      evidenceUrl: "https://drive.google.com/bien-lai-71.png",
      transactionRef: "",
    })
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(api.listRefunds).toHaveBeenCalledTimes(2)
  })

  test("không có phiếu chờ → báo rõ, không có bảng tổng hợp", async () => {
    api.listRefunds.mockResolvedValue([])
    render(<RefundsPanel />)
    expect(await screen.findByText("Không có phiếu nào đang chờ hoàn")).toBeInTheDocument()
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  test("lỗi tải → báo lỗi và có nút Thử lại", async () => {
    api.listRefunds.mockRejectedValue(new Error("Network Error"))
    render(<RefundsPanel />)
    expect(await screen.findByText(/không tải được danh sách hoàn tiền/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /thử lại/i })).toBeInTheDocument()
  })
})
