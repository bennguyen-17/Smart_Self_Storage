import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Header from '@/components/common/Header';
import StorageMap2D from '@/features/portal/components/StorageMap2D';
import BookingSidebar from '@/features/portal/components/BookingSidebar';
import MyStorageTab from '@/features/portal/components/MyStorageTab';
import DepositPaymentFlow from '@/features/portal/components/modals/DepositPaymentFlow';
import ExtendPaymentFlow from '@/features/portal/components/modals/ExtendPaymentFlow';
import CustomerProfileModal from '@/features/portal/components/modals/CustomerProfileModal';
import SupportTicketModal from '@/features/portal/components/modals/SupportTicketModal';
import ExtendContractModal from '@/features/portal/components/modals/ExtendContractModal';
import ChatbotWidget from '@/components/common/ChatbotWidget';
import SiteFooter from '@/components/common/SiteFooter';

import { useTheme } from '@/components/common/theme-provider';
import { getCurrentCustomerProfile } from '@/features/portal/services/customerService';
import { getBranches } from '@/features/portal/services/facilityService';

export default function CustomerPortal() {
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'access'
  const [facility, setFacility] = useState('HN-01');
  const [currentFloor, setCurrentFloor] = useState(1);

  // Mặc định chưa chọn ô kho nào (null)
  const [selectedUnit, setSelectedUnit] = useState(null);

  // Modals
  const [showDepositFlow, setShowDepositFlow] = useState(false);
  const [showExtendPaymentFlow, setShowExtendPaymentFlow] = useState(false);
  const [extendPaymentData, setExtendPaymentData] = useState<any>(null);
  const [depositBookingData, setDepositBookingData] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendUnitContext, setExtendUnitContext] = useState(null);

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
  const customerAvatar = customerProfile?.avatarText || (customerName !== 'Khách Hàng' ? customerName.trim().split(' ').pop()?.substring(0, 2).toUpperCase() : null);

  // Toggle giữa Sáng và Tối thống nhất hệ thống
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
      startDate: bookingPayload?.startDate || new Date().toLocaleDateString('vi-VN'),
      endDate: bookingPayload?.endDate || '',
      effectiveDays: bookingPayload?.effectiveDays || 30,
      estimatedTotalRental: bookingPayload?.estimatedTotalRental || (selectedUnit.monthlyPrice ? selectedUnit.monthlyPrice * 1 : selectedUnit.price * 30),
      depositAmount: selectedUnit.deposit
    });
    setShowDepositFlow(true);
  };

  const handleOpenExtendModal = (unitInfo) => {
    setExtendUnitContext(unitInfo);
    setShowExtendModal(true);
  };

  const handleConfirmExtendPayment = (extData) => {
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
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'dark bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header */}
      <Header
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        onOpenProfileModal={() => setShowProfileModal(true)}
      />

      {/* Main Body Container: Optimal 1280px max width & vertical centering for all screens */}
      <main className="w-full max-w-[1280px] mx-auto px-3 sm:px-5 lg:px-6 flex-1 flex flex-col justify-center py-3.5 sm:py-5">
        <div className="space-y-3 sm:space-y-3.5 w-full">
          {/* CUSTOMER DASHBOARD HEADER BANNER */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-slate-900 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 w-full"
          >
            {/* AVATAR & GREETING (Lấy động từ Database) */}
            <div className="flex items-center space-x-3 shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs sm:text-sm shadow-sm shadow-blue-500/25 shrink-0 tracking-wider">
                {customerAvatar || <i className="fa-solid fa-user-check"></i>}
              </div>
              <div>
                <h1 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                  Xin chào, <span className="text-blue-600">{customerName}</span>!
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">Hệ thống kho tự quản thông minh 24/7</p>
              </div>
            </div>

            {/* TABS */}
            <div className="inline-flex items-center p-0.5 sm:p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 gap-1 w-full sm:w-auto overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('grid')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  activeTab === 'grid'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700'
                }`}
              >
                <i className="fa-solid fa-map-location-dot text-xs"></i>
                <span>Sơ đồ 2D & Thuê kho</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('access')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  activeTab === 'access'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700'
                }`}
              >
                <i className="fa-solid fa-boxes-stacked text-xs"></i>
                <span>Kho của tôi & Mã PIN Cửa chính</span>
              </button>
            </div>

            {/* SUPPORT TICKET BUTTON */}
            <div className="flex items-center shrink-0">
              <button
                type="button"
                onClick={() => setShowSupportModal(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs transition-transform duration-200 hover:scale-103 flex items-center space-x-1.5 cursor-pointer"
              >
                <i className="fa-solid fa-headset text-xs"></i>
                <span>Gửi Hỗ Trợ / Báo Sự Cố</span>
              </button>
            </div>
          </motion.div>

          {/* TAB CONTENT WITH ANIMATION */}
          <AnimatePresence mode="wait">
            {activeTab === 'grid' ? (
              <motion.div
                key="grid-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start w-full">
                  {/* Sơ đồ kho 2D */}
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

                  {/* Sidebar Giỏ hàng & Đặt cọc */}
                  <div className="lg:col-span-4 sticky top-4">
                    <BookingSidebar
                      selectedUnit={selectedUnit}
                      onOpenDepositModal={handleOpenDepositModal}
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="access-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <MyStorageTab onOpenExtendModal={handleOpenExtendModal} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer for Customer Portal */}
      <SiteFooter />

      {/* Floating Chatbot AI 24/7 Widget */}
      <ChatbotWidget />

      {/* Modals */}
      {showProfileModal && (
        <CustomerProfileModal
          onClose={() => setShowProfileModal(false)}
          onLogout={handleLogout}
        />
      )}

      {showSupportModal && (
        <SupportTicketModal
          onClose={() => setShowSupportModal(false)}
        />
      )}

      {showExtendModal && (
        <ExtendContractModal
          unitContext={extendUnitContext}
          onClose={() => setShowExtendModal(false)}
          onConfirmPayment={handleConfirmExtendPayment}
        />
      )}

              {showExtendPaymentFlow && extendPaymentData && (
          <ExtendPaymentFlow
            initialBookingData={extendPaymentData}
            onClose={() => setShowExtendPaymentFlow(false)}
            onFinish={() => {
              setShowExtendPaymentFlow(false);
              setMapRefreshTrigger(prev => prev + 1);
            }}
          />
        )}

        {/* VietQR Deposit Flow Modal */}
      {showDepositFlow && depositBookingData && (
        <DepositPaymentFlow
          initialBookingData={depositBookingData}
          onClose={() => setShowDepositFlow(false)}
          onFinish={() => {
            setShowDepositFlow(false);
            setSelectedUnit(null);
            setMapRefreshTrigger(prev => prev + 1);
            setActiveTab('access');
          }}
        />
      )}
    </div>
  );
}