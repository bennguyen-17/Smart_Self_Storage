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

const desktopNav = () => screen.getByRole("navigation", { name: /^các trang cổng quản trị hệ thống$/i })

beforeEach(() => auth.signOut.mockReset())

describe("AdminPortalPage: navbar riêng của Admin + mỗi trang một link", () => {
  test("/admin → /admin/users; navbar có đúng 4 trang của Admin, không có trang của Manager", async () => {
    renderAt("/admin")
    expect(screen.getByTestId("location")).toHaveTextContent("/admin/users")
    expect(screen.getByRole("heading", { level: 1, name: "Tài khoản & phân quyền" })).toBeInTheDocument()
    const links = within(desktopNav()).getAllByRole("link")
    expect(links).toHaveLength(4)
    for (const [i, label] of ["Tài khoản", "Khách hàng", "Chi nhánh", "Nhật ký hoạt động"].entries()) {
      expect(links[i]).toHaveTextContent(new RegExp(`^${label}`))
    }
    expect(screen.queryByRole("link", { name: /^Ô kho/ })).not.toBeInTheDocument()
    expect(await screen.findByRole("button", { name: /tạo tài khoản/i })).toBeInTheDocument()
  })

  test.each([
    { link: "Chi nhánh", path: "/admin/facilities", title: "Chi nhánh" },
    { link: "Nhật ký hoạt động", path: "/admin/audit", title: "Nhật ký hoạt động hệ thống" },
  ])("bấm '$link' → $path, trang đã có chức năng (không còn ô giữ chỗ)", async ({ link, path, title }) => {
    const user = renderAt("/admin/users")
    await user.click(within(desktopNav()).getByRole("link", { name: new RegExp(`^${link}`) }))
    expect(screen.getByTestId("location")).toHaveTextContent(path)
    expect(screen.getByRole("heading", { level: 1, name: title })).toBeInTheDocument()
    expect(screen.queryByText(/đang phát triển/i)).not.toBeInTheDocument()
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

  test("popup hồ sơ: Admin thuộc toàn hệ thống; Đăng xuất gọi signOut chung và về trang đăng nhập nội bộ", async () => {
    const user = renderAt("/admin/users")
    await user.click(screen.getByRole("button", { name: /tài khoản: quản trị viên hệ thống/i }))
    const profile = await screen.findByRole("dialog", { name: /hồ sơ nhân sự/i })
    expect(within(profile).getByText("Toàn hệ thống")).toBeInTheDocument()
    await user.click(within(profile).getByRole("button", { name: /đăng xuất/i }))
    expect(auth.signOut).toHaveBeenCalledTimes(1)
    expect(screen.getByText("Trang đăng nhập nội bộ")).toBeInTheDocument()
  })
})
