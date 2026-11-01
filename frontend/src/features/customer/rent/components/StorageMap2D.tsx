import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, MapPin, Snowflake, Layers, Filter } from 'lucide-react';
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
    layoutType: 'A',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
  },
  HN02: {
    name: 'SmartStorage Thanh Xuân (HN02)',
    address: 'Số 120 Khuất Duy Tiến, Q. Thanh Xuân, Hà Nội',
    floors: 2,
    city: 'Hà Nội',
    layoutType: 'B',
    image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=600&q=80',
  },
  HCM01: {
    name: 'SmartStorage Quận 1 (HCM01)',
    address: 'Số 123 Nguyễn Huệ, Quận 1, TP.HCM',
    floors: 3,
    city: 'TP.HCM',
    layoutType: 'A',
    image: 'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?auto=format&fit=crop&w=600&q=80',
  },
  HCM02: {
    name: 'SmartStorage Quận 7 (HCM02)',
    address: 'Số 456 Nguyễn Thị Thập, Quận 7, TP.HCM',
    floors: 2,
    city: 'TP.HCM',
    layoutType: 'B',
    image: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=600&q=80',
  },
  HCM03: {
    name: 'SmartStorage Thủ Đức (HCM03)',
    address: 'Số 789 Xa Lộ Hà Nội, TP. Thủ Đức, TP.HCM',
    floors: 2,
    city: 'TP.HCM',
    layoutType: 'B',
    image: 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=600&q=80',
  },
  DN01: {
    name: 'SmartStorage Hải Châu (DN01)',
    address: 'Số 68 Nguyễn Văn Linh, Q. Hải Châu, Đà Nẵng',
    floors: 3,
    city: 'Đà Nẵng',
    layoutType: 'A',
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80',
  },
  CT01: {
    name: 'SmartStorage Ninh Kiều (CT01)',
    address: 'Số 12 Đại lộ Hòa Bình, Q. Ninh Kiều, Cần Thơ',
    floors: 2,
    city: 'Cần Thơ',
    layoutType: 'B',
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

export const getFacilityCity = (address?: string, code?: string): string => {
  const addr = (address || '').toLowerCase();
  const c = (code || '').toUpperCase();

  if (addr.includes('hà nội') || addr.includes('ha noi') || c.startsWith('HN')) {
    return 'Hà Nội';
  }
  if (
    addr.includes('tp.hcm') ||
    addr.includes('tp. hcm') ||
    addr.includes('hồ chí minh') ||
    addr.includes('ho chi minh') ||
    addr.includes('sài gòn') ||
    addr.includes('sai gon') ||
    c.startsWith('HCM') ||
    c.startsWith('SG')
  ) {
    return 'TP.HCM';
  }
  if (addr.includes('đà nẵng') || addr.includes('da nang') || c.startsWith('DN')) {
    return 'Đà Nẵng';
  }
  if (addr.includes('cần thơ') || addr.includes('can tho') || c.startsWith('CT')) {
    return 'Cần Thơ';
  }
  if (
    addr.includes('bà rịa') ||
    addr.includes('vũng tàu') ||
    addr.includes('ba ria') ||
    addr.includes('vung tau') ||
    c.startsWith('BRVT') ||
    c.startsWith('VT')
  ) {
    return 'Bà Rịa - Vũng Tàu';
  }
  if (addr.includes('hải phòng') || addr.includes('hai phong') || c.startsWith('HP')) {
    return 'Hải Phòng';
  }
  if (addr.includes('bình dương') || addr.includes('binh duong') || c.startsWith('BD')) {
    return 'Bình Dương';
  }
  if (addr.includes('đồng nai') || addr.includes('dong nai') || c.startsWith('DNI')) {
    return 'Đồng Nai';
  }
  if (addr.includes('nha trang') || addr.includes('khánh hòa') || c.startsWith('NT') || c.startsWith('KH')) {
    return 'Nha Trang';
  }

  if (address && address.includes(',')) {
    const parts = address.split(',');
    const lastPart = parts[parts.length - 1].trim();
    if (lastPart) return lastPart;
  }

  return 'Khác';
};

export const hasAssignedManager = (fac: any): boolean => {
  if (!fac) return false;
  let mgrName = fac.managerName;
  if (!mgrName) return false;
  const trimmed = String(mgrName).trim().toLowerCase();
  if (
    trimmed === '' ||
    trimmed === 'chưa phân công' ||
    trimmed === 'chua phan cong' ||
    trimmed === 'chưa có quản lý' ||
    trimmed === 'chua co quan ly' ||
    trimmed === 'null' ||
    trimmed === 'undefined'
  ) {
    return false;
  }
  return true;
};

export default function StorageMap2D({
  facility,
  onFacilityChange,
  currentFloor,
  onSelectFloor,
  selectedUnit,
  onSelectUnit,
  refreshTrigger,
  lockFacility = false,
  currentUnitCode,
  compact = false
}: {
  facility: string;
  onFacilityChange: (fac: string) => void;
  currentFloor: number;
  onSelectFloor: (fl: number) => void;
  selectedUnit: any;
  onSelectUnit: (u: any) => void;
  refreshTrigger?: number;
  lockFacility?: boolean;
  currentUnitCode?: string;
  compact?: boolean;
}) {
  const [branches, setBranches] = useState<any[]>([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStorageType, setSelectedStorageType] = useState<'ALL' | 'STANDARD' | 'CLIMATE_CONTROLLED' | null>(lockFacility ? 'ALL' : null);
  const [selectedCity, setSelectedCity] = useState<string>('ALL');

  // Danh sách cơ sở hợp lệ: Đang hoạt động (ACTIVE) và ĐÃ CÓ MANAGER QUẢN LÝ
  const eligibleFacilities = React.useMemo(() => {
    let sourceList: any[] = [];
    if (branches && branches.length > 0) {
      sourceList = branches;
    } else {
      sourceList = Object.entries(facilityData).map(([code, data]) => ({
        id: code,
        code: code,
        name: data.name,
        facilityName: data.name,
        address: data.address,
        floors: data.floors,
        city: data.city,
        image: data.image,
        status: 'ACTIVE',
        managerName: 'Quản lý cơ sở',
      }));
    }

    const fallbackImages = [
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1730154838368-c37b1fdebcf6?auto=format&fit=crop&w=600&q=80',
    ];

    return sourceList
      .filter((b) => {
        const isActive = !b.status || b.status === 'ACTIVE';
        return isActive && hasAssignedManager(b);
      })
      .map((b, idx) => {
        const code = b.code || b.id || `FAC-${idx + 1}`;
        const normalizedCode = String(code).replace('-', '').toUpperCase();
        const existingData = facilityData[code] || facilityData[normalizedCode];
        const city = b.city || existingData?.city || getFacilityCity(b.address, code);
        const image = b.image || existingData?.image || fallbackImages[idx % fallbackImages.length];
        const rawName = b.name || b.facilityName || existingData?.name || `Cơ sở ${code}`;
        const formattedName = rawName.includes('(') ? rawName : `${rawName} (${code})`;

        const layoutType = (b.layoutType || existingData?.layoutType || (['HN02', 'HCM02', 'HCM03', 'CT01', 'BRVT01'].includes(normalizedCode) ? 'B' : 'A')).toUpperCase();
        const isLayoutB = layoutType === 'B' || layoutType === 'LAYOUT B';
        const targetFloors = isLayoutB ? 2 : 3;

        return {
          key: code,
          code: code,
          name: formattedName,
          address: b.address || existingData?.address || '',
          floors: targetFloors,
          city: city,
          image: image,
          layoutType: layoutType,
          managerName: b.managerName,
        };
      });
  }, [branches]);

  // Bộ lọc khu vực (thành phố) động theo số lượng cơ sở thực tế có Manager
  const cityTabs = React.useMemo(() => {
    const counts: Record<string, number> = {};
    eligibleFacilities.forEach((f) => {
      counts[f.city] = (counts[f.city] || 0) + 1;
    });

    const tabs = [{ id: 'ALL', label: `Tất cả (${eligibleFacilities.length})` }];
    Object.keys(counts).forEach((city) => {
      tabs.push({ id: city, label: `${city} (${counts[city]})` });
    });
    return tabs;
  }, [eligibleFacilities]);

  // Đảm bảo tab được chọn hợp lệ
  useEffect(() => {
    if (selectedCity !== 'ALL' && !cityTabs.some((t) => t.id === selectedCity)) {
      setSelectedCity('ALL');
    }
  }, [cityTabs, selectedCity]);

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

  const currentEligible = eligibleFacilities.find(
    (b) => b.code === facility || b.key === facility || b.code === facility.replace('-', '')
  );
  const matchedBranch = branches.find((b) => b.code === facility || b.id === facility);
  const effectiveLayout = (
    currentEligible?.layoutType ||
    matchedBranch?.layoutType ||
    (facility && (facilityData[facility] || facilityData[facility.replace('-', '')])?.layoutType) ||
    (['HN02', 'HCM02', 'HCM03', 'CT01', 'BRVT01', 'HN-02', 'HCM-02', 'HCM-03', 'CT-01', 'BRVT-01'].includes(facility) ? 'B' : 'A')
  ).toUpperCase();
  const isLayoutB = effectiveLayout === 'B' || effectiveLayout === 'LAYOUT B';
  const effectiveFloors = isLayoutB ? 2 : 3;

  const currentFacilityObj = currentEligible
    ? {
        name: currentEligible.name,
        address: currentEligible.address,
        floors: effectiveFloors,
        layoutType: effectiveLayout,
      }
    : matchedBranch
    ? {
        name: matchedBranch.name || matchedBranch.facilityName,
        address: matchedBranch.address,
        floors: effectiveFloors,
        layoutType: effectiveLayout,
      }
    : (facility && (facilityData[facility] || facilityData[facility.replace('-', '')]))
      ? {
          ...(facilityData[facility] || facilityData[facility.replace('-', '')]),
          floors: effectiveFloors,
          layoutType: effectiveLayout,
        }
      : null;

  // Tự động chuyển về Tầng Trệt nếu tầng đang chọn vượt quá số tầng của cơ sở (vd: từ cơ sở 3 tầng sang cơ sở 2 tầng)
  useEffect(() => {
    const maxFloors = currentFacilityObj?.floors || (isLayoutB ? 2 : 3);
    if (currentFloor > maxFloors) {
      onSelectFloor(1);
    }
  }, [currentFacilityObj?.floors, currentFloor, isLayoutB, onSelectFloor]);

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
    const isSelected = selectedUnit && (selectedUnit.id === u.id || selectedUnit.unitCode === u.id);
    const isCurrent = Boolean(currentUnitCode && (currentUnitCode === u.id || currentUnitCode === u.unitCode));
    const isReserved = u.status === 'RESERVED';
    const isHold = u.status === 'HOLD';
    const isRented = u.status === 'RENTED';
    const isMaintenance = u.status === 'MAINTENANCE';
    const isAvailable = u.status === 'AVAILABLE';

    const matchesFilter = selectedStorageType === 'ALL' || u.storageType === selectedStorageType;
    const filterClass = !matchesFilter ? 'opacity-30 scale-95 saturate-50 hover:opacity-80' : '';

    let cardBg = `unit-color-${u.size}`;
    let statusDot = <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 inline-block" />;
    let badgeText = 'Trống';

    if (isCurrent) {
      cardBg = 'ring-3 ring-blue-500 border-blue-600 bg-blue-50/90 dark:bg-blue-950/80 font-black shadow-md';
      statusDot = <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-1 inline-block" />;
      badgeText = 'Ô của khách';
    } else if (isSelected) {
      cardBg = 'unit-selected ring-3 ring-indigo-500 border-indigo-600 font-black shadow-md';
      statusDot = <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1 inline-block animate-ping" />;
      badgeText = 'Đang chọn';
    } else if (isReserved) {
      cardBg = 'bg-amber-100 dark:bg-amber-950/40 border-amber-400 text-amber-800 dark:text-amber-200 cursor-not-allowed';
      statusDot = <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1 inline-block" />;
      badgeText = 'Đã giữ chỗ';
    } else if (isHold) {
      cardBg = 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 text-amber-700 dark:text-amber-300 cursor-not-allowed';
      statusDot = <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1 inline-block" />;
      badgeText = 'Tạm giữ (5p)';
    } else if (isMaintenance) {
      cardBg = 'bg-slate-200 dark:bg-slate-800 border-slate-400 text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-60';
      statusDot = <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-1 inline-block" />;
      badgeText = 'Bảo trì';
    } else if (isRented) {
      cardBg = 'unit-occupied cursor-not-allowed opacity-60';
      statusDot = <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1 inline-block" />;
      badgeText = 'Đã thuê';
    }

    const shortId = u.id.split('-').pop();
    const heightClass = u.size === 'S' ? 'min-h-[44px]' : u.size === 'M' ? 'min-h-[52px]' : u.size === 'L' ? 'min-h-[62px]' : 'min-h-[70px] sm:min-h-[74px]';

    return (
      <div
        key={u.id}
        onClick={() => {
          if (isCurrent) {
            toast.info(`Đây là ô kho ban đầu của khách (${u.id})`);
            return;
          }
          if (isAvailable) {
            onSelectUnit(isSelected ? null : u);
          }
        }}
        className={`proportional-unit ${cardBg} ${filterClass} ${heightClass} p-1.5 sm:p-2 rounded-lg border shadow-xs text-center flex flex-col justify-between transition-all duration-200 cursor-pointer hover:scale-105 hover:shadow-md active:scale-95 group`}
      >
        <div className="flex justify-between items-center w-full">
          <span className="font-black text-xs sm:text-sm font-mono tracking-tight group-hover:text-blue-600 transition-colors flex items-center gap-1">
            {u.isClimate ? <span className="text-[10px] text-cyan-600 dark:text-blue-400" title="Kho mát điều hòa 22-25°C">❄️</span> : null}
            {shortId}
          </span>
          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 shadow-xs border border-slate-200 dark:border-slate-700">{u.size}</span>
        </div>
        <div className="text-[9.5px] sm:text-[10.5px] font-bold flex items-center justify-between mt-0.5 px-0.5 gap-1 overflow-hidden">
          <div className="flex items-center whitespace-nowrap shrink-0">
            <span>{statusDot}</span><span className="whitespace-nowrap">{badgeText}</span>
          </div>
          <span className={`text-[8px] sm:text-[9px] font-extrabold ${u.isClimate ? 'text-cyan-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
            {u.isClimate ? '❄️ 22-25°C' : '📦 Chuẩn'}
          </span>
        </div>
      </div>
    );
  };


  if (compact) {
    return (
      <div className="space-y-3 w-full">
        {/* THANH ĐIỀU KHIỂN TINH GỌN DÀNH CHO CHECK-IN */}
        <div className="p-3.5 sm:p-4 rounded-2xl border shadow-xs bg-white dark:bg-slate-900/95 border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-slate-900 dark:text-white">
          <div className="flex flex-wrap items-center gap-4">
            {/* 1. CHỌN TẦNG */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1.5 shrink-0">
                <Layers className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Chọn tầng:</span>
              </span>
              <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onSelectFloor(1)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                    currentFloor === 1 ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700'
                  }`}
                >
                  Tầng Trệt
                </button>
                <button
                  type="button"
                  onClick={() => onSelectFloor(2)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                    currentFloor === 2 ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700'
                  }`}
                >
                  Tầng 1
                </button>
                {(currentFacilityObj?.floors || 3) > 2 && (
                  <button
                    type="button"
                    onClick={() => onSelectFloor(3)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                      currentFloor === 3 ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700'
                    }`}
                  >
                    Tầng 2
                  </button>
                )}
              </div>
            </div>

            {/* 2. BỘ LỌC LOẠI KHO */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Lọc loại:</span>
              <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 gap-1 shrink-0">
                {[
                  { id: 'ALL', label: 'Tất cả' },
                  { id: 'STANDARD', label: 'Kho Thường 📦' },
                  { id: 'CLIMATE_CONTROLLED', label: 'Kho Điều Hòa ❄️' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedStorageType(t.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      selectedStorageType === t.id
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CHÚ THÍCH TRẠNG THÁI */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500 inline-block"></span>Trống</span>
            {currentUnitCode && (
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-blue-600 inline-block"></span>Ô của khách</span>
            )}
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-indigo-600 inline-block"></span>Đang chọn</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-500 inline-block"></span>Đã giữ chỗ</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-rose-500 inline-block"></span>Đã thuê</span>
          </div>
        </div>

        {/* SƠ ĐỒ MẶT BẰNG 2D BLUEPRINT BẢN RỘNG */}
        <div className="p-3 sm:p-4 rounded-2xl border shadow-xs space-y-2.5 bg-white dark:bg-slate-900/95 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white w-full">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 gap-2">
            <div className="flex items-center space-x-2 text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              <i className="fa-solid fa-map text-blue-600 dark:text-blue-400 text-sm"></i>
              <span>SƠ ĐỒ MẶT BẰNG Ô KHO</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {units.length} ô kho tầng này
              </span>
            </div>
          </div>

          {/* Blueprint Grid Container */}
          {loading ? (
            <div className="py-20 text-center text-xs text-slate-400">
              <i className="fa-solid fa-spinner animate-spin text-2xl mb-2 block text-blue-500"></i>
              <span>Đang tải sơ đồ mặt bằng từ máy chủ...</span>
            </div>
          ) : currentFloor === 1 ? (
            <div className="floor-blueprint-container p-3 sm:p-4 space-y-3 shadow-inner relative w-full">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-900 dark:text-white uppercase">
                  <span className="flex items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-2"></span> Khu Phòng Siêu Lớn XL (10m²)
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
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-2"></span> Khu Phòng Siêu Lớn XL (10m²)
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
            <div className="floor-blueprint-container p-3 sm:p-4 space-y-3 shadow-inner relative w-full">
              {/* Size S Cluster */}
              {units.filter((u) => u.size === 'S').length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-900 dark:text-white uppercase">
                    <span className="flex items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2"></span> Khu Tủ Cá Nhân S (1m²)
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
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 mr-2"></span> Khu Phòng Vừa M (3m²)
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
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2"></span> Khu Phòng Lớn L (6m²)
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

  return (
    <div className="space-y-3">
      {/* THANH ĐIỀU KHIỂN TRỰC QUAN: ẢNH 7 CƠ SỞ & ẢNH 2 LOẠI KHO */}
      {!lockFacility && (
      <div className="p-4 sm:p-5 rounded-3xl border shadow-sm w-full bg-white dark:bg-slate-900/95 border-slate-200 dark:border-slate-800 space-y-4 text-slate-900 dark:text-white">
        
        {/* 1. CƠ SỞ KHO: 7 CƠ SỞ CÓ ẢNH RIÊNG */}
        <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1.5">
              <MapPin className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>1. Chọn cơ sở kho:</span>
            </span>
          </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 mr-1">
                  <Filter className="size-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Khu vực:</span>
                </div>
                {cityTabs.map((c) => {
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

              {/* Danh sách các card cơ sở đã có Manager quản lý */}
              <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-thin">
                {eligibleFacilities
                  .filter((fData) => selectedCity === 'ALL' || fData.city === selectedCity)
                  .map((fData) => {
                    const isSelected = facility === fData.code || facility === fData.key;
                    return (
                    <button
                      key={fData.key}
                      type="button"
                      onClick={() => onFacilityChange(fData.code)}
                      className={`group relative shrink-0 w-64 sm:w-72 text-left rounded-2xl overflow-hidden border-2 transition-all duration-200 cursor-pointer flex flex-col ${
                        isSelected
                          ? 'border-blue-600 dark:border-blue-500 ring-4 ring-blue-500/20 shadow-xl bg-blue-50/20 dark:bg-blue-950/20 scale-[1.02]'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-blue-300 dark:hover:border-slate-700 opacity-85 hover:opacity-100 hover:shadow-md'
                      }`}
                    >
                      {/* Ảnh cơ sở */}
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

                {eligibleFacilities.filter((fData) => selectedCity === 'ALL' || fData.city === selectedCity).length === 0 && (
                  <div className="py-8 text-center text-slate-500 dark:text-slate-400 w-full text-xs font-medium">
                    Không có cơ sở kho nào khả dụng tại khu vực này.
                  </div>
                )}
              </div>
        </div>
      </div>
      )}

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
                <span>{lockFacility ? '1. Chọn loại kho lưu trữ:' : '2. Chọn loại kho lưu trữ:'}</span>
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
                  <span>{lockFacility ? '2. Chọn tầng:' : '3. Chọn tầng:'}</span>
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
                  <span>Đã chọn ô <strong>{selectedUnit.id}</strong> ({selectedUnit.isClimate ? 'Kho mát' : 'Kho thường'})</span>
                </div>
              )}

            </div>

      {/* SƠ ĐỒ MẶT BẰNG 2D BLUEPRINT */}
      <div className="p-3 sm:p-3.5 rounded-2xl border shadow-xs space-y-2.5 bg-white dark:bg-slate-900/95 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 gap-2">
          <div className="flex items-center space-x-2 text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wide">
            <i className="fa-solid fa-map text-blue-600 dark:text-blue-400 text-sm"></i>
            <span>SƠ ĐỒ MẶT BẰNG Ô KHO</span>
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
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-2"></span> Khu Phòng Siêu Lớn XL (10m²)
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
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-2"></span> Khu Phòng Siêu Lớn XL (10m²)
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
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2"></span> Khu Tủ Cá Nhân S (1m²)
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
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 mr-2"></span> Khu Phòng Vừa M (3m²)
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
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2"></span> Khu Phòng Lớn L (6m²)
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
