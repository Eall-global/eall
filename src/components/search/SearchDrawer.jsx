import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiX,
  FiArrowRight,
  FiTrendingUp,
  FiTag,
  FiLayers,
  FiShoppingBag,
  FiCheckCircle,
} from "react-icons/fi";
import useSearchEngine from "./useSearchEngine";
import { AedSymbol, AedPrice } from "../common/AedSymbol";

const SearchDrawer = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const results = useSearchEngine(query);

  // Focus input on open & lock background scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = "auto";
      setQuery("");
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleClose = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setQuery("");
    onClose();
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    const clean = query.trim();
    if (!clean) return;
    handleClose();
    navigate(`/products?search=${encodeURIComponent(clean)}`);
  };

  const handleKeywordClick = (keyword) => {
    setQuery(keyword);
  };

  const hasMatches =
    results.products.length > 0 ||
    results.brands.length > 0 ||
    results.categories.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-start">
          {/* Frosted Dark Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
          />

          {/* Desktop Search Panel */}
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative z-10 w-full bg-white shadow-2xl border-b border-slate-200 text-left max-h-[85vh] flex flex-col"
          >
            {/* 🔍 TOP SEARCH BAR */}
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between gap-4">
              <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-3.5">
                <FiSearch className="text-2xl text-sky-700 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by product name, brand, model, SKU, or category..."
                  className="w-full text-base sm:text-xl font-medium text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer shrink-0"
                    title="Clear search"
                  >
                    <FiX className="text-lg" />
                  </button>
                )}
              </form>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition cursor-pointer"
                >
                  <span className="hidden sm:inline">ESC</span>
                  <FiX className="text-sm" />
                </button>
              </div>
            </div>

            {/* 📦 CONTENT CONTAINER */}
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 overflow-y-auto flex-1 scrollbar-thin">
              
              {/* STATE 1: EMPTY QUERY (DISCOVERY MODE) */}
              {!query.trim() && (
                <div className="space-y-8 py-2">
                  
                  {/* Trending Search Badges */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <FiTrendingUp className="text-orange-500 text-sm" />
                      <span>Trending Searches</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {results.trendingSearches.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => handleKeywordClick(term)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-700 text-xs font-semibold border border-slate-200 hover:border-sky-300 transition cursor-pointer flex items-center gap-1.5"
                        >
                          <FiSearch className="text-[10px] text-slate-400" />
                          <span>{term}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Popular Featured Products */}
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FiShoppingBag className="text-sky-700 text-sm" />
                        <span>Popular in Catalog</span>
                      </h3>
                      <Link
                        to="/products"
                        onClick={handleClose}
                        className="text-xs font-bold text-sky-700 hover:underline flex items-center gap-1"
                      >
                        <span>Explore all</span>
                        <FiArrowRight className="text-[10px]" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {results.popularProducts.map((p) => (
                        <Link
                          key={p.id}
                          to={`/products/${p.slug}`}
                          onClick={handleClose}
                          className="group p-3.5 rounded-2xl border border-slate-100 hover:border-sky-300 hover:shadow-md bg-white hover:bg-slate-50/50 transition flex items-center gap-3.5"
                        >
                          <img
                            src={p.image || "/logo.png"}
                            alt={p.name}
                            className="w-14 h-14 object-contain bg-slate-50 rounded-xl p-1 border border-slate-100 shrink-0 group-hover:scale-105 transition-transform"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">
                              {p.brand}
                            </span>
                            <h4 className="font-bold text-xs text-slate-900 truncate group-hover:text-sky-700 transition-colors">
                              {p.name}
                            </h4>
                            <div className="mt-1">
                              <AedPrice
                                amount={p.price}
                                className="font-mono font-bold text-xs text-slate-900"
                              />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* STATE 2: ACTIVE SEARCH RESULTS (MATCHES FOUND) */}
              {query.trim() && hasMatches && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start py-2">
                  
                  {/* Left Column: Matching Brands & Categories */}
                  <div className="lg:col-span-4 space-y-6">
                    {/* Brands */}
                    {results.brands.length > 0 && (
                      <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <FiTag className="text-sky-700" />
                          <span>Matching Brands</span>
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {results.brands.map((b) => (
                            <Link
                              key={b.slug}
                              to={`/brands/${b.slug}`}
                              onClick={handleClose}
                              className="px-3 py-1.5 bg-white hover:bg-sky-50 text-slate-800 hover:text-sky-700 text-xs font-bold rounded-xl border border-slate-200 hover:border-sky-300 transition shadow-2xs"
                            >
                              {b.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Categories */}
                    {results.categories.length > 0 && (
                      <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <FiLayers className="text-sky-700" />
                          <span>Product Categories</span>
                        </h4>
                        <div className="space-y-1">
                          {results.categories.map((c) => (
                            <Link
                              key={c.slug}
                              to={`/products?category=${c.slug}`}
                              onClick={handleClose}
                              className="flex items-center justify-between p-2 rounded-xl hover:bg-white text-xs font-medium text-slate-700 hover:text-sky-700 transition"
                            >
                              <span>{c.name}</span>
                              <FiArrowRight className="text-slate-400 text-[10px]" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Matching Products Grid */}
                  <div className="lg:col-span-8 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Matching Products ({results.products.length})
                      </h4>
                      <button
                        type="button"
                        onClick={handleSearchSubmit}
                        className="text-xs font-bold text-sky-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>View all in catalog</span>
                        <FiArrowRight />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {results.products.map((p) => (
                        <Link
                          key={p.id}
                          to={`/products/${p.slug}`}
                          onClick={handleClose}
                          className="group p-3 rounded-2xl border border-slate-200/80 hover:border-sky-300 hover:shadow-md bg-white hover:bg-slate-50/40 transition flex items-center gap-3.5"
                        >
                          <img
                            src={p.image || "/logo.png"}
                            alt={p.name}
                            className="w-14 h-14 object-contain bg-slate-50 rounded-xl p-1 border border-slate-100 shrink-0 group-hover:scale-105 transition-transform"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9.5px] font-bold text-sky-700 uppercase tracking-wider">
                                {p.brand}
                              </span>
                              {p.sku && (
                                <span className="text-[9px] font-mono text-slate-400">
                                  • {p.sku}
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate group-hover:text-sky-700 transition-colors">
                              {p.name}
                            </h4>
                            <div className="mt-1 flex items-center justify-between">
                              <AedPrice
                                amount={p.price}
                                className="font-mono font-bold text-xs text-slate-900"
                              />
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                                In Stock
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* STATE 3: NO MATCHES FOUND */}
              {query.trim() && !hasMatches && (
                <div className="py-12 text-center max-w-md mx-auto space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-2xl">
                    <FiSearch />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    No results found for "{query}"
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Check your spelling or try searching with general terms like <strong>iPhone</strong>, <strong>Nokia</strong>, or <strong>AirPods</strong>.
                  </p>
                  <div className="pt-2">
                    <Link
                      to="/products"
                      onClick={handleClose}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold uppercase rounded-xl transition shadow-xs"
                    >
                      Browse Entire Catalog
                    </Link>
                  </div>
                </div>
              )}

            </div>

            {/* 🏁 BOTTOM BAR */}
            {query.trim() && hasMatches && (
              <div className="border-t border-slate-100 bg-slate-50/80 px-4 sm:px-8 py-3 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Showing top matches for <strong className="text-slate-900">"{query}"</strong>
                </span>

                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="inline-flex items-center gap-1.5 text-sky-700 hover:text-sky-900 font-bold cursor-pointer"
                >
                  <span>See all catalog results</span>
                  <FiArrowRight />
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SearchDrawer;
