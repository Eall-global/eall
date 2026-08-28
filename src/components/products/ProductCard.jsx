import { Link } from "react-router-dom";
import { FiHeart } from "react-icons/fi";
import { MdOutlineAddShoppingCart } from "react-icons/md";
import { useState } from "react";
import { getColorSwatch } from "../../utils/getColorSwatch";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";

const ProductCard = ({ product }) => {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  const availabilityBadgeText = product.availabilityBadge || product.availability || "Available on Request";
  const availabilityClass = product.availabilityClass || (
    product.availability === "In Stock"
      ? "bg-green-100 text-green-700"
      : product.availability === "Limited Stock"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-blue-100 text-blue-700"
  );

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

        {/* 📸 PURE WHITE IMAGE CONTAINER WITH STRICT BOUNDS (Uniform scale for all products) */}
        <div className="relative bg-white h-44 sm:h-52 md:h-56 w-full flex items-center justify-center overflow-hidden">
          <div className="w-full h-full flex items-center justify-center p-3 sm:p-4">
            <img
              src={previewVariant?.image || product.image}
              alt={product.name}
              className="max-h-28 sm:max-h-36 md:max-h-40 max-w-[80%] sm:max-w-[75%] w-auto h-auto object-contain transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                e.target.src = "/logo.png";
              }}
            />
          </div>

          {/* NEW BADGE (Top-Left) */}
          {product.isNewArrival && (
            <span className="absolute top-0 left-0 bg-sky-700/15 text-sky-800 text-xs font-bold px-3 py-1.5 rounded-br-xl z-10">
              NEW
            </span>
          )}

          {/* ❤️ WISHLIST / FAVORITE BUTTON (Top-Right) */}
          <button
            type="button"
            onClick={handleWishlistClick}
            className={`
              absolute top-2.5 right-2.5 p-1.5 rounded-full transition-all duration-200 cursor-pointer z-10
              ${wishlisted
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
              absolute bottom-0 left-0 right-0 w-full text-center text-[10px] sm:text-xs font-semibold py-1.5 z-10
              ${availabilityClass}
            `}
          >
            {availabilityBadgeText}
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
                      ${previewVariant?.colorSlug === variant.colorSlug
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

          {/* 🏷️ LIVE PRICE & BOTTOM ACTION CTA */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="font-mono font-black text-sm text-sky-900">
                AED {(product.livePrice !== undefined ? Number(product.livePrice) : (product.price || 0)).toFixed(2)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addToCart(product, 1, { openDrawer: true });
                }}
                className="p-1.5 rounded-lg bg-sky-50/80 hover:bg-sky-700 text-sky-600 hover:text-sky-50 border border-sky-500 transition shadow-2xs cursor-pointer flex items-center gap-1 text-xs font-bold"
                title="Add to Cart"
              >
                <MdOutlineAddShoppingCart className="text-sm sm:text-base font-semibold" />
              </button>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default ProductCard;
