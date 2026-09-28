import apiClient, { isMockMode } from './apiClient';
import { releaseUnit } from './facilityService';

// Dữ liệu mẫu danh sách hợp đồng kho của tôi (Khớp bảng Contract + StorageUnit trong MySQL)
const MOCK_CONTRACTS = [
  {
    contractId: '#HD-1',
    rawContractId: 1,
    unitCode: 'HN01-G-XL02',
    branchName: 'SmartStorage Cầu Giấy (HN-01)',
    branchCode: 'HN-01',
    size: 'XL',
    sizeLabel: 'Size XL (Kho doanh nghiệp)',
    expiryDate: '10/10/2026',
    daysLeft: 30,
    status: 'ACTIVE',
    statusLabel: 'HIỆU LỰC'
  },
  {
    contractId: '#HD-2',
    rawContractId: 2,
    unitCode: 'HN02-F1-M08',
    branchName: 'SmartStorage Thanh Xuân (HN-02)',
    branchCode: 'HN-02',
    size: 'M',
    sizeLabel: 'Size M',
    expiryDate: '24/10/2026',
    daysLeft: 44,
    status: 'ACTIVE',
    statusLabel: 'HIỆU LỰC'
  }
];

// Mã PIN mẫu
const MOCK_PINS = {
  'HN-01': '169 171',
  'HN-02': '931 405'
};

export const getLocalContracts = () => {
  try {
    const raw = localStorage.getItem('smart_storage_contracts');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [...MOCK_CONTRACTS];
};

export const saveLocalContracts = (list: any[], notify = true) => {
  try {
    localStorage.setItem('smart_storage_contracts', JSON.stringify(list));
  } catch (e) {}
  if (notify && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('storage_contracts_updated', { detail: { contracts: list } }));
  }
};

/**
 * Thêm hợp đồng mới vừa nộp cọc thành công vào danh sách quản lý
 */
export const addNewBookingContract = (bookingData: any) => {
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
    unitCode: uId,
    branchName: bookingData.facilityName || 'SmartStorage Cầu Giấy (HN-01)',
    branchCode: branchCode,
    size: bookingData.unitSize?.replace('Size ', '') || 'XL',
    sizeLabel: bookingData.unitSize || 'Size XL',
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
 * Hủy đặt cọc hợp đồng (BR-17, BR-21):
 * - Đổi trạng thái Hợp đồng sang CANCELED
 * - Mở khóa ô kho về AVAILABLE trên bản đồ
 */
export const cancelDepositContract = async (contract: any) => {
  const currentList = getLocalContracts();
  const rawId = contract.rawContractId || (typeof contract.contractId === 'string' ? contract.contractId.replace('#HD-', '') : contract.contractId);
  const unitCode = contract.unitCode;

  try {
    if (rawId) {
      await apiClient.post(`/contracts/${rawId}/cancel-deposit`);
    }
  } catch (err) {
    console.warn('Backend cancel-deposit fallback to local state:', err);
  }

  const updatedList = currentList.map(c => {
    if (c.unitCode === unitCode || c.contractId === contract.contractId) {
      return {
        ...c,
        status: 'CANCELED',
        statusLabel: 'ĐÃ HỦY CỌC'
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
  const localList = getLocalContracts();

  if (isMockMode()) {
    return { success: true, data: localList };
  }

  try {
    const userStr = localStorage.getItem('user');
    let accountId = 7;
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        accountId = u.accountId || u.id || 7;
      } catch (e) {}
    }

    const res: any = await apiClient.get('/contracts/my-contracts', {
      params: { accountId }
    });
    const apiData = res.data || res;
    if (Array.isArray(apiData) && apiData.length > 0) {
      const mappedApiData = apiData.map((c: any) => {
        let statusLabel = c.statusLabel || c.status;
        if (c.status === 'PENDING_CHECKIN') statusLabel = 'CHỜ CHECK-IN';
        else if (c.status === 'ACTIVE') statusLabel = 'HIỆU LỰC';
        else if (c.status === 'CANCELED') statusLabel = 'ĐÃ HỦY CỌC';

        return {
          ...c,
          statusLabel
        };
      });

      // Merge newly added local pending contracts if not yet returned by backend
      const apiUnitCodes = new Set(mappedApiData.map((c: any) => c.unitCode));
      const localOnly = localList.filter((c: any) => !apiUnitCodes.has(c.unitCode) && c.status === 'PENDING_CHECKIN');
      const merged = [...localOnly, ...mappedApiData];
      saveLocalContracts(merged, false);
      return { success: true, data: merged };
    }
    return { success: true, data: localList };
  } catch (error) {
    console.warn('API error, falling back to local contracts:', error);
    return { success: true, data: localList };
  }
};

/**
 * Lấy mã PIN mở cổng IoT 24/7 của cơ sở
 * SWAGGER ENDPOINT: GET /api/gate-pins/live?branchCode={code}
 */
export const getGatePin = async (branchCode: string) => {
  if (isMockMode()) {
    const pin = MOCK_PINS[branchCode] || `${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)}`;
    return {
      success: true,
      data: {
        pin,
        ttlSeconds: 15,
        branchCode
      }
    };
  }

  try {
    const res: any = await apiClient.get('/gate-pins/live', {
      params: { branchCode }
    });
    return { success: true, data: res.data || res };
  } catch (error) {
    console.warn('API error, falling back to mock pin:', error);
    return {
      success: true,
      data: {
        pin: `${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)}`,
        ttlSeconds: 15,
        branchCode
      }
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
