import { isAxiosError } from "axios"

import type { ApiResponse } from "@/types"

/**
 * `apiClient` đã trả về `response.data`. Backend có thể bọc dữ liệu trong
 * ApiResponse { success, message, data } hoặc trả thẳng, nên bóc lớp bọc nếu có.
 */
export function unwrapApiData<T>(body: unknown): T {
  if (
    body !== null &&
    typeof body === "object" &&
    "success" in body &&
    "data" in body
  ) {
    return (body as ApiResponse<T>).data as T
  }
  return body as T
}

/** Lấy thông báo lỗi dễ đọc cho người dùng từ lỗi axios hoặc lỗi bất kỳ */
export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const serverMessage = (error.response?.data as { message?: string })
      ?.message
    if (serverMessage) return serverMessage
    if (error.response?.status === 404)
      return "Không tìm thấy API (404). Kiểm tra backend hoặc bật VITE_USE_MOCK."
    if (!error.response) return "Không kết nối được máy chủ."
  }
  return error instanceof Error ? error.message : "Đã có lỗi xảy ra."
}
