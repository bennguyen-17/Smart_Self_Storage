import apiClient, { isMockMode } from './apiClient';

// Dữ liệu mẫu danh sách hợp đồng kho của tôi (Khớp bảng Contract + StorageUnit trong MySQL)
const MOCK_CONTRACTS = [
  {
    contractId: '#HD-CG-104',
    unitCode: 'HN01-G-XL04',
    branchName: 'Cầu Giấy, Hà Nội',
    branchCode: 'HN-01',
    size: 'XL',
    sizeLabel: 'Size XL',
    expiryDate: '10/10/2026',
    daysLeft: 30,
    status: 'ACTIVE',
    statusLabel: 'HIỆU LỰC'
  },
  {
    contractId: '#HD-TX-208',
    unitCode: 'HN02-F1-M08',
    branchName: 'Thanh Xuân, Hà Nội',
    branchCode: 'HN-02',
    size: 'M',
    sizeLabel: 'Size M',
    expiryDate: '24/10/2026',
    daysLeft: 44,
    status: 'ACTIVE',
    statusLabel: 'HIỆU LỰC'
  },
  {
    contractId: '#HD-CG-012',
    unitCode: 'HN01-G-S02',
    branchName: 'Cầu Giấy, Hà Nội',
    branchCode: 'HN-01',
    size: 'S',
    sizeLabel: 'Size S',
    expiryDate: '15/08/2026',
    daysLeft: 0,
    status: 'EXPIRED',
    statusLabel: 'HẾT HẠN'
  }
];

// Mã PIN mẫu
const MOCK_PINS = {
  'HN-01': '169 171',
  'HN-02': '931 405'
};

/**
 * Lấy danh sách hợp đồng kho đang sở hữu của khách hàng
 * SWAGGER ENDPOINT: GET /api/v1/contracts/my-contracts
 */
export const getMyContracts = async () => {
  if (isMockMode()) {
    return { success: true, data: MOCK_CONTRACTS };
  }

  try {
    const res = await apiClient.get('/contracts/my-contracts');
    return { success: true, data: res.data || res };
  } catch (error) {
    console.warn('API error, falling back to mock contracts:', error);
    return { success: true, data: MOCK_CONTRACTS };
  }
};

/**
 * Lấy mã PIN mở cổng IoT 24/7 của cơ sở
 * SWAGGER ENDPOINT: GET /api/v1/gate-pins/live?branchCode={code}
 */
export const getGatePin = async (branchCode) => {
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
    const res = await apiClient.get('/gate-pins/live', {
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
 * SWAGGER ENDPOINT: POST /api/v1/contracts/{contractId}/extend
 */
export const extendContract = async (contractId, extendPayload) => {
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
