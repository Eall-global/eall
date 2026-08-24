import ProductSubCategories from "../../components/products/ProductSubCategories";
import ProductGrid from "../../components/products/ProductGrid";
import ProductEmptyState from "../../components/products/ProductEmptyState";

import categories from "../../data/categories";
import { products as fallbackProducts } from "../../data/products/index";
import { useEffect, useMemo, useState } from "react";
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

  const category = searchParams.get("category") || "All";

  const urlSubCategory = searchParams.get("subcategory") || "All";

  const [selectedFamily, setSelectedFamily] = useState("All");

  const urlSearch = searchParams.get("search") || searchParams.get("q") || "";
  const [search, setSearch] = useState(urlSearch);

  const [brand, setBrand] = useState("All");

  const [availability, setAvailability] = useState("All");

  const [sort, setSort] = useState("latest");

  /*
    Sync search state with URL query param
  */
  useEffect(() => {
    const q = searchParams.get("search") || searchParams.get("q") || "";
    setSearch(q);
  }, [searchParams]);

  /*
    Reset family when category or subcategory changes
  */
  useEffect(() => {
    setSelectedFamily("All");
  }, [category, urlSubCategory]);

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
  /*
    Show family pills only when
    category + subcategory exists
  */
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
  ]);

  return (
    <div className=" bg-white lg:pt-32 pt-24">
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

      <div className="py-4 text-sm text-slate-500 bg-white">
        Showing
        <span className="font-semibold text-sky-700 mx-1">
          {filteredProducts.length}
        </span>
        products
      </div>

      {filteredProducts.length > 0 ? (
        <ProductGrid
          key={`${category}-${urlSubCategory}-${selectedFamily}`}
          products={filteredProducts}
        />
      ) : (
        <ProductEmptyState />
      )}
    </div>
  );
};

export default AllProductsPage;
