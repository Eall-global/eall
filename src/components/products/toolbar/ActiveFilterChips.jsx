import { FiX } from "react-icons/fi";

const ActiveFilterChips = ({
  brand,
  availability,
  sort,

  brands,

  onBrandChange,
  onAvailabilityChange,
  onSort,
}) => {
  const chips = [];

  // BRAND

  if (brand !== "All") {
    const brandName = brands.find((item) => item.slug === brand)?.name;

    chips.push({
      id: "brand",

      label: brandName,

      remove: () => onBrandChange("All"),
    });
  }

  // AVAILABILITY

  if (availability !== "All") {
    chips.push({
      id: "availability",

      label: availability,

      remove: () => onAvailabilityChange("All"),
    });
  }

  // SORT

  if (sort !== "latest") {
    const sortLabels = {
      name: "Name A-Z",
      "price-low": "Price Low",
      "price-high": "Price High",
    };

    chips.push({
      id: "sort",

      label: sortLabels[sort],

      remove: () => onSort("latest"),
    });
  }

  if (!chips.length) return null;

  return (
    <div className=" py-4 bg-white flex lg:flex-wrap items-center gap-3 overflow-x-auto whitespace-nowrap scrollbar-hide">
      <button
        onClick={() => {
          onBrandChange("All");

          onAvailabilityChange("All");

          onSort("latest");
        }}
        className=" text-xs lg:text-sm text-red-600 font-semibold rounded-full bg-slate-100 px-4 py-2"
      >
        Clear All
      </button>

      {chips.map((chip) => (
        <div
          key={chip.id}
          className=" flex items-center gap-2 bg-sky-50 text-sky-700 px-4 py-2 rounded-full text-xs lg:text-sm font-medium"
        >
          {chip.label}

          <button onClick={chip.remove}>
            <FiX />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ActiveFilterChips;
