import { LogOutIcon, MoonIcon, SunIcon, WarehouseIcon } from "lucide-react"

interface ManagerTopBarProps {
  /** Tên cổng hiện dưới logo; Admin Portal dùng lại thanh này với tên khác */
  portalName?: string
  fullName: string
  roleLabel: string
  isDark: boolean
  onToggleTheme: () => void
  onLogout: () => void
}

/** "Trần Văn Quản Lý (HN-01)" → "QL": bỏ phần trong ngoặc, lấy chữ cái đầu của 2 từ cuối */
function initials(fullName: string): string {
  const words = fullName
    .replace(/\(.*?\)/g, " ")
    .split(/\s+/)
    .filter((w) => /^\p{L}/u.test(w))
  if (words.length === 0) return "QL"
  return words
    .slice(-2)
    .map((w) => w[0].toUpperCase())
    .join("")
}

/** Thanh trên cùng của các cổng nội bộ Manager/Admin: cùng kiểu với cổng Staff (prototype), màu nhấn tím */
function ManagerTopBar({
  portalName = "Cổng Quản lý cơ sở",
  fullName,
  roleLabel,
  isDark,
  onToggleTheme,
  onLogout,
}: ManagerTopBarProps) {
  return (
    <header className="portal-topbar sticky top-0 z-50 flex h-16 w-full shrink-0 items-center justify-between border-b px-4 shadow-sm transition-colors sm:px-10">
      <div className="flex min-w-0 items-center space-x-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md">
          <WarehouseIcon className="size-5" strokeWidth={2.5} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <span className="text-title block text-base leading-tight font-bold">Smart Storage</span>
          <span className="text-muted hidden text-[11px] font-medium sm:block">{portalName}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
          className="inner-box flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold shadow-sm transition hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {isDark ? (
            <MoonIcon className="size-3.5 text-indigo-400" aria-hidden="true" />
          ) : (
            <SunIcon className="size-3.5 text-amber-500" aria-hidden="true" />
          )}
          <span className="text-title hidden sm:inline">{isDark ? "Giao diện Tối" : "Giao diện Sáng"}</span>
        </button>

        <div className="inner-box flex items-center gap-2.5 rounded-xl border px-3 py-1.5 shadow-sm">
          <div
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-xs font-black text-white"
          >
            {initials(fullName)}
          </div>
          <div className="hidden text-left md:block">
            <div className="text-title text-xs leading-tight font-extrabold">{fullName}</div>
            <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400">{roleLabel}</div>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="inner-box flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold text-rose-600 shadow-sm transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
        >
          <LogOutIcon className="size-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Đăng xuất</span>
        </button>
      </div>
    </header>
  )
}

export default ManagerTopBar
