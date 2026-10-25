import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, test, vi } from "vitest"

import { completeTask, listMyTasks } from "../api/staffTaskApi"
import type { StaffTask } from "../types"
import StaffTasksPanel from "./StaffTasksPanel"

vi.mock("@/features/staff/components/StaffShiftBadge", () => ({
  default: () => null,
}))

vi.mock("../api/staffTaskApi", () => ({
  listMyTasks: vi.fn(),
  completeTask: vi.fn(),
}))

const tasks: StaffTask[] = [
  {
    taskId: 1,
    taskType: "MAINTENANCE",
    unitCode: "F1-A101",
    status: "ASSIGNED",
    workDate: "2026-10-22",
    shiftName: "Ca Sáng",
    note: "Kiểm tra khóa cửa",
  },
  {
    taskId: 2,
    taskType: "CHECKOUT_INSPECTION",
    contractCode: "HD-CG-8812",
    status: "DONE",
    workDate: "2026-10-22",
    shiftName: "Ca Sáng",
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(listMyTasks).mockResolvedValue(tasks)
  vi.mocked(completeTask).mockResolvedValue(undefined)
})

describe("StaffTasksPanel: việc được giao trong ca (US-32)", () => {
  test("liệt kê việc kèm loại việc, kho, ca và trạng thái", async () => {
    render(<StaffTasksPanel />)

    expect(await screen.findByText("Bảo trì kho")).toBeInTheDocument()
    expect(screen.getByText("Nghiệm thu trả kho")).toBeInTheDocument()
    expect(screen.getByText(/Kho F1-A101/)).toBeInTheDocument()
    expect(screen.getByText("Cần làm")).toBeInTheDocument()
    expect(screen.getAllByText("Đã xong")).toHaveLength(2)
  })

  test("bấm Đã xong → gọi API đúng task và tải lại danh sách", async () => {
    const user = userEvent.setup()
    render(<StaffTasksPanel />)

    await user.click(await screen.findByRole("button", { name: /đã xong/i }))

    expect(completeTask).toHaveBeenCalledWith(1)
    await waitFor(() => expect(listMyTasks).toHaveBeenCalledTimes(2))
  })

  test("không có việc → hiện trạng thái rỗng", async () => {
    vi.mocked(listMyTasks).mockResolvedValue([])
    render(<StaffTasksPanel />)

    expect(
      await screen.findByText(/chưa có việc nào được giao/i)
    ).toBeInTheDocument()
  })
})
