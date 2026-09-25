import axios from 'axios';

// Base URL lấy từ biến môi trường .env hoặc mặc định Spring Boot
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// Cờ bật tắt Mock Data: mặc định là true nếu chưa nối backend
export const isMockMode = () => {
  return import.meta.env.VITE_USE_MOCK !== 'false';
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
    const token = localStorage.getItem('token');
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
    const message = error.response?.data?.message || error.message || 'Lỗi kết nối máy chủ';
    console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, message);
    return Promise.reject(error);
  }
);

export default apiClient;
