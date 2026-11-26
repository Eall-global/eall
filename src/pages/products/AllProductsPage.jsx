import { useMemo, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FiSearch,
  FiX,
  FiBriefcase,
  FiChevronRight,
  FiSliders,
  FiRotateCcw,
  FiGlobe,
  FiPackage,
} from "react-icons/fi";
import ProductSubCategories from "../../components/products/ProductSubCategories";
import ProductGrid from "../../components/products/ProductGrid";
import ProductEmptyState from "../../components/products/ProductEmptyState";
import ProductPagination from "../../components/products/ProductPagination";
import QuickRfqModal from "../../components/home/QuickRfqModal";

import categories from "../../data/categories";
import { brands } from "../../data/brandsData";
import { useCatalog } from "../../context/CatalogContext";
import { useCountry } from "../../context/CountryContext";
import { slugify } from "../../utils/slugify";

const DEPARTMENT_SHORTCUTS = [
  { id: "all", label: "All Departments", category: "All", subcategory: "All" },
  {
    id: "smartphones",
    label: "Smartphones",
    category: "mobile-devices",
    subcategory: "smartphones",
  },
  {
    id: "feature-phones",
    label: "Feature Phones",
    category: "mobile-devices",
    subcategory: "feature-phones",
  },
  {
    id: "tablets",
    label: "Tablets & iPad",
    category: "mobile-devices",
    subcategory: "tablets",
  },
  {
    id: "audio",
    label: "Audio & Earbuds",
    category: "consumer-electronics",
    subcategory: "audio",
  },
  {
    id: "wearables",
    label: "Smartwatches & Wearables",
    category: "consumer-electronics",
    subcategory: "wearables",
  },
];

