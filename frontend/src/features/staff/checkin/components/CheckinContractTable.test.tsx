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

const overduePaidItem: StaffReservationItem = {
  ...overdueItem,
  unpaidPenaltyAmount: 0,
}

function renderTable(item: StaffReservationItem) {
  const onCollectPenalty = vi.fn()
  const onRenew = vi.fn()
  const onCheckout = vi.fn()
  const user = userEvent.setup()
  render(
    <CheckinContractTable
      rows={[item]}
      isLoading={false}
      error={undefined}
      onRetry={vi.fn()}
      onOpenDetail={vi.fn()}
      onCheckin={vi.fn()}
      onCheckout={onCheckout}
      onCollectPenalty={onCollectPenalty}
      onRenew={onRenew}
    />
  )
  return { user, onCollectPenalty, onRenew, onCheckout }
}

describe("CheckinContractTable: hành động cho hợp đồng quá hạn", () => {
  test("còn nợ phạt → chỉ hiện nút Thu phạt", () => {
    renderTable(overdueItem)
    expect(
      screen.getByRole("button", { name: /thu phạt/i })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /gia hạn/i })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /trả kho/i })
    ).not.toBeInTheDocument()
  })

  test("bấm Thu phạt → gọi onCollectPenalty kèm đúng HĐ", async () => {
    const { user, onCollectPenalty } = renderTable(overdueItem)
    await user.click(screen.getByRole("button", { name: /thu phạt/i }))
    expect(onCollectPenalty).toHaveBeenCalledTimes(1)
    expect(onCollectPenalty).toHaveBeenCalledWith(overdueItem)
  })

  test("đã trả phạt → hiện nút Gia hạn & Trả kho, không còn Thu phạt", () => {
    renderTable(overduePaidItem)
    expect(screen.getByRole("button", { name: /gia hạn/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /trả kho/i })).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /thu phạt/i })
    ).not.toBeInTheDocument()
  })

  test("bấm Gia hạn → gọi onRenew kèm đúng HĐ", async () => {
    const { user, onRenew } = renderTable(overduePaidItem)
    await user.click(screen.getByRole("button", { name: /gia hạn/i }))
    expect(onRenew).toHaveBeenCalledTimes(1)
    expect(onRenew).toHaveBeenCalledWith(overduePaidItem)
  })

  test("bấm Trả kho → gọi onCheckout kèm đúng HĐ", async () => {
    const { user, onCheckout } = renderTable(overduePaidItem)
    await user.click(screen.getByRole("button", { name: /trả kho/i }))
    expect(onCheckout).toHaveBeenCalledTimes(1)
    expect(onCheckout).toHaveBeenCalledWith(overduePaidItem)
  })
})