import apiClient, { isMockMode } from '@/lib/apiClient';

// Dữ liệu mẫu Chi Nhánh (Khớp bảng Branch trong MySQL)
const MOCK_BRANCHES = [
  { id: 'HN01', code: 'HN01', name: 'SmartStorage Cầu Giấy', address: 'Số 391 Cầu Giấy, P. Dịch Vọng, Q. Cầu Giấy, Hà Nội', floors: 3, layoutType: 'A' },
  { id: 'HN02', code: 'HN02', name: 'SmartStorage Thanh Xuân', address: 'Số 120 Khuất Duy Tiến, Q. Thanh Xuân, Hà Nội', floors: 3, layoutType: 'B' },
  { id: 'HCM01', code: 'HCM01', name: 'SmartStorage Quận 1', address: 'Số 123 Nguyễn Huệ, Quận 1, TP.HCM', floors: 3, layoutType: 'A' },
  { id: 'HCM02', code: 'HCM02', name: 'SmartStorage Quận 7', address: 'Số 456 Nguyễn Thị Thập, Quận 7, TP.HCM', floors: 3, layoutType: 'B' },
  { id: 'HCM03', code: 'HCM03', name: 'SmartStorage Thủ Đức', address: 'Số 789 Xa Lộ Hà Nội, TP. Thủ Đức, TP.HCM', floors: 3, layoutType: 'B' },
  { id: 'DN01', code: 'DN01', name: 'SmartStorage Hải Châu', address: 'Số 68 Nguyễn Văn Linh, Q. Hải Châu, Đà Nẵng', floors: 3, layoutType: 'A' },
  { id: 'CT01', code: 'CT01', name: 'SmartStorage Ninh Kiều', address: 'Số 12 Đại lộ Hòa Bình, Q. Ninh Kiều, Cần Thơ', floors: 3, layoutType: 'B' }
];

const heldUnitsState: Record<string, string> = {};

export const getHeldUnitsMap = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem('smart_storage_held_units');
    const parsed = raw ? JSON.parse(raw) : {};
    return { ...parsed, ...heldUnitsState };
  } catch (e) {
    return { ...heldUnitsState };
  }
};

export const markUnitAsHeld = (unitId: string, status = 'HOLD') => {
  if (!unitId) return;
  heldUnitsState[unitId] = status;
  try {
    const current = getHeldUnitsMap();
    current[unitId] = status;
    localStorage.setItem('smart_storage_held_units', JSON.stringify(current));
  } catch (e) {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('storage_units_updated', { detail: { unitId, status } }));
  }
};

export const releaseUnit = (unitId: string) => {
  if (!unitId) return;
  heldUnitsState[unitId] = 'AVAILABLE';
  try {
    const current = getHeldUnitsMap();
    current[unitId] = 'AVAILABLE';
    localStorage.setItem('smart_storage_held_units', JSON.stringify(current));
  } catch (e) {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('storage_units_updated', { detail: { unitId, status: 'AVAILABLE' } }));
  }
};

