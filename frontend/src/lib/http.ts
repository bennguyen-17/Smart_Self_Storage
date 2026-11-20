import axios, { isAxiosError } from 'axios';
import type { ApiResponse } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const isMockMode = () => false;

export const isTokenValid = (token: string | null) => {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return true; // Bỏ qua check exp nếu token không theo dạng JWT 3 phần
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

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
      let headerAccId = String(user.id || user.accountId);
      if (token && token.split('.').length === 3) {
        try {
          const claims = JSON.parse(atob(token.split('.')[1]));
          if (claims?.userId) headerAccId = String(claims.userId);
        } catch {}
      }
      config.headers['X-Account-Id'] = headerAccId;
    }
    if (false) {
      config.headers['X-Account-Id'] = String(user.id || user.accountId);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

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

// Interceptor đã trả response.data, bóc thêm lớp ApiResponse nếu BE có bọc
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

function cleanErrorMessage(raw: string): string {
  if (!raw) return '';
  let msg = raw.trim();
  if (msg.startsWith('Lỗi hệ thống:')) {
    msg = msg.replace(/^Lỗi hệ thống:\s*/, '').trim();
  }
  msg = msg.replace(/^\d{3}\s+[A-Z_]+(?:\s+)?/, '').trim();
  if (msg.startsWith('"') && msg.endsWith('"') && msg.length >= 2) {
    msg = msg.slice(1, -1).trim();
  }
  return msg;
}

export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === 'string' && data.trim()) return cleanErrorMessage(data);
    const serverMessage = (data as { message?: string })?.message;
    if (serverMessage) return cleanErrorMessage(serverMessage);
    if (error.response?.status === 401)
      return 'Phiên đăng nhập hết hạn hoặc chưa đăng nhập. Vui lòng đăng nhập lại.';
    if (error.response?.status === 403)
      return 'Tài khoản không đủ quyền hoặc chưa được gắn cơ sở.';
    if (error.response?.status === 404)
      return 'Không tìm thấy API (404). Kiểm tra backend.';
    if (!error.response) return 'Không thể kết nối đến máy chủ Backend.';
  }
  return error instanceof Error ? cleanErrorMessage(error.message) : 'Đã có lỗi xảy ra.';
}

export default http;
