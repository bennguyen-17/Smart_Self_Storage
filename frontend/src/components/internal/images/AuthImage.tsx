import { useEffect, useState } from "react"
import { ImageOffIcon } from "lucide-react"
import { cn } from "cn"

import { isExternalUrl, loadImageObjectUrl } from "./imageApi"

type LoadState = { url: string; src: string | null; failed: boolean }

/**
 * Hiện ảnh do hệ thống lưu (cần token): tải bằng apiClient rồi gắn object URL vào <img>.
 * Link ngoài (http…) thì dùng thẳng. Đang tải → khung xám nhấp nháy; lỗi → "Không tải được ảnh".
 */
function AuthImage({ url, alt, className }: { url: string; alt: string; className?: string }) {
  const external = isExternalUrl(url)
  const [state, setState] = useState<LoadState | null>(null)

  useEffect(() => {
    if (external) return
    let objectUrl: string | null = null
    let ignore = false
    loadImageObjectUrl(url).then(
      (src) => {
        objectUrl = src
        if (ignore) URL.revokeObjectURL(src)
        else setState({ url, src, failed: false })
      },
      () => {
        if (!ignore) setState({ url, src: null, failed: true })
      }
    )
    return () => {
      ignore = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [url, external])

  const current = state?.url === url ? state : null
  const src = external ? url : current?.src

  if (!external && current?.failed) {
    return (
      <div className={cn("text-muted flex flex-col items-center justify-center gap-1 bg-slate-100 text-[11px] dark:bg-slate-800", className)}>
        <ImageOffIcon aria-hidden="true" className="size-4" />
        Không tải được ảnh
      </div>
    )
  }
  if (!src) {
    return <div role="img" aria-label={`Đang tải ${alt}`} className={cn("animate-pulse bg-slate-200 dark:bg-slate-800", className)} />
  }
  return <img src={src} alt={alt} className={cn("object-cover", className)} />
}

export default AuthImage