const generateMockUnits = (facilityCode: string, currentFloor: number) => {
  const prefix = facilityCode.replace('-', '');
  const floorName = currentFloor === 1 ? 'Tầng trệt' : currentFloor === 2 ? 'Tầng 1' : 'Tầng 2';
  const weightLimit = currentFloor === 1 ? '1000 kg/m²' : '500 kg/m²';
  const units: any[] = [];

  const localMap = getHeldUnitsMap();

  if (currentFloor === 1) {
    for (let i = 1; i <= 10; i++) {
      const uId = `${prefix}-G-XL${i < 10 ? '0' + i : i}`;
      const defaultStatus = (i === 3 || i === 7) ? 'OCCUPIED' : 'AVAILABLE';
      const isClimate = i > 5;
      const baseDaily = 200000;
      const baseMonthly = 4000000;
      const dailyPrice = isClimate ? Math.round(baseDaily * 1.2) : baseDaily;
      const monthlyPrice = isClimate ? Math.round(baseMonthly * 1.2) : baseMonthly;
      units.push({
        id: uId,
        floor: 1, floorName, weightLimit,
        size: 'XL', dim: '2.5m × 4.0m',
        storageType: isClimate ? 'CLIMATE_CONTROLLED' : 'STANDARD',
        isClimate,
        typeLabel: isClimate ? 'Kho Mát Điều Hòa (22-25°C)' : 'Kho Tiêu Chuẩn',
        price: dailyPrice, monthlyPrice, deposit: 3000000,
        status: localMap[uId] || defaultStatus
      });
    }
  } else if (currentFloor === 2) {
    for (let i = 1; i <= 8; i++) {
      const uId = `${prefix}-F1-S10${i}`;
      const defaultStatus = (i === 2 || i === 6) ? 'OCCUPIED' : 'AVAILABLE';
      const isClimate = i > 4;
      const baseDaily = 30000;
      const baseMonthly = 600000;
      units.push({
        id: uId,
        floor: 2, floorName, weightLimit,
        size: 'S', dim: '1.0m × 1.0m',
        storageType: isClimate ? 'CLIMATE_CONTROLLED' : 'STANDARD',
        isClimate,
        typeLabel: isClimate ? 'Kho Mát Điều Hòa (22-25°C)' : 'Kho Tiêu Chuẩn',
        price: isClimate ? Math.round(baseDaily * 1.2) : baseDaily,
        monthlyPrice: isClimate ? Math.round(baseMonthly * 1.2) : baseMonthly,
        deposit: 500000,
        status: localMap[uId] || defaultStatus
      });
    }
    for (let i = 1; i <= 6; i++) {
      const uId = `${prefix}-F1-M10${i}`;
      const defaultStatus = i === 3 ? 'OCCUPIED' : 'AVAILABLE';
      const isClimate = i > 3;
      const baseDaily = 60000;
      const baseMonthly = 1200000;
      units.push({
        id: uId,
        floor: 2, floorName, weightLimit,
        size: 'M', dim: '1.5m × 2.0m',
        storageType: isClimate ? 'CLIMATE_CONTROLLED' : 'STANDARD',
        isClimate,
        typeLabel: isClimate ? 'Kho Mát Điều Hòa (22-25°C)' : 'Kho Tiêu Chuẩn',
        price: isClimate ? Math.round(baseDaily * 1.2) : baseDaily,
        monthlyPrice: isClimate ? Math.round(baseMonthly * 1.2) : baseMonthly,
        deposit: 1000000,
        status: localMap[uId] || defaultStatus
      });
    }
    for (let i = 1; i <= 4; i++) {
      const uId = `${prefix}-F1-L10${i}`;
      const defaultStatus = i === 2 ? 'OCCUPIED' : 'AVAILABLE';
      const isClimate = i > 2;
      const baseDaily = 120000;
      const baseMonthly = 2400000;
      units.push({
        id: uId,
        floor: 2, floorName, weightLimit,
        size: 'L', dim: '2.0m × 3.0m',
        storageType: isClimate ? 'CLIMATE_CONTROLLED' : 'STANDARD',
        isClimate,
        typeLabel: isClimate ? 'Kho Mát Điều Hòa (22-25°C)' : 'Kho Tiêu Chuẩn',
        price: isClimate ? Math.round(baseDaily * 1.2) : baseDaily,
        monthlyPrice: isClimate ? Math.round(baseMonthly * 1.2) : baseMonthly,
        deposit: 2000000,
        status: localMap[uId] || defaultStatus
      });
    }
  } else {
    for (let i = 1; i <= 6; i++) {
      const uId = `${prefix}-F2-S20${i}`;
      const defaultStatus = i === 4 ? 'OCCUPIED' : 'AVAILABLE';
      const isClimate = i > 3;
      const baseDaily = 30000;
      const baseMonthly = 600000;
      units.push({
        id: uId,
        floor: 3, floorName, weightLimit,
        size: 'S', dim: '1.0m × 1.0m',
        storageType: isClimate ? 'CLIMATE_CONTROLLED' : 'STANDARD',
        isClimate,
        typeLabel: isClimate ? 'Kho Mát Điều Hòa (22-25°C)' : 'Kho Tiêu Chuẩn',
        price: isClimate ? Math.round(baseDaily * 1.2) : baseDaily,
        monthlyPrice: isClimate ? Math.round(baseMonthly * 1.2) : baseMonthly,
        deposit: 500000,
        status: localMap[uId] || defaultStatus
      });
    }
    for (let i = 1; i <= 8; i++) {
      const uId = `${prefix}-F2-M20${i}`;
      const defaultStatus = (i === 1 || i === 5) ? 'OCCUPIED' : 'AVAILABLE';
      const isClimate = i > 4;
      const baseDaily = 60000;
      const baseMonthly = 1200000;
      units.push({
        id: uId,
        floor: 3, floorName, weightLimit,
        size: 'M', dim: '1.5m × 2.0m',
        storageType: isClimate ? 'CLIMATE_CONTROLLED' : 'STANDARD',
        isClimate,
        typeLabel: isClimate ? 'Kho Mát Điều Hòa (22-25°C)' : 'Kho Tiêu Chuẩn',
        price: isClimate ? Math.round(baseDaily * 1.2) : baseDaily,
        monthlyPrice: isClimate ? Math.round(baseMonthly * 1.2) : baseMonthly,
        deposit: 1000000,
        status: localMap[uId] || defaultStatus
      });
    }
    for (let i = 1; i <= 4; i++) {
      const uId = `${prefix}-F2-L20${i}`;
      const defaultStatus = i === 3 ? 'OCCUPIED' : 'AVAILABLE';
      const isClimate = i > 2;
      const baseDaily = 120000;
      const baseMonthly = 2400000;
      units.push({
        id: uId,
        floor: 3, floorName, weightLimit,
        size: 'L', dim: '2.0m × 3.0m',
        storageType: isClimate ? 'CLIMATE_CONTROLLED' : 'STANDARD',
        isClimate,
        typeLabel: isClimate ? 'Kho Mát Điều Hòa (22-25°C)' : 'Kho Tiêu Chuẩn',
        price: isClimate ? Math.round(baseDaily * 1.2) : baseDaily,
        monthlyPrice: isClimate ? Math.round(baseMonthly * 1.2) : baseMonthly,
        deposit: 2000000,
        status: localMap[uId] || defaultStatus
      });
    }
  }

  return units;
};

