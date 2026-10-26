import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AxiosError, type AxiosResponse } from "axios"
import { toast } from "sonner"
import { beforeEach, describe, expect, test, vi } from "vitest"

import type { StaffTask } from "../types"
import TasksPanel from "./TasksPanel"

const api = vi.hoisted(() => ({ listTasks: vi.fn(), createTask: vi.fn(), cancelTask: vi.fn() }))
const shifts = vi.hoisted(() => ({ getDaySchedule: vi.fn() }))
const units = vi.hoisted(() => ({ getManagerUnits: vi.fn() }))
const contracts = vi.hoisted(() => ({ listFacilityContracts: vi.fn() }))
vi.mock("../api/taskApi", () => api)
vi.mock("@/features/manager/shifts/api/shiftApi", () => shifts)
vi.mock("@/features/manager/units/api/unitManagementApi", () => units)
vi.mock("@/features/manager/contracts/api/contractApi", () => contracts)
vi.mock("@/lib/apiClient", () => ({ default: {}, isMockMode: () => false }))
vi.mock("@/hooks/useAuthSession", () => ({ getStoredUser: () => ({ id: 3, facilityId: 1, fullName: "Trần Văn Quản" }) }))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock("@/lib/format", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/format")>()),
  todayInVietnam: () => "2026-10-26",
}))

function task(over: Partial<StaffTask>): StaffTask {
  return {
    taskId: 1,
    facilityId: 1,
    assignedEmployeeId: 8,
    employeeName: "Nguyễn Văn Hùng",
    assignedByAccountId: 3,
    taskType: "MAINTENANCE",
    unitCode: "HN01-G-XL05",
    contractId: null,
    note: "Thay bóng đèn",
    status: "ASSIGNED",
    workDate: "2026-10-26",
    shiftId: 1,
    shiftName: "Ca Sáng",
    createdAt: "2026-10-26T08:10:00",
    doneAt: null,
    ...over,
  }
}

const SCHEDULE = {
  date: "2026-10-26",
  shifts: [
    { shiftId: 1, shiftName: "Ca Sáng", startTime: "08:00", endTime: "12:00", staff: [{ employeeId: 8, fullName: "Nguyễn Văn Hùng" }] },
    { shiftId: 2, shiftName: "Ca Chiều", startTime: "12:00", endTime: "16:00", staff: [] },
  ],
}

beforeEach(() => {
  api.listTasks.mockReset().mockResolvedValue([
    task({ taskId: 1 }),
    task({ taskId: 2, employeeName: "Bùi Tuấn Kiệt", status: "DONE", doneAt: "2026-10-26T10:30:00", unitCode: "HN01-G-XL02" }),
  ])
  api.createTask.mockReset().mockResolvedValue(task({ taskId: 3 }))
  api.cancelTask.mockReset().mockResolvedValue(task({ taskId: 1, status: "CANCELED" }))
  shifts.getDaySchedule.mockReset().mockResolvedValue(SCHEDULE)
  units.getManagerUnits.mockReset().mockResolvedValue([
    { unitCode: "HN01-G-XL07", status: "MAINTENANCE", floorName: "Tầng trệt" },
    { unitCode: "HN01-G-XL01", status: "AVAILABLE" },
  ])
  contracts.listFacilityContracts.mockReset().mockResolvedValue([])
  vi.mocked(toast.success).mockReset()
})

async function renderPanel() {
  const user = userEvent.setup()
  render(<TasksPanel />)
  await screen.findByText("Bùi Tuấn Kiệt")
  return user
}

const row = (text: string) => screen.getByText(text).closest("tr") as HTMLElement

