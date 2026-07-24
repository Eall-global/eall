import { FaFilter } from "react-icons/fa";
import SearchInput from "./SearchInput";

const DesktopFilters = ({
  brand,
  onBrandChange,
  brands,
  availability,
  onAvailabilityChange,
  sort,
  onSort,
  search,
  onSearch,
}) => {
  return (
    <div className="hidden lg:grid lg:grid-cols-4 gap-4">
      <SearchInput value={search} onChange={onSearch} />
      <select
        value={brand}
        onChange={(e) => onBrandChange(e.target.value)}
        className="rounded-xl border border-slate-200 px-4 py-3 outline-none"
      >
        <option value="All">All Brands</option>

        {brands.map((item) => (
          <option key={item.slug} value={item.slug}>
            {item.name}
          </option>
        ))}
      </select>

      <select
        value={availability}
        onChange={(e) => onAvailabilityChange(e.target.value)}
        className="rounded-xl border border-slate-200 px-4 py-3 outline-none"
      >
        <option value="All">Availability</option>

        <option value="In Stock">In Stock</option>

        <option value="Available on Request">Available on Request</option>
      </select>

      <div className="relative">
        <FaFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

        <select
          value={sort}
          onChange={(e) => onSort(e.target.value)}
          className="w-full rounded-xl border border-slate-200 py-3 pl-10 outline-none"
        >
          <option value="latest">Latest</option>

          <option value="name">Name A-Z</option>

          <option value="price-low">Price Low</option>

          <option value="price-high">Price High</option>
        </select>
      </div>
    </div>
  );
};

export default DesktopFilters;
