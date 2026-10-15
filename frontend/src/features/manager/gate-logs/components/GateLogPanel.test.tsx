import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, test, vi } from "vitest"

import type { GateLog } from "../types"
import GateLogPanel from "./GateLogPanel"

const { listManualGateOpenLogs } = vi.hoisted(() => ({ listManualGateOpenLogs: vi.fn() }))
vi.mock("@/lib/apiClient", () => ({ default: {}, isMockMode: () => false }))
vi.mock("../api/gateLogApi", () => ({ listManualGateOpenLogs }))

function log(id: number, openedAt: string, customerId: number, reason: string): GateLog {
  return { auditLogId: id, accountId: 5, facilityId: 1, customerId, action: "MANUAL_GATE_OPEN", openedAt, reason, createdAt: openedAt }
}

const LOGS = [
  log(1, "2026-10-10T08:15:00", 101, "Khách quên mã PIN"),
  log(2, "2026-10-12T21:00:00", 205, "Mất điện đầu đọc, mở bằng chìa cơ"),
]

async function renderPanel() {
  const user = userEvent.setup()
  render(<GateLogPanel />)
  await screen.findByText("KH-101")
  return { user }
}

const bodyRows = () => within(screen.getByRole("table")).getAllByRole("row").slice(1)

beforeEach(() => {
  listManualGateOpenLogs.mockReset().mockResolvedValue(LOGS)
})

describe("GateLogPanel: Manager xem nhật ký mở cổng thủ công (US-18)", () => {
  test("hiện đủ cột, mới nhất lên đầu, và KHÔNG có nút sửa/xóa log", async () => {
    await renderPanel()
    const rows = bodyRows()
    expect(within(rows[0]).getByText("KH-205")).toBeInTheDocument()
    expect(within(rows[1]).getByText("KH-101")).toBeInTheDocument()
    expect(within(rows[1]).getByText("Khách quên mã PIN")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /sửa|xóa log|xoá/i })).not.toBeInTheDocument()
    expect(screen.getByText("2 / 2 lần mở cổng")).toBeInTheDocument()
  })

  test("tìm theo lý do → chỉ còn log khớp; xóa bộ lọc → hiện lại hết", async () => {
    const { user } = await renderPanel()
    await user.type(screen.getByRole("searchbox"), "chìa cơ")
    expect(bodyRows()).toHaveLength(1)
    expect(screen.getByText("KH-205")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /xóa bộ lọc/i }))
    expect(bodyRows()).toHaveLength(2)
  })

  test("khoảng ngày ngược → báo lỗi và không hiện log", async () => {
    await renderPanel()
    fireEvent.change(screen.getByLabelText("Từ ngày"), { target: { value: "2026-10-12" } })
    fireEvent.change(screen.getByLabelText("Đến ngày"), { target: { value: "2026-10-10" } })
    expect(screen.getByRole("alert")).toHaveTextContent(/ngày bắt đầu phải trước/i)
    expect(screen.getByText(/không có nhật ký phù hợp bộ lọc/i)).toBeInTheDocument()
  })

  test("cơ sở chưa có log → báo rõ là chưa có", async () => {
    listManualGateOpenLogs.mockResolvedValue([])
    render(<GateLogPanel />)
    expect(await screen.findByText(/chưa có lần mở cổng thủ công nào/i)).toBeInTheDocument()
  })

  test("lỗi tải → báo lỗi và có nút thử lại", async () => {
    listManualGateOpenLogs.mockRejectedValue(new Error("Employee profile not found"))
    render(<GateLogPanel />)
    expect(await screen.findByText(/không tải được nhật ký mở cổng/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /thử lại/i })).toBeInTheDocument()
  })
})
