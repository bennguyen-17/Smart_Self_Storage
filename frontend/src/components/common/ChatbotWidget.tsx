import React, { useState, useRef, useEffect } from 'react';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Xin chào! Tôi là Trợ lý AI Hỗ trợ 24/7. Bạn có thể hỏi về sơ đồ kho, tải trọng Tầng 1/2/3 hoặc thời hạn thuê!'
    }
  ]);

  const chatEndRef = useRef(null);

  const suggestedQuestions = [
    "Giá thuê kho bao nhiêu?",
    "Thời gian mở cửa kho?",
    "Làm sao để lấy mã PIN?",
    "Hướng dẫn cách đặt kho"
  ];

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = (text?: string) => {
    const userMsg = typeof text === 'string' ? text.trim() : inputVal.trim();
    if (!userMsg) return;
    
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setInputVal('');
    setShowSuggestions(false);

    setTimeout(() => {
      const lower = userMsg.toLowerCase();
      let reply = 'Xin lỗi, tôi chưa hiểu rõ ý của bạn. Vui lòng liên hệ Hotline 1900 3910 để được hỗ trợ chi tiết nhé!';

      if (lower.includes('giá') || lower.includes('thuê') || lower.includes('tiền')) {
        reply = 'Giá thuê kho phụ thuộc vào kích cỡ. Tủ S (2m³) giá 600.000đ/tháng, Kho M (6m³) 1.200.000đ/tháng. Đặt từ 3-6 tháng sẽ được giảm 5-10%!';
      } else if (lower.includes('pin') || lower.includes('mở') || lower.includes('vào')) {
        reply = 'Sau khi đặt cọc thành công, hệ thống sẽ cấp ngay cho bạn một mã PIN bảo mật 6 số. Bạn có thể dùng mã này để mở cửa kho bất cứ lúc nào 24/7.';
      } else if (lower.includes('giờ') || lower.includes('thời gian') || lower.includes('mấy giờ')) {
        reply = 'Smart Self Storage mở cửa tự động 24/7. Bạn có thể đến cất hoặc lấy đồ vào bất kỳ lúc nào, kể cả ban đêm hay lễ tết.';
      } else if (lower.includes('cọc') || lower.includes('hủy')) {
        reply = 'Bạn có thể giữ chỗ trước (Hold) trong vòng 24h. Tiền cọc sẽ được hoàn trả 100% khi bạn kết thúc hợp đồng mà không có hư hại kho.';
      } else if (lower.includes('hướng dẫn') || lower.includes('cách')) {
        reply = 'Rất đơn giản! Bạn chỉ cần vào mục "Sơ đồ 2D & Thuê kho", chọn một ô màu xanh/cam còn trống, sau đó bấm nút "Đặt cọc qua VietQR" là xong ngay!';
      } else if (lower.includes('chào') || lower.includes('hi ') || lower.includes('hello')) {
        reply = 'Chào bạn! Mình có thể giúp gì cho bạn hôm nay?';
      }

      setMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
    }, 600);
  };

  return (
    <div className="fixed bottom-14 sm:bottom-16 right-4 sm:right-6 z-40 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="card-box w-72 sm:w-80 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[380px] mb-2 transition-all duration-300 bg-white dark:bg-slate-900">
          <div className="p-3.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-blue-600 text-white">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold text-sm shadow">
                <i className="fa-solid fa-robot"></i>
              </div>
              <div>
                <h4 className="font-bold text-xs">Trợ lý ảo AI Chatbot 24/7</h4>
                <span className="text-[10px] text-emerald-300 flex items-center">
                  <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full mr-1 animate-ping"></span> Trực tuyến
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1 cursor-pointer"
            >
              <i className="fa-solid fa-xmark text-base"></i>
            </button>
          </div>

          <div className="flex-1 p-3.5 space-y-3 overflow-y-auto text-xs inner-box bg-slate-50 dark:bg-slate-950 flex flex-col relative">
            {messages.map((m, idx) =>
              m.sender === 'user' ? (
                <div key={idx} className="flex items-start justify-end space-x-2">
                  <div className="bg-blue-600 text-white p-2.5 rounded-2xl rounded-tr-none text-xs leading-relaxed max-w-[80%]">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={idx} className="flex items-start space-x-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    AI
                  </div>
                  <div className="card-box p-3 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-800 text-title shadow-sm leading-relaxed bg-white dark:bg-slate-800">
                    {m.text}
                  </div>
                </div>
              )
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Suggestions popup right above the input */}
          {showSuggestions && (
            <div className="px-3 pb-3 bg-slate-50 dark:bg-slate-950 flex flex-wrap justify-end gap-1.5 border-t border-slate-200 dark:border-slate-800 pt-2">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onMouseDown={(e) => {
                    // Prevent input from losing focus immediately
                    e.preventDefault();
                    handleSend(q);
                  }}
                  className="px-2.5 py-1.5 text-[10px] sm:text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-full transition-colors text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="p-2.5 card-box border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2 bg-white dark:bg-slate-900">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setShowSuggestions(false)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Nhập câu hỏi..."
              className="flex-1 border border-slate-300 dark:border-slate-700 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-title bg-slate-50 dark:bg-slate-800"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl shadow cursor-pointer"
            >
              <i className="fa-solid fa-paper-plane text-xs"></i>
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Mở Trợ lý AI"
        className="bg-blue-600 hover:bg-blue-500 text-white w-12 h-12 rounded-full shadow-xl flex items-center justify-center text-lg transition-all duration-300 hover:scale-105 border-2 border-white cursor-pointer"
      >
        <i className="fa-solid fa-comments"></i>
      </button>
    </div>
  );
}
