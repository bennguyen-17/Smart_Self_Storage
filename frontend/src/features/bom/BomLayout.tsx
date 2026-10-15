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
  PanelLeft,
  LayoutGrid,
  ChevronRight,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { useTheme } from "@/components/common/theme-provider"
import { useAuth } from "@/context/AuthContext"
import ThreeBackground from "@/pages/bom/components/ThreeBackground"
import { BomProvider } from "@/pages/bom/context/BomContext"

const NAV_MODULES = [
  {
    path: "/bom/facilities",
    label: "Giám Sát & Cơ Sở",
    navLabel: "Cơ Sở Kho",
    subLabel: "Mặt bằng & Tỷ lệ lấp đầy",
    icon: Warehouse,
  },
  {
    path: "/bom/pricing",
    label: "Khung Giá & Phụ Phí",
    navLabel: "Khung Giá & Phí",
    subLabel: "Biểu giá thuê & Phí dịch vụ",
    icon: SlidersHorizontal,
  },
  {
    path: "/bom/policies",
    label: "Thông Số Vận Hành",
    navLabel: "Quy Chuẩn",
    subLabel: "Quy chuẩn an ninh & Chế tài",
    icon: ShieldAlert,
  },
  {
    path: "/bom/reports",
    label: "Báo Cáo Doanh Thu",
    navLabel: "Báo Cáo",
    subLabel: "Dòng tiền & Đối soát tài chính",
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const isDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)

  // Thông tin người dùng lấy trực tiếp từ Auth / Session
  const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null
  const parsedStoredUser = storedUser ? (() => { try { return JSON.parse(storedUser); } catch (e) { return null; } })() : null
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

      {/* Top Header - Fixed cố định trên đỉnh */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full min-h-[58px] bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-sky-500/20 px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4 shrink-0 shadow-lg text-slate-900 dark:text-white transition-colors">
        {/* BRAND LOGO & NÚT MENU MOBILE */}
        <div className="shrink-0 flex items-center gap-2 sm:gap-3">
          {/* Nút toggle mở sidebar trên mobile khi đang ở trang con */}
          {!isHome && (
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen((prev) => !prev)}
              className="lg:hidden p-2 rounded-xl bg-slate-800 text-sky-400 hover:text-white hover:bg-slate-700 border border-slate-700/80 cursor-pointer transition shadow-xs"
              title="Mở thanh điều hướng"
            >
              <PanelLeft className="size-4.5" />
            </button>
          )}

          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
            onClick={() => {
              navigate("/bom")
              setIsMobileSidebarOpen(false)
            }}
            title="Về Trang Chủ Điều Hành"
          >
            <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
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
        </div>

        {/* CENTER CONTENT - ĐÃ LOẠI BỎ THANH NAVBAR CHÍNH GIỮA THEO YÊU CẦU */}
        <div className="flex-1" />

        {/* CONTROLS & USER PROFILE */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
          {/* Nút Theme Toggle */}
          <button
            onClick={() => setTheme(isDarkMode ? "light" : "dark")}
            title={isDarkMode ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
            className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition cursor-pointer shadow-xs shrink-0"
          >
            {isDarkMode ? (
              <Sun className="size-4 text-slate-300" />
            ) : (
              <Moon className="size-4 text-slate-600" />
            )}
          </button>

          {/* User Profile Pill - Chỉ hiện trên Header khi ở trang chủ Tổng Quan (nơi không có thanh sidebar bên trái) */}
          {isHome && (
            <>
              <div className="h-5 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block"></div>
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white text-slate-900 hover:bg-slate-50 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 transition cursor-pointer shadow-xs group text-left shrink-0"
                title="Nhấn để xem Hồ sơ & Đăng xuất"
                type="button"
              >
                <div className="w-7 h-7 rounded-full bg-sky-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                  {userInitials}
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight flex items-center space-x-1">
                    <span className="max-w-[130px] truncate">{currentUserName}</span>
                    <ChevronDown className="size-3 text-slate-400 group-hover:text-sky-400 transition-colors ml-0.5 shrink-0" />
                  </div>
                  <div className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 truncate max-w-[130px]">
                    {currentUserRole}
                  </div>
                </div>
              </button>
            </>
          )}
        </div>
      </header>

      {/* THANH ĐIỀU HƯỚNG DỌC BÊN TRÁI (CHỈ XUẤT HIỆN KHI Ở TRANG CON, CÓ ANIMATION MƯỢT MÀ) */}
      <AnimatePresence>
        {!isHome && (
          <>
            {/* Lớp phủ mờ (Backdrop) trên màn hình mobile */}
            {isMobileSidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsMobileSidebarOpen(false)}
                className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden"
              />
            )}

            {/* Thanh Sidebar dọc bên trái */}
            <motion.aside
              key="bom-vertical-sidebar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className={`fixed top-[58px] bottom-0 left-0 z-40 w-64 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-2xl border-r border-slate-800/90 dark:border-sky-500/20 flex flex-col justify-between p-4 shadow-2xl transition-transform duration-300 lg:translate-x-0 ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                }`}
            >
              {/* Phần trên: Nút quay lại Tổng quan & Danh mục 4 Phân hệ */}
              <div className="space-y-4">
                {/* Nút Quay Về Tổng Quan (Hub 4 Cụm) */}
                <button
                  type="button"
                  onClick={() => {
                    navigate("/bom")
                    setIsMobileSidebarOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 transition cursor-pointer group shadow-sm"
                  title="Quay về trang Tổng quan 4 cụm chức năng"
                >
                  <div className="size-8 rounded-xl bg-sky-500/15 text-sky-400 group-hover:bg-sky-500 group-hover:text-slate-950 flex items-center justify-center transition-colors shrink-0">
                    <LayoutGrid className="size-4.5" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-xs font-black text-white truncate">Tổng Quan</div>
                  </div>
                  <ChevronRight className="size-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-0.5 transition shrink-0" />
                </button>

                {/* Tiêu đề nhóm quản trị */}
                <div className="pt-2">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-2 pb-2">
                    Danh Mục Quản Lý
                  </div>
                  <nav className="space-y-1.5">
                    {NAV_MODULES.map((item) => {
                      const Icon = item.icon
                      const isActive = location.pathname.startsWith(item.path)

                      return (
                        <motion.button
                          key={item.path}
                          layoutId={`bom-module-card-${item.path}`}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 28,
                            mass: 0.85,
                          }}
                          type="button"
                          onClick={() => {
                            navigate(item.path)
                            setIsMobileSidebarOpen(false)
                          }}
                          className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl font-bold text-xs tracking-wide transition-colors cursor-pointer text-left ${
                            isActive
                              ? "text-slate-950 font-black shadow-lg shadow-sky-500/25"
                              : "text-slate-300 dark:text-slate-300 hover:text-white hover:bg-slate-800/60"
                          }`}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="bom-sidebar-active-indicator"
                              transition={{ type: "spring", stiffness: 420, damping: 32 }}
                              className="absolute inset-0 bg-sky-500 rounded-2xl -z-10"
                            />
                          )}
                          <motion.div
                            layoutId={`bom-module-icon-${item.path}`}
                            transition={{ type: "spring", stiffness: 300, damping: 28 }}
                            className={`size-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                              isActive
                                ? "bg-slate-950/20 text-slate-950"
                                : "bg-slate-800/80 text-sky-400"
                            }`}
                          >
                            <Icon className="size-4" />
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <motion.div
                              layoutId={`bom-module-title-${item.path}`}
                              transition={{ type: "spring", stiffness: 300, damping: 28 }}
                              className="text-xs truncate font-extrabold"
                            >
                              {item.label}
                            </motion.div>
                            <div
                              className={`text-[10.5px] truncate font-semibold mt-0.5 ${
                                isActive ? "text-slate-950/90 font-bold" : "text-slate-400"
                              }`}
                            >
                              {item.subLabel}
                            </div>
                          </div>
                        </motion.button>
                      )
                    })}
                  </nav>
                </div>
              </div>

              {/* Phần dưới cùng: User Profile Pill ở góc dưới cùng bên trái */}
              <div className="pt-3 border-t border-slate-800/80 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileModalOpen(true)
                    setIsMobileSidebarOpen(false)
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition cursor-pointer group shadow-sm"
                  title="Nhấn để xem Hồ sơ & Đăng xuất"
                >
                  <div className="size-8.5 rounded-full bg-sky-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                    {userInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-white truncate flex items-center justify-between">
                      <span className="truncate">{currentUserName}</span>
                      <ChevronDown className="size-3.5 text-slate-400 group-hover:text-sky-400 transition-colors shrink-0 ml-1" />
                    </div>
                    <div className="text-[10.5px] font-semibold text-sky-400 truncate mt-0.5">
                      {currentUserRole}
                    </div>
                  </div>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main
        className={`relative z-10 w-full transition-all duration-300 pt-20 pb-12 sm:pt-22 ${isHome
            ? "max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12"
            : "lg:pl-72 px-4 sm:px-6 lg:pr-8 xl:pr-12 max-w-[1920px] mx-auto"
          }`}
      >
        <AnimatePresence mode="popLayout">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: isHome ? -10 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
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
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {currentUserRole}
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
