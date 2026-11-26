import { useMemo } from "react";
import { useCatalog } from "../../context/CatalogContext";
import { brands } from "../../data/brandsData";

const useSearch = (query) => {
  const { products: catalogProducts = [] } = useCatalog();
  const normalizedQuery = String(query || "").toLowerCase().trim();

  return useMemo(() => {
    if (!normalizedQuery) return [];

    const availableProducts = catalogProducts.filter((p) => {
      const qty = Number(p.localQuantity ?? p.liveQuantity ?? 0);
      const price = Number(p.livePrice ?? p.price ?? 0);
      return qty > 0 && price > 0;
    });

    const productMatches = availableProducts.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(normalizedQuery) ||
        (p.brand || "").toLowerCase().includes(normalizedQuery) ||
        (p.sku || "").toLowerCase().includes(normalizedQuery) ||
        (p.activeStockSku || "").toLowerCase().includes(normalizedQuery)
    );

    const stockedBrands = new Set(
      availableProducts.map((p) => String(p.brand || "").trim().toLowerCase())
    );
    const brandMatches = brands.filter(
      (b) =>
        stockedBrands.has(b.name.toLowerCase()) &&
        b.name.toLowerCase().includes(normalizedQuery)
    );

    return {
      products: productMatches.slice(0, 8),
      brands: brandMatches.slice(0, 5),
    };
  }, [catalogProducts, normalizedQuery]);
};

export default useSearch;
