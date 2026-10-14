import { describe, expect, test } from "vitest"

import {
  mockCollectPenalty,
  mockListReservations,
  mockRenewAtCounter,
} from "./checkinApi.mock"

// US-20: luồng mock end-to-end cho HĐ quá hạn 104 (HD-CG-8812).
describe("checkinApi.mock: thu phạt & gia hạn tại quầy (US-20)", () => {
  test("HĐ 104 ban đầu: OVERDUE, còn 150.000đ phạt chưa nộp", async () => {
    const items = await mockListReservations()
    const overdue = items.find((item) => item.reservationId === 104)
    expect(overdue?.contractStatus).toBe("OVERDUE")
    expect(overdue?.overdueDays).toBe(3)
    expect(overdue?.unpaidPenaltyAmount).toBe(150_000)
  })

  test("còn phạt UNPAID → không thể gia hạn tại quầy", async () => {
    await expect(
      mockRenewAtCounter(104, { months: 3, paymentMethod: "CASH" })
    ).rejects.toThrow(/unpaid overdue penalties/i)
  })

  test("thu phạt → hóa đơn PEN, HĐ vẫn OVERDUE và hết nợ phạt", async () => {
    const result = await mockCollectPenalty(104)
    expect(result.invoiceNumber).toMatch(/^PEN-/)
    expect(result.collectedAmount).toBe(150_000)
    expect(result.contractStatus).toBe("OVERDUE")

    const items = await mockListReservations()
    const overdue = items.find((item) => item.reservationId === 104)
    expect(overdue?.unpaidPenaltyAmount).toBe(0)
  })

  test("gia hạn 3 tháng → HĐ về ACTIVE, hóa đơn EXT, có chiết khấu 5%", async () => {
    const result = await mockRenewAtCounter(104, {
      months: 3,
      paymentMethod: "CASH",
    })
    expect(result.invoiceNumber).toMatch(/^EXT-/)
    expect(result.contractStatus).toBe("ACTIVE")
    expect(result.discountPercent).toBe(5)
    expect(result.amount).toBe(4_275_000)

    const items = await mockListReservations()
    const contract = items.find((item) => item.reservationId === 104)
    expect(contract?.contractStatus).toBe("ACTIVE")
    expect(contract?.overdueDays).toBe(0)
    expect(contract?.unpaidPenaltyAmount).toBe(0)
  })
})
