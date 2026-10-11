import React, { useState } from 'react';
import {
  calcRentalTotal,
  clampRentalDays,
  getCheckInDates,
  MAX_CUSTOM_DAYS,
  MIN_CUSTOM_DAYS,
} from '@/features/portal/lib/bookingRules';

export default function BookingSidebar({ selectedUnit, onOpenDepositModal }) {
  const [selectedPkgDays, setSelectedPkgDays] = useState(30); // Mặc định 1 Tháng (30 ngày)
  const [isCustomDays, setIsCustomDays] = useState(false);
  const [customDaysVal, setCustomDaysVal] = useState('');
  // BR-17: ngày Check-in hợp lệ từ Hôm nay+1 đến Hôm nay+7 (giờ VN). Mặc định chọn ngày sớm nhất.
  const [startDate, setStartDate] = useState(() => getCheckInDates(new Date())[0]);


  if (!selectedUnit) {
    return (
      <div className="card-box p-3.5 sm:p-4 rounded-2xl border shadow-xs space-y-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 h-full flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
            <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center tracking-wider">
              <i className="fa-solid fa-box-archive text-amber-500 mr-2 text-sm"></i>
              THÔNG TIN ĐẶT THUÊ KHO
            </h3>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
              Chưa chọn ô
            </span>
          </div>

          <div className="text-center py-3 space-y-1.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto text-base border border-amber-500/20 shadow-xs">
              <i className="fa-solid fa-hand-pointer"></i>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Bấm chọn một ô kho còn TRỐNG</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Chọn ô kho có viền màu xanh lá trên sơ đồ bên trái để xem chi tiết & báo giá.</p>
            </div>
          </div>

          {/* HƯỚNG DẪN 4 BƯỚC ĐẶT KHO */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Quy trình thuê kho 4 bước:
            </span>
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <span className="w-5 h-5 rounded-lg bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">1</span>
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Chọn nhu cầu: Kho thường hoặc Kho mát (22-25°C)</span>
              </div>
              <div className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <span className="w-5 h-5 rounded-lg bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">2</span>
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Chọn ô kho phù hợp diện tích & tầng</span>
              </div>
              <div className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <span className="w-5 h-5 rounded-lg bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">3</span>
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Chọn thời hạn thuê từ 1 đến 12 tháng</span>
              </div>
              <div className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <span className="w-5 h-5 rounded-lg bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">4</span>
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Quét mã VietQR cọc giữ chỗ tức thì</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate check-out date
  // BR-13: thuê theo ngày từ 7 đến 29 ngày
  const effectiveDays = isCustomDays ? clampRentalDays(customDaysVal) : selectedPkgDays;

  const calculateCheckOutDate = () => {
    if (!startDate) return '';
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return '';
    const end = new Date(start);
    end.setDate(end.getDate() + effectiveDays);
    const endD = String(end.getDate()).padStart(2, '0');
    const endM = String(end.getMonth() + 1).padStart(2, '0');
    const endY = end.getFullYear();
    return `${endD}/${endM}/${endY} (${effectiveDays} ngày)`;
  };

  const handleSelectPackage = (days) => {
    setIsCustomDays(false);
    setSelectedPkgDays(days);
  };

  const handleToggleCustom = () => {
    setIsCustomDays(true);
    if (!customDaysVal) setCustomDaysVal('7');
  };

  // Luôn ghi lại giá trị đã ép về 7–29, để ô nhập không bao giờ hiện số khác với số ngày dùng tính tiền
  const handleIncrementDays = () => {
    setCustomDaysVal(String(clampRentalDays(String(clampRentalDays(customDaysVal) + 1))));
  };

  const handleDecrementDays = () => {
    setCustomDaysVal(String(clampRentalDays(String(clampRentalDays(customDaysVal) - 1))));
  };

  // BR-13: tiền thuê ước tính theo gói tháng (có chiết khấu) hoặc theo ngày lẻ.
  // Giá tháng lấy từ dữ liệu ô kho; thiếu thì dùng giá ngày × 20 như hiển thị phía trên.
  const rental = calcRentalTotal({
    dailyPrice: selectedUnit.price,
    monthlyPrice: selectedUnit.monthlyPrice || selectedUnit.price * 20,
    days: effectiveDays,
  });
  const discountRate = rental.discountRate;
  const estimatedTotalRental = rental.total;

  const checkInDates = getCheckInDates(new Date());

  const formatDisplayDate = (dStr) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dStr;
  };

  return (
    <div className="card-box p-3.5 sm:p-4 rounded-2xl border shadow-xs space-y-3.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
        <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center tracking-wider">
          <i className="fa-solid fa-box-archive text-amber-500 mr-2 text-sm"></i>
          THÔNG TIN ĐẶT THUÊ KHO
        </h3>
      </div>

      <div className="space-y-2.5">
        {/* CHI TIẾT Ô KHO */}
        <div className="inner-box p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5 bg-slate-50/80 dark:bg-slate-800/60 shadow-xs">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-1">
            <span className="text-slate-600 dark:text-slate-400 font-bold text-xs">Mã ô kho đã chọn</span>
            <span className="text-base font-black text-amber-500 font-mono tracking-wider">{selectedUnit.id}</span>
          </div>

          {/* LOẠI KHO BADGE */}
          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] font-semibold">Loại kho:</span>
            {selectedUnit.isClimate ? (
              <span className="text-[10px] font-extrabold text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-300 dark:border-cyan-800 flex items-center gap-1">
                <i className="fa-solid fa-snowflake text-[9px]"></i> Kho Mát (22-25°C)
              </span>
            ) : (
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-600 flex items-center gap-1">
                <i className="fa-solid fa-box text-[9px]"></i> Kho Tiêu Chuẩn
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[10px] block font-semibold">Kích thước sàn</span>
              <span className="font-black text-slate-900 dark:text-white text-xs">{selectedUnit.dim}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 dark:text-slate-400 text-[10px] block font-semibold">Tải trọng tối đa</span>
              <span className="font-black text-amber-600 text-xs">{selectedUnit.weightLimit}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[10px] block font-semibold">Đơn giá ngày:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400 text-[11px]">{selectedUnit.price.toLocaleString('vi-VN')}đ/ngày</span>
              {selectedUnit.isClimate && (
                <span className="text-[9px] text-cyan-600 dark:text-cyan-400 font-bold block">(+20% phụ phí điều hòa)</span>
              )}
              <span className="text-slate-500 dark:text-slate-400 text-[10px] block mt-0.5 font-semibold">Đơn giá tháng:</span>
              <span className="font-black text-indigo-600 dark:text-indigo-400 text-[11px]">
                {(selectedUnit.monthlyPrice || selectedUnit.price * 20).toLocaleString('vi-VN')}đ/tháng
              </span>
            </div>
            <div className="text-right flex flex-col justify-between">
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[10px] block font-semibold">Tiền cọc giữ chỗ:</span>
                <span className="font-black text-emerald-600 text-xs sm:text-sm">{selectedUnit.deposit.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          </div>
        </div>

        {/* GÓI THUÊ */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">Thời hạn thuê kho:</label>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleSelectPackage(30)}
              className={`rental-pkg-btn text-xs py-1.5 rounded-lg text-center font-bold transition-all cursor-pointer border ${
                !isCustomDays && selectedPkgDays === 30
                  ? 'border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white hover:border-amber-400'
              }`}
            >
              <div>1 Tháng</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPackage(60)}
              className={`rental-pkg-btn text-xs py-1.5 rounded-lg text-center font-bold transition-all cursor-pointer border ${
                !isCustomDays && selectedPkgDays === 60
                  ? 'border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white hover:border-amber-400'
              }`}
            >
              <div>2 Tháng</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPackage(90)}
              className={`rental-pkg-btn text-xs py-1.5 rounded-lg text-center font-bold transition-all cursor-pointer border ${
                !isCustomDays && selectedPkgDays === 90
                  ? 'border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white hover:border-amber-400'
              }`}
            >
              <div>3 Tháng</div>
              <div className="text-[8px] text-emerald-600 dark:text-emerald-400 font-black">-5%</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPackage(180)}
              className={`rental-pkg-btn text-xs py-1.5 rounded-lg text-center font-bold transition-all cursor-pointer border ${
                !isCustomDays && selectedPkgDays === 180
                  ? 'border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white hover:border-amber-400'
              }`}
            >
              <div>6 Tháng</div>
              <div className="text-[8px] text-emerald-600 dark:text-emerald-400 font-black">-10%</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPackage(360)}
              className={`rental-pkg-btn text-xs py-1.5 rounded-lg text-center font-bold transition-all cursor-pointer border ${
                !isCustomDays && selectedPkgDays === 360
                  ? 'border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white hover:border-amber-400'
              }`}
            >
              <div>12 Tháng</div>
              <div className="text-[8px] text-emerald-600 dark:text-emerald-400 font-black">-15%</div>
            </button>

            <button
              type="button"
              onClick={handleToggleCustom}
              className={`rental-pkg-btn text-xs py-1.5 rounded-lg text-center font-bold transition-all cursor-pointer border ${
                isCustomDays
                  ? 'border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white hover:border-amber-400'
              }`}
            >
              <div>Tùy chọn</div>
            </button>
          </div>

          {isCustomDays && (
            <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 space-y-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <i className="fa-solid fa-sliders text-amber-500 text-xs"></i> Số ngày thuê tùy chọn:
                </span>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-md">
                  Từ {MIN_CUSTOM_DAYS} đến {MAX_CUSTOM_DAYS} ngày
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleDecrementDays}
                  className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-center font-black text-sm hover:border-amber-500 active:scale-95 transition cursor-pointer shrink-0"
                >
                  <i className="fa-solid fa-minus text-xs"></i>
                </button>
                <div className="relative flex-1">
                  <input
                    type="number"
                    min={MIN_CUSTOM_DAYS}
                    max={MAX_CUSTOM_DAYS}
                    aria-label="Số ngày thuê tùy chọn"
                    value={customDaysVal}
                    onChange={(e) => setCustomDaysVal(e.target.value)}
                    onBlur={() => setCustomDaysVal(String(clampRentalDays(customDaysVal)))}
                    className="w-full border font-black text-center text-sm py-1 px-2.5 rounded-lg outline-none bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400 font-bold pointer-events-none">
                    ngày
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleIncrementDays}
                  className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-center font-black text-sm hover:border-amber-500 active:scale-95 transition cursor-pointer shrink-0"
                >
                  <i className="fa-solid fa-plus text-xs"></i>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* NGÀY BẮT ĐẦU CHECK-IN & ƯỚC TÍNH CHI PHÍ THUÊ */}
        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">
              <span>Ngày nhận kho (Check-in):</span>
            </label>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-full">
              Từ ngày mai, tối đa 7 ngày
            </span>
          </div>

          {/* CHỌN NGÀY BẰNG SELECT DROPDOWN CHUẨN DD/MM/YYYY */}
          <select
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            aria-label="Ngày nhận kho (Check-in)"
            className="w-full border font-bold text-xs px-2.5 py-1.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer shadow-xs"
          >
            {checkInDates.map((val) => (
              <option key={val} value={val}>
                {formatDisplayDate(val)}
              </option>
            ))}
          </select>

          {/* THÔNG TIN HẠN TRẢ KHO & TỔNG TIỀN THUÊ */}
          <div className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 text-xs bg-slate-50/60 dark:bg-slate-800/40">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Hạn trả kho:</span>
              <span className="font-black text-blue-600 dark:text-blue-400">{calculateCheckOutDate()}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-800 text-[11px]">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Tiền thuê ({effectiveDays} ngày):</span>
              <div className="text-right">
                <span className="font-black text-slate-900 dark:text-white">{estimatedTotalRental.toLocaleString('vi-VN')} đ</span>
                {discountRate > 0 && (
                  <span className="block text-[9px] text-emerald-600 dark:text-emerald-400 font-black">
                    (Đã giảm {(discountRate * 100)}%)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* NÚT THANH TOÁN */}
        <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-2">
          <div className="p-2 rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 space-y-0.5 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black text-slate-900 dark:text-white shrink-0">Thanh toán cọc online:</span>
              <span className="text-base sm:text-lg font-black text-amber-500 font-mono tracking-tight shrink-0">
                {selectedUnit.deposit.toLocaleString('vi-VN')} đ
              </span>
            </div>
            <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 border-t border-amber-500/15 pt-0.5">
              <i className="fa-solid fa-circle-check text-[9px]"></i>
              <span>Tiền thuê sẽ thanh toán sau khi Check-in nhận kho</span>
            </div>
          </div>

          <button
            onClick={() =>
              onOpenDepositModal({
                startDate: formatDisplayDate(startDate),
                endDate: calculateCheckOutDate(),
                effectiveDays,
                estimatedTotalRental,
                storageType: selectedUnit.storageType || (selectedUnit.isClimate ? 'CLIMATE_CONTROLLED' : 'STANDARD'),
                typeLabel: selectedUnit.typeLabel || (selectedUnit.isClimate ? 'Kho Mát Điều Hòa (22-25°C)' : 'Kho Tiêu Chuẩn'),
                isClimate: selectedUnit.isClimate
              })
            }
            className="w-full font-black text-xs py-2 rounded-xl shadow-md transition-all duration-200 flex items-center justify-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer shadow-amber-500/25 active:scale-[0.98]"
          >
            <i className="fa-solid fa-credit-card text-xs"></i>
            <span>THANH TOÁN CỌC GIỮ CHỖ KHO</span>
          </button>
        </div>
      </div>
    </div>
  );
}