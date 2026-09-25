import apiClient, { isMockMode } from './apiClient';

// Dữ liệu mẫu (Mock Data) chuẩn theo bảng Account & CustomerProfile trong database
const MOCK_PROFILE = {
  customerId: 1,
  accountId: 1,
  fullName: 'Nguyễn Văn Khách',
  identityNumber: '001098004719',
  phone: '0988 123 456',
  email: 'khach.demo@smartstorage.vn',
  isVerified: true,
  verificationBadge: 'ĐÃ XÁC THỰC CCCD TẠI QUẦY STAFF',
  avatarText: 'NV',
  status: 'ACTIVE'
};

/**
 * Lấy thông tin hồ sơ khách hàng hiện tại
 * SWAGGER ENDPOINT: GET /api/v1/customers/profile (hoặc GET /api/v1/auth/me)
 */
export const getCurrentCustomerProfile = async () => {
  if (isMockMode()) {
    return { success: true, data: MOCK_PROFILE };
  }

  try {
    const res = await apiClient.get('/customers/profile');
    return { success: true, data: res.data || res };
  } catch (error) {
    console.warn('API error, falling back to mock profile:', error);
    return { success: true, data: MOCK_PROFILE };
  }
};

/**
 * Cập nhật thông tin hồ sơ khách hàng
 * SWAGGER ENDPOINT: PUT /api/v1/customers/profile
 */
export const updateCustomerProfile = async (updateData) => {
  if (isMockMode()) {
    Object.assign(MOCK_PROFILE, updateData);
    return { success: true, data: MOCK_PROFILE, message: 'Cập nhật thành công!' };
  }

  const res = await apiClient.put('/customers/profile', updateData);
  return { success: true, data: res.data || res };
};
