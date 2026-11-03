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

  // 1. Trích xuất thông tin hợp đồng & khách hàng
  const branchName = contract.branchName || contract.facilityName || 'Chi nhánh Hà Nội (HN01)';
  const unitCode = contract.unitCode || contract.unitId || 'HN01-G-XL04';
  const startDate = formatDate(contract.startDate) || '01/11/2026';
  const endDate = formatDate(contract.expiryDate || contract.endDate) || '01/12/2026';

  const rentalFee = Number(contract.rentalFee ?? contract.rentalAmount ?? 1500000);
  const depositFee = Number(contract.depositFee ?? contract.depositAmount ?? 500000);
  const totalAmount = Number(contract.totalAmount ?? (rentalFee + depositFee));

  const contractCode =
    contract.contractCode || contract.contractId || contract.reservationCode || contract.bookingCode || 'CTR-HN01-011126-1036';
  const reservationCode = contract.reservationCode || contract.bookingCode || contractCode;

  // Lấy thông tin khách hàng từ contract hoặc fallback từ auth_session
  let customerName = contract.customerName;
  let customerPhone = contract.customerPhone;
  let customerEmail = contract.customerEmail;
  let citizenId = contract.citizenId;

  if (!customerName || !customerPhone) {
    try {
      const rawAuth = localStorage.getItem('auth_session') || sessionStorage.getItem('auth_session');
      if (rawAuth) {
        const parsed = JSON.parse(rawAuth);
        const u = parsed.user || parsed;
        if (!customerName && u.fullName) customerName = u.fullName;
        if (!customerPhone && u.phone) customerPhone = u.phone;
        if (!customerEmail && u.email) customerEmail = u.email;
        if (!citizenId && u.citizenId) citizenId = u.citizenId;
      }
    } catch (e) {}
  }

  customerName = customerName || 'Nguyễn Văn A';
  customerPhone = customerPhone || '0912 345 678';
  customerEmail = customerEmail || 'khachhang@gmail.com';
  citizenId = citizenId || '079098012345';
  const maskedCitizenId =
    citizenId.length >= 8 ? `${citizenId.substring(0, 3)}****${citizenId.substring(citizenId.length - 4)}` : citizenId;

  // Tự động nhận diện địa danh và địa chỉ cơ sở theo chi nhánh thực tế
  const rawBranch = String(contract.branchName || contract.facilityName || unitCode || '').toLowerCase();
  let contractCity = 'TP. Hồ Chí Minh';
  let branchAddress = 'Số 15 Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh';

  if (
    rawBranch.includes('hà nội') ||
    rawBranch.includes('hn') ||
    rawBranch.includes('cầu giấy') ||
    rawBranch.includes('thanh xuân')
  ) {
    contractCity = 'Hà Nội';
    branchAddress = rawBranch.includes('thanh xuân')
      ? 'Số 120 Khuất Duy Tiến, Quận Thanh Xuân, Hà Nội'
      : 'Số 391 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội';
  } else if (
    rawBranch.includes('đà nẵng') ||
    rawBranch.includes('dn') ||
    rawBranch.includes('hải châu')
  ) {
    contractCity = 'Đà Nẵng';
    branchAddress = 'Số 88 Nguyễn Văn Linh, Quận Hải Châu, Đà Nẵng';
  } else if (rawBranch.includes('tân bình') || rawBranch.includes('hcm02')) {
    contractCity = 'TP. Hồ Chí Minh';
    branchAddress = 'Số 202 Hoàng Văn Thụ, Phường 9, Quận Tân Bình, TP. Hồ Chí Minh';
  } else if (rawBranch.includes('quận 1') || rawBranch.includes('hcm01') || rawBranch.includes('hcm')) {
    contractCity = 'TP. Hồ Chí Minh';
    branchAddress = 'Số 15 Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh';
  }

  if (contract.branchAddress || contract.facilityAddress) {
    branchAddress = contract.branchAddress || contract.facilityAddress;
  }

  // Ngày ký hợp đồng
  const contractDateObj = contract.createdDate
    ? new Date(contract.createdDate)
    : contract.startDate
    ? new Date(contract.startDate)
    : new Date();
  const signDay = !isNaN(contractDateObj.getDate()) ? contractDateObj.getDate() : new Date().getDate();
  const signMonth = !isNaN(contractDateObj.getMonth()) ? contractDateObj.getMonth() + 1 : new Date().getMonth() + 1;
  const signYear = !isNaN(contractDateObj.getFullYear()) ? contractDateObj.getFullYear() : new Date().getFullYear();

  const isPending = contract.status === 'PENDING_CHECKIN';
  const isActive = contract.status === 'ACTIVE';
  const isCompleted = contract.status === 'COMPLETED';
  const isTerminated = contract.status === 'TERMINATED';
  const isOverdue = contract.status === 'OVERDUE';
  const isCanceled = contract.status === 'CANCELLED';

  const isClimate =
    Boolean(contract.isClimate) ||
    contract.storageType === 'CLIMATE_CONTROLLED' ||
    String(unitCode).includes('XL') ||
    String(contract.typeLabel || '').includes('Mát');

  const [isDownloading, setIsDownloading] = useState(false);

  // Tải trực tiếp file PDF đầy đủ các trang về máy tính (Tự động tải về, không bao giờ mở hộp thoại in)
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

      // 1. Tạo container độc lập ngoài DOM scroll để chụp trọn vẹn 100% chiều cao văn bản không bị cắt xén
      const targetWidth = 800; // Khổ rộng chuẩn văn bản A4

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
      clone.style.borderRadius = '0';
      clone.style.padding = '32px';
      clone.style.backgroundColor = '#ffffff';
      clone.style.color = '#000000';

      renderContainer.appendChild(clone);
      document.body.appendChild(renderContainer);

      // Đợi DOM clone render hoàn tất
      await new Promise((r) => setTimeout(r, 60));

      const totalHeight = Math.max(clone.scrollHeight, clone.offsetHeight);

      // 2. Chụp toàn bộ tài liệu từ đầu đến cuối trang với độ nét cao x2
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: targetWidth,
        height: totalHeight,
        windowWidth: targetWidth,
        windowHeight: totalHeight,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
      });

      // Dọn dẹp DOM clone ngay sau khi chụp
      if (renderContainer && document.body.contains(renderContainer)) {
        document.body.removeChild(renderContainer);
        renderContainer = null;
      }

      // 3. Chuẩn hóa sang các trang A4 chuẩn (210mm x 297mm)
      const pdf = new JsPDF('p', 'mm', 'a4');
      const a4Width = 210;
      const a4Height = 297;
      const margin = 10;
      const printableWidth = a4Width - margin * 2;
      const printableHeight = a4Height - margin * 2;

      // Chiều cao pixel canvas tương ứng với 1 trang A4
      const scaleMmToPx = canvas.width / printableWidth;
      const pageHeightPx = Math.floor(printableHeight * scaleMmToPx);

      const totalPages = Math.ceil(canvas.height / pageHeightPx);

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage();
        }

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

      // 4. Lưu và tự động tải trực tiếp file PDF về máy tính (không bao giờ mở print hay save dialog)
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
      {/* Container cuộn dọc mượt mà */}
      <div
        className="min-h-full w-full flex flex-col items-center justify-start p-2.5 sm:p-6 pt-4 pb-12 sm:pb-16"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Style chuyên biệt khi In / Lưu PDF: Chỉ in đúng trang văn bản A4, ẩn toàn bộ UI nền */}
        <style>{`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #contract-a4-document, #contract-a4-document * {
              visibility: visible !important;
            }
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
            .contract-no-print {
              display: none !important;
            }
          }
        `}</style>

        {/* 1. THANH ĐIỀU KHIỂN NỔI (DOCUMENT TOOLBAR) */}
        <div className="contract-no-print w-full max-w-4xl bg-slate-900 text-white rounded-2xl shadow-xl px-4 py-3 sm:px-6 sm:py-3.5 mb-4 flex flex-wrap items-center justify-between gap-3 border border-slate-800 shrink-0 sticky top-2 z-30 backdrop-blur-md bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-base">
              <i className="fa-solid fa-file-contract"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm sm:text-base text-white tracking-wide">
                  {contractCode}
                </span>
                {/* Badge trạng thái */}
                {isPending && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    DỰ THẢO (CHỜ NHẬN KHO)
                  </span>
                )}
                {isActive && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    CHÍNH THỨC (ĐÃ KÍCH HOẠT)
                  </span>
                )}
                {isOverdue && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    QUÁ HẠN THUÊ
                  </span>
                )}
                {(isCompleted || isTerminated) && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-300 border border-slate-500/40">
                    ĐÃ THANH LÝ
                  </span>
                )}
                {isCanceled && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    ĐÃ HỦY
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Văn bản thỏa thuận pháp lý điện tử theo Luật Giao dịch điện tử 2023
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Nút Tải file PDF trực tiếp về máy */}
            <button
              type="button"
              disabled={isDownloading}
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white transition-all shadow-md cursor-pointer disabled:opacity-70 disabled:cursor-wait"
              title="Tự động tải file PDF về thư mục Downloads"
            >
              {isDownloading ? (
                <>
                  <i className="fa-solid fa-spinner animate-spin"></i>
                  <span>Đang tải...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-file-arrow-down"></i>
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

        {/* 2. KHỔ GIẤY VĂN BẢN A4 (CHUẨN HỢP ĐỒNG PHÁP LÝ TRẮNG ĐEN) */}
        <div
          id="contract-a4-document"
          ref={printRef}
          className="w-full max-w-4xl bg-white text-black shadow-2xl p-8 sm:p-14 border border-neutral-300 relative font-serif leading-relaxed text-xs sm:text-[13px] print:shadow-none print:border-none print:p-0 shrink-0"
        >
          {/* NỘI DUNG VĂN BẢN */}
          <div className="space-y-6">
            
            {/* HEADER: QUỐC HIỆU & TIÊU NGỮ */}
            <div className="text-center space-y-1 pb-4 border-b border-black">
              <h4 className="font-serif font-bold text-xs sm:text-sm uppercase tracking-wider text-black">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </h4>
              <p className="font-serif italic text-xs text-black font-semibold">
                Độc lập – Tự do – Hạnh phúc
              </p>
              <div className="w-28 h-[1px] bg-black mx-auto mt-1 mb-2"></div>
              <p className="font-serif italic text-[11px] text-neutral-800 pt-1">
                {contractCity}, ngày {signDay} tháng {signMonth} năm {signYear}
              </p>
            </div>

            {/* TIÊU ĐỀ HỢP ĐỒNG */}
            <div className="text-center pt-2 pb-2">
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
            <div className="space-y-4 text-xs sm:text-[13px] pt-1 text-black">
              <div>
                <p className="font-bold uppercase tracking-wide">
                  BÊN CHO THUÊ (BÊN A):
                </p>
                <div className="pl-4 pt-1.5 space-y-1 text-neutral-900">
                  <p>• <strong>Tên đơn vị:</strong> CÔNG TY CỔ PHẦN SMART SELF STORAGE</p>
                  <p>• <strong>Cơ sở phụ trách:</strong> {branchName}</p>
                  <p>• <strong>Địa chỉ cơ sở:</strong> {branchAddress}</p>
                  <p>• <strong>Hotline:</strong> 1900 8899 &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Email:</strong> hotro@smartstorage.vn</p>
                  <p>• <strong>Mã số thuế:</strong> 0109988776 do Sở Kế hoạch và Đầu tư cấp</p>
                </div>
              </div>

              <div>
                <p className="font-bold uppercase tracking-wide">
                  BÊN THUÊ (BÊN B):
                </p>
                <div className="pl-4 pt-1.5 space-y-1 text-neutral-900">
                  <p>• <strong>Họ và tên:</strong> {customerName}</p>
                  <p>• <strong>Số CMND/CCCD:</strong> {maskedCitizenId}</p>
                  <p>• <strong>Số điện thoại:</strong> {customerPhone}</p>
                  <p>• <strong>Email liên hệ:</strong> {customerEmail}</p>
                  <p>• <strong>Mã hồ sơ / Giữ chỗ:</strong> {reservationCode}</p>
                </div>
              </div>
            </div>

            <p className="italic text-xs sm:text-[13px] pt-1 text-neutral-800">
              Hai bên cùng thỏa thuận và thống nhất ký kết các điều khoản dưới đây:
            </p>

            {/* CÁC ĐIỀU KHOẢN (ARTICLES) */}
            <div className="space-y-5 pt-1 text-black">
              
              {/* ĐIỀU 1 */}
              <div className="space-y-2">
                <h4 className="font-serif font-bold text-xs sm:text-sm uppercase tracking-wide">
                  ĐIỀU 1: ĐỐI TƯỢNG HỢP ĐỒNG & THÔNG TIN Ô KHO
                </h4>
                <p className="text-neutral-900">
                  1.1. Bên cho thuê đồng ý cung cấp cho Bên thuê quyền sử dụng ô kho lưu trữ tự quản với các thông số cụ thể như sau:
                </p>
                
                <div className="overflow-x-auto pt-1">
                  <table className="w-full border-collapse border border-black text-left text-xs sm:text-[13px]">
                    <tbody>
                      <tr className="border-b border-black">
                        <td className="p-2 border-r border-black font-bold w-1/3">Mã ô kho:</td>
                        <td className="p-2 font-mono font-bold">{unitCode}</td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="p-2 border-r border-black font-bold">Loại hình kho:</td>
                        <td className="p-2">
                          {isClimate
                            ? 'Kho mát kiểm soát nhiệt độ (22 - 25°C, độ ẩm < 50%)'
                            : 'Kho lưu trữ tiêu chuẩn (Standard Storage)'}
                        </td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="p-2 border-r border-black font-bold">Cơ sở chi nhánh:</td>
                        <td className="p-2">{branchName}</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r border-black font-bold">Trang thiết bị đi kèm:</td>
                        <td className="p-2">
                          Hệ thống kiểm soát khóa từ thông minh, PCCC tự động đạt chuẩn, cảm biến môi trường 24/7, camera an ninh hành lang.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ĐIỀU 2 */}
              <div className="space-y-1.5">
                <h4 className="font-serif font-bold text-xs sm:text-sm uppercase tracking-wide">
                  ĐIỀU 2: THỜI HẠN THUÊ & QUYỀN TRUY CẬP KHO
                </h4>
                <p className="text-neutral-900">
                  2.1. <strong>Thời hạn thuê kho:</strong> Bắt đầu từ ngày <strong>{startDate}</strong> đến hết ngày <strong>{endDate}</strong>.
                </p>
                <p className="text-neutral-900">
                  2.2. <strong>Quyền ra vào:</strong> Bên thuê được toàn quyền ra vào cơ sở và sử dụng ô kho 24/7 trong suốt thời hạn hợp đồng có hiệu lực.
                </p>
                <p className="text-neutral-900">
                  2.3. <strong>Mã PIN kiểm soát an ninh (Gate PIN):</strong> {contract.gatePin ? (
                    <span className="font-mono font-bold">{contract.gatePin}</span>
                  ) : (
                    <span className="italic">
                      (Hệ thống tự động thiết lập và gửi cho Bên thuê ngay khi hoàn tất thủ tục nhận kho tại quầy)
                    </span>
                  )}.
                </p>
              </div>

              {/* ĐIỀU 3 */}
              <div className="space-y-2">
                <h4 className="font-serif font-bold text-xs sm:text-sm uppercase tracking-wide">
                  ĐIỀU 3: GIÁ THUÊ, TIỀN CỌC & PHƯƠNG THỨC THANH TOÁN
                </h4>
                
                <div className="overflow-x-auto pt-1">
                  <table className="w-full border-collapse border border-black text-left text-xs sm:text-[13px]">
                    <thead>
                      <tr className="border-b border-black font-bold">
                        <th className="p-2 border-r border-black">Khoản mục chi phí</th>
                        <th className="p-2 border-r border-black text-right">Số tiền (VNĐ)</th>
                        <th className="p-2">Ghi chú & Chính sách hoàn trả</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-black">
                        <td className="p-2 border-r border-black font-bold">1. Tiền thuê ô kho:</td>
                        <td className="p-2 border-r border-black text-right font-mono font-bold">
                          {rentalFee.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="p-2">Đã bao gồm chi phí an ninh, điện chiếu sáng và bảo vệ 24/7.</td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="p-2 border-r border-black font-bold">2. Tiền cọc bảo chứng:</td>
                        <td className="p-2 border-r border-black text-right font-mono font-bold">
                          {depositFee.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="p-2">Hoàn lại 100% khi thanh lý hợp đồng và nghiệm thu kho không hư hại.</td>
                      </tr>
                      <tr className="border-t-2 border-black font-bold">
                        <td className="p-2 border-r border-black">TỔNG GIÁ TRỊ:</td>
                        <td className="p-2 border-r border-black text-right font-mono">
                          {totalAmount.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="p-2">
                          {isPending
                            ? 'Đã thanh toán tiền cọc trực tuyến. Phần tiền thuê thanh toán khi nhận kho.'
                            : 'Đã hoàn tất thanh toán 100%'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ĐIỀU 4 */}
              <div className="space-y-1.5">
                <h4 className="font-serif font-bold text-xs sm:text-sm uppercase tracking-wide">
                  ĐIỀU 4: QUY ĐỊNH PHẠT QUÁ HẠN & XỬ LÝ TÀI SẢN TỒN ĐỌNG
                </h4>
                <p className="text-neutral-900">
                  4.1. Khi hết hạn thuê mà Bên thuê không gia hạn hoặc không làm thủ tục bàn giao trả kho, hệ thống sẽ tự động chuyển hợp đồng sang trạng thái <strong>Quá hạn (OVERDUE)</strong>.
                </p>
                <p className="text-neutral-900">
                  4.2. <strong>Phí quá hạn:</strong> Áp dụng mức phí <strong>50.000 VNĐ / ngày trễ hạn</strong>. Bên thuê có trách nhiệm thanh toán đầy đủ phí phát sinh trước khi nhận lại hàng hóa.
                </p>
                <p className="text-neutral-900">
                  4.3. <strong>Xử lý tài sản:</strong> Sau <strong>15 (mười lăm) ngày</strong> kể từ ngày quá hạn nếu Bên thuê không liên hệ giải quyết, Bên cho thuê có quyền kiểm kê, di dời hoặc thanh lý tài sản để thu hồi diện tích kho theo quy chế vận hành.
                </p>
              </div>

              {/* ĐIỀU 5 */}
              <div className="space-y-1.5">
                <h4 className="font-serif font-bold text-xs sm:text-sm uppercase tracking-wide">
                  ĐIỀU 5: CAM KẾT AN TOÀN PHÒNG CHÁY CHỮA CHÁY & HÀNG HÓA
                </h4>
                <p className="text-neutral-900">
                  5.1. Bên thuê cam kết tuyệt đối <strong>KHÔNG</strong> lưu trữ: Hóa chất cháy nổ, xăng dầu, pháo hoa; Vũ khí, hàng cấm theo quy định của pháp luật; Động vật sống hoặc thực phẩm dễ ôi thiu gây ô nhiễm.
                </p>
                <p className="text-neutral-900">
                  5.2. Bên thuê chịu hoàn toàn trách nhiệm trước pháp luật và bồi thường thiệt hại nếu vi phạm các cam kết nêu trên.
                </p>
              </div>

              {/* ĐIỀU 6 */}
              <div className="space-y-1.5">
                <h4 className="font-serif font-bold text-xs sm:text-sm uppercase tracking-wide">
                  ĐIỀU 6: ĐIỀU KHOẢN CHUNG & HIỆU LỰC
                </h4>
                <p className="text-neutral-900">
                  6.1. Hợp đồng này được xác lập bằng phương tiện điện tử theo quy định của Luật Giao dịch điện tử, có đầy đủ giá trị pháp lý tương đương văn bản ký kết truyền thống.
                </p>
                <p className="text-neutral-900">
                  6.2. Mọi tranh chấp phát sinh (nếu có) trước hết được giải quyết thông qua thương lượng, hòa giải; trường hợp không thương lượng được sẽ đưa ra Tòa án có thẩm quyền để giải quyết.
                </p>
              </div>
            </div>

            {/* KHỐI CHỮ KÝ */}
            <div className="pt-8 pb-4 border-t border-black">
              <div className="grid grid-cols-2 gap-8 text-center text-xs sm:text-[13px] text-black">
                
                <div>
                  <p className="font-serif font-bold uppercase">BÊN CHO THUÊ</p>
                  <p className="font-serif italic text-[11px] text-neutral-600">(Ký, ghi rõ họ tên và đóng dấu)</p>
                  
                  <div className="h-28 flex flex-col items-center justify-center">
                    <p className="font-serif italic text-xs text-neutral-500">
                      [Đã xác nhận điện tử]
                    </p>
                  </div>

                  <p className="font-serif font-bold uppercase text-xs">
                    CÔNG TY CP SMART SELF STORAGE
                  </p>
                </div>

                <div>
                  <p className="font-serif font-bold uppercase">BÊN THUÊ</p>
                  <p className="font-serif italic text-[11px] text-neutral-600">(Ký, ghi rõ họ tên)</p>

                  <div className="h-28 flex flex-col items-center justify-center">
                    <p className="font-serif italic text-xs text-neutral-500">
                      {isPending ? '[Đã xác nhận đặt cọc trực tuyến]' : '[Đã ký điện tử]'}
                    </p>
                  </div>

                  <p className="font-serif font-bold uppercase text-xs">
                    {customerName}
                  </p>
                </div>

              </div>
            </div>

            {/* FOOTER GHI CHÚ PHÁP LÝ */}
            <div className="border-t border-neutral-300 pt-2 text-center text-[10.5px] text-neutral-500 font-sans">
              Hệ thống lưu trữ tự quản thông minh Smart Self Storage · Mã hợp đồng: {contractCode}
            </div>

          </div>
        </div>


      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
