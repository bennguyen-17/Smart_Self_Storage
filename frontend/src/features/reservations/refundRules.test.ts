import { describe, expect, test } from "vitest"

import { getRefundBlockers, type RefundFormInput } from "./refundRules"

const FULL: RefundFormInput = {
  bankAccount: "0011004567890 (Vietcombank) - Nguyễn Hoàng Mai",
  evidenceUrl: "data:image/png;base64,AAAA",
  transactionRef: "FT2610028891",
  staffName: "Nguyễn Văn Nhân Viên 1",
}

describe("getRefundBlockers: chỉ cho xác nhận hoàn cọc khi đủ dữ liệu thật", () => {
  test.each([
    { name: "đủ cả 4 thông tin", input: FULL, expected: [] },
    { name: "thiếu số tài khoản (null)", input: { ...FULL, bankAccount: null }, expected: ["BANK_ACCOUNT"] },
    { name: "số tài khoản chỉ toàn dấu cách", input: { ...FULL, bankAccount: "   " }, expected: ["BANK_ACCOUNT"] },
    { name: "chưa có ảnh biên lai", input: { ...FULL, evidenceUrl: "" }, expected: ["EVIDENCE"] },
    // Mã giao dịch là TÙY CHỌN: thiếu vẫn được xác nhận
    { name: "chưa nhập mã giao dịch (tùy chọn)", input: { ...FULL, transactionRef: "" }, expected: [] },
    { name: "không có trường mã giao dịch", input: { ...FULL, transactionRef: undefined }, expected: [] },
    { name: "chưa đăng nhập (không có tên nhân viên)", input: { ...FULL, staffName: undefined }, expected: ["STAFF"] },
    {
      name: "mới mở form, khách chưa có STK, chưa đăng nhập",
      input: { bankAccount: null, evidenceUrl: "", transactionRef: "", staffName: null },
      expected: ["BANK_ACCOUNT", "EVIDENCE", "STAFF"],
    },
  ])("$name → $expected", ({ input, expected }) => {
    expect(getRefundBlockers(input)).toEqual(expected)
  })
})
