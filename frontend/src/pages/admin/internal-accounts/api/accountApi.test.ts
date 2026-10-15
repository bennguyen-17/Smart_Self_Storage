import { beforeEach, describe, expect, test, vi } from "vitest"

import type { AccountFormValues } from "../types"

// Giả lập apiClient để kiểm FE gửi đúng contract đã đề xuất cho BE
const env = vi.hoisted(() => ({ mockMode: false }))
const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn() }))
vi.mock("@/lib/apiClient", () => ({ default: http, isMockMode: () => env.mockMode }))

const { createAccount, listAccounts, setAccountStatus, updateAccountAssignment } = await import("./accountApi")
const { resetAccountsMock } = await import("./accountApi.mock")

const FORM: AccountFormValues = {
  fullName: "  Nguyễn Văn Mới ",
  email: " NV.Moi@SelfStorage391.vn ",
  phone: "0901 234 567",
  role: "STAFF",
  facilityId: 2,
}

beforeEach(() => {
  env.mockMode = false
  http.get.mockReset().mockResolvedValue([])
  http.post.mockReset().mockResolvedValue({})
  http.patch.mockReset().mockResolvedValue({})
  resetAccountsMock()
})

describe("accountApi: contract tài khoản nội bộ", () => {
  test("danh sách: GET /admin/accounts", async () => {
    await listAccounts()
    expect(http.get).toHaveBeenCalledWith("/admin/accounts")
  })

  test("tạo Staff: chuẩn hóa tên, email, SĐT và gửi cơ sở", async () => {
    await createAccount(FORM)
    expect(http.post).toHaveBeenCalledWith("/admin/accounts", {
      fullName: "Nguyễn Văn Mới",
      email: "nv.moi@selfstorage391.vn",
      phone: "0901234567",
      role: "STAFF",
      facilityId: 2,
    })
  })

  test("tạo BOM: không gửi cơ sở dù form còn giữ lựa chọn cũ; SĐT trống → null", async () => {
    await createAccount({ ...FORM, role: "BOM", phone: "" })
    expect(http.post).toHaveBeenCalledWith("/admin/accounts", expect.objectContaining({ role: "BOM", facilityId: null, phone: null }))
  })

  test("đổi vai trò / cơ sở: PATCH /admin/accounts/{id}", async () => {
    await updateAccountAssignment(5, { role: "MANAGER", facilityId: 3 })
    expect(http.patch).toHaveBeenCalledWith("/admin/accounts/5", { role: "MANAGER", facilityId: 3 })
  })

  test("khóa: PATCH /admin/accounts/{id}/status", async () => {
    await setAccountStatus(5, "LOCKED")
    expect(http.patch).toHaveBeenCalledWith("/admin/accounts/5/status", { status: "LOCKED" })
  })

  test("mock: không gọi mạng; trùng email bị từ chối; tài khoản mới phải đổi mật khẩu", async () => {
    env.mockMode = true
    const created = await createAccount(FORM)
    expect(created.mustChangePassword).toBe(true)
    await expect(createAccount(FORM)).rejects.toThrow(/email đã được dùng/i)
    expect(http.post).not.toHaveBeenCalled()
  })
})
