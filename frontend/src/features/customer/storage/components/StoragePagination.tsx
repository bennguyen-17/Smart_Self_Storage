import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface StoragePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
}

export default function StoragePagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange
}: StoragePaginationProps) {
  if (totalItems === 0) return null;

  return (
    <nav aria-label="Phân trang" className="flex items-center justify-end gap-1 text-xs pt-1">
      {/* Nút Trang trước */}
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
        className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
        aria-label="Trang trước"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Các số trang */}
      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
        .map((page, idx, arr) => {
          const prevPage = arr[idx - 1];
          const showEllipsis = prevPage && page - prevPage > 1;
          const isActive = currentPage === page;

          return (
            <React.Fragment key={page}>
              {showEllipsis && <span className="px-1 text-slate-400 text-xs">…</span>}
              <button
                type="button"
                onClick={() => onPageChange(page)}
                className={`inline-flex items-center justify-center h-8 w-8 rounded-lg text-xs font-semibold tabular-nums transition cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-2xs'
                    : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs'
                }`}
                aria-label={`Trang ${page}`}
              >
                {page}
              </button>
            </React.Fragment>
          );
        })}

      {/* Nút Trang sau */}
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages}
        className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
        aria-label="Trang sau"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
