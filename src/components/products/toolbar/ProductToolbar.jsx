import { useState } from "react";

import ActiveFilterChips from "./ActiveFilterChips";
import SearchInput from "./SearchInput";
import DesktopFilters from "./DesktopFilters";
import MobileToolbar from "./MobileToolbar";
import MobileFilterDrawer from "./MobileFilterDrawer";

const ProductToolbar = (props) => {
  const [showFilters, setShowFilters] = useState(false);

  const activeFilters = [
    props.brand !== "All",
    props.availability !== "All",
    props.sort !== "latest",
  ].filter(Boolean).length;

  return (
    <section className="bg-white px-6 lg:px-10">
      <div className="hidden lg:block lg:col-span-3">
        <DesktopFilters {...props} />
      </div>

      <div className="lg:hidden">
        <div className="flex gap-3">
          <SearchInput
            value={props.search}
            onChange={props.onSearch}
            className="flex-1"
          />

          <MobileToolbar
            activeFilters={activeFilters}
            onOpen={() => setShowFilters(true)}
          />
        </div>
      </div>

      <MobileFilterDrawer
        open={showFilters}
        onClose={() => setShowFilters(false)}
        {...props}
      />
      <ActiveFilterChips
        brand={props.brand}
        availability={props.availability}
        sort={props.sort}
        brands={props.brands}
        onBrandChange={props.onBrandChange}
        onAvailabilityChange={props.onAvailabilityChange}
        onSort={props.onSort}
      />
    </section>
  );
};

export default ProductToolbar;
