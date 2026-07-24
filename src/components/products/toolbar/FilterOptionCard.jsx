const FilterOptionCard = ({ option, selected, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(option.value)}
      className={`
        w-full
        flex
        items-center
        justify-between
        px-4
        py-3
        rounded-xl
        border
        transition

        ${
          selected
            ? "border-sky-700 bg-sky-50 text-sky-700"
            : "border-slate-200 hover:border-slate-300"
        }
      `}
    >
      <span>{option.label}</span>

      {selected && <span>✓</span>}
    </button>
  );
};

export default FilterOptionCard;
