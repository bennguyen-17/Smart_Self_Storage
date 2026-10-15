import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

// Giả lập apiClient để kiểm FE gọi đúng method, path, header, body mà không cần BE
const env = vi.hoisted(() => ({ mockMode: false }))
const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock("@/lib/apiClient", () => ({ default: http, isMockMode: () => env.mockMode }))

const { confirmRefundPayment, listPendingRefunds } = await import("./refundApi")
const { resetReservationsMock } = await import("./reservationApi.mock")

const LINK = "https://drive.google.com/file/d/1AbC/view"

beforeEach(() => {
  env.mockMode = false
  http.get.mockReset().mockResolvedValue([])
  http.post.mockReset().mockResolvedValue({ success: true, message: "ok" })
  localStorage.setItem("user", JSON.stringify({ id: 5, fullName: "Nguyễn Văn Nhân Viên 1", role: "STAFF" }))
  resetReservationsMock()
})
afterEach(() => localStorage.clear())

describe("refundApi: gọi đúng API hoàn tiền của BE", () => {
  test("danh sách chờ hoàn: GET /staff/refunds?status=PENDING", async () => {
    await listPendingRefunds()
    expect(http.get).toHaveBeenCalledWith("/staff/refunds", { params: { status: "PENDING" } })
  })

  test("xác nhận: POST theo paymentId, kèm header nhân viên, bỏ khoảng trắng thừa", async () => {
    await confirmRefundPayment(61, { evidenceUrl: `  ${LINK} `, transactionRef: "  FT2610028891 " })
    expect(http.post).toHaveBeenCalledWith(
      "/staff/settlements/61/confirm-refund",
      { evidenceUrl: LINK, transactionRef: "FT2610028891" },
      { headers: { "X-Account-Id": "5" } }
    )
  })

  test("không nhập mã giao dịch → không gửi trường transactionRef", async () => {
    await confirmRefundPayment(61, { evidenceUrl: LINK, transactionRef: "   " })
    expect(http.post).toHaveBeenCalledWith(
      "/staff/settlements/61/confirm-refund",
      { evidenceUrl: LINK },
      expect.anything()
    )
  })

  test("chế độ mock: không gọi mạng; xác nhận xong thì phiếu rời khỏi danh sách chờ", async () => {
    env.mockMode = true
    const before = await listPendingRefunds()
    expect(before.length).toBeGreaterThan(0)
    await confirmRefundPayment(before[0].paymentId, { evidenceUrl: LINK })
    const after = await listPendingRefunds()
    expect(after.map((r) => r.paymentId)).not.toContain(before[0].paymentId)
    expect(http.get).not.toHaveBeenCalled()
    expect(http.post).not.toHaveBeenCalled()
  })
})
