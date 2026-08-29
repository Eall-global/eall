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
      const liveItem = liveStockMap.get(cleanSku);

      const liveQty = liveItem
        ? Number(liveItem.quantity)
        : prod.quantity !== undefined
        ? Number(prod.quantity)
        : prod.stock !== undefined
        ? Number(prod.stock)
        : 0;
      const minAlert = liveItem ? Number(liveItem.minAlert || 3) : 3;
      const costPrice = liveItem ? Number(liveItem.costPrice || 0) : (prod.costPrice !== undefined ? Number(prod.costPrice) : 0);
      const margin = liveItem ? Number(liveItem.margin || 0) : (prod.margin !== undefined ? Number(prod.margin) : 0);

      // Selling price is live price or cost + margin or static catalog price
      let livePrice = 0;
      if (liveItem && liveItem.price !== undefined && liveItem.price !== null && Number(liveItem.price) > 0) {
        livePrice = Number(liveItem.price);
      } else if (costPrice + margin > 0) {
        livePrice = costPrice + margin;
      } else if (prod.price !== undefined && prod.price !== null) {
        livePrice = Number(prod.price);
      }

      // Original / List price for discount display
      let originalPrice = 0;
      if (liveItem && liveItem.originalPrice !== undefined && Number(liveItem.originalPrice) > 0) {
        originalPrice = Number(liveItem.originalPrice);
      } else if (prod.originalPrice !== undefined && Number(prod.originalPrice) > 0) {
        originalPrice = Number(prod.originalPrice);
      } else if (prod.listPrice !== undefined && Number(prod.listPrice) > 0) {
        originalPrice = Number(prod.listPrice);
      }

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
        availability: availabilityInfo.status,
        availabilityBadge: availabilityInfo.badgeText,
        availabilityClass: availabilityInfo.className,
        isInStock: availabilityInfo.inStock,
        isLowStock: availabilityInfo.isLowStock,
        stockUnitsLeft: availabilityInfo.unitsLeft,
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
