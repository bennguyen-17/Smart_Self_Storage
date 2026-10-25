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

type ContractFilterTab = 'ALL' | 'ACTIVE' | 'PENDING_CHECKIN' | 'OVERDUE' | 'CANCELLED';

export default function StoragePage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Bộ lọc trạng thái & Tìm kiếm
  const [activeTab, setActiveTab] = useState<ContractFilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Thống kê số lượng từng loại
  const counts = useMemo(() => {
    return {
      all: contracts.length,
      active: contracts.filter((c) => c.status === 'ACTIVE').length,
      pending: contracts.filter((c) => c.status === 'PENDING_CHECKIN').length,
      overdue: contracts.filter((c) => c.status === 'OVERDUE').length,
      cancelled: contracts.filter((c) =>
        ['CANCELLED', 'TERMINATED', 'COMPLETED', 'FORFEITED'].includes(c.status)
      ).length,
    };
  }, [contracts]);

  // Lọc và sắp xếp danh sách hợp đồng
  const filteredContracts = useMemo(() => {
    const list = contracts.filter((c) => {
      // 1. Lọc theo tab
      if (activeTab === 'ACTIVE' && c.status !== 'ACTIVE') return false;
      if (activeTab === 'PENDING_CHECKIN' && c.status !== 'PENDING_CHECKIN') return false;
      if (activeTab === 'OVERDUE' && c.status !== 'OVERDUE') return false;
      if (
        activeTab === 'CANCELLED' &&
        !['CANCELLED', 'TERMINATED', 'COMPLETED', 'FORFEITED'].includes(c.status)
      ) {
        return false;
      }

      // 2. Lọc theo từ khóa tìm kiếm
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const code = (c.reservationCode || c.bookingCode || c.contractId || '').toLowerCase();
        const unit = (c.unitCode || '').toLowerCase();
        const branch = (c.branchName || '').toLowerCase();
        if (!code.includes(q) && !unit.includes(q) && !branch.includes(q)) {
          return false;
        }
      }
      return true;
    });

    // 3. Sắp xếp:
    // Nhóm hiệu lực / chờ check-in lên đầu, quá hạn và đã hủy nằm phía dưới
    // Trong cùng nhóm: cái nào mới nhất (rawContractId lớn hơn hoặc ngày bắt đầu mới hơn) nằm trên
    const getStatusPriority = (status: string) => {
      switch (status) {
        case 'ACTIVE':
          return 0;
        case 'PENDING_CHECKIN':
          return 1;
        case 'OVERDUE':
          return 2;
        case 'CANCELLED':
        case 'TERMINATED':
        case 'COMPLETED':
        case 'FORFEITED':
        default:
          return 3;
      }
    };

    return [...list].sort((a, b) => {
      const pA = getStatusPriority(a.status);
      const pB = getStatusPriority(b.status);
      if (pA !== pB) return pA - pB;
      const idA = Number(a.rawContractId) || 0;
      const idB = Number(b.rawContractId) || 0;
      return idB - idA;
    });
  }, [contracts, activeTab, searchQuery]);

  const totalItems = filteredContracts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedContracts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredContracts.slice(start, start + pageSize);
  }, [filteredContracts, currentPage, pageSize]);

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
          {/* Header Tiêu đề trang */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Kho Của Tôi
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Quản lý các hợp đồng thuê kho, gia hạn, đặt cọc và yêu cầu trả kho
              </p>
            </div>
          </div>

          <div className="card-box rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md shadow-slate-300/40 dark:shadow-sm overflow-hidden">
            {/* THANH BỘ LỌC TABS & TÌM KIẾM */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
              {/* Tab lọc trạng thái */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => { setActiveTab('ALL'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'ALL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>Tất cả</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === 'ALL' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {counts.all}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab('ACTIVE'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'ACTIVE'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Đang hiệu lực</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === 'ACTIVE' ? 'bg-emerald-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {counts.active}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab('PENDING_CHECKIN'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'PENDING_CHECKIN'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span>Chờ check-in</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === 'PENDING_CHECKIN' ? 'bg-amber-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {counts.pending}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab('OVERDUE'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'OVERDUE'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  <span>Quá hạn</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === 'OVERDUE' ? 'bg-rose-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {counts.overdue}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab('CANCELLED'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'CANCELLED'
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>Đã hủy / Lịch sử</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === 'CANCELLED' ? 'bg-slate-800 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {counts.cancelled}
                  </span>
                </button>
              </div>

              {/* Ô tìm kiếm */}
              <div className="relative w-full md:w-72">
                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"></i>
                <input
                  type="text"
                  placeholder="Tìm mã HĐ, mã ô, cơ sở..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-sm font-semibold text-slate-400">
                <i className="fa-solid fa-spinner animate-spin text-2xl mb-3 block text-blue-500"></i>
                Đang tải danh sách hợp đồng kho...
              </div>
            ) : contracts.length === 0 ? (
              <div className="py-16 text-center text-sm font-semibold text-slate-400">
                Chưa có hợp đồng thuê kho nào.
              </div>
            ) : filteredContracts.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <i className="fa-solid fa-filter-circle-xmark text-3xl text-slate-300 dark:text-slate-600"></i>
                <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Không tìm thấy hợp đồng nào phù hợp với bộ lọc.
                </div>
                <button
                  type="button"
                  onClick={() => { setActiveTab('ALL'); setSearchQuery(''); setCurrentPage(1); }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 hover:bg-blue-100 transition cursor-pointer"
                >
                  Xóa bộ lọc
                </button>
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
      </motion.div>

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
    </CustomerLayout>
  );
}
