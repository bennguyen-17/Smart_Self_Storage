import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Header from '../components/Header';
import StorageMap2D from '../components/StorageMap2D';
import BookingSidebar from '../components/BookingSidebar';
import MyStorageTab from '../components/MyStorageTab';
import DepositPaymentFlow from '../components/DepositPaymentFlow';
import CustomerProfileModal from '../components/CustomerProfileModal';
import SupportTicketModal from '../components/SupportTicketModal';
import ExtendContractModal from '../components/ExtendContractModal';
import ChatbotWidget from '../components/ChatbotWidget';
import SiteFooter from '../components/SiteFooter';

import { useTheme } from '@/components/theme-provider';

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
  const [depositBookingData, setDepositBookingData] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendUnitContext, setExtendUnitContext] = useState(null);

  const [mapRefreshTrigger, setMapRefreshTrigger] = useState(0);

  // Toggle giữa Sáng và Tối thống nhất hệ thống
  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  const handleOpenDepositModal = (bookingPayload?: Record<string, any>) => {
    if (!selectedUnit) return;
    const facilityNameMap = {
      'HN-01': 'SmartStorage Cầu Giấy (HN-01)',
      'HN-02': 'SmartStorage Thanh Xuân (HN-02)',
      'HCM-01': 'SmartStorage Quận 1 (HCM-01)',
      'HCM-02': 'SmartStorage Quận 7 (HCM-02)',
      'HCM-03': 'SmartStorage Thủ Đức (HCM-03)',
      'DN-01': 'SmartStorage Hải Châu (DN-01)',
      'CT-01': 'SmartStorage Ninh Kiều (CT-01)'
    };

    setDepositBookingData({
      facilityName: facilityNameMap[facility] || 'SmartStorage Cầu Giấy (HN-01)',
      unitId: selectedUnit.id,
      unitSize: `Size ${selectedUnit.size}`,
      startDate: bookingPayload?.startDate || new Date().toLocaleDateString('vi-VN'),
      endDate: bookingPayload?.endDate || '',
      effectiveDays: bookingPayload?.effectiveDays || 360,
      estimatedTotalRental: bookingPayload?.estimatedTotalRental || (selectedUnit.monthlyPrice ? selectedUnit.monthlyPrice * 12 : selectedUnit.price * 360),
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

      {/* Main Body Container: Full width expansion */}
      <main className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 flex-1 py-6 sm:py-8">
        <div className="space-y-6 w-full">
          {/* CUSTOMER DASHBOARD HEADER BANNER */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-slate-900 px-6 sm:px-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5 py-6 sm:py-7 w-full"
          >
            {/* AVATAR & GREETING */}
            <div className="flex items-center space-x-4 shrink-0">
              <div className="w-13 h-13 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-blue-500/25 shrink-0">
                <i className="fa-solid fa-user-check"></i>
              </div>
              <div>
                <h1 className="font-extrabold text-lg sm:text-xl md:text-2xl text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                  Xin chào, <span className="text-blue-600">Nguyễn Văn Khách</span>!
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Hệ thống kho tự quản thông minh 24/7</p>
              </div>
            </div>

            {/* TABS */}
            <div className="inline-flex items-center p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 gap-2 w-full sm:w-auto overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('grid')}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm sm:text-base flex items-center space-x-2 transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  activeTab === 'grid'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700'
                }`}
              >
                <i className="fa-solid fa-map-location-dot"></i>
                <span>Sơ đồ 2D & Thuê kho</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('access')}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm sm:text-base flex items-center space-x-2 transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  activeTab === 'access'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700'
                }`}
              >
                <i className="fa-solid fa-boxes-stacked"></i>
                <span>Kho của tôi & Mã PIN Cửa chính</span>
              </button>
            </div>

            {/* SUPPORT TICKET BUTTON */}
            <div className="flex items-center shrink-0">
              <button
                type="button"
                onClick={() => setShowSupportModal(true)}
                className="px-5 py-2.5 rounded-xl text-sm sm:text-base font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/25 transition-transform duration-200 hover:scale-103 flex items-center space-x-2 cursor-pointer"
              >
                <i className="fa-solid fa-headset text-base"></i>
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
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-12 gap-6 items-start w-full">
                  {/* Sơ đồ kho 2D */}
                  <div className="lg:col-span-8 xl:col-span-9">
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
                  <div className="lg:col-span-4 xl:col-span-3 sticky top-6">
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