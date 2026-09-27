import apiClient, { isMockMode } from './apiClient';

// Dữ liệu mẫu Chi Nhánh (Khớp bảng Branch trong MySQL)
const MOCK_BRANCHES = [
  { id: 'HN-01', code: 'HN-01', name: 'SmartStorage Cầu Giấy (HN-01)', address: 'Số 391 Cầu Giấy, P. Dịch Vọng, Q. Cầu Giấy, Hà Nội', floors: 3 },
  { id: 'HN-02', code: 'HN-02', name: 'SmartStorage Thanh Xuân (HN-02)', address: 'Số 120 Khuất Duy Tiến, Q. Thanh Xuân, Hà Nội', floors: 3 },
  { id: 'HCM-01', code: 'HCM-01', name: 'SmartStorage Quận 1 (HCM-01)', address: 'Số 123 Nguyễn Huệ, Quận 1, TP.HCM', floors: 3 },
  { id: 'HCM-02', code: 'HCM-02', name: 'SmartStorage Quận 7 (HCM-02)', address: 'Số 456 Nguyễn Thị Thập, Quận 7, TP.HCM', floors: 2 },
  { id: 'HCM-03', code: 'HCM-03', name: 'SmartStorage Thủ Đức (HCM-03)', address: 'Số 789 Xa Lộ Hà Nội, TP. Thủ Đức, TP.HCM', floors: 3 },
  { id: 'DN-01', code: 'DN-01', name: 'SmartStorage Hải Châu (DN-01)', address: 'Số 68 Nguyễn Văn Linh, Q. Hải Châu, Đà Nẵng', floors: 2 },
  { id: 'CT-01', code: 'CT-01', name: 'SmartStorage Ninh Kiều (CT-01)', address: 'Số 12 Đại lộ Hòa Bình, Q. Ninh Kiều, Cần Thơ', floors: 2 }
];

// Hàm sinh sơ đồ ô kho mẫu theo tầng
const generateMockUnits = (facilityCode, currentFloor) => {
  const prefix = facilityCode.replace('-', '');
  const floorName = currentFloor === 1 ? 'Tầng trệt' : currentFloor === 2 ? 'Tầng 1' : 'Tầng 2';
  const weightLimit = currentFloor === 1 ? '1000 kg/m²' : '500 kg/m²';
  const units = [];

  if (currentFloor === 1) {
    for (let i = 1; i <= 10; i++) {
      units.push({
        id: `${prefix}-G-XL${i < 10 ? '0' + i : i}`,
        floor: 1, floorName, weightLimit,
        size: 'XL', dim: '2.5m × 4.0m',
        price: 200000, deposit: 3000000,
        status: (i === 3 || i === 7) ? 'OCCUPIED' : 'AVAILABLE'
      });
    }
  } else if (currentFloor === 2) {
    for (let i = 1; i <= 8; i++) {
      units.push({
        id: `${prefix}-F1-S10${i}`,
        floor: 2, floorName, weightLimit,
        size: 'S', dim: '1.0m × 1.0m',
        price: 30000, deposit: 500000,
        status: (i === 2 || i === 6) ? 'OCCUPIED' : 'AVAILABLE'
      });
    }
    for (let i = 1; i <= 6; i++) {
      units.push({
        id: `${prefix}-F1-M10${i}`,
        floor: 2, floorName, weightLimit,
        size: 'M', dim: '1.5m × 2.0m',
        price: 60000, deposit: 1000000,
        status: i === 3 ? 'OCCUPIED' : 'AVAILABLE'
      });
    }
    for (let i = 1; i <= 4; i++) {
      units.push({
        id: `${prefix}-F1-L10${i}`,
        floor: 2, floorName, weightLimit,
        size: 'L', dim: '2.0m × 3.0m',
        price: 120000, deposit: 2000000,
        status: i === 2 ? 'OCCUPIED' : 'AVAILABLE'
      });
    }
  } else {
    for (let i = 1; i <= 6; i++) {
      units.push({
        id: `${prefix}-F2-S20${i}`,
        floor: 3, floorName, weightLimit,
        size: 'S', dim: '1.0m × 1.0m',
        price: 30000, deposit: 500000,
        status: i === 4 ? 'OCCUPIED' : 'AVAILABLE'
      });
    }
    for (let i = 1; i <= 8; i++) {
      units.push({
        id: `${prefix}-F2-M20${i}`,
        floor: 3, floorName, weightLimit,
        size: 'M', dim: '1.5m × 2.0m',
        price: 60000, deposit: 1000000,
        status: (i === 1 || i === 5) ? 'OCCUPIED' : 'AVAILABLE'
      });
    }
    for (let i = 1; i <= 4; i++) {
      units.push({
        id: `${prefix}-F2-L20${i}`,
        floor: 3, floorName, weightLimit,
        size: 'L', dim: '2.0m × 3.0m',
        price: 120000, deposit: 2000000,
        status: i === 3 ? 'OCCUPIED' : 'AVAILABLE'
      });
    }
  }

  return units;
};

/**
 * Lấy danh sách toàn bộ các chi nhánh cơ sở
 * SWAGGER ENDPOINT: GET /api/v1/branches
 */
export const getBranches = async () => {
  if (isMockMode()) {
    return { success: true, data: MOCK_BRANCHES };
  }

  try {
    const res = await apiClient.get('/branches');
    return { success: true, data: res.data || res };
  } catch (error) {
    console.warn('API error, falling back to mock branches:', error);
    return { success: true, data: MOCK_BRANCHES };
  }
};

/**
 * Lấy danh sách ô kho trên sơ đồ 2D theo cơ sở và tầng
 * SWAGGER ENDPOINT: GET /api/v1/storage-units?branchCode={facilityCode}&floor={floor}
 */
export const getStorageUnits = async (facilityCode, floor) => {
  if (isMockMode()) {
    return { success: true, data: generateMockUnits(facilityCode, floor) };
  }

  try {
    const res = await apiClient.get('/storage-units', {
      params: { branchCode: facilityCode, floor }
    });
    return { success: true, data: res.data || res };
  } catch (error) {
    console.warn('API error, falling back to mock units:', error);
    return { success: true, data: generateMockUnits(facilityCode, floor) };
  }
};
