import { FiSearch } from "react-icons/fi";

const SearchButton = ({ onClick, isTransparent }) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2
        px-4 py-2
        rounded-full
        transition-all duration-300
        cursor-pointer
        ${
          isTransparent
            ? "bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-md shadow-xs"
            : "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-transparent"
        }
      `}
    >
      <FiSearch className={isTransparent ? "text-white/90" : "text-slate-500"} />
      <span
        className={`text-sm font-medium ${
          isTransparent ? "text-white/90" : "text-slate-600"
        }`}
      >
        Search products
      </span>
    </button>
  );
};

export default SearchButton;
