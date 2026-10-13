import React, { useState, useEffect } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { Warehouse, Boxes, KeyRound, Headset, Home } from 'lucide-react';
import Header from '@/components/common/Header';
import StorageMap2D from '@/features/portal/components/StorageMap2D';
import BookingSidebar from '@/features/portal/components/BookingSidebar';
import MyStorageTab from '@/features/portal/components/MyStorageTab';
import GatePinTab from '@/features/portal/components/GatePinTab';
import SupportTab from '@/features/portal/components/SupportTab';
import DepositPaymentFlow from '@/features/portal/components/modals/DepositPaymentFlow';
import ExtendPaymentFlow from '@/features/portal/components/modals/ExtendPaymentFlow';
import CustomerProfileModal from '@/features/portal/components/modals/CustomerProfileModal';
import RentStorageWizardModal from '@/features/portal/components/modals/RentStorageWizardModal';
import ExtendContractModal from '@/features/portal/components/modals/ExtendContractModal';
import GatePinModal from '@/features/portal/components/modals/GatePinModal';
import SupportTicketModal from '@/features/portal/components/modals/SupportTicketModal';

import SiteFooter from '@/components/common/SiteFooter';

import { useTheme } from '@/components/common/theme-provider';
import { getCurrentCustomerProfile } from '@/features/portal/services/customerService';
import { getBranches } from '@/features/portal/services/facilityService';

type TabType = 'home' | 'rent' | 'my-storage' | 'gate-pin' | 'support';

interface CustNavItem {
  id: 'rent' | 'my-storage' | 'gate-pin' | 'support';
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  theme: {
    cardBg: string;
    border: string;
    shadow: string;
    iconBg: string;
    textHover: string;
    badge: string;
  };
}

const CUSTOMER_NAV_ITEMS: CustNavItem[] = [
  {
    id: 'rent',
    label: 'Thuê kho',
    subtitle: 'Tìm & đặt ô kho 2D',
    icon: Warehouse,
    theme: {
      cardBg: 'bg-slate-50/90 hover:bg-slate-100/95 dark:bg-slate-900/85 dark:hover:bg-slate-800/90',
      border: 'border border-slate-200/80 hover:border-blue-400/60 hover:ring-2 hover:ring-blue-400/15 dark:border-slate-800 dark:hover:border-cyan-500/60 dark:hover:ring-2 dark:hover:ring-cyan-500/20',
      shadow: 'shadow-lg shadow-slate-300/30 hover:shadow-xl hover:shadow-blue-500/20 dark:shadow-[0_10px_30px_rgba(0,0,0,0.6)] dark:hover:shadow-[0_15px_35px_rgba(6,182,212,0.2)]',
      iconBg: 'bg-gradient-to-tr from-blue-600 to-sky-500 text-white shadow-md shadow-blue-600/30',
      textHover: 'group-hover:text-blue-600 dark:group-hover:text-cyan-400',
      badge: 'bg-blue-500/10 text-blue-700 border border-blue-200/60 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30',
    },
  },
  {
    id: 'my-storage',
    label: 'Kho của tôi',
    subtitle: 'Quản lý hợp đồng & đồ',
    icon: Boxes,
    theme: {
      cardBg: 'bg-slate-50/90 hover:bg-slate-100/95 dark:bg-slate-900/85 dark:hover:bg-slate-800/90',
      border: 'border border-slate-200/80 hover:border-blue-400/60 hover:ring-2 hover:ring-blue-400/15 dark:border-slate-800 dark:hover:border-cyan-500/60 dark:hover:ring-2 dark:hover:ring-cyan-500/20',
      shadow: 'shadow-lg shadow-slate-300/30 hover:shadow-xl hover:shadow-blue-500/20 dark:shadow-[0_10px_30px_rgba(0,0,0,0.6)] dark:hover:shadow-[0_15px_35px_rgba(6,182,212,0.2)]',
      iconBg: 'bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-md shadow-emerald-600/30',
      textHover: 'group-hover:text-blue-600 dark:group-hover:text-cyan-400',
      badge: 'bg-blue-500/10 text-blue-700 border border-blue-200/60 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30',
    },
  },
  {
    id: 'gate-pin',
    label: 'Mã PIN mở cửa',
    subtitle: 'Mở cửa tự động 24/7',
    icon: KeyRound,
    theme: {
      cardBg: 'bg-slate-50/90 hover:bg-slate-100/95 dark:bg-slate-900/85 dark:hover:bg-slate-800/90',
      border: 'border border-slate-200/80 hover:border-blue-400/60 hover:ring-2 hover:ring-blue-400/15 dark:border-slate-800 dark:hover:border-cyan-500/60 dark:hover:ring-2 dark:hover:ring-cyan-500/20',
      shadow: 'shadow-lg shadow-slate-300/30 hover:shadow-xl hover:shadow-blue-500/20 dark:shadow-[0_10px_30px_rgba(0,0,0,0.6)] dark:hover:shadow-[0_15px_35px_rgba(6,182,212,0.2)]',
      iconBg: 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30',
      textHover: 'group-hover:text-blue-600 dark:group-hover:text-cyan-400',
      badge: 'bg-blue-500/10 text-blue-700 border border-blue-200/60 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30',
    },
  },
  {
    id: 'support',
    label: 'Gửi hỗ trợ',
    subtitle: 'Gửi ticket & giải đáp',
    icon: Headset,
    theme: {
      cardBg: 'bg-slate-50/90 hover:bg-slate-100/95 dark:bg-slate-900/85 dark:hover:bg-slate-800/90',
      border: 'border border-slate-200/80 hover:border-blue-400/60 hover:ring-2 hover:ring-blue-400/15 dark:border-slate-800 dark:hover:border-cyan-500/60 dark:hover:ring-2 dark:hover:ring-cyan-500/20',
      shadow: 'shadow-lg shadow-slate-300/30 hover:shadow-xl hover:shadow-blue-500/20 dark:shadow-[0_10px_30px_rgba(0,0,0,0.6)] dark:hover:shadow-[0_15px_35px_rgba(6,182,212,0.2)]',
      iconBg: 'bg-gradient-to-tr from-violet-600 to-purple-500 text-white shadow-md shadow-violet-600/30',
      textHover: 'group-hover:text-blue-600 dark:group-hover:text-cyan-400',
      badge: 'bg-blue-500/10 text-blue-700 border border-blue-200/60 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30',
    },
  },
];


