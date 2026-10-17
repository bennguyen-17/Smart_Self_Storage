import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import CustomerLayout from '@/components/layouts/CustomerLayout';
import { getMyContracts, cancelDepositContract, requestCheckoutContract } from './storageApi';
import StorageTable from './components/StorageTable';
import StorageCardList from './components/StorageCardList';
import StoragePagination from './components/StoragePagination';
import CancelDepositModal from './modals/CancelDepositModal';
import ContractDetailModal from './modals/ContractDetailModal';
import ExtendContractModal from './modals/ExtendContractModal';
import ExtendPaymentFlow from './modals/ExtendPaymentFlow';
import ReturnStorageModal from './modals/ReturnStorageModal';

export default function StoragePage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const totalItems = contracts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedContracts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return contracts.slice(start, start + pageSize);
  }, [contracts, currentPage, pageSize]);

  // State các Modals
  const [viewContract, setViewContract] = useState<any>(null);
  const [cancelModalContract, setCancelModalContract] = useState<any>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Modal Trả kho
  const [returnModalContract, setReturnModalContract] = useState<any>(null);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  // Modal Gia hạn
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendUnitContext, setExtendUnitContext] = useState<any>(null);
  const [showExtendPaymentFlow, setShowExtendPaymentFlow] = useState(false);
  const [extendPaymentData, setExtendPaymentData] = useState<any>(null);

  const getCancelReasonLabel = (reason?: string) => {
    switch (reason) {
      case 'NO_SHOW':
        return 'Hủy do quá hạn nhận kho';
      case 'CUSTOMER_REQUEST':
        return 'Hủy theo yêu cầu';
      case 'VIOLATION':
        return 'Hủy do vi phạm quy định';
      case 'EARLY_TERMINATION':
        return 'Trả kho trước hạn';
      case 'COUNTER_CANCEL':
        return 'Hủy tại quầy';
      default:
        return 'Hủy cọc';
    }
  };

  const fetchContracts = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await getMyContracts();
      if (res.success && Array.isArray(res.data)) {
        setContracts(res.data);
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách hợp đồng kho:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    try {
      localStorage.removeItem('smart_storage_contracts');
    } catch (e) {}

    fetchContracts(true);

    const handleUpdate = () => fetchContracts(false);
    window.addEventListener('storage_contracts_updated', handleUpdate);

    return () => {
      window.removeEventListener('storage_contracts_updated', handleUpdate);
    };
  }, []);

  const handleConfirmCancelDeposit = async (bankInfo: any) => {
    if (!cancelModalContract) return;
    setIsCancelling(true);
    try {
      await cancelDepositContract(cancelModalContract, bankInfo);
      await fetchContracts();
    } catch (err) {
      console.error('Lỗi khi hủy cọc:', err);
      throw err;
    } finally {
      setIsCancelling(false);
    }
  };

  const handleOpenExtend = (item: any) => {
    setExtendUnitContext({
      name: `Kho: ${item.unitCode}`,
      branch: item.branchName,
      expiry: item.expiryDate || item.endDate,
      daysLeft: item.daysLeft || 30,
      size: item.size,
      unitCode: item.unitCode,
      rentalFee: item.rentalFee,
      contractId: item.contractId,
      rawContractId: item.rawContractId,
      reservationCode: item.reservationCode || item.bookingCode || item.contractId,
      bookingCode: item.bookingCode || item.reservationCode || item.contractId,
    });
    setShowExtendModal(true);
  };

  const handleConfirmExtendPayment = (extData: any) => {
    setShowExtendModal(false);
    setExtendPaymentData({
      facilityName: extendUnitContext?.branch ? `SmartStorage ${extendUnitContext.branch}` : `SmartStorage ${extData.unitCode}`,
      unitId: extData.unitCode,
      unitSize: `Size ${extData.size}`,
      startDate: new Date().toLocaleDateString('vi-VN'),
      depositAmount: extData.finalTotal,
      extendAmount: extData.finalTotal,
      effectiveDays: extData.effectiveDays,
      newExpiryDate: extData.newExpiryDate,
      packageLabel: extData.packageLabel,
      contractId: extendUnitContext?.contractId,
      rawContractId: extendUnitContext?.rawContractId,
      reservationCode: extendUnitContext?.reservationCode,
      bookingCode: extendUnitContext?.bookingCode,
    });
    setShowExtendPaymentFlow(true);
  };

  const handleConfirmReturn = async (data: { reason: string; desiredDate: string }) => {
    if (!returnModalContract) return;
    try {
      setIsSubmittingReturn(true);
      const res = await requestCheckoutContract(returnModalContract, data);
      if (res.success) {
        setReturnModalContract(null);
        await fetchContracts(false);
      } else {
        alert(res.message || 'Không thể gửi yêu cầu trả kho');
      }
    } catch (e: any) {
      alert(e.message || 'Lỗi gửi yêu cầu trả kho');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  return (
    <CustomerLayout activeNav="my-storage">
      <motion.div
        key="page-my-storage"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 space-y-5 sm:space-y-6"
      >
        <div className="w-full space-y-4">
          <div className="card-box rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md shadow-slate-300/40 dark:shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-sm font-semibold text-slate-400">
                <i className="fa-solid fa-spinner animate-spin text-2xl mb-3 block text-blue-500"></i>
                Đang tải danh sách hợp đồng kho...
              </div>
            ) : contracts.length === 0 ? (
              <div className="py-16 text-center text-sm font-semibold text-slate-400">
                Chưa có hợp đồng thuê kho nào.
              </div>
            ) : (
              <>
                {/* 1. Mobile Cards */}
                <StorageCardList
                  contracts={paginatedContracts}
                  onViewContract={setViewContract}
                  onCancelDeposit={setCancelModalContract}
                  onExtend={handleOpenExtend}
                  onRequestReturn={setReturnModalContract}
                  getCancelReasonLabel={getCancelReasonLabel}
                />

                {/* 2. Desktop Table */}
                <StorageTable
                  contracts={paginatedContracts}
                  onViewContract={setViewContract}
                  onCancelDeposit={setCancelModalContract}
                  onExtend={handleOpenExtend}
                  onRequestReturn={setReturnModalContract}
                  getCancelReasonLabel={getCancelReasonLabel}
                />

                {/* 3. Pagination */}
                <StoragePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={totalItems}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                />
              </>
            )}
          </div>
        </div>

        {/* Modal Hủy cọc */}
        {cancelModalContract && (
          <CancelDepositModal
            contract={cancelModalContract}
            onClose={() => setCancelModalContract(null)}
            onConfirm={handleConfirmCancelDeposit}
            isCancelling={isCancelling}
          />
        )}

        {/* Modal Xem chi tiết hợp đồng */}
        {viewContract && (
          <ContractDetailModal
            contract={viewContract}
            onClose={() => setViewContract(null)}
          />
        )}

        {/* Modal Yêu cầu Trả kho */}
        {returnModalContract && (
          <ReturnStorageModal
            contract={returnModalContract}
            onClose={() => setReturnModalContract(null)}
            onConfirm={handleConfirmReturn}
            isSubmitting={isSubmittingReturn}
          />
        )}

        {/* Modal Gia hạn */}
        {showExtendModal && (
          <ExtendContractModal
            unitContext={extendUnitContext}
            onClose={() => setShowExtendModal(false)}
            onConfirmPayment={handleConfirmExtendPayment}
          />
        )}

        {/* Flow Thanh toán Gia hạn */}
        {showExtendPaymentFlow && extendPaymentData && (
          <ExtendPaymentFlow
            initialBookingData={extendPaymentData}
            onClose={() => {
              setShowExtendPaymentFlow(false);
              setExtendPaymentData(null);
            }}
            onFinish={() => {
              setShowExtendPaymentFlow(false);
              setExtendPaymentData(null);
              fetchContracts();
            }}
          />
        )}
      </motion.div>
    </CustomerLayout>
  );
}
