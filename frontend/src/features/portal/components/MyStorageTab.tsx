import React, { useState, useEffect, useMemo } from 'react';
import { getMyContracts, cancelDepositContract } from '@/features/portal/services/contractService';
import ContractDetailModal from '@/features/portal/components/modals/ContractDetailModal';
import { formatDate } from '@/lib/format';
import { canExtendOnline } from '@/features/portal/lib/contractRules';

export default function MyStorageTab({ onOpenExtendModal, onOpenPinModal }: { onOpenExtendModal?: any; onOpenPinModal?: () => void }) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal Hủy Cọc & Xem hợp đồng
  const [cancelModalContract, setCancelModalContract] = useState<any>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [viewContract, setViewContract] = useState<any>(null);
  const [refundBankName, setRefundBankName] = useState('Vietcombank');
  const [refundAccountNumber, setRefundAccountNumber] = useState('');
  const [refundAccountName, setRefundAccountName] = useState('');
  const [bankFormError, setBankFormError] = useState('');

  const getCancelReasonLabel = (reason?: string) => {
    switch (reason) {
      case 'NO_SHOW':
        return 'Đã hủy do No-Show (quá hạn nhận kho)';
      case 'CUSTOMER_REQUEST':
        return 'Đã hủy theo yêu cầu (được hoàn cọc)';
      case 'VIOLATION':
        return 'Đã hủy do vi phạm quy định';
      case 'EARLY_TERMINATION':
        return 'Đã trả kho trước hạn';
      case 'COUNTER_CANCEL':
        return 'Đã hủy tại quầy';
      default:
        return 'Đã hủy cọc';
    }
  };

  // Tải danh sách hợp đồng kho của khách hàng
  const fetchContracts = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await getMyContracts();
      if (res.success && Array.isArray(res.data)) {
        // Lọc bỏ triệt để các mã mock fix cứng như #HD-2
        const validList = res.data.filter((c: any) => c.contractId !== '#HD-2' && c.rawContractId !== 2).sort((a: any, b: any) => (b.rawContractId || 0) - (a.rawContractId || 0));
        setContracts(validList);
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách hợp đồng kho:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    // Dọn dẹp cache nếu từng lưu #HD-2
    try {
      const raw = localStorage.getItem('smart_storage_contracts');
      if (raw && (raw.includes('#HD-2') || raw.includes('"rawContractId":2'))) {
        const parsed = JSON.parse(raw);
        const filtered = parsed.filter((c: any) => c.contractId !== '#HD-2' && c.rawContractId !== 2);
        localStorage.setItem('smart_storage_contracts', JSON.stringify(filtered));
      }
    } catch (e) {}

    fetchContracts(true);

    const handleUpdate = () => {
      fetchContracts(false);
    };
    window.addEventListener('storage_contracts_updated', handleUpdate);

    return () => {
      window.removeEventListener('storage_contracts_updated', handleUpdate);
    };
  }, []);


  // Tính số ngày còn lại đến ngày nhận kho
  const daysUntilStart = useMemo(() => {
    if (!cancelModalContract?.startDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(cancelModalContract.startDate);
    start.setHours(0, 0, 0, 0);
    const diffTime = start.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [cancelModalContract]);

  const isRefundEligible = daysUntilStart >= 4;

  const handleOpenCancelModal = (item: any) => {
    setCancelModalContract(item);
    setBankFormError('');
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.fullName) {
          setRefundAccountName(u.fullName.toUpperCase());
        }
      }
    } catch (e) {}
  };

  // Xử lý Hủy cọc
  const handleConfirmCancelDeposit = async () => {
    if (!cancelModalContract) return;

    if (!refundAccountNumber.trim()) {
      setBankFormError('Vui lòng nhập số tài khoản ngân hàng để nhận hoàn tiền cọc.');
      return;
    }
    if (!refundAccountName.trim()) {
      setBankFormError('Vui lòng nhập tên chủ tài khoản thụ hưởng.');
      return;
    }

    setIsCancelling(true);
    setBankFormError('');
    try {
      await cancelDepositContract(cancelModalContract, {
        bankName: refundBankName,
        bankAccountNumber: refundAccountNumber.trim(),
        bankAccountName: refundAccountName.trim().toUpperCase(),
      });
      setCancelModalContract(null);
      await fetchContracts();
    } catch (err) {
      console.error('Lỗi khi hủy cọc:', err);
      setBankFormError('Có lỗi xảy ra khi hủy cọc, vui lòng thử lại.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 w-full">

      {/* MANAGED STORAGE UNITS TABLE (FULL WIDTH) */}
      <div className="w-full space-y-4">
        <div className="card-box rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">


            {/* Table or Responsive Cards Content */}
            <div className="w-full">
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
                  {/* 1. RESPONSIVE CARD VIEW (Màn hình nhỏ & vừa, KHÔNG CẦN CUỘN NGANG) */}
                  <div className="xl:hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {contracts.map((item) => {
                      const isPending = item.status === 'PENDING_CHECKIN';
                      const isActive = item.status === 'ACTIVE';
                      const isCanceled = item.status === 'CANCELED';

                      return (
                        <div key={item.contractId} className="p-4 sm:p-5 space-y-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          {/* Top Row: Mã hợp đồng, Mã ô kho, Trạng thái */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setViewContract(item)}
                                title="Xem chi tiết hợp đồng"
                                className="text-xs font-mono font-black px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-xs hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors cursor-pointer inline-flex items-center"
                              >
                                <i className="fa-solid fa-file-contract mr-1.5"></i>
                                {item.contractId}
                              </button>
                              <span className="font-black text-slate-900 dark:text-slate-100 text-sm sm:text-base font-mono">
                                {item.unitCode}
                              </span>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black border shadow-xs ${
                              isActive
                                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60'
                                : isPending
                                ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/60'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                            }`}>
                              <span className={`w-2 h-2 rounded-full mr-1.5 ${
                                isActive ? 'bg-emerald-500' : isPending ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'
                              }`}></span>
                              {isPending ? 'CHỜ CHECK-IN' : (item.statusLabel || item.status)}
                            </span>
                          </div>

                          {/* Middle Grid: Cơ sở, Kích cỡ, Ngày trả kho */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                            <div className="col-span-2 sm:col-span-1">
                              <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-bold">Cơ Sở</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5 truncate" title={item.branchName}>
                                <i className="fa-solid fa-location-dot text-rose-500 text-[11px] shrink-0"></i>
                                <span className="truncate">{item.branchName ? item.branchName.replace(/\s*\([A-Z0-9-]+\)/g, '') : ''}</span>
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-bold">Ngày nhận kho</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
                                {formatDate(item.startDate)}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-bold">Ngày trả kho</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
                                {formatDate(item.expiryDate)}
                              </span>
                            </div>
                          </div>

                          {/* Bottom: Nút Hành Động */}
                          <div className="flex items-center justify-end pt-1 gap-1.5">
                            {isPending && (
                              <button
                                type="button"
                                onClick={() => handleOpenCancelModal(item)}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-200 dark:border-rose-800 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap active:scale-95"
                                title="Hủy đặt cọc ô kho"
                              >
                                <i className="fa-solid fa-ban text-xs"></i> Hủy cọc
                              </button>
                            )}

                            {/* Chỉ HĐ ACTIVE mới được gia hạn online */}
                            {canExtendOnline(item.status) && (
                              <button
                                type="button"
                                onClick={() => onOpenExtendModal({
                                  name: `Kho: ${item.unitCode}`,
                                  branch: item.branchName,
                                  expiry: item.expiryDate,
                                  daysLeft: item.daysLeft || 30,
                                  size: item.size,
                                          unitCode: item.unitCode,
                                          rentalFee: item.rentalFee
                                })}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-200 dark:border-blue-700 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap active:scale-95"
                              >
                                <i className="fa-solid fa-arrows-rotate text-xs"></i> Gia Hạn
                              </button>
                            )}

                            {isCanceled && (
                              <span className="text-xs text-rose-500/90 dark:text-rose-400 font-medium italic" title={getCancelReasonLabel(item.cancelReason)}>
                                {getCancelReasonLabel(item.cancelReason)}
                              </span>
                            )}

                            {/* HĐ OVERDUE không gia hạn online, phải ra quầy nộp phạt */}
                            {item.status === 'OVERDUE' && (
                              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                                <i className="fa-solid fa-store text-xs"></i> Quá hạn: vui lòng gia hạn tại quầy
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 2. DESKTOP OPTIMIZED TABLE VIEW (Màn hình lớn XL+, canh lề gọn không bị tràn ngang) */}
                  <div className="hidden xl:block overflow-x-auto w-full">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                          <th className="py-2 px-2 text-center whitespace-nowrap">Mã Hợp Đồng</th>
                          <th className="py-2 px-2 text-center whitespace-nowrap">Mã Ô Kho</th>
                          <th className="py-2 px-2 text-center">Cơ Sở</th>
                          <th className="py-2 px-2 text-center whitespace-nowrap">Ngày Nhận Kho</th>
                          <th className="py-2 px-2 text-center whitespace-nowrap">Ngày Trả Kho</th>
                          <th className="py-2 px-2 text-center whitespace-nowrap">Trạng Thái</th>
                          <th className="py-2 px-2 text-center whitespace-nowrap">Hành Động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                        {contracts.map((item) => {
                          const isPending = item.status === 'PENDING_CHECKIN';
                          const isActive = item.status === 'ACTIVE';
                          const isCanceled = item.status === 'CANCELED';

                          return (
                            <tr key={item.contractId} className="hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors group">
                              <td className="py-2.5 px-2 whitespace-nowrap align-middle text-center">
                                <button
                                  type="button"
                                  onClick={() => setViewContract(item)}
                                  title="Xem chi tiết hợp đồng"
                                  className="inline-flex items-center justify-center text-xs font-mono font-black px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-xs hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors cursor-pointer"
                                >
                                  <i className="fa-solid fa-file-contract mr-1"></i>
                                  {item.contractId}
                                </button>
                              </td>
                              <td className="py-2.5 px-2 whitespace-nowrap align-middle text-center">
                                <span className="font-black text-slate-900 dark:text-slate-100 text-xs font-mono tracking-tight">{item.unitCode}</span>
                              </td>
                              <td className="py-2.5 px-2 align-middle text-center">
                                <div className="flex items-center justify-center text-[11px] font-bold text-slate-700 dark:text-slate-300 gap-1 max-w-[170px] mx-auto truncate" title={item.branchName}>
                                  <i className="fa-solid fa-location-dot text-rose-500 text-[10px] shrink-0"></i>
                                  <span className="truncate">{item.branchName ? item.branchName.replace(/\s*\([A-Z0-9-]+\)/g, '') : ''}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-2 whitespace-nowrap align-middle text-center">
                                <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px]">{formatDate(item.startDate)}</span>
                              </td>
                              <td className="py-2.5 px-2 whitespace-nowrap align-middle text-center">
                                <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">{formatDate(item.expiryDate)}</div>
                              </td>
                              <td className="py-2.5 px-2 whitespace-nowrap align-middle text-center">
                                <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-black border shadow-xs ${
                                  isActive
                                    ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60'
                                    : isPending
                                    ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/60'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full mr-1 ${
                                    isActive ? 'bg-emerald-500' : isPending ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'
                                  }`}></span>
                                  {isPending ? 'CHỜ CHECK-IN' : (item.statusLabel || item.status)}
                                </span>
                              </td>

                              {/* CỘT HÀNH ĐỘNG */}
                              <td className="py-3.5 px-3 text-center whitespace-nowrap align-middle">
                                <div className="inline-flex items-center justify-center gap-1.5">
                                  {isPending && (
                                    <button
                                      type="button"
                                      onClick={() => setCancelModalContract(item)}
                                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-200 dark:border-rose-800 transition cursor-pointer flex items-center justify-center gap-1 shadow-xs whitespace-nowrap active:scale-95"
                                      title="Hủy đặt cọc ô kho"
                                    >
                                      <i className="fa-solid fa-ban text-[11px]"></i> Hủy cọc
                                    </button>
                                  )}

                                  {/* Chỉ HĐ ACTIVE mới được gia hạn online */}
                                  {canExtendOnline(item.status) && (
                                    <button
                                      type="button"
                                      onClick={() => onOpenExtendModal({
                                        name: `Kho: ${item.unitCode}`,
                                        branch: item.branchName,
                                        expiry: item.expiryDate,
                                        daysLeft: item.daysLeft || 30,
                                        size: item.size,
                                          unitCode: item.unitCode,
                                          rentalFee: item.rentalFee
                                      })}
                                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-200 dark:border-blue-700 transition cursor-pointer flex items-center justify-center gap-1 shadow-xs whitespace-nowrap active:scale-95"
                                    >
                                      <i className="fa-solid fa-arrows-rotate text-[11px]"></i> Gia Hạn
                                    </button>
                                  )}

                                  {isCanceled && (
                                    <span className="text-xs text-rose-500/90 dark:text-rose-400 font-medium italic" title={getCancelReasonLabel(item.cancelReason)}>
                                      {getCancelReasonLabel(item.cancelReason)}
                                    </span>
                                  )}

                                  {/* HĐ OVERDUE không gia hạn online, phải ra quầy nộp phạt */}
                                  {item.status === 'OVERDUE' && (
                                    <span
                                      className="text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1"
                                      title="Hợp đồng quá hạn không gia hạn online được. Vui lòng đến quầy để nộp phạt và gia hạn."
                                    >
                                      <i className="fa-solid fa-store text-[11px]"></i> Gia hạn tại quầy
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

      {/* MODAL XÁC NHẬN HỦY CỌC */}
      {cancelModalContract && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 modal-animate-pop">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-lg font-bold">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase">XÁC NHẬN HỦY ĐẶT CỌC</h3>
                <p className="text-[11px] text-slate-500">Chính sách hoàn tiền đặt cọc</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs space-y-2 text-slate-700 dark:text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Hợp đồng:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{cancelModalContract.contractId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Ô kho đặt cọc:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{cancelModalContract.unitCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Cơ sở:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{cancelModalContract.branchName}</span>
              </div>
            </div>

            {/* BẢNG ĐIỀU KIỆN & CHÍNH SÁCH HOÀN TIỀN (THEO BUSINESS RULE BR-17) */}
            <div className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
              isRefundEligible
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
            }`}>
              <div className="flex items-center justify-between font-bold text-xs">
                <span className="flex items-center gap-1.5">
                  <i className={`fa-solid ${isRefundEligible ? 'fa-circle-check text-emerald-600 dark:text-emerald-400' : 'fa-circle-exclamation text-amber-600 dark:text-amber-400'}`}></i>
                  {isRefundEligible ? 'Đủ điều kiện hoàn 100% tiền cọc (BR-17)' : 'Hủy cận ngày: Hoàn 50% tiền cọc (BR-17)'}
                </span>
                <span className="font-mono text-[10.5px] px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-900/80 border border-current font-bold">
                  Còn {daysUntilStart > 0 ? `${daysUntilStart} ngày` : 'trong ngày'} đến ngày nhận kho
                </span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {isRefundEligible
                  ? `Theo Business Rule BR-17: Do bạn hủy trước ngày nhận kho từ 4 ngày trở lên, toàn bộ 100% số tiền cọc (${(cancelModalContract.depositFee || 500000).toLocaleString('vi-VN')} đ) sẽ được bộ phận Kế toán / Back-office chuyển khoản hoàn lại cho bạn trong 24 - 48 giờ làm việc.`
                  : `Theo Business Rule BR-17: Do hủy trước ngày nhận kho dưới 4 ngày, bạn sẽ bị khấu trừ 50% tiền cọc (${((cancelModalContract.depositFee || 500000) * 0.5).toLocaleString('vi-VN')} đ) làm chi phí giữ chỗ, và được hoàn lại 50% tiền cọc (${((cancelModalContract.depositFee || 500000) * 0.5).toLocaleString('vi-VN')} đ) về tài khoản ngân hàng.`}
              </p>
            </div>

            {/* FORM ĐIỀN THÔNG TIN TÀI KHOẢN NGÂN HÀNG (LUÔN CẦN ĐỂ HOÀN 100% HOẶC 50% CỌC) */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-300">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-building-columns text-blue-600 dark:text-blue-400"></i>
                  <span>Thông tin tài khoản nhận tiền hoàn cọc</span>
                </div>
                <span className="text-[10.5px] font-mono font-bold text-blue-600 dark:text-blue-400">
                  {isRefundEligible ? 'Hoàn 100%' : 'Hoàn 50%'}
                </span>
              </div>
              
              <div className="space-y-2 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Ngân hàng thụ hưởng:
                  </label>
                  <select
                    value={refundBankName}
                    onChange={(e) => setRefundBankName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Vietcombank">Vietcombank (VCB)</option>
                    <option value="MB Bank">MB Bank (Quân Đội)</option>
                    <option value="Techcombank">Techcombank (TCB)</option>
                    <option value="ACB">ACB (Á Châu)</option>
                    <option value="VPBank">VPBank</option>
                    <option value="TPBank">TPBank (Tiên Phong)</option>
                    <option value="BIDV">BIDV</option>
                    <option value="Agribank">Agribank</option>
                    <option value="VietinBank">VietinBank</option>
                    <option value="Khác">Ngân hàng khác</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Số tài khoản (STK): <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="VD: 1029384756"
                      value={refundAccountNumber}
                      onChange={(e) => {
                        setRefundAccountNumber(e.target.value);
                        setBankFormError('');
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Tên chủ tài khoản: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="VD: NGUYEN VAN A"
                      value={refundAccountName}
                      onChange={(e) => {
                        setRefundAccountName(e.target.value.toUpperCase());
                        setBankFormError('');
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs uppercase focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {bankFormError && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1 mt-1">
                    <i className="fa-solid fa-circle-exclamation"></i> {bankFormError}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => setCancelModalContract(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Giữ lại
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleConfirmCancelDeposit}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md transition flex items-center space-x-2 cursor-pointer"
              >
                {isCancelling ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-ban"></i>}
                <span>{isCancelling ? 'Đang xử lý...' : 'Xác nhận hủy cọc'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {viewContract && (
        <ContractDetailModal 
          contract={viewContract} 
          onClose={() => setViewContract(null)} 
        />
      )}
    </div>
  );
}
