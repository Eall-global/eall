import { createContext, useContext, useState, useEffect } from "react";

const WishlistContext = createContext(null);
const WISHLIST_STORAGE_KEY = "eall_user_wishlist";

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch (e) {
      console.warn("Failed to save wishlist:", e);
    }
  }, [wishlist]);

  const isWishlisted = (slug) => {
    return wishlist.some((item) => item.slug === slug || item.id === slug);
  };

  const toggleWishlist = (product) => {
    if (!product) return;
    setWishlist((prev) => {
      const exists = prev.some((i) => i.slug === product.slug || i.id === product.id);
      if (exists) {
        return prev.filter((i) => i.slug !== product.slug && i.id !== product.id);
      } else {
        return [
          {
            id: product.id || product.slug,
            slug: product.slug,
            name: product.name,
            brand: product.brand,
            image: product.image,
            categoryName: product.categoryName || product.category,
            availability: product.availability || "Available on Request",
            addedAt: new Date().toISOString(),
          },
          ...prev,
        ];
      }
    });
  };

  const removeFromWishlist = (slug) => {
    setWishlist((prev) => prev.filter((i) => i.slug !== slug && i.id !== slug));
  };

  const clearWishlist = () => setWishlist([]);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount: wishlist.length,
        isWishlisted,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
        isWishlistOpen,
        setIsWishlistOpen,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};
