import apiClient, { isMockMode } from './apiClient';

/**
 * Gửi yêu cầu hỗ trợ kỹ thuật (Ticket)
 * SWAGGER ENDPOINT: POST /api/v1/support/tickets
 */
export const submitSupportTicket = async (ticketData) => {
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

  const res = await apiClient.post('/support/tickets', ticketData);
  return { success: true, data: res.data || res };
};
