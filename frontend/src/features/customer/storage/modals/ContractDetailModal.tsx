import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatDate } from '@/lib/format';
import html2canvasFn from 'html2canvas-pro';
import { jsPDF as jsPDFClass } from 'jspdf';

// Hàm chuẩn hóa tương thích ESM / CJS cho môi trường Vite
const getHtml2Canvas = () => {
  const mod: any = html2canvasFn;
  if (typeof mod === 'function') return mod;
  if (mod?.default && typeof mod.default === 'function') return mod.default;
  return mod;
};

const getJsPDF = () => {
  const mod: any = jsPDFClass;
  if (typeof mod === 'function') return mod;
  if (mod?.jsPDF && typeof mod.jsPDF === 'function') return mod.jsPDF;
  if (mod?.default && typeof mod.default === 'function') return mod.default;
  return mod;
};

export default function ContractDetailModal({
  contract,
  onClose,
}: {
  contract: any;
  onClose: () => void;
}) {
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!contract) return null;
  if (typeof document === 'undefined') return null;

  // 1. Trích xuất thông tin hợp đồng & cơ sở
  const unitCode = contract.unitCode || contract.unitId || '';
  const contractCode =
    contract.contractCode || contract.reservationCode || contract.bookingCode || (contract.contractId ? `CTR-${contract.contractId}` : (contract.rawContractId ? `CTR-${contract.rawContractId}` : ''));
  const reservationCode = contract.reservationCode || contract.bookingCode || contractCode;

  // Bản đồ cơ sở toàn quốc chuẩn hóa
  const FACILITY_MAP: Record<string, { name: string; address: string; city: string; email: string }> = {
    HN01: {
      name: 'SmartStorage Cầu Giấy (HN01)',
      address: 'Số 391 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội',
      city: 'Hà Nội',
      email: 'caugiay.hn01@smartstorage.vn',
    },
    HN02: {
      name: 'SmartStorage Thanh Xuân (HN02)',
      address: 'Số 120 Khuất Duy Tiến, Phường Nhân Chính, Quận Thanh Xuân, Hà Nội',
      city: 'Hà Nội',
      email: 'thanhxuan.hn02@smartstorage.vn',
    },
    HCM01: {
      name: 'SmartStorage Quận 1 (HCM01)',
      address: 'Số 123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      city: 'TP. Hồ Chí Minh',
      email: 'quan1.hcm01@smartstorage.vn',
    },
    HCM02: {
      name: 'SmartStorage Quận 7 (HCM02)',
      address: 'Số 456 Nguyễn Thị Thập, Phường Tân Phú, Quận 7, TP. Hồ Chí Minh',
      city: 'TP. Hồ Chí Minh',
      email: 'quan7.hcm02@smartstorage.vn',
    },
    HCM03: {
      name: 'SmartStorage Thủ Đức (HCM03)',
      address: 'Số 789 Xa Lộ Hà Nội, Phường Bình Thọ, TP. Thủ Đức, TP. Hồ Chí Minh',
      city: 'TP. Hồ Chí Minh',
      email: 'thuduc.hcm03@smartstorage.vn',
    },
    DN01: {
      name: 'SmartStorage Hải Châu (DN01)',
      address: 'Số 68 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu, Đà Nẵng',
      city: 'Đà Nẵng',
      email: 'haichau.dn01@smartstorage.vn',
    },
    CT01: {
      name: 'SmartStorage Ninh Kiều (CT01)',
      address: 'Số 12 Đại lộ Hòa Bình, Phường An Lạc, Quận Ninh Kiều, Cần Thơ',
      city: 'Cần Thơ',
      email: 'ninhkieu.ct01@smartstorage.vn',
    },
  };

  const facPrefix = String(unitCode || contractCode).split('-')[0].replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const matchedFac = FACILITY_MAP[facPrefix];

  const branchName = contract.branchName || contract.facilityName || matchedFac?.name || 'Smart Self Storage';
  const contractCity = contract.city || matchedFac?.city || 'Việt Nam';
  const branchAddress = contract.branchAddress || contract.facilityAddress || matchedFac?.address || 'Hệ thống Smart Self Storage';
  const branchEmail = contract.branchEmail || matchedFac?.email || 'support@smartstorage.vn';

  // Thời hạn
  const rawStart = contract.startDate || contract.reservationStartDate || contract.checkInDate;
  const rawEnd = contract.expiryDate || contract.endDate || contract.reservationEndDate;
  const startDate = rawStart ? formatDate(rawStart) : '—';
  const endDate = rawEnd ? formatDate(rawEnd) : '—';

  const startMs = rawStart ? new Date(rawStart).getTime() : Date.now();
  const endMs = rawEnd ? new Date(rawEnd).getTime() : startMs + 30 * 86400000;
  const diffDays = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)));
  const rentalDurationDays = contract.durationDays || diffDays || 30;

  // Trạng thái hợp đồng
  const isPending =
    contract.status === 'PENDING_CHECKIN' ||
    contract.contractStatus === 'PENDING_CHECKIN' ||
    contract.reservationStatus === 'PENDING';

  // Chi phí
  const rentalFee = Number(contract.rentalFee ?? contract.rentalAmount ?? contract.depRemainingAmount ?? 0);
  const depositFee = Number(contract.depositFee ?? contract.depositAmount ?? contract.depPaidAmount ?? 0);
  const totalAmount = Number(contract.totalAmount ?? contract.depAmount ?? (rentalFee + depositFee));
  const paidDepositAmount = Number(contract.paidAmount ?? contract.depPaidAmount ?? (isPending ? depositFee : totalAmount));
  const remainingCheckinAmount = Number(contract.remainingAmount ?? contract.depRemainingAmount ?? (isPending ? rentalFee : 0));

  // Lấy thông tin khách hàng từ contract hoặc fallback từ auth_session
  let customerName = contract.customerName || contract.fullName || contract.name;
  let customerPhone = contract.customerPhone || contract.phone;
  let customerEmail = contract.customerEmail || contract.email;
  let citizenId = contract.customerIdNumber || contract.customerCccd || contract.citizenId || contract.idNumber || contract.identityNumber || contract.cccd;

  // Fallback từ auth_session hoặc user trong session/localStorage
  if (!customerName || !customerPhone || !customerEmail || !citizenId) {
    try {
      const rawAuth = localStorage.getItem('auth_session') || sessionStorage.getItem('auth_session');
      if (rawAuth) {
        const parsed = JSON.parse(rawAuth);
        const u = parsed.user || parsed;
        if (!customerName && (u.fullName || u.name)) customerName = u.fullName || u.name;
        if (!customerPhone && u.phone) customerPhone = u.phone;
        if (!customerEmail && u.email) customerEmail = u.email;
        if (!citizenId && (u.identityNumber || u.cccd || u.citizenId || u.customerIdNumber)) {
          citizenId = u.identityNumber || u.cccd || u.citizenId || u.customerIdNumber;
        }
      }
    } catch (e) { }

    try {
      const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (!customerName && (u.fullName || u.name)) customerName = u.fullName || u.name;
        if (!customerPhone && u.phone) customerPhone = u.phone;
        if (!customerEmail && u.email) customerEmail = u.email;
        if (!citizenId && (u.identityNumber || u.cccd || u.citizenId || u.customerIdNumber)) {
          citizenId = u.identityNumber || u.cccd || u.citizenId || u.customerIdNumber;
        }
      }
    } catch (e) { }
  }

  customerName = customerName || 'Chưa cập nhật';
  customerPhone = customerPhone || 'Chưa cập nhật';
  customerEmail = customerEmail || 'Chưa cập nhật';
  citizenId = citizenId || 'Chưa cập nhật';

  // Ngày lập văn bản
  const contractDateObj = contract.createdDate
    ? new Date(contract.createdDate)
    : rawStart
      ? new Date(rawStart)
      : new Date();
  const todayDate = new Date();
  const signDay = !isNaN(contractDateObj.getDate()) ? String(contractDateObj.getDate()).padStart(2, '0') : String(todayDate.getDate()).padStart(2, '0');
  const signMonth = !isNaN(contractDateObj.getMonth()) ? String(contractDateObj.getMonth() + 1).padStart(2, '0') : String(todayDate.getMonth() + 1).padStart(2, '0');
  const signYear = !isNaN(contractDateObj.getFullYear()) ? contractDateObj.getFullYear() : todayDate.getFullYear();

  // Kích thước, Diện tích & Loại hình kho từ dữ liệu thực tế
  const rawDimensions = contract.unitDimensions || contract.dimensions || contract.unitSize || (contract.size?.includes('m') ? contract.size : null);
  let unitDimensions = rawDimensions || '—';
  let unitArea = contract.unitArea || contract.area || '';

  // Tính diện tích tự động từ dimensions nếu có dạng "XxYxZ" (vd: "1.5m x 2.0m x 2.0m" -> 1.5 * 2.0 = 3.0 m²)
  if (!unitArea && unitDimensions !== '—') {
    const parts = unitDimensions.split('x').map((s: string) => parseFloat(s.replace(/[^0-9.]/g, ''))).filter((n: number) => !isNaN(n));
    if (parts.length >= 2) {
      const areaCalc = (parts[0] * parts[1]).toFixed(1);
      unitArea = `${areaCalc} m²`;
    }
  }
  if (!unitArea) {
    unitArea = contract.unitTypeName?.includes('m²') ? (contract.unitTypeName.match(/([0-9.]+)\s*m²/)?.[0] || '—') : '—';
  }

  const isClimate =
    Boolean(contract.isClimate) ||
    contract.storageCondition === 'CLIMATE_CONTROLLED' ||
    contract.storageType === 'CLIMATE_CONTROLLED' ||
    String(contract.unitTypeName || '').toUpperCase().includes('CLIMATE') ||
    String(contract.unitTypeName || '').toLowerCase().includes('mát');

  const loaiHinhKho = isClimate
    ? 'Kho mát kiểm soát vi khí hậu (22 - 25°C, độ ẩm < 50%)'
    : 'Kho lưu trữ tiêu chuẩn tự quản (Standard Self-Storage)';

  const formatDateTime = (val?: string | Date) => {
    if (!val) return '—';
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const rawPaidAt = contract.paidAt || contract.paymentPaidAt || contract.depositDate || contract.createdAt || contract.createdDate;
  const paymentTimeStr = rawPaidAt ? formatDateTime(rawPaidAt) : (startDate !== '—' ? `${startDate} 09:00:00` : '—');
  const paymentTxnCode = contract.transactionCode || contract.paymentTxnCode || contract.invoiceNumber || (contract.reservationCode ? `TXN-${contract.reservationCode}` : '—');

  const [isDownloading, setIsDownloading] = useState(false);

  // Tải trực tiếp file PDF chuẩn 3 trang chất lượng cao
  const handleDownloadPdf = async () => {
    const sourceElement = printRef.current;
    if (!sourceElement || isDownloading) return;

    setIsDownloading(true);
    let renderContainer: HTMLDivElement | null = null;

    try {
      const html2canvas = getHtml2Canvas();
      const JsPDF = getJsPDF();

      if (typeof html2canvas !== 'function' || typeof JsPDF !== 'function') {
        throw new Error('Thư viện tạo PDF chưa sẵn sàng trên trình duyệt');
      }

      const targetWidth = 800; // Khổ A4 tiêu chuẩn 800px

      renderContainer = document.createElement('div');
      renderContainer.style.position = 'fixed';
      renderContainer.style.left = '0';
      renderContainer.style.top = '0';
      renderContainer.style.width = `${targetWidth}px`;
      renderContainer.style.zIndex = '-99999';
      renderContainer.style.opacity = '0';
      renderContainer.style.pointerEvents = 'none';
      renderContainer.style.overflow = 'visible';

      const clone = sourceElement.cloneNode(true) as HTMLElement;
      clone.style.width = `${targetWidth}px`;
      clone.style.maxWidth = `${targetWidth}px`;
      clone.style.height = 'auto';
      clone.style.minHeight = 'auto';
      clone.style.overflow = 'visible';
      clone.style.boxShadow = 'none';
      clone.style.border = 'none';

      renderContainer.appendChild(clone);
      document.body.appendChild(renderContainer);

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: targetWidth,
      });

      const pdf = new JsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const printableWidth = pdfWidth - margin * 2;
      const printableHeight = pdfHeight - margin * 2;

      const pageHeightPx = (canvas.width * printableHeight) / printableWidth;
      const totalPages = Math.ceil(canvas.height / pageHeightPx);

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage();

        const sourceY = i * pageHeightPx;
        const sourceHeight = Math.min(pageHeightPx, canvas.height - sourceY);

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;

        const pageCtx = pageCanvas.getContext('2d');
        if (pageCtx) {
          pageCtx.fillStyle = '#ffffff';
          pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          pageCtx.drawImage(
            canvas,
            0,
            sourceY,
            canvas.width,
            sourceHeight,
            0,
            0,
            canvas.width,
            sourceHeight
          );

          const pageData = pageCanvas.toDataURL('image/jpeg', 0.96);
          const pageImgHeightMm = (sourceHeight * printableWidth) / canvas.width;
          pdf.addImage(pageData, 'JPEG', margin, margin, printableWidth, pageImgHeightMm);
        }
      }

      const cleanName = String(contractCode).replace(/[^a-zA-Z0-9_-]/g, '_');
      pdf.save(`Hop_Dong_Thue_Kho_${cleanName}.pdf`);
    } catch (err: any) {
      console.error('Lỗi xuất file PDF:', err);
      alert(`Không thể tải file PDF: ${err?.message || 'Lỗi hệ thống'}. Vui lòng thử lại!`);
    } finally {
      if (renderContainer && document.body.contains(renderContainer)) {
        document.body.removeChild(renderContainer);
      }
      setIsDownloading(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[9999] overflow-y-auto overscroll-contain"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="min-h-full w-full flex flex-col items-center justify-start p-2.5 sm:p-6 pt-4 pb-12 sm:pb-16"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Style in ấn */}
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            #contract-a4-document, #contract-a4-document * { visibility: visible !important; }
            #contract-a4-document {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 18mm 15mm !important;
              box-shadow: none !important;
              border: none !important;
              background: #ffffff !important;
              color: #000000 !important;
            }
            .contract-no-print { display: none !important; }
          }
        `}</style>

        {/* 1. THANH ĐIỀU KHIỂN NỔI */}
        <div className="contract-no-print w-full max-w-4xl bg-slate-900 text-white rounded-2xl shadow-xl px-4 py-3 sm:px-6 sm:py-3.5 mb-4 flex flex-wrap items-center justify-between gap-3 border border-slate-800 shrink-0 sticky top-2 z-30 backdrop-blur-md bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
              <i className="fa-solid fa-file-contract text-lg"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-white tracking-wide">
                  {isPending ? 'Thỏa thuận đặt cọc & giữ chỗ' : 'Hợp đồng thuê kho điện tử'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase ${isPending
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                  {isPending ? 'Đang giữ chỗ' : 'Có hiệu lực'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Mã HĐ: <strong className="text-slate-200">{contractCode}</strong> · Khách hàng: <strong className="text-slate-200">{customerName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              title="Tải văn bản PDF 3 trang chuẩn"
            >
              {isDownloading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin text-sm"></i>
                  <span>Đang xuất PDF...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-file-pdf text-sm text-red-300"></i>
                  <span>Tải PDF</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Đóng văn bản (Esc)"
            >
              <i className="fa-solid fa-xmark text-base"></i>
            </button>
          </div>
        </div>

        {/* 2. KHỔ GIẤY VĂN BẢN A4 (BÁM SÁT 100% TEMPLATE CHUẨN 3 TRANG) */}
        <div
          id="contract-a4-document"
          ref={printRef}
          className="w-full max-w-4xl bg-white text-black shadow-2xl p-8 sm:p-14 border border-neutral-300 relative font-serif leading-relaxed text-xs sm:text-[13px] print:shadow-none print:border-none print:p-0 shrink-0"
        >
          <div className="space-y-6">

            {/* HEADER: QUỐC HIỆU & TIÊU NGỮ */}
            <div className="text-center space-y-1 pb-3">
              <h4 className="font-serif font-bold text-xs sm:text-sm uppercase tracking-wider text-black">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </h4>
              <p className="font-serif italic text-xs text-black font-semibold">
                Độc lập – Tự do – Hạnh phúc
              </p>
              <div className="w-32 h-[1px] bg-black mx-auto mt-1 mb-2"></div>
              <p className="font-serif italic text-[11px] text-neutral-800 pt-0.5">
                {contractCity}, ngày {signDay} tháng {signMonth} năm {signYear}
              </p>
            </div>

            {/* TIÊU ĐỀ HỢP ĐỒNG */}
            <div className="text-center pt-1 pb-2">
              <h2 className="font-serif font-bold text-lg sm:text-2xl uppercase tracking-tight text-black">
                {isPending
                  ? 'THỎA THUẬN ĐẶT CỌC & GIỮ CHỖ THUÊ KHO'
                  : 'HỢP ĐỒNG THUÊ KHO LƯU TRỮ TỰ QUẢN'}
              </h2>
              <p className="font-serif text-xs sm:text-sm text-neutral-800 tracking-wider mt-1">
                Số: <span className="font-mono font-bold">{contractCode}</span>
              </p>
            </div>

            {/* THÔNG TIN HAI BÊN */}
            <div className="space-y-3.5 text-xs sm:text-[13px] pt-1 text-black">
              <div>
                <p className="font-bold uppercase tracking-wide">
                  BÊN CHO THUÊ (BÊN A):
                </p>
                <div className="pl-4 pt-1 space-y-0.5 text-neutral-900">
                  <p>• <strong>Tên đơn vị:</strong> CÔNG TY CỔ PHẦN SMART SELF STORAGE</p>
                  <p>• <strong>Cơ sở phụ trách:</strong> {branchName}</p>
                  <p>• <strong>Địa chỉ cơ sở:</strong> {branchAddress}</p>
                  <p>• <strong>Email:</strong> {branchEmail}</p>
                </div>
              </div>

              <div>
                <p className="font-bold uppercase tracking-wide">
                  BÊN THUÊ (BÊN B):
                </p>
                <div className="pl-4 pt-1 space-y-0.5 text-neutral-900">
                  <p>• <strong>Họ và tên:</strong> {customerName}</p>
                  <p>• <strong>Số CCCD:</strong> {citizenId}</p>
                  <p>• <strong>Số điện thoại:</strong> {customerPhone}</p>
                  <p>• <strong>Email liên hệ:</strong> {customerEmail}</p>
                  <p>• <strong>Mã hồ sơ / Giữ chỗ:</strong> <span className="font-mono font-semibold">{reservationCode}</span></p>
                </div>
              </div>
            </div>

            <p className="italic text-xs sm:text-[13px] pt-1 text-neutral-800">
              Hai bên cùng thỏa thuận và thống nhất ký kết các điều khoản dưới đây:
            </p>

            {/* NỘI DUNG CÁC ĐIỀU KHOẢN (ĐIỀU 1 ĐẾN ĐIỀU 6) */}
            <div className="space-y-6 pt-1 text-black">

              {/* ĐIỀU 1 */}
              <div className="space-y-2">
                <h4 className="font-serif font-bold text-xs sm:text-sm uppercase tracking-wide">
                  ĐIỀU 1: ĐỐI TƯỢNG THỎA THUẬN & THÔNG TIN Ô KHO
                </h4>
                <p className="text-neutral-900">
                  1.1. Bên A đồng ý cung cấp cho Bên B quyền sử dụng ô kho lưu trữ tự quản với các thông số cụ thể như sau:
                </p>

                <div className="overflow-x-auto pt-1">
                  <table className="w-full border-collapse border border-black text-left text-xs sm:text-[13px] table-fixed">
                    <colgroup>
                      <col className="w-[30%]" />
                      <col className="w-[70%]" />
                    </colgroup>
                    <tbody>
                      <tr className="border-b border-black">
                        <td className="p-2.5 sm:p-3 border-r border-black font-bold bg-neutral-50/80">Mã ô kho</td>
                        <td className="p-2.5 sm:p-3 font-mono font-bold text-neutral-900">{unitCode}</td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="p-2.5 sm:p-3 border-r border-black font-bold bg-neutral-50/80">Loại hình kho</td>
                        <td className="p-2.5 sm:p-3 text-neutral-900">{loaiHinhKho}</td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="p-2.5 sm:p-3 border-r border-black font-bold bg-neutral-50/80">Diện tích</td>
                        <td className="p-2.5 sm:p-3 text-neutral-900">{unitArea} ({unitDimensions})</td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="p-2.5 sm:p-3 border-r border-black font-bold bg-neutral-50/80">Cơ sở chi nhánh</td>
                        <td className="p-2.5 sm:p-3 text-neutral-900">{branchName}</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 sm:p-3 border-r border-black font-bold bg-neutral-50/80">Trang thiết bị đi kèm</td>
                        <td className="p-2.5 sm:p-3 text-neutral-900 leading-relaxed">Hệ thống khóa thông minh IoT, PCCC tự động, camera an ninh 24/7, cảm biến nhiệt độ &amp; độ ẩm chuyên dụng.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ĐIỀU 2 */}
              <div className="space-y-2">
                <h4 className="font-serif font-bold text-xs sm:text-sm uppercase tracking-wide">
                  ĐIỀU 2: THỜI HẠN THUÊ & QUYỀN TRUY CẬP KHO
                </h4>
                <p className="text-neutral-900">
                  2.1. <strong>Thời hạn thuê kho:</strong> <strong>{rentalDurationDays}</strong> ngày, bắt đầu từ ngày <strong>{startDate}</strong> đến hết ngày <strong>{endDate}</strong>.
                </p>
                <p className="text-neutral-900">
                  2.2. <strong>Giữ chỗ:</strong> Ô kho được giữ cho Bên B trong vòng <strong>10 ngày</strong> kể từ thời điểm Bên B thanh toán tiền cọc. Quá thời hạn này mà Bên B chưa nhận kho (No-Show), Bên A có quyền hủy giữ chỗ và xử lý tiền cọc theo Khoản 3.3.
                </p>
                <p className="text-neutral-900">
                  2.3. <strong>Quyền ra vào:</strong> Bên B được toàn quyền ra vào cơ sở và sử dụng ô kho 24/7 trong suốt thời hạn thuê kể từ khi hoàn tất thủ tục nhận kho.
                </p>
                <p className="text-neutral-900">
                  2.4. <strong>Mã PIN kiểm soát an ninh (Gate PIN):</strong> {contract.gatePin ? (
                    <span className="font-mono font-bold">Mã PIN: {contract.gatePin}</span>
                  ) : (
                    <span>Hệ thống tự động thiết lập và gửi cho Bên B qua số điện thoại/email đã đăng ký ngay khi hoàn tất thủ tục nhận kho tại quầy.</span>
                  )}
                </p>
              </div>

              {/* ĐIỀU 3 */}
              <div className="space-y-2">
                <h4 className="font-serif font-bold text-xs sm:text-sm uppercase tracking-wide">
                  ĐIỀU 3: GIÁ THUÊ, TIỀN CỌC & PHƯƠNG THỨC THANH TOÁN
                </h4>
                <p className="text-neutral-900">
                  3.1. Các khoản chi phí được thống nhất như sau:
                </p>

                <div className="overflow-x-auto pt-1">
                  <table className="w-full border-collapse border border-black text-left text-xs sm:text-[13px] table-fixed">
                    <colgroup>
                      <col className="w-[28%]" />
                      <col className="w-[22%]" />
                      <col className="w-[22%]" />
                      <col className="w-[28%]" />
                    </colgroup>
                    <thead>
                      <tr className="border-b border-black font-bold bg-neutral-100">
                        <th className="p-2.5 sm:p-3 border-r border-black text-center">Khoản mục chi phí</th>
                        <th className="p-2.5 sm:p-3 border-r border-black text-center whitespace-nowrap">Số tiền (VNĐ)</th>
                        <th className="p-2.5 sm:p-3 border-r border-black text-center">Tình trạng thanh toán</th>
                        <th className="p-2.5 sm:p-3 text-center">Ghi chú & Chính sách hoàn trả</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-black">
                        <td className="p-2.5 sm:p-3 border-r border-black font-semibold">1. Tiền thuê ô kho</td>
                        <td className="p-2.5 sm:p-3 border-r border-black text-right font-mono font-bold whitespace-nowrap">
                          {rentalFee.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="p-2.5 sm:p-3 border-r border-black text-center">
                          {isPending ? 'Thanh toán khi nhận kho' : 'Đã thanh toán'}
                        </td>
                        <td className="p-2.5 sm:p-3 text-neutral-800 leading-relaxed">
                          Đã bao gồm chi phí an ninh, điện chiếu sáng và bảo vệ 24/7.
                        </td>
                      </tr>

                      <tr className="border-b border-black">
                        <td className="p-2.5 sm:p-3 border-r border-black font-semibold">2. Tiền cọc bảo chứng</td>
                        <td className="p-2.5 sm:p-3 border-r border-black text-right font-mono font-bold whitespace-nowrap">
                          {depositFee.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="p-2.5 sm:p-3 border-r border-black text-center">
                          Đã thanh toán trực tuyến
                        </td>
                        <td className="p-2.5 sm:p-3 text-neutral-800 leading-relaxed">
                          Hoàn lại khi thanh lý hợp đồng và nghiệm thu kho không hư hại (xem Khoản 3.2).
                        </td>
                      </tr>

                      <tr className="border-b border-black bg-neutral-50/90 font-bold">
                        <td className="p-2.5 sm:p-3 border-r border-black uppercase tracking-wide">
                          TỔNG GIÁ TRỊ HỢP ĐỒNG
                        </td>
                        <td className="p-2.5 sm:p-3 border-r border-black text-right font-mono font-extrabold whitespace-nowrap">
                          {totalAmount.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="p-2.5 sm:p-3 border-r border-black text-center font-bold">
                          {isPending ? 'Đang giữ chỗ' : 'Đã thanh toán 100%'}
                        </td>
                        <td className="p-2.5 sm:p-3 text-neutral-800 leading-relaxed">
                          Đã bao gồm toàn bộ tiền cọc bảo chứng và tiền thuê kỳ đầu.
                        </td>
                      </tr>

                      <tr className="border-b border-black">
                        <td className="p-2.5 sm:p-3 border-r border-black pl-5 font-medium">
                          • Đã thanh toán
                        </td>
                        <td className="p-2.5 sm:p-3 border-r border-black text-right font-mono font-bold whitespace-nowrap">
                          {paidDepositAmount.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="p-2.5 sm:p-3 border-r border-black text-center text-neutral-800">
                          {isPending ? 'Đã thu tiền cọc' : 'Đã tất toán'}
                        </td>
                        <td className="p-2.5 sm:p-3 text-neutral-700 italic leading-relaxed">
                          {isPending ? 'Đã thu tiền đặt cọc giữ chỗ trực tuyến.' : 'Toàn bộ nghĩa vụ tài chính đã được thanh toán 100%.'}
                        </td>
                      </tr>

                      <tr>
                        <td className="p-2.5 sm:p-3 border-r border-black pl-5 font-medium">
                          • Còn phải thanh toán khi nhận kho
                        </td>
                        <td className="p-2.5 sm:p-3 border-r border-black text-right font-mono font-bold whitespace-nowrap">
                          {remainingCheckinAmount.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="p-2.5 sm:p-3 border-r border-black text-center font-semibold text-neutral-800">
                          {remainingCheckinAmount === 0 ? '0 đ' : 'Thanh toán tại quầy'}
                        </td>
                        <td className="p-2.5 sm:p-3 text-neutral-700 italic leading-relaxed">
                          {remainingCheckinAmount === 0
                            ? '0 đ (Đã tất toán, không còn nợ tồn đọng).'
                            : 'Thanh toán tiền thuê tại quầy check-in trước khi nhận mã PIN.'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="pt-1.5 space-y-1.5 text-neutral-900">
                  <p>
                    3.2. <strong>Hoàn trả tiền cọc:</strong> Bên A hoàn lại 100% tiền cọc cho Bên B trong vòng <strong>03 ngày làm việc</strong> kể từ ngày thanh lý hợp đồng và nghiệm thu ô kho không hư hại, sau khi khấu trừ (nếu có) phí quá hạn theo Điều 4 hoặc chi phí khắc phục thiệt hại có biên bản xác nhận.
                  </p>
                  <p>
                    3.3. <strong>Hủy giữ chỗ trước khi nhận kho:</strong> Khách hàng được hủy và hoàn 100% cọc nếu gửi yêu cầu trước ngày bắt đầu thuê tối thiểu 04 (bốn) ngày theo quy định BR-17. Hủy muộn hơn hoặc không đến nhận kho (No-Show) sẽ bị thu hồi toàn bộ tiền cọc.
                  </p>
                  <p>
                    3.4. <strong>Thông tin thanh toán cọc:</strong> Bên B đã thanh toán tiền cọc trực tuyến lúc <strong>{paymentTimeStr}</strong>, mã giao dịch <span className="font-mono font-semibold">{paymentTxnCode}</span>.
                  </p>
                </div>
              </div>

              {/* ĐIỀU 4 */}
              <div className="space-y-1.5">
                <h4 className="font-serif font-bold text-xs sm:text-sm uppercase tracking-wide">
                  ĐIỀU 4: QUY ĐỊNH PHẠT QUÁ HẠN & XỬ LÝ TÀI SẢN TỒN ĐỌNG
                </h4>
                <p className="text-neutral-900">
                  4.1. Khi hết hạn thuê mà Bên B không gia hạn hoặc không làm thủ tục bàn giao trả kho, hệ thống sẽ tự động chuyển hợp đồng sang trạng thái <strong>Quá hạn (OVERDUE)</strong>.
                </p>
                <p className="text-neutral-900">
                  4.2. <strong>Phí quá hạn:</strong> Áp dụng mức phí <strong>50.000 VNĐ / ngày trễ hạn</strong>. Bên B có trách nhiệm thanh toán đầy đủ phí phát sinh trước khi nhận lại hàng hóa.
                </p>
                <p className="text-neutral-900">
                  4.3. <strong>Xử lý tài sản:</strong> Sau <strong>15 ngày</strong> kể từ ngày quá hạn, nếu Bên B không liên hệ giải quyết sau khi Bên A đã thông báo tối thiểu 02 lần qua email và số điện thoại đã đăng ký, Bên A có quyền kiểm kê (có lập biên bản), di dời hoặc thanh lý tài sản để thu hồi diện tích kho theo quy chế vận hành.
                </p>
                <p className="text-neutral-900">
                  4.4. Số tiền thu được từ việc thanh lý (nếu có), sau khi trừ phí quá hạn và chi phí xử lý hợp lý, sẽ được hoàn lại cho Bên B.
                </p>
              </div>

              {/* ĐIỀU 5 */}
              <div className="space-y-1.5">
                <h4 className="font-serif font-bold text-xs sm:text-sm uppercase tracking-wide">
                  ĐIỀU 5: CAM KẾT AN TOÀN PHÒNG CHÁY CHỮA CHÁY & HÀNG HÓA
                </h4>
                <p className="text-neutral-900">
                  5.1. Bên B cam kết tuyệt đối <strong>KHÔNG</strong> lưu trữ: Hóa chất cháy nổ, xăng dầu, pháo hoa; Vũ khí, hàng cấm theo quy định của pháp luật; Động vật sống hoặc thực phẩm dễ ôi thiu gây ô nhiễm.
                </p>
                <p className="text-neutral-900">
                  5.2. Bên B chịu hoàn toàn trách nhiệm trước pháp luật và bồi thường thiệt hại thực tế (có chứng cứ) nếu vi phạm các cam kết nêu trên.
                </p>
                <p className="text-neutral-900">
                  5.3. Bên A có trách nhiệm duy trì hệ thống an ninh, PCCC và vận hành cơ sở theo đúng thông số tại Điều 1; không mở ô kho của Bên B khi chưa có sự đồng ý của Bên B, trừ trường hợp khẩn cấp (cháy, nổ, rò rỉ) hoặc theo yêu cầu của cơ quan có thẩm quyền.
                </p>
              </div>

              {/* ĐIỀU 6 */}
              <div className="space-y-1.5">
                <h4 className="font-serif font-bold text-xs sm:text-sm uppercase tracking-wide">
                  ĐIỀU 6: ĐIỀU KHOẢN CHUNG & HIỆU LỰC
                </h4>
                <p className="text-neutral-900">
                  6.1. Thỏa thuận này được xác lập bằng phương tiện điện tử theo quy định của Luật Giao dịch điện tử, có đầy đủ giá trị pháp lý tương đương văn bản ký kết truyền thống. Dữ liệu xác nhận điện tử của mỗi bên được lưu trên hệ thống và là căn cứ đối chiếu khi cần thiết.
                </p>
                <p className="text-neutral-900">
                  6.2. Mọi tranh chấp phát sinh (nếu có) trước hết được giải quyết thông qua thương lượng, hòa giải; trường hợp không thương lượng được sẽ đưa ra Tòa án có thẩm quyền để giải quyết.
                </p>
              </div>

            </div>

            <div className="border-t border-neutral-300 pt-2 flex items-center justify-between text-[10.5px] text-neutral-500 font-sans">
              <span>Hệ thống Smart Self Storage</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
