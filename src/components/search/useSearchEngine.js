import { useMemo } from "react";
import { products } from "../../data/products/index";
import categories from "../../data/categories";
import { brands } from "../../data/brandsData";

const useSearchEngine = (query) => {
  const q = query.toLowerCase().trim();

  return useMemo(() => {
    if (!q) {
      return {
        products: [],
        brands: [],
        categories: [],
      };
    }

    const productResults = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );

    const brandResults = brands.filter((b) => b.name.toLowerCase().includes(q));

    const categoryResults = categories.filter((c) =>
      c.name.toLowerCase().includes(q),
    );

    return {
      products: productResults.slice(0, 6),
      brands: brandResults.slice(0, 4),
      categories: categoryResults.slice(0, 4),
    };
  }, [q]);
};

export default useSearchEngine;
