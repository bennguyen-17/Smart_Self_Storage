import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, test, vi } from "vitest"

import type { StaffReservationItem } from "../types"
import CheckinContractTable from "./CheckinContractTable"

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

describe("CheckinContractTable: hành động cho hợp đồng quá hạn", () => {
  test("còn nợ phạt → chỉ hiển thị nút Thu phạt", () => {
    renderTable(overdueItem)
    expect(
      screen.getByRole("button", { name: /thu phạt/i })
    ).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /gia hạn/i })).not.toBeInTheDocument()
  })

  test("bấm Thu phạt → gọi onCollectPenalty kèm đúng HĐ", async () => {
    const { user, onCollectPenalty } = renderTable(overdueItem)
    await user.click(screen.getByRole("button", { name: /thu phạt/i }))
    expect(onCollectPenalty).toHaveBeenCalledTimes(1)
    expect(onCollectPenalty).toHaveBeenCalledWith(overdueItem)
  })

  test("đã trả hết phạt → hiển thị nút Gia hạn và Trả kho, bấm Gia hạn gọi onRenew", async () => {
    const paidPenaltyItem: StaffReservationItem = {
      ...overdueItem,
      unpaidPenaltyAmount: 0,
    }
    const { user, onRenew } = renderTable(paidPenaltyItem)
    expect(screen.queryByRole("button", { name: /thu phạt/i })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /trả kho/i })).toBeInTheDocument()
    const renewBtn = screen.getByRole("button", { name: /gia hạn/i })
    expect(renewBtn).toBeInTheDocument()
    await user.click(renewBtn)
    expect(onRenew).toHaveBeenCalledTimes(1)
    expect(onRenew).toHaveBeenCalledWith(paidPenaltyItem)
  })
})
