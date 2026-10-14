import { useSyncExternalStore } from "react"

const QUERY = "(prefers-color-scheme: dark)"

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener("change", onChange)
  return () => mq.removeEventListener("change", onChange)
}

/** true khi hệ điều hành đang ở chế độ tối; tự cập nhật khi người dùng đổi. */
export function useSystemDark(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false
  )
}
