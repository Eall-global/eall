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
    return categories.find((item) => item.slug === category);
  }, [category]);

  const activeSubCategory = useMemo(() => {
    if (!activeCategory || urlSubCategory === "All") {
      return null;
    }

    return activeCategory.subCategories.find(
      (item) => item.slug === urlSubCategory,
    );
  }, [activeCategory, urlSubCategory]);

  const showFamilies = !!activeSubCategory;

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      // CATEGORY FILTER
      if (category !== "All" && product.category !== category) {
        return false;
      }

      // SUB CATEGORY FILTER
      if (
        urlSubCategory !== "All" &&
        product.subCategory?.toLowerCase() !== urlSubCategory.toLowerCase()
      ) {
        return false;
      }

      // FAMILY FILTER
      if (selectedFamily !== "All" && product.family !== selectedFamily) {
        return false;
      }

      // BRAND FILTER
      if (brand !== "All" && product.brandSlug !== brand) {
        return false;
      }

      // AVAILABILITY
      if (availability !== "All" && product.availability !== availability) {
        return false;
      }

      // SEARCH
      if (search) {
        const q = search.toLowerCase();
        const matchesName = product.name?.toLowerCase().includes(q);
        const matchesBrand = product.brand?.toLowerCase().includes(q);
        const matchesCategory = product.categoryName?.toLowerCase().includes(q) || product.category?.toLowerCase().includes(q);
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
        result.sort((a, b) => a.price - b.price);
        break;

      case "price-high":
        result.sort((a, b) => b.price - a.price);
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

  // Compute pagination
  const totalProducts = filteredProducts.length;
  const totalPages = Math.ceil(totalProducts / pageSize) || 1;

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredProducts.slice(startIndex, startIndex + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);

    // Smooth auto-scroll back up to catalog header/toolbar
    if (catalogTopRef.current) {
      const yOffset = -90; // account for sticky header height
      const y = catalogTopRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div ref={catalogTopRef} className="bg-white lg:pt-32 pt-24 min-h-screen flex flex-col justify-between">
      <div>
        {/* Filter Toolbar */}
        <ProductToolbar
          search={search}
          onSearch={setSearch}
          brand={brand}
          onBrandChange={setBrand}
          brands={brands}
          availability={availability}
          onAvailabilityChange={setAvailability}
          sort={sort}
          onSort={setSort}
        />

        {showFamilies && (
          <ProductSubCategories
            subCategories={activeSubCategory.families}
            selected={selectedFamily}
            onChange={setSelectedFamily}
          />
        )}

        {/* Count Indicator */}
        <div className="py-3 px-6 md:px-10 text-xs sm:text-sm text-slate-500 bg-white border-b border-slate-100 flex items-center justify-between">
          <div>
            Showing <span className="font-bold text-sky-700">{paginatedProducts.length}</span> of{" "}
            <span className="font-bold text-slate-900">{totalProducts}</span> products
            {totalPages > 1 && (
              <span className="text-xs text-slate-400 ml-2">
                (Page {currentPage} of {totalPages})
              </span>
            )}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <ProductGrid
            key={`${category}-${urlSubCategory}-${selectedFamily}-${currentPage}`}
            products={paginatedProducts}
            showBreaker={true}
          />
        ) : (
          <ProductEmptyState />
        )}
      </div>

      {/* Pagination Controls with Auto-scroll */}
      {filteredProducts.length > 0 && totalPages > 1 && (
        <ProductPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalProducts={totalProducts}
          pageSize={pageSize}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default AllProductsPage;
