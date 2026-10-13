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

const CUSTOMER_NAV_ITEMS = [
  {
    id: 'rent' as const,
    label: 'Thuê kho',
    icon: Warehouse,
  },
  {
    id: 'my-storage' as const,
    label: 'Kho của tôi',
    icon: Boxes,
  },
  {
    id: 'gate-pin' as const,
    label: 'Mã PIN mở cửa',
    icon: KeyRound,
  },
  {
    id: 'support' as const,
    label: 'Gửi hỗ trợ',
    icon: Headset,
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
            <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col justify-center items-center py-12 sm:py-20 text-center">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="flex flex-col items-center w-full"
              >
                {/* Main Headline */}
                <h1 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight text-slate-900 dark:text-white uppercase text-center leading-tight drop-shadow-sm dark:drop-shadow-md">
                  HỆ THỐNG <span className="text-blue-600 dark:text-cyan-400 drop-shadow-[0_0_20px_rgba(37,99,235,0.25)] dark:drop-shadow-[0_0_25px_rgba(34,211,238,0.6)]">KHO TỰ QUẢN</span>
                  <br />
                  THÔNG MINH <span className="text-blue-600 dark:text-cyan-400 drop-shadow-[0_0_20px_rgba(37,99,235,0.25)] dark:drop-shadow-[0_0_25px_rgba(34,211,238,0.6)]">24/7</span>
                </h1>

                {/* Customer Greeting */}
                <div className="flex items-center justify-center mt-4 sm:mt-6 text-sm sm:text-base font-semibold text-slate-600 dark:text-slate-300">
                  <span>Xin chào, <span className="text-blue-600 dark:text-cyan-300 font-extrabold">{customerName}</span></span>
                </div>

                {/* 4 Action Buttons in Grid (Center Screen) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full max-w-5xl mt-8 sm:mt-12">
                  {CUSTOMER_NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <motion.button
                        key={item.id}
                        layoutId={`cust-nav-btn-${item.id}`}
                        transition={CUST_NAV_TRANSITION}
                        type="button"
                        onClick={() => setActiveTab(item.id)}
                        className="px-6 py-5 sm:px-8 sm:py-6 rounded-2xl bg-gradient-to-br from-white/70 via-slate-50/50 to-sky-100/40 hover:from-white/90 hover:via-sky-50/60 hover:to-blue-100/60 dark:from-transparent dark:to-transparent dark:bg-cyan-950/45 dark:hover:bg-cyan-900/50 backdrop-blur-xl border-2 border-sky-300/60 hover:border-blue-400 dark:border-cyan-400/60 dark:hover:border-cyan-300 text-slate-800 hover:text-blue-950 dark:text-cyan-200 dark:hover:text-white font-extrabold text-base sm:text-lg lg:text-xl tracking-wide transition-all duration-300 shadow-lg shadow-sky-950/5 hover:shadow-xl hover:shadow-blue-500/15 dark:shadow-[0_0_20px_rgba(34,211,238,0.22)] dark:hover:shadow-[0_0_30px_rgba(34,211,238,0.55)] hover:scale-[1.04] cursor-pointer text-center group flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-3"
                      >
                        <motion.span
                          layoutId={`cust-nav-icon-${item.id}`}
                          transition={CUST_NAV_TRANSITION}
                          className="shrink-0 p-2 rounded-xl bg-blue-500/10 dark:bg-transparent text-blue-600 group-hover:text-blue-700 dark:text-cyan-400 dark:group-hover:text-cyan-200 transition-colors"
                        >
                          <Icon className="size-5 sm:size-6" />
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
              </motion.div>
            </div>
          ) : (
            /* ========================================================
               KHI BẤM VÔ: ĐƯA CÁC MỤC LÊN LÀM NAVBAR + PHÂN TRANG CHI TIẾT
               ======================================================== */
            <div className="w-full flex-1 flex flex-col items-center">
              {/* TOP STICKY NAVBAR TRÊN CÙNG (Dính ở trên cùng khi cuộn màn hình) */}
              <div className="sticky top-0 z-30 w-full bg-white/75 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 py-2.5 shadow-sm dark:shadow-md transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
                  {/* 4 MỤC NAVBAR (MORPH TỪ GIỮA MÀN HÌNH LÊN) */}
                  <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto p-1 bg-slate-100/80 dark:bg-slate-950/60 rounded-2xl border border-sky-200/60 dark:border-slate-800/80 justify-center backdrop-blur-md">
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
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-400/35 dark:shadow-[0_0_12px_rgba(34,211,238,0.12)]'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800/60 border-transparent'
                          }`}
                        >
                          <motion.span
                            layoutId={`cust-nav-icon-${item.id}`}
                            transition={CUST_NAV_TRANSITION}
                            className="shrink-0"
                          >
                            <Icon className={`size-4 sm:size-4.5 ${isActive ? 'text-white dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400'}`} />
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
