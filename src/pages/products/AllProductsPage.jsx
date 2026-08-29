import ProductSubCategories from "../../components/products/ProductSubCategories";
import ProductGrid from "../../components/products/ProductGrid";
import ProductEmptyState from "../../components/products/ProductEmptyState";
import ProductPagination from "../../components/products/ProductPagination";

import categories from "../../data/categories";
import { products as fallbackProducts } from "../../data/products/index";
import { useEffect, useMemo, useState, useRef } from "react";
import { brands } from "../../data/brandsData";
import { useSearchParams } from "react-router-dom";
import ProductToolbar from "../../components/products/toolbar/ProductToolbar";
import { useCatalog } from "../../context/CatalogContext";
import { slugify } from "../../utils/slugify";

const shuffleArray = (array) => {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
};

const AllProductsPage = () => {
  const { products: liveProducts } = useCatalog();
  const products = liveProducts || fallbackProducts;
  const [searchParams] = useSearchParams();

  const catalogTopRef = useRef(null);

  const category = searchParams.get("category") || "All";
  const urlSubCategory = searchParams.get("subcategory") || "All";
  const [selectedFamily, setSelectedFamily] = useState("All");

  const urlSearch = searchParams.get("search") || searchParams.get("q") || "";
  const [search, setSearch] = useState(urlSearch);

  const [brand, setBrand] = useState("All");
  const [availability, setAvailability] = useState("All");
  const [sort, setSort] = useState("latest");

  // Pagination state (16 products per page: 2 rows of 4 + breaker + 2 rows of 4)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 16;

  // Sync search state with URL query param
  useEffect(() => {
    const q = searchParams.get("search") || searchParams.get("q") || "";
    setSearch(q);
  }, [searchParams]);

  // Reset family & page when category or subcategory changes
  useEffect(() => {
    setSelectedFamily("All");
    setCurrentPage(1);
  }, [category, urlSubCategory]);

  // Reset page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [brand, availability, search, sort, selectedFamily]);

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

  const showFamilies = !!activeSubCategory;

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      // 1. CATEGORY FILTER (Normalized with slugify)
      if (category !== "All") {
        const catSlug = slugify(category);
        const prodCat = slugify(product.category);
        const prodCatName = slugify(product.categoryName);
        if (prodCat !== catSlug && prodCatName !== catSlug) {
          return false;
        }
      }

      // 2. SUB CATEGORY FILTER (Normalized with slugify e.g. "feature-phones" === "Feature Phones")
      if (urlSubCategory !== "All") {
        const subSlug = slugify(urlSubCategory);
        const prodSub = slugify(product.subCategory);
        const prodSubName = slugify(product.subCategoryName);
        if (prodSub !== subSlug && prodSubName !== subSlug) {
          return false;
        }
      }

      // 3. FAMILY FILTER (Normalized with slugify)
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

      // 5. AVAILABILITY FILTER
      if (availability !== "All" && product.availability !== availability) {
        return false;
      }

      // 6. SEARCH QUERY
      if (search) {
        const q = search.toLowerCase();
        const matchesName = product.name?.toLowerCase().includes(q);
        const matchesBrand = product.brand?.toLowerCase().includes(q);
        const matchesCategory =
          product.categoryName?.toLowerCase().includes(q) ||
          product.category?.toLowerCase().includes(q);
        const matchesSubCategory = product.subCategory?.toLowerCase().includes(q);
        const matchesTag = product.tags?.some((t) => t.toLowerCase().includes(q));

        if (!matchesName && !matchesBrand && !matchesCategory && !matchesSubCategory && !matchesTag) {
          return false;
        }
      }

      return true;
    });

    if (sort === "latest") {
      result = shuffleArray(result);
    }

    switch (sort) {
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;

      case "price-low":
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;

      case "price-high":
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;

      default:
        break;
    }

    return result;
  }, [
    category,
    urlSubCategory,
    selectedFamily,
    brand,
    availability,
    search,
    sort,
    products,
  ]);

  // Derived pagination calculations
  const totalProducts = filteredProducts.length;
  const totalPages = Math.ceil(totalProducts / pageSize);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    catalogTopRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="bg-white min-h-screen pt-24 sm:pt-28 lg:pt-32 pb-16">
      {/* Scroll-anchor for smooth pagination jumping */}
      <div ref={catalogTopRef} className="scroll-mt-24" />

      {/* FILTER TOOLBAR */}
      <ProductToolbar
        brand={brand}
        setBrand={setBrand}
        availability={availability}
        setAvailability={setAvailability}
        search={search}
        setSearch={setSearch}
        sort={sort}
        setSort={setSort}
        brands={brands}
      />

      {/* SUB-CATEGORY FAMILY PILLS */}
      {showFamilies && activeSubCategory.families && (
        <ProductSubCategories
          subCategories={activeSubCategory.families}
          selected={selectedFamily}
          onChange={setSelectedFamily}
        />
      )}

      {/* PRODUCT COUNT STRIP */}
      <div className="mx-auto w-full px-6 sm:px-8 lg:px-12 py-3 text-xs sm:text-sm text-slate-500 font-medium border-b border-slate-100 flex items-center justify-between text-left">
        <span>
          Showing{" "}
          <strong className="text-slate-900 font-bold">
            {totalProducts === 0 ? 0 : (currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, totalProducts)}
          </strong>{" "}
          of <strong className="text-slate-900 font-bold">{totalProducts}</strong> products
        </span>

        {selectedFamily !== "All" && (
          <span className="text-xs text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full font-semibold">
            Filtered by Family: {selectedFamily}
          </span>
        )}
      </div>

      {/* PRODUCT GRID */}
      {totalProducts > 0 ? (
        <>
          <ProductGrid
            products={paginatedProducts}
            key={`${category}-${urlSubCategory}-${selectedFamily}-${currentPage}`}
          />

          <ProductPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalProducts={totalProducts}
            pageSize={pageSize}
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        <ProductEmptyState />
      )}
    </div>
  );
};

export default AllProductsPage;