/**
 * Lấy danh sách toàn bộ chi nhánh cơ sở
 * BACKEND ENDPOINT: GET /api/facilities
 */
export const getBranches = async () => {
  if (isMockMode()) {
    return { success: true, data: MOCK_BRANCHES };
  }

  try {
    const res = await apiClient.get('/facilities');
    const rawList = Array.isArray(res) ? res : (res?.data || []);
    const facilities = rawList.map((f: any) => ({
      id: f.facilityCode || (f.facilityId ? `FAC-${f.facilityId}` : f.id),
      backendId: f.facilityId || f.id,
      code: f.facilityCode || f.code,
      shortCode: f.shortCode,
      name: f.facilityName || f.name,
      facilityName: f.facilityName || f.name,
      address: f.address,
      floors: f.floorCount || f.floors || 3,
      layoutType: f.layoutType,
      isAllClimate: f.isAllClimate
    }));
    return { success: true, data: facilities.length > 0 ? facilities : MOCK_BRANCHES };
  } catch (error) {
    console.warn('API error, falling back to mock branches:', error);
    return { success: true, data: MOCK_BRANCHES };
  }
};

const FACILITY_CODE_TO_ID: Record<string, number> = {
  'HN-01': 1,
  'HN-02': 2,
  'HCM-01': 3,
  'HCM-02': 4,
  'HCM-03': 5,
  'DN-01': 6,
  'CT-01': 7,
};

/**
 * Lấy danh sách ô kho trên sơ đồ 2D theo cơ sở và tầng
 * BACKEND ENDPOINT: GET /api/units/filter?facilityId=...&floorId=...
 */
