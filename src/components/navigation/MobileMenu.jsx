import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoMdClose } from "react-icons/io";
import { FiSearch, FiArrowRight, FiX } from "react-icons/fi";
import { Link } from "react-router-dom";
import MobileQuickActions from "./mobile/MobileQuickActions";
import MobileNavigation from "./mobile/MobileNavigation";
import MobileSocialLinks from "./mobile/MobileSocialLinks";
import useSearchEngine from "../search/useSearchEngine";

const MobileMenu = ({ isOpen, onClose, onSearch }) => {
  const [query, setQuery] = useState("");
  const results = useSearchEngine(query);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query.trim());
    setQuery("");
    onClose();
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
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="             
              fixed top-0 right-0
              h-full w-[85%] max-w-sm
              bg-white
              z-50
              shadow-2xl
              p-5
              flex flex-col
              gap-5
              overflow-y-auto
            "
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            transition={{ type: "tween", duration: 0.3 }}
          >
            {/* Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Menu</h2>

              <button
                onClick={onClose}
                className="text-slate-800 hover:text-red-500 text-2xl cursor-pointer"
                aria-label="Close menu"
              >
                <IoMdClose />
              </button>
            </div>

            {/* 🔍 SEARCH (PRIMARY UX ELEMENT) */}
            <form
              onSubmit={handleSearch}
              className="flex items-center gap-2 border border-slate-200 focus-within:border-sky-500 rounded-xl px-3 py-2.5 bg-slate-50 transition"
            >
              <FiSearch className="text-slate-400 text-lg shrink-0" />

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, brands..."
                className="w-full outline-none text-sm bg-transparent text-slate-800"
              />

              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-slate-400 hover:text-slate-600 text-lg shrink-0"
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
                    {/* Matching Brands */}
                    {results.brands.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                          Brands
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {results.brands.map((b) => (
                            <Link
                              key={b.slug}
                              to={`/brands/${b.slug}`}
                              onClick={() => {
                                setQuery("");
                                onClose();
                              }}
                              className="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 text-xs font-semibold hover:bg-sky-100 transition"
                            >
                              {b.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matching Categories */}
                    {results.categories.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                          Categories
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {results.categories.map((c) => (
                            <Link
                              key={c.slug}
                              to={`/products?category=${c.slug}`}
                              onClick={() => {
                                setQuery("");
                                onClose();
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition"
                            >
                              {c.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matching Products */}
                    {results.products.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                          Products
                        </p>
                        <div className="space-y-2">
                          {results.products.map((p) => (
                            <Link
                              key={p.id}
                              to={`/products/${p.slug}`}
                              onClick={() => {
                                setQuery("");
                                onClose();
                              }}
                              className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition border border-slate-100"
                            >
                              {p.image && (
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  className="w-10 h-10 object-contain rounded-lg shrink-0 bg-slate-50"
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-slate-800 truncate">
                                  {p.name}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  {p.brand}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* View All Matching Products */}
                    <button
                      type="button"
                      onClick={handleSearch}
                      className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      View all results for "{query}"
                      <FiArrowRight />
                    </button>
                  </>
                ) : (
                  <div className="py-8 text-center text-slate-500">
                    <p className="text-sm font-medium">No products found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try searching by brand, model, or category
                    </p>
                    <button
                      type="button"
                      onClick={handleSearch}
                      className="mt-4 inline-flex items-center gap-1.5 text-xs text-sky-700 font-semibold hover:underline"
                    >
                      Search all products anyway →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* 🚀 QUICK ACTIONS (CTA BLOCK) */}
                <MobileQuickActions onClose={onClose} />

                {/* NAVIGATION */}
                <MobileNavigation onClose={onClose} />

                <MobileSocialLinks />
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
