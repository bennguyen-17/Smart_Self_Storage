import React, { useState, useEffect } from 'react';
import { getStorageUnits, getBranches } from '@/features/portal/services/facilityService';

const facilityData = {
  'HN-01': { name: 'SmartStorage Cầu Giấy', address: 'Số 391 Cầu Giấy, P. Dịch Vọng, Q. Cầu Giấy, Hà Nội', floors: 3 },
  'HN-02': { name: 'SmartStorage Thanh Xuân', address: 'Số 120 Khuất Duy Tiến, Q. Thanh Xuân, Hà Nội', floors: 3 },
  'HCM-01': { name: 'SmartStorage Quận 1', address: 'Số 123 Nguyễn Huệ, Quận 1, TP.HCM', floors: 3 },
  'HCM-02': { name: 'SmartStorage Quận 7', address: 'Số 456 Nguyễn Thị Thập, Quận 7, TP.HCM', floors: 3 },
  'HCM-03': { name: 'SmartStorage Thủ Đức', address: 'Số 789 Xa Lộ Hà Nội, TP. Thủ Đức, TP.HCM', floors: 3 },
  'DN-01': { name: 'SmartStorage Hải Châu', address: 'Số 68 Nguyễn Văn Linh, Q. Hải Châu, Đà Nẵng', floors: 3 },
  'CT-01': { name: 'SmartStorage Ninh Kiều', address: 'Số 12 Đại lộ Hòa Bình, Q. Ninh Kiều, Cần Thơ', floors: 3 }
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

  // Tải danh sách chi nhánh cơ sở từ Database & lắng nghe sự kiện đồng bộ tự động
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

    // Lắng nghe sự kiện khi BOM thêm / xóa / sửa cơ sở
    const handleSync = () => {
      fetchBranches();
    };

    window.addEventListener('storage_facilities_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      isMounted = false;
      window.removeEventListener('storage_facilities_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const matchedBranch = branches.find((b) => b.code === facility || b.id === facility);
  const currentFacilityObj = matchedBranch
    ? {
        name: matchedBranch.name || matchedBranch.facilityName,
        address: matchedBranch.address,
        floors: matchedBranch.floors || 3,
        layoutType: (matchedBranch.layoutType || 'A').toUpperCase(),
      }
    : {
        ...(facilityData[facility] || facilityData['HN-01']),
        layoutType: ['HN-02', 'HCM-02', 'HCM-03', 'CT-01'].includes(facility) ? 'B' : 'A',
      };

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

  return (
    <div className="space-y-3">
      {/* THANH ĐIỀU KHIỂN: THIẾT KẾ TRÊN - DƯỚI */}
      <div className="p-3 sm:p-3.5 rounded-2xl border shadow-xs w-full bg-white dark:bg-slate-900/95 border-slate-200 dark:border-slate-800 space-y-2.5 text-slate-900 dark:text-white">
        {/* HÀNG TRÊN: CƠ SỞ KHO & ĐỊA CHỈ */}
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <span className="text-xs sm:text-sm font-black text-blue-600 dark:text-cyan-400 uppercase tracking-wide flex items-center shrink-0">
            <i className="fa-solid fa-location-dot text-blue-600 dark:text-cyan-400 mr-1.5 text-sm"></i> Cơ sở kho:
          </span>
          <div className="relative min-w-[200px] sm:min-w-[260px]">
            <select
              value={facility}
              onChange={(e) => onFacilityChange(e.target.value)}
              className="w-full text-xs sm:text-sm font-bold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-500 outline-none cursor-pointer shadow-2xs transition-colors truncate"
            >
              {branches.length > 0 ? (
                <>
                  {['HN', 'HCM', 'DN', 'CT', 'HP', 'BD'].map((cityCode) => {
                    const cityBranches = branches.filter((b) => (b.code || b.id || '').toUpperCase().startsWith(cityCode));
                    if (cityBranches.length === 0) return null;

                    const cityName = 
                      cityCode === 'HN' ? '📍 Hà Nội' : 
                      cityCode === 'HCM' ? '📍 TP. Hồ Chí Minh' : 
                      cityCode === 'DN' ? '📍 Đà Nẵng' : 
                      cityCode === 'CT' ? '📍 Cần Thơ' : 
                      cityCode === 'HP' ? '📍 Hải Phòng' : '📍 Bình Dương';

                    return (
                      <optgroup key={cityCode} label={cityName} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        {cityBranches.map((b) => {
                          const raw = b.name || b.facilityName || facilityData[b.code]?.name || b.code;
                          const clean = raw.replace(/\s*\([A-Z0-9-]+\)\s*$/, '').trim();
                          return (
                            <option
                              key={b.code || b.id}
                              value={b.code || b.id}
                              className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            >
                              {clean}
                            </option>
                          );
                        })}
                      </optgroup>
                    );
                  })}

                  {/* Nhóm chi nhánh mở rộng / khu vực khác */}
                  {(() => {
                    const otherBranches = branches.filter((b) => {
                      const c = (b.code || b.id || '').toUpperCase();
                      return !c.startsWith('HN') && !c.startsWith('HCM') && !c.startsWith('DN') && !c.startsWith('CT') && !c.startsWith('HP') && !c.startsWith('BD');
                    });
                    if (otherBranches.length === 0) return null;
                    return (
                      <optgroup label="📍 Khu vực khác" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        {otherBranches.map((b) => {
                          const raw = b.name || b.facilityName || b.code;
                          const clean = raw.replace(/\s*\([A-Z0-9-]+\)\s*$/, '').trim();
                          return (
                            <option
                              key={b.code || b.id}
                              value={b.code || b.id}
                              className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            >
                              {clean}
                            </option>
                          );
                        })}
                      </optgroup>
                    );
                  })()}
                </>
              ) : (
                <>
                  <optgroup label="📍 Hà Nội" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    <option value="HN-01" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">SmartStorage Cầu Giấy</option>
                    <option value="HN-02" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">SmartStorage Thanh Xuân</option>
                  </optgroup>
                  <optgroup label="📍 TP. Hồ Chí Minh" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    <option value="HCM-01" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">SmartStorage Quận 1</option>
                    <option value="HCM-02" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">SmartStorage Quận 7</option>
                    <option value="HCM-03" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">SmartStorage Thủ Đức</option>
                  </optgroup>
                  <optgroup label="📍 Đà Nẵng" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    <option value="DN-01" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">SmartStorage Hải Châu</option>
                  </optgroup>
                  <optgroup label="📍 Cần Thơ" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    <option value="CT-01" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">SmartStorage Ninh Kiều</option>
                  </optgroup>
                </>
              )}
            </select>
          </div>

          {/* ĐỊA CHỈ */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 max-w-full">
            <i className="fa-solid fa-map-pin text-blue-600 dark:text-cyan-400 text-xs shrink-0"></i>
            <span className="font-semibold truncate max-w-[300px] sm:max-w-[500px]" title={currentFacilityObj.address}>
              {currentFacilityObj.address}
            </span>
          </div>
        </div>

        {/* DÒNG 2: LOẠI KHO */}
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <span className="text-xs sm:text-sm font-black text-blue-600 dark:text-cyan-400 uppercase tracking-wide flex items-center shrink-0 min-w-[90px]">
            <i className="fa-solid fa-snowflake text-blue-600 dark:text-cyan-400 mr-1.5 text-xs"></i> Loại kho:
          </span>
          <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedStorageType('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedStorageType === 'ALL'
                  ? 'bg-blue-600 dark:bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setSelectedStorageType('STANDARD')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedStorageType === 'STANDARD'
                  ? 'bg-blue-600 dark:bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700'
              }`}
            >
              📦 Thường
            </button>
            <button
              type="button"
              onClick={() => setSelectedStorageType('CLIMATE_CONTROLLED')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedStorageType === 'CLIMATE_CONTROLLED'
                  ? 'bg-blue-600 dark:bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700'
              }`}
            >
              ❄️ Mát (22-25°C)
            </button>
          </div>
        </div>

        {/* DÒNG 3: TẦNG */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs sm:text-sm font-black text-blue-600 dark:text-cyan-400 uppercase tracking-wide flex items-center shrink-0 min-w-[90px]">
            <i className="fa-solid fa-layer-group text-blue-600 dark:text-cyan-400 mr-1.5 text-xs"></i> Tầng:
          </span>
          <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onSelectFloor(1)}
              className={`px-3.5 py-1 rounded-lg text-xs font-black transition-all duration-200 cursor-pointer whitespace-nowrap ${
                currentFloor === 1 ? 'bg-blue-600 dark:bg-cyan-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700'
              }`}
            >
              Tầng Trệt
            </button>
            <button
              type="button"
              onClick={() => onSelectFloor(2)}
              className={`px-3.5 py-1 rounded-lg text-xs font-black transition-all duration-200 cursor-pointer whitespace-nowrap ${
                currentFloor === 2 ? 'bg-blue-600 dark:bg-cyan-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700'
              }`}
            >
              Tầng 1
            </button>
            {currentFacilityObj.floors > 2 && (
              <button
                type="button"
                onClick={() => onSelectFloor(3)}
                className={`px-3.5 py-1 rounded-lg text-xs font-black transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  currentFloor === 3 ? 'bg-blue-600 dark:bg-cyan-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700'
                }`}
              >
                Tầng 2
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SƠ ĐỒ MẶT BẰNG 2D BLUEPRINT */}
      <div className="p-3 sm:p-3.5 rounded-2xl border shadow-xs space-y-2.5 bg-white dark:bg-slate-900/95 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 gap-2">
          <div className="flex items-center space-x-2 text-xs font-black text-blue-600 dark:text-cyan-400 uppercase tracking-wide">
            <i className="fa-solid fa-map text-blue-600 dark:text-cyan-400 text-sm"></i>
            <span>SƠ ĐỒ MẶT BẰNG Ô KHO • {currentFloor === 1 ? 'TẦNG TRỆT' : `TẦNG ${currentFloor - 1}`}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              currentFacilityObj.layoutType === 'B'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                : 'bg-blue-500/10 text-blue-600 dark:text-cyan-400 border-blue-500/30'
            }`}>
              {currentFacilityObj.layoutType === 'B' ? 'Mô hình Layout B (15 ô kho)' : 'Mô hình Layout A (46 ô kho)'}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
              {units.length} ô kho tầng này
            </span>
          </div>
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
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">{Math.min(units.length, 5)} ô kho</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5">
                {units.slice(0, 5).map((u) => renderUnitCard(u))}
              </div>
            </div>

            {units.length > 5 && (
              <>
                <div className="floor-corridor-strip">HÀNH LANG LỐI ĐI CHÍNH TRỤC XE TẢI / XE NÂNG</div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-900 dark:text-white uppercase">
                    <span className="flex items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-2"></span> Dãy Kho Hậu Cần (XL - 10m²)
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">{units.length - 5} ô kho</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5">
                    {units.slice(5, 10).map((u) => renderUnitCard(u))}
                  </div>
                </div>
              </>
            )}
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