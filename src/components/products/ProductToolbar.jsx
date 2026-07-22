import { FiSearch } from "react-icons/fi";
import { FaFilter } from "react-icons/fa";

const ProductToolbar = ({
  search,
  onSearch,

  brand,
  onBrandChange,

  brands,

  availability,
  onAvailabilityChange,

  sort,
  onSort,
}) => {
  return (
    <section className=" bg-white px-6 lg:px-10">
      <div className=" grid lg:grid-cols-4 gap-4">
        {/* SEARCH */}

        <div className="relative lg:col-span-1">
          <FiSearch className=" absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search products..."
            className=" w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 outline-none focus:border-sky-700"
          />
        </div>
        <div className=" lg:col-span-3 grid grid-cols-3 gap-4">
          {/* BRAND */}

          <select
            value={brand}
            onChange={(e) => onBrandChange(e.target.value)}
            className=" rounded-xl border border-slate-200 px-4 py-3 outline-none"
          >
            <option value="All">All Brands</option>

            {brands.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>

          {/* AVAILABILITY */}

          <select
            value={availability}
            onChange={(e) => onAvailabilityChange(e.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-3 outline-none"
          >
            <option value="All">Availability</option>

            <option value="available">Available</option>

            <option value="out">Out Of Stock</option>
          </select>

          {/* SORT */}

          <div className="relative">
            <FaFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

            <select
              value={sort}
              onChange={(e) => onSort(e.target.value)}
              className=" w-full rounded-xl border border-slate-200 py-3 pl-10 outline-none"
            >
              <option value="latest">Latest</option>

              <option value="name">Name A-Z</option>

              <option value="price-low">Price Low</option>

              <option value="price-high">Price High</option>
            </select>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductToolbar;
