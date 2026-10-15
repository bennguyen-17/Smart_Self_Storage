import axios, { isAxiosError } from 'axios';
import type { ApiResponse } from '@/types';

// Base URL lấy từ biến môi trường .env hoặc mặc định Spring Boot (/api)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Cờ bật tắt Mock Data: Luôn gọi Backend thật 100%
export const isMockMode = () => false;

// Hàm kiểm tra token JWT hợp lệ
export const isTokenValid = (token: string | null) => {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return true; // Có thể là mock token, bỏ qua check JWT
  try {
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    }
    return true;
  } catch (e) {
    return false;
  }
};

// Tạo Axios instance dùng chung cho toàn bộ dự án
export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Tự động đính kèm Token khi gọi API
http.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      try {
        const rawAuth = localStorage.getItem('auth_session') || sessionStorage.getItem('auth_session');
        if (rawAuth) {
          const parsed = JSON.parse(rawAuth);
          token = parsed?.token;
        }
      } catch (e) {}
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Xử lý dữ liệu và lỗi chung (401, 403, 500)
http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('[HTTP 401/403] Phiên đăng nhập hết hạn hoặc không đủ quyền.');
    }
    return Promise.reject(error);
  }
);

/**
 * `http` đã trả về `response.data`. Backend có thể bọc dữ liệu trong
 * ApiResponse { success, message, data } hoặc trả thẳng, nên bóc lớp bọc nếu có.
 */
export function unwrapApiData<T>(body: unknown): T {
  if (
    body !== null &&
    typeof body === 'object' &&
    'success' in body &&
    'data' in body
  ) {
    return (body as ApiResponse<T>).data as T;
  }
  return body as T;
}

/** Lấy thông báo lỗi dễ đọc cho người dùng từ lỗi axios hoặc lỗi bất kỳ */
export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const serverMessage = (error.response?.data as { message?: string })?.message;
    if (serverMessage) return serverMessage;
    if (error.response?.status === 404)
      return 'Không tìm thấy API (404). Kiểm tra backend.';
    if (!error.response) return 'Không thể kết nối đến máy chủ Backend.';
  }
  return error instanceof Error ? error.message : 'Đã có lỗi xảy ra.';
}

export default http;
