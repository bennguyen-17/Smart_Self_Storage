import { useEffect, useRef, useState } from "react"

import { getErrorMessage } from "@/lib/api"

interface AsyncState<T> {
  key: string
  data?: T
  error?: string
}

// Tải dữ liệu theo key (null = không tải); bỏ qua response cũ để tránh race condition khi đổi tab nhanh
export function useAsyncData<T>(key: string | null, load: () => Promise<T>) {
  const [state, setState] = useState<AsyncState<T> | null>(null)
  const loadRef = useRef(load)

  useEffect(() => {
    loadRef.current = load
  })

  useEffect(() => {
    if (key === null) return
    let ignore = false
    loadRef.current().then(
      (data) => {
        if (!ignore) setState({ key, data })
      },
      (error: unknown) => {
        if (!ignore) setState({ key, error: getErrorMessage(error) })
      }
    )
    return () => {
      ignore = true
    }
  }, [key])

  const current = state?.key === key ? state : null
  return {
    data: current?.data,
    error: current?.error,
    isLoading: key !== null && current === null,
  }
}
