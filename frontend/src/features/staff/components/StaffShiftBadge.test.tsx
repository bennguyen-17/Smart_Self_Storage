import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, test, vi } from "vitest"

import {
  startCurrentShift,
  endCurrentShift,
} from "@/features/staff/shifts/api/staffShiftApi"
import {
  getStaffProfile,
  type StaffProfileData,
} from "@/features/staff/services/staffProfileService"
import StaffShiftBadge from "./StaffShiftBadge"

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))
vi.mock("./StaffProfileModal", () => ({ default: () => null }))
vi.mock("@/features/staff/services/staffProfileService", () => ({
  getStaffProfile: vi.fn(),
}))
vi.mock("@/features/staff/shifts/api/staffShiftApi", () => ({
  startCurrentShift: vi.fn(),
  endCurrentShift: vi.fn(),
}))

function makeProfile(status: string): StaffProfileData {
  return {
    success: true,
    accountId: 5,
    employeeId: 10,
    fullName: "Nguyễn Văn Staff",
    phone: "0933444555",
    email: "staff@selfstorage391.vn",
    role: "STAFF",
    roleTitle: "Nhân viên cơ sở",
    staffCode: "NV-0010",
    facilityId: 1,
    facilityName: "SmartStorage Cầu Giấy",
    date: "2026-10-22",
    shiftStatus: "IN_SHIFT",
    shiftStatusText: "Đang trong ca trực",
    assignedShifts: [
      {
        shiftId: 1,
        shiftName: "Ca Sáng",
        startTime: "08:00",
        endTime: "12:00",
        isCurrent: true,
        status,
      },
    ],
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("StaffShiftBadge: bắt đầu và kết thúc ca", () => {
  test("trong ca nhưng chưa điểm danh → hiện nút Bắt đầu ca và gọi API", async () => {
    vi.mocked(getStaffProfile).mockResolvedValue(makeProfile("SCHEDULED"))
    vi.mocked(startCurrentShift).mockResolvedValue(undefined)

    const user = userEvent.setup()
    render(<StaffShiftBadge />)

    const startButton = await screen.findByRole("button", {
      name: /bắt đầu ca/i,
    })
    await user.click(startButton)

    expect(startCurrentShift).toHaveBeenCalledTimes(1)
    await waitFor(() =>
      expect(screen.getByText(/Ca Trực Hoạt Động/)).toBeInTheDocument()
    )
    expect(
      screen.queryByRole("button", { name: /bắt đầu ca/i })
    ).not.toBeInTheDocument()
  })

  test("đã điểm danh → hiện nút Kết thúc ca", async () => {
    vi.mocked(getStaffProfile).mockResolvedValue(makeProfile("ATTENDED"))

    render(<StaffShiftBadge />)

    expect(await screen.findByText(/Ca Trực Hoạt Động/)).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /bắt đầu ca/i })
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /kết thúc ca/i })
    ).toBeInTheDocument()
  })

  test("bấm Kết thúc ca → mở modal xác nhận và gọi API endCurrentShift khi bấm Xác nhận", async () => {
    vi.mocked(getStaffProfile).mockResolvedValue(makeProfile("ATTENDED"))
    vi.mocked(endCurrentShift).mockResolvedValue(undefined)

    const user = userEvent.setup()
    render(<StaffShiftBadge />)

    const endButton = await screen.findByRole("button", {
      name: /kết thúc ca/i,
    })
    await user.click(endButton)

    expect(screen.getByText(/Xác nhận kết thúc & bàn giao ca/)).toBeInTheDocument()
    const confirmButton = screen.getByRole("button", {
      name: /Xác nhận kết thúc ca/i,
    })
    await user.click(confirmButton)

    expect(endCurrentShift).toHaveBeenCalledTimes(1)
  })
})
