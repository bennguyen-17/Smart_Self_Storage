import { render, screen, within } from "@testing-library/react"
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
        <Route path="/admin/*" element={<AdminPortalPage />} />
        <Route path="/internal_login" element={<p>Trang đăng nhập nội bộ</p>} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>
  )
  return userEvent.setup()
}

const desktopNav = () => screen.getByRole("navigation", { name: /^các trang quản trị hệ thống$/i })

beforeEach(() => auth.signOut.mockReset())

describe("AdminPortalPage: navbar riêng của Admin + mỗi trang một link", () => {
  test("/admin → /admin/users; navbar có đúng 3 trang của Admin, không có trang của Manager", async () => {
    renderAt("/admin")
    expect(screen.getByTestId("location")).toHaveTextContent("/admin/users")
    expect(screen.getByRole("heading", { level: 1, name: "Tài khoản & phân quyền" })).toBeInTheDocument()
    const links = within(desktopNav()).getAllByRole("link").map((a) => a.textContent)
    expect(links).toEqual(["Tài khoản", "Chi nhánh", "Nhật ký hoạt động"])
    expect(screen.queryByRole("link", { name: "Ô kho" })).not.toBeInTheDocument()
    expect(await screen.findByRole("button", { name: /tạo tài khoản/i })).toBeInTheDocument()
  })

  test("bấm 'Nhật ký hoạt động' → /admin/audit, trang chưa có chức năng hiện ô giữ chỗ", async () => {
    const user = renderAt("/admin/users")
    await user.click(within(desktopNav()).getByRole("link", { name: "Nhật ký hoạt động" }))
    expect(screen.getByTestId("location")).toHaveTextContent("/admin/audit")
    expect(screen.getByText(/đang phát triển · US-30 · phụ trách: Vỹ/i)).toBeInTheDocument()
  })

  test.each([
    { from: "/admin?tab=audit", to: "/admin/audit" },
    { from: "/admin/policy", to: "/admin/users" },
  ])("$from → $to", ({ from, to }) => {
    renderAt(from)
    expect(screen.getByTestId("location")).toHaveTextContent(to)
  })

  test("không còn lối tắt sang cổng khác trong body", () => {
    renderAt("/admin/users")
    expect(screen.queryByRole("link", { name: /cổng quản lý cơ sở|đơn cọc/i })).not.toBeInTheDocument()
  })

  test("menu tài khoản → Đăng xuất gọi signOut chung và về trang đăng nhập nội bộ", async () => {
    const user = renderAt("/admin/users")
    await user.click(screen.getByRole("button", { name: /tài khoản: quản trị viên hệ thống/i }))
    await user.click(await screen.findByRole("menuitem", { name: /đăng xuất/i }))
    expect(auth.signOut).toHaveBeenCalledTimes(1)
    expect(screen.getByText("Trang đăng nhập nội bộ")).toBeInTheDocument()
  })
})
