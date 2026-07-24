const FilterSidebar = ({ filters, activeFilter, setActiveFilter, values }) => {
  return (
    <div
      className="
        w-1/3
        border-r
        border-slate-200
        bg-slate-50
      "
    >
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => setActiveFilter(filter.id)}
          className={`
            w-full
            text-left
            px-5
            py-5
            text-sm
            transition

            ${
              activeFilter === filter.id
                ? "bg-white text-sky-700 font-semibold border-r-2 border-sky-700"
                : "text-slate-600"
            }
          `}
        >
          <div>{filter.label}</div>

          <span
            className="
              block
              mt-1
              text-xs
              text-slate-400
            "
          >
            {values[filter.id]}
          </span>
        </button>
      ))}
    </div>
  );
};

export default FilterSidebar;
