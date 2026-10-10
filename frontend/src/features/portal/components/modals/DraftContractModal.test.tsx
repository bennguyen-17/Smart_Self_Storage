import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, test, vi } from "vitest"

import DraftContractModal from "./DraftContractModal"

// US-07 AC: "Chưa tích 2 checkbox → nút thanh toán bị khóa" (BR-09 hàng cấm, BR-18 clickwrap)
const bookingData = {
  unitId: "HN01-1-S01",
  facilityName: "SmartStorage Cầu Giấy (HN-01)",
  startDate: "08/10/2026",
  endDate: "07/11/2026 (30 ngày)",
  estimatedTotalRental: 600_000,
  depositAmount: 500_000,
  isClimate: false,
}

function renderModal() {
  const onProceedToPayment = vi.fn()
  const user = userEvent.setup()
  render(
    <DraftContractModal
      bookingData={bookingData}
      onProceedToPayment={onProceedToPayment}
    />
  )
  return {
    user,
    onProceedToPayment,
    payButton: screen.getByRole("button", { name: /thanh toán cọc/i }),
    prohibitedBox: screen.getByRole("checkbox", { name: /không lưu trữ hàng cấm/i }),
    termsBox: screen.getByRole("checkbox", { name: /đồng ý với các điều khoản/i }),
  }
}

describe("DraftContractModal: 2 xác nhận bắt buộc trước khi thanh toán cọc (US-07)", () => {
  test("mới mở modal: nút thanh toán bị khóa", () => {
    const { payButton } = renderModal()
    expect(payButton).toBeDisabled()
  })

  test.each([
    { name: "chỉ tích cam kết hàng cấm", tick: ["prohibitedBox"] as const },
    { name: "chỉ tích đồng ý điều khoản", tick: ["termsBox"] as const },
  ])("$name → vẫn khóa", async ({ tick }) => {
    const ctx = renderModal()
    for (const box of tick) await ctx.user.click(ctx[box])
    expect(ctx.payButton).toBeDisabled()
  })

  test("tích đủ 2 → mở khóa, bấm thì gọi thanh toán đúng 1 lần", async () => {
    const { user, payButton, prohibitedBox, termsBox, onProceedToPayment } = renderModal()
    await user.click(prohibitedBox)
    await user.click(termsBox)
    expect(payButton).toBeEnabled()
    await user.click(payButton)
    expect(onProceedToPayment).toHaveBeenCalledTimes(1)
  })

  test("bỏ tích 1 ô sau khi đã tích đủ → khóa lại", async () => {
    const { user, payButton, prohibitedBox, termsBox } = renderModal()
    await user.click(prohibitedBox)
    await user.click(termsBox)
    await user.click(prohibitedBox)
    expect(payButton).toBeDisabled()
  })

  test("chính sách hủy cọc hiển thị mốc 4 ngày theo BR-17", () => {
    renderModal()
    expect(screen.getByText(/từ 4 ngày trở lên/i)).toBeInTheDocument()
    expect(screen.getByText(/dưới 4 ngày/i)).toBeInTheDocument()
  })
})
