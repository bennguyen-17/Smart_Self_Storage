import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { beforeEach, describe, expect, test, vi } from "vitest"

import ManagerPortalPage from "./ManagerPortalPage"

// Chặn quyền do RoleProtectedRoute chung đảm nhận; ở đây chỉ kiểm khung trang.
vi.mock("@/components/common/theme-provider", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}))
const auth = vi.hoisted(() => ({
  user: { id: 3, fullName: "Trần Văn Quản Lý", email: "manager.hn@smartstorage.vn", role: "MANAGER" },
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
        <Route path="/manager/*" element={<ManagerPortalPage />} />
        <Route path="/internal_login" element={<p>Trang đăng nhập nội bộ</p>} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>
  )
  return userEvent.setup()
}

const desktopNav = () => screen.getByRole("navigation", { name: /^các trang quản lý cơ sở$/i })

beforeEach(() => {
  auth.user = { id: 3, fullName: "Trần Văn Quản Lý", email: "manager.hn@smartstorage.vn", role: "MANAGER" }
  auth.signOut.mockReset()
})

describe("ManagerPortalPage: navbar + mỗi trang một link riêng", () => {
  test("/manager → chuyển tới trang mặc định /manager/units, navbar đủ 6 trang", async () => {
    renderAt("/manager")
    expect(screen.getByTestId("location")).toHaveTextContent("/manager/units")
    expect(screen.getByRole("heading", { level: 1, name: "Quản lý ô kho" })).toBeInTheDocument()
    expect(within(desktopNav()).getAllByRole("link")).toHaveLength(6)
    expect(within(desktopNav()).getByRole("link", { name: "Ô kho" })).toHaveAttribute("aria-current", "page")
    expect(await screen.findByText("HN01-F1-M01")).toBeInTheDocument()
  })

  test("body không còn thẻ chào và lối tắt sang cổng khác", () => {
    renderAt("/manager/units")
    expect(screen.queryByText(/cổng quản lý cơ sở/i)).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /đơn cọc|check-in/i })).not.toBeInTheDocument()
  })

  test("bấm 'Phân công' trên navbar → link /manager/staff, trang chưa có chức năng hiện ô giữ chỗ", async () => {
    const user = renderAt("/manager/units")
    await user.click(within(desktopNav()).getByRole("link", { name: "Phân công" }))
    expect(screen.getByTestId("location")).toHaveTextContent("/manager/staff")
    expect(screen.getByRole("heading", { level: 1, name: "Phân công nhân viên" })).toBeInTheDocument()
    expect(screen.getByText(/đang phát triển · US-32 · phụ trách: Vỹ/i)).toBeInTheDocument()
  })

  test.each([
    { from: "/manager?tab=gate-logs", to: "/manager/gate-logs", note: "link cũ dạng ?tab=" },
    { from: "/manager/khong-ton-tai", to: "/manager/units", note: "trang không tồn tại" },
    { from: "/manager?tab=la", to: "/manager/units", note: "?tab= lạ" },
  ])("$note: $from → $to", ({ from, to }) => {
    renderAt(from)
    expect(screen.getByTestId("location")).toHaveTextContent(to)
  })

  test("trang Nhật ký cổng (US-18) đã có chức năng", async () => {
    renderAt("/manager/gate-logs")
    expect(screen.getByRole("heading", { level: 1, name: "Nhật ký mở cổng thủ công" })).toBeInTheDocument()
    expect(await screen.findByRole("searchbox")).toBeInTheDocument()
    expect(screen.queryByText(/đang phát triển/i)).not.toBeInTheDocument()
  })

  test("avatar lấy chữ viết tắt, bỏ phần trong ngoặc", () => {
    auth.user = { ...auth.user, fullName: "Trần Văn Quản Lý (HN-01)" }
    renderAt("/manager/units")
    expect(screen.getByText("QL")).toBeInTheDocument()
  })

  test("menu tài khoản: hiện vai trò, bấm Đăng xuất → signOut chung và về trang đăng nhập nội bộ", async () => {
    const user = renderAt("/manager/units")
    await user.click(screen.getByRole("button", { name: /tài khoản: trần văn quản lý/i }))
    expect(await screen.findByText(/quản lý chi nhánh/i)).toBeInTheDocument()
    await user.click(screen.getByRole("menuitem", { name: /đăng xuất/i }))
    expect(auth.signOut).toHaveBeenCalledTimes(1)
    expect(screen.getByText("Trang đăng nhập nội bộ")).toBeInTheDocument()
  })

  test("màn hẹp: nút ☰ mở danh sách trang, chọn trang thì tự đóng", async () => {
    const user = renderAt("/manager/units")
    const toggle = screen.getByRole("button", { name: /mở danh sách trang/i })
    expect(toggle).toHaveAttribute("aria-expanded", "false")
    await user.click(toggle)
    const mobileNav = screen.getByRole("navigation", { name: /màn hẹp/i })
    await user.click(within(mobileNav).getByRole("link", { name: "Nhật ký cổng" }))
    expect(screen.getByTestId("location")).toHaveTextContent("/manager/gate-logs")
    expect(screen.queryByRole("navigation", { name: /màn hẹp/i })).not.toBeInTheDocument()
  })
})
