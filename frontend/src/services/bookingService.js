import apiClient, { isMockMode } from './apiClient';

const mockBookings = {};

/**
 * Tạo giao dịch đặt cọc giữ chỗ ô kho
 * SWAGGER ENDPOINT: POST /api/v1/bookings/deposit
 */
export const createDepositTransaction = async (bookingData) => {
  if (isMockMode()) {
    const bookingCode = `RES-${Math.floor(1000 + Math.random() * 9000)}`;
    const depositAmount = bookingData.depositAmount || 3000000;
    const transferMemo = `DEP-${bookingCode}`;

    const qrImageUrl = `https://img.vietqr.io/image/MB-0909888999-compact2.png?amount=${depositAmount}&addInfo=${encodeURIComponent(transferMemo)}&accountName=SELF%20STORAGE%20391`;

    mockBookings[bookingCode] = { status: 'PENDING' };

    // Giả lập sau 6 giây ngân hàng bắn webhook báo đã nhận tiền cọc
    setTimeout(() => {
      if (mockBookings[bookingCode]) {
        mockBookings[bookingCode].status = 'PAID';
      }
    }, 6000);

    return {
      success: true,
      data: {
        bookingCode,
        unitId: bookingData.unitId || 'HN01-G-XL101',
        facilityName: bookingData.facilityName || 'SmartStorage Cầu Giấy (HN-01)',
        unitSize: bookingData.unitSize || 'Size XL (15m²)',
        startDate: bookingData.startDate || new Date().toLocaleDateString('vi-VN'),
        depositAmount,
        bankInfo: {
          bankName: 'MB BANK (Ngân hàng Quân Đội)',
          accountNo: '0909888999',
          accountName: 'SELF STORAGE 391',
          transferMemo,
          qrImageUrl
        }
      }
    };
  }

  try {
    const res = await apiClient.post('/bookings/deposit', bookingData);
    return { success: true, data: res.data || res };
  } catch (error) {
    console.error('Lỗi API tạo giao dịch cọc:', error);
    throw error;
  }
};

/**
 * Kiểm tra trạng thái thanh toán của mã đặt cọc
 * SWAGGER ENDPOINT: GET /api/v1/bookings/{bookingCode}/status
 */
export const checkBookingStatus = async (bookingCode) => {
  if (isMockMode()) {
    const mock = mockBookings[bookingCode];
    return {
      success: true,
      data: { bookingCode, status: mock ? mock.status : 'PENDING' }
    };
  }

  try {
    const res = await apiClient.get(`/bookings/${bookingCode}/status`);
    return { success: true, data: res.data || res };
  } catch (error) {
    console.error('Lỗi API kiểm tra trạng thái cọc:', error);
    throw error;
  }
};
