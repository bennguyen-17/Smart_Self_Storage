// Ảnh nghiệp vụ của cổng Manager / Admin, theo luồng "tải ảnh trước" của BE (ImageStorageService):
//   1. POST /api/uploads (multipart: file + category) → { imageId, url } ở trạng thái PENDING
//   2. API nghiệp vụ nhận mã ảnh (receiptImageId, evidenceImageIds…) thì ảnh mới gắn vào phiếu / hợp đồng
// Ảnh hợp đồng / thanh toán (typeCode 2) BE chỉ trả khi có token đúng quyền, nên KHÔNG dùng thẳng <img src>
// (trình duyệt không gửi Authorization): tải về bằng apiClient (có token) rồi hiện bằng object URL.

import apiClient from "@/lib/apiClient"

/** Loại ảnh Manager được tải (BE kiểm quyền theo loại) */
export type ImageCategory = "REFUND_RECEIPT" | "FORFEIT_EVIDENCE" | "CHECKOUT_INSPECTION"

/** StoredImageResponse của BE */
export interface StoredImage {
  imageId: number
  url: string
  category?: string
  originalFileName?: string | null
  uploadedAt?: string | null
  uploadedBy?: string | null
}

/** Giống giới hạn của BE: JPG / PNG / WEBP, tối đa 5 MB mỗi ảnh, tối đa 5 ảnh mỗi lần xác nhận */
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024
export const IMAGE_MAX_PER_ACTION = 5
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp"
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

/** Kiểm tra trước ở FE để báo ngay (BE vẫn kiểm tra lại). null = hợp lệ */
export function imageFileError(file: { name: string; type: string; size: number }): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return `"${file.name}" không phải ảnh JPG, PNG hoặc WEBP`
  if (file.size > IMAGE_MAX_BYTES) return `"${file.name}" lớn hơn 5 MB`
  return null
}

/** BE trả url dạng "/api/images/12"; apiClient đã có tiền tố /api nên bỏ đi. Link ngoài (http…) giữ nguyên */
export function apiPathOf(url: string): string {
  if (/^https?:\/\//i.test(url)) return url
  return url.replace(/^\/api(?=\/)/, "")
}

/** Link ngoài (ví dụ biên lai cũ dán từ Drive) thì mở thẳng được; ảnh do hệ thống lưu thì phải tải kèm token */
export function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url)
}

/** POST /api/uploads: lưu ảnh tạm (PENDING), trả mã ảnh để gửi kèm API nghiệp vụ */
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

/** Tải ảnh kèm token rồi trả object URL để gắn vào <img>; nhớ URL.revokeObjectURL khi không dùng nữa */
export async function loadImageObjectUrl(url: string): Promise<string> {
  const blob = (await apiClient.get(apiPathOf(url), { responseType: "blob" })) as unknown as Blob
  return URL.createObjectURL(blob)
}
