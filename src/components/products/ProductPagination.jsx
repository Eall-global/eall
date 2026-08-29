import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const ProductPagination = ({
  currentPage = 1,
  totalPages = 1,
  totalProducts = 0,
  pageSize = 16,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const validTotal = Number(totalProducts) || 0;
  const startIdx = validTotal > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endIdx = validTotal > 0 ? Math.min(currentPage * pageSize, validTotal) : 0;

  // Generate page numbers to show (e.g. [1, 2, 3, 4, 5])
  const getPageNumbers = () => {
    const pages = [];
    const maxButtons = 5;

    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, start + maxButtons - 1);

      if (end - start < maxButtons - 1) {
        start = Math.max(1, end - maxButtons + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-10 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
      
      {/* Products Counter Range */}
      <div className="text-xs text-slate-500 font-medium order-2 sm:order-1">
        Showing <span className="font-bold text-slate-900">{startIdx}–{endIdx}</span> of{" "}
        <span className="font-bold text-sky-800">{validTotal}</span> products
      </div>

      {/* Pagination Stepper */}
      <div className="flex items-center gap-1.5 order-1 sm:order-2">
        
        {/* Previous Button */}
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer flex items-center gap-1 shadow-2xs"
          aria-label="Previous Page"
        >
          <FiChevronLeft className="text-sm" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* First Page button if not visible */}
        {pages[0] > 1 && (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            >
              1
            </button>
            {pages[0] > 2 && <span className="text-xs text-slate-400 px-1">...</span>}
          </>
        )}

        {/* Numbered Page Buttons */}
        {pages.map((pageNum) => (
          <button
            key={pageNum}
            type="button"
            onClick={() => onPageChange(pageNum)}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center ${
              currentPage === pageNum
                ? "bg-sky-700 text-white shadow-xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-2xs"
            }`}
          >
            {pageNum}
          </button>
        ))}

        {/* Last Page button if not visible */}
        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && (
              <span className="text-xs text-slate-400 px-1">...</span>
            )}
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Next Button */}
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer flex items-center gap-1 shadow-2xs"
          aria-label="Next Page"
        >
          <span className="hidden sm:inline">Next</span>
          <FiChevronRight className="text-sm" />
        </button>

      </div>
    </div>
  );
};

export default ProductPagination;
