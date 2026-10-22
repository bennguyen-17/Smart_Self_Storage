import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, test, vi } from "vitest"

import { addDays, todayInVietnam } from "@/lib/format"

import type { FacilityContract } from "../types"
import CheckoutDebtPanel from "./CheckoutDebtPanel"

vi.mock("@/lib/apiClient", () => ({ default: {}, isMockMode: () => false }))
vi.mock("@/features/manager/unit-management/managerContext", () => ({
  getManagerContext: () => ({ facilityId: 1, accountId: 3, fullName: "Trần Văn Quản Lý", isDemo: false }),
}))

const today = todayInVietnam()
function contract(id: number, customerName: string, patch: Partial<FacilityContract>): FacilityContract {
  return {
    contractId: id,
    contractCode: `CTR-HN01-0${id}`,
    customerName,
    customerPhone: "0912345678",
    unitCode: `HN01-F1-M0${id}`,
    startDate: addDays(today, -120),
    endDate: addDays(today, -5),
    status: "OVERDUE",
    depositAmount: 1_000_000,
    checkoutStage: "NONE",
    fees: [],
    ...patch,
  }
}

const CONTRACTS = [
  contract(1, "Khách Một", {}),
  contract(2, "Khách Hai", { endDate: addDays(today, -35) }),
  contract(3, "Khách Ba", { status: "FORFEITED", endDate: addDays(today, -60) }),
  contract(4, "Khách Bốn", { status: "COMPLETED", checkoutStage: "HANDED_OVER" }),
]

vi.mock("../api/contractApi", () => ({
  listFacilityContracts: vi.fn(async () => CONTRACTS),
  applyFeeDiscount: vi.fn(),
}))

describe("CheckoutDebtPanel: quá hạn trên 30 ngày cần lập hồ sơ thanh lý", () => {
  test("ghi số ngày quá hạn; quá 30 ngày hoặc FORFEITED có cảnh báo; COMPLETED không còn trong danh sách", async () => {
    render(<CheckoutDebtPanel />)
    const row = (name: string) => (screen.getByText(name).closest("tr") as HTMLElement)
    await screen.findByText("Khách Một")
    expect(within(row("Khách Một")).getByText("Quá hạn 5 ngày", { selector: "p" })).toBeInTheDocument()
    expect(within(row("Khách Một")).queryByText(/thanh lý tài sản/i)).not.toBeInTheDocument()
    expect(within(row("Khách Hai")).getByText(/cần lập hồ sơ niêm phong/i)).toBeInTheDocument()
    expect(within(row("Khách Ba")).getByText("Đã tịch thu, thanh lý tài sản")).toBeInTheDocument()
    expect(within(row("Khách Ba")).getByText(/cần lập hồ sơ niêm phong/i)).toBeInTheDocument()
    expect(screen.queryByText("Khách Bốn")).not.toBeInTheDocument()
  })

  test("lọc 'Quá hạn trên 30 ngày' chỉ còn hồ sơ cần thanh lý", async () => {
    const user = userEvent.setup()
    render(<CheckoutDebtPanel />)
    await screen.findByText("Khách Một")
    await user.selectOptions(screen.getByRole("combobox", { name: /cần xử lý/i }), "FORFEIT")
    const names = within(screen.getByRole("table")).getAllByRole("row").slice(1).map((r) => r.querySelector("p")?.textContent)
    expect(names).toEqual(["Khách Hai", "Khách Ba"])
  })
})
