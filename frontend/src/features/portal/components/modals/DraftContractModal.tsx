import React, { useState } from 'react';

export default function DraftContractModal({ bookingData, onProceedToPayment, onClose, isLoading }: { bookingData: any; onProceedToPayment: () => void; onClose?: () => void; isLoading?: boolean }) {
  // US-07: bắt buộc tích đủ 2 xác nhận mới được thanh toán cọc
  // (1) cam kết không lưu trữ hàng cấm (BR-09), (2) đồng ý điều khoản hợp đồng clickwrap (BR-18)
  const [noProhibitedGoods, setNoProhibitedGoods] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const canProceed = noProhibitedGoods && agreed;

  // Lay ngay check-out nguyen ban khong co chu (xx ngay)
  const displayEndDate = bookingData.endDate ? bookingData.endDate.split(' ')[0] : 'Chưa xác định';

  const handleConfirmClick = () => {
    if (canProceed && onProceedToPayment && !isLoading) {
      onProceedToPayment();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] modal-animate-pop">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/90">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
              <i className="fa-solid fa-file-signature text-amber-500"></i>
              <span>Thỏa thuận đặt cọc kho</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Vui lòng xem lại thông tin giữ chỗ và các quy định trước khi tiến hành thanh toán
            </p>
          </div>
          {onClose && (
            <button 
              onClick={onClose} 
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-sm transition cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Nội dung chính */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Thông tin thuê kho */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200 dark:border-slate-700/60">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <i className="fa-solid fa-box-archive text-amber-500"></i> Thông tin ô kho
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400">
                  Chi nhánh: <strong className="text-slate-900 dark:text-white">{bookingData.facilityName}</strong>
                </span>
                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${bookingData.isClimate ? 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'}`}>
                  {bookingData.isClimate ? '❄️ Kho Mát (22-25°C)' : '📦 Kho Tiêu Chuẩn'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-white dark:bg-slate-800/80 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/70">
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block whitespace-nowrap">Mã kho</span>
                <span className="font-mono font-bold text-amber-500 text-sm block mt-0.5">{bookingData.unitId}</span>
              </div>

              <div className="bg-white dark:bg-slate-800/80 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/70">
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block whitespace-nowrap">Ngày nhận (Check-in)</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400 block mt-0.5">{bookingData.startDate}</span>
              </div>

              <div className="bg-white dark:bg-slate-800/80 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/70">
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block whitespace-nowrap">Hạn trả (Check-out)</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400 block mt-0.5">{displayEndDate}</span>
              </div>

              <div className="bg-white dark:bg-slate-800/80 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/70">
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block whitespace-nowrap">Ước tính tiền thuê</span>
                <span className="font-semibold text-slate-900 dark:text-white block mt-0.5">
                  {bookingData.estimatedTotalRental ? `${bookingData.estimatedTotalRental.toLocaleString('vi-VN')} đ` : 'Chưa tính'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700/60 text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300">Tiền cọc giữ chỗ:</span>
              <span className="text-lg font-mono font-bold text-amber-500">
                {bookingData.depositAmount?.toLocaleString('vi-VN')} VNĐ
              </span>
            </div>
          </div>

          {/* Điều khoản thỏa thuận */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <i className="fa-solid fa-file-shield text-blue-500"></i> Điều khoản thuê & Quy định hủy cọc:
            </label>

            <div className="h-44 border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-300 text-xs overflow-y-auto space-y-3 leading-relaxed border-slate-200 dark:border-slate-800 focus:outline-none [scrollbar-color:rgba(148,163,184,0.3)_transparent] [scrollbar-width:thin]">
              <p className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1.5">
                Các điều khoản chính khi đặt giữ chỗ kho
              </p>

              <p>
                <strong>1. Mục đích cọc giữ chỗ:</strong> Khoản tiền cọc dùng để bảo lưu ô kho <strong>{bookingData.unitId}</strong> ({bookingData.isClimate ? 'Kho Mát Kiểm Soát Nhiệt Độ 22-25°C' : 'Kho Tiêu Chuẩn'}) tại chi nhánh {bookingData.facilityName} cho bạn kể từ ngày nhận kho <strong>{bookingData.startDate}</strong>.
              </p>

              <div className="space-y-1">
                <strong className="text-slate-900 dark:text-white block">2. Chính sách hủy cọc & Hoàn tiền:</strong>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Hủy trước ngày nhận kho từ 4 ngày trở lên: Bạn được hoàn lại 100% tiền cọc.</li>
                  <li>Hủy trước ngày nhận kho dưới 4 ngày: Bạn bị tính phí phạt 50% tiền cọc và nhận lại 50% còn lại.</li>
                  <li>Quy trình hoàn tiền: Yêu cầu hoàn cọc được bộ phận Back-office đối soát và chuyển khoản trong vòng 24 - 48 giờ làm việc, kèm biên lai xác nhận gửi qua email (BR-35).</li>
                </ul>
              </div>

              <div className="space-y-1">
                <strong className="text-slate-900 dark:text-white block">3. Quy định nhận kho và không đến nhận:</strong>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Giờ nhận kho tiêu chuẩn diễn ra từ 08:00 đến 20:00 trong ngày hẹn check-in ({bookingData.startDate}).</li>
                  <li>Nếu sau 00:00 ngày tiếp theo bạn không đến nhận kho và không liên hệ xin gia hạn, hệ thống sẽ tự động hủy lịch đặt và không hoàn lại tiền cọc.</li>
                </ul>
              </div>

              <p>
                <strong>4. Quy định an toàn:</strong> Không lưu trữ hàng cấm, chất dễ cháy nổ, thực phẩm tươi sống hoặc hàng hóa vi phạm pháp luật. Khách hàng chịu trách nhiệm bảo mật mã PIN cá nhân để truy cập kho.
              </p>
            </div>
          </div>

          {/* Đồng ý điều khoản: 2 xác nhận bắt buộc (US-07) */}
          <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 space-y-2.5">
            <label className="flex items-start space-x-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={noProhibitedGoods}
                onChange={(e) => setNoProhibitedGoods(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer accent-amber-500"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 leading-normal">
                Tôi cam kết không lưu trữ hàng cấm: thực phẩm tươi sống/đông lạnh, động vật sống, chất dễ cháy nổ, hóa chất độc hại, vũ khí và hàng hóa vi phạm pháp luật.
              </span>
            </label>
            <label className="flex items-start space-x-2.5 cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer accent-amber-500"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 leading-normal">
                Tôi đã đọc và đồng ý với các điều khoản thuê kho, quy định hoàn hủy cọc và thời gian nhận kho nêu trên.
              </span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-end space-x-3">
          {onClose && (
            <button 
              onClick={onClose} 
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Hủy
            </button>
          )}
          <button
            type="button"
            disabled={!canProceed || isLoading}
            onClick={handleConfirmClick}
            className={`px-5 py-2.5 rounded-lg font-bold text-xs transition flex items-center gap-2 ${
              canProceed && !isLoading
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer shadow-sm active:scale-95'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
            }`}
          >
            {isLoading && <i className="fa-solid fa-spinner animate-spin"></i>}
            <span>{isLoading ? 'Đang khởi tạo mã cọc...' : 'Xác nhận & Thanh toán cọc'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}




