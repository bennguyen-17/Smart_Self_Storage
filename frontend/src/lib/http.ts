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

// Request Interceptor: Tự động đính kèm Token, X-Facility-Id và X-Account-Id khi gọi API
http.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem('token') || sessionStorage.getItem('token');
    let user: Record<string, any> | null = null;
    try {
      const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (rawUser) user = JSON.parse(rawUser);
    } catch {}

    if (!token || !user) {
      try {
        const rawAuth = localStorage.getItem('auth_session') || sessionStorage.getItem('auth_session');
        if (rawAuth) {
          const parsed = JSON.parse(rawAuth);
          if (!token) token = parsed?.token;
          if (!user) user = parsed?.user;
        }
      } catch {}
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (user?.facilityId && !config.headers['X-Facility-Id']) {
      config.headers['X-Facility-Id'] = String(user.facilityId);
    }
    if ((user?.id || user?.accountId) && !config.headers['X-Account-Id']) {
      config.headers['X-Account-Id'] = String(user.id || user.accountId);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Xử lý dữ liệu và lỗi chung (401, 403, 500)
http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const isLoginRequest =
      error.config?.url?.includes('/login') ||
      error.config?.url?.includes('/auth/login');

    if (error.response?.status === 401 && !isLoginRequest) {
      console.warn('[HTTP 401] Phiên đăng nhập đã hết hạn. Đang đăng xuất...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('auth_session');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('auth_session');

      if (typeof window !== 'undefined' && !window.location.pathname.includes('login')) {
        const isInternal =
          window.location.pathname.startsWith('/staff') ||
          window.location.pathname.startsWith('/manager') ||
          window.location.pathname.startsWith('/admin') ||
          window.location.pathname.startsWith('/bom');
        window.location.href = isInternal ? '/internal_login' : '/customer_login';
      }
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
    const data = error.response?.data;
    if (typeof data === 'string' && data.trim()) return data;
    const serverMessage = (data as { message?: string })?.message;
    if (serverMessage) return serverMessage;
    if (error.response?.status === 401)
      return 'Phiên đăng nhập hết hạn hoặc chưa đăng nhập. Vui lòng đăng nhập lại.';
    if (error.response?.status === 403)
      return 'Tài khoản không đủ quyền hoặc chưa được gắn cơ sở.';
    if (error.response?.status === 404)
      return 'Không tìm thấy API (404). Kiểm tra backend.';
    if (!error.response) return 'Không thể kết nối đến máy chủ Backend.';
  }
  return error instanceof Error ? error.message : 'Đã có lỗi xảy ra.';
}

export default http;
