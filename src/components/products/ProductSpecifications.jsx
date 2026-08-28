import { useState } from "react";
import {
  FiCpu,
  FiMonitor,
  FiCamera,
  FiBatteryCharging,
  FiWifi,
  FiShield,
  FiMaximize2,
  FiLayers,
  FiTruck,
  FiAward,
} from "react-icons/fi";

const formatLabel = (key) => {
  if (!key) return "";
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

const SPEC_GROUPS = [
  {
    id: "display",
    title: "Display & Screen",
    icon: FiMonitor,
    color: "text-sky-600 bg-sky-50 border-sky-200",
    keys: ["display", "screen", "resolution", "panel", "refreshRate", "size", "materials", "durability"],
  },
  {
    id: "performance",
    title: "Performance & Hardware",
    icon: FiCpu,
    color: "text-indigo-600 bg-indigo-50 border-indigo-200",
    keys: ["processor", "chipset", "cpu", "memory", "ram", "storage", "expandableStorage", "operatingSystem", "os"],
  },
  {
    id: "camera",
    title: "Camera & Optics",
    icon: FiCamera,
    color: "text-rose-600 bg-rose-50 border-rose-200",
    keys: ["rearCamera", "mainCamera", "camera", "frontCamera", "selfieCamera", "video", "features"],
  },
  {
    id: "battery",
    title: "Battery & Power",
    icon: FiBatteryCharging,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    keys: ["battery", "charging", "fastCharging", "wirelessCharging"],
  },
  {
    id: "connectivity",
    title: "Connectivity & Network",
    icon: FiWifi,
    color: "text-purple-600 bg-purple-50 border-purple-200",
    keys: ["connectivity", "network", "sim", "security", "sensors", "bluetooth", "wifi", "nfc"],
  },
  {
    id: "dimensions",
    title: "Dimensions & Build",
    icon: FiMaximize2,
    color: "text-amber-600 bg-amber-50 border-amber-200",
    keys: ["dimensions", "weight", "waterResistance", "build"],
  },
];

const ProductSpecifications = ({ specifications = {}, product = {} }) => {
  const [activeTab, setActiveTab] = useState("all");

  const specEntries = Object.entries(specifications || {});

  if (specEntries.length === 0) return null;

  // Categorize specifications
  const categorized = SPEC_GROUPS.map((group) => {
    const matched = specEntries.filter(([key]) => {
      const lower = key.toLowerCase();
      return group.keys.some((k) => lower.includes(k.toLowerCase()));
    });
    return {
      ...group,
      items: matched,
    };
  }).filter((group) => group.items.length > 0);

  // Uncategorized specs
  const matchedKeys = new Set(categorized.flatMap((g) => g.items.map(([k]) => k)));
  const remaining = specEntries.filter(([k]) => !matchedKeys.has(k));

  const groupsToDisplay = activeTab === "all"
    ? categorized
    : categorized.filter((g) => g.id === activeTab);

  return (
    <div className="space-y-6 sm:space-y-8 text-left">
      
      {/* 🌟 TRUST & ASSURANCE STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="p-2 sm:p-2.5 rounded-xl bg-sky-50 text-sky-700 shrink-0">
            <FiShield className="text-lg sm:text-xl" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs leading-tight">100% Genuine</h4>
            <p className="text-[10.5px] sm:text-[11px] text-slate-500 mt-0.5">Factory sealed devices</p>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
            <FiAward className="text-lg sm:text-xl" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs leading-tight">Official Warranty</h4>
            <p className="text-[10.5px] sm:text-[11px] text-slate-500 mt-0.5">{product.warranty || "1-Year"} coverage</p>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-50 text-indigo-700 shrink-0">
            <span className="text-base sm:text-lg">🌊</span>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs leading-tight">Wave Transfer</h4>
            <p className="text-[10.5px] sm:text-[11px] text-slate-500 mt-0.5">0% fee instant payment</p>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="p-2 sm:p-2.5 rounded-xl bg-amber-50 text-amber-700 shrink-0">
            <FiTruck className="text-lg sm:text-xl" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs leading-tight">Fast Dispatch</h4>
            <p className="text-[10.5px] sm:text-[11px] text-slate-500 mt-0.5">Africa &amp; UAE delivery</p>
          </div>
        </div>
      </div>

      {/* 📋 SPECIFICATIONS CONTAINER */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xs p-5 sm:p-8 space-y-6">
        
        {/* Header & Horizontal Scrollable Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-sky-700 text-[11px] font-bold uppercase tracking-wider mb-1">
              <FiLayers />
              <span>Technical Data Sheet</span>
            </div>
            <h2 className="text-base sm:text-xl font-bold text-slate-900">
              Product Specifications &amp; Overview
            </h2>
          </div>

          {/* Group Filter Tabs (Horizontally Scrollable & Visible on ALL screens) */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 overflow-x-auto no-scrollbar whitespace-nowrap max-w-full">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer shrink-0 ${
                activeTab === "all"
                  ? "bg-sky-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              All Specs
            </button>
            {categorized.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer shrink-0 ${
                  activeTab === cat.id
                    ? "bg-sky-700 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                {cat.title.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* 📐 UNIFIED SPECIFICATIONS MATRIX (Clean, perfectly aligned table) */}
        <div className="space-y-6">
          {groupsToDisplay.map((group) => {
            const Icon = group.icon;
            return (
              <div
                key={group.id}
                className="rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs bg-white"
              >
                {/* Category Header */}
                <div className="bg-slate-50/90 px-4 sm:px-5 py-3 border-b border-slate-200/80 flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg border ${group.color} shrink-0`}>
                    <Icon className="text-sm" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                    {group.title}
                  </h3>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-slate-100 text-xs">
                  {group.items.map(([key, val], idx) => (
                    <div
                      key={key}
                      className={`flex flex-col sm:flex-row sm:items-center ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                      }`}
                    >
                      {/* Label Column (Fixed width on desktop) */}
                      <div className="w-full sm:w-56 md:w-64 px-4 sm:px-5 py-2.5 sm:py-3 text-slate-500 font-semibold sm:border-r sm:border-slate-100 shrink-0 bg-slate-50/60 sm:bg-transparent">
                        {formatLabel(key)}
                      </div>

                      {/* Value Column */}
                      <div className="flex-1 px-4 sm:px-5 py-2 sm:py-3 font-bold text-slate-900 leading-relaxed">
                        {String(val || "-")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Remaining Uncategorized Specs */}
          {remaining.length > 0 && activeTab === "all" && (
            <div className="rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs bg-white">
              <div className="bg-slate-50/90 px-4 sm:px-5 py-3 border-b border-slate-200/80 flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg border text-slate-700 bg-slate-100 border-slate-300 shrink-0">
                  <FiLayers className="text-sm" />
                </div>
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                  Additional Specifications
                </h3>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {remaining.map(([key, val], idx) => (
                  <div
                    key={key}
                    className={`flex flex-col sm:flex-row sm:items-center ${
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                    }`}
                  >
                    <div className="w-full sm:w-56 md:w-64 px-4 sm:px-5 py-2.5 sm:py-3 text-slate-500 font-semibold sm:border-r sm:border-slate-100 shrink-0 bg-slate-50/60 sm:bg-transparent">
                      {formatLabel(key)}
                    </div>
                    <div className="flex-1 px-4 sm:px-5 py-2 sm:py-3 font-bold text-slate-900 leading-relaxed">
                      {String(val || "-")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default ProductSpecifications;
