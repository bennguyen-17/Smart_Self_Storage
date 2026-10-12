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
import RentStorageWizardModal from '@/features/portal/components/modals/RentStorageWizardModal';
import ExtendContractModal from '@/features/portal/components/modals/ExtendContractModal';
import GatePinModal from '@/features/portal/components/modals/GatePinModal';
import ChatbotWidget from '@/components/common/ChatbotWidget';
import SiteFooter from '@/components/common/SiteFooter';

import { useTheme } from '@/components/common/theme-provider';
import { getCurrentCustomerProfile } from '@/features/portal/services/customerService';
import { getBranches } from '@/features/portal/services/facilityService';

interface CustomerPortalProps {
  initialTab?: 'home' | 'grid' | 'access';
}

export default function CustomerPortal({ initialTab = 'home' }: CustomerPortalProps = {}) {
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [showRentModal, setShowRentModal] = useState(initialTab === 'grid');
  const [showMyStorageModal, setShowMyStorageModal] = useState(initialTab === 'access');
  const [showGatePinModal, setShowGatePinModal] = useState(false);

  useEffect(() => {
    if (initialTab === 'grid') setShowRentModal(true);
    if (initialTab === 'access') setShowGatePinModal(true);
  }, [initialTab]);

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
    <div className={`relative min-h-screen flex flex-col ${isDarkMode ? 'dark bg-slate-950 text-white' : 'bg-slate-950 text-white'}`}>
      {/* Background Image with Dark & Cyber Gradient Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none z-0"
        style={{ backgroundImage: `url('/images/tech-storage-bg.jpg')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-[#031525]/60 to-slate-950/90 backdrop-blur-[0.5px]" />
      </div>

      {/* Header */}
      <div className="relative z-10">
        <Header
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          onOpenProfileModal={() => setShowProfileModal(true)}
        />
      </div>

      {/* Main Body Container: Hero Banner Content */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col justify-center items-center py-12 sm:py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col items-center w-full"
        >
          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase text-center leading-tight drop-shadow-md">
            HỆ THỐNG <span className="text-cyan-400 drop-shadow-[0_0_25px_rgba(34,211,238,0.6)]">KHO TỰ QUẢN</span>
            <br />
            THÔNG MINH <span className="text-cyan-400 drop-shadow-[0_0_25px_rgba(34,211,238,0.6)]">24/7</span>
          </h1>

          {/* Customer Greeting */}
          <div className="flex items-center justify-center mt-4 sm:mt-6 text-sm sm:text-base font-semibold text-slate-300">
            <span>Xin chào, <span className="text-cyan-300 font-extrabold drop-shadow-[0_0_12px_rgba(34,211,238,0.45)]">{customerName}</span></span>
          </div>

          {/* 4 Action Buttons */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 w-full max-w-4xl mt-8 sm:mt-10">
            {/* 1. Thuê kho */}
            <button
              type="button"
              onClick={() => setShowRentModal(true)}
              className="px-5 py-4 rounded-2xl bg-cyan-950/45 hover:bg-cyan-900/50 backdrop-blur-md border border-cyan-400/60 hover:border-cyan-300 text-cyan-200 hover:text-white font-bold text-sm sm:text-base tracking-wide transition-all duration-300 shadow-[0_0_15px_rgba(34,211,238,0.18)] hover:shadow-[0_0_25px_rgba(34,211,238,0.45)] hover:scale-[1.03] cursor-pointer text-center group"
            >
              <span className="drop-shadow-[0_0_8px_rgba(34,211,238,0.35)] group-hover:drop-shadow-[0_0_12px_rgba(34,211,238,0.7)]">
                Thuê kho
              </span>
            </button>

            {/* 2. Kho của tôi */}
            <button
              type="button"
              onClick={() => setShowMyStorageModal(true)}
              className="px-5 py-4 rounded-2xl bg-cyan-950/45 hover:bg-cyan-900/50 backdrop-blur-md border border-cyan-400/60 hover:border-cyan-300 text-cyan-200 hover:text-white font-bold text-sm sm:text-base tracking-wide transition-all duration-300 shadow-[0_0_15px_rgba(34,211,238,0.18)] hover:shadow-[0_0_25px_rgba(34,211,238,0.45)] hover:scale-[1.03] cursor-pointer text-center group"
            >
              <span className="drop-shadow-[0_0_8px_rgba(34,211,238,0.35)] group-hover:drop-shadow-[0_0_12px_rgba(34,211,238,0.7)]">
                Kho của tôi
              </span>
            </button>

            {/* 3. Mã PIN mở cửa */}
            <button
              type="button"
              onClick={() => setShowGatePinModal(true)}
              className="px-5 py-4 rounded-2xl bg-cyan-950/45 hover:bg-cyan-900/50 backdrop-blur-md border border-cyan-400/60 hover:border-cyan-300 text-cyan-200 hover:text-white font-bold text-sm sm:text-base tracking-wide transition-all duration-300 shadow-[0_0_15px_rgba(34,211,238,0.18)] hover:shadow-[0_0_25px_rgba(34,211,238,0.45)] hover:scale-[1.03] cursor-pointer text-center group"
            >
              <span className="drop-shadow-[0_0_8px_rgba(34,211,238,0.35)] group-hover:drop-shadow-[0_0_12px_rgba(34,211,238,0.7)]">
                Mã PIN mở cửa
              </span>
            </button>

            {/* 4. Gửi hỗ trợ */}
            <button
              type="button"
              onClick={() => setShowSupportModal(true)}
              className="px-5 py-4 rounded-2xl bg-cyan-950/45 hover:bg-cyan-900/50 backdrop-blur-md border border-cyan-400/60 hover:border-cyan-300 text-cyan-200 hover:text-white font-bold text-sm sm:text-base tracking-wide transition-all duration-300 shadow-[0_0_15px_rgba(34,211,238,0.18)] hover:shadow-[0_0_25px_rgba(34,211,238,0.45)] hover:scale-[1.03] cursor-pointer text-center group"
            >
              <span className="drop-shadow-[0_0_8px_rgba(34,211,238,0.35)] group-hover:drop-shadow-[0_0_12px_rgba(34,211,238,0.7)]">
                Gửi hỗ trợ
              </span>
            </button>
          </div>
        </motion.div>
      </main>

      {/* Footer for Customer Portal */}
      <div className="relative z-10">
        <SiteFooter />
      </div>

      {/* Floating Chatbot AI 24/7 Widget */}
      <ChatbotWidget />

      {/* 1. Modal Thuê kho 4 bước (Dạng Popup Wizard) */}
      <RentStorageWizardModal
        isOpen={showRentModal}
        onClose={() => setShowRentModal(false)}
        facility={facility}
        onFacilityChange={setFacility}
        branches={branches}
        onSuccess={() => {
          setShowRentModal(false);
          setMapRefreshTrigger(prev => prev + 1);
          setShowMyStorageModal(true);
        }}
      />

      {/* 2. Modal Kho của tôi (Dạng Popup Overlay) */}
      {showMyStorageModal && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 flex items-center justify-center p-3 sm:p-5"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowMyStorageModal(false);
          }}
        >
          <div className="dark border border-slate-700/80 w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl shadow-2xl modal-animate-pop bg-slate-900 text-white overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 shrink-0 bg-slate-900/95">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-lg border border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.25)]">
                  <i className="fa-solid fa-boxes-stacked"></i>
                </div>
                <div>
                  <h2 className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                    KHO CỦA TÔI
                  </h2>
                  <p className="text-xs text-slate-400">
                    Quản lý danh sách hợp đồng ô kho hiện có và thủ tục gia hạn
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMyStorageModal(false)}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer border border-slate-700"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* Modal Body: Scrollable */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <MyStorageTab 
                onOpenExtendModal={handleOpenExtendModal} 
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal Mã PIN Cửa Chính 24/7 (Được tách riêng độc lập) */}
      <GatePinModal
        isOpen={showGatePinModal}
        onClose={() => setShowGatePinModal(false)}
      />

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
            setShowMyStorageModal(true);
          }}
        />
      )}
    </div>
  );
}
