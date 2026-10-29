// Dữ liệu mẫu hợp đồng của cơ sở HN-01, dùng khi VITE_USE_MOCK=true. Ngày tính theo "hôm nay".

import { addDays, todayInVietnam } from "@/lib/format"

import type { FacilityContract } from "../types"

const LATENCY = 300

function build(): FacilityContract[] {
  const t = todayInVietnam()
  const iso = (offset: number) => `${addDays(t, offset)}T09:00:00`
  return [
    { contractId: 101, contractCode: "CTR-HN01-0101", customerName: "Nguyễn Văn An", customerPhone: "0912345678", unitCode: "HN01-G-XL02", startDate: addDays(t, -60), endDate: addDays(t, 30), status: "ACTIVE", depositAmount: 3_000_000, checkoutStage: "NONE", fees: [] },
    { contractId: 102, contractCode: "CTR-HN01-0102", customerName: "Trần Thị Bích", customerPhone: "0987654321", unitCode: "HN01-F1-S03", startDate: addDays(t, -90), endDate: addDays(t, 5), status: "ACTIVE", depositAmount: 500_000, checkoutStage: "NONE", fees: [] },
    { contractId: 103, contractCode: "CTR-HN01-0103", customerName: "Đỗ Thị Thu", customerPhone: "0918777888", unitCode: "HN01-F1-M02", startDate: addDays(t, -120), endDate: addDays(t, -12), status: "OVERDUE", depositAmount: 1_000_000, checkoutStage: "NONE",
      fees: [{ paymentId: 7001, invoiceNumber: "PEN-7001", type: "PEN", amount: 600_000, status: "UNPAID", issuedAt: iso(-5) }] },
    { contractId: 104, contractCode: "CTR-HN01-0104", customerName: "Lê Hoàng Nam", customerPhone: "0977445566", unitCode: "HN01-F1-L01", startDate: addDays(t, -180), endDate: addDays(t, -1), status: "ACTIVE", depositAmount: 2_000_000, checkoutStage: "INSPECTED",
      fees: [{ paymentId: 7002, invoiceNumber: "CMP-7002", type: "CMP", amount: 450_000, status: "UNPAID", issuedAt: iso(-1) }] },
    { contractId: 105, contractCode: "CTR-HN01-0105", customerName: "Phạm Quốc Hùng", customerPhone: "0988123456", unitCode: "HN01-G-XL03", startDate: addDays(t, 2), endDate: addDays(t, 92), status: "PENDING_CHECKIN", depositAmount: 3_000_000, checkoutStage: "NONE", fees: [] },
    { contractId: 106, contractCode: "CTR-HN01-0106", customerName: "Vũ Thị Hương", customerPhone: "0945666777", unitCode: "HN01-F1-S01", startDate: addDays(t, -200), endDate: addDays(t, -20), status: "TERMINATED", depositAmount: 500_000, checkoutStage: "HANDED_OVER",
      fees: [{ paymentId: 7003, invoiceNumber: "CMP-7003", type: "CMP", amount: 150_000, status: "PAID", issuedAt: iso(-21) }] },
    { contractId: 107, contractCode: "CTR-HN01-0107", customerName: "Công ty SmartRetail", customerPhone: "02439112233", unitCode: "HN01-G-XL01", startDate: addDays(t, -30), endDate: addDays(t, 335), status: "ACTIVE", depositAmount: 3_000_000, checkoutStage: "NONE",
      fees: [{ paymentId: 7004, invoiceNumber: "PEN-7004", type: "PEN", amount: 200_000, status: "UNPAID", issuedAt: iso(-3) }] },
  ]
}

let store = build()

export function mockListFacilityContracts(): Promise<FacilityContract[]> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(store)), LATENCY))
}

/** Chỉ dùng trong test */
export function resetFacilityContractsMock() {
  store = build()
}
