import axios from "axios";

const BASE_URL = "http://localhost:8080";

export interface RegisterData {
  fullName: string;
  identityNumber: string;
  email: string;
  phone: string;
  password: string;
}

export const register = async (data: RegisterData) => {
  const response = await axios.post(`${BASE_URL}/api/v1/auth/register`, {
    fullName: data.fullName,
    cccd: data.identityNumber,
    email: data.email,
    phone: data.phone,
    password: data.password,
  });

  return response.data;
};

export const verifyOtp = async (phone: string, otpCode: string) => {
  const response = await axios.post(`${BASE_URL}/api/v1/auth/verify-otp`, {
    phone,
    otpCode,
  });

  return response.data;
};

export const resendOtp = async (phone: string) => {
  const response = await axios.post(`${BASE_URL}/api/v1/auth/resend-otp`, {
    phone,
  });

  return response.data;
};

export const login = async (identifier: string, password: string) => {
  const response = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
    identifier,
    password,
  });

  return response.data;
};
