import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import CustomerLayout from '@/components/layouts/CustomerLayout';
import MyStorageTab from '@/features/portal/components/MyStorageTab';
import ExtendContractModal from '@/features/portal/components/modals/ExtendContractModal';
import ExtendPaymentFlow from '@/features/portal/components/modals/ExtendPaymentFlow';
import DepositPaymentFlow from '@/features/portal/components/modals/DepositPaymentFlow';

export default function MyStoragePage() {
  const navigate = useNavigate();
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendUnitContext, setExtendUnitContext] = useState<any>(null);
  const [showExtendPaymentFlow, setShowExtendPaymentFlow] = useState(false);
  const [extendPaymentData, setExtendPaymentData] = useState<any>(null);
  const [showDepositFlow, setShowDepositFlow] = useState(false);
  const [depositBookingData, setDepositBookingData] = useState<any>(null);

  const handleOpenExtendModal = (unitInfo: any) => {
    setExtendUnitContext(unitInfo);
    setShowExtendModal(true);
  };

  const handleConfirmExtendPayment = (extData: any) => {
    setShowExtendModal(false);
    setDepositBookingData({
      facilityName: `SmartStorage ${extData.unitCode}`,
      unitId: extData.unitCode,
      unitSize: `Size ${extData.size}`,
      startDate: new Date().toLocaleDateString('vi-VN'),
      depositAmount: extData.finalTotal,
    });
    setShowDepositFlow(true);
  };

  return (
    <CustomerLayout activeNav="my-storage">
      <motion.div
        key="page-my-storage"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1"
      >
        <MyStorageTab
          onOpenExtendModal={handleOpenExtendModal}
          onOpenPinModal={() => navigate('/gate-pin')}
        />
      </motion.div>

      {/* Modal Gia hạn hợp đồng */}
      {showExtendModal && (
        <ExtendContractModal
          unitContext={extendUnitContext}
          onClose={() => setShowExtendModal(false)}
          onConfirmPayment={handleConfirmExtendPayment}
        />
      )}

      {/* Luồng thanh toán gia hạn */}
      {showExtendPaymentFlow && extendPaymentData && (
        <ExtendPaymentFlow
          initialBookingData={extendPaymentData}
          onClose={() => setShowExtendPaymentFlow(false)}
          onFinish={() => {
            setShowExtendPaymentFlow(false);
            window.location.reload();
          }}
        />
      )}

      {/* Luồng thanh toán cọc/gia hạn */}
      {showDepositFlow && depositBookingData && (
        <DepositPaymentFlow
          initialBookingData={depositBookingData}
          onClose={() => setShowDepositFlow(false)}
          onFinish={() => {
            setShowDepositFlow(false);
            window.location.reload();
          }}
        />
      )}
    </CustomerLayout>
  );
}
