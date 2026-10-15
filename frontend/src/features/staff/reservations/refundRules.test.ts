import { describe, expect, test } from "vitest"

import {
  EVIDENCE_URL_MAX,
  formatBankAccount,
  getRefundBlockers,
  isValidEvidenceLink,
  type RefundFormInput,
} from "./refundRules"

const LINK = "https://drive.google.com/file/d/1AbC/view"
const FULL: RefundFormInput = {
  paymentId: 61,
  bankAccount: "0011004567890 (Vietcombank) - Nguyễn Hoàng Mai",
  evidenceUrl: LINK,
  transactionRef: "FT2610028891",
  staffName: "Nguyễn Văn Nhân Viên 1",
}

describe("getRefundBlockers: chỉ cho xác nhận hoàn cọc khi đủ dữ liệu thật", () => {
  test.each([
    { name: "đủ thông tin, biên lai là link", input: FULL, expected: [] },
    { name: "không có phiếu hoàn tiền (paymentId)", input: { ...FULL, paymentId: null }, expected: ["PAYMENT"] },
    { name: "thiếu số tài khoản (null)", input: { ...FULL, bankAccount: null }, expected: ["BANK_ACCOUNT"] },
    { name: "số tài khoản chỉ toàn dấu cách", input: { ...FULL, bankAccount: "   " }, expected: ["BANK_ACCOUNT"] },
    { name: "chưa có biên lai", input: { ...FULL, evidenceUrl: "" }, expected: ["EVIDENCE"] },
    { name: "biên lai không phải link", input: { ...FULL, evidenceUrl: "bien-lai.png" }, expected: ["EVIDENCE_LINK"] },
    // Chạy thật: BE chỉ lưu link 255 ký tự, nên ảnh data URL bị chặn; demo thì cho phép
    {
      name: "ảnh data URL khi chạy thật",
      input: { ...FULL, evidenceUrl: "data:image/png;base64,AAAA" },
      expected: ["EVIDENCE_LINK"],
    },
    {
      name: "ảnh data URL khi demo",
      input: { ...FULL, evidenceUrl: "data:image/png;base64,AAAA", allowDataUrl: true },
      expected: [],
    },
    // Mã giao dịch là TÙY CHỌN: thiếu vẫn được xác nhận
    { name: "chưa nhập mã giao dịch (tùy chọn)", input: { ...FULL, transactionRef: "" }, expected: [] },
    { name: "không có trường mã giao dịch", input: { ...FULL, transactionRef: undefined }, expected: [] },
    { name: "chưa đăng nhập (không có tên nhân viên)", input: { ...FULL, staffName: undefined }, expected: ["STAFF"] },
    {
      name: "mới mở form, thiếu hết",
      input: { paymentId: null, bankAccount: null, evidenceUrl: "", transactionRef: "", staffName: null },
      expected: ["PAYMENT", "BANK_ACCOUNT", "EVIDENCE", "STAFF"],
    },
  ])("$name → $expected", ({ input, expected }) => {
    expect(getRefundBlockers(input)).toEqual(expected)
  })
})

describe("isValidEvidenceLink: link biên lai lưu được vào BE", () => {
  const base = "https://x.vn/"
  test.each([
    { name: "https", value: LINK, ok: true },
    { name: "http", value: "http://bank.vn/receipt/123", ok: true },
    { name: "có khoảng trắng 2 đầu", value: `  ${LINK}  `, ok: true },
    { name: "đúng 255 ký tự", value: base + "a".repeat(EVIDENCE_URL_MAX - base.length), ok: true },
    { name: "256 ký tự", value: base + "a".repeat(EVIDENCE_URL_MAX - base.length + 1), ok: false },
    { name: "thiếu http", value: "drive.google.com/abc", ok: false },
    { name: "có khoảng trắng ở giữa", value: "https://x.vn/a b", ok: false },
    { name: "chỉ có https://", value: "https://", ok: false },
    { name: "data URL", value: "data:image/png;base64,AAAA", ok: false },
  ])("$name → $ok", ({ value, ok }) => {
    expect(isValidEvidenceLink(value)).toBe(ok)
  })
})

describe("formatBankAccount: hiển thị tài khoản nhận hoàn cọc, không bịa khi thiếu", () => {
  test.each([
    { input: ["0011004567890", "Vietcombank", "Nguyễn Hoàng Mai"], expected: "0011004567890 (Vietcombank) - Nguyễn Hoàng Mai" },
    { input: ["0011004567890", null, null], expected: "0011004567890" },
    { input: ["0011004567890", " ", "Mai"], expected: "0011004567890 - Mai" },
    { input: [null, "Vietcombank", "Mai"], expected: null },
    { input: ["  ", "Vietcombank", "Mai"], expected: null },
  ] as const)("$input → $expected", ({ input, expected }) => {
    expect(formatBankAccount(input[0], input[1], input[2])).toBe(expected)
  })
})