describe("TasksPanel: Manager giao việc cho nhân viên", () => {
  test("tải việc của hôm nay; việc đang chờ lên trước; đếm theo trạng thái", async () => {
    await renderPanel()
    expect(api.listTasks).toHaveBeenCalledWith(expect.objectContaining({ facilityId: 1 }), "2026-10-26")
    const rows = screen.getAllByRole("row").slice(1)
    expect(within(rows[0]).getByText("Nguyễn Văn Hùng")).toBeInTheDocument()
    expect(within(row("Bùi Tuấn Kiệt")).getByText("Đã xong")).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("2 việc trong ngày1 đang chờ làm1 đã xong")
  })

  test("giao việc bảo trì: chọn ca → người trong ca → ô đang bảo trì → gửi đúng body, tải lại danh sách", async () => {
    const user = await renderPanel()
    await user.click(screen.getByRole("button", { name: /Giao việc mới/ }))
    const sheet = await screen.findByRole("dialog")

    // Ca không có người thì không hiện để chọn
    await within(sheet).findByRole("option", { name: /Ca Sáng/ })
    expect(within(sheet).queryByRole("option", { name: /Ca Chiều/ })).not.toBeInTheDocument()

    await user.selectOptions(within(sheet).getByLabelText(/Ca làm việc/), "1")
    await user.selectOptions(within(sheet).getByLabelText(/Nhân viên/), "8")
    // Chỉ ô đang bảo trì mới chọn được
    expect(within(sheet).queryByRole("option", { name: /HN01-G-XL01/ })).not.toBeInTheDocument()
    await user.selectOptions(within(sheet).getByLabelText(/Ô kho cần bảo trì/), "HN01-G-XL07")
    await user.type(within(sheet).getByLabelText(/Ghi chú/), "Kiểm tra ray cửa")
    await user.click(within(sheet).getByRole("button", { name: "Giao việc" }))

    expect(api.createTask).toHaveBeenCalledWith(expect.anything(), {
      taskType: "MAINTENANCE",
      employeeId: 8,
      date: "2026-10-26",
      shiftId: 1,
      unitCode: "HN01-G-XL07",
      note: "Kiểm tra ray cửa",
    })
    expect(toast.success).toHaveBeenCalledWith('Đã giao "Bảo trì / vệ sinh ô kho" cho Nguyễn Văn Hùng')
    expect(api.listTasks).toHaveBeenCalledTimes(2)
  })

  test("chưa chọn đủ thì báo lỗi từng ô, không gọi BE", async () => {
    const user = await renderPanel()
    await user.click(screen.getByRole("button", { name: /Giao việc mới/ }))
    const sheet = await screen.findByRole("dialog")
    await user.click(within(sheet).getByRole("button", { name: "Giao việc" }))
    expect(within(sheet).getByText("Chọn ca làm việc")).toBeInTheDocument()
    expect(within(sheet).getByText("Chọn nhân viên trong ca")).toBeInTheDocument()
    expect(within(sheet).getByText("Chọn ô kho cần bảo trì")).toBeInTheDocument()
    expect(api.createTask).not.toHaveBeenCalled()
  })

  test("BE từ chối thì hiện nguyên câu lỗi trong ngăn, giữ ngăn mở", async () => {
    api.createTask.mockRejectedValue(
      new AxiosError("x", "ERR", undefined, undefined, {
        status: 409,
        data: { message: "Nhân viên chưa được xếp vào ca này." },
      } as AxiosResponse)
    )
    const user = await renderPanel()
    await user.click(screen.getByRole("button", { name: /Giao việc mới/ }))
    const sheet = await screen.findByRole("dialog")
    await within(sheet).findByRole("option", { name: /Ca Sáng/ })
    await user.selectOptions(within(sheet).getByLabelText(/Ca làm việc/), "1")
    await user.selectOptions(within(sheet).getByLabelText(/Nhân viên/), "8")
    await user.selectOptions(within(sheet).getByLabelText(/Ô kho cần bảo trì/), "HN01-G-XL07")
    await user.click(within(sheet).getByRole("button", { name: "Giao việc" }))
    expect(await within(sheet).findByRole("alert")).toHaveTextContent("Nhân viên chưa được xếp vào ca này.")
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  test("hủy việc đang chờ: hỏi lại rồi gọi BE; việc đã xong không có nút hủy", async () => {
    const user = await renderPanel()
    expect(within(row("Bùi Tuấn Kiệt")).queryByRole("button", { name: /Hủy việc/ })).not.toBeInTheDocument()
    await user.click(within(row("Nguyễn Văn Hùng")).getByRole("button", { name: "Hủy việc của Nguyễn Văn Hùng" }))
    const confirm = await screen.findByRole("dialog")
    await user.click(within(confirm).getByRole("button", { name: "Hủy việc" }))
    expect(api.cancelTask).toHaveBeenCalledWith(expect.anything(), 1)
    expect(toast.success).toHaveBeenCalledWith("Đã hủy việc của Nguyễn Văn Hùng")
  })

  test("ngày đã qua thì khóa nút giao việc và nói lý do", async () => {
    await renderPanel()
    // Ô type="date" trong jsdom không nhận gõ phím, đổi giá trị trực tiếp
    fireEvent.change(screen.getByLabelText("Ngày làm việc"), { target: { value: "2026-10-20" } })
    await screen.findByText("Không giao việc cho ngày đã qua")
    expect(screen.getByRole("button", { name: /Giao việc mới/ })).toBeDisabled()
    expect(screen.getByText("Không giao việc cho ngày đã qua")).toBeInTheDocument()
  })
})
