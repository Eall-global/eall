import { useEffect } from "react";

const useRecentlyViewed = (product) => {
  useEffect(() => {
    if (!product) return;

    const existing = JSON.parse(localStorage.getItem("recentProducts")) || [];

    const updated = [
      product,

      ...existing.filter((item) => item.id !== product.id),
    ].slice(0, 6);

    localStorage.setItem("recentProducts", JSON.stringify(updated));
  }, [product]);
};

export default useRecentlyViewed;
