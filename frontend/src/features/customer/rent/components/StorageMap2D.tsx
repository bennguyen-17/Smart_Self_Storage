import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, Check, Copy, MapPin, Snowflake, Layers, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { getStorageUnits, getBranches } from '../rentApi';

export const facilityData: Record<string, {
  name: string;
  address: string;
  floors: number;
  city: string;
  image: string;
  layoutType?: string;
}> = {
  HN01: {
    name: 'SmartStorage Cầu Giấy (HN01)',
    address: 'Số 391 Cầu Giấy, P. Dịch Vọng, Q. Cầu Giấy, Hà Nội',
    floors: 3,
    city: 'Hà Nội',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
  },
  HN02: {
    name: 'SmartStorage Thanh Xuân (HN02)',
    address: 'Số 120 Khuất Duy Tiến, Q. Thanh Xuân, Hà Nội',
    floors: 3,
    city: 'Hà Nội',
    image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=600&q=80',
  },
  HCM01: {
    name: 'SmartStorage Quận 1 (HCM01)',
    address: 'Số 123 Nguyễn Huệ, Quận 1, TP.HCM',
    floors: 3,
    city: 'TP.HCM',
    image: 'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?auto=format&fit=crop&w=600&q=80',
  },
  HCM02: {
    name: 'SmartStorage Quận 7 (HCM02)',
    address: 'Số 456 Nguyễn Thị Thập, Quận 7, TP.HCM',
    floors: 2,
    city: 'TP.HCM',
    image: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=600&q=80',
  },
  HCM03: {
    name: 'SmartStorage Thủ Đức (HCM03)',
    address: 'Số 789 Xa Lộ Hà Nội, TP. Thủ Đức, TP.HCM',
    floors: 3,
    city: 'TP.HCM',
    image: 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=600&q=80',
  },
  DN01: {
    name: 'SmartStorage Hải Châu (DN01)',
    address: 'Số 68 Nguyễn Văn Linh, Q. Hải Châu, Đà Nẵng',
    floors: 2,
    city: 'Đà Nẵng',
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80',
  },
  CT01: {
    name: 'SmartStorage Ninh Kiều (CT01)',
    address: 'Số 12 Đại lộ Hòa Bình, Q. Ninh Kiều, Cần Thơ',
    floors: 2,
    city: 'Cần Thơ',
    image: 'https://images.unsplash.com/photo-1730154838368-c37b1fdebcf6?auto=format&fit=crop&w=600&q=80',
  },
};

const STORAGE_TYPES_DATA = [
  {
    id: 'ALL',
    name: 'Tất cả ô kho',
    desc: 'Hiển thị tất cả loại kho',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'STANDARD',
    name: 'Kho Thường',
    desc: 'Phù hợp cho đồ gia dụng, quần áo, sách vở, đồ dùng cá nhân',
    image: 'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'CLIMATE_CONTROLLED',
    name: 'Kho Mát',
    desc: 'Phù hợp cho đồ điện tử, tranh dễ ảnh hưởng bởi nhiệt độ',
    image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=600&q=80'
  }
];

