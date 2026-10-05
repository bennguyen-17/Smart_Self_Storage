import React, { useState, useEffect } from 'react';
import { getStorageUnits, getBranches } from '@/features/portal/services/facilityService';

const facilityData = {
  'HN-01': { name: 'SmartStorage Cầu Giấy (HN-01)', address: 'Số 391 Cầu Giấy, P. Dịch Vọng, Q. Cầu Giấy, Hà Nội', floors: 3 },
  'HN-02': { name: 'SmartStorage Thanh Xuân (HN-02)', address: 'Số 120 Khuất Duy Tiến, Q. Thanh Xuân, Hà Nội', floors: 3 },
  'HCM-01': { name: 'SmartStorage Quận 1 (HCM-01)', address: 'Số 123 Nguyễn Huệ, Quận 1, TP.HCM', floors: 3 },
  'HCM-02': { name: 'SmartStorage Quận 7 (HCM-02)', address: 'Số 456 Nguyễn Thị Thập, Quận 7, TP.HCM', floors: 2 },
  'HCM-03': { name: 'SmartStorage Thủ Đức (HCM-03)', address: 'Số 789 Xa Lộ Hà Nội, TP. Thủ Đức, TP.HCM', floors: 3 },
  'DN-01': { name: 'SmartStorage Hải Châu (DN-01)', address: 'Số 68 Nguyễn Văn Linh, Q. Hải Châu, Đà Nẵng', floors: 2 },
  'CT-01': { name: 'SmartStorage Ninh Kiều (CT-01)', address: 'Số 12 Đại lộ Hòa Bình, Q. Ninh Kiều, Cần Thơ', floors: 2 }
};

