import React from "react";
import { FiShoppingBag, FiTruck, FiBriefcase, FiUser } from "react-icons/fi";

const customerTypes = [
  { id: "Retailer", label: "Retailer", icon: FiShoppingBag },
  { id: "Distributor", label: "Distributor", icon: FiTruck },
  { id: "Corporate Buyer", label: "Corporate Buyer", icon: FiBriefcase },
  { id: "Individual Customer", label: "Individual Customer", icon: FiUser },
];

const CustomerTypeSelector = ({ value, onChange }) => {
  return (
    <div className="text-left w-full">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
        I am a <span className="text-rose-500">*</span>
      </label>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {customerTypes.map((item) => {
          const Icon = item.icon;
          const isActive = value === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`p-3.5 rounded-2xl text-sm border flex items-center justify-center gap-2.5 transition-all cursor-pointer font-semibold ${
                isActive
                  ? "bg-sky-700 text-white border-sky-700 shadow-md shadow-sky-700/20 scale-[1.02]"
                  : "bg-white text-slate-700 border-slate-200 hover:border-sky-400 hover:text-slate-900 hover:bg-slate-50/80 shadow-xs"
              }`}
            >
              <Icon className={`text-base shrink-0 ${isActive ? "text-white" : "text-sky-700"}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CustomerTypeSelector;
