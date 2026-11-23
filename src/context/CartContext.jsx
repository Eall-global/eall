/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { useCatalog } from "./CatalogContext";
import { useCountryOptional } from "./CountryContext";
import { DEFAULT_LOCATIONS } from "../config/locationsConfig";

const CartContext = createContext(null);
const LEGACY_CART_STORAGE_KEY = "eall_user_shopping_cart";
const getCountryCartKey = (countryCode) =>
  `eall_user_shopping_cart_${String(countryCode || "AE").toUpperCase()}`;

const readStoredCartForCountry = (countryCode) => {
  const code = String(countryCode || "AE").toUpperCase();
  try {
    const saved = localStorage.getItem(getCountryCartKey(code));
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
    if (code === "AE") {
      const legacy = localStorage.getItem(LEGACY_CART_STORAGE_KEY);
      if (legacy) {
        const parsedLegacy = JSON.parse(legacy);
        if (Array.isArray(parsedLegacy)) return parsedLegacy;
      }
    }
  } catch {
    // ignore storage parse errors
  }
  return [];
};

export const CartProvider = ({ children }) => {
  const { allCatalogProducts, products: liveCatalog } = useCatalog();
  const countryCtx = useCountryOptional();
  const activeCountry = countryCtx?.activeCountry || DEFAULT_LOCATIONS[0];
  const countryCode = activeCountry.code || "AE";

  const [cartsByCountry, setCartsByCountry] = useState(() => ({
    [countryCode]: readStoredCartForCountry(countryCode),
  }));

  const [isCartOpen, setIsCartOpen] = useState(false);

  const cartItems = useMemo(() => {
    if (Object.prototype.hasOwnProperty.call(cartsByCountry, countryCode)) {
      return cartsByCountry[countryCode];
    }
    return readStoredCartForCountry(countryCode);
  }, [cartsByCountry, countryCode]);

  const setActiveCartItems = useCallback(
    (updater) => {
      setCartsByCountry((prev) => {
        const current = Object.prototype.hasOwnProperty.call(prev, countryCode)
          ? prev[countryCode]
          : readStoredCartForCountry(countryCode);
        const next = typeof updater === "function" ? updater(current) : updater;
        return { ...prev, [countryCode]: next };
      });
    },
    [countryCode]
  );

  // Sync active country's cart items to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(getCountryCartKey(countryCode), JSON.stringify(cartItems));
      if (countryCode === "AE") {
        localStorage.setItem(LEGACY_CART_STORAGE_KEY, JSON.stringify(cartItems));
      }
    } catch (e) {
      console.warn("Failed to save cart to storage:", e);
    }
  }, [cartItems, countryCode]);

  // Compute live cart items by merging stored cart items with live catalog prices in active currency
  const items = useMemo(() => {
    const sourceCatalog = allCatalogProducts || liveCatalog || [];
    const catalogMap = new Map();
    sourceCatalog.forEach((p) => {
      if (p.sku) catalogMap.set(p.sku.toUpperCase(), p);
      if (p.slug) catalogMap.set(p.slug.toLowerCase(), p);
      if (p.liveVariants) {
        Object.keys(p.liveVariants).forEach((vSku) => {
          catalogMap.set(vSku.toUpperCase(), p);
        });
      }
    });

    return cartItems.map((item) => {
      const upperSku = (item.sku || "").toUpperCase();
      const liveProd =
        catalogMap.get(upperSku) || catalogMap.get((item.slug || "").toLowerCase());

      const variantLive = liveProd?.liveVariants?.[upperSku];
      const storagePrice =
        item.storage && liveProd?.storagePricing?.[item.storage]
          ? Number(liveProd.storagePricing[item.storage])
          : 0;

      const livePrice =
        Number(variantLive?.price) > 0
          ? Number(variantLive.price)
          : storagePrice > 0
          ? storagePrice
          : liveProd && liveProd.livePrice !== undefined
          ? Number(liveProd.livePrice)
          : item.price !== undefined
          ? Number(item.price)
          : 0;

      const maxStock =
        variantLive?.quantity !== undefined
          ? Math.max(1, Number(variantLive.quantity))
          : liveProd && liveProd.liveQuantity !== undefined
          ? Math.max(1, Number(liveProd.liveQuantity))
          : item.maxStock !== undefined
          ? Number(item.maxStock)
          : 99;

      return {
        ...item,
        price: livePrice,
        maxStock,
        currency: activeCountry.currency,
        countryCode,
        total: livePrice * (item.quantity || 1),
      };
    });
  }, [cartItems, allCatalogProducts, liveCatalog, activeCountry.currency, countryCode]);

  // Total quantity of items in cart
  const cartCount = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  }, [items]);

  // Subtotal in active country's currency
  const cartSubtotal = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + Number(item.price || 0) * (Number(item.quantity) || 1),
      0
    );
  }, [items]);

  const freeShippingThreshold = Number(activeCountry.freeShippingThreshold ?? 500);
  const standardShippingFee = Number(activeCountry.shippingFee ?? 25);

  // Country-aware shipping threshold
  const shippingFee = useMemo(() => {
    if (cartSubtotal === 0) return 0;
    return cartSubtotal >= freeShippingThreshold ? 0 : standardShippingFee;
  }, [cartSubtotal, freeShippingThreshold, standardShippingFee]);

  // Grand Total
  const cartTotal = useMemo(() => {
    return cartSubtotal + shippingFee;
  }, [cartSubtotal, shippingFee]);

  // Add Item to Cart
  const addToCart = useCallback(
    (product, quantity = 1, options = {}) => {
      if (!product) return;

      const itemSku = (product.sku || `SKU-${product.id || product.slug}`).toUpperCase();
      const itemPrice =
        product.livePrice !== undefined
          ? Number(product.livePrice)
          : product.price !== undefined
          ? Number(product.price)
          : 0;

      setActiveCartItems((prev) => {
        const existingIndex = prev.findIndex((i) => (i.sku || "").toUpperCase() === itemSku);

        if (existingIndex > -1) {
          const updated = [...prev];
          const currentQty = updated[existingIndex].quantity || 1;
          const newQty = currentQty + quantity;
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: newQty,
            color: options.color || updated[existingIndex].color,
            storage: options.storage || updated[existingIndex].storage,
          };
          return updated;
        }
        return [
          ...prev,
          {
            id: product.id || itemSku,
            sku: itemSku,
            slug: product.slug,
            name: product.name || product.shortName || "Product Item",
            brand: product.brand || "Electronics",
            image: product.image || "/logo.png",
            price: itemPrice,
            quantity,
            color: options.color || "",
            storage: options.storage || "",
            countryCode,
            currency: activeCountry.currency,
            addedAt: new Date().toISOString(),
          },
        ];
      });

      if (options.openDrawer !== false) {
        setIsCartOpen(true);
      }
    },
    [setActiveCartItems, countryCode, activeCountry.currency]
  );

  // Remove Item from Cart
  const removeFromCart = useCallback(
    (sku) => {
      const cleanSku = (sku || "").toUpperCase();
      setActiveCartItems((prev) =>
        prev.filter((i) => (i.sku || "").toUpperCase() !== cleanSku && i.slug !== sku)
      );
    },
    [setActiveCartItems]
  );

  // Update Item Quantity
  const updateQuantity = useCallback(
    (sku, newQty) => {
      const cleanSku = (sku || "").toUpperCase();
      if (newQty <= 0) {
        removeFromCart(sku);
        return;
      }

      setActiveCartItems((prev) =>
        prev.map((item) => {
          if ((item.sku || "").toUpperCase() === cleanSku || item.slug === sku) {
            return { ...item, quantity: newQty };
          }
          return item;
        })
      );
    },
    [removeFromCart, setActiveCartItems]
  );

  // Clear Cart
  const clearCart = useCallback(() => setActiveCartItems([]), [setActiveCartItems]);

  return (
    <CartContext.Provider
      value={{
        items,
        cartCount,
        cartSubtotal,
        shippingFee,
        freeShippingThreshold,
        cartTotal,
        countryCode,
        currency: activeCountry.currency,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
