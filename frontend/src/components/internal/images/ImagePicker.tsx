import { useEffect, useId, useRef, useState } from "react"
import { ImagePlusIcon, XIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { readableError } from "@/components/internal/readableError"

import { IMAGE_ACCEPT, imageFileError, uploadImage, type ImageCategory } from "./imageApi"

/** Ảnh đã tải lên BE (PENDING): mã ảnh để gửi kèm API nghiệp vụ + ảnh xem trước trên máy */
export interface PickedImage {
  imageId: number
  name: string
  previewUrl: string
}

/**
 * Chọn ảnh minh chứng: chọn file → kiểm tra (JPG / PNG / WEBP, ≤ 5 MB) → tải lên ngay → hiện ảnh xem trước.
 * Ảnh xem trước lấy từ chính file trên máy (không cần gọi BE). `onChange` nhận danh sách ảnh đã tải xong.
 */
function ImagePicker({
  label,
  category,
  max,
  value,
  onChange,
  disabled = false,
}: {
  label: string
  category: ImageCategory
  max: number
  value: readonly PickedImage[]
  onChange: (next: PickedImage[]) => void
  disabled?: boolean
}) {
  const inputId = useId()
  const [uploading, setUploading] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const latest = useRef(value)
  useEffect(() => {
    latest.current = value
  }, [value])
  const slotsLeft = max - value.length

  // Rời form thì dọn ảnh xem trước khỏi bộ nhớ trình duyệt
  useEffect(() => () => latest.current.forEach((p) => URL.revokeObjectURL(p.previewUrl)), [])

  async function pick(files: FileList | null) {
    if (!files || files.length === 0) return
    const chosen = Array.from(files)
    const problems: string[] = []
    if (chosen.length > slotsLeft) problems.push(`Chỉ thêm được ${slotsLeft} ảnh nữa (tối đa ${max} ảnh)`)
    const accepted = chosen.slice(0, Math.max(0, slotsLeft)).filter((f) => {
      const err = imageFileError(f)
      if (err) problems.push(err)
      return !err
    })
    setErrors(problems)
    if (accepted.length === 0) return

    setUploading(accepted.length)
    const added: PickedImage[] = []
    for (const file of accepted) {
      try {
        const saved = await uploadImage(file, category)
        added.push({ imageId: saved.imageId, name: file.name, previewUrl: URL.createObjectURL(file) })
      } catch (err) {
        problems.push(`Không tải được "${file.name}": ${readableError(err)}`)
      }
      setUploading((n) => n - 1)
    }
    setErrors([...problems])
    if (added.length > 0) onChange([...latest.current, ...added])
  }

  function remove(imageId: number) {
    const gone = value.find((p) => p.imageId === imageId)
    if (gone) URL.revokeObjectURL(gone.previewUrl)
    onChange(value.filter((p) => p.imageId !== imageId))
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-title text-xs font-bold">
          {label} <span className="text-rose-500">*</span>
        </span>
        <span className="text-muted text-[11px]">
          {value.length}/{max} ảnh · JPG, PNG, WEBP, tối đa 5 MB
        </span>
      </div>

      {value.length > 0 && (
        <ul aria-label={`${label} đã chọn`} className="flex flex-wrap gap-2">
          {value.map((p) => (
            <li key={p.imageId} className="relative">
              <img src={p.previewUrl} alt={p.name} className="size-20 rounded-xl border object-cover" />
              <button
                type="button"
                disabled={disabled}
                onClick={() => remove(p.imageId)}
                aria-label={`Bỏ ảnh ${p.name}`}
                className="absolute -top-1.5 -right-1.5 flex size-5 cursor-pointer items-center justify-center rounded-full bg-slate-900 text-white shadow disabled:opacity-50"
              >
                <XIcon aria-hidden="true" className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {slotsLeft > 0 && (
        <>
          <input
            id={inputId}
            type="file"
            accept={IMAGE_ACCEPT}
            multiple={slotsLeft > 1}
            disabled={disabled || uploading > 0}
            aria-label={`Chọn ${label.toLowerCase()}`}
            className="sr-only"
            onChange={(e) => {
              void pick(e.target.files)
              e.target.value = ""
            }}
          />
          {/* Nhãn mang kiểu nút: bấm vào là mở hộp chọn file của ô input ẩn */}
          <label
            htmlFor={inputId}
            aria-disabled={disabled || uploading > 0}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "cursor-pointer aria-disabled:pointer-events-none aria-disabled:opacity-50",
            })}
          >
            {uploading > 0 ? <Spinner /> : <ImagePlusIcon aria-hidden="true" />}
            {uploading > 0 ? `Đang tải ${uploading} ảnh…` : value.length === 0 ? "Tải ảnh lên" : "Thêm ảnh"}
          </label>
        </>
      )}

      {errors.length > 0 && (
        <ul role="alert" className="space-y-0.5 text-[11px] font-semibold [overflow-wrap:anywhere] text-rose-600 dark:text-rose-400">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ImagePicker
