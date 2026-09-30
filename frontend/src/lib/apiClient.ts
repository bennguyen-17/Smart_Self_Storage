import axios from 'axios';

// Base URL lấy từ biến môi trường .env hoặc mặc định Spring Boot (KHÔNG CÓ /v1)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Cờ bật tắt Mock Data: mặc định là true nếu chưa nối backend
export const isMockMode = () => {
  return import.meta.env.VITE_USE_MOCK !== 'false';
};

// Hàm kiểm tra token JWT
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
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Tự động đính kèm Token khi gọi Swagger API bảo mật
apiClient.interceptors.request.use(
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

// Response Interceptor: Xử lý dữ liệu và mã lỗi chung (401, 403, 500)
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Hết hạn token hoặc không có quyền truy cập -> Clear session và redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('auth_session');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/customer_login';
      }
    }
    const message = error.response?.data?.message || error.message || 'Lỗi kết nối máy chủ';
    console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, message);
    return Promise.reject(error);
  }
);

export default apiClient;
