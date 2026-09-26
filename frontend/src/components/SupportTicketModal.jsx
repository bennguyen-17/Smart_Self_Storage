import React, { useState } from 'react';
import { submitSupportTicket } from '../services/supportService';

export default function SupportTicketModal({ onClose }) {
  const [ticketType, setTicketType] = useState('UNLOCK');
  const [unitSelect, setUnitSelect] = useState('HN01-G-XL04');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      alert("Vui lòng nhập mô tả chi tiết sự cố!");
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
        alert("✅ Đã gửi ticket hỗ trợ kỹ thuật thành công! Nhân viên trực ca (Staff) sẽ tiếp nhận trong ít phút.");
        onClose();
      }
    } catch (err) {
      alert("Lỗi khi gửi yêu cầu hỗ trợ. Vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="border border-slate-300 dark:border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-6 space-y-5 modal-animate-pop bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-lg shadow-sm">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase">Gửi Yêu Cầu Hỗ Trợ Kỹ Thuật (Ticket)</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Nhân viên trực ca (Staff) sẽ phản hồi trong 15-30 phút</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-sm transition cursor-pointer"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="space-y-2">
            <label className="block font-bold text-slate-900 dark:text-white">1. Chọn loại sự cố: <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-3">
              <label
                onClick={() => setTicketType('UNLOCK')}
                className={`p-3 rounded-2xl border cursor-pointer transition flex flex-col justify-between space-y-1.5 ${
                  ticketType === 'UNLOCK'
                    ? 'border-2 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-slate-900 dark:text-white'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <i className="fa-solid fa-lock-open text-amber-600"></i> Mở khóa kho hộ
                  </span>
                  <input
                    type="radio"
                    name="ticket_type"
                    value="UNLOCK"
                    checked={ticketType === 'UNLOCK'}
                    onChange={() => setTicketType('UNLOCK')}
                    className="text-amber-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Quên PIN, kẹt ổ khóa, cần Staff hỗ trợ</span>
              </label>

              <label
                onClick={() => setTicketType('MAINTENANCE')}
                className={`p-3 rounded-2xl border cursor-pointer transition flex flex-col justify-between space-y-1.5 ${
                  ticketType === 'MAINTENANCE'
                    ? 'border-2 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-slate-900 dark:text-white'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <i className="fa-solid fa-wrench text-blue-600"></i> Hư hỏng cơ sở
                  </span>
                  <input
                    type="radio"
                    name="ticket_type"
                    value="MAINTENANCE"
                    checked={ticketType === 'MAINTENANCE'}
                    onChange={() => setTicketType('MAINTENANCE')}
                    className="text-amber-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Hỏng đèn, cửa cuốn rít, điều hòa hỏng</span>
              </label>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-slate-900 dark:text-white">2. Ô kho cần hỗ trợ:</label>
            <select
              value={unitSelect}
              onChange={(e) => setUnitSelect(e.target.value)}
              className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="HN01-G-XL04">Kho 1: HN01-G-XL04 (Cầu Giấy)</option>
              <option value="HN02-F1-M102">Kho 2: HN02-F1-M102 (Thanh Xuân)</option>
              <option value="GATE">Cổng chính ra vào tòa nhà 24/7</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-slate-900 dark:text-white">3. Mô tả chi tiết tình trạng: <span className="text-red-500">*</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Ví dụ: Bàn phím số bị liệt, hoặc đèn trong ô kho không sáng..."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none resize-none font-medium"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs py-3 rounded-xl border border-slate-300 dark:border-slate-700 transition cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-3 rounded-xl shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <i className="fa-solid fa-paper-plane text-xs"></i>
            <span>Gửi Yêu Cầu Ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
}
