import { Link } from "react-router-dom";
import ProductCard from "../products/ProductCard";

const SearchResults = ({ results }) => {
  const { products, brands } = results;

  return (
    <div className="mt-6 space-y-6">
      {/* BRANDS */}
      {brands?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-500 mb-3">Brands</h3>

          <div className="flex flex-wrap gap-3">
            {brands.map((brand) => (
              <Link
                key={brand.slug}
                to={`/brands/${brand.slug}`}
                className="
                  px-4 py-2
                  bg-slate-100
                  rounded-lg
                  hover:bg-blue-100
                  text-sm
                  font-medium
                "
              >
                {brand.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* PRODUCTS */}
      {products?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-500 mb-3">
            Products
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((product) => (
              <Link key={product.id} to={`/products/${product.slug}`}>
                <div className="border rounded-xl p-4 hover:shadow-md transition bg-white">
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-sm text-slate-500">{product.brand}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* NO RESULTS */}
      {products.length === 0 && brands.length === 0 && (
        <p className="text-slate-500 text-center py-10">No results found</p>
      )}
    </div>
  );
};

export default SearchResults;
