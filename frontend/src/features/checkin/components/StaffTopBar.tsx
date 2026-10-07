import {
  ChevronDownIcon,
  MoonIcon,
  ShieldCheckIcon,
  SunIcon,
  WarehouseIcon,
} from "lucide-react"

interface StaffTopBarProps {
  isDark: boolean
  onToggleTheme: () => void
  onOpenProfile: () => void
}

/** Thanh điều hướng trên cùng — bám prototype staff.html */
function StaffTopBar({ isDark, onToggleTheme, onOpenProfile }: StaffTopBarProps) {
  return (
    <header className="portal-topbar sticky top-0 z-50 flex h-16 w-full shrink-0 items-center justify-between border-b px-6 transition-colors sm:px-10">
      <div className="flex shrink-0 items-center space-x-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
          <WarehouseIcon className="size-5" />
        </div>
        <div>
          <div className="text-base leading-tight font-bold text-slate-900 dark:text-white">
            Smart Storage
          </div>
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Hệ thống cho thuê kho tự quản thông minh 24/7
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center space-x-3">
        <button
          type="button"
          onClick={onToggleTheme}
          className="inner-box flex cursor-pointer items-center space-x-2 rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-bold shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          {isDark ? (
            <MoonIcon className="size-3.5 text-indigo-400" />
          ) : (
            <SunIcon className="size-3.5 text-amber-500" />
          )}
          <span className="text-title text-xs whitespace-nowrap">
            {isDark ? "Giao diện Tối" : "Giao diện Sáng"}
          </span>
        </button>

        <div className="hidden h-6 w-px bg-slate-200 sm:block dark:bg-slate-700" />

        <button
          type="button"
          onClick={onOpenProfile}
          title="Nhấn để xem Hồ sơ Nhân viên Vận hành"
          className="inner-box group flex cursor-pointer items-center space-x-2.5 rounded-xl border border-slate-200 px-3 py-1.5 text-left shadow-sm transition hover:border-blue-500 hover:bg-blue-50/50 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:bg-slate-800"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-xs font-black text-white shadow-sm transition-transform group-hover:scale-105">
            NV
          </div>
          <div className="hidden text-left md:block">
            <div className="text-title flex items-center space-x-1 text-xs leading-tight font-extrabold">
              <span>Nguyễn Văn Staff</span>
              <ChevronDownIcon className="size-3 text-slate-400 group-hover:text-blue-600" />
            </div>
            <div className="flex items-center space-x-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">
              <ShieldCheckIcon className="size-2.5" />
              <span>Chuyên viên Vận hành</span>
            </div>
          </div>
        </button>
      </div>
    </header>
  )
}

export default StaffTopBar
