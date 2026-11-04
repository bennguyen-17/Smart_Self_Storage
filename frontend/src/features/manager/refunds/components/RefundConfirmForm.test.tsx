import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import RefundConfirmForm, { type RefundConfirmFormProps } from "./RefundConfirmForm"

// Giả lập API và cờ mock để test không gọi mạng
const env = vi.hoisted(() => ({ mockMode: false }))
const { confirmRefund } = vi.hoisted(() => ({ confirmRefund: vi.fn() }))
vi.mock("@/lib/apiClient", () => ({ default: {}, isMockMode: () => env.mockMode }))
vi.mock("../api/refundApi", () => ({ confirmRefund }))
// Quầy gửi ảnh chung: giả lập BE trả mã ảnh
const images = vi.hoisted(() => ({ uploadImage: vi.fn() }))
vi.mock("@/components/internal/images/imageApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/components/internal/images/imageApi")>()),
  uploadImage: images.uploadImage,
}))

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
  confirmRefund.mockReset().mockResolvedValue(undefined)
  images.uploadImage.mockReset().mockResolvedValue({ imageId: 41, url: "/api/images/41" })
  vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:preview"), revokeObjectURL: vi.fn() }))
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
  test("có nút tải ảnh biên lai, không có ảnh mẫu; link biên lai là cách dự phòng", () => {
    renderForm()
    expect(screen.getByLabelText(/chọn ảnh biên lai chuyển khoản/i)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /ảnh biên lai mẫu/i })).not.toBeInTheDocument()
    expect(screen.getByText(/không tải được ảnh\? dán link biên lai/i)).toBeInTheDocument()
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
    expect(confirmRefund).toHaveBeenCalledWith(61, { receiptImageId: null, evidenceUrl: LINK, transactionRef: "" })
    expect(onConfirmed).toHaveBeenCalledTimes(1)
  })

  test("có nhập mã giao dịch → chuyển cho lớp API", async () => {
    const { user, confirmButton, linkInput } = renderForm()
    await user.type(linkInput(), LINK)
    await user.type(screen.getByLabelText(/mã giao dịch ngân hàng/i), "FT2610028891")
    await user.click(confirmButton())
    expect(confirmRefund).toHaveBeenCalledWith(61, { receiptImageId: null, evidenceUrl: LINK, transactionRef: "FT2610028891" })
  })

  test("BE báo lỗi → hiện lỗi, không báo thành công", async () => {
    confirmRefund.mockRejectedValue(new Error("Không tìm thấy hóa đơn hoàn tiền hợp lệ!"))
    const { user, confirmButton, linkInput, onConfirmed } = renderForm()
    await user.type(linkInput(), LINK)
    await user.click(confirmButton())
    expect(await screen.findByRole("alert")).toHaveTextContent(/không tìm thấy hóa đơn hoàn tiền/i)
    expect(onConfirmed).not.toHaveBeenCalled()
  })
})

describe("RefundConfirmForm: ảnh biên lai chuyển khoản (cách chính)", () => {
  test("tải ảnh biên lai → mở khóa, gửi receiptImageId; ô dán link ẩn đi", async () => {
    const { user, confirmButton } = renderForm()
    expect(confirmButton()).toBeDisabled()
    await user.upload(screen.getByLabelText(/chọn ảnh biên lai/i), new File(["x"], "bien-lai.png", { type: "image/png" }))
    expect(images.uploadImage).toHaveBeenCalledWith(expect.any(File), "REFUND_RECEIPT")
    expect(await screen.findByRole("img", { name: "bien-lai.png" })).toBeInTheDocument()
    expect(screen.queryByText(/dán link biên lai/i)).not.toBeInTheDocument()
    expect(confirmButton()).toBeEnabled()
    await user.click(confirmButton())
    expect(confirmRefund).toHaveBeenCalledWith(61, { receiptImageId: 41, evidenceUrl: "", transactionRef: "" })
  })

  test("chỉ được 1 ảnh biên lai: tải xong thì không còn nút thêm ảnh", async () => {
    const { user } = renderForm()
    await user.upload(screen.getByLabelText(/chọn ảnh biên lai/i), new File(["x"], "bien-lai.png", { type: "image/png" }))
    await screen.findByRole("img", { name: "bien-lai.png" })
    expect(screen.queryByLabelText(/chọn ảnh biên lai/i)).not.toBeInTheDocument()
  })

  test("tải ảnh lỗi → báo câu dễ hiểu, vẫn khóa nút", async () => {
    images.uploadImage.mockRejectedValue(new Error("Lỗi hệ thống: could not execute statement [Data too long]"))
    const { user, confirmButton } = renderForm()
    await user.upload(screen.getByLabelText(/chọn ảnh biên lai/i), new File(["x"], "bien-lai.png", { type: "image/png" }))
    expect(await screen.findByText(/Không tải được "bien-lai.png": Nội dung nhập quá dài/)).toBeInTheDocument()
    expect(confirmButton()).toBeDisabled()
  })
})
