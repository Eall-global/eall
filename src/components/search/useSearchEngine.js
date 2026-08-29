import { useMemo } from "react";
import { products } from "../../data/products/index";
import categories from "../../data/categories";
import { brands } from "../../data/brandsData";

export const TRENDING_SEARCHES = [
  "iPhone 16 Pro",
  "Nokia 150 Music",
  "AirPods Pro",
  "HMD 100",
  "iPhone 17 Pro Max",
  "Feature Phones",
  "Apple",
  "Wireless Audio",
];

const useSearchEngine = (query = "") => {
  const q = query.toLowerCase().trim();

  return useMemo(() => {
    // Featured / Popular fallback products when no query is typed
    const popularProducts = products.slice(0, 4);

    if (!q) {
      return {
        products: [],
        brands: [],
        categories: [],
        popularProducts,
        trendingSearches: TRENDING_SEARCHES,
        totalMatches: 0,
      };
    }

    const productResults = products.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
    );

    const brandResults = brands.filter((b) =>
      b.name.toLowerCase().includes(q) || (b.slug && b.slug.toLowerCase().includes(q))
    );

    const categoryResults = categories.filter((c) =>
      c.name.toLowerCase().includes(q) || (c.slug && c.slug.toLowerCase().includes(q))
    );

    const totalMatches = productResults.length + brandResults.length + categoryResults.length;

    return {
      products: productResults.slice(0, 8),
      allProductResults: productResults,
      brands: brandResults.slice(0, 6),
      categories: categoryResults.slice(0, 6),
      popularProducts,
      trendingSearches: TRENDING_SEARCHES,
      totalMatches,
    };
  }, [q]);
};

export default useSearchEngine;
