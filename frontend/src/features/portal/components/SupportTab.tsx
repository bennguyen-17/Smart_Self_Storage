import React, { useState, useEffect } from 'react';
import { submitSupportTicket } from '@/features/portal/services/supportService';
import { getMyContracts } from '@/features/portal/services/contractService';
import { Headset, PhoneCall, ShieldAlert, Send, CheckCircle2, Clock, MessageSquare, AlertCircle } from 'lucide-react';

export default function SupportTab() {
  const [ticketType, setTicketType] = useState('UNLOCK');
  const [unitSelect, setUnitSelect] = useState('GATE');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myUnits, setMyUnits] = useState<any[]>([]);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const res = await getMyContracts();
        if (res.success && res.data) {
          const activeUnits = res.data.filter((c: any) => c.status === 'ACTIVE' || c.status === 'PENDING_CHECKIN');
          setMyUnits(activeUnits);
          if (activeUnits.length > 0) {
            setUnitSelect(activeUnits[0].unitCode);
          }
        }
      } catch (e) {
        console.warn('Lỗi tải hợp đồng cho ticket hỗ trợ:', e);
      }
    };
    fetchContracts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert("Vui lòng nhập mô tả chi tiết yêu cầu hỗ trợ!");
      return;
    }
    try {
      setSubmitting(true);
      const res = await submitSupportTicket({
        type: ticketType,
        unitCode: unitSelect,
        description
      });
      if (res.success) {
        setSubmittedSuccess(true);
        setDescription('');
      }
    } catch (err) {
      console.error('Lỗi gửi yêu cầu hỗ trợ:', err);
      alert("Lỗi khi gửi yêu cầu hỗ trợ. Vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Banner Tiêu Đề */}
      <div className="bg-slate-950/80 backdrop-blur-md rounded-2xl border border-cyan-500/30 p-5 sm:p-6 shadow-[0_0_25px_rgba(34,211,238,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/30 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
            <Headset className="size-6 text-amber-300" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase">
              TRUNG TÂM HỖ TRỢ KỸ THUẬT & KHẨN CẤP 24/7
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Tiếp nhận và xử lý yêu cầu mở khóa từ xa, bảo trì sự cố ô kho, an ninh 24/7.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-xl">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Trực ban 24/7 đang hoạt động</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI: FORM GỬI YÊU CẦU HỖ TRỢ */}
        <div className="lg:col-span-7 bg-slate-950/85 backdrop-blur-md rounded-3xl border border-cyan-500/30 p-6 sm:p-8 shadow-xl space-y-6">
          <h3 className="font-black text-base text-white uppercase flex items-center space-x-2">
            <MessageSquare className="size-5 text-cyan-400" />
            <span>GỬI YÊU CẦU TIẾP NHẬN XỬ LÝ</span>
          </h3>

          {submittedSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 space-y-2 flex items-start space-x-3">
              <CheckCircle2 className="size-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Gửi ticket hỗ trợ thành công!</p>
                <p className="text-xs text-emerald-200/80">
                  Nhân viên trực ca (Staff) đã tiếp nhận và sẽ liên hệ hỗ trợ bạn qua điện thoại hoặc xử lý trực tiếp tại trạm trong vòng 5-15 phút.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmittedSuccess(false)}
                  className="mt-2 text-xs font-bold underline hover:text-white cursor-pointer"
                >
                  Tạo thêm yêu cầu khác
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Loại sự cố */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-300 uppercase tracking-wide">
                Loại sự cố / Yêu cầu:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'UNLOCK', label: 'Mở khóa khẩn cấp', icon: ShieldAlert },
                  { id: 'MAINTENANCE', label: 'Bảo trì / Sửa chữa', icon: Clock },
                  { id: 'INCIDENT', label: 'Báo sự cố an ninh', icon: AlertCircle },
                  { id: 'OTHER', label: 'Thắc mắc / Khác', icon: MessageSquare },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setTicketType(cat.id)}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer text-left ${
                      ticketType === cat.id
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-md shadow-cyan-500/25'
                        : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-cyan-500/40 hover:text-white'
                    }`}
                  >
                    <cat.icon className="size-4 shrink-0" />
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Chọn Ô kho liên quan */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-300 uppercase tracking-wide">
                Vị trí / Ô kho liên quan:
              </label>
              <select
                value={unitSelect}
                onChange={(e) => setUnitSelect(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-cyan-500/30 bg-slate-900/90 text-white font-bold text-xs sm:text-sm focus:border-cyan-400 focus:outline-none cursor-pointer"
              >
                <option value="GATE">Cửa chính / Hệ thống ra vào cổng 24/7</option>
                {myUnits.map((u: any) => (
                  <option key={u.contractId || u.unitCode} value={u.unitCode}>
                    Ô Kho {u.unitCode} - {u.branchName || u.branchCode || 'SmartStorage'}
                  </option>
                ))}
              </select>
            </div>

            {/* Nội dung mô tả */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-300 uppercase tracking-wide">
                Mô tả chi tiết sự cố:
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ví dụ: Cửa cuốn ô kho A-102 kẹt không mở được, hoặc quên mã bảo mật, cần mở khóa từ xa..."
                className="w-full p-3.5 rounded-xl border border-cyan-500/30 bg-slate-900/90 text-white text-xs sm:text-sm focus:border-cyan-400 focus:outline-none placeholder:text-slate-500 resize-none"
              />
            </div>

            {/* Nút gửi */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] disabled:opacity-50"
            >
              <Send className="size-4" />
              <span>{submitting ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu hỗ trợ ngay'}</span>
            </button>
          </form>
        </div>

        {/* CỘT PHẢI: THÔNG TIN LIÊN HỆ TRỰC BAN 24/7 */}
        <div className="lg:col-span-5 bg-slate-950/75 backdrop-blur-md rounded-3xl border border-cyan-500/20 p-6 sm:p-7 shadow-xl space-y-6">
          <h3 className="font-black text-sm uppercase text-white flex items-center space-x-2">
            <PhoneCall className="size-4.5 text-amber-400" />
            <span>KÊNH LIÊN HỆ KHẨN CẤP TRỰC TIẾP</span>
          </h3>

          <div className="space-y-3.5">
            <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-1">
              <p className="text-xs text-cyan-300 uppercase font-black tracking-wider">Hotline Khẩn Cấp 24/7</p>
              <p className="text-2xl font-black font-mono text-white tracking-wide">1900 8888 68</p>
              <p className="text-[11px] text-slate-400">Hỗ trợ kỹ thuật chốt cửa, điện nước & an ninh toàn chi nhánh</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <p className="text-xs text-slate-400 uppercase font-black tracking-wider">Zalo Hỗ Trợ Khách Hàng</p>
              <p className="text-base font-bold text-white">SmartStorage Support Official</p>
              <p className="text-[11px] text-slate-400">Nhắn tin gửi hình ảnh sự cố trực tiếp để xử lý nhanh</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/90 space-y-2">
            <p className="font-bold flex items-center space-x-1.5 text-amber-300">
              <Clock className="size-4 shrink-0" />
              <span>Thời gian phản hồi cam kết</span>
            </p>
            <ul className="space-y-1 list-disc list-inside text-[11px] text-slate-300">
              <li>Sự cố mở khóa khẩn cấp: <strong className="text-white">Dưới 10 phút</strong></li>
              <li>Bảo trì đèn/điều hòa: <strong className="text-white">Trong vòng 2 giờ</strong></li>
              <li>Tư vấn hợp đồng & cọc: <strong className="text-white">Giờ hành chính (8h - 20h)</strong></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
