import { useState } from "react";
import { Link } from "react-router-dom";
import { FiSearch, FiX } from "react-icons/fi";

import useSearchEngine from "./useSearchEngine";

const SearchDrawer = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const results = useSearchEngine(query);

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 left-0 w-full bg-white shadow-2xl z-50 border-b">
      {/* TOP SEARCH BAR */}
      <div className="flex items-center gap-3 px-6 py-4 border-b">
        <FiSearch className="text-xl text-slate-500" />

        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products, brands, categories..."
          className="w-full outline-none text-lg"
        />

        <button onClick={onClose}>
          <FiX className="text-2xl text-slate-600" />
        </button>
      </div>

      {/* RESULTS AREA */}
      <div className="max-h-[70vh] overflow-y-auto px-6 py-6 grid md:grid-cols-3 gap-10">
        {/* BRANDS */}
        <div>
          <h3 className="font-semibold text-slate-600 mb-3">Brands</h3>

          {results.brands.map((b) => (
            <Link
              key={b.slug}
              to={`/brands/${b.slug}`}
              onClick={onClose}
              className="block py-2 hover:text-blue-600"
            >
              {b.name}
            </Link>
          ))}
        </div>

        {/* CATEGORIES */}
        <div>
          <h3 className="font-semibold text-slate-600 mb-3">Categories</h3>

          {results.categories.map((c) => (
            <Link
              key={c.slug}
              to={`/categories/${c.slug}`}
              onClick={onClose}
              className="block py-2 hover:text-blue-600"
            >
              {c.name}
            </Link>
          ))}
        </div>

        {/* PRODUCTS */}
        <div>
          <h3 className="font-semibold text-slate-600 mb-3">Products</h3>

          {results.products.map((p) => (
            <Link
              key={p.id}
              to={`/products/${p.slug}`}
              onClick={onClose}
              className="
                block
                py-2
                border-b
                border-slate-100
                hover:text-blue-600
              "
            >
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-slate-500">{p.brand}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* FOOTER ACTION */}
      {query && (
        <div className="px-6 py-4 border-t bg-slate-50">
          <Link
            to="/products"
            onClick={onClose}
            className="text-blue-600 font-semibold"
          >
            View all results →
          </Link>
        </div>
      )}
    </div>
  );
};

export default SearchDrawer;
