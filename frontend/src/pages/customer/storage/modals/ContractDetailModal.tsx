import React from 'react';
import { formatDate } from '@/lib/format';

export default function ContractDetailModal({ contract, onClose }: { contract: any; onClose: () => void }) {
  if (!contract) return null;

  const branchName = contract.branchName;
  const unitCode = contract.unitCode;
  const startDate = formatDate(contract.startDate);
  const endDate = formatDate(contract.expiryDate || contract.endDate);
  
  const rentalFee = contract.rentalFee ?? contract.rentalAmount ?? 0;
  const depositFee = contract.depositFee ?? contract.depositAmount ?? 0;
  const totalAmount = contract.totalAmount ?? (Number(rentalFee) + Number(depositFee));

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
              {contract.status === 'PENDING_CHECKIN' ? (
                <>
                  Mã nhận kho (RES): <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">{contract.reservationCode || contract.bookingCode || contract.contractId}</span>
                </>
              ) : (
                <>
                  Mã hợp đồng: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{contract.contractId || 'HD-001'}</span>
                  {contract.reservationCode && contract.reservationCode !== contract.contractId && (
                    <span className="ml-2 text-slate-400 font-mono text-[11px]">(Mã RES: {contract.reservationCode})</span>
                  )}
                </>
              )}
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
          {contract.status === 'PENDING_CHECKIN' && (
            <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3 shadow-xs">
              <i className="fa-solid fa-qrcode text-xl text-amber-600 dark:text-amber-400 mt-0.5 shrink-0"></i>
              <div>
                <span className="font-bold text-sm block text-amber-900 dark:text-amber-100">Hướng dẫn nhận kho tại quầy lễ tân</span>
                <span className="text-[12px] leading-relaxed mt-0.5 block text-amber-800 dark:text-amber-200">
                  Vui lòng cung cấp mã đặt chỗ <strong className="font-mono font-black text-amber-700 dark:text-amber-300 text-sm px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/60 rounded-md border border-amber-300 dark:border-amber-700">{contract.reservationCode || contract.bookingCode || contract.contractId}</strong> hoặc số điện thoại đăng ký cho nhân viên lễ tân khi đến cơ sở để ký hợp đồng và nhận quyền truy cập mở kho.
                </span>
              </div>
            </div>
          )}
          
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

            {/* Bottom Row: Chi tiết tài chính */}
            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-600 dark:text-slate-400">Tiền cọc giữ chỗ:</span>
                <span className="font-mono font-bold text-amber-500">{Number(depositFee).toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-bold text-slate-800 dark:text-slate-200">Tổng giá trị hợp đồng:</span>
                <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-sm sm:text-base">
                  {Number(totalAmount).toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] sm:text-xs pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                <span className="text-slate-500">Tình trạng thanh toán:</span>
                {contract.status === 'ACTIVE' ? (
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Đã thanh toán đủ 100%</span>
                ) : (
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    Đã cọc online {Number(depositFee).toLocaleString('vi-VN')} đ · Cần nộp tại quầy {Number(rentalFee).toLocaleString('vi-VN')} đ
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Thông tin hoàn tiền cọc (nếu có) */}
          {contract.refundAccountNumber && (
            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 text-xs space-y-2 text-emerald-900 dark:text-emerald-200">
              <h4 className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                <i className="fa-solid fa-building-columns"></i> Thông tin thụ hưởng hoàn tiền cọc
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Ngân hàng:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{contract.refundBankName || 'Ngân hàng'}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Số tài khoản:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{contract.refundAccountNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Chủ tài khoản:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">{contract.refundAccountName}</span>
                </div>
              </div>
              <p className="text-[10.5px] text-emerald-700/80 dark:text-emerald-300/80 italic pt-1 border-t border-emerald-200/60 dark:border-emerald-800/40">
                * Trạng thái hoàn tiền: Kế toán đang xử lý lệnh chuyển khoản REF trong 24 - 48 giờ làm việc.
              </p>
            </div>
          )}

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
