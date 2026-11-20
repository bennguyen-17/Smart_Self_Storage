import { useState } from "react"

import { PAGE_SIZE, paginate } from "./pagination"

// Tự reset về trang 1 khi resetKey (bộ lọc) thay đổi
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
