import React from "react";
import { FiPackage } from "react-icons/fi";

const quantities = [
  "Less than 100 Units",
  "100 - 500 Units",
  "500 - 1000 Units",
  "1000+ Units",
];

const QuantitySelector = ({ value, onChange }) => {
  return (
    <div className="text-left w-full">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
        Expected Quantity <span className="text-rose-500">*</span>
      </label>

      <div className="flex flex-wrap gap-2.5">
        {quantities.map((item) => {
          const isActive = value === item;

          return (
            <button
              key={item}
              type="button"
              onClick={() => onChange(item)}
              className={`px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? "bg-sky-700 text-white border-sky-700 shadow-md shadow-sky-700/20 scale-[1.02]"
                  : "bg-white text-slate-700 border-slate-200 hover:border-sky-400 hover:text-slate-900 hover:bg-slate-50/80 shadow-xs"
              }`}
            >
              <FiPackage className={`text-xs shrink-0 ${isActive ? "text-white" : "text-sky-700"}`} />
              <span>{item}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuantitySelector;