export default function StorageMap2D({
  facility,
  onFacilityChange,
  currentFloor,
  onSelectFloor,
  selectedUnit,
  onSelectUnit,
  refreshTrigger,
  copyableUnitCode = false,
  lockFacility = false
}: {
  facility: string;
  onFacilityChange: (fac: string) => void;
  currentFloor: number;
  onSelectFloor: (fl: number) => void;
  selectedUnit: any;
  onSelectUnit: (u: any) => void;
  refreshTrigger?: number;
  copyableUnitCode?: boolean;
  lockFacility?: boolean;
}) {
  const [branches, setBranches] = useState<any[]>([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStorageType, setSelectedStorageType] = useState<'ALL' | 'STANDARD' | 'CLIMATE_CONTROLLED' | null>(lockFacility ? 'ALL' : null);
  const [selectedCity, setSelectedCity] = useState<string>('ALL');

  // Khi đổi cơ sở kho, reset loại kho đã chọn để hiện lại tuần tự
  useEffect(() => {
    if (lockFacility) {
      setSelectedStorageType('ALL');
    } else {
      setSelectedStorageType(null);
    }
  }, [facility, lockFacility]);

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
    : (facility && (facilityData[facility] || facilityData[facility.replace('-', '')]))
      ? {
          ...(facilityData[facility] || facilityData[facility.replace('-', '')]),
          layoutType: ['HN02', 'HCM02', 'HCM03', 'CT01', 'HN-02', 'HCM-02', 'HCM-03', 'CT-01'].includes(facility) ? 'B' : 'A',
        }
      : null;

  // Gọi API lấy danh sách ô kho theo cơ sở và tầng
  useEffect(() => {
    if (!facility) {
      setUnits([]);
      return;
    }
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
            {u.isClimate ? <span className="text-[10px] text-cyan-600 dark:text-blue-400" title="Kho mát điều hòa 22-25°C">❄️</span> : null}
            {shortId}
          </span>
          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 shadow-xs border border-slate-200 dark:border-slate-700">{u.size}</span>
        </div>
        <div className="text-[10px] sm:text-[11px] font-bold flex items-center justify-between mt-0.5 px-0.5">
          <div className="flex items-center">
            {statusDot}
            <span>{badgeText}</span>
          </div>
          <span className={`text-[8px] sm:text-[9px] font-extrabold ${u.isClimate ? 'text-cyan-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
            {u.isClimate ? '❄️ 22-25°C' : '📦 Chuẩn'}
          </span>
        </div>
      </div>
    );
  };

  const copyUnitCode = async (unitCode: string) => {
    try {
      await navigator.clipboard.writeText(unitCode);
      toast.success(`Đã sao chép mã ô kho: ${unitCode}`);
    } catch {
      toast.error('Không sao chép được mã ô kho');
    }
  };

  return (
    <div className="space-y-3">
      {/* THANH ĐIỀU KHIỂN TRỰC QUAN: ẢNH 7 CƠ SỞ & ẢNH 2 LOẠI KHO */}
      <div className="p-4 sm:p-5 rounded-3xl border shadow-sm w-full bg-white dark:bg-slate-900/95 border-slate-200 dark:border-slate-800 space-y-4 text-slate-900 dark:text-white">
        
        {/* 1. CƠ SỞ KHO: 7 CƠ SỞ CÓ ẢNH RIÊNG */}
        <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1.5">
              <MapPin className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>{lockFacility ? 'Cơ sở trực thuộc của bạn:' : '1. Chọn cơ sở kho:'}</span>
            </span>
            {lockFacility && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Cố định theo phân công ca trực
              </span>
            )}
          </div>

          {lockFacility ? (
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {currentFacilityObj?.name || `Cơ sở ${facility}`}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-black bg-blue-600 text-white">
                      {facility}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="size-3.5 text-slate-400 shrink-0" />
                    <span>{currentFacilityObj?.address || "Hệ thống kho thông minh SmartStorage"}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Quy mô: <strong>{currentFacilityObj?.floors || 3} tầng</strong>
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* BỘ LỌC ĐỊA ĐIỂM (TỈNH / THÀNH PHỐ) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 mr-1">
                  <Filter className="size-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Khu vực:</span>
                </div>
                {[
                  { id: 'ALL', label: 'Tất cả (7)' },
                  { id: 'Hà Nội', label: 'Hà Nội (2)' },
                  { id: 'TP.HCM', label: 'TP.HCM (3)' },
                  { id: 'Đà Nẵng', label: 'Đà Nẵng (1)' },
                  { id: 'Cần Thơ', label: 'Cần Thơ (1)' },
                ].map((c) => {
                  const active = selectedCity === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCity(c.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                        active
                          ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>

              {/* Danh sách 7 card cơ sở với ảnh thực tế bự hơn */}
              <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-thin">
                {Object.entries(facilityData)
                  .filter(([_, fData]) => selectedCity === 'ALL' || fData.city === selectedCity)
                  .map(([fKey, fData]) => {
                    const isSelected = facility === fKey;
                    return (
                    <button
                      key={fKey}
                      type="button"
                      onClick={() => onFacilityChange(fKey)}
                      className={`group relative shrink-0 w-64 sm:w-72 text-left rounded-2xl overflow-hidden border-2 transition-all duration-200 cursor-pointer flex flex-col ${
                        isSelected
                          ? 'border-blue-600 dark:border-blue-500 ring-4 ring-blue-500/20 shadow-xl bg-blue-50/20 dark:bg-blue-950/20 scale-[1.02]'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-blue-300 dark:hover:border-slate-700 opacity-85 hover:opacity-100 hover:shadow-md'
                      }`}
                    >
                      {/* Ảnh cơ sở bự hơn */}
                      <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <img
                          src={fData.image}
                          alt={fData.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                        {/* Tag thành phố */}
                        <span className="absolute top-3 left-3 text-xs font-black px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20">
                          {fData.city}
                        </span>

                        {/* Dấu tích khi đang chọn */}
                        {isSelected && (
                          <span className="absolute top-3 right-3 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg">
                            <Check className="size-4 stroke-[3]" />
                          </span>
                        )}

                        {/* Tên cơ sở in đè trên ảnh */}
                        <div className="absolute bottom-3 left-3 right-3">
                          <p className="text-white text-base sm:text-lg font-black truncate leading-tight drop-shadow-sm">
                            {fData.name.replace('SmartStorage ', '')}
                          </p>
                        </div>
                      </div>

                      {/* Địa chỉ cơ sở: hiển thị đầy đủ, không bị cắt xén */}
                      <div className="p-3 bg-white dark:bg-slate-900 flex-1 min-h-[58px] flex items-start gap-1.5 border-t border-slate-100 dark:border-slate-800/80">
                        <MapPin className="size-3.5 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 font-medium leading-snug">
                          {fData.address}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2. LOẠI KHO: CHỈ HIỆN RA KHI KHÁCH ĐÃ CHỌN CƠ SỞ KHO */}
      <AnimatePresence>
        {facility && (
          <motion.div
            key="section-storage-type"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="p-4 sm:p-5 rounded-3xl border shadow-sm w-full bg-white dark:bg-slate-900/95 border-slate-200 dark:border-slate-800 space-y-3.5 text-slate-900 dark:text-white"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1.5">
                <Snowflake className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>2. Chọn loại kho lưu trữ:</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {STORAGE_TYPES_DATA.map((t) => {
                const isSelected = selectedStorageType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedStorageType(t.id as any);
                      onSelectUnit(null);
                    }}
                    className={`group relative text-left rounded-2xl overflow-hidden border-2 transition-all duration-200 cursor-pointer flex flex-col ${
                      isSelected
                        ? 'border-blue-600 dark:border-blue-500 ring-4 ring-blue-500/20 shadow-lg bg-blue-50/30 dark:bg-blue-950/20 scale-[1.01]'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-blue-300 dark:hover:border-slate-700 opacity-80 hover:opacity-100 hover:shadow-xs'
                    }`}
                  >
                    {/* Ảnh loại kho bự hơn */}
                    <div className="relative h-44 sm:h-52 w-full shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={t.image}
                        alt={t.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      {/* Dấu tích khi đang chọn */}
                      {isSelected && (
                        <span className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                          <Check className="size-4 stroke-[3]" />
                        </span>
                      )}
                    </div>

                    {/* Thông tin loại kho */}
                    <div className="p-3 flex-1 flex flex-col justify-center text-center">
                      <p className={`text-sm font-black ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>
                        {t.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 font-medium mt-1">
                        {t.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. TẦNG & SƠ ĐỒ MẶT BẰNG 2D: CHỈ HIỆN KHI ĐÃ CHỌN CƠ SỞ VÀ LOẠI KHO */}
      <AnimatePresence>
        {facility && selectedStorageType && (
          <motion.div
            key="section-blueprint-step"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.35 }}
            className="space-y-4"
          >
            {/* 3. TẦNG */}
            <div className="p-4 sm:p-5 rounded-3xl border shadow-sm bg-white dark:bg-slate-900/95 border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-slate-900 dark:text-white">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs sm:text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-wide flex items-center shrink-0 min-w-[90px] gap-1.5">
                  <Layers className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>3. Chọn tầng:</span>
                </span>
                <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectFloor(1)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all duration-200 cursor-pointer whitespace-nowrap ${
                      currentFloor === 1 ? 'bg-blue-600 dark:bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700'
                    }`}
                  >
                    Tầng Trệt
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectFloor(2)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all duration-200 cursor-pointer whitespace-nowrap ${
                      currentFloor === 2 ? 'bg-blue-600 dark:bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700'
                    }`}
                  >
                    Tầng 1
                  </button>
                  {(currentFacilityObj?.floors || 3) > 2 && (
                    <button
                      type="button"
                      onClick={() => onSelectFloor(3)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all duration-200 cursor-pointer whitespace-nowrap ${
                        currentFloor === 3 ? 'bg-blue-600 dark:bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700'
                      }`}
                    >
                      Tầng 2
                    </button>
                  )}
                </div>
              </div>

              {/* Thông tin ô kho đã chọn */}
              {selectedUnit && (
                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
                  <Check className="size-4 text-emerald-600 shrink-0" />
                  <span>Đã chọn ô <strong>{selectedUnit.id}</strong> ({selectedUnit.dim} - {selectedUnit.isClimate ? 'Kho mát' : 'Kho thường'})</span>
                </div>
              )}

              {/* Dòng mã ô kho có thể sao chép (chỉ bật ở Cổng Nhân Viên) */}
              {copyableUnitCode && selectedUnit && (
                <div className="w-full text-xs font-bold text-slate-700 dark:text-slate-200">
                  <span>Mã ô kho: </span>
                  <button
                    type="button"
                    onClick={() => copyUnitCode(selectedUnit.id)}
                    title="Bấm để sao chép mã ô kho"
                    className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-slate-300 bg-white/80 px-1.5 py-0.5 font-mono font-black text-blue-700 transition hover:bg-white dark:border-slate-700 dark:bg-slate-900/80 dark:text-blue-300 dark:hover:bg-slate-900"
                  >
                    {selectedUnit.id}
                    <Copy className="size-3" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>

      {/* SƠ ĐỒ MẶT BẰNG 2D BLUEPRINT */}
      <div className="p-3 sm:p-3.5 rounded-2xl border shadow-xs space-y-2.5 bg-white dark:bg-slate-900/95 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 gap-2">
          <div className="flex items-center space-x-2 text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wide">
            <i className="fa-solid fa-map text-blue-600 dark:text-blue-400 text-sm"></i>
            <span>SƠ ĐỒ MẶT BẰNG Ô KHO • {currentFloor === 1 ? 'TẦNG TRỆT' : `TẦNG ${currentFloor - 1}`}</span>
          </div>
          <div className="flex items-center gap-2">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}