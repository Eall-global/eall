import { Link } from "react-router-dom";
import { FiArrowRight, FiCheckCircle } from "react-icons/fi";

const ProductCard = ({ product }) => {
  const availabilityConfig = {
    "In Stock": {
      label: "In Stock",
      className: "bg-green-100 text-green-700",
    },

    "Limited Stock": {
      label: "Limited Stock",
      className: "bg-yellow-100 text-yellow-700",
    },

    "Available on Request": {
      label: "Available on Request",
      className: "bg-blue-100 text-blue-700",
    },

    "Out of Stock": {
      label: "Out of Stock",
      className: "bg-red-100 text-red-700",
    },
  };

  const availability =
    availabilityConfig[product.availability] ||
    availabilityConfig["Available on Request"];

  return (
    <article className="group bg-white rounded-2xl border-8 border-slate-100 overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
      {/* IMAGE */}

      <div className="relative bg-white-50 h-64 flex items-center justify-center overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
        />

        {/* BADGES */}

        <div className="absolute top-0 left-0">
          {product.isNewArrival && (
            <span className="bg-sky-700/20 text-sky-700 text-xs font-semibold px-3 rounded-br-2xl py-2">
              NEW
            </span>
          )}
        </div>
        <div className="absolute top-0 right-0">
          {product.isFeatured && (
            <span className=" bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-2 rounded-bl-2xl">
              Featured
            </span>
          )}
        </div>
      </div>

      {/* CONTENT */}

      <div className="p-6 bg-slate-100 h-full">
        <p className=" text-xs uppercase tracking-wide text-sky-700 font-semibold">
          {product.brand}
        </p>

        <h3 className="mt-2 text-lg font-bold text-slate-900 line-clamp-2">
          {product.name}
        </h3>

        <p className="mt-2 text-sm text-slate-500">{product.familyName}</p>

        {/* SKU */}

        {product.sku && (
          <p className="mt-3 text-xs text-slate-400">
            SKU:
            {product.sku}
          </p>
        )}

        {/* STATUS */}

        <div className="mt-5 flex items-center justify-between">
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${availability.className} `}
          >
            {availability.label}
          </span>

          {product.warranty && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <FiCheckCircle className="text-green-600" />

              {product.warranty}
            </span>
          )}
        </div>

        {/* CTA */}

        <Link
          to={`/products/${product.slug}`}
          className="mt-6 flex items-center justify-between text-sky-700 font-semibold text-sm group-hover:text-sky-800"
        >
          View Details
          <FiArrowRight className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </article>
  );
};

export default ProductCard;
