import { FaFilter } from "react-icons/fa";
import FilterBadge from "./FilterBadge";

const MobileToolbar = ({ onOpen, activeFilters }) => {
  return (
    <button
      onClick={onOpen}
      className="
        lg:hidden
        relative
        h-12
        w-12
        rounded-xl
        border
        border-slate-200
        flex
        items-center
        justify-center
        hover:bg-slate-50
        transition
      "
    >
      <FaFilter />

      <FilterBadge count={activeFilters} />
    </button>
  );
};

export default MobileToolbar;
