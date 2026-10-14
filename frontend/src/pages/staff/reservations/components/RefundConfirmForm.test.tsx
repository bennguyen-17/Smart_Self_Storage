import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import RefundConfirmForm, { type RefundConfirmFormProps } from "./RefundConfirmForm"

// Giả lập API và cờ mock để test không gọi mạng
const env = vi.hoisted(() => ({ mockMode: false }))
const { confirmRefundPayment } = vi.hoisted(() => ({ confirmRefundPayment: vi.fn() }))
vi.mock("@/lib/apiClient", () => ({ default: {}, isMockMode: () => env.mockMode }))
vi.mock("../api/refundApi", () => ({ confirmRefundPayment }))

const STAFF = { id: 5, fullName: "Nguyễn Văn Nhân Viên 1", role: "STAFF" }
const LINK = "https://drive.google.com/file/d/1AbC/view"
const BASE: Omit<RefundConfirmFormProps, "onConfirmed"> = {
  paymentId: 61,
  refundAmount: 500_000,
  bankAccount: "190367891234 (Techcombank) - Lý Hải Phong",
}

function renderForm(props: Partial<RefundConfirmFormProps> = {}) {
  const onConfirmed = vi.fn()
  const user = userEvent.setup()
  render(<RefundConfirmForm {...BASE} onConfirmed={onConfirmed} {...props} />)
  const confirmButton = () => screen.getByRole("button", { name: /xác nhận đã chuyển khoản/i })
  const linkInput = () => screen.getByLabelText(/link biên lai chuyển khoản/i)
  return { user, onConfirmed, confirmButton, linkInput }
}

beforeEach(() => {
  env.mockMode = false
  confirmRefundPayment.mockReset().mockResolvedValue(undefined)
  localStorage.setItem("user", JSON.stringify(STAFF))
})
afterEach(() => localStorage.clear())

describe("RefundConfirmForm: không dùng dữ liệu giả, chỉ xác nhận khi đủ dữ liệu thật", () => {
  test("khách chưa có STK → báo thiếu rõ ràng, KHÔNG hiện STK mẫu, nút bị khóa", () => {
    const { confirmButton } = renderForm({ bankAccount: null })
    expect(screen.getByText(/chưa có số tài khoản\. liên hệ khách/i)).toBeInTheDocument()
    expect(screen.queryByText(/190367891234/)).not.toBeInTheDocument()
    expect(confirmButton()).toBeDisabled()
  })

  test("không có phiếu hoàn tiền (paymentId) → báo thiếu và khóa nút", async () => {
    const { user, confirmButton, linkInput } = renderForm({ paymentId: null })
    await user.type(linkInput(), LINK)
    expect(screen.getByText(/chưa có phiếu hoàn tiền/i)).toBeInTheDocument()
    expect(confirmButton()).toBeDisabled()
  })

  test("tên nhân viên lấy từ phiên đăng nhập và không sửa được", () => {
    renderForm()
    const staff = screen.getByLabelText(/nhân viên thực hiện/i)
    expect(staff).toHaveValue(STAFF.fullName)
    expect(staff).toHaveAttribute("readonly")
  })

  test("chưa đăng nhập → hiện 'Chưa đăng nhập' và chặn xác nhận", () => {
    localStorage.clear()
    const { confirmButton } = renderForm()
    expect(screen.getByLabelText(/nhân viên thực hiện/i)).toHaveValue("Chưa đăng nhập")
    expect(screen.getByText(/chưa xác định nhân viên thực hiện/i)).toBeInTheDocument()
    expect(confirmButton()).toBeDisabled()
  })

  test("mã giao dịch để trống, không điền sẵn mã giả, và là ô tùy chọn", () => {
    renderForm()
    const ref = screen.getByLabelText(/mã giao dịch ngân hàng \(tùy chọn\)/i)
    expect(ref).toHaveValue("")
    expect(ref).not.toHaveAttribute("aria-required")
  })
})

describe("RefundConfirmForm khi chạy thật: biên lai là link (BE chỉ lưu 255 ký tự)", () => {
  test("không có ô chọn file và không có ảnh mẫu", () => {
    renderForm()
    expect(screen.queryByLabelText(/chọn ảnh biên lai/i)).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /ảnh biên lai mẫu/i })).not.toBeInTheDocument()
  })

  test("link sai định dạng → báo lỗi link và khóa nút", async () => {
    const { user, confirmButton, linkInput } = renderForm()
    await user.type(linkInput(), "drive.google.com/abc")
    expect(screen.getByText(/link biên lai phải bắt đầu bằng http/i)).toBeInTheDocument()
    expect(confirmButton()).toBeDisabled()
  })

  test("dán link hợp lệ → mở khóa, KHÔNG cần mã giao dịch; xác nhận theo paymentId", async () => {
    const { user, confirmButton, linkInput, onConfirmed } = renderForm()
    expect(confirmButton()).toBeDisabled()
    await user.type(linkInput(), LINK)
    expect(confirmButton()).toBeEnabled()
    await user.click(confirmButton())
    expect(confirmRefundPayment).toHaveBeenCalledWith(61, { evidenceUrl: LINK, transactionRef: "" })
    expect(onConfirmed).toHaveBeenCalledTimes(1)
  })

  test("có nhập mã giao dịch → chuyển cho lớp API", async () => {
    const { user, confirmButton, linkInput } = renderForm()
    await user.type(linkInput(), LINK)
    await user.type(screen.getByLabelText(/mã giao dịch ngân hàng/i), "FT2610028891")
    await user.click(confirmButton())
    expect(confirmRefundPayment).toHaveBeenCalledWith(61, { evidenceUrl: LINK, transactionRef: "FT2610028891" })
  })

  test("BE báo lỗi → hiện lỗi, không báo thành công", async () => {
    confirmRefundPayment.mockRejectedValue(new Error("Không tìm thấy hóa đơn hoàn tiền hợp lệ!"))
    const { user, confirmButton, linkInput, onConfirmed } = renderForm()
    await user.type(linkInput(), LINK)
    await user.click(confirmButton())
    expect(await screen.findByRole("alert")).toHaveTextContent(/không tìm thấy hóa đơn hoàn tiền/i)
    expect(onConfirmed).not.toHaveBeenCalled()
  })
})

describe("RefundConfirmForm khi demo: cho chọn ảnh từ máy", () => {
  test("chọn file ảnh → mở khóa và gửi ảnh data URL", async () => {
    env.mockMode = true
    const { user, confirmButton } = renderForm()
    const file = new File(["fake-image"], "bien-lai.png", { type: "image/png" })
    await user.upload(screen.getByLabelText(/chọn ảnh biên lai/i), file)
    expect(await screen.findByText(/đã chọn ảnh biên lai/i)).toBeInTheDocument()
    expect(confirmButton()).toBeEnabled()
    await user.click(confirmButton())
    expect(confirmRefundPayment).toHaveBeenCalledWith(61, {
      evidenceUrl: expect.stringMatching(/^data:image\/png;base64,/),
      transactionRef: "",
    })
  })

  test("có nút ảnh biên lai mẫu", () => {
    env.mockMode = true
    renderForm()
    expect(screen.getByRole("button", { name: /ảnh biên lai mẫu/i })).toBeInTheDocument()
  })
})
