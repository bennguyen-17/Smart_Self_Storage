import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import type { Reservation } from "../types"
import RefundBackOfficeSection from "./RefundBackOfficeSection"

// Giả lập API và cờ mock để test không gọi mạng
const { confirmRefundPayment } = vi.hoisted(() => ({ confirmRefundPayment: vi.fn() }))
vi.mock("@/lib/apiClient", () => ({ default: {}, isMockMode: () => false }))
vi.mock("../api/refundApi", () => ({ confirmRefundPayment }))

const PENDING: Reservation = {
  reservationCode: "RES-TX-1100-C7YU",
  customerName: "Lý Hải Phong",
  customerEmail: "phong.ly@example.com",
  cccd: "001094001100",
  facilityCode: "HN-02",
  facilityName: "SmartStorage Thanh Xuân",
  unitCode: "U-205",
  checkinDate: "2026-10-14",
  depositAmount: 1_000_000,
  status: "CANCELLED",
  cancelReason: "CUSTOMER_REQUEST",
  forfeitedAmount: 500_000,
  refundAmount: 500_000,
  refundStatus: "PENDING",
  refundPaymentId: 9005,
  bankAccount: "190367891234 (Techcombank) - Lý Hải Phong",
  canceledAt: "2026-10-11T00:00:00.000Z",
  createdAt: "2026-10-05T00:00:00.000Z",
}

function renderSection(reservation: Reservation) {
  const onRefundSuccess = vi.fn()
  render(<RefundBackOfficeSection reservation={reservation} onRefundSuccess={onRefundSuccess} />)
  return { onRefundSuccess }
}

beforeEach(() => {
  confirmRefundPayment.mockReset().mockResolvedValue(undefined)
  localStorage.setItem("user", JSON.stringify({ id: 5, fullName: "Nguyễn Văn Nhân Viên 1", role: "STAFF" }))
})
afterEach(() => localStorage.clear())

describe("RefundBackOfficeSection khi chờ hoàn tiền", () => {
  test("xác nhận theo paymentId của phiếu hoàn trong đơn, xong thì báo trang cha", async () => {
    const user = userEvent.setup()
    const { onRefundSuccess } = renderSection(PENDING)
    await user.type(screen.getByLabelText(/link biên lai chuyển khoản/i), "https://drive.google.com/x")
    await user.click(screen.getByRole("button", { name: /xác nhận đã chuyển khoản/i }))
    expect(confirmRefundPayment).toHaveBeenCalledWith(9005, expect.objectContaining({ evidenceUrl: "https://drive.google.com/x" }))
    expect(onRefundSuccess).toHaveBeenCalledTimes(1)
  })

  test("không có refundAmount → tính từ tiền cọc trừ phần bị giữ", () => {
    renderSection({ ...PENDING, refundAmount: null, depositAmount: 1_000_000, forfeitedAmount: 500_000 })
    expect(screen.getByText(/500\.000/)).toBeInTheDocument()
  })
})

describe("RefundBackOfficeSection khi đã hoàn tiền: không bịa biên lai", () => {
  const REFUNDED: Reservation = {
    ...PENDING,
    refundStatus: "REFUNDED",
    refundedAt: "2026-10-12T07:20:00.000Z",
    refundStaffName: null,
    refundNote: null,
  }

  test("thiếu ảnh biên lai → báo chưa có, KHÔNG hiện ảnh mẫu", () => {
    renderSection({ ...REFUNDED, refundEvidenceUrl: null })
    expect(screen.getByText(/chưa có ảnh biên lai trong hồ sơ/i)).toBeInTheDocument()
    expect(screen.queryByRole("img")).not.toBeInTheDocument()
  })

  test("có ảnh biên lai → hiện ảnh để xem phóng to", () => {
    renderSection({ ...REFUNDED, refundEvidenceUrl: "data:image/png;base64,AAAA" })
    expect(screen.getByRole("img", { name: /biên lai chuyển khoản/i })).toBeInTheDocument()
  })

  test("thiếu tên nhân viên / ghi chú → hiện '—', không điền tên giả", () => {
    renderSection({ ...REFUNDED, refundEvidenceUrl: null })
    expect(screen.queryByText(/kế toán back-office/i)).not.toBeInTheDocument()
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2)
  })
})
