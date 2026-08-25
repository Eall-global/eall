import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { products as staticCatalog } from "../data/products/index";
import { fetchStock } from "../services/stockService";
import { getSupabase, isSupabaseConfigured } from "../lib/supabaseClient";

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

  // Fetch live inventory from Supabase / stockService
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

  // Initial fetch and Supabase Realtime WebSocket subscription
  useEffect(() => {
    refreshStock();

    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured()) {
      const channel = supabase
        .channel("catalog_live_stock_sync")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "product_stock" },
          () => {
            refreshStock();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
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
      const livePrice = liveItem
        ? Number(liveItem.price)
        : prod.price !== undefined && prod.price !== null
        ? Number(prod.price)
        : 0;

      const availabilityInfo = computeLiveAvailability(liveQty, minAlert);

      return {
        ...prod,
        sku: cleanSku,
        liveQuantity: liveQty,
        livePrice,
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