const AllProductsPage = () => {
  const {
    products: liveProducts = [],
    isStrictLocalCountry,
    countryStockedCount,
  } = useCatalog();
  const { activeCountry, countryPath, switchCountry } = useCountry();
  const products = liveProducts;
  const [searchParams, setSearchParams] = useSearchParams();

  const catalogTopRef = useRef(null);

  const category = searchParams.get("category") || "All";
  const urlSubCategory = searchParams.get("subcategory") || "All";
  const brand = searchParams.get("brand") || "All";
  const sort = searchParams.get("sort") || "featured";
  const urlSearch = searchParams.get("search") || searchParams.get("q") || "";

  const [selectedFamily, setSelectedFamily] = useState("All");
  const [searchInput, setSearchInput] = useState(null);
  const search = searchInput !== null ? searchInput : urlSearch;
  const [rfqOpen, setRfqOpen] = useState(false);

  // 24 products per page (divisible by 2, 3, 4, and 6 columns)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 24;

  const activeCategory = useMemo(() => {
    if (category === "All") return null;
    const catSlug = slugify(category);
    return categories.find(
      (item) => slugify(item.slug) === catSlug || slugify(item.name) === catSlug
    );
  }, [category]);

  const activeSubCategory = useMemo(() => {
    if (!activeCategory || urlSubCategory === "All") {
      return null;
    }

    const subSlug = slugify(urlSubCategory);
    return activeCategory.subCategories.find(
      (item) => slugify(item.slug) === subSlug || slugify(item.name) === subSlug
    );
  }, [activeCategory, urlSubCategory]);

  const showFamilies = Boolean(activeSubCategory?.families?.length);

  const handleSelectDepartment = (dept) => {
    setSelectedFamily("All");
    setCurrentPage(1);
    const next = new URLSearchParams(searchParams);
    if (dept.category === "All") {
      next.delete("category");
      next.delete("subcategory");
    } else {
      next.set("category", dept.category);
      if (dept.subcategory && dept.subcategory !== "All") {
        next.set("subcategory", dept.subcategory);
      } else {
        next.delete("subcategory");
      }
    }
    setSearchParams(next);
  };

  const handleSelectBrand = (brandValue) => {
    setCurrentPage(1);
    const next = new URLSearchParams(searchParams);
    if (brandValue === "All") {
      next.delete("brand");
    } else {
      next.set("brand", brandValue);
    }
    setSearchParams(next);
  };

  const handleSortChange = (nextSort) => {
    setCurrentPage(1);
    const next = new URLSearchParams(searchParams);
    if (!nextSort || nextSort === "featured") {
      next.delete("sort");
    } else {
      next.set("sort", nextSort);
    }
    setSearchParams(next);
  };

  const handleSearchChange = (val) => {
    setSearchInput(val);
    setCurrentPage(1);
  };

  const handleFamilyChange = (fam) => {
    setSelectedFamily(fam);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSelectedFamily("All");
    setCurrentPage(1);
    setSearchParams({});
  };

  const filteredProducts = useMemo(() => {
    const result = products.filter((product) => {
      // 1. CATEGORY FILTER
      if (category !== "All") {
        const catSlug = slugify(category);
        const prodCat = slugify(product.category);
        const prodCatName = slugify(product.categoryName);
        if (prodCat !== catSlug && prodCatName !== catSlug) {
          return false;
        }
      }

      // 2. SUB CATEGORY FILTER
      if (urlSubCategory !== "All") {
        const subSlug = slugify(urlSubCategory);
        const prodSub = slugify(product.subCategory);
        const prodSubName = slugify(product.subCategoryName);
        if (prodSub !== subSlug && prodSubName !== subSlug) {
          return false;
        }
      }

      // 3. FAMILY FILTER
      if (selectedFamily !== "All") {
        const famSlug = slugify(selectedFamily);
        const prodFam = slugify(product.family);
        const prodFamName = slugify(product.familyName);
        if (prodFam !== famSlug && prodFamName !== famSlug) {
          return false;
        }
      }

      // 4. BRAND FILTER
      if (brand !== "All") {
        const brandTarget = slugify(brand);
        const prodBrand = slugify(product.brandSlug || product.brand);
        if (prodBrand !== brandTarget) {
          return false;
        }
      }

      // 5. SEARCH QUERY (strictly surface in-stock products with valid selling price > 0)
      if (search) {
        const qty = Number(product.localQuantity ?? product.liveQuantity ?? 0);
        const effPrice = Number(product.livePrice ?? product.price ?? 0);
        if (qty <= 0 || effPrice <= 0) {
          return false;
        }
        const q = search.toLowerCase();
        const matchesName =
          product.name?.toLowerCase().includes(q) ||
          product.activeStockName?.toLowerCase().includes(q);
        const matchesBrand = product.brand?.toLowerCase().includes(q);
        const matchesSku =
          product.sku?.toLowerCase().includes(q) ||
          product.activeStockSku?.toLowerCase().includes(q);
        const matchesCategory =
          product.categoryName?.toLowerCase().includes(q) ||
          product.category?.toLowerCase().includes(q);
        const matchesSubCategory = product.subCategory?.toLowerCase().includes(q);
        const matchesTag = product.tags?.some((t) =>
          t.toLowerCase().includes(q)
        );

        if (
          !matchesName &&
          !matchesBrand &&
          !matchesSku &&
          !matchesCategory &&
          !matchesSubCategory &&
          !matchesTag
        ) {
          return false;
        }
      }

      return true;
    });

    const getEffectivePrice = (p) =>
      Number(p.livePrice !== undefined ? p.livePrice : p.price) || 0;

    switch (sort) {
      case "name":
        result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      case "price-low":
        result.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
        break;
      case "price-high":
        result.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
        break;
      case "latest":
        result.sort((a, b) => {
          const aNew = a.isNewArrival ? 1 : 0;
          const bNew = b.isNewArrival ? 1 : 0;
          if (bNew !== aNew) return bNew - aNew;
          return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
        });
        break;
      default:
        // Featured & Curated priority
        result.sort((a, b) => {
          const aFeat = a.isFeatured ? 1 : 0;
          const bFeat = b.isFeatured ? 1 : 0;
          if (bFeat !== aFeat) return bFeat - aFeat;
          const aNew = a.isNewArrival ? 1 : 0;
          const bNew = b.isNewArrival ? 1 : 0;
          return bNew - aNew;
        });
        break;
    }

    return result;
  }, [
    category,
    urlSubCategory,
    selectedFamily,
    brand,
    search,
    sort,
    products,
  ]);

  // Derived pagination calculations
  const totalProducts = filteredProducts.length;
  const totalPages = Math.ceil(totalProducts / pageSize);
  const safeCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
  const paginatedProducts = filteredProducts.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    catalogTopRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const activeDepartmentTitle = useMemo(() => {
    if (search) return `Search Results for "${search}"`;
    if (activeSubCategory?.name) return activeSubCategory.name;
    if (activeCategory?.name) return activeCategory.name;
    if (brand !== "All") {
      const bObj = brands.find((b) => slugify(b.slug) === slugify(brand));
      return bObj ? `${bObj.name} Official Catalog` : `${brand} Products`;
    }
    return "All Electronics & Mobile Devices";
  }, [search, activeSubCategory, activeCategory, brand]);

  const hasActiveFilters =
    category !== "All" ||
    urlSubCategory !== "All" ||
    brand !== "All" ||
    selectedFamily !== "All" ||
    Boolean(search);

  return (
    <div className="bg-slate-50/40 min-h-screen pt-[82px] sm:pt-[96px] xl:pt-[142px] pb-16 text-left">
      {/* Scroll-anchor for smooth pagination jumping */}
      <div ref={catalogTopRef} className="scroll-mt-32" />

      {/* ================================================================= */}
      {/* COMPACT MOBILE-FIRST CATALOG FILTER & SORT TOOLBAR                */}
      {/* ================================================================= */}
      <div className="bg-white border-b border-slate-200/80">
        <div className="w-full px-3 sm:px-6 lg:px-8 py-3 sm:py-4 space-y-2.5 sm:space-y-3">
          {/* Compact Breadcrumb + Subtle Utilities (No Redundant Hero Heading / Count) */}
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
              <h1 className="text-[11px] sm:text-xs font-bold text-slate-900 truncate">
                {activeDepartmentTitle}
              </h1>
            </nav>

            <div className="flex items-center gap-2 shrink-0">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition cursor-pointer"
                >
                  <FiRotateCcw className="text-[11px]" />
                  <span>Reset</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setRfqOpen(true)}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
              >
                <FiBriefcase className="text-xs" />
                <span>Bulk B2B Quote</span>
              </button>
            </div>
          </div>

          {/* 1-CLICK DEPARTMENT SHORTCUT RAIL */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {DEPARTMENT_SHORTCUTS.map((dept) => {
              const isActive =
                slugify(category) === slugify(dept.category) &&
                slugify(urlSubCategory) === slugify(dept.subcategory);
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => handleSelectDepartment(dept)}
                  className={`px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-slate-100/90 hover:bg-slate-200/70 text-slate-700"
                  }`}
                >
                  {dept.label}
                </button>
              );
            })}
          </div>

          {/* BRAND PILLS + COMPACT SEARCH & SORT CONTROLS */}
          <div className="pt-2 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
            {/* Brand Quick Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-0.5 shrink-0">
                Brand:
              </span>
              <button
                type="button"
                onClick={() => handleSelectBrand("All")}
                className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition cursor-pointer shrink-0 ${
                  brand === "All"
                    ? "bg-sky-700 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                All
              </button>
              {brands.map((b) => {
                const isActive = slugify(brand) === slugify(b.slug);
                return (
                  <button
                    key={b.slug}
                    type="button"
                    onClick={() => handleSelectBrand(b.slug)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition cursor-pointer shrink-0 ${
                      isActive
                        ? "bg-sky-700 text-white"
                        : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {b.name}
                  </button>
                );
              })}
            </div>

            {/* Compact Search + Sort Controls (Clean Mobile Typography) */}
            <div className="grid grid-cols-12 sm:flex items-center gap-2">
              <div className="relative col-span-6 sm:w-56">
                <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Filter model, SKU..."
                  className="w-full h-9 pl-8 pr-7 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-sky-600 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => handleSearchChange("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <FiX className="text-xs" />
                  </button>
                )}
              </div>

              <div className="relative col-span-6 sm:w-auto shrink-0">
                <FiSliders className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                <select
                  value={sort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="w-full h-9 pl-7 pr-6 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-sky-600 cursor-pointer"
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
      </div>

      {/* SUB-CATEGORY FAMILY PILLS */}
      {showFamilies && (
        <ProductSubCategories
          subCategories={activeSubCategory.families}
          selected={selectedFamily}
          onChange={handleFamilyChange}
        />
      )}

      {/* PRODUCT COUNT STRIP */}
      <div className="w-full px-3 sm:px-6 lg:px-8 pt-3 flex items-center justify-between text-[11px] sm:text-xs text-slate-500 font-medium">
        <span>
          Showing{" "}
          <strong className="text-slate-900 font-bold">
            {totalProducts === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}–
            {Math.min(safeCurrentPage * pageSize, totalProducts)}
          </strong>{" "}
          of <strong className="text-slate-900 font-bold">{totalProducts}</strong>{" "}
          items
        </span>

        {selectedFamily !== "All" && (
          <span className="text-[11px] text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full font-semibold border border-sky-200">
            {selectedFamily}
          </span>
        )}
      </div>

      {/* PRODUCT GRID */}
      {totalProducts > 0 ? (
        <>
          <ProductGrid
            products={paginatedProducts}
            key={`${category}-${urlSubCategory}-${selectedFamily}-${brand}-${sort}-${safeCurrentPage}`}
          />

          <ProductPagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            totalProducts={totalProducts}
            pageSize={pageSize}
            onPageChange={handlePageChange}
          />
        </>
      ) : isStrictLocalCountry && countryStockedCount === 0 ? (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xs p-8 sm:p-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center mx-auto text-2xl">
              <FiPackage />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-black text-slate-900">
                {activeCountry.flag} {activeCountry.hubName} Stock Transfer Pending
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                E-ALL {activeCountry.shortName} strictly displays locally stocked{" "}
                {activeCountry.city} inventory ready for immediate delivery in{" "}
                <strong>{activeCountry.currency}</strong>. Local stock replenishment
                from our Dubai, China &amp; Hong Kong global hubs is currently being
                allocated.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => switchCountry("ae")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-extrabold transition cursor-pointer"
              >
                <FiGlobe />
                <span>Browse Dubai Main Hub (Global Export)</span>
              </button>
              <button
                type="button"
                onClick={() => setRfqOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold transition cursor-pointer"
              >
                <FiBriefcase />
                <span>Request {activeCountry.shortName} Stock Allocation</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <ProductEmptyState />
      )}

      <QuickRfqModal
        isOpen={rfqOpen}
        initialProduct={
          activeDepartmentTitle !== "All Electronics & Mobile Devices"
            ? activeDepartmentTitle
            : ""
        }
        onClose={() => setRfqOpen(false)}
      />
    </div>
  );
};

export default AllProductsPage;
