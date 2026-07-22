import { useState } from "react";
import { FiChevronDown, FiBox } from "react-icons/fi";

import categories from "../../../data/categories";
import MobileSubCategoryAccordion from "./MobileSubCategoryAccordion";

const MobileCategoryAccordion = ({ onClose }) => {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);

  const toggleCategory = (slug) => {
    setActiveCategory(activeCategory === slug ? null : slug);
  };

  return (
    <div>
      {/* PRODUCTS HEADER */}

      <button
        onClick={() => setOpen(!open)}
        className="
          w-full
          flex
          items-center
          justify-between
          rounded-xl
          px-4
          py-3
          hover:bg-slate-100
          transition
        "
      >
        <div className="flex items-center gap-3">
          <FiBox className="text-sky-700 text-lg" />

          <span className="font-medium text-slate-700">Products</span>
        </div>

        <FiChevronDown
          className={`
            transition-transform
            duration-300
            ${open ? "rotate-180" : ""}
          `}
        />
      </button>

      {/* CATEGORY LIST */}

      {open && (
        <div
          className="
            ml-4
            mt-2
            border-l
            border-slate-200
            pl-3
            space-y-1
          "
        >
          {categories.map((category) => (
            <div key={category.slug}>
              <button
                onClick={() => toggleCategory(category.slug)}
                className="
                  w-full
                  flex
                  items-center
                  justify-between
                  rounded-lg
                  px-3
                  py-2
                  text-sm
                  text-slate-600
                  hover:bg-slate-100
                "
              >
                <span>{category.name}</span>

                <FiChevronDown
                  className={`
                    text-sm
                    transition-transform
                    ${activeCategory === category.slug ? "rotate-180" : ""}
                  `}
                />
              </button>

              {activeCategory === category.slug && (
                <MobileSubCategoryAccordion
                  category={category}
                  onClose={onClose}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MobileCategoryAccordion;
