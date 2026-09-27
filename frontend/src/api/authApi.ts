import axios from "axios";

const API_BASE = "/api/auth";

export interface RegisterData {
  fullName: string;
  identityNumber: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: AuthUser;
}

export interface LockedResponse {
  success: boolean;
  message: string;
  retryAfterSeconds: number;
}

export const register = async (data: RegisterData) => {
  const response = await axios.post(`${API_BASE}/register`, {
    fullName: data.fullName,
    cccd: data.identityNumber,
    email: data.email,
    phone: data.phone,
    password: data.password,
  });

  return response.data;
};

export const verifyOtp = async (phone: string, otpCode: string) => {
  const response = await axios.post(`${API_BASE}/verify-otp`, {
    phone,
    otpCode,
  });

  return response.data;
};

export const resendOtp = async (phone: string) => {
  const response = await axios.post(`${API_BASE}/resend-otp`, {
    phone,
  });

  return response.data;
};

export const login = async (identifier: string, password: string) => {
  const response = await axios.post(`${API_BASE}/login`, {
    phone: identifier,
    identifier,
    password,
  });

  return response.data;
};