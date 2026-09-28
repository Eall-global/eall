import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { products as staticCatalog } from "../data/products/index";
import { fetchStock, subscribeToStock } from "../services/stockService";

const CatalogContext = createContext(null);

/**
 * Computes dynamic availability based on live database quantity and min_alert threshold
 */
export const computeLiveAvailability = (liveQty, minAlert = 3) => {
  const qty = Number(liveQty);
  if (isNaN(qty) || qty <= 0) {
    return {
      status: "Available on Request",
      badgeText: "Available on Request",
      className: "bg-blue-100 text-blue-700",
      inStock: false,
      isLowStock: false,
      unitsLeft: 0,
    };
  }

  if (qty <= Number(minAlert)) {
    return {
      status: "Limited Stock",
      badgeText: `Limited Stock (${qty} Left)`,
      className: "bg-yellow-100 text-yellow-700",
      inStock: true,
      isLowStock: true,
      unitsLeft: qty,
    };
  }

  return {
    status: "In Stock",
    badgeText: "In Stock",
    className: "bg-green-100 text-green-700",
    inStock: true,
    isLowStock: false,
    unitsLeft: qty,
  };
};

export const CatalogProvider = ({ children }) => {
  const [liveStockMap, setLiveStockMap] = useState(new Map());
  const [loading, setLoading] = useState(true);

  // Fetch live inventory from Firestore / stockService
  const refreshStock = useCallback(async () => {
    try {
      const stockData = await fetchStock();
      const map = new Map();
      (stockData || []).forEach((item) => {
        if (item.sku) {
          map.set(item.sku.toUpperCase(), item);
        }
      });
      setLiveStockMap(map);
    } catch (err) {
      console.warn("Could not fetch live stock for catalog:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and Google Firestore Real-time listener (unlimited connections, zero quota trap)
  useEffect(() => {
    refreshStock();

    const unsubscribe = subscribeToStock((stockData) => {
      const map = new Map();
      (stockData || []).forEach((item) => {
        if (item.sku) {
          map.set(item.sku.toUpperCase(), item);
        }
      });
      setLiveStockMap(map);
    });

    return () => {
      unsubscribe();
    };
  }, [refreshStock]);

  // Merge static catalog specifications with dynamic live inventory on SKU
  const products = useMemo(() => {
    return (staticCatalog || []).map((prod) => {
      const cleanSku = (prod.sku || `EALL-${(prod.brand || "GEN").toUpperCase()}-${prod.id}`).toUpperCase();
      const prodSlug = (prod.slug || "").toLowerCase();

      // Collect all Firestore documents belonging to this product
      // Matches: exact parentSku, exact sku, startsWith `${cleanSku}-`, or slug match
      const matchingItems = [];
      liveStockMap.forEach((item) => {
        const itemSku = (item.sku || "").toUpperCase();
        const itemParent = (item.parentSku || "").toUpperCase();
        const itemSlug = (item.slug || "").toLowerCase();

        const isExactParent = itemParent && itemParent === cleanSku;
        const isExactSku = itemSku === cleanSku;
        const isChildSku = itemSku.startsWith(`${cleanSku}-`);
        const isSameSlug = itemSlug && prodSlug && itemSlug === prodSlug;
        const isFamilyPrefixMatch =
          (cleanSku.startsWith("APL-IP16P") && itemSku.startsWith("APL-IP16P")) ||
          (cleanSku.startsWith("APL-IP17PM") && itemSku.startsWith("APL-IP17PM")) ||
          (cleanSku.startsWith("APPLE-IP18") && itemSku.startsWith("APPLE-IP18"));

        if (isExactParent || isExactSku || isChildSku || isSameSlug || isFamilyPrefixMatch) {
          matchingItems.push(item);
        }
      });

      // Build liveVariants keyed by their uppercase variant SKU for instant lookup in ProductInfo / ProductDetail
      const liveVariants = {};
      matchingItems.forEach((item) => {
        const avail = computeLiveAvailability(item.quantity, item.minAlert ?? 3);
        liveVariants[item.sku.toUpperCase()] = {
          ...item,
          availability: avail.status,
          availabilityBadge: avail.badgeText,
          isInStock: avail.inStock,
          isLowStock: avail.isLowStock,
          stockUnitsLeft: avail.unitsLeft,
        };
      });

      // Find direct document if it exists (e.g. for non-variant single SKU products)
      const directItem = liveStockMap.get(cleanSku) || matchingItems.find((i) => i.sku.toUpperCase() === cleanSku);

      // Total quantity across all Firestore variants for this product
      let totalLiveQty = 0;
      let minAlert = 3;
      matchingItems.forEach((v) => {
        totalLiveQty += Number(v.quantity || 0);
        if (v.minAlert !== undefined) minAlert = Math.min(minAlert, Number(v.minAlert));
      });

      // Live stock quantity:
      // If the product has variant documents in Firestore, its live stock is the sum of live variant quantities.
      // Otherwise, use directItem.quantity or static catalog stock.
      const liveQty = matchingItems.length > 0
        ? totalLiveQty
        : directItem
        ? Number(directItem.quantity || 0)
        : prod.quantity !== undefined
        ? Number(prod.quantity)
        : prod.stock !== undefined
        ? Number(prod.stock)
        : 0;

      // Has storage options
      const hasStorageTiers = (prod.storageOptions && prod.storageOptions.length > 0) || Boolean(prod.storagePricing);

      // LIVE PRICING FROM FIRESTORE
      let livePrice = 0;
      let costPrice = directItem ? Number(directItem.costPrice || 0) : Number(prod.costPrice || 0);
      let margin = directItem ? Number(directItem.margin || 0) : Number(prod.margin || 0);
      let originalPrice = directItem ? Number(directItem.originalPrice || 0) : 0;
      let startingStorage = null;

      // For devices with variants: find the cheapest tier in Firestore
      let cheapestVariant = null;
      let cheapestInStockVariant = null;
      let minPrice = Infinity;
      let minInStockPrice = Infinity;

      matchingItems.forEach((item) => {
        const p = Number(item.price || 0);
        const q = Number(item.quantity || 0);
        if (p > 0) {
          if (p < minPrice) {
            minPrice = p;
            cheapestVariant = item;
          }
          if (q > 0 && p < minInStockPrice) {
            minInStockPrice = p;
            cheapestInStockVariant = item;
          }
        }
      });

      // Prefer in-stock variant for starting price, otherwise cheapest tier
      const activeLiveTier = cheapestInStockVariant || cheapestVariant;

      if (hasStorageTiers && activeLiveTier) {
        livePrice = Number(activeLiveTier.price);
        costPrice = Number(activeLiveTier.costPrice || costPrice);
        margin = Number(activeLiveTier.margin || margin);
        if (activeLiveTier.originalPrice && Number(activeLiveTier.originalPrice) > 0) {
          originalPrice = Number(activeLiveTier.originalPrice);
        }
        if (activeLiveTier.storage) {
          startingStorage = activeLiveTier.storage;
        }
      } else if (directItem && directItem.price !== undefined && Number(directItem.price) > 0) {
        livePrice = Number(directItem.price);
        if (directItem.originalPrice && Number(directItem.originalPrice) > 0) {
          originalPrice = Number(directItem.originalPrice);
        }
      } else if (costPrice + margin > 0) {
        livePrice = costPrice + margin;
      } else if (prod.price !== undefined && Number(prod.price) > 0) {
        livePrice = Number(prod.price);
      } else if (activeLiveTier) {
        livePrice = Number(activeLiveTier.price);
        if (activeLiveTier.originalPrice && Number(activeLiveTier.originalPrice) > 0) {
          originalPrice = Number(activeLiveTier.originalPrice);
        }
      }

      // Static fallback for storagePricing if no live items exist yet in Firestore
      if (livePrice === 0 && prod.storagePricing && typeof prod.storagePricing === "object") {
        const entries = Object.entries(prod.storagePricing).filter(([_, v]) => Number(v) > 0);
        if (entries.length > 0) {
          entries.sort((a, b) => Number(a[1]) - Number(b[1]));
          livePrice = Number(entries[0][1]);
          startingStorage = entries[0][0];
        }
      }

      // Ensure startingStorage is resolved whenever product has storage options
      if (hasStorageTiers && !startingStorage && prod.storageOptions && prod.storageOptions.length > 0) {
        const first = prod.storageOptions[0];
        startingStorage = typeof first === "object" ? first.label : first;
      }

      // If originalPrice is still 0, check static product properties or matching variants
      if (originalPrice === 0) {
        if (prod.originalPrice !== undefined && Number(prod.originalPrice) > 0) {
          originalPrice = Number(prod.originalPrice);
        } else if (prod.listPrice !== undefined && Number(prod.listPrice) > 0) {
          originalPrice = Number(prod.listPrice);
        } else {
          for (const item of matchingItems) {
            if (item.originalPrice && Number(item.originalPrice) > 0) {
              originalPrice = Number(item.originalPrice);
              break;
            }
          }
        }
      }

      // Starting from price is true for devices with multiple storage options or variants
      const startingFromPrice = hasStorageTiers;

      const hasDiscount = originalPrice > livePrice && livePrice > 0;
      const discountPercentage = hasDiscount
        ? Math.round(((originalPrice - livePrice) / originalPrice) * 100)
        : 0;

      const availabilityInfo = computeLiveAvailability(liveQty, minAlert);

      return {
        ...prod,
        sku: cleanSku,
        liveQuantity: liveQty,
        costPrice,
        margin,
        livePrice,
        price: livePrice, // sync standard price field for cart & checkout
        originalPrice,
        hasDiscount,
        discountPercentage,
        minAlert,
        // true when price is "from X" (cheapest storage tier) rather than a fixed price
        startingFromPrice,
        startingStorage,
        availability: availabilityInfo.status,
        availabilityBadge: availabilityInfo.badgeText,
        availabilityClass: availabilityInfo.className,
        isInStock: availabilityInfo.inStock,
        isLowStock: availabilityInfo.isLowStock,
        stockUnitsLeft: availabilityInfo.unitsLeft,
        // ← Per-variant live data (color×storage SKU → stock/price info)
        liveVariants,
      };
    });
  }, [liveStockMap]);

  const getProductBySlug = useCallback(
    (slug) => {
      if (!slug) return null;
      return products.find((p) => p.slug === slug || String(p.id) === slug) || null;
    },
    [products]
  );

  const getProductBySku = useCallback(
    (sku) => {
      if (!sku) return null;
      return products.find((p) => p.sku?.toUpperCase() === sku.toUpperCase()) || null;
    },
    [products]
  );

  return (
    <CatalogContext.Provider
      value={{
        products,
        loading,
        refreshStock,
        getProductBySlug,
        getProductBySku,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
};

export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error("useCatalog must be used within a CatalogProvider");
  }
  return context;
};
