import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useCatalog } from "./CatalogContext";

const CartContext = createContext(null);
const CART_STORAGE_KEY = "eall_user_shopping_cart";

export const CartProvider = ({ children }) => {
  const { products: liveCatalog } = useCatalog();

  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Sync cart items to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.warn("Failed to save cart to storage:", e);
    }
  }, [cartItems]);

  // Compute live cart items by merging stored cart items with live catalog database prices
  const items = useMemo(() => {
    const catalogMap = new Map();
    (liveCatalog || []).forEach((p) => {
      if (p.sku) catalogMap.set(p.sku.toUpperCase(), p);
      if (p.slug) catalogMap.set(p.slug.toLowerCase(), p);
    });

    return cartItems.map((item) => {
      const liveProd = catalogMap.get((item.sku || "").toUpperCase()) || catalogMap.get((item.slug || "").toLowerCase());
      
      const livePrice = liveProd && liveProd.livePrice !== undefined
        ? Number(liveProd.livePrice)
        : (item.price !== undefined ? Number(item.price) : 0);

      const maxStock = liveProd && liveProd.liveQuantity !== undefined
        ? Number(liveProd.liveQuantity)
        : (item.maxStock !== undefined ? Number(item.maxStock) : 99);

      return {
        ...item,
        price: livePrice,
        maxStock,
        total: livePrice * (item.quantity || 1),
      };
    });
  }, [cartItems, liveCatalog]);

  // Total quantity of items in cart
  const cartCount = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  }, [items]);

  // Subtotal in AED / USD
  const cartSubtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.price || 0) * (Number(item.quantity) || 1)), 0);
  }, [items]);

  // Estimated shipping (Free above 500 AED, otherwise 25 AED)
  const shippingFee = useMemo(() => {
    if (cartSubtotal === 0) return 0;
    return cartSubtotal >= 500 ? 0 : 25;
  }, [cartSubtotal]);

  // Grand Total
  const cartTotal = useMemo(() => {
    return cartSubtotal + shippingFee;
  }, [cartSubtotal, shippingFee]);

  // Add Item to Cart
  const addToCart = (product, quantity = 1, options = {}) => {
    if (!product) return;

    const itemSku = (product.sku || `SKU-${product.id || product.slug}`).toUpperCase();
    const itemPrice = product.livePrice !== undefined
      ? Number(product.livePrice)
      : (product.price !== undefined ? Number(product.price) : 0);

    setCartItems((prev) => {
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
      } else {
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
            quantity: quantity,
            color: options.color || "",
            storage: options.storage || "",
            addedAt: new Date().toISOString(),
          },
        ];
      }
    });

    // Auto open drawer to confirm add to cart
    if (options.openDrawer !== false) {
      setIsCartOpen(true);
    }
  };

  // Remove Item from Cart
  const removeFromCart = (sku) => {
    const cleanSku = (sku || "").toUpperCase();
    setCartItems((prev) => prev.filter((i) => (i.sku || "").toUpperCase() !== cleanSku && i.slug !== sku));
  };

  // Update Item Quantity
  const updateQuantity = (sku, newQty) => {
    const cleanSku = (sku || "").toUpperCase();
    if (newQty <= 0) {
      removeFromCart(sku);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => {
        if ((item.sku || "").toUpperCase() === cleanSku || item.slug === sku) {
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  // Clear Cart
  const clearCart = () => setCartItems([]);

  return (
    <CartContext.Provider
      value={{
        items,
        cartCount,
        cartSubtotal,
        shippingFee,
        cartTotal,
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