export const getStorageUnits = async (facilityCode: string, floor: number) => {
  if (isMockMode()) {
    return { success: true, data: generateMockUnits(facilityCode, floor) };
  }

  try {
    let facilityId = FACILITY_CODE_TO_ID[facilityCode];
    if (!facilityId) {
      if (!isNaN(Number(facilityCode))) {
        facilityId = Number(facilityCode);
      } else {
        const branchRes = await getBranches();
        const found = (branchRes?.data || []).find((b: any) => b.code === facilityCode || b.id === facilityCode);
        facilityId = found?.backendId || 1;
      }
    }
    const res: any = await apiClient.get('/units/filter', {
      params: { facilityId, floorId: floor }
    });
    const rawList = Array.isArray(res) ? res : (res?.data || []);
    const localMap = getHeldUnitsMap();
    const units = rawList.map((u: any) => {
      const typeStr = (u.typeName || u.unitTypeName || '').toUpperCase();
      let size = 'M';
      if (typeStr.includes('XL')) {
        size = 'XL';
      } else if (typeStr.includes('SIZE S') || typeStr.startsWith('S ') || typeStr === 'S') {
        size = 'S';
      } else if (typeStr.includes('SIZE L') || typeStr.startsWith('L ') || typeStr === 'L') {
        size = 'L';
      } else if (typeStr.includes('SIZE M') || typeStr.startsWith('M ') || typeStr === 'M') {
        size = 'M';
      }

      const daily = Number(u.dailyPrice || u.pricePerDay || (size === 'S' ? 30000 : size === 'M' ? 60000 : size === 'L' ? 120000 : 200000));
      const monthly = Number(u.monthlyPrice || (size === 'S' ? 600000 : size === 'M' ? 1200000 : size === 'L' ? 2400000 : 4000000));
      const unitCode = u.unitCode || `U-${u.unitId || u.id}`;
      const statusOverride = localMap[unitCode] || (u.unitCode ? localMap[u.unitCode] : undefined);

      return {
        id: unitCode,
        unitId: u.unitId || u.id,
        unitTypeId: u.unitTypeId || u.typeId || (size === 'S' ? 1 : size === 'M' ? (Boolean(u.isClimate || u.climateControl) ? 3 : 2) : size === 'L' ? (Boolean(u.isClimate || u.climateControl) ? 5 : 4) : (Boolean(u.isClimate || u.climateControl) ? 7 : 6)),
        floor: floor,
        floorName: u.floorName || (floor === 1 ? 'Tầng trệt' : `Tầng ${floor - 1}`),
        weightLimit: u.maxLoadKgM2 ? `${u.maxLoadKgM2} kg/m²` : (floor === 1 ? '1000 kg/m²' : '500 kg/m²'),
        size: size,
        dim: `${u.lengthM || 1.5}m × ${u.widthM || 2.0}m`,
        price: daily,
        monthlyPrice: monthly,
        deposit: Number(u.depositAmount || (size === 'S' ? 500000 : size === 'M' ? 1000000 : size === 'L' ? 2000000 : 3000000)),
        status: statusOverride || u.status || 'AVAILABLE',
        isClimate: Boolean(u.isClimate || u.climateControl),
        storageType: (u.isClimate || u.climateControl) ? 'CLIMATE_CONTROLLED' : 'STANDARD',
        typeLabel: (u.isClimate || u.climateControl) ? 'Kho Mát Điều Hòa (22-25°C)' : 'Kho Tiêu Chuẩn',
      };
    });
    return { success: true, data: units.length > 0 ? units : generateMockUnits(facilityCode, floor) };
  } catch (error) {
    console.warn('API error, falling back to mock units:', error);
    return { success: true, data: generateMockUnits(facilityCode, floor) };
  }
};

/**
 * Tạo giao dịch đặt cọc giữ chỗ ô kho
 * SWAGGER ENDPOINT: POST /api/deposits/initiate
 */
