import { useState } from "react";
import { FiChevronDown, FiGrid } from "react-icons/fi";
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
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-100/90 hover:text-sky-700 transition cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-lg bg-slate-100/90 text-sky-700 flex items-center justify-center shrink-0 text-sm">
            <FiGrid />
          </span>
          <span>Shop by Category</span>
        </div>

        <FiChevronDown
          className={`text-slate-400 text-sm transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="ml-5 mt-1 mb-1.5 border-l border-slate-200 pl-3 space-y-0.5">
          {categories.map((category) => (
            <div key={category.slug}>
              <button
                type="button"
                onClick={() => toggleCategory(category.slug)}
                className="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <span>{category.name}</span>
                <FiChevronDown
                  className={`text-xs text-slate-400 transition-transform ${
                    activeCategory === category.slug ? "rotate-180" : ""
                  }`}
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
