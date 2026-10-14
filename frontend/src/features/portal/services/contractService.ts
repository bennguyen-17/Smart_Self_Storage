import apiClient, { isMockMode } from '@/lib/apiClient';
import { releaseUnit } from './facilityService';

// Dữ liệu mẫu danh sách hợp đồng kho của tôi (Khớp bảng Contract + StorageUnit trong MySQL)
const MOCK_CONTRACTS: any[] = [];

// Mã PIN mẫu
const MOCK_PINS = {
  'HN-01': '169 171',
  'HN-02': '931 405'
};

export const getCurrentAccountId = (): number | null => {
  try {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) {
      const u = JSON.parse(userStr);
      const id = u.accountId ?? u.id;
      return id != null ? Number(id) : null;
    }
  } catch (e) {}
  return null;
};

const getStorageKey = () => {
  const accId = getCurrentAccountId();
  return accId ? `smart_storage_contracts_${accId}` : 'smart_storage_contracts_guest';
};

export const getLocalContracts = () => {
  try {
    const key = getStorageKey();
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Lọc bỏ triệt để các mã mock bị fix cứng như #HD-2
        const cleaned = parsed.filter((c: any) => c.contractId !== '#HD-2' && c.rawContractId !== 2);
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(key, JSON.stringify(cleaned));
        }
        return cleaned;
      }
    }
  } catch (e) {}
  return [...MOCK_CONTRACTS];
};

export const saveLocalContracts = (list: any[], notify = true) => {
  try {
    const key = getStorageKey();
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {}
  if (notify && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('storage_contracts_updated', { detail: { contracts: list } }));
  }
};

/**
 * Thêm hợp đồng mới vừa nộp cọc thành công vào danh sách quản lý
 */
export const addNewBookingContract = (bookingData: any) => {
  const currentAccId = getCurrentAccountId();
  const currentList = getLocalContracts();
  const rawId = bookingData.contractId || Math.floor(100 + Math.random() * 900);
  const uId = bookingData.unitId || 'HN01-G-XL04';

  let branchCode = 'HN-01';
  if (uId.startsWith('HN01') || bookingData.facilityName?.includes('Cầu Giấy') || bookingData.facilityName?.includes('HN-01')) {
    branchCode = 'HN-01';
  } else if (uId.startsWith('HN02') || bookingData.facilityName?.includes('Thanh Xuân') || bookingData.facilityName?.includes('HN-02')) {
    branchCode = 'HN-02';
  } else if (uId.startsWith('HCM01') || bookingData.facilityName?.includes('HCM-01')) {
    branchCode = 'HCM-01';
  } else if (uId.startsWith('HCM02') || bookingData.facilityName?.includes('HCM-02')) {
    branchCode = 'HCM-02';
  } else if (uId.startsWith('HCM03') || bookingData.facilityName?.includes('HCM-03')) {
    branchCode = 'HCM-03';
  } else if (uId.startsWith('DN01') || bookingData.facilityName?.includes('DN-01')) {
    branchCode = 'DN-01';
  } else if (uId.startsWith('CT01') || bookingData.facilityName?.includes('CT-01')) {
    branchCode = 'CT-01';
  }

  const newContract = {
    contractId: `#HD-${rawId}`,
    rawContractId: rawId,
    accountId: currentAccId,
    unitCode: uId,
    branchName: bookingData.facilityName || 'SmartStorage Cầu Giấy (HN-01)',
    branchCode: branchCode,
    size: bookingData.unitSize?.replace('Size ', '') || 'XL',
    sizeLabel: bookingData.unitSize || 'Size XL',
    startDate: bookingData.startDate || new Date().toLocaleDateString('vi-VN'),
    expiryDate: bookingData.endDate ? bookingData.endDate.split(' ')[0] : '30 ngày tới',
    daysLeft: bookingData.effectiveDays || 30,
    status: 'PENDING_CHECKIN',
    statusLabel: 'CHỜ CHECK-IN'
  };

  const updatedList = [newContract, ...currentList.filter(c => c.unitCode !== newContract.unitCode)];
  saveLocalContracts(updatedList);
  return newContract;
};

/**
 * Hủy đặt cọc hợp đồng:
 * - Đổi trạng thái Hợp đồng sang CANCELED
 * - Mở khóa ô kho về AVAILABLE trên bản đồ
 */
export const cancelDepositContract = async (
  contract: any,
  bankInfo?: { bankName?: string; bankAccountNumber?: string; bankAccountName?: string }
) => {
  const currentList = getLocalContracts();
  const rawId = contract.rawContractId || (typeof contract.contractId === 'string' ? contract.contractId.replace('#HD-', '') : contract.contractId);
  const unitCode = contract.unitCode;

  try {
    if (rawId) {
      await apiClient.post(`/contracts/${rawId}/cancel-deposit`, bankInfo || {});
    }
  } catch (err) {
    console.warn('Backend cancel-deposit fallback to local state:', err);
  }

  const updatedList = currentList.map(c => {
    if (c.unitCode === unitCode || c.contractId === contract.contractId) {
      return {
        ...c,
        status: 'CANCELED',
        statusLabel: 'ĐÃ HỦY CỌC',
        cancelReason: 'CUSTOMER_REQUEST',
        refundBankName: bankInfo?.bankName,
        refundAccountNumber: bankInfo?.bankAccountNumber,
        refundAccountName: bankInfo?.bankAccountName
      };
    }
    return c;
  });
  saveLocalContracts(updatedList);

  if (unitCode) {
    releaseUnit(unitCode);
  }

  return { success: true, message: 'Đã hủy cọc và hoàn trả ô kho về trạng thái trống thành công!' };
};

