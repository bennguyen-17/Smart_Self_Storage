import React, { useState, useEffect } from 'react';

import ExtendPaymentModal from './ExtendPaymentModal';
import ExtendSuccessModal from './ExtendSuccessModal';
import { extendStorageContract } from '@/features/customer/storage/storageApi';

export default function ExtendPaymentFlow({
  initialBookingData,
  onClose,
  onFinish,
}: {
  initialBookingData?: Record<string, unknown>;
  onClose?: () => void;
  onFinish?: () => void;
}) {
  const [step, setStep] = useState('PAYMENT');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [successData, setSuccessData] = useState<any>(null);

  useEffect(() => {
    handleProceedToPayment();
  }, []);

  const handleProceedToPayment = () => {
    const rawContract = initialBookingData as any;
    const contractCode =
      rawContract?.contractId ||
      rawContract?.reservationCode ||
      rawContract?.bookingCode ||
      (rawContract?.rawContractId ? `CTR-${rawContract.rawContractId}` : 'CTR-HN01-171026-0042');

    const extendAmount =
      rawContract?.extendAmount ||
      rawContract?.depositAmount ||
      rawContract?.totalAmount ||
      1440000;

    const randomSuffix = `${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
    const invoiceNumber = `EXT-${contractCode}-${randomSuffix}`;

    const data = {
      ...(initialBookingData || {}),
      bookingCode: contractCode,
      contractCode,
      contractId: contractCode,
      rawContractId: rawContract?.rawContractId,
      invoiceNumber,
      unitId: rawContract?.unitId || rawContract?.unitCode || 'HN01-G-XL04',
      facilityName: rawContract?.facilityName || rawContract?.branchName || 'SmartStorage Cầu Giấy (HN01)',
      unitSize: rawContract?.unitSize || rawContract?.sizeLabel || 'Size XL',
      startDate: rawContract?.startDate || new Date().toLocaleDateString('vi-VN'),
      extendAmount,
      depositAmount: extendAmount,
      effectiveDays: rawContract?.effectiveDays || 30,
      newExpiryDate: rawContract?.newExpiryDate || '',
      packageLabel: rawContract?.packageLabel || '1 Tháng',
      bankInfo: {
        transferMemo: invoiceNumber,
      },
    };

    setPaymentData(data);
    setStep('PAYMENT');
  };

  const handlePaymentSuccess = async (statusData: any) => {
    const rawContract = initialBookingData as any;
    const targetId = rawContract?.rawContractId || rawContract?.contractId || paymentData?.contractCode;

    let resExpiry = paymentData?.newExpiryDate;
    try {
      const res: any = await extendStorageContract(targetId, {
        effectiveDays: paymentData?.effectiveDays || 30,
        finalTotal: paymentData?.extendAmount || 1440000,
        packageLabel: paymentData?.packageLabel || '1 Tháng',
        newExpiryDate: paymentData?.newExpiryDate,
        invoiceNumber: paymentData?.invoiceNumber,
      });
      if (res?.newExpiryDate) {
        resExpiry = res.newExpiryDate;
      }
    } catch (e) {
      console.warn('Lỗi gọi extend contract API:', e);
    }

    setSuccessData({
      ...initialBookingData,
      bookingCode: paymentData?.invoiceNumber || paymentData?.contractCode,
      contractCode: paymentData?.contractCode,
      invoiceNumber: paymentData?.invoiceNumber,
      newExpiryDate: resExpiry,
      effectiveDays: paymentData?.effectiveDays,
    });
    setStep('SUCCESS');
  };

  return (
    <>
      {step === 'PAYMENT' && paymentData && (
        <ExtendPaymentModal
          paymentData={paymentData}
          onPaymentSuccess={handlePaymentSuccess}
          onBack={() => onClose?.()}
        />
      )}
      {step === 'SUCCESS' && (
        <ExtendSuccessModal
          successData={successData}
          onGoHome={() => {
            onFinish?.();
            onClose?.();
          }}
        />
      )}
    </>
  );
}