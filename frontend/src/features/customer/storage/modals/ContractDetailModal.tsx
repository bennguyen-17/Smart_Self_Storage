import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatDate, formatVnd } from '@/lib/format';

export default function ContractDetailModal({
  contract,
  onClose,
}: {
  contract: any;
  onClose: () => void;
}) {
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!contract) return null;
  if (typeof document === 'undefined') return null;

  // 1. Mã hợp đồng / mã giữ chỗ & đường dẫn PDF vật lý
  const contractCode =
    contract.contractCode ||
    contract.reservationCode ||
    contract.bookingCode ||
    (contract.contractId ? `CTR-${contract.contractId}` : (contract.rawContractId ? `CTR-${contract.rawContractId}` : '—'));

  const targetContractId = contract.rawContractId || contract.contractId || contractCode;
  const officialPdfUrl = `/api/contracts/${targetContractId}/pdf`;

  // Kiểm tra trạng thái chờ nhận kho
  const isPending =
    contract.status === 'PENDING_CHECKIN' ||
    contract.contractStatus === 'PENDING_CHECKIN' ||
    contract.reservationStatus === 'PENDING' ||
    contract.status === 'PENDING';

  // Thông tin chi tiết đơn
  const customerName = contract.signedFullName || contract.customerName || contract.fullName || 'Khách hàng';
  const unitCode = contract.unitCode || contract.unitId || '—';
  const facilityName = contract.facilityName || contract.branchName || 'Smart Self Storage';

  const rawStart = contract.startDate || contract.reservationStartDate || contract.checkInDate;
  const rawEnd = contract.expiryDate || contract.endDate || contract.reservationEndDate;
  const startDate = rawStart ? formatDate(rawStart) : '—';
  const endDate = rawEnd ? formatDate(rawEnd) : '—';

  const rentalAmount = Number(contract.rentalFee ?? contract.rentalAmount ?? contract.depRemainingAmount ?? 0);
  const depositAmount = Number(contract.depositFee ?? contract.depositAmount ?? contract.paidAmount ?? contract.depPaidAmount ?? 0);

  // 2. Tải trực tiếp file PDF vật lý từ Backend server (khi hợp đồng ACTIVE)
  const handleDownloadPdf = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const response = await fetch(officialPdfUrl);
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        const cleanName = String(contractCode).replace(/[^a-zA-Z0-9_-]/g, '_');
        a.download = `Hop_Dong_Thue_Kho_${cleanName}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      } else {
        alert('Không thể tải file PDF từ máy chủ. Vui lòng thử lại!');
      }
    } catch (err) {
      console.error('Lỗi tải PDF:', err);
      alert('Lỗi kết nối khi tải file PDF!');
    } finally {
      setIsDownloading(false);
    }
  };

  // NẾU LÀ ĐƠN CHỜ NHẬN KHO (PENDING_CHECKIN) -> HIỂN THỊ POPUP PHIẾU XÁC NHẬN GIỮ CHỖ
  if (isPending) {
    const pendingModalContent = (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all animate-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-6 py-4.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-receipt text-lg"></i>
              </div>
              <div>
                <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  MÃ HỢP ĐỒNG
                </span>
                <h3 className="font-mono font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  {contractCode}
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-200/60 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="Đóng"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Trạng thái đơn */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Trạng thái:
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                CHỜ NHẬN KHO
              </span>
            </div>

            {/* Chi tiết đơn đặt giữ chỗ */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center gap-1.5">
                <i className="fa-solid fa-circle-info text-blue-500"></i> Chi tiết đơn đặt giữ chỗ:
              </h4>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Mã ô kho:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {unitCode}
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between gap-4">
                  <span className="text-slate-500 dark:text-slate-400 shrink-0">Cơ sở kho:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100 text-right">
                    {facilityName}
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Ngày nhận kho:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {startDate}
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Ngày trả kho:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {endDate}
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Tiền thuê dự kiến:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatVnd(rentalAmount)}
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Tiền cọc đã thanh toán:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {formatVnd(depositAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Thông báo nghiệp vụ */}
            <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
              <i className="fa-solid fa-circle-exclamation text-blue-500 mt-0.5 shrink-0"></i>
              <span>
                Hợp đồng thuê kho chính thức sẽ được cấp và kích hoạt khi Quý khách hoàn tất thủ tục nhận kho.
              </span>
            </div>
          </div>

          {/* Footer actions */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 active:scale-95 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
    return createPortal(pendingModalContent, document.body);
  }

  // NẾU LÀ HỢP ĐỒNG ĐÃ KÍCH HOẠT (ACTIVE) HOẶC CÁC TRẠNG THÁI KHÁC -> HIỂN THỊ VĂN BẢN PDF CHÍNH THỨC
  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-5xl h-[92vh] flex flex-col bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
        {/* THANH ĐIỀU KHIỂN NỔI */}
        <div className="w-full bg-slate-900/95 px-4 py-3 sm:px-6 sm:py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
              <i className="fa-solid fa-file-contract text-lg"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-white tracking-wide">
                  Hợp đồng thuê kho lưu trữ tự quản
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Có hiệu lực
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Mã HĐ: <strong className="text-slate-200">{contractCode}</strong> · Khách hàng:{' '}
                <strong className="text-slate-200">{customerName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={officialPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700"
              title="Mở file PDF gốc trong tab mới của trình duyệt"
            >
              <i className="fa-solid fa-arrow-up-right-from-square text-blue-400"></i>
              <span className="hidden sm:inline">Mở tab mới</span>
            </a>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              title="Tải văn bản PDF 3 trang chính thức"
            >
              {isDownloading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin text-sm"></i>
                  <span>Đang tải...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-file-pdf text-sm text-red-300"></i>
                  <span>Tải PDF</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Đóng văn bản (Esc)"
            >
              <i className="fa-solid fa-xmark text-base"></i>
            </button>
          </div>
        </div>

        {/* KHUNG HIỂN THỊ FILE PDF CỨNG 100% TỪ BACKEND STORAGE */}
        <div className="flex-1 w-full bg-neutral-900 overflow-hidden relative">
          <iframe
            src={`${officialPdfUrl}#toolbar=1&navpanes=0`}
            title={`Hợp đồng ${contractCode}`}
            className="w-full h-full border-none bg-neutral-200"
          />
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

