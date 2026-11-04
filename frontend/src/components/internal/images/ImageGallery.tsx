import { useState } from "react"
import { ImageIcon } from "lucide-react"

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { formatDateTime } from "@/lib/format"

import AuthImage from "./AuthImage"
import type { StoredImage } from "./imageApi"

/**
 * Dãy ảnh thu nhỏ (ảnh nghiệm thu, minh chứng thanh lý…); bấm vào thì phóng to kèm người chụp và thời điểm.
 * Không có ảnh thì hiện câu `emptyText`, không để khung trống.
 */
function ImageGallery({ images, label, emptyText }: { images: readonly StoredImage[]; label: string; emptyText: string }) {
  const [viewing, setViewing] = useState<StoredImage | null>(null)

  if (images.length === 0) {
    return (
      <p className="text-muted inner-box flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs">
        <ImageIcon aria-hidden="true" className="size-3.5 shrink-0" />
        {emptyText}
      </p>
    )
  }

  return (
    <>
      <ul aria-label={label} className="flex flex-wrap gap-2">
        {images.map((img, i) => (
          <li key={img.imageId}>
            <button
              type="button"
              onClick={() => setViewing(img)}
              aria-label={`Xem ${label.toLowerCase()} ${i + 1}`}
              className="block cursor-pointer overflow-hidden rounded-xl border focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
            >
              <AuthImage url={img.url} alt={`${label} ${i + 1}`} className="size-20" />
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="portal-dialog gap-3 sm:max-w-2xl">
          <DialogTitle className="text-sm font-black">{label}</DialogTitle>
          <DialogDescription className="text-xs">
            {[viewing?.uploadedBy, viewing?.uploadedAt ? formatDateTime(viewing.uploadedAt) : null].filter(Boolean).join(" · ") ||
              "Ảnh đính kèm"}
          </DialogDescription>
          {viewing && <AuthImage url={viewing.url} alt={label} className="max-h-[70vh] w-full rounded-xl object-contain" />}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ImageGallery
