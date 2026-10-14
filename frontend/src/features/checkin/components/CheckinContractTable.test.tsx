import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, test, vi } from "vitest"

import type { StaffReservationItem } from "../types"
import CheckinContractTable from "./CheckinContractTable"

// US-20: HĐ OVERDUE phải có 2 nút "Thu phạt" & "Gia hạn" ở cột Trạng thái.
const overdueItem: StaffReservationItem = {
  reservationId: 104,
  reservationCode: "HD-CG-8812",
  customerName: "Lê Văn C",
  customerIdNumber: "079199005544",
  customerEmail: "c.le@gmail.com",
  customerPhone: "0938 222 111",
  unitCode: "F1-M102",
  floorName: "Tầng 1",
  reservationStatus: "CONFIRMED",
  checkInDate: "2026-09-06",
  endDate: "2026-10-06",
  rentalDuration: "1 tháng",
  overdueDays: 3,
  unpaidPenaltyAmount: 150_000,
  monthlyPrice: 1_500_000,
  contractStatus: "OVERDUE",
  depStatus: "PAID",
  depPaymentStatus: "SUCCESS",
  depAmount: 2_000_000,
  depPaidAmount: 2_000_000,
  depRemainingAmount: 0,
}

function renderTable(item: StaffReservationItem) {
  const onCollectPenalty = vi.fn()
  const onRenew = vi.fn()
  const user = userEvent.setup()
  render(
    <CheckinContractTable
      rows={[item]}
      isLoading={false}
      error={undefined}
      onRetry={vi.fn()}
      onOpenDetail={vi.fn()}
      onCheckin={vi.fn()}
      onCheckout={vi.fn()}
      onCollectPenalty={onCollectPenalty}
      onRenew={onRenew}
    />
  )
  return { user, onCollectPenalty, onRenew }
}

describe("CheckinContractTable: hành động cho HĐ OVERDUE (US-20)", () => {
  test("hiển thị nút Thu phạt & Gia hạn", () => {
    renderTable(overdueItem)
    expect(
      screen.getByRole("button", { name: /thu phạt/i })
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /gia hạn/i })).toBeInTheDocument()
  })

  test("bấm Thu phạt → gọi onCollectPenalty kèm đúng HĐ", async () => {
    const { user, onCollectPenalty } = renderTable(overdueItem)
    await user.click(screen.getByRole("button", { name: /thu phạt/i }))
    expect(onCollectPenalty).toHaveBeenCalledTimes(1)
    expect(onCollectPenalty).toHaveBeenCalledWith(overdueItem)
  })

  test("bấm Gia hạn → gọi onRenew kèm đúng HĐ", async () => {
    const { user, onRenew } = renderTable(overdueItem)
    await user.click(screen.getByRole("button", { name: /gia hạn/i }))
    expect(onRenew).toHaveBeenCalledTimes(1)
    expect(onRenew).toHaveBeenCalledWith(overdueItem)
  })
})
