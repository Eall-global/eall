import { Link } from "react-router-dom";
import { FiArrowRight, FiHeart } from "react-icons/fi";
import { useState } from "react";
import { getColorSwatch } from "../../utils/getColorSwatch";
import { useWishlist } from "../../context/WishlistContext";

const ProductCard = ({ product }) => {
  const { isWishlisted, toggleWishlist } = useWishlist();

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

  const defaultVariant =
    product.variants?.find((v) => v.isDefault) ?? product.variants?.[0];

  const [previewVariant, setPreviewVariant] = useState(defaultVariant);

  const wishlisted = isWishlisted(product.slug || product.id);

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  // Up to 5 color swatches in preview
  const visibleVariants = product.variants?.slice(0, 5) || [];
  const extraCount = (product.variants?.length || 0) - 5;

  return (
    <Link to={`/products/${product.slug}`} className="block group h-full text-left">
      <article className="group bg-white rounded-2xl border border-slate-200 hover:border-sky-300 hover:shadow-xl transition-all duration-300 h-full flex flex-col overflow-hidden cursor-pointer relative">
        
        {/* 📸 PURE WHITE IMAGE CONTAINER (Seamless blending for white background images) */}
        <div className="relative bg-white h-48 sm:h-56 md:h-64 flex items-center justify-center overflow-hidden">
          <img
            src={previewVariant?.image || product.image}
            alt={product.name}
            className="h-full w-full object-contain p-4 sm:p-6 transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.target.src = "/logo.png";
            }}
          />

          {/* NEW BADGE (Top-Left) */}
          {product.isNewArrival && (
            <span className="absolute top-0 left-0 bg-sky-700/15 text-sky-800 text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-br-xl">
              NEW
            </span>
          )}

          {/* ❤️ WISHLIST / FAVORITE BUTTON (Top-Right) */}
          <button
            type="button"
            onClick={handleWishlistClick}
            className={`
              absolute top-2.5 right-2.5 p-1.5 rounded-full transition-all duration-200 cursor-pointer
              ${
                wishlisted
                  ? "bg-rose-50 text-rose-600 scale-110"
                  : "text-slate-400 hover:text-rose-500 hover:bg-slate-50"
              }
            `}
            title={wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            <FiHeart className={`text-base sm:text-lg ${wishlisted ? "fill-rose-600" : ""}`} />
          </button>

          {/* 🏷️ FULL-WIDTH AVAILABILITY STRIP (Pinned at bottom of top half) */}
          <div
            className={`
              absolute bottom-0 left-0 right-0 w-full text-center text-[10px] sm:text-xs font-semibold py-1.5
              ${availability.className}
            `}
          >
            {availability.label}
          </div>
        </div>

        {/* 🏷️ CONTENT DETAILS */}
        <div className="p-4 sm:p-5 flex flex-col flex-1 bg-white justify-between">
          <div>
            {/* Brand Header */}
            <p className="text-[10px] sm:text-xs uppercase tracking-wider text-sky-700 font-extrabold">
              {product.brand}
            </p>

            {/* Product Name (Full Name with 2-line clamp) */}
            <h3 className="mt-1 text-sm sm:text-base font-bold text-slate-900 line-clamp-2 leading-snug min-h-[2.4rem]">
              {product.name}
            </h3>

            {/* COLOR SWATCHES (Compact Single Row) */}
            {product.variants?.length > 0 && (
              <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                {visibleVariants.map((variant) => (
                  <button
                    key={variant.colorSlug || variant.color}
                    type="button"
                    onMouseEnter={() => setPreviewVariant(variant)}
                    onMouseLeave={() => setPreviewVariant(defaultVariant)}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setPreviewVariant(variant);
                    }}
                    title={variant.color}
                    className={`
                      h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full border transition-all cursor-pointer
                      ${
                        previewVariant?.colorSlug === variant.colorSlug
                          ? "border-sky-600 ring-2 ring-sky-400/30 scale-110"
                          : "border-slate-300 hover:border-sky-500"
                      }
                    `}
                    style={{
                      backgroundColor: getColorSwatch(variant.color),
                    }}
                  />
                ))}

                {extraCount > 0 && (
                  <span className="text-[10px] font-medium text-slate-400 pl-0.5">
                    +{extraCount}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 🔗 BOTTOM ACTION CTA */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-sky-700 font-bold text-xs sm:text-sm group-hover:text-sky-800">
            <span>View Details</span>
            <FiArrowRight className="text-sm transition-transform duration-200 group-hover:translate-x-1" />
          </div>
        </div>
      </article>
    </Link>
  );
};

export default ProductCard;
