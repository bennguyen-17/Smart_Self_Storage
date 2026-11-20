// Luồng upload ảnh: tải lên /uploads (PENDING) trước để lấy imageId rồi gửi kèm API nghiệp vụ.
// Ảnh cần xác thực không gắn thẳng vào <img src> vì trình duyệt không gửi Authorization header, mà tải blob qua apiClient.

import apiClient from "@/lib/apiClient"

export type ImageCategory = "REFUND_RECEIPT" | "FORFEIT_EVIDENCE" | "CHECKOUT_INSPECTION"

export interface StoredImage {
  imageId: number
  url: string
  category?: string
  originalFileName?: string | null
  uploadedAt?: string | null
  uploadedBy?: string | null
}

// Khớp giới hạn upload phía BE: JPG/PNG/WEBP, tối đa 5 MB và 5 ảnh mỗi lần
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024
export const IMAGE_MAX_PER_ACTION = 5
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp"
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

export function imageFileError(file: { name: string; type: string; size: number }): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return `"${file.name}" không phải ảnh JPG, PNG hoặc WEBP`
  if (file.size > IMAGE_MAX_BYTES) return `"${file.name}" lớn hơn 5 MB`
  return null
}

// Bỏ tiền tố /api vì apiClient đã cấu hình baseURL, giữ nguyên link ngoài
export function apiPathOf(url: string): string {
  if (/^https?:\/\//i.test(url)) return url
  return url.replace(/^\/api(?=\/)/, "")
}

export function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url)
}

export async function uploadImage(file: File, category: ImageCategory): Promise<StoredImage> {
  const form = new FormData()
  form.append("file", file)
  form.append("category", category)
  const res = (await apiClient.post("/uploads", form, {
    headers: { "Content-Type": "multipart/form-data" },
  })) as unknown as StoredImage
  if (!res?.imageId) throw new Error("Máy chủ không trả về mã ảnh sau khi tải lên.")
  return res
}

// Caller cần gọi URL.revokeObjectURL khi không còn dùng để tránh leak bộ nhớ
export async function loadImageObjectUrl(url: string): Promise<string> {
  const blob = (await apiClient.get(apiPathOf(url), { responseType: "blob" })) as unknown as Blob
  return URL.createObjectURL(blob)
}