const CUST_NAV_TRANSITION = {
  type: 'spring' as const,
  stiffness: 110,
  damping: 20,
  mass: 1.1,
};

interface CustomerPortalProps {
  initialTab?: 'home' | 'grid' | 'access';
}

export default function CustomerPortal({ initialTab = 'home' }: CustomerPortalProps = {}) {
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (initialTab === 'grid') return 'rent';
    if (initialTab === 'access') return 'my-storage';
    return 'home';
  });

  useEffect(() => {
    // Chuyển sang Light mode theo yêu cầu giao diện sáng
    if (localStorage.getItem('theme') === 'dark') {
      setTheme('light');
    }
  }, []);

  const [showRentModal, setShowRentModal] = useState(false);
  const [showGatePinModal, setShowGatePinModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  const [facility, setFacility] = useState('HN-01');
  const [currentFloor, setCurrentFloor] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);

  // Modals
  const [showDepositFlow, setShowDepositFlow] = useState(false);
  const [showExtendPaymentFlow, setShowExtendPaymentFlow] = useState(false);
  const [extendPaymentData, setExtendPaymentData] = useState<any>(null);
  const [depositBookingData, setDepositBookingData] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendUnitContext, setExtendUnitContext] = useState<any>(null);

  const [mapRefreshTrigger, setMapRefreshTrigger] = useState(0);

  // Dữ liệu khách hàng và cơ sở tải động từ Database
  const [customerProfile, setCustomerProfile] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchPortalData = async () => {
      try {
        const [profileRes, branchesRes] = await Promise.all([
          getCurrentCustomerProfile(),
          getBranches()
        ]);
        if (isMounted) {
          if (profileRes.success && profileRes.data) {
            setCustomerProfile(profileRes.data);
          }
          if (branchesRes.success && Array.isArray(branchesRes.data) && branchesRes.data.length > 0) {
            setBranches(branchesRes.data);
          }
        }
      } catch (err) {
        console.error('Lỗi tải dữ liệu cổng khách hàng:', err);
      }
    };
    fetchPortalData();

    const handleProfileUpdate = () => {
      fetchPortalData();
    };
    window.addEventListener('customer_profile_updated', handleProfileUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('customer_profile_updated', handleProfileUpdate);
    };
  }, []);

  // Lấy họ tên khách hàng thực tế từ DB hoặc session đăng nhập
  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const parsedUser = storedUser ? (() => { try { return JSON.parse(storedUser); } catch(e) { return null; } })() : null;
  const customerName = customerProfile?.fullName || parsedUser?.fullName || 'Khách Hàng';

  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  const handleOpenDepositModal = (bookingPayload?: Record<string, any>) => {
    if (!selectedUnit) return;
    const currentBranch = branches.find((b) => b.code === facility || b.id === facility);
    const facilityDisplayName = currentBranch?.name || `SmartStorage (${facility})`;

    setDepositBookingData({
      facilityName: facilityDisplayName,
      unitId: selectedUnit.id,
      unitSize: `Size ${selectedUnit.size}`,
      storageType: bookingPayload?.storageType || (selectedUnit as any).storageType || ((selectedUnit as any).isClimate ? 'CLIMATE_CONTROLLED' : 'STANDARD'),
      typeLabel: bookingPayload?.typeLabel || (selectedUnit as any).typeLabel || ((selectedUnit as any).isClimate ? 'Kho Mát Điều Hòa (22-25°C)' : 'Kho Tiêu Chuẩn'),
      isClimate: bookingPayload?.isClimate ?? (selectedUnit as any).isClimate,
      startDate: bookingPayload?.startDate || new Date().toLocaleDateString('vi-VN'),
      endDate: bookingPayload?.endDate || '',
      effectiveDays: bookingPayload?.effectiveDays || 30,
      estimatedTotalRental: bookingPayload?.estimatedTotalRental || (selectedUnit.monthlyPrice ? selectedUnit.monthlyPrice * 1 : selectedUnit.price * 30),
      depositAmount: selectedUnit.deposit
    });
    setShowDepositFlow(true);
  };

  const handleOpenExtendModal = (unitInfo: any) => {
    setExtendUnitContext(unitInfo);
    setShowExtendModal(true);
  };

  const handleConfirmExtendPayment = (extData: any) => {
    setShowExtendModal(false);
    setDepositBookingData({
      facilityName: `SmartStorage ${extData.unitCode}`,
      unitId: extData.unitCode,
      unitSize: `Size ${extData.size}`,
      startDate: new Date().toLocaleDateString('vi-VN'),
      depositAmount: extData.finalTotal
    });
    setShowDepositFlow(true);
  };

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất khỏi Cổng Khách Hàng SmartStorage?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setShowProfileModal(false);
      window.location.href = "/login";
    }
  };

  return (
    <div className={`relative min-h-screen flex flex-col transition-colors ${isDarkMode ? 'dark bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'}`}>
      {/* Background Image with Adaptive Light / Dark Cyber Gradient Overlay */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none z-0"
        style={{ backgroundImage: `url('/images/tech-storage-bg.jpg')` }}
      >
        <div className={`absolute inset-0 backdrop-blur-[2px] transition-colors ${
          isDarkMode 
            ? 'bg-gradient-to-b from-slate-950/90 via-[#031525]/70 to-slate-950/95' 
            : 'bg-gradient-to-b from-slate-100/80 via-sky-100/50 to-slate-200/75'
        }`} />
      </div>

      {/* Header */}
      <div className="relative z-20">
        <Header
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          onOpenProfileModal={() => setShowProfileModal(true)}
          onGoHome={() => setActiveTab('home')}
        />
      </div>

      {/* Main Container wrapped in LayoutGroup for seamless morphing */}
      <LayoutGroup id="customer-portal-nav">
        <main className="relative z-10 flex-1 flex flex-col w-full">
          {/* 1. KHU VỰC HERO (TIÊU ĐỀ + CHÀO HỎI): Thu gọn mượt mà khi bấm vào các mục */}
          <AnimatePresence>
            {activeTab === 'home' && (
              <motion.div
                key="hero-dashboard-headline"
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden flex flex-col items-center pt-10 sm:pt-14 pb-2 text-center"
              >
                {/* Main Headline */}
                <div className="relative flex flex-col items-center select-none w-full max-w-5xl">
                  {/* Glowing ambient radial aura behind headline */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-full max-w-3xl h-40 bg-gradient-to-r from-blue-500/20 via-cyan-400/25 to-indigo-500/20 blur-3xl rounded-full pointer-events-none -z-10" />

                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight uppercase text-center leading-[1.15]">
                    <span className="text-slate-900 dark:text-white drop-shadow-[0_2px_12px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                      HỆ THỐNG KHO TỰ QUẢN
                    </span>
                    <br />
                    <span className="text-slate-900 dark:text-white drop-shadow-[0_2px_12px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                      THÔNG MINH{' '}
                    </span>
                    <span className="text-blue-600 dark:text-cyan-400 drop-shadow-[0_4px_16px_rgba(37,99,235,0.4)] dark:drop-shadow-[0_4px_20px_rgba(6,182,212,0.6)]">
                      24/7
                    </span>
                  </h1>
                </div>


                {/* Customer Greeting */}
                <div className="flex items-center justify-center mt-6 sm:mt-8">
                  <div className="inline-flex items-center gap-3 px-6 py-2.5 sm:px-7 sm:py-3 rounded-full bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl border-2 border-blue-400/70 dark:border-cyan-400/70 shadow-xl shadow-blue-500/15 text-sm sm:text-base font-bold text-slate-700 dark:text-slate-200">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span>Xin chào,</span>
                    <span className="text-blue-600 dark:text-cyan-400 font-black text-base sm:text-lg tracking-wide">
                      {customerName}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 2. HÀNG 4 NÚT: TỰ ĐỘNG CHUYỂN TỪ GIỮA MÀN HÌNH LÊN LÀM THANH NAVBAR VỚI ANIMATION */}
          <motion.div
            layout
            transition={CUST_NAV_TRANSITION}
            className={`w-full z-30 transition-colors flex justify-center ${
              activeTab === 'home'
                ? 'relative py-8 sm:py-12'
                : 'sticky top-0 py-2.5'
            }`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center w-full">
              <motion.div
                layout
                transition={CUST_NAV_TRANSITION}
                className={`transition-all ${
                  activeTab === 'home'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7 lg:gap-8 w-full max-w-6xl xl:max-w-7xl'
                    : 'flex items-center gap-1.5 sm:gap-2 overflow-x-auto p-1.5 bg-slate-50/90 dark:bg-slate-900/90 rounded-2xl border border-sky-200/80 dark:border-slate-800/80 justify-center backdrop-blur-md shadow-md'
                }`}
              >
                {/* Nút Về Trang Chủ khi đang ở trong Tab */}
                {activeTab !== 'home' && (
                  <motion.button
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={CUST_NAV_TRANSITION}
                    type="button"
                    onClick={() => setActiveTab('home')}
                    title="Về Trang Chủ"
                    className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
                  >
                    <Home className="size-4.5" />
                  </motion.button>
                )}

                {CUSTOMER_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const theme = item.theme;
                  const isActive = activeTab === item.id;
                  const isHome = activeTab === 'home';

                  return (
                    <motion.button
                      key={item.id}
                      layout
                      transition={CUST_NAV_TRANSITION}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`transition-all duration-300 cursor-pointer flex items-center ${
                        isHome
                          ? `p-5 sm:p-6 lg:p-7 rounded-3xl backdrop-blur-xl border tracking-wide hover:scale-[1.04] text-center flex-col justify-between min-h-[180px] sm:min-h-[210px] ${theme.cardBg} ${theme.border} ${theme.shadow}`
                          : `px-3.5 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm tracking-wide space-x-2 whitespace-nowrap border ${
                              isActive
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 dark:bg-cyan-500 dark:text-slate-950 dark:border-cyan-400 dark:shadow-cyan-400/30'
                                : 'text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800/70 border-transparent'
                            }`
                      }`}
                    >
                      <motion.span
                        layout
                        transition={CUST_NAV_TRANSITION}
                        className={`shrink-0 flex items-center justify-center ${
                          isHome
                            ? `w-14 h-14 sm:w-16 sm:h-16 rounded-2xl group-hover:scale-110 transition-transform ${theme.iconBg}`
                            : ''
                        }`}
                      >
                        <Icon
                          className={
                            isHome
                              ? 'size-7 sm:size-8'
                              : `size-4 sm:size-4.5 ${
                                  isActive ? 'text-white dark:text-slate-950' : 'text-slate-600 dark:text-slate-400'
                                }`
                          }
                        />
                      </motion.span>

                      <motion.div
                        layout
                        transition={CUST_NAV_TRANSITION}
                        className={isHome ? 'flex flex-col items-center mt-5 w-full' : 'flex items-center'}
                      >
                        <motion.span
                          layout
                          transition={CUST_NAV_TRANSITION}
                          className={
                            isHome
                              ? `font-black text-xl sm:text-2xl lg:text-3xl text-slate-900 dark:text-white transition-colors whitespace-nowrap ${theme.textHover}`
                              : 'font-bold text-xs sm:text-sm tracking-wide'
                          }
                        >
                          {item.label}
                        </motion.span>

                        {isHome && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={`mt-2.5 text-xs sm:text-sm font-bold px-3.5 py-1 rounded-full ${theme.badge}`}
                          >
                            {item.subtitle}
                          </motion.span>
                        )}
                      </motion.div>
                    </motion.button>
                  );
                })}
              </motion.div>
            </div>
          </motion.div>

          {/* 3. PHÂN TRANG CHI TIẾT TỪNG MỤC (PAGE TAB CONTENT) */}
          <AnimatePresence mode="wait">
            {activeTab !== 'home' && (
              <motion.div
                key={`tab-content-active-${activeTab}`}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1"
              >
                {/* PHÂN TRANG 1: THUÊ KHO */}
                {activeTab === 'rent' && (
                  <motion.div
                    key="tab-rent"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="space-y-6"
                  >
                    {/* Bản đồ 2D + Sidebar đặt cọc */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
                      <div className="lg:col-span-8">
                        <StorageMap2D
                          facility={facility}
                          refreshTrigger={mapRefreshTrigger}
                          onFacilityChange={(fac) => {
                            setFacility(fac);
                            setSelectedUnit(null);
                          }}
                          currentFloor={currentFloor}
                          onSelectFloor={(fl) => {
                            setCurrentFloor(fl);
                            setSelectedUnit(null);
                          }}
                          selectedUnit={selectedUnit}
                          onSelectUnit={setSelectedUnit}
                        />
                      </div>

                      <div className="lg:col-span-4 sticky top-20">
                        <BookingSidebar
                          selectedUnit={selectedUnit}
                          onOpenDepositModal={handleOpenDepositModal}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* PHÂN TRANG 2: KHO CỦA TÔI */}
                {activeTab === 'my-storage' && (
                  <motion.div
                    key="tab-my-storage"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="w-full"
                  >
                    <MyStorageTab
                      onOpenExtendModal={handleOpenExtendModal}
                      onOpenPinModal={() => setActiveTab('gate-pin')}
                    />
                  </motion.div>
                )}

                {/* PHÂN TRANG 3: MÃ PIN MỞ CỬA */}
                {activeTab === 'gate-pin' && (
                  <motion.div
                    key="tab-gate-pin"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="w-full"
                  >
                    <GatePinTab />
                  </motion.div>
                )}

                {/* PHÂN TRANG 4: GỬI HỖ TRỢ */}
                {activeTab === 'support' && (
                  <motion.div
                    key="tab-support"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="w-full"
                  >
                    <SupportTab />
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </LayoutGroup>

      {/* Footer for Customer Portal */}
      <div className="relative z-10">
        <SiteFooter />
      </div>


      {/* 1. Modal Thuê kho 5 bước (Dạng Popup Wizard tiện dụng khi người dùng bấm mở wizard) */}
      <RentStorageWizardModal
        isOpen={showRentModal}
        onClose={() => setShowRentModal(false)}
        facility={facility}
        onFacilityChange={setFacility}
        branches={branches}
        onSuccess={() => {
          setShowRentModal(false);
          setMapRefreshTrigger((prev) => prev + 1);
          setActiveTab('my-storage');
        }}
      />

      {/* 2. Modal Mã PIN Cửa Chính (nếu gọi từ chỗ khác) */}
      <GatePinModal
        isOpen={showGatePinModal}
        onClose={() => setShowGatePinModal(false)}
      />

      {/* 3. Modal Support */}
      {showSupportModal && (
        <SupportTicketModal
          onClose={() => setShowSupportModal(false)}
        />
      )}

      {/* 4. Modal Profile */}
      {showProfileModal && (
        <CustomerProfileModal
          onClose={() => setShowProfileModal(false)}
          onLogout={handleLogout}
        />
      )}

      {/* 5. Modal Gia hạn hợp đồng */}
      {showExtendModal && (
        <ExtendContractModal
          unitContext={extendUnitContext}
          onClose={() => setShowExtendModal(false)}
          onConfirmPayment={handleConfirmExtendPayment}
        />
      )}

      {/* 6. Luồng thanh toán gia hạn */}
      {showExtendPaymentFlow && extendPaymentData && (
        <ExtendPaymentFlow
          initialBookingData={extendPaymentData}
          onClose={() => setShowExtendPaymentFlow(false)}
          onFinish={() => {
            setShowExtendPaymentFlow(false);
            setMapRefreshTrigger((prev) => prev + 1);
            setActiveTab('my-storage');
          }}
        />
      )}

      {/* 7. Luồng thanh toán đặt cọc VietQR */}
      {showDepositFlow && depositBookingData && (
        <DepositPaymentFlow
          initialBookingData={depositBookingData}
          onClose={() => setShowDepositFlow(false)}
          onFinish={() => {
            setShowDepositFlow(false);
            setSelectedUnit(null);
            setMapRefreshTrigger((prev) => prev + 1);
            setActiveTab('my-storage');
          }}
        />
      )}
    </div>
  );
}
