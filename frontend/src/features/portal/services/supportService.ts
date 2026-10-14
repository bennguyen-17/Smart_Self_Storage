import apiClient, { isMockMode } from '@/lib/apiClient';

/**
 * Gửi yêu cầu hỗ trợ kỹ thuật (Ticket)
 * SWAGGER ENDPOINT: POST /api/v1/support/tickets
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

  let accountId: number | undefined;
  try {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) {
      const u = JSON.parse(userStr);
      accountId = u.accountId || u.id;
    }
  } catch (e) {}

  const res: any = await apiClient.post('/support/tickets', ticketData, {
    headers: accountId ? { 'X-Account-Id': String(accountId) } : undefined
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

  let accountId: number | undefined;
  try {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) {
      const u = JSON.parse(userStr);
      accountId = u.accountId || u.id;
    }
  } catch (e) {}

  try {
    const res: any = await apiClient.get('/customer/tickets', {
      headers: accountId ? { 'X-Account-Id': String(accountId) } : undefined
    });
    const data = Array.isArray(res) ? res : res.data || [];
    return { success: true, data };
  } catch (err) {
    console.warn('Lỗi lấy danh sách ticket hỗ trợ của tôi:', err);
    return { success: true, data: [] };
  }
};


