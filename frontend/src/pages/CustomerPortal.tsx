import React, { useState, useEffect } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { Warehouse, Boxes, KeyRound, Headset } from 'lucide-react';
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
import ChatbotWidget from '@/components/common/ChatbotWidget';
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
      cardBg: 'bg-gradient-to-b from-white/95 via-sky-50/60 to-blue-50/80 hover:from-white hover:to-blue-100/90 dark:from-slate-900/95 dark:to-blue-950/70',
      border: 'border-2 border-blue-400 hover:border-blue-600 hover:ring-4 hover:ring-blue-400/20 dark:border-blue-500/60 dark:hover:border-blue-400',
      shadow: 'shadow-xl shadow-blue-500/15 hover:shadow-2xl hover:shadow-blue-500/35 dark:shadow-[0_10px_30px_rgba(37,99,235,0.2)]',
      iconBg: 'bg-gradient-to-tr from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-600/35 group-hover:shadow-xl group-hover:shadow-blue-500/50',
      textHover: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
      badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40',
    },
  },
  {
    id: 'my-storage',
    label: 'Kho của tôi',
    subtitle: 'Quản lý hợp đồng & đồ',
    icon: Boxes,
    theme: {
      cardBg: 'bg-gradient-to-b from-white/95 via-emerald-50/60 to-teal-50/80 hover:from-white hover:to-emerald-100/90 dark:from-slate-900/95 dark:to-emerald-950/70',
      border: 'border-2 border-emerald-400 hover:border-emerald-600 hover:ring-4 hover:ring-emerald-400/20 dark:border-emerald-500/60 dark:hover:border-emerald-400',
      shadow: 'shadow-xl shadow-emerald-500/15 hover:shadow-2xl hover:shadow-emerald-500/35 dark:shadow-[0_10px_30px_rgba(16,185,129,0.2)]',
      iconBg: 'bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-600/35 group-hover:shadow-xl group-hover:shadow-emerald-500/50',
      textHover: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
      badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40',
    },
  },
  {
    id: 'gate-pin',
    label: 'Mã PIN mở cửa',
    subtitle: 'Mở cửa tự động 24/7',
    icon: KeyRound,
    theme: {
      cardBg: 'bg-gradient-to-b from-white/95 via-amber-50/60 to-orange-50/80 hover:from-white hover:to-amber-100/90 dark:from-slate-900/95 dark:to-amber-950/70',
      border: 'border-2 border-amber-400 hover:border-amber-600 hover:ring-4 hover:ring-amber-400/20 dark:border-amber-500/60 dark:hover:border-amber-400',
      shadow: 'shadow-xl shadow-amber-500/15 hover:shadow-2xl hover:shadow-amber-500/35 dark:shadow-[0_10px_30px_rgba(245,158,11,0.2)]',
      iconBg: 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/35 group-hover:shadow-xl group-hover:shadow-amber-500/50',
      textHover: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
      badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40',
    },
  },
  {
    id: 'support',
    label: 'Gửi hỗ trợ',
    subtitle: 'Gửi ticket & giải đáp',
    icon: Headset,
    theme: {
      cardBg: 'bg-gradient-to-b from-white/95 via-purple-50/60 to-violet-50/80 hover:from-white hover:to-violet-100/90 dark:from-slate-900/95 dark:to-purple-950/70',
      border: 'border-2 border-violet-400 hover:border-violet-600 hover:ring-4 hover:ring-violet-400/20 dark:border-violet-500/60 dark:hover:border-violet-400',
      shadow: 'shadow-xl shadow-violet-500/15 hover:shadow-2xl hover:shadow-violet-500/35 dark:shadow-[0_10px_30px_rgba(139,92,246,0.2)]',
      iconBg: 'bg-gradient-to-tr from-violet-600 to-purple-500 text-white shadow-lg shadow-violet-600/35 group-hover:shadow-xl group-hover:shadow-violet-500/50',
      textHover: 'group-hover:text-violet-600 dark:group-hover:text-violet-400',
      badge: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/40',
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
        />
      </div>

      {/* Main Container wrapped in LayoutGroup for seamless morphing */}
      <LayoutGroup id="customer-portal-nav">
        <main className="relative z-10 flex-1 flex flex-col w-full">
          {activeTab === 'home' ? (
            /* ========================================================
               TRANG CHỦ (LANDING HOME): 4 Ô Ở GIỮA MÀN HÌNH
               ======================================================== */
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col justify-center items-center py-12 sm:py-16 lg:py-20 text-center">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="flex flex-col items-center w-full"
              >
                {/* Main Headline */}
                <div className="relative flex flex-col items-center select-none w-full max-w-5xl">
                  {/* Glowing ambient radial aura behind headline */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-full max-w-3xl h-56 bg-gradient-to-r from-blue-500/25 via-cyan-400/30 to-indigo-500/25 blur-3xl rounded-full pointer-events-none -z-10" />

                  <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight uppercase text-center leading-[1.12]">
                    <span className="text-slate-900 dark:text-white drop-shadow-[0_2px_12px_rgba(255,255,255,0.9)] dark:drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                      HỆ THỐNG{' '}
                    </span>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 dark:from-cyan-400 dark:via-sky-300 dark:to-blue-400 drop-shadow-[0_6px_24px_rgba(37,99,235,0.45)]">
                      KHO TỰ QUẢN
                    </span>
                    <br />
                    <span className="text-slate-900 dark:text-white drop-shadow-[0_2px_12px_rgba(255,255,255,0.9)] dark:drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                      THÔNG MINH{' '}
                    </span>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 dark:from-sky-300 dark:via-cyan-400 dark:to-blue-400 drop-shadow-[0_6px_24px_rgba(37,99,235,0.45)]">
                      24/7
                    </span>
                  </h1>
                </div>

                {/* Customer Greeting */}
                <div className="flex items-center justify-center mt-6 sm:mt-8">
                  <div className="inline-flex items-center gap-3 px-6 py-2.5 sm:px-7 sm:py-3 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-2 border-blue-400/70 dark:border-cyan-400/70 shadow-xl shadow-blue-500/15 text-sm sm:text-base font-bold text-slate-700 dark:text-slate-200">
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

                {/* 4 Action Buttons in Grid (Center Screen) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7 lg:gap-8 w-full max-w-6xl xl:max-w-7xl mt-10 sm:mt-14 lg:mt-16">
                  {CUSTOMER_NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const theme = item.theme;
                    return (
                      <motion.button
                        key={item.id}
                        layoutId={`cust-nav-btn-${item.id}`}
                        transition={CUST_NAV_TRANSITION}
                        type="button"
                        onClick={() => setActiveTab(item.id)}
                        className={`p-7 sm:p-8 lg:p-10 rounded-3xl backdrop-blur-xl border-2 tracking-wide transition-all duration-300 hover:scale-[1.05] cursor-pointer text-center group flex flex-col items-center justify-between min-h-[220px] sm:min-h-[250px] ${theme.cardBg} ${theme.border} ${theme.shadow}`}
                      >
                        <motion.span
                          layoutId={`cust-nav-icon-${item.id}`}
                          transition={CUST_NAV_TRANSITION}
                          className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${theme.iconBg}`}
                        >
                          <Icon className="size-8 sm:size-10" />
                        </motion.span>

                        <div className="flex flex-col items-center mt-5 w-full">
                          <motion.span
                            layoutId={`cust-nav-title-${item.id}`}
                            transition={CUST_NAV_TRANSITION}
                            className={`font-black text-xl sm:text-2xl lg:text-3xl text-slate-900 dark:text-white transition-colors whitespace-nowrap ${theme.textHover}`}
                          >
                            {item.label}
                          </motion.span>
                          <span className={`mt-2.5 text-xs sm:text-sm font-bold px-3.5 py-1 rounded-full ${theme.badge}`}>
                            {item.subtitle}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          ) : (
            /* ========================================================
               KHI BẤM VÔ: ĐƯA CÁC MỤC LÊN LÀM NAVBAR + PHÂN TRANG CHI TIẾT
               ======================================================== */
            <div className="w-full flex-1 flex flex-col items-center">
              {/* TOP STICKY NAVBAR TRÊN CÙNG (Dính ở trên cùng khi cuộn màn hình) */}
              <div className="sticky top-0 z-30 w-full py-2.5 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
                  {/* 4 MỤC NAVBAR (MORPH TỪ GIỮA MÀN HÌNH LÊN) */}
                  <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto justify-center">
                    {CUSTOMER_NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <motion.button
                          key={item.id}
                          layoutId={`cust-nav-btn-${item.id}`}
                          transition={CUST_NAV_TRANSITION}
                          type="button"
                          onClick={() => setActiveTab(item.id)}
                          className={`px-3.5 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm tracking-wide flex items-center space-x-2 transition-all duration-200 cursor-pointer whitespace-nowrap border ${
                            isActive
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 dark:bg-cyan-500 dark:text-slate-950 dark:border-cyan-400 dark:shadow-cyan-400/30'
                              : 'text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800/70 border-transparent'
                          }`}
                        >
                          <motion.span
                            layoutId={`cust-nav-icon-${item.id}`}
                            transition={CUST_NAV_TRANSITION}
                            className="shrink-0"
                          >
                            <Icon className={`size-4 sm:size-4.5 ${isActive ? 'text-white dark:text-slate-950' : 'text-slate-600 dark:text-slate-400'}`} />
                          </motion.span>
                          <motion.span
                            layoutId={`cust-nav-title-${item.id}`}
                            transition={CUST_NAV_TRANSITION}
                          >
                            {item.label}
                          </motion.span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* PHÂN TRANG CHI TIẾT TỪNG MỤC (PAGE TAB CONTENT) */}
              <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
                <AnimatePresence mode="wait">
                  {/* PHÂN TRANG 1: THUÊ KHO */}
                  {activeTab === 'rent' && (
                    <motion.div
                      key="tab-rent"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
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
                      transition={{ duration: 0.4, ease: "easeOut" }}
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
                      transition={{ duration: 0.4, ease: "easeOut" }}
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
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="w-full"
                    >
                      <SupportTab />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </main>
      </LayoutGroup>

      {/* Footer for Customer Portal */}
      <div className="relative z-10">
        <SiteFooter />
      </div>

      {/* Floating Chatbot AI 24/7 Widget */}
      <ChatbotWidget />

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