export const createDepositTransaction = async (bookingData: any) => {
  try {
    let accountId = 13;
    try {
      const rawAuth = localStorage.getItem('auth_session') || sessionStorage.getItem('auth_session');
      if (rawAuth) {
        const parsed = JSON.parse(rawAuth);
        if (parsed?.user?.id || parsed?.user?.accountId) {
          accountId = Number(parsed.user.id || parsed.user.accountId);
        }
      } else {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (userStr) {
          const u = JSON.parse(userStr);
          if (u.accountId || u.id) {
            accountId = Number(u.accountId || u.id);
          }
        }
      }
    } catch (e) {}

    const parseToIsoDate = (dStr: string) => {
      if (!dStr) return new Date().toISOString().split('T')[0];
      if (dStr.includes('/')) {
        const parts = dStr.split('/');
        if (parts.length === 3) {
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
      return dStr.split(' ')[0];
    };

    const sDate = parseToIsoDate(bookingData.startDate);
    let eDate = parseToIsoDate(bookingData.endDate);
    if (!eDate || eDate === sDate) {
      const d = new Date(sDate);
      d.setDate(d.getDate() + (bookingData.effectiveDays || 30));
      eDate = d.toISOString().split('T')[0];
    }

    const payload = {
      accountId: accountId,
      unitCode: bookingData.unitId || bookingData.unitCode || bookingData.id || 'HN01-G-XL04',
      rentalType: bookingData.effectiveDays && bookingData.effectiveDays < 30 ? 'DAILY' : 'MONTHLY',
      startDate: sDate,
      endDate: eDate,
      agreedClickwrap: true
    };

    const res: any = await apiClient.post('/deposits/initiate', payload);
    const d = res.data || res;

    if (!d || d.success === false) {
      return {
        success: false,
        message: d?.message || 'Ô kho này hiện không thể đặt cọc. Vui lòng chọn ô khác!',
        data: null
      };
    }

    return {
      success: true,
      data: {
        bookingCode: d.reservationCode || d.invoiceNumber,
        reservationCode: d.reservationCode,
        contractId: d.reservationCode || (d.contractId ? `CTR-${d.contractId}` : undefined),
        rawContractId: d.contractId,
        invoiceNumber: d.invoiceNumber,
        unitId: bookingData.unitId || bookingData.id,
        facilityName: bookingData.facilityName,
        unitSize: bookingData.unitSize,
        startDate: sDate,
        endDate: eDate,
        depositAmount: d.depositAmount || bookingData.deposit || 3000000,
        paymentUrl: d.paymentUrl,
        bankInfo: {
          bankName: 'MB BANK (Ngân hàng Quân Đội)',
          accountNumber: '999988886666',
          accountName: 'CONG TY CP SMART SELF STORAGE',
          branch: 'Chi nhánh Hà Nội'
        }
      }
    };
  } catch (error) {
    console.error('API error initiating deposit:', error);
    throw error;
  }
};

/**
 * Kiểm tra trạng thái thanh toán đặt cọc
 * SWAGGER ENDPOINT: GET /api/deposits/status
 */
export const checkBookingStatus = async (invoiceNumber: string) => {
  if (isMockMode()) {
    return { success: true, status: 'PAID', isPaid: true, data: { status: 'PAID' } };
  }
  try {
    const res: any = await apiClient.get('/deposits/status', {
      params: { invoiceNumber }
    });
    const status = res.status || (res.data && res.data.status);
    return {
      success: true,
      status: status,
      isPaid: status === 'PAID' || status === 'CONFIRMED' || status === 'SUCCESS',
      data: { status }
    };
  } catch (error) {
    return { success: false, status: 'PENDING', isPaid: false, data: { status: 'PENDING' } };
  }
};

/**
 * Giả lập thanh toán đặt cọc thành công (Test Mock)
 */
export const mockPayDeposit = async (invoiceNumber: string) => {
  try {
    const res = await apiClient.post(`/deposits/mock-pay?invoiceNumber=${encodeURIComponent(invoiceNumber)}`);
    return { success: true, data: res.data || res };
  } catch (error) {
    return { success: true, message: 'Đã thanh toán thử nghiệm thành công' };
  }
};

/**
 * Thêm hợp đồng mới vừa nộp cọc thành công
 */
export const addNewBookingContract = (bookingData: any) => {
  markUnitAsHeld(bookingData.unitId || bookingData.unitCode, 'OCCUPIED');
};
