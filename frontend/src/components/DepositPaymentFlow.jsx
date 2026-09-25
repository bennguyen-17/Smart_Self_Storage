import React, { useState } from 'react';
import DraftContractModal from './DraftContractModal';
import DepositPaymentModal from './DepositPaymentModal';
import DepositSuccessModal from './DepositSuccessModal';
import { createDepositTransaction } from '../services/bookingApi';

export default function DepositPaymentFlow({ initialBookingData, onClose }) {
  const [step, setStep] = useState('CONTRACT'); // CONTRACT -> PAYMENT -> SUCCESS
  const [paymentData, setPaymentData] = useState(null);
  const [successData, setSuccessData] = useState(null);

  const handleProceedToPayment = async () => {
    const res = await createDepositTransaction(initialBookingData);
    if (res.success) {
      setPaymentData(res.data);
      setStep('PAYMENT');
    }
  };

  const handlePaymentSuccess = (statusData) => {
    setSuccessData({ ...initialBookingData, bookingCode: statusData.bookingCode });
    setStep('SUCCESS');
  };

  return (
    <>
      {step === 'CONTRACT' && <DraftContractModal bookingData={initialBookingData} onProceedToPayment={handleProceedToPayment} onClose={onClose} />}
      {step === 'PAYMENT' && <DepositPaymentModal paymentData={paymentData} onPaymentSuccess={handlePaymentSuccess} onBack={() => setStep('CONTRACT')} />}
      {step === 'SUCCESS' && <DepositSuccessModal successData={successData} onGoHome={onClose} />}
    </>
  );
}