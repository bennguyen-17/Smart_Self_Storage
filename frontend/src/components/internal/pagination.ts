export const PAGE_SIZE = 10

export interface PageSlice<T> {
  rows: T[]
  page: number
  totalPages: number
  // 1-based; cả hai bằng 0 khi danh sách rỗng
  from: number
  to: number
}

// Tự kẹp page về trang cuối nếu vượt quá tổng trang sau khi lọc
export function paginate<T>(
  items: readonly T[],
  page: number,
  pageSize: number
): PageSlice<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const current = Math.min(Math.max(1, Math.floor(page) || 1), totalPages)
  const start = (current - 1) * pageSize
  const rows = items.slice(start, start + pageSize)
  return {
    rows,
    page: current,
    totalPages,
    from: rows.length === 0 ? 0 : start + 1,
    to: start + rows.length,
  }
}

// Tạo danh sách nút trang quanh trang hiện tại, ví dụ 5/20 -> [1, "…", 4, 5, 6, "…", 20]
export function pageWindow(page: number, totalPages: number): (number | "…")[] {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  )
  return pages.flatMap((p, i) =>
    i > 0 && p - pages[i - 1] > 1 ? ["…" as const, p] : [p]
  )
}
