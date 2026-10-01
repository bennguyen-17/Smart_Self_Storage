import React, { useState, useEffect } from 'react';

import ExtendPaymentModal from './ExtendPaymentModal';
import ExtendSuccessModal from './ExtendSuccessModal';
import { createDepositTransaction } from '@/features/portal/services/bookingApi';
import { addNewBookingContract } from '@/features/portal/services/contractService';
import { markUnitAsHeld } from '@/features/portal/services/facilityService';

export default function ExtendPaymentFlow({ initialBookingData, onClose, onFinish }: { initialBookingData?: Record<string, unknown>; onClose?: () => void; onFinish?: () => void }) {
  const [step, setStep] = useState('PAYMENT');
  useEffect(() => { handleProceedToPayment(); }, []); // CONTRACT -> PAYMENT -> SUCCESS
  const [paymentData, setPaymentData] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleProceedToPayment = async () => {
    setLoading(true);
    const bookingCode = `RES-${Math.floor(1000 + Math.random() * 9000)}`;
    const extendAmount = (initialBookingData as any)?.extendAmount || 3000000;
    const transferMemo = `EXT-${bookingCode}`;
    const defaultData = {
      bookingCode,
      invoiceNumber: transferMemo,
      unitId: (initialBookingData as any)?.unitId || 'HN01-G-XL04',
      facilityName: (initialBookingData as any)?.facilityName || 'SmartStorage Cầu Giấy (HN-01)',
      unitSize: (initialBookingData as any)?.unitSize || 'Size XL',
      startDate: (initialBookingData as any)?.startDate || new Date().toLocaleDateString('vi-VN'),
      extendAmount,
      bankInfo: {
        bankName: 'MB BANK (Ngân hàng Quân Đội)',
        accountNo: '0909888999',
        accountName: 'SELF STORAGE 391',
        transferMemo,
        qrImageUrl: `https://img.vietqr.io/image/MB-0909888999-compact2.png?amount=${extendAmount}&addInfo=${encodeURIComponent(transferMemo)}&accountName=SELF%20STORAGE%20391`
      }
    };

    try {
      const res = await createDepositTransaction(initialBookingData);
      if (res && res.success && res.data) {
        setPaymentData(res.data);
      } else {
        setPaymentData(defaultData);
      }
    } catch (err: any) {
      console.warn('Backend API tạm thời không phản hồi (500/Network), tự động tạo VietQR đặt chỗ:', err);
      setPaymentData(defaultData);
    } finally {
      setLoading(false);
      setStep('PAYMENT');
    }
  };

  const handlePaymentSuccess = (statusData) => {
    // 1. Cập nhật hợp đồng sang CHỜ CHECK-IN (PENDING_CHECKIN) trong danh sách hợp đồng quản lý
    const bookingPayload = {
      ...(initialBookingData || {}),
      contractId: paymentData?.contractId || statusData?.contractId,
      bookingCode: statusData?.bookingCode || paymentData?.bookingCode,
    };
    addNewBookingContract(bookingPayload);
    
    // 2. Cập nhật ô kho sang HOLD (Đã giữ chỗ) trên sơ đồ mặt bằng 2D
    const uId = (initialBookingData as any)?.unitId;
    if (uId) {
      markUnitAsHeld(uId, 'HOLD');
    }

    setSuccessData({ ...initialBookingData, bookingCode: statusData?.bookingCode || paymentData?.bookingCode });
    setStep('SUCCESS');
  };


  return (
    <>
      {step === 'PAYMENT' && paymentData && <ExtendPaymentModal paymentData={paymentData} onPaymentSuccess={handlePaymentSuccess} onBack={onClose} />}
      {step === 'SUCCESS' && <ExtendSuccessModal successData={successData} onGoHome={() => { onFinish?.(); onClose?.(); }} />}
    </>
  );
}


