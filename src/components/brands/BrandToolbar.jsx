import { useState } from "react";

import { FiSearch } from "react-icons/fi";
import { HiOutlineMenuAlt2 } from "react-icons/hi";

const BrandToolbar = ({ search, onSearch, sort, onSort, total }) => {
  const [showFilter, setShowFilter] = useState(false);

  return (
    <section className="py-2 px-6 lg:px-10 lg:py-4 bg-slate-50 border-y">
      <div className="flex flex-row gap-4 justify-between items-center">
        <p className="text-slate-500 text-sm">Showing {total} products</p>

        <div className="flex flex-row gap-4 items-center">
          <div className="relative">
            <FiSearch
              className="
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
            />

            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search products..."
              className="
                  pl-11
                  pr-4
                  py-2
                  rounded-xl
                  border
                  w-72
                "
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="items-center"
            >
              <HiOutlineMenuAlt2 className="text-gray-800 font-bold text-4xl" />
            </button>

            {showFilter && (
              <div className=" absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border z-30 overflow-hidden">
                {[
                  ["latest", "Latest"],
                  ["name", "Name (A-Z)"],
                  ["price-low", "Price: Low to High"],
                  ["price-high", "Price: High to Low"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => {
                      onSort(value);
                      setShowFilter(false);
                    }}
                    className={` w-full text-left  px-4 py-3 hover:bg-slate-100
            ${sort === value ? "bg-sky-50 text-sky-700 font-semibold" : ""}
          `}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandToolbar;
