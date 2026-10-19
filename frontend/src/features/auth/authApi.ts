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
  phone?: string;
  identityNumber?: string;
  status?: string;
  employeeId?: number;
  facilityId?: number;
  facilityName?: string;
  facilityCode?: string;
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

export const login = async (identifier: string, password: string, portalType: string = "CUSTOMER") => {
  const trimmed = identifier.trim();
  const isEmail = trimmed.includes("@");
  const response = await axios.post(`${API_BASE}/login`, {
    email: isEmail ? trimmed : undefined,
    phone: !isEmail ? trimmed : undefined,
    identifier: trimmed,
    password,
    portalType,
  });

  return response.data;
};

export const requestForgotPasswordOtp = async (email: string) => {
  const response = await axios.post(`${API_BASE}/forgot-password`, {
    phone: email.trim(),
  });
  return response.data;
};

export const resetPassword = async (email: string, otpCode: string, newPassword: string) => {
  const response = await axios.post(`${API_BASE}/reset-password`, {
    phone: email.trim(),
    otpCode: otpCode.trim(),
    newPassword,
  });
  return response.data;
};