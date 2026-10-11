import {
  BuildingIcon,
  ChartPieIcon,
  IdCardIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
  UserCogIcon,
  WarehouseIcon,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { cn } from "cn"

interface StaffTopBarProps {
  isDark: boolean
  onToggleTheme: () => void
}

const ROLES = [
  { key: "customer", label: "Web Portal (Khách)", Icon: MonitorIcon, to: "/customer_login" },
  { key: "staff", label: "Staff", Icon: IdCardIcon },
  { key: "manager", label: "Manager Chi Nhánh", Icon: ChartPieIcon },
  { key: "bom", label: "Quản Lý Hệ Thống (BOM)", Icon: BuildingIcon },
  { key: "admin", label: "Admin Hệ Thống", Icon: UserCogIcon },
] as const

/** Top navigation — bám prototype self_storage_prototype.html */
function StaffTopBar({ isDark, onToggleTheme }: StaffTopBarProps) {
  const navigate = useNavigate()

  function handleRole(key: string, to?: string) {
    if (key === "staff") return
    if (key === "customer" && to) {
      navigate(to)
      return
    }
    toast.info("Vai trò này chưa có trang riêng trong app (chỉ có ở prototype).")
  }

  return (
    <header className="portal-topbar sticky top-0 z-50 border-b transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* LOGO & BRAND */}
        <div className="flex shrink-0 items-center space-x-3">
          <div className="flex shrink-0 items-center justify-center rounded-xl bg-blue-600 p-2 font-bold text-white shadow-md">
            <WarehouseIcon className="size-5" />
          </div>
          <div className="flex-shrink-0 whitespace-nowrap">
            <span className="text-title block text-lg leading-tight font-black tracking-wider whitespace-nowrap">
              SELF-STORAGE 391
            </span>
            <span className="block text-[10px] font-bold tracking-widest text-blue-600 uppercase whitespace-nowrap">
              Proportional Floor Plan System
            </span>
          </div>
        </div>

        {/* THEME TOGGLE & ROLE SWITCHER */}
        <div className="flex shrink-0 items-center space-x-3 overflow-x-auto">
          <button
            type="button"
            onClick={onToggleTheme}
            className="inner-box flex shrink-0 items-center space-x-2 rounded-xl border px-3.5 py-1.5 text-xs font-bold shadow-sm transition whitespace-nowrap"
          >
            {isDark ? (
              <MoonIcon className="size-3.5 shrink-0 text-indigo-400" />
            ) : (
              <SunIcon className="size-3.5 shrink-0 text-amber-500" />
            )}
            <span className="text-title whitespace-nowrap">
              {isDark ? "Giao diện Tối" : "Giao diện Sáng"}
            </span>
          </button>

          <div className="h-6 w-px shrink-0 bg-slate-300 dark:bg-slate-700" />

          {/* ROLE SWITCHER */}
          <div className="inner-box flex shrink-0 overflow-x-auto rounded-xl border p-1">
            {ROLES.map(({ key, label, Icon, ...rest }) => {
              const active = key === "staff"
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleRole(key, "to" in rest ? rest.to : undefined)}
                  className={cn(
                    "flex cursor-pointer items-center gap-1 rounded-lg px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all",
                    active
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-muted hover:text-blue-600 dark:hover:text-blue-400"
                  )}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              )
            })}
          </div>

          {/* OVERDUE SIMULATOR (prototype-only) */}
          <div className="inner-box flex shrink-0 items-center space-x-2 rounded-xl border px-3 py-1.5">
            <span className="text-muted text-xs font-semibold whitespace-nowrap">
              Quá hạn:
            </span>
            <button
              type="button"
              aria-label="Giả lập quá hạn (prototype)"
              onClick={() =>
                toast.info("Nút giả lập Quá hạn chỉ có ở prototype.")
              }
              className="relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full bg-slate-300 transition dark:bg-slate-700"
            >
              <span className="absolute left-[2px] h-4 w-4 rounded-full border border-slate-300 bg-white transition" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default StaffTopBar
