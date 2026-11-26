import { useMemo } from "react";
import { useCatalog } from "../../context/CatalogContext";
import categories from "../../data/categories";
import { brands } from "../../data/brandsData";

export const TRENDING_SEARCHES = [
  "HMD 100",
  "HMD 102",
  "Nokia 105",
  "Nokia 110 Power",
  "Nokia 150 Music",
  "Feature Phones",
];

const isSellableInStock = (p) => {
  if (!p) return false;
  const qty = Number(p.localQuantity ?? p.liveQuantity ?? 0);
  const price = Number(p.livePrice ?? p.price ?? 0);
  return qty > 0 && price > 0;
};

const useSearchEngine = (query = "") => {
  const { products: catalogProducts = [] } = useCatalog();
  const q = query.toLowerCase().trim();

  return useMemo(() => {
    // Strictly surface ONLY available, in-stock products with a valid selling price (> 0)
    const availableProducts = catalogProducts
      .filter(isSellableInStock)
      .sort(
        (a, b) =>
          Number(b.localQuantity ?? b.liveQuantity ?? 0) -
          Number(a.localQuantity ?? a.liveQuantity ?? 0)
      );

    // Build dynamic trending searches strictly from what is actually in stock for this country
    const dynamicTerms = [];
    const seenTerms = new Set();
    const pushTerm = (val) => {
      const clean = String(val || "").trim();
      const key = clean.toLowerCase();
      if (!clean || seenTerms.has(key)) return;
      seenTerms.add(key);
      dynamicTerms.push(clean);
    };

    availableProducts.slice(0, 5).forEach((p) => pushTerm(p.shortName || p.name));
    availableProducts.forEach((p) => {
      if (dynamicTerms.length < 8) pushTerm(p.brand);
    });
    availableProducts.forEach((p) => {
      if (dynamicTerms.length < 8) pushTerm(p.subCategory || p.categoryName);
    });

    const trendingSearches =
      dynamicTerms.length > 0 ? dynamicTerms.slice(0, 8) : TRENDING_SEARCHES;

    // Popular products = top stocked items in the active country
    const popularProducts = availableProducts.slice(0, 4);

    if (!q) {
      return {
        products: [],
        brands: [],
        categories: [],
        popularProducts,
        trendingSearches,
        totalMatches: 0,
      };
    }

    const productResults = availableProducts.filter((p) => {
      const haystacks = [
        p.name,
        p.shortName,
        p.activeStockName,
        p.brand,
        p.category,
        p.categoryName,
        p.subCategory,
        p.sku,
        p.activeStockSku,
        p.description,
        p.shortDescription,
      ];
      return haystacks.some((val) => val && String(val).toLowerCase().includes(q));
    });

    // Only suggest brands & categories that actually have in-stock products available
    const stockedBrandKeys = new Set(
      availableProducts.map((p) => String(p.brand || "").trim().toLowerCase())
    );
    const stockedBrandSlugs = new Set(
      availableProducts.map((p) => String(p.brandSlug || "").trim().toLowerCase())
    );
    const stockedCategoryKeys = new Set(
      availableProducts.flatMap((p) =>
        [p.category, p.categoryName, p.subCategory]
          .filter(Boolean)
          .map((c) => String(c).trim().toLowerCase())
      )
    );

    const brandResults = brands.filter((b) => {
      const hasStock =
        stockedBrandKeys.has(b.name.toLowerCase()) ||
        (b.slug && stockedBrandSlugs.has(b.slug.toLowerCase()));
      if (!hasStock) return false;
      return (
        b.name.toLowerCase().includes(q) ||
        (b.slug && b.slug.toLowerCase().includes(q))
      );
    });

    const categoryResults = categories.filter((c) => {
      const hasStock =
        stockedCategoryKeys.has(c.name.toLowerCase()) ||
        (c.slug && stockedCategoryKeys.has(c.slug.toLowerCase()));
      if (!hasStock) return false;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.slug && c.slug.toLowerCase().includes(q))
      );
    });

    const totalMatches =
      productResults.length + brandResults.length + categoryResults.length;

    return {
      products: productResults.slice(0, 8),
      allProductResults: productResults,
      brands: brandResults.slice(0, 6),
      categories: categoryResults.slice(0, 6),
      popularProducts,
      trendingSearches,
      totalMatches,
    };
  }, [catalogProducts, q]);
};

export default useSearchEngine;
