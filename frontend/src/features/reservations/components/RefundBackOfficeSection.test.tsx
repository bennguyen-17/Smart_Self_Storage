import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import type { Reservation } from "../types"
import RefundBackOfficeSection from "./RefundBackOfficeSection"

// Giả lập API và cờ mock để test không gọi mạng
const env = vi.hoisted(() => ({ mockMode: false }))
const { confirmRefund } = vi.hoisted(() => ({ confirmRefund: vi.fn() }))
vi.mock("@/lib/apiClient", () => ({ default: {}, isMockMode: () => env.mockMode }))
vi.mock("../api/reservationApi", () => ({ confirmRefund }))

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
  status: "CANCELED",
  cancelReason: "CUSTOMER_REQUEST",
  forfeitedAmount: 500_000,
  refundAmount: 500_000,
  refundStatus: "PENDING",
  bankAccount: "190367891234 (Techcombank) - Lý Hải Phong",
  canceledAt: "2026-10-11T00:00:00.000Z",
  createdAt: "2026-10-05T00:00:00.000Z",
}

const STAFF = { fullName: "Nguyễn Văn Nhân Viên 1", role: "STAFF" }

function renderSection(reservation: Reservation) {
  const onRefundSuccess = vi.fn()
  const user = userEvent.setup()
  render(<RefundBackOfficeSection reservation={reservation} onRefundSuccess={onRefundSuccess} />)
  const confirmButton = () =>
    screen.queryByRole("button", { name: /xác nhận đã chuyển khoản/i })
  return { user, onRefundSuccess, confirmButton }
}

beforeEach(() => {
  env.mockMode = false
  confirmRefund.mockReset()
  confirmRefund.mockResolvedValue({ ...PENDING, refundStatus: "REFUNDED" })
  localStorage.setItem("user", JSON.stringify(STAFF))
})

afterEach(() => {
  localStorage.clear()
})

describe("RefundBackOfficeSection khi chờ hoàn tiền: không dùng dữ liệu giả", () => {
  test("khách chưa có STK → báo thiếu rõ ràng, KHÔNG hiện STK mẫu, nút bị khóa", () => {
    const { confirmButton } = renderSection({ ...PENDING, bankAccount: null })
    expect(screen.getByText(/chưa có số tài khoản\. liên hệ khách/i)).toBeInTheDocument()
    expect(screen.queryByText(/190367891234/)).not.toBeInTheDocument()
    expect(confirmButton()).toBeDisabled()
  })

  test("tên nhân viên lấy từ phiên đăng nhập và không sửa được", () => {
    renderSection(PENDING)
    const staff = screen.getByLabelText(/nhân viên thực hiện/i)
    expect(staff).toHaveValue(STAFF.fullName)
    expect(staff).toHaveAttribute("readonly")
  })

  test("chưa đăng nhập → hiện 'Chưa đăng nhập' và chặn xác nhận", () => {
    localStorage.clear()
    const { confirmButton } = renderSection(PENDING)
    expect(screen.getByLabelText(/nhân viên thực hiện/i)).toHaveValue("Chưa đăng nhập")
    expect(screen.getByText(/chưa xác định nhân viên thực hiện/i)).toBeInTheDocument()
    expect(confirmButton()).toBeDisabled()
  })

  test("mã giao dịch để trống, không điền sẵn mã giả, và là ô tùy chọn", () => {
    renderSection(PENDING)
    const ref = screen.getByLabelText(/mã giao dịch ngân hàng \(tùy chọn\)/i)
    expect(ref).toHaveValue("")
    expect(ref).not.toHaveAttribute("aria-required")
  })

  test("đủ STK + biên lai + nhân viên → mở khóa, KHÔNG cần mã giao dịch", async () => {
    const { user, confirmButton } = renderSection(PENDING)
    expect(confirmButton()).toBeDisabled()
    const file = new File(["fake-image"], "bien-lai.png", { type: "image/png" })
    await user.upload(screen.getByLabelText(/tải lên ảnh chụp biên lai/i), file)
    expect(await screen.findByText(/đã chọn ảnh biên lai/i)).toBeInTheDocument()
    expect(confirmButton()).toBeEnabled()

    await user.click(confirmButton()!)
    expect(confirmRefund).toHaveBeenCalledWith(PENDING.reservationCode, {
      evidenceUrl: expect.stringMatching(/^data:image\/png;base64,/),
      note: undefined,
      staffName: STAFF.fullName,
    })
  })

  test("có nhập mã giao dịch → gửi kèm (đã bỏ khoảng trắng thừa)", async () => {
    const { user, confirmButton, onRefundSuccess } = renderSection(PENDING)

    const file = new File(["fake-image"], "bien-lai.png", { type: "image/png" })
    await user.upload(screen.getByLabelText(/tải lên ảnh chụp biên lai/i), file)
    expect(await screen.findByText(/đã chọn ảnh biên lai/i)).toBeInTheDocument()

    await user.type(screen.getByLabelText(/mã giao dịch ngân hàng/i), "  FT2610028891  ")
    expect(confirmButton()).toBeEnabled()

    await user.click(confirmButton()!)
    expect(confirmRefund).toHaveBeenCalledTimes(1)
    expect(confirmRefund).toHaveBeenCalledWith(PENDING.reservationCode, {
      evidenceUrl: expect.stringMatching(/^data:image\/png;base64,/),
      note: "FT2610028891",
      staffName: STAFF.fullName,
    })
    expect(onRefundSuccess).toHaveBeenCalledTimes(1)
  })

  test.each([
    { mockMode: false, visible: false },
    { mockMode: true, visible: true },
  ])("nút 'ảnh biên lai mẫu' chỉ hiện khi demo mock (mockMode=$mockMode)", ({ mockMode, visible }) => {
    env.mockMode = mockMode
    renderSection(PENDING)
    const sample = screen.queryByRole("button", { name: /ảnh biên lai mẫu/i })
    expect(Boolean(sample)).toBe(visible)
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
