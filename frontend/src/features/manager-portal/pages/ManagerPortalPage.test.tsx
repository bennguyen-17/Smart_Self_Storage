import { render, screen } from "@testing-library/react"
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
        <Route path="/manager" element={<ManagerPortalPage />} />
        <Route path="/internal_login" element={<p>Trang đăng nhập nội bộ</p>} />
        <Route path="/staff/reservations" element={<p>Trang đơn cọc</p>} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>
  )
}

beforeEach(() => {
  auth.user = { id: 3, fullName: "Trần Văn Quản Lý", email: "manager.hn@smartstorage.vn", role: "MANAGER" }
  auth.signOut.mockReset()
})

describe("ManagerPortalPage: khung Cổng Quản lý cơ sở", () => {
  test("hiện tên thật, chữ viết tắt, vai trò, đủ 5 tab, mặc định tab Quản lý Kho", async () => {
    renderAt("/manager")
    expect(screen.getByText("Trần Văn Quản Lý")).toBeInTheDocument()
    expect(screen.getByText("QL")).toBeInTheDocument()
    expect(screen.getByText(/quản lý chi nhánh/i)).toBeInTheDocument()
    const nav = screen.getByRole("navigation", { name: /chức năng quản lý/i })
    expect(nav.querySelectorAll("button")).toHaveLength(5)
    expect(screen.getByRole("button", { name: /quản lý kho & bảng giá/i })).toHaveAttribute("aria-current", "page")
    expect(await screen.findByRole("heading", { name: /quản lý ô kho tại cơ sở/i })).toBeInTheDocument()
  })

  test("tên có mã cơ sở trong ngoặc → avatar không lấy dấu ngoặc", () => {
    auth.user = { ...auth.user, fullName: "Trần Văn Quản Lý (HN-01)" }
    renderAt("/manager")
    expect(screen.getByText("QL")).toBeInTheDocument()
  })

  test("chọn tab chưa có chức năng → URL đổi và hiện ô 'đang phát triển' kèm người phụ trách", async () => {
    const user = userEvent.setup()
    renderAt("/manager")
    await user.click(screen.getByRole("button", { name: /phân công staff/i }))
    expect(screen.getByTestId("location")).toHaveTextContent("/manager?tab=staff")
    expect(screen.getByText(/đang phát triển · US-32 · phụ trách: Vy/i)).toBeInTheDocument()
  })

  test("tab lạ trên URL → quay về tab mặc định", () => {
    renderAt("/manager?tab=khong-ton-tai")
    expect(screen.getByRole("button", { name: /quản lý kho & bảng giá/i })).toHaveAttribute("aria-current", "page")
  })

  test("lối tắt sang trang Đơn cọc & No-Show", async () => {
    const user = userEvent.setup()
    renderAt("/manager")
    await user.click(screen.getByRole("link", { name: /đơn cọc & no-show/i }))
    expect(screen.getByText("Trang đơn cọc")).toBeInTheDocument()
  })

  test("đăng xuất → gọi signOut chung và về trang đăng nhập nội bộ", async () => {
    const user = userEvent.setup()
    renderAt("/manager")
    await user.click(screen.getByRole("button", { name: /đăng xuất/i }))
    expect(auth.signOut).toHaveBeenCalledTimes(1)
    expect(screen.getByText("Trang đăng nhập nội bộ")).toBeInTheDocument()
  })
})
