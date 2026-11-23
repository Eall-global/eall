import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoMdClose } from "react-icons/io";
import {
  FiSearch,
  FiArrowRight,
  FiX,
  FiChevronDown,
  FiCheck,
  FiGlobe,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import MobileQuickActions from "./mobile/MobileQuickActions";
import MobileNavigation from "./mobile/MobileNavigation";
import MobileSocialLinks from "./mobile/MobileSocialLinks";
import useSearchEngine from "../search/useSearchEngine";
import { useCountry } from "../../context/CountryContext";
import CountryFlag from "../common/CountryFlag";

const MobileMenu = ({ isOpen, onClose, onSearch }) => {
  const [query, setQuery] = useState("");
  const [regionOpen, setRegionOpen] = useState(false);
  const results = useSearchEngine(query);
  const { activeCountry, publicCountries, switchCountry, countryPath } =
    useCountry();

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const handleClose = () => {
    setRegionOpen(false);
    onClose();
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    if (!query.trim()) return;
    onSearch(query.trim());
    setQuery("");
    handleClose();
  };

  const handleResultClick = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setQuery("");
    handleClose();
  };

  const hasResults =
    results.products.length > 0 ||
    results.brands.length > 0 ||
    results.categories.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-slate-950/45 backdrop-blur-[2px] z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Slide-over Drawer */}
          <motion.div
            className="fixed top-0 right-0 h-full w-[86%] max-w-[340px] bg-white z-50 shadow-2xl flex flex-col text-left"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
          >
            {/* STICKY DRAWER HEADER */}
            <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <Link
                to={countryPath("/")}
                onClick={handleClose}
                className="flex items-center gap-2"
              >
                <img
                  src="/logo.png"
                  alt="E-ALL"
                  className="h-7 w-auto object-contain"
                />
                <div className="leading-tight">
                  <span className="text-sm font-black tracking-tight text-slate-900 block">
                    E-ALL
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-sky-700 block">
                    Retail &amp; Wholesale
                  </span>
                </div>
              </Link>

              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                aria-label="Close menu"
              >
                <IoMdClose className="text-xl" />
              </button>
            </div>

            {/* SCROLLABLE CONTENT BODY */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              {/* Compact Search Input */}
              <form
                onSubmit={handleSearch}
                className="flex items-center gap-2 h-10 border border-slate-200 focus-within:border-sky-600 focus-within:bg-white rounded-xl px-3 bg-slate-50 transition"
              >
                <FiSearch className="text-slate-400 text-sm shrink-0" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products, brands, SKU..."
                  className="w-full outline-none text-[13px] bg-transparent text-slate-800 placeholder:text-slate-400"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="text-slate-400 hover:text-slate-600 text-sm shrink-0 cursor-pointer"
                  >
                    <FiX />
                  </button>
                )}
              </form>

              {/* LIVE SEARCH RESULTS */}
              {query.trim() ? (
                <div className="flex flex-col gap-4 text-left">
                  {hasResults ? (
                    <>
                      {results.brands.length > 0 && (
                        <div>
                          <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                            Brands
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {results.brands.map((b) => (
                              <Link
                                key={b.slug}
                                to={countryPath(`/brands/${b.slug}`)}
                                onClick={handleResultClick}
                                className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 text-xs font-semibold hover:bg-sky-100 transition"
                              >
                                {b.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {results.categories.length > 0 && (
                        <div>
                          <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                            Categories
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {results.categories.map((c) => (
                              <Link
                                key={c.slug}
                                to={countryPath(`/products?category=${c.slug}`)}
                                onClick={handleResultClick}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition"
                              >
                                {c.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {results.products.length > 0 && (
                        <div>
                          <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                            Products
                          </p>
                          <div className="space-y-1.5">
                            {results.products.map((p) => (
                              <Link
                                key={p.id}
                                to={countryPath(`/products/${p.slug}`)}
                                onClick={handleResultClick}
                                className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition border border-slate-100"
                              >
                                {p.image && (
                                  <img
                                    src={p.image}
                                    alt={p.name}
                                    className="w-9 h-9 object-contain rounded-lg shrink-0 bg-slate-50 p-0.5"
                                  />
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-slate-800 truncate">
                                    {p.name}
                                  </p>
                                  <p className="text-[10.5px] text-slate-400">
                                    {p.brand}
                                  </p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleSearch}
                        className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-slate-900 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        <span>View all results for &quot;{query}&quot;</span>
                        <FiArrowRight />
                      </button>
                    </>
                  ) : (
                    <div className="py-8 text-center text-slate-500">
                      <p className="text-xs font-semibold text-slate-700">
                        No products found
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Try searching by brand, model, or category
                      </p>
                      <button
                        type="button"
                        onClick={handleSearch}
                        className="mt-3 inline-flex items-center gap-1 text-xs text-sky-700 font-semibold hover:underline cursor-pointer"
                      >
                        Search catalog anyway →
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <MobileQuickActions onClose={handleClose} />
                  <MobileNavigation onClose={handleClose} />
                </>
              )}
            </div>

            {/* STICKY BOTTOM FOOTER: SINGLE CLEAN REGION & CURRENCY DROPDOWN + SOCIAL */}
            <div className="shrink-0 border-t border-slate-200/80 bg-slate-50/90 px-4 py-3.5 space-y-3">
              {/* Single Clean Region & Currency Dropdown */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <FiGlobe className="text-[11px]" />
                    <span>Region &amp; Currency</span>
                  </span>
                </div>

                {/* Drop-Up Menu */}
                <AnimatePresence>
                  {regionOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-20"
                    >
                      <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                        {publicCountries.map((country) => {
                          const isSelected = country.code === activeCountry.code;
                          return (
                            <button
                              key={country.code}
                              type="button"
                              onClick={() => {
                                switchCountry(country.slug);
                                setRegionOpen(false);
                                handleClose();
                              }}
                              className={`w-full px-3 py-2.5 flex items-center justify-between gap-2 text-left transition cursor-pointer ${
                                isSelected ? "bg-sky-50" : "hover:bg-slate-50"
                              }`}
                            >
                              <span className="flex items-center gap-2.5 min-w-0">
                                <CountryFlag
                                  code={country.code}
                                  className="w-5 h-3.5"
                                />
                                <span className="text-xs font-semibold text-slate-900 truncate">
                                  {country.name}
                                </span>
                              </span>
                              <span className="flex items-center gap-1.5 shrink-0">
                                <span
                                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                    isSelected
                                      ? "bg-sky-700 text-white"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {country.currency}
                                </span>
                                {isSelected && (
                                  <FiCheck className="text-sky-700 text-xs" />
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Single Dropdown Trigger */}
                <button
                  type="button"
                  onClick={() => setRegionOpen((prev) => !prev)}
                  aria-expanded={regionOpen}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 hover:border-sky-400 flex items-center justify-between gap-2 transition shadow-2xs cursor-pointer"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <CountryFlag code={activeCountry.code} className="w-5 h-3.5" />
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {activeCountry.name}
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10.5px] font-mono font-extrabold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">
                      {activeCountry.currency}
                    </span>
                    <FiChevronDown
                      className={`text-slate-400 text-sm transition-transform ${
                        regionOpen ? "rotate-180" : ""
                      }`}
                    />
                  </span>
                </button>
              </div>

              <MobileSocialLinks />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
