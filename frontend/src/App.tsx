import React from 'react'

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg text-center">
        <h1 className="text-3xl font-bold text-blue-600 mb-2">
          Smart Self Storage
        </h1>
        <p className="text-gray-600 mb-4">
          Hệ thống Quản lý Thuê Kho Thông Minh (React + TypeScript + Tailwind)
        </p>
        <div className="inline-block bg-green-100 text-green-800 text-sm font-semibold px-4 py-1.5 rounded-full">
          ✅ Frontend đã chuyển đổi sang TypeScript (.tsx) chuẩn chỉnh
        </div>
      </div>
    </div>
  )
}

export default App