/**
 * Lấy danh sách hợp đồng kho đang sở hữu của khách hàng
 * SWAGGER ENDPOINT: GET /api/contracts/my-contracts
 */
export const getMyContracts = async () => {
  const currentAccId = getCurrentAccountId();
  const localList = getLocalContracts();

  if (isMockMode()) {
    return { success: true, data: localList };
  }

  try {
    const res: any = await apiClient.get('/contracts/my-contracts', {
      params: currentAccId ? { accountId: currentAccId } : undefined
    });
    const apiData = res.data ?? res;
    if (Array.isArray(apiData)) {
      const mappedApiData = apiData
        .filter((c: any) => c.contractId !== '#HD-2' && c.rawContractId !== 2)
        .map((c: any) => {
          let statusLabel = c.statusLabel || c.status;
          if (c.status === 'PENDING_CHECKIN') statusLabel = 'CHỜ CHECK-IN';
          else if (c.status === 'ACTIVE') statusLabel = 'HIỆU LỰC';
          else if (c.status === 'CANCELED') statusLabel = 'ĐÃ HỦY CỌC';

          return {
            ...c,
            statusLabel
          };
        });

      // Chỉ gộp hợp đồng vừa cọc trên máy NẾU thuộc đúng tài khoản này và chưa có trên server
      const apiUnitCodes = new Set(mappedApiData.map((c: any) => c.unitCode));
      const localOnly = localList.filter(
        (c: any) =>
          !apiUnitCodes.has(c.unitCode) &&
          c.status === 'PENDING_CHECKIN' &&
          c.contractId !== '#HD-2' &&
          (!c.accountId || c.accountId === currentAccId)
      );
      const merged = [...localOnly, ...mappedApiData];
      saveLocalContracts(merged, false);
      return { success: true, data: merged };
    }
    return { success: true, data: localList.filter((c: any) => c.contractId !== '#HD-2') };
  } catch (error) {
    console.warn('API error, falling back to local contracts for current account:', error);
    return { success: true, data: localList.filter((c: any) => c.contractId !== '#HD-2') };
  }
};

/**
 * Lấy mã PIN mở cổng IoT 24/7 của cơ sở
 * QUY TẮC NGHIỆP VỤ BẮT BUỘC:
 * - Chỉ cơ sở có hợp đồng đang có HIỆU LỰC (ACTIVE) mới được sinh mã PIN.
 * - Cơ sở chỉ có hợp đồng CHỜ CHECK-IN hoặc ĐÃ HỦY CỌC sẽ bị từ chối cấp PIN.
 * SWAGGER ENDPOINT: GET /api/gate-pins/live?branchCode={code}
 */
export const getGatePin = async (branchCode: string) => {
  const localList = getLocalContracts();
  const hasLocalActive = localList.some(
    (c: any) => (c.branchCode === branchCode || c.unitCode?.startsWith(branchCode.replace('-', ''))) && c.status === 'ACTIVE'
  );

  if (isMockMode()) {
    if (!hasLocalActive) {
      return {
        success: false,
        hasAccess: false,
        message: `Cơ sở ${branchCode} không có hợp đồng nào đang có HIỆU LỰC. Không thể cấp mã PIN!`
      };
    }
    const pin = MOCK_PINS[branchCode] || `${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)}`;
    return {
      success: true,
      data: {
        pin,
        hasAccess: true,
        ttlSeconds: 15,
        branchCode
      }
    };
  }

  try {
    const userStr = localStorage.getItem('user');
    let accountId: number | undefined = undefined;
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        accountId = u.accountId || u.id;
      } catch (e) {}
    }

    const res: any = await apiClient.get('/gate-pins/live', {
      params: { 
        branchCode,
        ...(accountId ? { accountId } : {})
      }
    });

    const data = res.data || res;
    if (data.hasAccess === false || data.success === false) {
      return {
        success: false,
        hasAccess: false,
        message: data.message || 'Cơ sở này không có hợp đồng hiệu lực để cấp mã PIN.'
      };
    }

    return { success: true, data };
  } catch (error: any) {
    const msg = error.response?.data?.message || 'Cơ sở này hiện không có hợp đồng nào đang có HIỆU LỰC (ACTIVE). Không thể cấp mã PIN!';
    return {
      success: false,
      hasAccess: false,
      message: msg
    };
  }
};

/**
 * Gia hạn hợp đồng thuê kho
 * SWAGGER ENDPOINT: POST /api/contracts/{contractId}/extend
 */
export const extendContract = async (contractId: string | number, extendPayload: any) => {
  if (isMockMode()) {
    return {
      success: true,
      message: 'Gia hạn hợp đồng thành công!',
      data: { contractId, ...extendPayload }
    };
  }

  const res = await apiClient.post(`/contracts/${contractId}/extend`, extendPayload);
  return { success: true, data: res.data || res };
};
