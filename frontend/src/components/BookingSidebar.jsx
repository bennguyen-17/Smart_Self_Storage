import React, { useState, useEffect } from 'react';

export default function BookingSidebar({ selectedUnit, onOpenDepositModal }) {
  const [selectedPkgDays, setSelectedPkgDays] = useState(360); // Default 12 Tháng như prototype screenshot
  const [isCustomDays, setIsCustomDays] = useState(false);
  const [customDaysVal, setCustomDaysVal] = useState('');
  const [startDate, setStartDate] = useState('');

  // Initialize start date to today formatted as YYYY-MM-DD
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
  }, []);

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
    if (!customDaysVal) setCustomDaysVal('14');
  };

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
        <div className="inner-box p-4 rounded-2xl border border-slate-300 dark:border-slate-800 space-y-2 text-xs bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex justify-between items-baseline border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Mã ô kho:</span>
            <span className="text-2xl font-black text-amber-600 font-mono tracking-wider">{selectedUnit.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Vị trí & Tải trọng:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              <span>{selectedUnit.floorName}</span> • <span className="text-amber-600">{selectedUnit.weightLimit}</span>
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Kích thước sàn:</span>
            <b className="text-slate-900 dark:text-white">{selectedUnit.dim}</b>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Đơn giá ngày:</span>
            <b className="text-blue-600">{selectedUnit.price.toLocaleString('vi-VN')}đ / ngày</b>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Tiền cọc giữ chỗ:</span>
            <b className="text-emerald-600">{selectedUnit.deposit.toLocaleString('vi-VN')}đ</b>
          </div>
        </div>

        {/* GÓI THUÊ */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-900 dark:text-white">Gói thuê:</label>
            {isCustomDays && (
              <span className="text-[10px] text-amber-600 font-extrabold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                (Tối thiểu 7 ngày)
              </span>
            )}
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
                  ? 'border-2 border-amber-500 bg-amber-50 dark:bg-slate-50 text-amber-700 dark:text-amber-900 shadow-sm'
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
                  ? 'border-2 border-amber-500 bg-amber-50 dark:bg-slate-50 text-amber-700 dark:text-amber-900 shadow-sm'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white hover:border-amber-400'
              }`}
            >
              <div>Tùy chọn</div>
            </button>
          </div>

          {isCustomDays && (
            <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800 mt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="7"
                  value={customDaysVal}
                  onChange={(e) => setCustomDaysVal(e.target.value)}
                  placeholder="Nhập số ngày (vd: 14, 45...)"
                  className="w-full border font-bold text-xs px-3 py-2 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
                <span className="text-xs text-slate-500 font-bold whitespace-nowrap">ngày</span>
              </div>
            </div>
          )}
        </div>

        {/* NGÀY BẮT ĐẦU CHECK-IN */}
        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-900 dark:text-white">
              <span>Ngày bắt đầu nhận kho (Check-in):</span>
            </label>
            <span className="text-[10px] text-blue-600 font-extrabold bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
              Tối đa 7 ngày
            </span>
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border font-bold text-xs px-3 py-2 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
          />
          <div className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs bg-blue-50/50 dark:bg-blue-950/20">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Hạn trả kho (Check-out):</span>
            <span className="font-black text-blue-600 dark:text-blue-400">{calculateCheckOutDate()}</span>
          </div>
        </div>

        {/* NÚT THANH TOÁN */}
        <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-3">
          <div className="flex justify-between items-baseline text-xs">
            <div>
              <span className="text-slate-900 dark:text-white font-bold block">Tiền cọc giữ chỗ:</span>
              <span className="text-[10px] text-emerald-600 font-bold">(Tiền thuê thanh toán khi Check-in)</span>
            </div>
            <span className="text-xl sm:text-2xl font-black text-amber-600">{selectedUnit.deposit.toLocaleString('vi-VN')} VNĐ</span>
          </div>

          <button
            onClick={onOpenDepositModal}
            className="w-full font-black text-xs py-3.5 rounded-xl shadow-md transition flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer shadow-amber-500/20"
          >
            <i className="fa-solid fa-credit-card text-sm"></i>
            <span>THANH TOÁN CỌC GIỮ CHỖ KHO</span>
          </button>
        </div>
      </div>
    </div>
  );
}