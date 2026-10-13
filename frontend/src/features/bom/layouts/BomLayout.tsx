import { useState } from "react"
import { useLocation, useNavigate, useOutlet } from "react-router-dom"
import { toast } from "sonner"
import {
  Warehouse,
  SlidersHorizontal,
  ShieldAlert,
  FileSpreadsheet,
  Moon,
  Sun,
  Home,
  ChevronDown,
  X,
  LogOut,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { useTheme } from "@/components/common/theme-provider"
import { useAuth } from "@/context/AuthContext"
import ThreeBackground from "../components/ThreeBackground"
import { BomProvider } from "../context/BomContext"

const NAV_ITEMS = [
  {
    path: "/bom",
    label: "Tổng Quan Điều Hành",
    navLabel: "Tổng Quan",
    icon: Home,
  },
  {
    path: "/bom/facilities",
    label: "Giám Sát & Cơ Sở",
    navLabel: "Cơ Sở Kho",
    icon: Warehouse,
  },
  {
    path: "/bom/pricing",
    label: "Khung Giá & Phụ Phí",
    navLabel: "Khung Giá & Phí",
    icon: SlidersHorizontal,
  },
  {
    path: "/bom/policies",
    label: "Thông Số Vận Hành",
    navLabel: "Quy Chuẩn",
    icon: ShieldAlert,
  },
  {
    path: "/bom/reports",
    label: "Báo Cáo Doanh Thu",
    navLabel: "Báo Cáo",
    icon: FileSpreadsheet,
  },
]

function BomLayoutContent() {
  const { theme, setTheme } = useTheme()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const outlet = useOutlet()

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  const isDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)

  // Thông tin người dùng lấy trực tiếp từ Auth / Session
  const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null
  const parsedStoredUser = storedUser ? (() => { try { return JSON.parse(storedUser); } catch(e) { return null; } })() : null
  const currentUserName = user?.fullName || parsedStoredUser?.fullName || "Quản Trị Viên"
  const currentUserRole = user?.role ? (user.role === "BOM" ? "Ban Điều Hành (BOM)" : user.role) : "Chuyên viên Quản lý Vận hành"
  const currentUserEmail = user?.email || parsedStoredUser?.email || "bom@smartstorage.vn"
  const userInitials = currentUserName
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((w: string) => w[0].toUpperCase())
    .join("") || "BM"

  const isHome = location.pathname === "/bom" || location.pathname === "/bom/"

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success("Đã đăng xuất khỏi cổng điều hành BOM")
      navigate("/internal_login")
    } catch {
      toast.error("Lỗi khi đăng xuất")
    }
  }

  return (
    <div className="relative min-h-screen text-slate-100 font-sans transition-colors duration-200 overflow-x-hidden">
      {/* 3D Dynamic Waves Background */}
      <ThreeBackground theme={theme} />

      {/* Top Header - Fixed cố định vĩnh viễn trên đỉnh khi cuộn trang */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full min-h-[58px] bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-sky-500/20 px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4 shrink-0 shadow-lg text-slate-900 dark:text-white transition-colors">
        {/* BRAND LOGO (Đã bỏ chữ BOM theo yêu cầu) */}
        <div className="shrink-0 flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => navigate("/bom")}>
          <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:scale-105 transition-transform">
            <Warehouse className="size-5" />
          </div>
          <div>
            <div className="text-base sm:text-lg font-black tracking-tight leading-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Smart Storage</span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden xl:block leading-none mt-0.5">
              Hệ thống cho thuê kho tự quản thông minh 24/7
            </div>
          </div>
        </div>

        {/* CENTER CONTENT (NAVBAR TABS PILL - LUÔN HIỆN DIỆN, CHUYỂN ĐỘNG TRƯỢT LIÊN KẾT SIÊU MƯỢT) */}
        <div className="flex-1 flex justify-center items-center px-1 min-w-0">
          <div className="flex items-center gap-0.5 sm:gap-1 p-1 bg-slate-100/90 dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-sky-500/30 shadow-md backdrop-blur-md shrink-0">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive =
                item.path === "/bom"
                  ? location.pathname === "/bom" || location.pathname === "/bom/"
                  : location.pathname.startsWith(item.path)

              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={`relative px-2.5 sm:px-3 py-1.5 rounded-xl font-bold text-xs tracking-wide flex items-center gap-1.5 whitespace-nowrap transition-colors duration-200 cursor-pointer shrink-0 ${
                    isActive
                      ? "text-white dark:text-slate-950 font-black"
                      : "text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="bom-active-pill-indicator"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      className="absolute inset-0 bg-blue-600 dark:bg-cyan-500 rounded-xl shadow-md shadow-blue-500/30 dark:shadow-cyan-400/30 -z-10"
                    />
                  )}
                  <Icon className="size-3.5 sm:size-4 shrink-0" />
                  <span className="hidden sm:inline">{item.navLabel}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* CONTROLS & USER PROFILE */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
          {/* Nút Theme Toggle */}
          <button
            onClick={() => setTheme(isDarkMode ? "light" : "dark")}
            title={isDarkMode ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
            className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition cursor-pointer shadow-xs shrink-0"
          >
            {isDarkMode ? (
              <Sun className="size-4 text-amber-400" />
            ) : (
              <Moon className="size-4 text-slate-600" />
            )}
          </button>

          <div className="h-5 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block"></div>

          {/* User Profile Pill */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white text-slate-900 hover:bg-slate-50 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 transition cursor-pointer shadow-xs group text-left shrink-0"
            title="Nhấn để xem Hồ sơ & Đăng xuất"
            type="button"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
              {userInitials}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight flex items-center space-x-1">
                <span className="max-w-[130px] truncate">{currentUserName}</span>
                <ChevronDown className="size-3 text-slate-400 group-hover:text-blue-600 transition-colors ml-0.5 shrink-0" />
              </div>
              <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[130px]">
                {currentUserRole} ✓
              </div>
            </div>
          </button>
        </div>
      </header>

      {/* Main Workspace Outlet với hiệu ứng chuyển trang mượt mà liên kết */}
      <main className="relative z-10 w-full max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-20 pb-12 sm:pt-22">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="w-full"
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Modal Hồ Sơ Tài Khoản BOM */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white">
                  Hồ Sơ Ban Quản Lý Vận Hành
                </h3>
                <p className="text-[10px] text-slate-500 font-bold">
                  BOM (Board of Management) System Account Profile
                </p>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center space-x-3.5 p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900">
                <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                  {userInitials}
                </div>
                <div>
                  <div className="font-black text-sm text-sky-950 dark:text-sky-200">
                    {currentUserName}
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase mt-0.5">
                    ● ĐANG TRONG CA ĐIỀU HÀNH
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {currentUserRole} • Ban Quản Lý (BOM)
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-black uppercase text-slate-400">
                  1. Thông tin Định danh &amp; Công tác
                </div>
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 font-semibold">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Họ và Tên:</span>
                    <span className="text-slate-900 dark:text-white font-bold">{currentUserName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vai Trò:</span>
                    <span className="font-mono font-bold text-sky-600">{currentUserRole}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email:</span>
                    <span className="font-mono font-bold">{currentUserEmail}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => toast.info("Vui lòng liên hệ Admin để đổi mật khẩu tài khoản cấp cao.")}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Đổi Mật Khẩu
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <LogOut className="size-3.5" />
                <span>Đăng Xuất</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function BomLayout() {
  return (
    <BomProvider>
      <BomLayoutContent />
    </BomProvider>
  )
}
