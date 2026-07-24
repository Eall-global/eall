const FilterFooter = ({ onReset, onApply }) => {
  return (
    <div className="border-t border-slate-200 p-4 flex gap-3">
      <button
        onClick={onReset}
        className="flex-1 rounded-xl border border-slate-300 py-3 font-semibold"
      >
        Reset
      </button>

      <button
        onClick={onApply}
        className=" flex-1 rounded-xl bg-sky-700 text-white py-3 font-semibold"
      >
        Apply Filters
      </button>
    </div>
  );
};

export default FilterFooter;
