import React, { useState } from 'react';

export default function BookingSidebar({ selectedUnit, onOpenDepositModal }) {
  const [selectedPkgDays, setSelectedPkgDays] = useState(360); // Default 12 Tháng như prototype screenshot
  const [isCustomDays, setIsCustomDays] = useState(false);
  const [customDaysVal, setCustomDaysVal] = useState('');
  // Generate local YYYY-MM-DD string helper
  const getLocalDateStr = (d: Date = new Date()) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [startDate, setStartDate] = useState(() => getLocalDateStr());


  if (!selectedUnit) {
    return (
      <div className="card-box p-5 rounded-3xl border shadow-sm space-y-4 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center">
            <i className="fa-solid fa-box-archive text-amber-500 mr-2 text-base"></i>
            THÔNG TIN CHỌN KHO
          </h3>
        </div>
        <div className="text-center py-10 space-y-3">
          <div className="w-14 h-14 inner-box rounded-2xl flex items-center justify-center mx-auto text-slate-400 text-xl border border-slate-300 dark:border-slate-800">
            <i className="fa-solid fa-hand-pointer"></i>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">Vui lòng bấm chọn một <b>ô kho còn TRỐNG</b> trên sơ đồ mặt bằng bên trái.</p>
        </div>
      </div>
    );
  }

  // Calculate check-out date
  const effectiveDays = isCustomDays ? (parseInt(customDaysVal) >= 7 ? parseInt(customDaysVal) : 7) : selectedPkgDays;

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

  const handleIncrementDays = () => {
    const current = parseInt(customDaysVal) || 7;
    setCustomDaysVal(String(current + 1));
  };

  const handleDecrementDays = () => {
    const current = parseInt(customDaysVal) || 7;
    if (current > 7) {
      setCustomDaysVal(String(current - 1));
    }
  };

  // Calculate rental cost based on package selection (Monthly rate for months, Daily rate for custom days)
  let rawRentalCost = 0;
  let discountRate = 0;

  if (selectedUnit) {
    const monthlyRate = selectedUnit.price * 20; // BR-08: Đơn giá tháng = Đơn giá ngày * 20
    if (!isCustomDays) {
      const months = selectedPkgDays / 30;
      rawRentalCost = monthlyRate * months;
      if (selectedPkgDays === 90) discountRate = 0.05;
      else if (selectedPkgDays === 180) discountRate = 0.10;
      else if (selectedPkgDays === 360) discountRate = 0.15;
    } else {
      rawRentalCost = selectedUnit.price * effectiveDays;
    }
  }

  const estimatedDiscount = rawRentalCost * discountRate;
  const estimatedTotalRental = rawRentalCost - estimatedDiscount;

  // Generate min/max dates for check-in constraint (within 7 days from today)
  const todayObj = new Date();
  const todayStr = todayObj.toISOString().split('T')[0];
  const maxCheckInObj = new Date(todayObj);
  maxCheckInObj.setDate(maxCheckInObj.getDate() + 7);
  const maxCheckInStr = maxCheckInObj.toISOString().split('T')[0];

  const formatDisplayDate = (dStr) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dStr;
  };

  // Generate 7 quick-select days options
  const checkInQuickOptions = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(todayObj);
    d.setDate(d.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const val = `${yyyy}-${mm}-${dd}`;
    const label = i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : `${dd}/${mm}`;
    return { val, label, dd, mm };
  });

  return (
    <div className="card-box p-5 rounded-3xl border shadow-sm space-y-4 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center">
          <i className="fa-solid fa-box-archive text-amber-500 mr-2 text-base"></i>
          THÔNG TIN CHỌN KHO
        </h3>
      </div>

      <div className="space-y-4">
        {/* CHI TIẾT Ô KHO */}
        <div className="inner-box p-4 rounded-2xl border border-slate-300 dark:border-slate-800 space-y-2.5 text-xs bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Mã ô kho</span>
            <span className="text-xl font-black text-amber-500 font-mono tracking-wider">{selectedUnit.id}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Kích thước sàn</span>
              <span className="font-bold text-slate-900 dark:text-white">{selectedUnit.dim}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Tải trọng tối đa</span>
              <span className="font-bold text-amber-600">{selectedUnit.weightLimit}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Đơn giá ngày:</span>
              <span className="font-bold text-blue-600">{selectedUnit.price.toLocaleString('vi-VN')}đ / ngày</span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block mt-1">Đơn giá tháng:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {(selectedUnit.monthlyPrice || selectedUnit.price * 20).toLocaleString('vi-VN')}đ / tháng
              </span>
            </div>
            <div className="text-right flex flex-col justify-between">
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Tiền cọc giữ chỗ:</span>
                <span className="font-bold text-emerald-600 text-sm">{selectedUnit.deposit.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          </div>
        </div>

        {/* GÓI THUÊ */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-900 dark:text-white">Gói thuê:</label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleSelectPackage(30)}
              className={`rental-pkg-btn text-xs py-2.5 rounded-xl text-center font-bold transition cursor-pointer border ${
                !isCustomDays && selectedPkgDays === 30
                  ? 'border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white hover:border-amber-400'
              }`}
            >
              <div>1 Tháng</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPackage(60)}
              className={`rental-pkg-btn text-xs py-2.5 rounded-xl text-center font-bold transition cursor-pointer border ${
                !isCustomDays && selectedPkgDays === 60
                  ? 'border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white hover:border-amber-400'
              }`}
            >
              <div>2 Tháng</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPackage(90)}
              className={`rental-pkg-btn text-xs py-2.5 rounded-xl text-center font-bold transition cursor-pointer border ${
                !isCustomDays && selectedPkgDays === 90
                  ? 'border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white hover:border-amber-400'
              }`}
            >
              <div>3 Tháng</div>
              <div className="text-[9px] text-emerald-600 font-extrabold">-5%</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPackage(180)}
              className={`rental-pkg-btn text-xs py-2.5 rounded-xl text-center font-bold transition cursor-pointer border ${
                !isCustomDays && selectedPkgDays === 180
                  ? 'border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white hover:border-amber-400'
              }`}
            >
              <div>6 Tháng</div>
              <div className="text-[9px] text-emerald-600 font-extrabold">-10%</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPackage(360)}
              className={`rental-pkg-btn text-xs py-2.5 rounded-xl text-center font-bold transition cursor-pointer border ${
                !isCustomDays && selectedPkgDays === 360
                  ? 'border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white hover:border-amber-400'
              }`}
            >
              <div>12 Tháng</div>
              <div className="text-[9px] text-emerald-600 font-extrabold">-15%</div>
            </button>

            <button
              type="button"
              onClick={handleToggleCustom}
              className={`rental-pkg-btn text-xs py-2.5 rounded-xl text-center font-bold transition cursor-pointer border ${
                isCustomDays
                  ? 'border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white hover:border-amber-400'
              }`}
            >
              <div>Tùy chọn</div>
            </button>
          </div>

          {isCustomDays && (
            <div className="p-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 space-y-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <i className="fa-solid fa-sliders text-amber-500 text-xs"></i> Số ngày thuê tùy chọn:
                </span>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-md">
                  Tối thiểu 7 ngày
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleDecrementDays}
                  className="w-9 h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-center font-black text-sm hover:border-amber-500 active:scale-95 transition cursor-pointer shrink-0"
                >
                  <i className="fa-solid fa-minus text-xs"></i>
                </button>
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="7"
                    value={customDaysVal}
                    onChange={(e) => setCustomDaysVal(e.target.value)}
                    className="w-full border font-black text-center text-sm py-1.5 px-3 rounded-xl outline-none bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400 font-bold pointer-events-none">
                    ngày
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleIncrementDays}
                  className="w-9 h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-center font-black text-sm hover:border-amber-500 active:scale-95 transition cursor-pointer shrink-0"
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
            <label className="block text-xs font-bold text-slate-900 dark:text-white">
              <span>Ngày nhận kho (Check-in):</span>
            </label>
            <span className="text-[10px] text-blue-600 font-bold bg-blue-500/10 px-2 py-0.5 rounded-full">
              Tối đa 7 ngày tới
            </span>
          </div>

          {/* CHỌN NGÀY BẰNG SELECT DROPDOWN CHUẨN DD/MM/YYYY */}
          <select
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border font-bold text-xs px-3 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
          >
            {Array.from({ length: 8 }, (_, i) => {
              const d = new Date(todayObj);
              d.setDate(d.getDate() + i);
              const yyyy = d.getFullYear();
              const mm = String(d.getMonth() + 1).padStart(2, '0');
              const dd = String(d.getDate()).padStart(2, '0');
              const val = `${yyyy}-${mm}-${dd}`;
              const displayLabel = `${dd}/${mm}/${yyyy}`;
              return (
                <option key={val} value={val}>
                  {displayLabel}
                </option>
              );
            })}
          </select>

          {/* THÔNG TIN HẠN TRẢ KHO & TỔNG TIỀN THUÊ */}
          <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Hạn trả kho (Check-out):</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{calculateCheckOutDate()}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Ước tính tiền thuê ({effectiveDays} ngày):</span>
              <div className="text-right">
                <span className="font-bold text-slate-900 dark:text-white">{estimatedTotalRental.toLocaleString('vi-VN')} VNĐ</span>
                {discountRate > 0 && (
                  <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    (Đã giảm {(discountRate * 100)}% gói thuê)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* NÚT THANH TOÁN */}
        <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-3">
          <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white shrink-0">Thanh toán cọc online:</span>
              <span className="text-xl sm:text-2xl font-black text-amber-500 font-mono tracking-tight shrink-0">
                {selectedUnit.deposit.toLocaleString('vi-VN')} đ
              </span>
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 border-t border-amber-500/15 pt-1.5">
              <i className="fa-solid fa-circle-info text-[10px]"></i>
              <span>Tiền thuê sẽ thanh toán sau khi Check-in nhận kho</span>
            </div>
          </div>

          <button
            onClick={() =>
              onOpenDepositModal({
                startDate: formatDisplayDate(startDate),
                endDate: calculateCheckOutDate(),
                effectiveDays,
                estimatedTotalRental
              })
            }
            className="w-full font-black text-xs py-3.5 rounded-xl shadow-md transition flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer shadow-amber-500/20 active:scale-[0.99]"
          >
            <i className="fa-solid fa-credit-card text-sm"></i>
            <span>THANH TOÁN CỌC GIỮ CHỖ KHO</span>
          </button>
        </div>
      </div>
    </div>
  );
}