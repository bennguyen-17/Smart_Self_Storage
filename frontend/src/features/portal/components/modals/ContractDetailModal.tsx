import React from 'react';

export default function ContractDetailModal({ contract, onClose }: { contract: any; onClose: () => void }) {
  if (!contract) return null;

  const branchName = contract.branchName || contract.facilityName || 'SmartStorage Cầu Giấy (HN-01)';
  const unitCode = contract.unitCode || contract.unitNumber || 'HN01-G-XL01';
  const startDate = contract.startDate || contract.checkInDate || '01/10/2026';
  const endDate = contract.endDate || contract.expiryDate || contract.checkOutDate || '31/10/2026';
  
  const rentalFee = contract.totalPrice || contract.estimatedTotalRental || contract.rentalFee || 4000000;
  const depositFee = contract.depositAmount || contract.deposit || 3000000;

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] modal-animate-pop">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/90">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
              <i className="fa-solid fa-file-signature text-amber-500"></i>
              <span>Chi Tiết Thỏa Thuận Thuê Kho</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Mã giao dịch: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{contract.contractId || 'HD-001'}</span>
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-base"></i>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* Exact Card Component requested by User */}
          <div className="bg-slate-50/70 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-4 shadow-sm">
            
            {/* Top row of card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-700/60 pb-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <i className="fa-solid fa-box text-xs"></i>
                </span>
                <span className="font-extrabold text-slate-800 dark:text-white text-sm">Thông tin ô kho</span>
              </div>
              <div className="text-slate-500 dark:text-slate-400">
                Chi nhánh: <span className="font-bold text-slate-900 dark:text-white">{branchName}</span>
              </div>
            </div>

            {/* 4 Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Card 1: Mã kho */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex flex-col justify-between items-center text-center min-h-[76px] shadow-2xs">
                <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 block whitespace-nowrap">Mã kho</span>
                <span className="font-mono font-black text-amber-500 text-xs sm:text-sm block truncate pt-1">{unitCode}</span>
              </div>

              {/* Card 2: Ngày nhận */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex flex-col justify-between items-center text-center min-h-[76px] shadow-2xs">
                <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 block whitespace-nowrap">Ngày Check-in</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 text-xs sm:text-sm block pt-1">{startDate}</span>
              </div>

              {/* Card 3: Hạn trả */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex flex-col justify-between items-center text-center min-h-[76px] shadow-2xs">
                <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 block whitespace-nowrap">Hạn Check-out</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm block pt-1">{endDate}</span>
              </div>

              {/* Card 4: Ước tính tiền thuê */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex flex-col justify-between items-center text-center min-h-[76px] shadow-2xs">
                <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 block whitespace-nowrap">Tiền thuê</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block pt-1">{Number(rentalFee).toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            {/* Bottom Row: Tiền cọc */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
              <span className="font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300">Tiền cọc giữ chỗ:</span>
              <span className="font-mono font-black text-base sm:text-xl text-amber-500">{Number(depositFee).toLocaleString('vi-VN')} VNĐ</span>
            </div>
          </div>

          {/* Quy định & Lưu ý */}
          <div className="bg-blue-50/50 dark:bg-blue-950/30 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/50 text-xs space-y-2 text-slate-700 dark:text-slate-300">
            <h4 className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
              <i className="fa-solid fa-circle-info"></i> Quy định sử dụng kho
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
              <li>Tiền cọc giữ chỗ sẽ được cấn trừ hoặc hoàn lại 100% khi kết thúc thời hạn thuê kho.</li>
              <li>Quý khách vui lòng thanh toán khoản tiền thuê còn lại vào ngày làm thủ tục Check-in nhận kho.</li>
              <li>Tuyệt đối không lưu trữ chất cháy nổ, hàng hóa cấm hoặc thực phẩm tươi sống dễ hư hỏng.</li>
            </ul>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-3xl flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white text-xs shadow-md transition cursor-pointer"
          >
            Đóng bảng thỏa thuận
          </button>
        </div>
      </div>
    </div>
  );
}
