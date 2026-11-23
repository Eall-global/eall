import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FiCheckCircle,
  FiSearch,
  FiX,
  FiSliders,
  FiBriefcase,
  FiShield,
  FiArrowRight,
  FiChevronRight,
  FiMapPin,
  FiCalendar,
  FiPackage,
  FiGlobe,
} from "react-icons/fi";
import { brands } from "../../data/brandsData";
import { useCatalog } from "../../context/CatalogContext";
import { useCountry } from "../../context/CountryContext";
import BrandSEO from "../../components/brands/BrandSEO";
import ProductCard from "../../components/products/ProductCard";
import QuickRfqModal from "../../components/home/QuickRfqModal";
import { slugify } from "../../utils/slugify";

const BRAND_STUDIO_ART = {
  apple: "/assets/home/cat-apple.png",
  samsung: "/assets/home/cat-samsung.png",
  hmd: "/assets/home/cat-hmd-nokia.png",
  nokia: "/assets/home/cat-feature-phones.png",
};

const BrandPage = () => {
  const { slug } = useParams();
  const { products: liveProducts = [], isStrictLocalCountry } = useCatalog();
  const { activeCountry, countryPath, switchCountry } = useCountry();
  const products = liveProducts;

  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [visibleCount, setVisibleCount] = useState(24);
  const [rfqOpen, setRfqOpen] = useState(false);

  const brand = brands.find((b) => b.slug === slug);

  const brandProducts = useMemo(
    () =>
      products.filter(
        (p) => slugify(p.brandSlug || p.brand) === slugify(slug)
      ),
    [products, slug]
  );

  // Dynamically derive subcategories with counts from actual brand catalog
  const categoryTabs = useMemo(() => {
    const counts = new Map();
    brandProducts.forEach((p) => {
      const sub = p.subCategory || "Other";
      counts.set(sub, (counts.get(sub) || 0) + 1);
    });
    const list = [
      {
        label: `All ${brand?.name || ""}`,
        value: "All",
        count: brandProducts.length,
      },
    ];
    counts.forEach((count, subName) => {
      list.push({ label: subName, value: slugify(subName), count });
    });
    return list;
  }, [brandProducts, brand?.name]);

  const filteredAndSorted = useMemo(() => {
    const filtered = brandProducts.filter((product) => {
      const matchesCategory =
        category === "All" ||
        slugify(product.subCategory) === slugify(category) ||
        slugify(product.family) === slugify(category);

      if (!matchesCategory) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = product.name?.toLowerCase().includes(q);
        const matchesSku = product.sku?.toLowerCase().includes(q);
        const matchesSub = product.subCategory?.toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesSub) return false;
      }

      return true;
    });

    const getEffectivePrice = (p) =>
      Number(p.livePrice !== undefined ? p.livePrice : p.price) || 0;

    switch (sort) {
      case "name":
        filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      case "price-low":
        filtered.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
        break;
      case "price-high":
        filtered.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
        break;
      case "latest":
        filtered.sort(
          (a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0)
        );
        break;
      default:
        filtered.sort((a, b) => {
          const featDiff = (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
          if (featDiff !== 0) return featDiff;
          return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
        });
        break;
    }

    return filtered;
  }, [brandProducts, category, search, sort]);

  if (!brand) {
    return (
      <div className="pt-36 pb-24 text-center">
        <h2 className="text-2xl font-bold text-rose-600">Brand not found</h2>
        <Link
          to="/brands"
          className="mt-4 inline-block text-xs font-bold text-sky-700 hover:underline"
        >
          ← Back to Official Brands
        </Link>
      </div>
    );
  }

  const studioArt =
    BRAND_STUDIO_ART[brand.slug] || "/assets/home/cat-smartphones.png";
  const otherBrands = brands.filter((b) => b.slug !== brand.slug);

  return (
    <div className="min-h-screen bg-slate-50/50 pt-[108px] sm:pt-[116px] xl:pt-[148px] pb-16 text-left">
      <BrandSEO brand={brand} />

      {/* ================================================================= */}
      {/* CLEAN LIGHT OFFICIAL BRAND FLAGSHIP HERO                          */}
      {/* ================================================================= */}
      <section className="bg-white border-b border-slate-200/80">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-4">
            <Link to={countryPath("/")} className="hover:text-sky-700 transition">
              Home
            </Link>
            <FiChevronRight className="text-slate-300" />
            <Link to={countryPath("/brands")} className="hover:text-sky-700 transition">
              Official Brands
            </Link>
            <FiChevronRight className="text-slate-300" />
            <span className="text-slate-900 font-bold">{brand.name} Store</span>
          </nav>

          <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 text-white p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center overflow-hidden relative shadow-sm">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-20 w-80 h-80 rounded-full bg-sky-500/15 blur-3xl"
            />

            {/* Left 8 cols: Brand Identity, Metrics & Actions */}
            <div className="lg:col-span-8 space-y-4 relative z-10">
              <div className="flex flex-wrap items-center gap-3">
                <div className="h-12 px-4 rounded-2xl bg-white flex items-center justify-center shadow-xs">
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="max-h-7 max-w-28 object-contain"
                  />
                </div>

                {brand.partnership && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-sky-500/20 text-sky-200 border border-sky-400/30">
                    <FiCheckCircle className="text-emerald-400" />
                    <span>
                      {brand.partnership.type} • {brand.partnership.region}
                    </span>
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
                  {brand.name} Official Store — {brand.tagline}
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  {brand.description}
                </p>
              </div>

              {/* Brand Facts Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 max-w-2xl">
                <div className="rounded-2xl bg-white/10 border border-white/10 px-3.5 py-2.5">
                  <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-300">
                    <FiPackage className="text-sky-400" /> Live Catalog
                  </span>
                  <p className="text-sm font-black text-white mt-0.5">
                    {brandProducts.length} Models
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 border border-white/10 px-3.5 py-2.5">
                  <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-300">
                    <FiShield className="text-emerald-400" /> Warranty
                  </span>
                  <p className="text-sm font-black text-white mt-0.5">
                    12-Month Official
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 border border-white/10 px-3.5 py-2.5">
                  <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-300">
                    <FiMapPin className="text-sky-400" /> Origin
                  </span>
                  <p className="text-sm font-black text-white mt-0.5 truncate">
                    {brand.country}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 border border-white/10 px-3.5 py-2.5">
                  <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-300">
                    <FiCalendar className="text-amber-400" /> Established
                  </span>
                  <p className="text-sm font-black text-white mt-0.5">
                    {brand.founded}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setRfqOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold shadow-xs transition cursor-pointer"
                >
                  <FiBriefcase className="text-sm" />
                  <span>Request {brand.name} Wholesale B2B Quote</span>
                </button>

                <Link
                  to={countryPath("/verify")}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition"
                >
                  <FiShield className="text-emerald-400" />
                  <span>Verify {brand.name} IMEI</span>
                </Link>
              </div>
            </div>

            {/* Right 4 cols: Studio Hardware Showcase */}
            <div className="lg:col-span-4 flex items-center justify-center relative z-10">
              <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-3xl bg-white/95 p-3 shadow-xl flex items-center justify-center overflow-hidden">
                <img
                  src={studioArt}
                  alt={`${brand.name} Flagship Lineup`}
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* INTERACTIVE BRAND DEPARTMENT TABS + SEARCH + SORT BAR           */}
          {/* =============================================================== */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Department Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {categoryTabs.map((tab) => {
                const isActive = category === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => {
                      setCategory(tab.value);
                      setVisibleCount(24);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      isActive
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "bg-slate-100/80 hover:bg-slate-200/70 text-slate-700"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-white text-slate-600"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search + Sort */}
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1 sm:w-64">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setVisibleCount(24);
                  }}
                  placeholder={`Search ${brand.name} models...`}
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-sky-600 text-xs text-slate-900 outline-none transition"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <FiX className="text-xs" />
                  </button>
                )}
              </div>

              <div className="relative shrink-0">
                <FiSliders className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="pl-8 pr-7 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none focus:border-sky-600 cursor-pointer"
                >
                  <option value="featured">Sort: Featured</option>
                  <option value="latest">Sort: New Arrivals</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name: A – Z</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* FULL-WIDTH 5-TO-6 COLUMN BRAND PRODUCT GRID                       */}
      {/* ================================================================= */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>
            Showing{" "}
            <strong className="text-slate-900 font-bold">
              {Math.min(visibleCount, filteredAndSorted.length)}
            </strong>{" "}
            of{" "}
            <strong className="text-slate-900 font-bold">
              {filteredAndSorted.length}
            </strong>{" "}
            {brand.name} products
          </span>
        </div>

        {filteredAndSorted.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 sm:gap-4">
              {filteredAndSorted.slice(0, visibleCount).map((product) => (
                <ProductCard
                  key={product.id || product.slug}
                  product={product}
                />
              ))}
            </div>

            {visibleCount < filteredAndSorted.length && (
              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 24)}
                  className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-sky-700 text-white text-xs font-extrabold transition shadow-xs cursor-pointer"
                >
                  Load More {brand.name} Products (
                  {filteredAndSorted.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        ) : isStrictLocalCountry && brandProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center max-w-2xl mx-auto space-y-3">
            <p className="text-base font-black text-slate-900">
              {activeCountry.flag} No {brand.name} local stock currently in{" "}
              {activeCountry.hubName}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              E-ALL {activeCountry.shortName} strictly lists locally stocked{" "}
              {activeCountry.city} inventory. You can browse our Dubai Main Hub for
              immediate export or request a local transfer from Dubai, China &amp; Hong
              Kong.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => switchCountry("ae")}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-extrabold cursor-pointer transition"
              >
                <FiGlobe />
                <span>View {brand.name} in Dubai Hub (UAE)</span>
              </button>
              <button
                type="button"
                onClick={() => setRfqOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold cursor-pointer transition"
              >
                <FiBriefcase />
                <span>Request {activeCountry.shortName} Allocation</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
            <p className="text-base font-bold text-slate-900">
              No matching {brand.name} products found
            </p>
            <p className="text-xs text-slate-500">
              Try clearing your search filter or switching department tabs.
            </p>
            <button
              type="button"
              onClick={() => {
                setCategory("All");
                setSearch("");
              }}
              className="px-4 py-2 rounded-xl bg-sky-700 text-white text-xs font-bold cursor-pointer"
            >
              Show All {brand.name} Models
            </button>
          </div>
        )}
      </section>

      {/* ================================================================= */}
      {/* EXPLORE OTHER OFFICIAL BRAND STORES                               */}
      {/* ================================================================= */}
      <section className="w-full px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700">
                Authorized Brand Portfolio
              </span>
              <h2 className="text-lg font-black text-slate-900">
                Explore Other Official Brand Stores
              </h2>
            </div>
            <Link
              to={countryPath("/brands")}
              className="text-xs font-bold text-sky-700 hover:underline"
            >
              All Brands →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {otherBrands.map((b) => (
              <Link
                key={b.slug}
                to={countryPath(`/brands/${b.slug}`)}
                className="group rounded-2xl border border-slate-200/80 hover:border-sky-300 bg-slate-50/60 hover:bg-white p-4 flex items-center justify-between gap-3 transition hover:shadow-md"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-14 h-14 rounded-xl bg-white border border-slate-200/70 p-2 flex items-center justify-center shrink-0">
                    <img
                      src={b.logo}
                      alt={b.name}
                      className="max-h-8 max-w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-slate-900 group-hover:text-sky-700 transition">
                      {b.name} Store
                    </h3>
                    <p className="text-xs text-slate-500 truncate">
                      {b.tagline}
                    </p>
                  </div>
                </div>
                <FiArrowRight className="text-slate-400 group-hover:text-sky-700 group-hover:translate-x-0.5 transition shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <QuickRfqModal
        isOpen={rfqOpen}
        initialProduct={`${brand.name} Wholesale Stock Inquiry`}
        onClose={() => setRfqOpen(false)}
      />
    </div>
  );
};

export default BrandPage;
