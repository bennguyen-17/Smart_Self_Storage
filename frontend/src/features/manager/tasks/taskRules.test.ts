import { describe, expect, test } from "vitest"

import type { FacilityContract } from "@/features/manager/contracts/types"
import type { ManagerUnit } from "@/features/manager/units/types"

import {
  filterTasks,
  inspectionTargets,
  maintenanceTargets,
  staffedShifts,
  taskFormErrors,
  taskStatus,
  taskSummary,
  toCreateRequest,
} from "./taskRules"
import type { StaffTask, TaskForm } from "./types"

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
    note: null,
    status: "ASSIGNED",
    workDate: "2026-10-26",
    shiftId: 1,
    shiftName: "Ca Sáng",
    createdAt: "2026-10-26T08:10:00",
    doneAt: null,
    ...over,
  }
}

const unit = (unitCode: string, status: string) => ({ unitCode, status }) as unknown as ManagerUnit
const contract = (contractId: number, status: string, endDate: string) =>
  ({ contractId, status, endDate, contractCode: `CTR-${contractId}` }) as unknown as FacilityContract

describe("taskStatus", () => {
  test.each([
    ["ASSIGNED", "ASSIGNED"],
    ["done", "DONE"],
    ["CANCELED", "CANCELED"],
    ["CANCELLED", "CANCELED"],
    ["LẠ", "ASSIGNED"],
  ])("%s → %s", (raw, expected) => {
    expect(taskStatus(raw)).toBe(expected)
  })
})

describe("filterTasks", () => {
  const tasks = [
    task({ taskId: 1, status: "DONE", shiftId: 1 }),
    task({ taskId: 2, status: "ASSIGNED", shiftId: 2, employeeName: "Bùi Tuấn Kiệt", unitCode: "HN01-F1-S03" }),
    task({ taskId: 3, status: "CANCELED", shiftId: 1 }),
    task({ taskId: 4, status: "ASSIGNED", shiftId: 1 }),
  ]

  test("việc đang chờ lên trước, rồi theo ca", () => {
    expect(filterTasks(tasks, { query: "", status: "ALL" }).map((t) => t.taskId)).toEqual([4, 2, 1, 3])
  })

  test.each([
    [{ query: "", status: "DONE" as const }, [1]],
    [{ query: "kiet", status: "ALL" as const }, [2]],
    [{ query: "f1-s03", status: "ASSIGNED" as const }, [2]],
    [{ query: "kiet", status: "DONE" as const }, []],
  ])("lọc %o → %o", (filter, ids) => {
    expect(filterTasks(tasks, filter).map((t) => t.taskId)).toEqual(ids)
  })

  test("đếm theo trạng thái", () => {
    expect(taskSummary(tasks)).toEqual({ ASSIGNED: 2, DONE: 1, CANCELED: 1 })
  })
})

describe("staffedShifts", () => {
  test("chỉ giữ ca đã có người trực", () => {
    const schedule = {
      date: "2026-10-26",
      shifts: [
        { shiftId: 1, shiftName: "Ca Sáng", startTime: "08:00", endTime: "12:00", staff: [{ employeeId: 8, fullName: "Hùng" }] },
        { shiftId: 2, shiftName: "Ca Chiều", startTime: "12:00", endTime: "16:00", staff: [] },
      ],
    }
    expect(staffedShifts(schedule).map((s) => s.shiftId)).toEqual([1])
    expect(staffedShifts(undefined)).toEqual([])
  })
})

describe("maintenanceTargets", () => {
  const units = [
    unit("HN01-G-XL05", "MAINTENANCE"),
    unit("HN01-G-XL02", "UNDER_MAINTENANCE"),
    unit("HN01-G-XL01", "AVAILABLE"),
  ]

  test("chỉ ô đang bảo trì (cả cách viết cũ MAINTENANCE), sắp theo mã", () => {
    expect(maintenanceTargets(units, [], 1).map((u) => u.unitCode)).toEqual(["HN01-G-XL02", "HN01-G-XL05"])
  })

  test("ẩn ô đã có việc bảo trì đang chờ trong CÙNG ca; ca khác vẫn giao được", () => {
    const busy = [task({ unitCode: "HN01-G-XL05", shiftId: 1 })]
    expect(maintenanceTargets(units, busy, 1).map((u) => u.unitCode)).toEqual(["HN01-G-XL02"])
    expect(maintenanceTargets(units, busy, 2).map((u) => u.unitCode)).toEqual(["HN01-G-XL02", "HN01-G-XL05"])
  })

  test("việc đã xong hoặc đã hủy không chặn", () => {
    const done = [task({ unitCode: "HN01-G-XL05", shiftId: 1, status: "DONE" })]
    expect(maintenanceTargets(units, done, 1)).toHaveLength(2)
  })
})

describe("inspectionTargets", () => {
  const contracts = [
    contract(1, "ACTIVE", "2026-11-20"),
    contract(2, "OVERDUE", "2026-10-01"),
    contract(3, "PENDING_CHECKIN", "2026-12-01"),
    contract(4, "TERMINATED", "2026-09-01"),
  ]

  test("chỉ hợp đồng đang thuê hoặc quá hạn, hết hạn sớm nhất lên trước", () => {
    expect(inspectionTargets(contracts, []).map((c) => c.contractId)).toEqual([2, 1])
  })

  test("ẩn hợp đồng đã có người được giao nghiệm thu (việc đang chờ)", () => {
    const busy = [task({ taskType: "CHECKOUT_INSPECTION", contractId: 2, unitCode: null })]
    expect(inspectionTargets(contracts, busy).map((c) => c.contractId)).toEqual([1])
  })
})

describe("form giao việc", () => {
  const ok: TaskForm = { shiftId: "1", employeeId: "8", taskType: "MAINTENANCE", target: "HN01-G-XL05", note: "" }

  test.each([
    [{}, {}],
    [{ shiftId: "" }, { shiftId: "Chọn ca làm việc" }],
    [{ employeeId: "" }, { employeeId: "Chọn nhân viên trong ca" }],
    [{ target: "" }, { target: "Chọn ô kho cần bảo trì" }],
    [{ taskType: "CHECKOUT_INSPECTION" as const, target: "" }, { target: "Chọn hợp đồng cần nghiệm thu" }],
    [{ note: "x".repeat(501) }, { note: "Ghi chú tối đa 500 ký tự" }],
  ])("%o → lỗi %o", (patch, expected) => {
    expect(taskFormErrors({ ...ok, ...patch })).toEqual(expected)
  })

  test("bảo trì gửi unitCode, không gửi contractId; ghi chú trống thì bỏ", () => {
    expect(toCreateRequest(ok, "2026-10-26")).toEqual({
      taskType: "MAINTENANCE",
      employeeId: 8,
      date: "2026-10-26",
      shiftId: 1,
      unitCode: "HN01-G-XL05",
    })
  })

  test("nghiệm thu gửi contractId dạng số, cắt khoảng trắng ghi chú", () => {
    expect(
      toCreateRequest({ ...ok, taskType: "CHECKOUT_INSPECTION", target: "7", note: "  Khách hẹn 15:00 " }, "2026-10-26")
    ).toEqual({
      taskType: "CHECKOUT_INSPECTION",
      employeeId: 8,
      date: "2026-10-26",
      shiftId: 1,
      contractId: 7,
      note: "Khách hẹn 15:00",
    })
  })
})
