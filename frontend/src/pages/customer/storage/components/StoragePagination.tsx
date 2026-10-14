import React from 'react';

interface StoragePaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function StoragePagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange
}: StoragePaginationProps) {
  if (totalItems === 0) return null;

  return (
    <div className="p-3 sm:p-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
      <div className="font-medium text-center sm:text-left">
      </div>

      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        {/* Chọn số lượng mỗi trang */}
        <div className="flex items-center gap-1.5 mr-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium">Hiển thị:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value={5}>5 / trang</option>
            <option value={8}>8 / trang</option>
            <option value={10}>10 / trang</option>
            <option value={15}>15 / trang</option>
          </select>
        </div>

        {/* Nút Về trang đầu */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          title="Trang đầu"
        >
          <i className="fa-solid fa-angles-left"></i>
        </button>

        {/* Nút Trang trước */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          title="Trang trước"
        >
          <i className="fa-solid fa-chevron-left"></i>
        </button>

        {/* Các số trang */}
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
            .map((page, idx, arr) => {
              const prevPage = arr[idx - 1];
              const showEllipsis = prevPage && page - prevPage > 1;
              const isActive = currentPage === page;

              return (
                <React.Fragment key={page}>
                  {showEllipsis && <span className="px-1 text-slate-400 text-xs">...</span>}
                  <button
                    type="button"
                    onClick={() => onPageChange(page)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black transition cursor-pointer ${isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                        : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              );
            })}
        </div>

        {/* Nút Trang sau */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          title="Trang sau"
        >
          <i className="fa-solid fa-chevron-right"></i>
        </button>

        {/* Nút Đến trang cuối */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          title="Trang cuối"
        >
          <i className="fa-solid fa-angles-right"></i>
        </button>
      </div>
    </div>
  );
}
