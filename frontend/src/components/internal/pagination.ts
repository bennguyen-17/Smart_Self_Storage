// Phân trang phía FE cho các bảng của cổng nội bộ. Hàm thuần, kiểm bằng bảng DDT.

export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const

export interface PageSlice<T> {
  rows: T[]
  /** Trang đang xem (bắt đầu từ 1), đã kẹp vào khoảng hợp lệ */
  page: number
  totalPages: number
  /** Số thứ tự dòng đầu / cuối đang hiện (bắt đầu từ 1); bảng rỗng thì cả hai là 0 */
  from: number
  to: number
}

/** Cắt đúng một trang; trang vượt quá (ví dụ sau khi lọc bớt) thì lùi về trang cuối */
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

/**
 * Các nút số trang cần hiện: luôn có trang đầu, trang cuối và 1 trang mỗi bên trang đang xem;
 * chỗ bị bỏ qua thay bằng "…". Ví dụ trang 5/20 → [1, "…", 4, 5, 6, "…", 20].
 */
export function pageWindow(page: number, totalPages: number): (number | "…")[] {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  )
  return pages.flatMap((p, i) =>
    i > 0 && p - pages[i - 1] > 1 ? ["…" as const, p] : [p]
  )
}
