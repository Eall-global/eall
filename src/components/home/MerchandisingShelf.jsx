import { useState, useMemo, Fragment } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiGlobe, FiPackage } from "react-icons/fi";
import ProductCard from "../products/ProductCard";
import CouponTicketStrip, {
  useLocalizedCoupons,
} from "../common/CouponTicketStrip";
import { useCatalog } from "../../context/CatalogContext";
import { useCountry } from "../../context/CountryContext";
import { slugify } from "../../utils/slugify";

const TABS = [
  { id: "featured", label: "Top Sellers", viewAllLink: "/products" },
  { id: "new", label: "New Arrivals", viewAllLink: "/products" },
  { id: "apple", label: "Apple", viewAllLink: "/brands/apple" },
  { id: "samsung", label: "Samsung", viewAllLink: "/brands/samsung" },
  { id: "hmd-nokia", label: "HMD & Nokia", viewAllLink: "/brands/hmd" },
  {
    id: "audio-tablets",
    label: "Audio & Tablets",
    viewAllLink: "/products?category=consumer-electronics",
  },
];

const MerchandisingShelf = () => {
  const {
    products: liveProducts = [],
    isStrictLocalCountry,
    countryStockedCount,
  } = useCatalog();
  const { activeCountry, countryPath, switchCountry } = useCountry();
  const activeCoupons = useLocalizedCoupons();
  const [activeTab, setActiveTab] = useState("featured");

  const visibleProducts = useMemo(() => {
    const prioritizeVisual = (arr) =>
      [...arr].sort((a, b) => {
        const aFeat = a.isFeatured ? 1 : 0;
        const bFeat = b.isFeatured ? 1 : 0;
        if (bFeat !== aFeat) return bFeat - aFeat;
        const aNew = a.isNewArrival ? 1 : 0;
        const bNew = b.isNewArrival ? 1 : 0;
        return bNew - aNew;
      });

    if (activeTab === "new") {
      const fresh = liveProducts.filter((p) => p?.isNewArrival);
      return (fresh.length >= 6 ? fresh : liveProducts).slice(0, 12);
    }
    if (activeTab === "apple") {
      return prioritizeVisual(
        liveProducts.filter((p) => (p.brand || "").toLowerCase() === "apple")
      ).slice(0, 12);
    }
    if (activeTab === "samsung") {
      return prioritizeVisual(
        liveProducts.filter((p) => (p.brand || "").toLowerCase() === "samsung")
      ).slice(0, 12);
    }
    if (activeTab === "hmd-nokia") {
      return prioritizeVisual(
        liveProducts.filter((p) =>
          ["hmd", "nokia"].includes((p.brand || "").toLowerCase())
        )
      ).slice(0, 12);
    }
    if (activeTab === "audio-tablets") {
      return prioritizeVisual(
        liveProducts.filter((p) =>
          ["audio", "tablets", "wearables"].includes(
            slugify(p.subCategory || "")
          )
        )
      ).slice(0, 12);
    }

    const featured = prioritizeVisual(liveProducts.filter((p) => p?.isFeatured));
    return (
      featured.length >= 6 ? featured : prioritizeVisual(liveProducts)
    ).slice(0, 12);
  }, [activeTab, liveProducts]);

  const currentTabMeta = TABS.find((t) => t.id === activeTab) || TABS[0];

  return (
    <section className="py-8 sm:py-12 bg-white text-left">
      <div className="w-full px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-5">
        {/* Header + Interactive Retail Department Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4">
          <div>
            <span className="text-[10.5px] sm:text-[11px] font-extrabold uppercase tracking-wider text-sky-700">
              Curated Electronics Collection
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900 mt-0.5">
              Shop Top Electronics
            </h2>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full sm:rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/90 hover:border-slate-300"
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2-Col Mobile / 3-Col sm / 4-Col lg / 6-Col xl+ Grid — Coupons Strictly After Every 2nd Row */}
        {visibleProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5 sm:gap-4">
            {visibleProducts.map((product, idx) => {
              const hasCoupons = activeCoupons.length > 0;
              return (
                <Fragment key={product.id || product.slug}>
                  <ProductCard product={product} />

                  {/* Mobile (< sm, 2/row): 1 SINGLE crisp ticket after Row 2 (idx 3), Row 4 (idx 7), Row 6 (idx 11) */}
                  {hasCoupons && idx === 3 && (
                    <CouponTicketStrip
                      coupons={activeCoupons.slice(0, 1)}
                      className="sm:hidden my-1"
                    />
                  )}
                  {hasCoupons && idx === 7 && activeCoupons.length > 1 && (
                    <CouponTicketStrip
                      coupons={activeCoupons.slice(1, 2)}
                      className="sm:hidden my-1"
                    />
                  )}
                  {hasCoupons && idx === 11 && activeCoupons.length > 2 && (
                    <CouponTicketStrip
                      coupons={activeCoupons.slice(2, 3)}
                      className="sm:hidden my-1"
                    />
                  )}

                  {/* Tablet sm (3/row): Twin strip after Row 2 (idx 5) & Row 4 (idx 11) */}
                  {hasCoupons && idx === 5 && (
                    <CouponTicketStrip
                      coupons={activeCoupons.slice(0, 2)}
                      className="hidden sm:block lg:hidden my-1.5"
                    />
                  )}
                  {hasCoupons && idx === 11 && activeCoupons.length > 2 && (
                    <CouponTicketStrip
                      coupons={activeCoupons.slice(2, 4)}
                      className="hidden sm:block lg:hidden my-1.5"
                    />
                  )}

                  {/* Laptop lg (4/row): Twin strip after Row 2 (idx 7) */}
                  {hasCoupons && idx === 7 && (
                    <CouponTicketStrip
                      coupons={activeCoupons.slice(0, 2)}
                      className="hidden lg:block xl:hidden my-1.5"
                    />
                  )}

                  {/* Desktop xl+ (6/row): Twin strip after Row 2 (idx 11) */}
                  {hasCoupons && idx === 11 && (
                    <CouponTicketStrip
                      coupons={activeCoupons.slice(0, 2)}
                      className="hidden xl:block my-2"
                    />
                  )}
                </Fragment>
              );
            })}

            {/* Graceful fallback when fewer items exist than 2 full rows at a breakpoint */}
            {activeCoupons.length > 0 && visibleProducts.length < 4 && (
              <CouponTicketStrip
                coupons={activeCoupons.slice(0, 1)}
                className="sm:hidden my-1"
              />
            )}
            {activeCoupons.length > 0 && visibleProducts.length < 6 && (
              <CouponTicketStrip
                coupons={activeCoupons.slice(0, 2)}
                className="hidden sm:block lg:hidden my-1.5"
              />
            )}
            {activeCoupons.length > 0 && visibleProducts.length < 8 && (
              <CouponTicketStrip
                coupons={activeCoupons.slice(0, 2)}
                className="hidden lg:block xl:hidden my-1.5"
              />
            )}
            {activeCoupons.length > 0 && visibleProducts.length < 12 && (
              <CouponTicketStrip
                coupons={activeCoupons.slice(0, 2)}
                className="hidden xl:block my-2"
              />
            )}
          </div>
        ) : isStrictLocalCountry ? (
          <div className="bg-slate-50 rounded-3xl border border-slate-200 p-8 sm:p-10 text-center max-w-3xl mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mx-auto text-xl">
              <FiPackage />
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              {countryStockedCount === 0
                ? `${activeCountry.flag} ${activeCountry.hubName} Stock Allocation in Progress`
                : `No local ${currentTabMeta.label} units currently on-hand in ${activeCountry.shortName}`}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
              E-ALL {activeCountry.shortName} strictly displays ready-to-ship local{" "}
              {activeCountry.city} inventory. Additional units can be transferred
              rapidly from our <strong>Dubai, China &amp; Hong Kong</strong> global
              supply hubs.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
              {countryStockedCount > 0 && activeTab !== "featured" && (
                <button
                  type="button"
                  onClick={() => setActiveTab("featured")}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-sky-700 text-white text-xs font-extrabold transition cursor-pointer"
                >
                  View Available {activeCountry.shortName} Stock ({countryStockedCount})
                </button>
              )}
              <button
                type="button"
                onClick={() => switchCountry("ae")}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-extrabold transition cursor-pointer"
              >
                <FiGlobe />
                <span>Browse Dubai Main Hub (UAE / Export)</span>
              </button>
              <Link
                to={countryPath("/contact")}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold transition"
              >
                Request Local Transfer <FiArrowRight />
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-3xl border border-slate-200 p-12 text-center space-y-2">
            <p className="text-sm font-bold text-slate-700">
              Explore our full electronics catalog.
            </p>
            <Link
              to={countryPath("/products")}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:underline"
            >
              Browse All Products <FiArrowRight />
            </Link>
          </div>
        )}

        {/* Bottom Centered CTA */}
        <div className="pt-2 flex justify-center">
          <Link
            to={countryPath(currentTabMeta.viewAllLink)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-900 text-slate-900 hover:text-white border border-slate-300 hover:border-slate-900 text-xs sm:text-sm font-bold shadow-2xs transition"
          >
            <span>View All {currentTabMeta.label}</span>
            <FiArrowRight />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default MerchandisingShelf;
