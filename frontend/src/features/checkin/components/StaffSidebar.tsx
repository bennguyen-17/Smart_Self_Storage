import { useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import {
  IdCardIcon,
  KeyIcon,
  MoonIcon,
  SunIcon,
  UserCogIcon,
  WarehouseIcon,
  WrenchIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useAuth } from "@/context/AuthContext"
import StaffProfileModal from "./StaffProfileModal"

const NAV_ITEMS: {
  label: string
  to: string
  icon: typeof IdCardIcon
  color: string
}[] = [
  {
    label: "Dịch vụ khách hàng",
    to: "/staff/checkin",
    icon: IdCardIcon,
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    label: "Hỗ trợ & xử lý ticket (SLA)",
    to: "/staff/support",
    icon: WrenchIcon,
    color: "text-amber-500",
  },
  {
    label: "Lấy mã PIN",
    to: "/staff/pin",
    icon: KeyIcon,
    color: "text-emerald-500",
  },
]

function getInitials(name?: string | null): string {
  if (!name) return "NV"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

interface StaffSidebarProps {
  isDark: boolean
  onToggleTheme: () => void
}

/** Sidebar điều hướng cổng nhân viên vận hành — shadcn Sidebar (base-nova). */
function StaffSidebar({ isDark, onToggleTheme }: StaffSidebarProps) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [profileOpen, setProfileOpen] = useState(false)

  const staffName = user?.fullName || "Nguyễn Văn Staff"
  const staffRole =
    user?.role === "STAFF"
      ? "Chuyên viên Vận hành"
      : user?.role === "MANAGER"
        ? "Quản lý Cơ sở"
        : user?.role || "Chuyên viên Vận hành"
  const initials = getInitials(staffName)

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center gap-1.5 group-data-[collapsible=icon]:flex-col">
                <SidebarMenuButton
                  size="lg"
                  tooltip="Smart Storage"
                  className="min-w-0 flex-1 group-data-[collapsible=icon]:flex-none"
                >
                  <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <WarehouseIcon className="size-4" strokeWidth={2.5} />
                  </div>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-sm font-bold">
                      Smart Storage
                    </span>
                    <span className="truncate text-[11px] text-sidebar-foreground/70">
                      Cho thuê kho tự quản 24/7
                    </span>
                  </div>
                </SidebarMenuButton>

                <SidebarTrigger className="shrink-0" />
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-sm font-bold text-sidebar-foreground">
              Nghiệp vụ
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        render={<NavLink to={item.to} />}
                        isActive={pathname === item.to}
                        tooltip={item.label}
                        className="font-medium"
                      >
                        <Icon className={item.color} />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center gap-1.5 group-data-[collapsible=icon]:flex-col">
                <SidebarMenuButton
                  size="lg"
                  tooltip="Xem hồ sơ nhân viên"
                  onClick={() => setProfileOpen(true)}
                  className="min-w-0 flex-1 group-data-[collapsible=icon]:flex-none"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-xs font-black text-white">
                    {initials}
                  </div>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-xs font-extrabold">
                      {staffName}
                    </span>
                    <span className="flex items-center gap-1 truncate text-[11px] text-sidebar-foreground/70">
                      <UserCogIcon className="size-2.5 shrink-0" />
                      <span className="truncate">{staffRole}</span>
                    </span>
                  </div>
                </SidebarMenuButton>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onToggleTheme}
                  title={
                    isDark
                      ? "Chuyển sang giao diện Sáng"
                      : "Chuyển sang giao diện Tối"
                  }
                  className="shrink-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  {isDark ? (
                    <MoonIcon className="text-indigo-400" />
                  ) : (
                    <SunIcon className="text-amber-500" />
                  )}
                </Button>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <StaffProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </>
  )
}

export default StaffSidebar
