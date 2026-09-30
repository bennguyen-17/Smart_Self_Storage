import React, { useState, useEffect } from 'react';
import { getStorageUnits, getBranches } from '../services/facilityService';

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
    const heightClass = u.size === 'S' ? 'min-h-[42px]' : u.size === 'M' ? 'min-h-[50px]' : u.size === 'L' ? 'min-h-[60px]' : 'min-h-[68px] sm:min-h-[72px]';

    return (
      <div
        key={u.id}
        onClick={() => isAvailable && onSelectUnit(isSelected ? null : u)}
        className={`proportional-unit ${cardBg} ${heightClass} p-1.5 sm:p-2 rounded-lg border shadow-xs text-center flex flex-col justify-between transition-all duration-200 cursor-pointer hover:scale-105 hover:shadow-md active:scale-95 group`}
      >
        <div className="flex justify-between items-center w-full">
          <span className="font-black text-xs sm:text-sm font-mono tracking-tight group-hover:text-blue-600 transition-colors">{shortId}</span>
          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 shadow-xs border border-slate-200 dark:border-slate-700">{u.size}</span>
        </div>
        <div className="text-[10px] sm:text-[11px] font-bold flex items-center justify-center mt-0.5">
          {statusDot}
          <span>{badgeText}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* LOCATION & FLOOR CONTROLS */}
      <div className="card-box p-3 sm:p-3.5 rounded-2xl border shadow-xs space-y-2.5 w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2.5">
          {/* CHỌN CƠ SỞ */}
          <div className="flex items-center gap-2 flex-1 min-w-[170px]">
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
                  branches.map((b) => (
                    <option
                      key={b.code || b.id}
                      value={b.code || b.id}
                      className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      {b.name || b.facilityName || facilityData[b.code]?.name || b.code}
                    </option>
                  ))
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
              <i className="fa-solid fa-layer-group text-blue-600 mr-1 text-sm"></i> Chọn Tầng:
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

        {/* THÔNG TIN ĐỊA CHỈ & TẢI TRỌNG */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm">
          <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400">
            <i className="fa-solid fa-map-pin text-blue-600 text-xs shrink-0"></i>
            <span className="font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
              {currentFacilityObj.address}
            </span>
          </div>
          <div className="flex items-center space-x-1.5 text-amber-600 font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30 shrink-0 text-xs">
            <i className="fa-solid fa-weight-hanging text-xs"></i>
            <span>
              {currentFloor === 1
                ? 'TẦNG TRỆT: Tối đa 1000 kg/m² (Kho XL Doanh Nghiệp)'
                : `TẦNG ${currentFloor - 1}: Tối đa 500 kg/m² (Kho Size S, M, L)`}
            </span>
          </div>
        </div>
      </div>

      {/* BẢNG PHÂN LOẠI 4 KÍCH THƯỚC KHO TIÊU CHUẨN */}
      <div className="card-box p-2.5 sm:p-3 rounded-2xl border shadow-xs space-y-1.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <span className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
            <i className="fa-solid fa-layer-group text-blue-600 mr-1.5"></i> BẢNG PHÂN LOẠI 4 KÍCH THƯỚC KHO TIÊU CHUẨN
          </span>
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
                30k/ngày • 600k/th
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
                60k/ngày • 1.2tr/th
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
                120k/ngày • 2.4tr/th
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
                200k/ngày • 4tr/th
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