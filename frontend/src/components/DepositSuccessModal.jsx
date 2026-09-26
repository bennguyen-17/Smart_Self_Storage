import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function DepositSuccessModal({ successData, onGoHome }) {
  const { bookingCode } = successData || {};

  // Bắn pháo hoa chúc mừng
  useEffect(() => {
    try {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (e) {}
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 text-center space-y-6 modal-animate-pop">
        
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-3xl mx-auto flex items-center justify-center shadow-lg">
          <i className="fa-solid fa-circle-check text-3xl"></i>
        </div>

        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            ĐẶT CỌC THÀNH CÔNG!
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Giao dịch cọc giữ chỗ đã được xác nhận thành công.</p>
        </div>

        {/* Thẻ hiển thị nổi bật Mã Đặt Chỗ */}
        {bookingCode && (
          <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-xl space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">MÃ ĐẶT CHỖ (BOOKING CODE)</span>
            <div className="text-3xl font-mono font-black text-amber-400 tracking-widest">{bookingCode}</div>
          </div>
        )}

        {/* Nút Hoàn tất */}
        <button
          onClick={onGoHome}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer"
        >
          <i className="fa-solid fa-circle-check text-sm"></i>
          <span>HOÀN TẤT & XEM KHO CỦA TÔI</span>
        </button>
      </div>
    </div>
  );
}