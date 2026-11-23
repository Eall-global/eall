import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FiCheckCircle,
  FiArrowRight,
  FiBriefcase,
  FiShield,
  FiSearch,
  FiX,
  FiChevronRight,
} from "react-icons/fi";
import { brands } from "../../data/brandsData";
import { products as fallbackProducts } from "../../data/products/index";
import { useCatalog } from "../../context/CatalogContext";
import { useCountry } from "../../context/CountryContext";
import QuickRfqModal from "../../components/home/QuickRfqModal";
import { AedPrice } from "../../components/common/AedSymbol";
import { slugify } from "../../utils/slugify";

const BRAND_STUDIO_ART = {
  apple: "/assets/home/cat-apple.png",
  samsung: "/assets/home/cat-samsung.png",
  hmd: "/assets/home/cat-hmd-nokia.png",
  nokia: "/assets/home/cat-feature-phones.png",
};

const BrandsPage = () => {
  const { products: liveProducts } = useCatalog();
  const { countryPath } = useCountry();
  const products = liveProducts || fallbackProducts;
  const [search, setSearch] = useState("");
  const [rfqTarget, setRfqTarget] = useState({ open: false, product: "" });

  const enrichedBrands = useMemo(() => {
    return brands
      .map((b) => {
        const bProducts = products.filter(
          (p) => slugify(p.brandSlug || p.brand) === slugify(b.slug)
        );
        const topModels = [...bProducts]
          .sort(
            (x, y) =>
              (y.isFeatured ? 1 : 0) - (x.isFeatured ? 1 : 0) ||
              (y.isNewArrival ? 1 : 0) - (x.isNewArrival ? 1 : 0)
          )
          .slice(0, 3);
        return {
          ...b,
          liveCount: bProducts.length,
          topModels,
          studioArt:
            BRAND_STUDIO_ART[b.slug] || "/assets/home/cat-smartphones.png",
        };
      })
      .filter((b) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          b.name.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          b.tagline?.toLowerCase().includes(q)
        );
      });
  }, [products, search]);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] xl:min-h-screen bg-slate-50 pt-[81px] sm:pt-[93px] xl:pt-[142px] pb-12 sm:pb-16 text-left">
      {/* ================================================================= */}
      {/* COMPACT MOBILE-FIRST TOOLBAR / DESKTOP HEADER BANNER              */}
      {/* ================================================================= */}
      <section className="bg-white border-b border-slate-200/80">
        <div className="w-full px-3.5 sm:px-6 lg:px-8 py-3 sm:py-4 xl:py-6 space-y-2.5 xl:space-y-4">
          {/* Compact Breadcrumb + Quick B2B Utility Row (Consistent with Shop) */}
          <div className="flex items-center justify-between gap-2">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 font-medium min-w-0"
            >
              <Link
                to={countryPath("/")}
                className="hover:text-sky-700 transition shrink-0"
              >
                Home
              </Link>
              <FiChevronRight className="text-slate-300 shrink-0 text-xs" />
              <span className="text-slate-900 font-bold truncate">
                Official Brand Stores
              </span>
            </nav>

            <button
              type="button"
              onClick={() =>
                setRfqTarget({
                  open: true,
                  product: "Multi-Brand Wholesale Stock Sheet",
                })
              }
              className="xl:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 hover:bg-orange-100 border border-orange-200/80 text-orange-700 text-[11px] font-bold shrink-0 transition cursor-pointer"
            >
              <FiBriefcase className="text-[11px]" />
              <span>B2B Sheet</span>
            </button>
          </div>

          {/* Mobile Compact Sub-strip (Count + Warranty pill, zero bloated hero) */}
          <div className="flex xl:hidden items-center justify-between gap-2">
            <h1 className="text-[15px] sm:text-lg font-extrabold text-slate-900 tracking-tight">
              Official Flagship Stores
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[10.5px] font-bold shrink-0">
              <FiCheckCircle className="text-[11px]" />
              <span>100% Genuine</span>
            </span>
          </div>

          {/* Desktop Editorial Header + Inline Search & B2B Action (xl+) */}
          <div className="hidden xl:flex items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-700">
                Authorized Global Brand Supply
              </span>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                Official Brand Flagship Stores
              </h1>
              <p className="mt-1 text-sm text-slate-600 max-w-2xl">
                100% genuine factory-sealed devices with official 12-month manufacturer warranty, direct retail checkout, and master carton B2B allocation.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <div className="relative w-64">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter brand store..."
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-sky-600 text-xs text-slate-900 outline-none"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear filter"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <FiX className="text-xs" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  setRfqTarget({
                    open: true,
                    product: "Multi-Brand Wholesale Stock Sheet",
                  })
                }
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold shadow-xs transition cursor-pointer"
              >
                <FiBriefcase className="text-sm" />
                <span>Request B2B Stock Sheet</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* BRAND STORE SHOWCASE CARDS (Native Compact Mobile | 2-Col Desktop)*/}
      {/* ================================================================= */}
      <section className="w-full px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-5">
          {enrichedBrands.map((brand) => (
            <div
              key={brand.slug}
              className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 hover:border-sky-300 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-lg transition-all duration-200 p-4 sm:p-6 flex flex-col justify-between gap-3.5 sm:gap-5"
            >
              {/* Top Row: Always Horizontal (Logo + Copy Left | Studio Art Right) */}
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="h-9 sm:h-11 px-2.5 sm:px-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0">
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="max-h-5 sm:max-h-6 max-w-20 sm:max-w-24 object-contain"
                      />
                    </div>

                    {brand.liveCount > 0 ? (
                      <span className="text-[10.5px] sm:text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200/80">
                        {brand.liveCount}{" "}
                        {brand.liveCount === 1 ? "Model" : "Models"}
                      </span>
                    ) : (
                      <span className="text-[10.5px] sm:text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200/80">
                        On Request · Hub Supply
                      </span>
                    )}

                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <FiCheckCircle className="text-xs" /> Official Warranty
                    </span>
                  </div>

                  <div>
                    <h2 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight">
                      {brand.name} Official Store
                    </h2>
                    <p className="text-[11.5px] sm:text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {brand.description}
                    </p>
                  </div>
                </div>

                <Link
                  to={countryPath(`/brands/${brand.slug}`)}
                  className="w-18 h-18 sm:w-28 sm:h-28 rounded-2xl bg-slate-50 border border-slate-200/70 overflow-hidden shrink-0"
                >
                  <img
                    src={brand.studioArt}
                    alt={brand.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </Link>
              </div>

              {/* Middle Row: Popular Devices (Horizontal swipe on mobile, 3-col on sm+) */}
              {brand.topModels.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Popular {brand.name} Devices
                  </span>
                  <div className="flex sm:grid sm:grid-cols-3 gap-2 overflow-x-auto pb-0.5 no-scrollbar">
                    {brand.topModels.map((item) => (
                      <Link
                        key={item.slug}
                        to={countryPath(`/products/${item.slug}`)}
                        className="min-w-[168px] sm:min-w-0 rounded-xl bg-slate-50/90 hover:bg-sky-50/60 border border-slate-200/70 hover:border-sky-300 p-2 flex items-center gap-2 transition shrink-0"
                      >
                        <img
                          src={item.image || "/logo.png"}
                          alt={item.name}
                          className="w-9 h-9 object-contain mix-blend-multiply shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-[11.5px] font-bold text-slate-900 truncate">
                            {item.shortName || item.name}
                          </p>
                          <AedPrice
                            amount={item.livePrice || item.price || 0}
                            className="text-[11px] font-black font-mono text-sky-800"
                            symbolClassName="text-sky-700"
                          />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Row: Clean Single-Line Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <Link
                  to={countryPath(`/brands/${brand.slug}`)}
                  className="flex-1 h-10 px-3.5 rounded-xl bg-slate-900 hover:bg-sky-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition"
                >
                  <span>Explore {brand.name}</span>
                  <FiArrowRight className="text-xs shrink-0" />
                </Link>

                <button
                  type="button"
                  onClick={() =>
                    setRfqTarget({
                      open: true,
                      product: `${brand.name} Wholesale Carton Quote`,
                    })
                  }
                  className="h-10 px-3.5 rounded-xl bg-orange-50 hover:bg-orange-500 text-orange-700 hover:text-white border border-orange-200 hover:border-orange-500 text-xs font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition cursor-pointer shrink-0"
                >
                  <FiBriefcase className="text-xs shrink-0" />
                  <span>B2B Quote</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================= */}
      {/* IMEI VERIFICATION STRIP (Compact Native Card on Mobile)           */}
      {/* ================================================================= */}
      <section className="w-full px-3.5 sm:px-6 lg:px-8">
        <Link
          to={countryPath("/verify")}
          className="rounded-2xl sm:rounded-3xl bg-linear-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-4 sm:p-7 flex items-center justify-between gap-3.5 shadow-xs hover:opacity-95 transition"
        >
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center text-lg sm:text-2xl shrink-0">
              <FiShield />
            </div>
            <div className="min-w-0">
              <h3 className="text-[13.5px] sm:text-lg font-extrabold text-white leading-snug">
                Verify Device IMEI &amp; Warranty
              </h3>
              <p className="text-[11.5px] sm:text-sm text-slate-300 truncate sm:whitespace-normal mt-0.5">
                Confirm authenticity &amp; official coverage on any E-ALL device.
              </p>
            </div>
          </div>

          <span className="hidden sm:inline-flex px-5 py-2.5 rounded-xl bg-white text-slate-950 text-xs font-extrabold items-center gap-2 shrink-0">
            <span>Verify IMEI</span>
            <FiArrowRight />
          </span>
          <FiChevronRight className="sm:hidden text-sky-300 text-lg shrink-0" />
        </Link>
      </section>

      <QuickRfqModal
        isOpen={rfqTarget.open}
        initialProduct={rfqTarget.product}
        onClose={() => setRfqTarget({ open: false, product: "" })}
      />
    </div>
  );
};

export default BrandsPage;
