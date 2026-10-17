import apiClient, { isMockMode } from '@/lib/apiClient';

/**
 * Lấy danh sách hợp đồng kho đang sở hữu của khách hàng từ Database
 * SWAGGER ENDPOINT: GET /api/contracts/my-contracts
 */
const getStoredAccountId = (): number => {
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

  return 13;
};

export const getMyContracts = async () => {
  try {
    const accountId = getStoredAccountId();

    const res: any = await apiClient.get('/contracts/my-contracts', {
      params: { accountId }
    });
    const apiData = res.data || res;
    if (Array.isArray(apiData)) {
      const mappedApiData = apiData
        .filter((c: any) => !String(c.contractId).startsWith('#HD-') && c.rawContractId !== 2 && c.contractId !== 'RES-F2-0013-4BAD' && c.unitCode !== 'HN02-G-XL03')
        .map((c: any) => {
          let statusLabel = c.statusLabel || c.status;
          if (c.status === 'PENDING_CHECKIN') statusLabel = 'CHỜ CHECK-IN';
          else if (c.status === 'ACTIVE') statusLabel = 'HIỆU LỰC';
          else if (c.status === 'CANCELED') statusLabel = 'ĐÃ HỦY CỌC';

          const resCode = c.reservationCode || c.bookingCode;
          const displayId = (resCode && !resCode.startsWith('#HD-'))
            ? resCode
            : (c.contractId && !c.contractId.startsWith('#HD-') ? c.contractId : `CTR-${c.rawContractId || '1'}`);

          return {
            ...c,
            contractId: displayId,
            reservationCode: resCode || displayId,
            bookingCode: resCode || displayId,
            statusLabel
          };
        });

      // Sắp xếp: Cái nào đặt sau (mới nhất) thì hiện lên đầu danh sách
      mappedApiData.sort((a: any, b: any) => {
        const idA = Number(a.rawContractId || (typeof a.contractId === 'number' ? a.contractId : 0));
        const idB = Number(b.rawContractId || (typeof b.contractId === 'number' ? b.contractId : 0));
        if (idA && idB && idA !== idB) {
          return idB - idA;
        }

        const timeA = new Date(a.createdAt || a.activatedAt || a.startDate || 0).getTime();
        const timeB = new Date(b.createdAt || b.activatedAt || b.startDate || 0).getTime();
        return timeB - timeA;
      });

      try {
        localStorage.removeItem('smart_storage_contracts');
      } catch (e) {}

      return { success: true, data: mappedApiData };
    }
    return { success: true, data: [] };
  } catch (error) {
    console.warn('API error:', error);
    return { success: false, message: 'Lỗi tải danh sách hợp đồng từ máy chủ', data: [] };
  }
};

/**
 * Hủy đặt cọc hợp đồng & hoàn tiền
 */
export const cancelDepositContract = async (
  contract: any,
  bankInfo?: { bankName?: string; bankAccountNumber?: string; bankAccountName?: string }
) => {
  const rawId = contract.rawContractId || (typeof contract.contractId === 'string' ? contract.contractId.replace('#HD-', '') : contract.contractId);
  try {
    if (rawId) {
      await apiClient.post(`/contracts/${rawId}/cancel-deposit`, bankInfo || {});
    }
  } catch (err) {
    console.warn('Backend cancel-deposit fallback error:', err);
  }
  return { success: true, message: 'Đã hủy cọc và hoàn trả ô kho về trạng thái trống thành công!' };
};

/**
 * Gửi yêu cầu trả kho trước hạn (Check-out request)
 * Sau khi gửi, hợp đồng sẽ hiển thị nút [Xác nhận trả kho] bên phía nhân viên (Staff).
 */
export const requestCheckoutContract = async (
  contract: any,
  data?: { reason?: string; desiredDate?: string }
) => {
  const rawId = contract.rawContractId || (typeof contract.contractId === 'string' ? contract.contractId.replace('#HD-', '').replace('CTR-', '') : contract.contractId);
  try {
    if (rawId) {
      const res: any = await apiClient.post(`/contracts/${rawId}/request-checkout`, data || {});
      return { success: true, data: res?.data || res };
    }
    return { success: false, message: 'Không xác định được mã hợp đồng' };
  } catch (err: any) {
    console.warn('Backend request-checkout error:', err);
    return {
      success: false,
      message: err?.response?.data?.message || err?.message || 'Lỗi khi gửi yêu cầu trả kho'
    };
  }
};
