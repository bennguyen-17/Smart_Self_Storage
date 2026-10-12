import { Link, useNavigate } from "react-router-dom"
import {
  BarChart3Icon,
  BuildingIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileTextIcon,
  KeyRoundIcon,
  LogOutIcon,
  MoonIcon,
  ShieldCheckIcon,
  SunIcon,
  UserCheckIcon,
  WarehouseIcon,
  WrenchIcon,
} from "lucide-react"
import { toast } from "sonner"

import { useTheme } from "@/components/common/theme-provider"
import { useAuth } from "@/context/AuthContext"
import {
  getRoleBadgeClass,
  getRolePortalName,
  getRoleTitle,
  normalizeRole,
  type UserRole,
} from "@/lib/roles"

interface RolePortalPlaceholderPageProps {
  portalType: "BOM" | "MANAGER" | "ADMIN"
}

function resolveIsDark(theme: string): boolean {
  if (theme === "dark") return true
  if (theme === "light") return false
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  )
}

function getInitials(name?: string | null): string {
  if (!name) return "QL"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Trang Placeholder cho các cổng đang cập nhật (BOM, Manager, Admin)
 * Chứng minh phân quyền thành công và hiển thị lộ trình tính năng.
 */
function RolePortalPlaceholderPage({
  portalType,
}: RolePortalPlaceholderPageProps) {
  const { theme, setTheme } = useTheme()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const isDark = resolveIsDark(theme)
  const userRole = normalizeRole(user?.role)
  const roleTitle = getRoleTitle(portalType)
  const portalName = getRolePortalName(portalType)
  const badgeClass = getRoleBadgeClass(portalType)

  const userName = user?.fullName || `Cán bộ ${portalType}`
  const userEmail = user?.email || `${portalType.toLowerCase()}@swp391.vn`
  const userPhone = (user as { phone?: string })?.phone || "0909 xxx xxx"
  const branchName =
    (user as { facilityName?: string })?.facilityName || "Khu vực TP. Hồ Chí Minh"
  const initials = getInitials(userName)

  function handleLogout() {
    signOut()
    toast.success("Đã đăng xuất khỏi phiên làm việc.")
    navigate("/internal_login")
  }

  // Cấu hình nội dung đặc thù cho từng Portal
  const config = {
    BOM: {
      tag: "BAN ĐIỀU HÀNH & HỘI ĐỒNG QUẢN TRỊ",
      headline: "Trang Cổng Ban Giám Đốc (BOM) đang được cập nhật",
      colorClass: "from-purple-950 via-slate-900 to-indigo-950",
      accentBorder: "border-purple-500/30",
      accentText: "text-purple-400",
      icon: <BarChart3Icon className="size-6 text-purple-400" />,
      features: [
        {
          title: "Báo cáo Doanh thu & Dòng tiền Toàn Hệ thống",
          desc: "Thống kê tổng hợp tiền thuê kho, tiền cọc thực thu và các khoản khấu trừ bồi hoàn.",
        },
        {
          title: "Chỉ số Tỷ lệ Lấp đầy Kho theo Thời gian thực",
          desc: "Biểu đồ trực quan tỷ lệ lấp đầy theo từng cơ sở (Quận 9, Bình Thạnh, ...) và từng loại size S/M/L/XL.",
        },
        {
          title: "Duyệt Chính sách Bảng giá & Chiến lược Kinh doanh",
          desc: "Phê duyệt điều chỉnh giá thuê theo mùa cao điểm và các gói ưu đãi hợp đồng dài hạn.",
        },
        {
          title: "Giám sát An ninh & Báo cáo Sự cố Cấp cao",
          desc: "Theo dõi nhật ký mở cổng 24/7 và cảnh báo sự cố vi phạm vượt ngưỡng SLA.",
        },
      ],
      shortcuts: [],
    },
    MANAGER: {
      tag: "QUẢN LÝ CƠ SỞ & VẬN HÀNH CHI NHÁNH",
      headline: "Trang Cổng Quản Lý Chi Nhánh (Manager) đang được cập nhật",
      colorClass: "from-amber-950 via-slate-900 to-indigo-950",
      accentBorder: "border-amber-500/30",
      accentText: "text-amber-400",
      icon: <BuildingIcon className="size-6 text-amber-400" />,
      features: [
        {
          title: "Điều phối Ca trực & Phân công Nhân viên",
          desc: "Quản lý lịch trực quầy (08:00 - 20:00) và cấp quyền PIN mở cổng khẩn cấp cho nhân viên vận hành.",
        },
        {
          title: "Duyệt Biên bản Nghiệm thu & Chiết khấu",
          desc: "Phê duyệt các trường hợp bồi hoàn cọc hư hại nặng hoặc chiết khấu thanh lý hợp đồng.",
        },
        {
          title: "Quản lý Bảo trì Ô kho (Maintenance Mode)",
          desc: "Tạm khóa ô kho hư hỏng, chuyển trạng thái bảo trì và giao việc cho kỹ thuật viên.",
        },
        {
          title: "Xử lý Tranh chấp & Giám sát Vi phạm SLA",
          desc: "Tiếp nhận các ticket sự cố quá 15 phút chưa được nhân viên xử lý để can thiệp kịp thời.",
        },
      ],
      shortcuts: [
        {
          label: "Xem Quản Lý Đơn Cọc & No-Show",
          path: "/staff/reservations",
          icon: <FileTextIcon className="size-4" />,
        },
        {
          label: "Xem Cổng Vận Hành Kho (Check-in)",
          path: "/staff/checkin",
          icon: <UserCheckIcon className="size-4" />,
        },
      ],
    },
    ADMIN: {
      tag: "QUẢN TRỊ VIÊN HỆ THỐNG CẤP CAO",
      headline: "Trang Cổng Quản Trị Hệ Thống (Admin) đang được cập nhật",
      colorClass: "from-rose-950 via-slate-900 to-indigo-950",
      accentBorder: "border-rose-500/30",
      accentText: "text-rose-400",
      icon: <WrenchIcon className="size-6 text-rose-400" />,
      features: [
        {
          title: "Quản lý Tài khoản & Phân quyền Phân vai (RBAC)",
          desc: "Tạo mới, khóa/mở khóa tài khoản Staff, Manager, BOM và cấp phân quyền chi nhánh.",
        },
        {
          title: "Cấu hình Cơ sở, Tầng & Ô kho lưu trữ",
          desc: "Thiết lập sơ đồ mặt bằng 2D, kích thước ô kho và định giá niêm yết theo danh mục.",
        },
        {
          title: "Nhật ký Kiểm toán An ninh (Audit Logs)",
          desc: "Tra cứu toàn bộ lịch sử thao tác hệ thống, mở cổng khẩn cấp và giao dịch thanh toán.",
        },
        {
          title: "Tích hợp Hạ tầng Cổng Thanh toán & SMS/Email",
          desc: "Cấu hình Webhook thanh toán cọc tự động và máy chủ gửi mã OTP kích hoạt tài khoản.",
        },
      ],
      shortcuts: [
        {
          label: "Xem Quản Lý Đơn Cọc & No-Show",
          path: "/staff/reservations",
          icon: <FileTextIcon className="size-4" />,
        },
        {
          label: "Xem Cổng Vận Hành Kho (Check-in)",
          path: "/staff/checkin",
          icon: <UserCheckIcon className="size-4" />,
        },
      ],
    },
  }[portalType]

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 antialiased dark:bg-slate-950">
      {/* TOPBAR */}
      <header className="portal-topbar sticky top-0 z-50 flex h-16 w-full shrink-0 items-center justify-between border-b bg-white px-6 shadow-sm transition-colors dark:bg-slate-900 sm:px-10">
        <div className="flex shrink-0 items-center space-x-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
            <WarehouseIcon className="size-5" strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-title block text-base leading-tight font-bold">
              Smart Storage
            </span>
            <span className="text-muted block text-[11px] font-medium">
              Hệ thống cho thuê kho tự quản thông minh 24/7
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center space-x-3">
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="inner-box flex cursor-pointer items-center space-x-2 rounded-xl border px-3 py-1.5 text-xs font-bold whitespace-nowrap shadow-sm transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {isDark ? (
              <MoonIcon className="size-3.5 shrink-0 text-indigo-400" />
            ) : (
              <SunIcon className="size-3.5 shrink-0 text-amber-500" />
            )}
            <span className="text-title hidden text-xs md:inline">
              {isDark ? "Giao diện Tối" : "Giao diện Sáng"}
            </span>
          </button>

          <div className="hidden h-6 w-px bg-slate-200 sm:block dark:bg-slate-700" />

          {/* USER INFO PILL */}
          <div className="flex items-center space-x-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-800/80">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-xs font-black text-white shadow-sm">
              {initials}
            </div>
            <div className="hidden text-left sm:block">
              <div className="text-xs font-extrabold text-foreground">
                {userName}
              </div>
              <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                {roleTitle}
              </div>
            </div>
          </div>

          {/* LOGOUT */}
          <button
            type="button"
            onClick={handleLogout}
            title="Đăng xuất tài khoản"
            className="flex cursor-pointer items-center space-x-1.5 rounded-xl border border-rose-200/70 px-2.5 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50 dark:border-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-950/40"
          >
            <LogOutIcon className="size-3.5" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="space-y-6">
          {/* PROOF OF AUTHORIZATION BANNER */}
          <div
            className={`card-box flex flex-col justify-between gap-4 rounded-3xl border ${config.accentBorder} bg-gradient-to-r ${config.colorClass} p-6 text-white shadow-xl md:flex-row md:items-center`}
          >
            <div className="flex items-start space-x-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 shadow-inner backdrop-blur-md">
                {config.icon}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase">
                    {config.tag}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase ${badgeClass}`}
                  >
                    Quyền hạn: {portalType}
                  </span>
                </div>
                <h1 className="text-lg font-black tracking-wide sm:text-2xl">
                  {portalName}
                </h1>
                <p className="text-xs text-slate-300 sm:text-sm">
                  Tài khoản cán bộ: <b className="text-white">{userName}</b> • Email:{" "}
                  <b className="text-white">{userEmail}</b>
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <span className="inline-flex items-center space-x-2 rounded-2xl border border-emerald-400/40 bg-emerald-950/80 px-4 py-2 text-xs font-black text-emerald-300 shadow">
                <ShieldCheckIcon className="size-4 text-emerald-400" />
                <span>Xác thực phân quyền: HỢP LỆ</span>
              </span>
            </div>
          </div>

          {/* NOTICE: TRANG ĐANG CẬP NHẬT */}
          <div className="card-box rounded-3xl border border-amber-500/30 bg-amber-50/50 p-6 shadow-sm dark:bg-amber-950/20">
            <div className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 shadow">
                <ClockIcon className="size-5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-base font-black text-amber-900 dark:text-amber-200 sm:text-lg">
                  🚧 {config.headline}
                </h2>
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 sm:text-sm">
                  Hệ thống đã xác thực danh tính thành công và phân quyền truy cập chính xác cho tài khoản{" "}
                  <b className="font-extrabold text-foreground">{userName}</b> với vai trò{" "}
                  <b className="font-extrabold text-blue-600 dark:text-blue-400">{roleTitle}</b> ({portalType}).
                  Các module phân tích chuyên sâu và giao diện vận hành điều hành của cổng này đang trong lộ trình hoàn thiện phiên bản tiếp theo.
                </p>
              </div>
            </div>
          </div>

          {/* ROADMAP & PLANNED FEATURES PREVIEW */}
          <div className="card-box space-y-4 rounded-3xl border p-6 shadow-sm">
            <h3 className="text-title flex items-center space-x-2 text-sm font-extrabold uppercase sm:text-base">
              <CheckCircle2Icon className="size-4 text-blue-600" />
              <span>CÁC PHÂN HỆ ĐIỀU HÀNH THUỘC VAI TRÒ {portalType}</span>
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {config.features.map((item, idx) => (
                <div
                  key={item.title}
                  className="inner-box rounded-2xl border p-4 transition hover:border-blue-400"
                >
                  <div className="flex items-center space-x-2">
                    <span className="flex size-6 items-center justify-center rounded-full bg-blue-100 font-mono text-xs font-black text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                      {idx + 1}
                    </span>
                    <h4 className="text-title text-xs font-black sm:text-sm">
                      {item.title}
                    </h4>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* SHORTCUTS (IF ANY) & ACTIONS */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <div className="flex flex-wrap items-center gap-2">
              {config.shortcuts.map((sc) => (
                <Link
                  key={sc.path}
                  to={sc.path}
                  className="flex items-center space-x-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-blue-700"
                >
                  {sc.icon}
                  <span>{sc.label} →</span>
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <Link
                to="/internal_login"
                className="flex items-center space-x-1.5 rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <span>Cổng Đăng Nhập Nội Bộ</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="flex cursor-pointer items-center space-x-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-rose-700"
              >
                <LogOutIcon className="size-3.5" />
                <span>Đăng Xuất Tài Khoản</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default RolePortalPlaceholderPage
