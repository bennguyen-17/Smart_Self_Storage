import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import StorageMap2D from '../components/StorageMap2D';
import BookingSidebar from '../components/BookingSidebar';
import MyStorageTab from '../components/MyStorageTab';
import DepositPaymentFlow from '../components/DepositPaymentFlow';
import CustomerProfileModal from '../components/CustomerProfileModal';
import SupportTicketModal from '../components/SupportTicketModal';
import ExtendContractModal from '../components/ExtendContractModal';
import ChatbotWidget from '../components/ChatbotWidget';

export default function CustomerPortal() {
  const [isDarkMode, setIsDarkMode] = useState(false);
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

  // Mặc định ép ứng dụng chạy ở Giao diện Sáng (Light Mode) chuẩn nền trắng khi vừa mở
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.body.className = "light-mode antialiased min-h-screen flex flex-col bg-slate-50 text-slate-900";
  }, []);

  // Toggle giữa Sáng và Tối
  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      document.body.className = "dark-mode antialiased min-h-screen flex flex-col bg-slate-950 text-slate-100 dark";
    } else {
      document.documentElement.classList.remove('dark');
      document.body.className = "light-mode antialiased min-h-screen flex flex-col bg-slate-50 text-slate-900";
    }
  };

  const handleOpenDepositModal = () => {
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
      unitSize: `Size ${selectedUnit.size} (${selectedUnit.dim})`,
      startDate: new Date().toLocaleDateString('vi-VN'),
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
      setShowProfileModal(false);
      alert("Đã đăng xuất tài khoản thành công!");
      window.location.reload();
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

      {/* Main Body Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 w-full py-10">
        <div className="space-y-6">
          {/* CUSTOMER DASHBOARD HEADER BANNER */}
          <div className="bg-white dark:bg-slate-900 px-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 py-6">
            {/* AVATAR & GREETING */}
            <div className="flex items-center space-x-3.5 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-blue-500/20 shrink-0">
                <i className="fa-solid fa-user-check"></i>
              </div>
              <div>
                <h1 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                  Xin chào, <span className="text-blue-600">Nguyễn Văn Khách</span>! 👋
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Hệ thống kho tự quản thông minh 24/7</p>
              </div>
            </div>

            {/* TABS */}
            <div className="inline-flex items-center p-1.5 rounded-2xl gap-1.5 w-full sm:w-auto overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('grid')}
                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'grid'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <i className="fa-solid fa-map-location-dot text-xs"></i>
                <span>Sơ đồ 2D & Thuê kho</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('access')}
                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'access'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800'
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
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition flex items-center space-x-2 cursor-pointer"
              >
                <i className="fa-solid fa-headset text-sm"></i>
                <span>Gửi Hỗ Trợ / Báo Sự Cố</span>
              </button>
            </div>
          </div>

          {/* TAB 1: SƠ ĐỒ 2D & THUÊ KHO */}
          {activeTab === 'grid' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
                {/* Sơ đồ kho 2D */}
                <div className="lg:col-span-8">
                  <StorageMap2D
                    facility={facility}
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
                <div className="lg:col-span-4">
                  <BookingSidebar
                    selectedUnit={selectedUnit}
                    onOpenDepositModal={handleOpenDepositModal}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KHO CỦA TÔI & MÃ PIN CỬA CHÍNH */}
          {activeTab === 'access' && (
            <MyStorageTab onOpenExtendModal={handleOpenExtendModal} />
          )}
        </div>
      </main>

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
            setActiveTab('access');
          }}
        />
      )}
    </div>
  );
}