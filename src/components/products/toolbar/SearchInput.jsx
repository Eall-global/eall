import { FiSearch } from "react-icons/fi";

const SearchInput = ({ value, onChange, className = "" }) => {
  return (
    <div className={`relative ${className}`}>
      <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search products..."
        className="
          w-full
          rounded-xl
          border
          border-slate-200
          py-3
          pl-11
          pr-4
          outline-none
          transition
          focus:border-sky-700
        "
      />
    </div>
  );
};

export default SearchInput;