export default function StorageMap2D({
  facility,
  onFacilityChange,
  currentFloor,
  onSelectFloor,
  selectedUnit,
  onSelectUnit,
  refreshTrigger
}: {
  facility: string;
  onFacilityChange: (fac: string) => void;
  currentFloor: number;
  onSelectFloor: (fl: number) => void;
  selectedUnit: any;
  onSelectUnit: (u: any) => void;
  refreshTrigger?: number;
}) {
  const [branches, setBranches] = useState<any[]>([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStorageType, setSelectedStorageType] = useState<'ALL' | 'STANDARD' | 'CLIMATE_CONTROLLED'>('ALL');

  // Tải danh sách chi nhánh cơ sở từ Database
  useEffect(() => {
    let isMounted = true;
    const fetchBranches = async () => {
      try {
        const res = await getBranches();
        if (isMounted && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setBranches(res.data);
        }
      } catch (e) {
        console.error('Lỗi tải danh sách cơ sở từ API:', e);
      }
    };
    fetchBranches();
    return () => {
      isMounted = false;
    };
  }, []);

  const matchedBranch = branches.find((b) => b.code === facility || b.id === facility);
  const currentFacilityObj = matchedBranch
    ? {
        name: matchedBranch.name,
        address: matchedBranch.address,
        floors: matchedBranch.floors || 3,
      }
    : (facilityData[facility] || facilityData['HN-01']);

  // Gọi API lấy danh sách ô kho theo cơ sở và tầng
  useEffect(() => {
    let isMounted = true;
    const fetchUnits = async () => {
      try {
        setLoading(true);
        const res = await getStorageUnits(facility, currentFloor);
        if (isMounted && res.success) {
          setUnits(res.data);
        }
      } catch (err) {
        console.error('Lỗi tải danh sách ô kho:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchUnits();

    const handleUpdate = () => {
      fetchUnits();
    };
    window.addEventListener('storage_units_updated', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('storage_units_updated', handleUpdate);
    };
  }, [facility, currentFloor, refreshTrigger]);


  const renderUnitCard = (u) => {
    const isSelected = selectedUnit && selectedUnit.id === u.id;
    const isOccupied = u.status === 'OCCUPIED' || u.status === 'RENTED';
    const isHold = u.status === 'HOLD';
    const isMaintenance = u.status === 'MAINTENANCE' || u.status === 'UNDER_MAINTENANCE';
    const isAvailable = !isOccupied && !isHold && !isMaintenance;

    const matchesFilter = selectedStorageType === 'ALL' || u.storageType === selectedStorageType;
    const filterClass = !matchesFilter ? 'opacity-30 scale-95 saturate-50 hover:opacity-80' : '';

    let cardBg = `unit-color-${u.size}`;
    let statusDot = <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 inline-block" />;
    let badgeText = 'Trống';

    if (isSelected) {
      cardBg = 'unit-selected ring-2 ring-amber-400 font-black shadow-md';
      statusDot = <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1 inline-block animate-ping" />;
      badgeText = 'Đang chọn';
    } else if (isHold) {
      cardBg = 'bg-amber-100 dark:bg-amber-950/40 border-amber-400 text-amber-800 dark:text-amber-200 cursor-not-allowed';
      statusDot = <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1 inline-block" />;
      badgeText = 'Đã giữ chỗ';
    } else if (isMaintenance) {
      cardBg = 'bg-slate-200 dark:bg-slate-800 border-slate-400 text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-60';
      statusDot = <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-1 inline-block" />;
      badgeText = 'Bảo trì';
    } else if (isOccupied) {
      cardBg = 'unit-occupied cursor-not-allowed opacity-60';
      statusDot = <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1 inline-block" />;
      badgeText = 'Đã thuê';
    }

    const shortId = u.id.split('-').pop();
    const heightClass = u.size === 'S' ? 'min-h-[44px]' : u.size === 'M' ? 'min-h-[52px]' : u.size === 'L' ? 'min-h-[62px]' : 'min-h-[70px] sm:min-h-[74px]';

    return (
      <div
        key={u.id}
        onClick={() => isAvailable && onSelectUnit(isSelected ? null : u)}
        className={`proportional-unit ${cardBg} ${filterClass} ${heightClass} p-1.5 sm:p-2 rounded-lg border shadow-xs text-center flex flex-col justify-between transition-all duration-200 cursor-pointer hover:scale-105 hover:shadow-md active:scale-95 group`}
      >
        <div className="flex justify-between items-center w-full">
          <span className="font-black text-xs sm:text-sm font-mono tracking-tight group-hover:text-blue-600 transition-colors flex items-center gap-1">
            {u.isClimate ? <span className="text-[10px] text-cyan-600 dark:text-cyan-400" title="Kho mát điều hòa 22-25°C">❄️</span> : null}
            {shortId}
          </span>
          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 shadow-xs border border-slate-200 dark:border-slate-700">{u.size}</span>
        </div>
        <div className="text-[10px] sm:text-[11px] font-bold flex items-center justify-between mt-0.5 px-0.5">
          <div className="flex items-center">
            {statusDot}
            <span>{badgeText}</span>
          </div>
          <span className={`text-[8px] sm:text-[9px] font-extrabold ${u.isClimate ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400'}`}>
            {u.isClimate ? '❄️ 22-25°C' : '📦 Chuẩn'}
          </span>
        </div>
      </div>
    );
  };

  const isClimateSelected = selectedStorageType === 'CLIMATE_CONTROLLED';
  const priceS = isClimateSelected ? { daily: '36k/ngày', monthly: '720k/tháng' } : { daily: '30k/ngày', monthly: '600k/tháng' };
  const priceM = isClimateSelected ? { daily: '72k/ngày', monthly: '1.44tr/tháng' } : { daily: '60k/ngày', monthly: '1.2tr/tháng' };
  const priceL = isClimateSelected ? { daily: '144k/ngày', monthly: '2.88tr/tháng' } : { daily: '120k/ngày', monthly: '2.4tr/tháng' };
  const priceXL = isClimateSelected ? { daily: '240k/ngày', monthly: '4.8tr/tháng' } : { daily: '200k/ngày', monthly: '4tr/tháng' };

  return (
    <div className="space-y-3">
      {/* BƯỚC 1: LỰA CHỌN LOẠI KHO THEO NHU CẦU LƯU TRỮ */}
      <div className="card-box p-3.5 sm:p-4 rounded-2xl border shadow-xs space-y-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
          <div className="flex items-center space-x-2.5">
            <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">1</span>
            <div>
              <h2 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                BƯỚC 1: CHỌN NHU CẦU LƯU TRỮ (LOẠI KHO)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Chọn loại kho theo đặc tính hàng hóa để hệ thống phân loại & lọc ô kho trên sơ đồ</p>
            </div>
          </div>

          <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 gap-1 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setSelectedStorageType('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedStorageType === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'
              }`}
            >
              Xem tất cả
            </button>
            <button
              type="button"
              onClick={() => setSelectedStorageType('STANDARD')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedStorageType === 'STANDARD'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'
              }`}
            >
              📦 Kho Thường
            </button>
            <button
              type="button"
              onClick={() => setSelectedStorageType('CLIMATE_CONTROLLED')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedStorageType === 'CLIMATE_CONTROLLED'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-cyan-600'
              }`}
            >
              ❄️ Kho Mát (22-25°C)
            </button>
          </div>
        </div>

        {/* 2 LỰA CHỌN KHO CARD TO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* OPTION 1: KHO TIÊU CHUẨN */}
          <div
            onClick={() => setSelectedStorageType(selectedStorageType === 'STANDARD' ? 'ALL' : 'STANDARD')}
            className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
              selectedStorageType === 'STANDARD'
                ? 'border-2 border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 shadow-sm ring-2 ring-blue-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center text-lg shrink-0">
                    📦
                  </span>
                  <div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      Kho Tiêu Chuẩn (Standard)
                      {selectedStorageType === 'STANDARD' && (
                        <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded-md font-bold">Đang lọc</span>
                      )}
                    </h3>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Đơn giá niêm yết chuẩn</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="storageTypeRadio"
                  checked={selectedStorageType === 'STANDARD'}
                  onChange={() => {}}
                  className="w-4 h-4 text-blue-600 cursor-pointer pointer-events-none"
                />
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Nhiệt độ phòng tự nhiên, hệ thống thông gió đối lưu liên tục, chống bụi và kiểm soát an toàn PCCC tiêu chuẩn.
              </p>

              <div className="flex flex-wrap gap-1 text-[10px]">
                <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                  🏠 Đồ nội thất, bàn ghế
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                  🚚 Đồ chuyển nhà
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                  📦 Hàng hóa gia dụng
                </span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">Đơn giá thuê ngày:</span>
              <span className="font-extrabold text-blue-600 dark:text-blue-400">Từ 30.000đ/ngày (600k/tháng)</span>
            </div>
          </div>

          {/* OPTION 2: KHO KIỂM SOÁT NHIỆT ĐỘ & ĐỘ ẨM */}
          <div
            onClick={() => setSelectedStorageType(selectedStorageType === 'CLIMATE_CONTROLLED' ? 'ALL' : 'CLIMATE_CONTROLLED')}
            className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
              selectedStorageType === 'CLIMATE_CONTROLLED'
                ? 'border-2 border-cyan-500 bg-cyan-50/70 dark:bg-cyan-950/40 shadow-sm ring-2 ring-cyan-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-lg shrink-0">
                    ❄️
                  </span>
                  <div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      Kho Kiểm Soát Nhiệt Độ & Độ Ẩm (22-25°C)
                      {selectedStorageType === 'CLIMATE_CONTROLLED' && (
                        <span className="text-[10px] bg-cyan-600 text-white px-1.5 py-0.2 rounded-md font-bold">Đang lọc</span>
                      )}
                    </h3>
                    <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400">+20% phụ phí điều hòa (BR-47)</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="storageTypeRadio"
                  checked={selectedStorageType === 'CLIMATE_CONTROLLED'}
                  onChange={() => {}}
                  className="w-4 h-4 text-cyan-600 cursor-pointer pointer-events-none"
                />
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Máy lạnh biến tần & máy hút ẩm công nghiệp 24/7 duy trì 22 - 25°C, độ ẩm &lt; 55% ngăn nấm mốc & chập vi mạch.
              </p>

              <div className="flex flex-wrap gap-1 text-[10px]">
                <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-cyan-200 dark:border-cyan-800 font-semibold text-cyan-700 dark:text-cyan-300">
                  💻 Đồ điện tử, linh kiện
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-cyan-200 dark:border-cyan-800 font-semibold text-cyan-700 dark:text-cyan-300">
                  📚 Tài liệu, sách quý
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-cyan-200 dark:border-cyan-800 font-semibold text-cyan-700 dark:text-cyan-300">
                  👜 Đồ da, mỹ phẩm, dược phẩm
                </span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">Đơn giá thuê ngày:</span>
              <span className="font-extrabold text-cyan-600 dark:text-cyan-400">Từ 36.000đ/ngày (720k/tháng)</span>
            </div>
          </div>
        </div>
      </div>

      {/* LOCATION & FLOOR CONTROLS */}
      <div className="card-box p-3 sm:p-3.5 rounded-2xl border shadow-xs space-y-2.5 w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2.5">
          {/* CHỌN CƠ SỞ */}
          <div className="flex items-center gap-2 flex-1 min-w-[170px] sm:max-w-[380px]">
            <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center shrink-0">
              <i className="fa-solid fa-location-dot text-rose-500 mr-1.5 text-sm"></i> Cơ sở kho:
            </span>
            <div className="relative flex-1 min-w-0">
              <select
                value={facility}
                onChange={(e) => onFacilityChange(e.target.value)}
                className="w-full text-xs sm:text-sm font-bold px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer shadow-2xs transition-colors truncate"
              >
                {branches.length > 0 ? (
                  <>
                    {/* Filter and group by city prefix */}
                    {['HN', 'HCM', 'DN', 'CT'].map((cityCode) => {
                      const cityBranches = branches.filter((b) => (b.code || b.id).startsWith(cityCode));
                      if (cityBranches.length === 0) return null;

                      const cityName = 
                        cityCode === 'HN' ? '📍 Hà Nội' : 
                        cityCode === 'HCM' ? '📍 TP. Hồ Chí Minh' : 
                        cityCode === 'DN' ? '📍 Đà Nẵng' : '📍 Cần Thơ';

                      return (
                        <optgroup key={cityCode} label={cityName}>
                          {cityBranches.map((b) => (
                            <option
                              key={b.code || b.id}
                              value={b.code || b.id}
                              className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            >
                              {b.name || b.facilityName || facilityData[b.code]?.name || b.code}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </>
                ) : (
                  <>
                    <optgroup label="📍 Hà Nội">
                      <option value="HN-01">SmartStorage Cầu Giấy (HN-01)</option>
                      <option value="HN-02">SmartStorage Thanh Xuân (HN-02)</option>
                    </optgroup>
                    <optgroup label="📍 TP. Hồ Chí Minh">
                      <option value="HCM-01">SmartStorage Quận 1 (HCM-01)</option>
                      <option value="HCM-02">SmartStorage Quận 7 (HCM-02)</option>
                      <option value="HCM-03">SmartStorage Thủ Đức (HCM-03)</option>
                    </optgroup>
                    <optgroup label="📍 Đà Nẵng">
                      <option value="DN-01">SmartStorage Hải Châu (DN-01)</option>
                    </optgroup>
                    <optgroup label="📍 Cần Thơ">
                      <option value="CT-01">SmartStorage Ninh Kiều (CT-01)</option>
                    </optgroup>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* CHỌN TẦNG */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs sm:text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center shrink-0">
              <i className="fa-solid fa-layer-group text-blue-600 mr-1.5 text-sm"></i> Chọn Tầng:
            </span>
            <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onSelectFloor(1)}
                className={`px-3 sm:px-3.5 py-1 rounded-lg text-xs font-black transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  currentFloor === 1 ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700'
                }`}
              >
                Tầng Trệt
              </button>
              <button
                type="button"
                onClick={() => onSelectFloor(2)}
                className={`px-3 sm:px-3.5 py-1 rounded-lg text-xs font-black transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  currentFloor === 2 ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700'
                }`}
              >
                Tầng 1
              </button>
              {currentFacilityObj.floors > 2 && (
                <button
                  type="button"
                  onClick={() => onSelectFloor(3)}
                  className={`px-3 sm:px-3.5 py-1 rounded-lg text-xs font-black transition-all duration-200 cursor-pointer whitespace-nowrap ${
                    currentFloor === 3 ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700'
                  }`}
                >
                  Tầng 2
                </button>
              )}
            </div>
          </div>
        </div>

        {/* THÔNG TIN ĐỊA CHỈ & TRẠNG THÁI */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm">
          <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400">
            <i className="fa-solid fa-map-pin text-blue-600 text-xs shrink-0"></i>
            <span className="font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
              {currentFacilityObj.address}
            </span>
          </div>
          
          <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/30 shrink-0 text-xs shadow-sm">
            <span className="relative flex h-2.5 w-2.5 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>
              Tầng này đang trống {units.filter(u => u.status === 'AVAILABLE').length} / {units.length} ô kho
              {selectedStorageType !== 'ALL' && (
                <span className="ml-1 text-slate-500 dark:text-slate-400">
                  ({units.filter(u => u.status === 'AVAILABLE' && u.storageType === selectedStorageType).length} ô phù hợp)
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* BẢNG PHÂN LOẠI 4 KÍCH THƯỚC KHO */}
      <div className="card-box p-2.5 sm:p-3 rounded-2xl border shadow-xs space-y-1.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          {isClimateSelected ? (
            <span className="font-black text-xs text-cyan-600 dark:text-cyan-400 uppercase tracking-wider flex items-center">
              <i className="fa-solid fa-snowflake text-cyan-500 mr-1.5"></i> BẢNG GIÁ KHO KIỂM SOÁT NHIỆT ĐỘ & ĐỘ ẨM (22-25°C) • ĐÃ GỒM +20% PHỤ PHÍ
            </span>
          ) : (
            <span className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
              <i className="fa-solid fa-layer-group text-blue-600 mr-1.5"></i> BẢNG PHÂN LOẠI 4 KÍCH THƯỚC KHO TIÊU CHUẨN
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* SIZE S */}
          <div className="p-2 rounded-xl border border-emerald-500/30 flex items-center space-x-2 bg-emerald-50/60 dark:bg-emerald-950/25 transition-transform duration-200 hover:-translate-y-0.5">
            <div className="w-8 h-8 rounded-lg border border-emerald-500 bg-emerald-500/20 flex flex-col items-center justify-center shrink-0">
              <span className="font-black text-xs text-emerald-700 dark:text-emerald-400 leading-none">S</span>
              <span className="text-[7px] font-bold text-emerald-600 dark:text-emerald-300">1m²</span>
            </div>
            <div className="text-[11px] leading-tight min-w-0">
              <div className="font-black text-slate-900 dark:text-white truncate">Size S (1m²)</div>
              <div className="text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px]">
                {priceS.daily} <br/>
                {priceS.monthly}
              </div>
              <div className="text-[9px] text-amber-600 dark:text-amber-400 font-bold">Cọc: 500k</div>
            </div>
          </div>

          {/* SIZE M */}
          <div className="p-2 rounded-xl border border-indigo-500/30 flex items-center space-x-2 bg-indigo-50/60 dark:bg-indigo-950/25 transition-transform duration-200 hover:-translate-y-0.5">
            <div className="w-8 h-8 rounded-lg border border-indigo-500 bg-indigo-500/20 flex flex-col items-center justify-center shrink-0">
              <span className="font-black text-xs text-indigo-700 dark:text-indigo-400 leading-none">M</span>
              <span className="text-[7px] font-bold text-indigo-600 dark:text-indigo-300">3m²</span>
            </div>
            <div className="text-[11px] leading-tight min-w-0">
              <div className="font-black text-slate-900 dark:text-white truncate">Size M (3m²)</div>
              <div className="text-indigo-600 dark:text-indigo-400 font-extrabold text-[10px]">
                {priceM.daily} <br/>
                {priceM.monthly}
              </div>
              <div className="text-[9px] text-amber-600 dark:text-amber-400 font-bold">Cọc: 1tr</div>
            </div>
          </div>

          {/* SIZE L */}
          <div className="p-2 rounded-xl border border-blue-500/30 flex items-center space-x-2 bg-blue-50/60 dark:bg-blue-950/25 transition-transform duration-200 hover:-translate-y-0.5">
            <div className="w-8 h-8 rounded-lg border border-blue-500 bg-blue-500/20 flex flex-col items-center justify-center shrink-0">
              <span className="font-black text-xs text-blue-700 dark:text-blue-400 leading-none">L</span>
              <span className="text-[7px] font-bold text-blue-600 dark:text-blue-300">6m²</span>
            </div>
            <div className="text-[11px] leading-tight min-w-0">
              <div className="font-black text-slate-900 dark:text-white truncate">Size L (6m²)</div>
              <div className="text-blue-600 dark:text-blue-400 font-extrabold text-[10px]">
                {priceL.daily} <br/>
                {priceL.monthly}
              </div>
              <div className="text-[9px] text-amber-600 dark:text-amber-400 font-bold">Cọc: 2tr</div>
            </div>
          </div>

          {/* SIZE XL */}
          <div className="p-2 rounded-xl border border-amber-500/30 flex items-center space-x-2 bg-amber-50/60 dark:bg-amber-950/25 transition-transform duration-200 hover:-translate-y-0.5">
            <div className="w-8 h-8 rounded-lg border border-amber-500 bg-amber-500/20 flex flex-col items-center justify-center shrink-0">
              <span className="font-black text-xs text-amber-700 dark:text-amber-400 leading-none">XL</span>
              <span className="text-[7px] font-bold text-amber-600 dark:text-amber-300">10m²</span>
            </div>
            <div className="text-[11px] leading-tight min-w-0">
              <div className="font-black text-slate-900 dark:text-white truncate">Size XL (10m²)</div>
              <div className="text-amber-600 dark:text-amber-400 font-extrabold text-[10px]">
                {priceXL.daily} <br/>
                {priceXL.monthly}
              </div>
              <div className="text-[9px] text-amber-600 dark:text-amber-400 font-bold">Cọc: 3tr</div>
            </div>
          </div>
        </div>
      </div>

      {/* SƠ ĐỒ MẶT BẰNG 2D BLUEPRINT */}
      <div className="card-box p-3 sm:p-3.5 rounded-2xl border shadow-xs space-y-2.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center space-x-2 text-xs font-black text-slate-900 dark:text-white uppercase">
            <i className="fa-solid fa-map text-blue-600 text-sm"></i>
            <span>SƠ ĐỒ MẶT BẰNG Ô KHO • {currentFloor === 1 ? 'TẦNG TRỆT' : `TẦNG ${currentFloor - 1}`}</span>
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium">Nhấp chọn ô kho trên sơ đồ</span>
        </div>

        {/* Blueprint Grid Container */}
        {loading ? (
          <div className="py-24 text-center text-xs text-slate-400">
            <i className="fa-solid fa-spinner animate-spin text-2xl mb-2 block text-blue-500"></i>
            <span>Đang tải sơ đồ mặt bằng từ máy chủ...</span>
          </div>
        ) : currentFloor === 1 ? (
          <div className="floor-blueprint-container p-3 sm:p-3.5 space-y-3 shadow-inner relative">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-900 dark:text-white uppercase">
                <span className="flex items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-2"></span> Dãy Kho Mặt Tiền (XL - 10m²)
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">5 ô kho</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5">
                {units.slice(0, 5).map((u) => renderUnitCard(u))}
              </div>
            </div>

            <div className="floor-corridor-strip">HÀNH LANG LỐI ĐI CHÍNH TRỤC XE TẢI / XE NÂNG</div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-900 dark:text-white uppercase">
                <span className="flex items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-2"></span> Dãy Kho Hậu Cần (XL - 10m²)
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">5 ô kho</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5">
                {units.slice(5, 10).map((u) => renderUnitCard(u))}
              </div>
            </div>
          </div>
        ) : (
          <div className="floor-blueprint-container p-3 sm:p-3.5 space-y-3 shadow-inner relative">
            {/* Size S Cluster */}
            {units.filter((u) => u.size === 'S').length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-900 dark:text-white uppercase">
                  <span className="flex items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2"></span> Cụm Tủ Cá Nhân S (1.0m × 1.0m)
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">{units.filter((u) => u.size === 'S').length} ô kho</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {units.filter((u) => u.size === 'S').map((u) => renderUnitCard(u))}
                </div>
              </div>
            )}

            <div className="floor-corridor-strip">HÀNH LANG LỐI ĐI NỘI BỘ 24/7</div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Size M Cluster */}
              {units.filter((u) => u.size === 'M').length > 0 && (
                <div className="md:col-span-7 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-900 dark:text-white uppercase">
                    <span className="flex items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 mr-2"></span> Khu Phòng Vừa M (1.5m × 2.0m)
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">{units.filter((u) => u.size === 'M').length} ô kho</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {units.filter((u) => u.size === 'M').map((u) => renderUnitCard(u))}
                  </div>
                </div>
              )}

              {/* Size L Cluster */}
              {units.filter((u) => u.size === 'L').length > 0 && (
                <div className="md:col-span-5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-900 dark:text-white uppercase">
                    <span className="flex items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2"></span> Khu Phòng LỚN L (2.0m × 3.0m)
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">{units.filter((u) => u.size === 'L').length} ô kho</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {units.filter((u) => u.size === 'L').map((u) => renderUnitCard(u))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}