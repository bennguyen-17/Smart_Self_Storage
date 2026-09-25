import React, { useState, useRef, useEffect } from 'react';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Xin chào! Tôi là Trợ lý AI Hỗ trợ 24/7. Bạn có thể hỏi về sơ đồ kho, tải trọng Tầng 1/2/3 hoặc thời hạn thuê!'
    }
  ]);

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!inputVal.trim()) return;
    const userMsg = inputVal.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setInputVal('');

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Hệ thống đã ghi nhận câu hỏi của bạn. Để thuê kho mới, bạn chọn tab "Sơ đồ 2D & Thuê kho", chọn tầng và nhấp vào ô kho màu xanh/cam còn trống nhé!'
        }
      ]);
    }, 500);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="card-box w-72 sm:w-80 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[360px] mb-2 transition-all duration-300 bg-white dark:bg-slate-900">
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

          <div className="flex-1 p-3.5 space-y-3 overflow-y-auto text-xs inner-box bg-slate-50 dark:bg-slate-950">
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

          <div className="p-2.5 card-box border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2 bg-white dark:bg-slate-900">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Nhập câu hỏi..."
              className="flex-1 border border-slate-300 dark:border-slate-700 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-title bg-slate-50 dark:bg-slate-800"
            />
            <button
              type="button"
              onClick={handleSend}
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
