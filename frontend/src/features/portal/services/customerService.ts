import apiClient, { isMockMode } from '@/lib/apiClient';

const getStoredUser = () => {
  try {
    const rawAuthSession = localStorage.getItem('auth_session') || sessionStorage.getItem('auth_session');
    if (rawAuthSession) {
      const parsed = JSON.parse(rawAuthSession);
      if (parsed?.user) return parsed.user;
    }
  } catch (e) {}

  try {
    const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (rawUser) return JSON.parse(rawUser);
  } catch (e) {}

  return null;
};

const getInitials = (name: string) => {
  if (!name) return 'KH';
  const words = name.trim().split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length >= 2) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return 'KH';
};

const getCccd = (obj: any) => {
  if (!obj) return null;
  return obj.identityNumber || obj.cccd || obj.identityCard || obj.citizenId || obj.idCard || obj.cardId || null;
};

/**
 * Lấy thông tin hồ sơ khách hàng hiện tại từ Database
 * SWAGGER ENDPOINT: GET /api/v1/customers/profile
 */
export const getCurrentCustomerProfile = async () => {
  const localUser = getStoredUser();

  const dynamicFallback = {
    customerId: localUser?.id || localUser?.customerId || 1,
    accountId: localUser?.accountId || localUser?.id || 1,
    fullName: localUser?.fullName || localUser?.name || 'Khách Hàng',
    identityNumber: getCccd(localUser) || 'Chưa cập nhật',
    phone: localUser?.phone || 'Chưa cập nhật',
    email: localUser?.email || 'Chưa cập nhật',
    isVerified: localUser ? (localUser.status !== 'UNVERIFIED' && localUser.isVerified !== false) : true,
    verificationBadge: (localUser?.status !== 'UNVERIFIED' && localUser?.isVerified !== false) ? 'ĐÃ XÁC THỰC THÔNG TIN' : 'CHƯA XÁC THỰC THÔNG TIN',
    avatarText: getInitials(localUser?.fullName || localUser?.name || 'Khách Hàng'),
    status: localUser?.status || 'ACTIVE'
  };

  if (isMockMode()) {
    return { success: true, data: dynamicFallback };
  }

  try {
    const accountId = localUser?.id || localUser?.accountId;
    const res = await apiClient.get('/customers/profile', {
      params: accountId ? { accountId } : undefined
    });
    const apiData = res.data || res;
    
    const fullName = apiData?.fullName || dynamicFallback.fullName;
    const phone = apiData?.phone || dynamicFallback.phone;
    const email = apiData?.email || dynamicFallback.email;
    const identityNumber = getCccd(apiData) || dynamicFallback.identityNumber;
    
    return {
      success: true,
      data: {
        ...dynamicFallback,
        ...apiData,
        fullName,
        phone,
        email,
        identityNumber,
        avatarText: getInitials(fullName)
      }
    };
  } catch (error) {
    console.warn('API error, falling back to dynamic customer profile:', error);
    return { success: true, data: dynamicFallback };
  }
};

/**
 * Cập nhật thông tin hồ sơ khách hàng xuống Database
 * SWAGGER ENDPOINT: PUT /api/v1/customers/profile
 */
export const updateCustomerProfile = async (updateData: any) => {
  if (isMockMode()) {
    return { success: true, data: updateData, message: 'Cập nhật thành công!' };
  }

  const res = await apiClient.put('/customers/profile', updateData);
  return { success: true, data: res.data || res };
};
