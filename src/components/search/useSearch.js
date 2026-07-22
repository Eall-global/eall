import { useMemo, useState } from "react";
import { products } from "../../data/products/index";
import { brands } from "../../data/brandsData";

const useSearch = (query) => {
  const [results, setResults] = useState([]);

  const normalizedQuery = query.toLowerCase().trim();

  const computed = useMemo(() => {
    if (!normalizedQuery) return [];

    const productMatches = products.filter(
      (p) =>
        p.name.toLowerCase().includes(normalizedQuery) ||
        p.brand.toLowerCase().includes(normalizedQuery),
    );

    const brandMatches = brands.filter((b) =>
      b.name.toLowerCase().includes(normalizedQuery),
    );

    return {
      products: productMatches.slice(0, 8),
      brands: brandMatches.slice(0, 5),
    };
  }, [normalizedQuery]);

  return computed;
};

export default useSearch;
