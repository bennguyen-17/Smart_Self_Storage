import apiClient from "@/lib/apiClient"

// Upload ảnh nghiệm thu qua POST /api/uploads (JPEG/PNG/WebP, tối đa 5 MB).
// Ảnh ở trạng thái PENDING cho tới khi API checkout gắn imageId vào hợp đồng.
export const UPLOAD_IMAGE_ENDPOINT = "/uploads"
export const CHECKOUT_INSPECTION_CATEGORY = "CHECKOUT_INSPECTION"

export interface UploadedImage {
  imageId: number
  typeCode: number
  category: string
  url: string
  originalFileName?: string
  contentType?: string
  fileSize?: number
  uploadedAt?: string
  uploadedBy?: string
}

export async function uploadCheckoutInspectionImage(file: File): Promise<UploadedImage> {
  const form = new FormData()
  form.append("file", file)
  form.append("category", CHECKOUT_INSPECTION_CATEGORY)

  const response = (await apiClient.post(UPLOAD_IMAGE_ENDPOINT, form, {
    headers: { "Content-Type": "multipart/form-data" },
  })) as unknown as UploadedImage

  if (!response?.imageId) {
    throw new Error("Máy chủ không trả về mã ảnh sau khi tải lên.")
  }

  return response
}
