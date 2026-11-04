import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

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

  // 1. Mã hợp đồng & đường dẫn PDF vật lý chính thức từ Backend
  const contractCode =
    contract.contractCode ||
    contract.reservationCode ||
    contract.bookingCode ||
    (contract.contractId ? `CTR-${contract.contractId}` : (contract.rawContractId ? `CTR-${contract.rawContractId}` : ''));

  const targetContractId = contract.rawContractId || contract.contractId || contractCode;
  const officialPdfUrl = `/api/contracts/${targetContractId}/pdf`;

  // Thông tin snapshot
  const customerName = contract.signedFullName || contract.customerName || contract.fullName || 'Khách hàng';
  const isPending =
    contract.status === 'PENDING_CHECKIN' ||
    contract.contractStatus === 'PENDING_CHECKIN' ||
    contract.reservationStatus === 'PENDING';

  // 2. Tải trực tiếp file PDF vật lý từ Backend server
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
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                    isPending
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {isPending ? 'Đang giữ chỗ' : 'Có hiệu lực'}
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
