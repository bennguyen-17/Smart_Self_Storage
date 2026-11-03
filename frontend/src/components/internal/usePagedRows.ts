import { useState } from "react"

import { PAGE_SIZE, paginate } from "./pagination"

/**
 * Phân trang cho một bảng đã lọc, cố định 10 dòng mỗi trang. `resetKey` mô tả bộ lọc hiện tại: khi nó đổi thì quay về trang 1
 * (tránh đứng ở trang 3 trong khi kết quả lọc chỉ còn 1 trang).
 * Trả về `slice.rows` để vẽ bảng và `pagination` để truyền thẳng vào <Pagination />.
 */
export function usePagedRows<T>(rows: readonly T[], resetKey: string) {
  const [state, setState] = useState({ key: resetKey, page: 1 })
  const page = state.key === resetKey ? state.page : 1
  const slice = paginate(rows, page, PAGE_SIZE)

  return {
    slice,
    pagination: {
      slice,
      total: rows.length,
      onPageChange: (next: number) => setState({ key: resetKey, page: next }),
    },
  }
}
