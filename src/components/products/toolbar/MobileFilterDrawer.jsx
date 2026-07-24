import { useEffect, useState } from "react";
import { productFilters } from "../../../data/productFilters";
import FilterSidebar from "./FilterSidebar";
import FilterOptions from "./FilterOptions";
import FilterFooter from "./FilterFooter";

const MobileFilterDrawer = ({
  open,
  onClose,

  brands,

  brand,
  availability,
  sort,

  onBrandChange,
  onAvailabilityChange,
  onSort,
}) => {
  const filters = productFilters({
    brands,
  });

  const [activeFilter, setActiveFilter] = useState("brand");

  const [draft, setDraft] = useState({
    brand,
    availability,
    sort,
  });

  useEffect(() => {
    if (open) {
      setDraft({
        brand,
        availability,
        sort,
      });
    }
  }, [open, brand, availability, sort]);

  if (!open) return null;

  const active = filters.find((item) => item.id === activeFilter);

  const reset = () => {
    setDraft({
      brand: "All",
      availability: "All",
      sort: "latest",
    });
  };

  const apply = () => {
    onBrandChange(draft.brand);

    onAvailabilityChange(draft.availability);

    onSort(draft.sort);

    onClose();
  };

  return (
    <>
      <div className=" fixed inset-0 bg-black/40 z-40" />

      <div className=" fixed inset-x-0 bottom-0 h-[85vh] bg-white rounded-t-3xl z-50 flex flex-col">
        <div className=" p-5 border-b font-bold text-lg">Filters</div>

        <div className=" flex flex-1 overflow-hidden">
          <FilterSidebar
            filters={filters}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            values={draft}
          />

          <FilterOptions
            filter={active}
            value={draft[active.id]}
            onChange={(value) =>
              setDraft((prev) => ({
                ...prev,
                [active.id]: value,
              }))
            }
          />
        </div>

        <FilterFooter onReset={reset} onApply={apply} />
      </div>
    </>
  );
};

export default MobileFilterDrawer;
