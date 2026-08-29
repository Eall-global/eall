import { useState } from "react";
import {
  FiCheckCircle,
  FiPackage,
  FiTag,
  FiGrid,
  FiLayers,
  FiShoppingCart,
  FiHeart,
  FiPlus,
  FiMinus,
  FiCheck,
} from "react-icons/fi";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { AedSymbol, AedPrice } from "../common/AedSymbol";

const availabilityStyles = {
  "In Stock": {
    bg: "bg-emerald-50 border-emerald-200 text-emerald-800",
  },
  "Limited Stock": {
    bg: "bg-amber-50 border-amber-200 text-amber-800",
  },
  "Available on Request": {
    bg: "bg-sky-50 border-sky-200 text-sky-800",
  },
  "Out of Stock": {
    bg: "bg-rose-50 border-rose-200 text-rose-800",
  },
};

const ProductInfo = ({ product, selectedVariant, onVariantChange }) => {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  const availability =
    availabilityStyles[product.availability] ||
    availabilityStyles["Available on Request"];

  const displayPrice = product.livePrice !== undefined
    ? Number(product.livePrice)
    : (product.price !== undefined ? Number(product.price) : 0);

  const wishlisted = isWishlisted(product.slug);

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart(product, quantity, {
      color: selectedVariant?.color || "",
      storage: selectedVariant?.storage || "",
      openDrawer: true,
    });
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Brand & Title */}
      <div>
        <span className="text-xs uppercase font-extrabold tracking-widest text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200/60 inline-block mb-2">
          {product.brand}
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
          {product.name}
        </h1>

        <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          {product.shortDescription}
        </p>
      </div>

      {/* Availability & Warranty Status */}
      <div className="flex flex-wrap gap-2.5 items-center">
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold border ${availability.bg}`}
        >
          ● {product.availabilityBadge || product.availability}
        </span>

        {product.warranty && (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
            <FiCheckCircle className="text-emerald-600" /> {product.warranty} Warranty
          </span>
        )}
      </div>

      {/* Colour Selection */}
      {product.variants?.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Available Colours</h3>
          <div className="flex flex-wrap gap-2.5">
            {product.variants.map((variant) => (
              <button
                key={variant.colorSlug}
                type="button"
                onClick={() => onVariantChange(variant)}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                  selectedVariant.colorSlug === variant.colorSlug
                    ? "border-sky-600 bg-sky-50/80 text-sky-900 ring-2 ring-sky-600/20 font-bold"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <img src={variant.image} alt={variant.color} className="w-7 h-7 object-contain" />
                <span className="text-xs font-medium">{variant.color}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Key Specifications Grid */}
      <div className="grid grid-cols-2 gap-3 border rounded-2xl border-slate-200/80 p-4 bg-slate-50/50 text-xs">
        <InfoItem icon={<FiPackage />} label="SKU" value={selectedVariant?.sku || product.sku} />
        <InfoItem icon={<FiGrid />} label="Category" value={product.categoryName || product.category} />
        <InfoItem icon={<FiLayers />} label="Sub Category" value={product.subCategory} />
        <InfoItem icon={<FiTag />} label="Model" value={product.model} />
      </div>

      {/* Highlights */}
      {product.tags?.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Highlights</h3>
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <span key={tag} className="border border-slate-200 rounded-full px-3 py-1 text-xs bg-white text-slate-700">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* SLEEK PRICING & ADD TO CART CARD */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4 pt-4 border-t-2 border-t-sky-700">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-2">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Unit Price
            </span>
            <div className="flex items-baseline gap-2 mt-0.5 flex-wrap">
              <AedPrice
                amount={displayPrice}
                className="text-2xl sm:text-3xl font-black text-sky-950"
                symbolClassName="text-sky-700"
              />

              {product.hasDiscount && product.originalPrice > displayPrice && (
                <>
                  <AedPrice
                    amount={product.originalPrice}
                    className="text-sm sm:text-base font-normal text-slate-400 line-through"
                    symbolClassName="text-slate-400"
                  />
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    Save {product.discountPercentage}%
                  </span>
                </>
              )}

              <span className="text-xs font-mono text-slate-400 ml-auto sm:ml-0">
                ≈ USD {(displayPrice / 3.6725).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-stretch gap-3">
          {/* Quantity Stepper */}
          <div className="flex items-center justify-between border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 w-28 shrink-0">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="p-1 text-slate-500 hover:text-slate-900 rounded cursor-pointer"
            >
              <FiMinus className="text-xs" />
            </button>
            <span className="font-mono font-bold text-xs text-slate-900">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="p-1 text-slate-500 hover:text-slate-900 rounded cursor-pointer"
            >
              <FiPlus className="text-xs" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 py-3 px-4 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            {addedNotice ? (
              <>
                <FiCheck className="text-sm text-emerald-300" />
                <span>Added to Cart!</span>
              </>
            ) : (
              <>
                <FiShoppingCart className="text-sm" />
                <span>Add to Cart</span>
              </>
            )}
          </button>

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={() => toggleWishlist(product)}
            className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-center shrink-0 ${
              wishlisted
                ? "bg-rose-50 border-rose-300 text-rose-600"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
            title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <FiHeart className={`text-lg ${wishlisted ? "fill-rose-600" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ icon, label, value }) => (
  <div>
    <p className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
      {icon}
      {label}
    </p>
    <p className="mt-0.5 font-semibold text-xs text-slate-800">
      {value || "-"}
    </p>
  </div>
);

export default ProductInfo;
