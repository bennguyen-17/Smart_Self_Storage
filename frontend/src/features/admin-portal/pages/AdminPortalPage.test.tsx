import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { beforeEach, describe, expect, test, vi } from "vitest"

import AdminPortalPage from "./AdminPortalPage"

// Chặn quyền do RoleProtectedRoute chung đảm nhận; ở đây chỉ kiểm khung trang.
vi.mock("@/components/common/theme-provider", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}))
vi.mock("@/lib/apiClient", () => ({ default: {}, isMockMode: () => true }))
const auth = vi.hoisted(() => ({
  user: { id: 1, fullName: "Quản Trị Viên Hệ Thống", email: "admin@selfstorage391.vn", role: "ADMIN" },
  signOut: vi.fn(),
}))
vi.mock("@/context/AuthContext", () => ({ useAuth: () => auth }))

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname + location.search}</output>
}

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin" element={<AdminPortalPage />} />
        <Route path="/internal_login" element={<p>Trang đăng nhập nội bộ</p>} />
        <Route path="/manager" element={<p>Trang quản lý cơ sở</p>} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>
  )
}

beforeEach(() => auth.signOut.mockReset())

describe("AdminPortalPage: khung Cổng Quản trị hệ thống", () => {
  test("đủ 3 tab theo chốt nhóm, mặc định tab Tài khoản đã gắn chức năng", async () => {
    renderAt("/admin")
    expect(screen.getByText("Cổng Quản trị hệ thống", { selector: "span" })).toBeInTheDocument()
    const nav = screen.getByRole("navigation", { name: /chức năng quản trị/i })
    expect(nav.querySelectorAll("button")).toHaveLength(3)
    expect(screen.getByRole("button", { name: /tài khoản & phân quyền/i })).toHaveAttribute("aria-current", "page")
    expect(await screen.findByRole("heading", { name: /tài khoản nội bộ/i })).toBeInTheDocument()
    expect(screen.queryByText(/chính sách/i)).not.toBeInTheDocument()
  })

  test("tab chưa có chức năng → ô 'đang phát triển' kèm người phụ trách", async () => {
    const user = userEvent.setup()
    renderAt("/admin")
    await user.click(screen.getByRole("button", { name: /nhật ký hoạt động/i }))
    expect(screen.getByTestId("location")).toHaveTextContent("/admin?tab=audit")
    expect(screen.getByText(/đang phát triển · US-30 · phụ trách: Vy/i)).toBeInTheDocument()
  })

  test("tab lạ trên URL → về tab mặc định", () => {
    renderAt("/admin?tab=policy")
    expect(screen.getByRole("button", { name: /tài khoản & phân quyền/i })).toHaveAttribute("aria-current", "page")
  })

  test("lối tắt sang Cổng Quản lý cơ sở", async () => {
    const user = userEvent.setup()
    renderAt("/admin")
    await user.click(screen.getByRole("link", { name: /cổng quản lý cơ sở/i }))
    expect(screen.getByText("Trang quản lý cơ sở")).toBeInTheDocument()
  })

  test("đăng xuất → gọi signOut chung và về trang đăng nhập nội bộ", async () => {
    const user = userEvent.setup()
    renderAt("/admin")
    await user.click(screen.getByRole("button", { name: /đăng xuất/i }))
    expect(auth.signOut).toHaveBeenCalledTimes(1)
    expect(screen.getByText("Trang đăng nhập nội bộ")).toBeInTheDocument()
  })
})
