import FilterOptionCard from "./FilterOptionCard";

const FilterOptions = ({ filter, value, onChange }) => {
  return (
    <div
      className="
        flex-1
        p-5
        space-y-3
        overflow-y-auto
      "
    >
      {filter.options.map((option) => (
        <FilterOptionCard
          key={option.value}
          option={option}
          selected={value === option.value}
          onSelect={onChange}
        />
      ))}
    </div>
  );
};

export default FilterOptions;
