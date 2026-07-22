import { FiSearch } from "react-icons/fi";

const SearchButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="
        flex items-center gap-2
        px-4 py-2
        bg-slate-100
        hover:bg-slate-200
        rounded-full
        transition
      "
    >
      <FiSearch />
      <span className="text-sm text-slate-600">Search products</span>
    </button>
  );
};

export default SearchButton;
