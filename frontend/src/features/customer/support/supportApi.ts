import apiClient, { isMockMode } from '@/lib/apiClient';

export const getStoredAccountId = (): number => {
  try {
    const rawAuth = localStorage.getItem('auth_session') || sessionStorage.getItem('auth_session');
    if (rawAuth) {
      const parsed = JSON.parse(rawAuth);
      if (parsed?.user?.id || parsed?.user?.accountId) {
        return Number(parsed.user.id || parsed.user.accountId);
      }
    }
  } catch (e) {}

  try {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      if (u.accountId || u.id) {
        return Number(u.accountId || u.id);
      }
    }
  } catch (e) {}

  return 0;
};

/**
 * Gửi yêu cầu hỗ trợ kỹ thuật (Ticket)
 * SWAGGER ENDPOINT: POST /api/support/tickets
 */
export const submitSupportTicket = async (ticketData: any) => {
  if (isMockMode()) {
    return {
      success: true,
      data: {
        ticketId: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'SUBMITTED',
        ...ticketData
      }
    };
  }

  const accountId = getStoredAccountId();

  const payload = {
    accountId,
    ...ticketData
  };

  const res: any = await apiClient.post('/support/tickets', payload, {
    headers: { 'X-Account-Id': String(accountId) }
  });
  return { success: true, data: res.data || res };
};

/**
 * Lấy danh sách ticket hỗ trợ kỹ thuật khách hàng đã gửi
 * SWAGGER ENDPOINT: GET /api/customer/tickets
 */
export const getMySupportTickets = async () => {
  if (isMockMode()) {
    return { success: true, data: [] };
  }

  const accountId = getStoredAccountId();

  try {
    const res: any = await apiClient.get('/customer/tickets', {
      headers: { 'X-Account-Id': String(accountId) },
      params: { accountId }
    });
    const data = Array.isArray(res) ? res : res.data || [];
    return { success: true, data };
  } catch (err) {
    console.warn('Lỗi lấy danh sách ticket hỗ trợ của tôi:', err);
    return { success: true, data: [] };
  }
};


