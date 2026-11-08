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
 * Lấy thông tin hồ sơ cá nhân của khách hàng
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
    bankName: '',
    bankAccountNumber: '',
    bankAccountName: '',
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
    console.error('API error getting customer profile:', error);
    return { success: false, message: 'Lỗi tải thông tin hồ sơ từ máy chủ', data: null };
  }
};

/**
 * Cập nhật thông tin hồ sơ khách hàng xuống Database
 * Cập nhật thông tin cá nhân của khách hàng
 */
export const sendEmailOtp = async (newEmail: string, accountId?: number) => {
  if (isMockMode()) {
    return { success: true, message: 'Mã OTP thử nghiệm là 123456' };
  }

  const res = await apiClient.post('/customers/profile/send-email-otp', { newEmail, accountId });
  return res.data || res;
};

export const updateCustomerProfile = async (updateData: any) => {
  if (isMockMode()) {
    return { success: true, data: updateData, message: 'Cập nhật thành công!' };
  }

  const res = await apiClient.put('/customers/profile', updateData);
  return { success: true, data: res.data || res };
};

export interface CustomerNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  timestamp: string | null;
  isRead: boolean;
  link: string | null;
}

/**
 * Lịch sử đăng nhập & cảnh báo an toàn tài khoản (đọc từ ActivityLog)
 * Lấy danh sách thông báo hoạt động của khách hàng
 */
export const getCustomerNotifications = async (): Promise<CustomerNotification[]> => {
  if (isMockMode()) return [];

  const res: unknown = await apiClient.get('/customer/notifications');
  const payload = (res as { data?: unknown })?.data ?? res;
  const list = Array.isArray(payload) ? (payload as CustomerNotification[]) : [];
  return list.map((n) => ({
    ...n,
    message: n.message ? n.message.replace(/\s*\(IP:\s*[^)]+\)/gi, '') : n.message,
  }));
};

/**
 * Yêu cầu đóng tài khoản cá nhân với thời gian ân hạn 30 ngày
 * POST /api/customers/profile/request-deletion
 */
export const requestAccountDeletion = async (): Promise<{ success: boolean; message: string; deletionScheduledAt?: string }> => {
  if (isMockMode()) {
    return { success: true, message: 'Đã ghi nhận yêu cầu xóa tài khoản (Mock).', deletionScheduledAt: new Date(Date.now() + 30 * 86400000).toISOString() };
  }
  const res: any = await apiClient.post('/customers/profile/request-deletion');
  return res?.data ?? res;
};

/**
 * Hủy yêu cầu đóng tài khoản, khôi phục trạng thái hoạt động bình thường
 * POST /api/customers/profile/cancel-deletion
 */
export const cancelAccountDeletion = async (): Promise<{ success: boolean; message: string }> => {
  if (isMockMode()) {
    return { success: true, message: 'Đã hủy yêu cầu xóa tài khoản (Mock).' };
  }
  const res: any = await apiClient.post('/customers/profile/cancel-deletion');
  return res?.data ?? res;
};
