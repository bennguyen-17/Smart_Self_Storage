export type UserRole = "ADMIN" | "BOM" | "MANAGER" | "STAFF" | "CUSTOMER"

/**
 * Chuẩn hóa giá trị role từ backend (hỗ trợ cả chuỗi "STAFF", "MANAGER", "BOM", "ADMIN", "CUSTOMER"
 * và số ID "1", "2", "3", "4", "5", hoặc "ROLE_...").
 */
export function normalizeRole(raw?: string | number | null): UserRole {
  if (!raw) return "CUSTOMER"
  const str = String(raw).toUpperCase().trim()

  if (str === "1" || str === "ADMIN" || str === "ROLE_ADMIN") return "ADMIN"
  if (str === "2" || str === "BOM" || str === "ROLE_BOM") return "BOM"
  if (str === "3" || str === "MANAGER" || str === "ROLE_MANAGER") return "MANAGER"
  if (str === "4" || str === "STAFF" || str === "ROLE_STAFF") return "STAFF"

  return "CUSTOMER"
}

/**
 * Xác định đường dẫn portal tương ứng theo vai trò.
 */
export function getRoleDestination(role: UserRole): string {
  switch (role) {
    case "STAFF":
      return "/staff/checkin"
    case "MANAGER":
      return "/manager"
    case "BOM":
      return "/bom"
    case "ADMIN":
      return "/admin"
    case "CUSTOMER":
    default:
      return "/portal"
  }
}

/**
 * Tên hiển thị tiếng Việt của vai trò.
 */
export function getRoleTitle(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "Quản Trị Viên Hệ Thống"
    case "BOM":
      return "Ban Giám Đốc"
    case "MANAGER":
      return "Quản Lý Chi Nhánh"
    case "STAFF":
      return "Nhân Viên Vận Hành"
    case "CUSTOMER":
    default:
      return "Khách Hàng"
  }
}

/**
 * Tên Cổng (Portal Name) tương ứng.
 */
export function getRolePortalName(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "Cổng Quản Trị Hệ Thống"
    case "BOM":
      return "Cổng Ban Giám Đốc"
    case "MANAGER":
      return "Cổng Quản Lý Chi Nhánh"
    case "STAFF":
      return "Cổng Vận Hành & Check-in"
    case "CUSTOMER":
    default:
      return "Cổng Khách Hàng"
  }
}

/**
 * Màu sắc badge theo vai trò.
 */
export function getRoleBadgeClass(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300"
    case "BOM":
      return "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300"
    case "MANAGER":
      return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300"
    case "STAFF":
      return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300"
    case "CUSTOMER":
    default:
      return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300"
  }
}
