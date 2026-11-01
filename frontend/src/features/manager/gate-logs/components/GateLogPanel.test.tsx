import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, test, vi } from "vitest"

import type { GateLog } from "../types"
import GateLogPanel from "./GateLogPanel"

const { listManualGateOpenLogs } = vi.hoisted(() => ({ listManualGateOpenLogs: vi.fn() }))
vi.mock("@/lib/apiClient", () => ({ default: {}, isMockMode: () => false }))
vi.mock("../api/gateLogApi", () => ({ listManualGateOpenLogs }))

function log(id: number, openedAt: string, patch: Partial<GateLog>): GateLog {
  return {
    auditLogId: id,
    accountId: 5,
    facilityId: 1,
    customerId: null,
    action: "GATE_ACCESS_PIN",
    openedAt,
    reason: null,
    createdAt: openedAt,
    ...patch,
  }
}

// 1 lượt mở bằng Thẻ Master (thủ công) và 1 lượt khách tự nhập mã PIN
const LOGS = [
  log(1, "2026-10-10T08:15:00", {
    customerId: 101,
    action: "MANUAL_GATE_OPEN",
    personName: "Nguyễn Thành Long",
    personPhone: "0912345678",
    identityNumber: "001201012345",
    gateName: "Cổng Chính",
    staffName: "Nguyễn Văn Nhân Viên 1",
    reason: "Khách quên mã PIN",
  }),
  log(2, "2026-10-12T21:00:00", {
    customerId: 205,
    personName: "Trần Thị Mai",
    gateName: "Cổng Xe Tải",
    reason: "Mã PIN động hợp lệ",
  }),
]

async function renderPanel() {
  const user = userEvent.setup()
  render(<GateLogPanel />)
  await screen.findByText("Nguyễn Thành Long")
  return { user }
}

const bodyRows = () => within(screen.getByRole("table")).getAllByRole("row").slice(1)

beforeEach(() => {
  listManualGateOpenLogs.mockReset().mockResolvedValue(LOGS)
})

describe("GateLogPanel: Manager xem nhật ký ra vào cổng của cơ sở (US-18)", () => {
  test("mỗi lượt hiện đủ người ra vào, trạng thái; mới nhất lên đầu; KHÔNG có nút sửa/xóa", async () => {
    await renderPanel()
    const [newest, older] = bodyRows()
    expect(within(newest).getByText("Trần Thị Mai")).toBeInTheDocument()
    expect(within(older).getByText("Mã: KH-101")).toBeInTheDocument()
    expect(within(older).getByText("SĐT: 0912345678")).toBeInTheDocument()
    expect(within(older).getByText("CCCD: 001201012345")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /sửa|xóa log|xoá/i })).not.toBeInTheDocument()
    expect(screen.getByText("Hiển thị 2 / 2 lượt ra vào cổng")).toBeInTheDocument()
  })

  test("hiển thị số lượt ra vào cổng trên thanh thông tin", async () => {
    await renderPanel()
    expect(screen.getByText("Hiển thị 2 / 2 lượt ra vào cổng")).toBeInTheDocument()
  })

  test("tìm theo lý do → chỉ còn lượt khớp; Xóa bộ lọc → hiện lại hết", async () => {
    const { user } = await renderPanel()
    await user.type(screen.getByRole("searchbox"), "quên mã")
    expect(bodyRows()).toHaveLength(1)
    expect(screen.getByText("Khách quên mã PIN")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /xóa bộ lọc/i }))
    expect(bodyRows()).toHaveLength(2)
  })

  test("tìm theo tên khách hàng → chỉ còn lượt khớp", async () => {
    const { user } = await renderPanel()
    await user.type(screen.getByRole("searchbox"), "Thành Long")
    expect(bodyRows()).toHaveLength(1)
    expect(screen.getByText("Nguyễn Thành Long")).toBeInTheDocument()
  })

  test("khoảng ngày ngược → báo lỗi và không hiện lượt nào", async () => {
    await renderPanel()
    fireEvent.change(screen.getByLabelText("Từ ngày"), { target: { value: "2026-10-12" } })
    fireEvent.change(screen.getByLabelText("Đến ngày"), { target: { value: "2026-10-10" } })
    expect(screen.getByRole("alert")).toHaveTextContent(/ngày bắt đầu phải trước/i)
    expect(screen.getByText(/không tìm thấy nhật ký phù hợp bộ lọc/i)).toBeInTheDocument()
  })

  test("cơ sở chưa có lượt nào → báo rõ là chưa có", async () => {
    listManualGateOpenLogs.mockResolvedValue([])
    render(<GateLogPanel />)
    expect(await screen.findByText("Chưa có lượt ra vào cổng nào")).toBeInTheDocument()
  })

  test("lỗi tải → báo lỗi và có nút thử lại", async () => {
    listManualGateOpenLogs.mockRejectedValue(new Error("Employee profile not found"))
    render(<GateLogPanel />)
    expect(await screen.findByText(/không tải được nhật ký mở cổng/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /thử lại/i })).toBeInTheDocument()
  })
})

describe("GateLogPanel: phân trang khi nhiều lượt ra vào", () => {
  test("12 lượt → trang 1 có 10 dòng, trang 2 có 2 dòng cũ nhất", async () => {
    const many = Array.from({ length: 12 }, (_, i) =>
      log(100 + i, `2026-10-${String(10 + i).padStart(2, "0")}T08:00:00`, { personName: `Khách số ${i + 1}`, customerId: 300 + i })
    )
    listManualGateOpenLogs.mockResolvedValue(many)
    const user = userEvent.setup()
    render(<GateLogPanel />)
    await screen.findByText("Khách số 12")
    expect(bodyRows()).toHaveLength(10)
    const nav = screen.getByRole("navigation", { name: "Phân trang" })
    expect(within(nav).getAllByRole("button", { name: /^Trang \d+$/ })).toHaveLength(2)
    expect(within(nav).getByRole("button", { name: "Trang 1" })).toHaveAttribute("aria-current", "page")
    await user.click(within(nav).getByRole("button", { name: "Trang 2" }))
    expect(bodyRows()).toHaveLength(2)
    expect(screen.getByText("Khách số 1")).toBeInTheDocument()
  })
})
