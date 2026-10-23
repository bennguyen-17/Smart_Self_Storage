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
// Trang mặc định cần dữ liệu ô kho: test chạy bằng dữ liệu mẫu, không phụ thuộc cấu hình apiClient
vi.mock("@/lib/apiClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/apiClient")>()
  return { ...actual, isMockMode: () => true }
})

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

const desktopNav = () => screen.getByRole("navigation", { name: /^các trang cổng quản lý cơ sở$/i })

beforeEach(() => {
  auth.user = { id: 3, fullName: "Trần Văn Quản Lý", email: "manager.hn@smartstorage.vn", role: "MANAGER" }
  auth.signOut.mockReset()
})

describe("ManagerPortalPage: navbar + mỗi trang một link riêng", () => {
  test("/manager → chuyển tới trang mặc định /manager/units, navbar đủ 8 trang", async () => {
    renderAt("/manager")
    expect(screen.getByTestId("location")).toHaveTextContent("/manager/units")
    expect(screen.getByRole("heading", { level: 1, name: "Quản lý ô kho" })).toBeInTheDocument()
    expect(within(desktopNav()).getAllByRole("link")).toHaveLength(8)
    // Trang thứ 7 do Bảo thêm: tiếp nhận ticket quá hạn SLA
    expect(within(desktopNav()).getByRole("link", { name: /^Sự cố & Escalation/ })).toHaveAttribute("href", "/manager/tickets")
    expect(within(desktopNav()).getByRole("link", { name: /^Ô kho/ })).toHaveAttribute("aria-current", "page")
    expect(await screen.findByText("HN01-F1-M01")).toBeInTheDocument()
  })

  test("body không còn thẻ chào và lối tắt sang cổng khác", () => {
    renderAt("/manager/units")
    expect(within(screen.getByRole("main")).queryByText(/cổng quản lý cơ sở|xin chào/i)).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /đơn cọc|check-in/i })).not.toBeInTheDocument()
  })

  test.each([
    { link: "Báo cáo", path: "/manager/reports", title: "Báo cáo cơ sở & KPI" },
    { link: "Khách & hợp đồng", path: "/manager/customers", title: "Khách hàng & hợp đồng" },
    { link: "Trả kho & công nợ", path: "/manager/workflow", title: "Trả kho & công nợ" },
    { link: "Hoàn tiền", path: "/manager/refunds", title: "Hoàn tiền cho khách hàng" },
    { link: "Phân công", path: "/manager/staff", title: "Phân công nhân viên" },
  ])("bấm '$link' → $path, trang đã có chức năng (không còn ô giữ chỗ)", async ({ link, path, title }) => {
    const user = renderAt("/manager/units")
    await user.click(within(desktopNav()).getByRole("link", { name: new RegExp(`^${link}`) }))
    expect(screen.getByTestId("location")).toHaveTextContent(path)
    expect(screen.getByRole("heading", { level: 1, name: title })).toBeInTheDocument()
    expect(screen.queryByText(/đang phát triển/i)).not.toBeInTheDocument()
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
    expect(screen.getByRole("heading", { level: 1, name: "Nhật ký kiểm soát ra vào cổng" })).toBeInTheDocument()
    expect(await screen.findByRole("searchbox")).toBeInTheDocument()
    expect(screen.queryByText(/đang phát triển/i)).not.toBeInTheDocument()
  })

  test("avatar lấy chữ viết tắt, bỏ phần trong ngoặc", () => {
    auth.user = { ...auth.user, fullName: "Trần Văn Quản Lý (HN-01)" }
    renderAt("/manager/units")
    expect(screen.getByText("QL")).toBeInTheDocument()
  })

  test("bấm nút tài khoản → popup Hồ sơ nhân sự (vai trò, email); Đăng xuất → signOut chung và về trang đăng nhập nội bộ", async () => {
    const user = renderAt("/manager/units")
    await user.click(screen.getByRole("button", { name: /tài khoản: trần văn quản lý/i }))
    const profile = await screen.findByRole("dialog", { name: /hồ sơ nhân sự/i })
    expect(within(profile).getByText(/quản lý chi nhánh/i)).toBeInTheDocument()
    expect(within(profile).getByText("manager.hn@smartstorage.vn")).toBeInTheDocument()
    await user.click(within(profile).getByRole("button", { name: /đăng xuất/i }))
    expect(auth.signOut).toHaveBeenCalledTimes(1)
    expect(screen.getByText("Trang đăng nhập nội bộ")).toBeInTheDocument()
  })

  test("màn hẹp: nút mở thanh điều hướng dọc; chọn trang thì tự đóng; Esc cũng đóng", async () => {
    const user = renderAt("/manager/units")
    const toggle = screen.getByRole("button", { name: /mở danh sách trang/i })
    expect(toggle).toHaveAttribute("aria-expanded", "false")
    await user.click(toggle)
    expect(screen.getByRole("button", { name: /đóng danh sách trang/i })).toHaveAttribute("aria-expanded", "true")
    await user.click(within(desktopNav()).getByRole("link", { name: /^Nhật ký cổng/ }))
    expect(screen.getByTestId("location")).toHaveTextContent("/manager/gate-logs")
    expect(screen.getByRole("button", { name: /mở danh sách trang/i })).toHaveAttribute("aria-expanded", "false")
    await user.click(screen.getByRole("button", { name: /mở danh sách trang/i }))
    await user.keyboard("{Escape}")
    expect(screen.getByRole("button", { name: /mở danh sách trang/i })).toHaveAttribute("aria-expanded", "false")
  })

  test("có footer chung của web: bản quyền, chính sách, điều khoản, hotline", () => {
    renderAt("/manager/units")
    const footer = screen.getByRole("contentinfo")
    expect(within(footer).getByText("© 2026 Smart Storage")).toBeInTheDocument()
    expect(within(footer).getByRole("button", { name: /chính sách bảo mật/i })).toBeInTheDocument()
    expect(within(footer).getByRole("button", { name: /điều khoản dịch vụ/i })).toBeInTheDocument()
    expect(within(footer).getByRole("link", { name: /hotline/i })).toHaveAttribute("href", "tel:1900391391")
  })

  test("mỗi mục trên thanh dọc có dòng mô tả ngắn", () => {
    renderAt("/manager/units")
    expect(within(desktopNav()).getByText("Loại kho & bảo trì")).toBeInTheDocument()
  })
})
