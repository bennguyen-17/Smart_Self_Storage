import apiClient, { isMockMode } from './apiClient';

const mockBookings: Record<string, any> = {};

/**
 * Tạo giao dịch đặt cọc giữ chỗ ô kho
 * SWAGGER ENDPOINT: POST /api/deposits/initiate
 */
export const createDepositTransaction = async (bookingData: any) => {
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
        invoiceNumber: transferMemo,
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
    const userStr = localStorage.getItem('user');
    let accountId = 7;
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        accountId = u.accountId || u.id || 7;
      } catch (e) {}
    }

    const payload = {
      accountId: accountId,
      unitId: bookingData.unitId || bookingData.id || 1,
      rentalType: bookingData.rentalType || 'MONTHLY',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      agreedClickwrap: true
    };

    const res: any = await apiClient.post('/deposits/initiate', payload);
    const d = res.data || res;

    return {
      success: true,
      data: {
        bookingCode: d.invoiceNumber || d.reservationCode,
        invoiceNumber: d.invoiceNumber,
        unitId: bookingData.unitId || bookingData.id,
        facilityName: bookingData.facilityName,
        unitSize: bookingData.unitSize,
        startDate: bookingData.startDate || new Date().toLocaleDateString('vi-VN'),
        depositAmount: d.depositAmount || bookingData.depositAmount,
        bankInfo: {
          bankName: d.bankName || 'Ngân hàng TMCP Quân Đội (MBBank)',
          accountNo: d.bankAccount || '0900000001',
          accountName: d.accountHolder || 'SMART SELF STORAGE CORP',
          transferMemo: d.transferContent || d.invoiceNumber,
          qrImageUrl: d.vietQrUrl
        }
      }
    };
  } catch (error) {
    console.error('Lỗi API tạo giao dịch cọc:', error);
    throw error;
  }
};

/**
 * Kiểm tra trạng thái thanh toán của mã đặt cọc
 * SWAGGER ENDPOINT: GET /api/deposits/status?invoiceNumber=...
 */
export const checkBookingStatus = async (bookingCode: string) => {
  if (isMockMode()) {
    const mock = mockBookings[bookingCode];
    return {
      success: true,
      data: { bookingCode, status: mock ? mock.status : 'PENDING' }
    };
  }

  try {
    const res: any = await apiClient.get('/deposits/status', {
      params: { invoiceNumber: bookingCode }
    });
    const msg = res.message || res.status || (res.data && res.data.message) || '';
    const isPaid = msg === 'PAID' || res.data?.status === 'PAID' || res.data?.status === 'SUCCESS';
    return {
      success: true,
      data: { bookingCode, status: isPaid ? 'PAID' : 'PENDING' }
    };
  } catch (error) {
    console.error('Lỗi API kiểm tra trạng thái cọc:', error);
    return { success: true, data: { bookingCode, status: 'PENDING' } };
  }
};

/**
 * Giả lập nộp cọc nhanh cho Dev / Demo
 * SWAGGER ENDPOINT: POST /api/deposits/mock-pay?invoiceNumber=...
 */
export const mockPayDeposit = async (invoiceNumber: string) => {
  if (isMockMode()) {
    if (mockBookings[invoiceNumber]) {
      mockBookings[invoiceNumber].status = 'PAID';
    }
    return { success: true, message: 'Thanh toán demo thành công!' };
  }

  try {
    const res: any = await apiClient.post(`/deposits/mock-pay?invoiceNumber=${encodeURIComponent(invoiceNumber)}`);
    return { success: true, data: res.data || res };
  } catch (error) {
    console.error('Lỗi API mock pay:', error);
    throw error;
  }
};
