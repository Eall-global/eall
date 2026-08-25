import React from "react";
import { FiLayers, FiChevronDown } from "react-icons/fi";

const ProductCategorySelect = ({ categories = [], value, onChange }) => {
  return (
    <div className="text-left w-full">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
        Product Category <span className="text-rose-500">*</span>
      </label>

      <div className="relative">
        <FiLayers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" />
        
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 pl-11 pr-10 py-3 bg-white text-slate-800 font-semibold text-sm focus:border-sky-600 focus:ring-2 focus:ring-sky-100 outline-none appearance-none cursor-pointer shadow-xs transition"
        >
          <option value="">Select product category...</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" />
      </div>
    </div>
  );
};

export default ProductCategorySelect;
