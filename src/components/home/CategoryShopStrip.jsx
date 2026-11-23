import { useMemo } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiBriefcase } from "react-icons/fi";
import { useCatalog } from "../../context/CatalogContext";
import { slugify } from "../../utils/slugify";

const getImg = (p) =>
  p?.variants?.find((v) => v.isDefault)?.image ||
  p?.variants?.[0]?.image ||
  p?.image ||
  "/logo.png";

const CategoryShopStrip = ({ onOpenRfq }) => {
  const { products = [] } = useCatalog();

  const categoryCards = useMemo(() => {
    const matchBySub = (subSlug) =>
      products.filter(
        (p) =>
          slugify(p.subCategory || "") === subSlug ||
          slugify(p.subCategoryName || "") === subSlug
      );

    const smartphones = matchBySub("smartphones");
    const featurePhones = matchBySub("feature-phones");
    const audio = matchBySub("audio");
    const tablets = matchBySub("tablets");
    const wearables = matchBySub("wearables");

    const pickImg = (list, fallback) => {
      const hit = list.find((p) => getImg(p) !== "/logo.png");
      return hit ? getImg(hit) : fallback;
    };

    return [
      {
        id: "smartphones",
        title: "Smartphones",
        subtitle: "Apple, Samsung & HMD",
        count: smartphones.length,
        image: pickImg(smartphones, "/logo.png"),
        to: "/products?category=mobile-devices&subcategory=smartphones",
        accent: "group-hover:border-sky-300",
      },
      {
        id: "feature-phones",
        title: "Feature Phones",
        subtitle: "Nokia & HMD Classics",
        count: featurePhones.length,
        image: pickImg(featurePhones, "/logo.png"),
        to: "/products?category=mobile-devices&subcategory=feature-phones",
        accent: "group-hover:border-emerald-300",
      },
      {
        id: "audio",
        title: "Audio & Earbuds",
        subtitle: "AirPods, Buds & JBL",
        count: audio.length,
        image: pickImg(audio, "/logo.png"),
        to: "/products?category=consumer-electronics&subcategory=audio",
        accent: "group-hover:border-indigo-300",
      },
      {
        id: "tablets",
        title: "Tablets & iPads",
        subtitle: "Work & Entertainment",
        count: tablets.length,
        image: pickImg(tablets, "/logo.png"),
        to: "/products?category=mobile-devices&subcategory=tablets",
        accent: "group-hover:border-sky-300",
      },
      {
        id: "wearables",
        title: "Smart Wearables",
        subtitle: "Watches & Trackers",
        count: wearables.length,
        image: pickImg(wearables, "/logo.png"),
        to: "/products?category=consumer-electronics&subcategory=wearables",
        accent: "group-hover:border-sky-300",
      },
    ];
  }, [products]);

  return (
    <section className="py-10 sm:py-12 bg-white text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        {/* Header */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-700">
              Shop by Category
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 mt-0.5">
              Browse Electronics Departments
            </h2>
          </div>

          <Link
            to="/products"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-sky-700 hover:text-sky-900 whitespace-nowrap transition"
          >
            <span>All Categories</span>
            <FiArrowRight />
          </Link>
        </div>

        {/* 6-Card Visual Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {categoryCards.map((cat) => (
            <Link
              key={cat.id}
              to={cat.to}
              className={`group rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/80 ${cat.accent} hover:shadow-md p-3.5 sm:p-4 flex flex-col items-center text-center transition-all duration-200`}
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border border-slate-100 flex items-center justify-center p-2.5 mb-3 shadow-2xs">
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="max-h-16 sm:max-h-20 max-w-full object-contain transition-transform duration-300 group-hover:scale-108"
                  onError={(e) => {
                    e.currentTarget.src = "/logo.png";
                  }}
                />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                {cat.title}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                {cat.count > 0 ? `${cat.count} Models` : cat.subtitle}
              </p>
            </Link>
          ))}

          {/* 6th Tile: Wholesale Bulk Lots (B2B Orange Accent) */}
          <button
            type="button"
            onClick={() => onOpenRfq?.("Wholesale Mixed Carton Inquiry")}
            className="group rounded-2xl bg-gradient-to-br from-orange-50 via-white to-amber-50/60 border border-orange-200/90 hover:border-orange-400 hover:shadow-md p-3.5 sm:p-4 flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-orange-500/10 border border-orange-200/80 text-orange-600 flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-105">
              <FiBriefcase className="text-3xl" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
              Wholesale Lots
            </h3>
            <p className="text-[11px] font-semibold text-orange-600 mt-0.5">
              Request Bulk Quote →
            </p>
          </button>
        </div>
      </div>
    </section>
  );
};

export default CategoryShopStrip;

