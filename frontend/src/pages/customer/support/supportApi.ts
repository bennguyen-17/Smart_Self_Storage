import apiClient, { isMockMode } from '@/lib/apiClient';

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

  const res: any = await apiClient.post('/support/tickets', ticketData);
  return { success: true, data: res.data || res };
};
