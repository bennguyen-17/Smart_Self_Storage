import React, { useState } from 'react';

export default function DraftContractModal({ bookingData, onProceedToPayment, onClose }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] modal-animate-pop">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow">
              <i className="fa-solid fa-file-lines text-lg"></i>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">HỢP ĐỒNG DỰ THẢO & THỎA THUẬN ĐẶT CỌC</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Xem xét điều khoản trước khi thanh toán cọc</p>
            </div>
          </div>
          {onClose && (
            <button 
              onClick={onClose} 
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center text-sm transition cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Nội dung chính */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Bảng tóm tắt thông tin */}
          <div className="bg-blue-50/80 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center border-b border-blue-200/50 dark:border-blue-800/40 pb-2">
              <span className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase">Tóm tắt thông tin đặt chỗ</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-600 dark:bg-blue-500 text-white">
                Cọc: {bookingData.depositAmount?.toLocaleString('vi-VN')} VNĐ
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-blue-100 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] block flex items-center gap-1">
                  <i className="fa-solid fa-location-dot text-rose-500"></i> Chi nhánh
                </span>
                <span className="font-bold text-slate-900 dark:text-white truncate block">{bookingData.facilityName}</span>
              </div>
              <div className="bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-blue-100 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] block flex items-center gap-1">
                  <i className="fa-solid fa-box text-amber-500"></i> Mã ô kho
                </span>
                <span className="font-mono font-black text-blue-600 dark:text-blue-400 block">{bookingData.unitId}</span>
              </div>
              <div className="bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-blue-100 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] block flex items-center gap-1">
                  <i className="fa-solid fa-up-right-and-down-left-from-center text-emerald-500"></i> Diện tích
                </span>
                <span className="font-bold text-slate-900 dark:text-white block">{bookingData.unitSize}</span>
              </div>
              <div className="bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-blue-100 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] block flex items-center gap-1">
                  <i className="fa-solid fa-calendar text-indigo-500"></i> Ngày nhận kho
                </span>
                <span className="font-bold text-slate-900 dark:text-white block">{bookingData.startDate}</span>
              </div>
            </div>
          </div>

          {/* Khung Hợp đồng dự thảo (cho phép cuộn) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <i className="fa-solid fa-shield-halved text-blue-600 dark:text-blue-400"></i> Điều khoản Hợp đồng dự thảo (Cuộn để xem):
            </label>
            <div className="h-44 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-300 text-xs overflow-y-auto space-y-3 leading-relaxed shadow-inner">
              <h4 className="font-bold text-slate-900 dark:text-white text-center uppercase border-b border-slate-200 dark:border-slate-800 pb-2">HỢP ĐỒNG THỎA THUẬN GIỮ CHỖ & THUÊ KHO TỰ PHỤC VỤ (DỰ THẢO)</h4>
              <p><b>Điều 1: Mục đích Đặt cọc</b><br/>Bên thuê đồng ý đặt cọc khoản tiền nêu trên để giữ chỗ ô kho <b className="text-slate-900 dark:text-white">{bookingData.unitId}</b> tại chi nhánh {bookingData.facilityName}.</p>
              <p><b>Điều 2: Quy chế Thuê kho & An toàn (BR-12)</b><br/>- Bên thuê cam kết không lưu trữ chất cấm, chất cháy nổ.<br/>- Hệ thống IoT & CCTV giám sát 24/7. Bên thuê tự bảo quản mã PIN truy cập cổng.</p>
              <p><b>Điều 3: Chính sách Hoàn / Hủy cọc (BR-14)</b><br/>- Hủy trước 48h tính từ ngày hẹn nhận kho ({bookingData.startDate}): Hoàn 100% tiền cọc.<br/>- Hủy sau 48h hoặc không nhận kho đúng hạn: Tiền cọc không được hoàn lại.</p>
            </div>
          </div>

          {/* Hộp kiểm Clickwrap */}
          <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 dark:border-amber-500/40">
            <label className="flex items-start space-x-3 cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Tôi đã đọc, hiểu rõ và đồng ý với <span className="text-blue-700 dark:text-blue-400 font-bold underline">Quy chế thuê kho</span> và <span className="text-blue-700 dark:text-blue-400 font-bold underline">Chính sách hoàn hủy cọc (BR-12, BR-14)</span>.
              </span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-end space-x-3">
          {onClose && (
            <button 
              onClick={onClose} 
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Hủy bỏ
            </button>
          )}
          <button
            disabled={!agreed}
            onClick={onProceedToPayment}
            className={`px-6 py-3 rounded-xl font-extrabold text-xs shadow-lg transition flex items-center space-x-2 ${
              agreed
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer shadow-amber-500/20'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
            }`}
          >
            <span>XÁC NHẬN & TIẾN HÀNH THANH TOÁN CỌC</span>
            <i className="fa-solid fa-chevron-right text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
