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
  FiHardDrive,
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

/**
 * ProductInfo
 * Props:
 *   product         – full product object (merged with live stock from CatalogContext)
 *   selectedVariant – active merged variant (color + storage + live price + sku)
 *                     produced by getActiveVariant() in ProductDetailPage
 *   selectedStorage – the currently selected storage string, e.g. "256GB"
 *   onVariantChange – (colorVariant) => void  — called when user picks a colour
 *   onStorageChange – (storageString) => void — called when user picks storage
 */
const ProductInfo = ({
  product,
  selectedVariant,
  selectedStorage,
  onVariantChange,
  onStorageChange,
}) => {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  const availability =
    availabilityStyles[selectedVariant?.availability || product.availability] ||
    availabilityStyles["Available on Request"];

  // Price: prefer the active variant's live price → product-level livePrice → 0
  const displayPrice =
    selectedVariant?.livePrice !== undefined && selectedVariant.livePrice > 0
      ? Number(selectedVariant.livePrice)
      : selectedVariant?.price !== undefined && selectedVariant.price > 0
      ? Number(selectedVariant.price)
      : product.livePrice !== undefined
      ? Number(product.livePrice)
      : product.price !== undefined
      ? Number(product.price)
      : 0;

  // Original price for strike-through (from active variant or product)
  const originalPrice =
    selectedVariant?.originalPrice && selectedVariant.originalPrice > displayPrice
      ? Number(selectedVariant.originalPrice)
      : product.originalPrice && product.originalPrice > displayPrice
      ? Number(product.originalPrice)
      : 0;

  const hasDiscount = originalPrice > 0 && displayPrice > 0 && originalPrice > displayPrice;
  const discountPct = hasDiscount
    ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
    : 0;

  const wishlisted = isWishlisted(product.slug);

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart(product, quantity, {
      color: selectedVariant?.color || "",
      storage: selectedVariant?.storage || selectedStorage || "",
      sku: selectedVariant?.sku || product.sku,
      price: displayPrice,
      openDrawer: true,
    });
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);
  };

  // Normalise storageOptions — array of strings or objects {label, isDefault}
  const storageOptions = (product.storageOptions || []).map((s) =>
    typeof s === "object" ? s.label : s
  );

  const hasStorage = storageOptions.length > 0;
  const hasColors = product.variants?.length > 0;

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
          ●{" "}
          {selectedVariant?.availabilityBadge ||
            product.availabilityBadge ||
            selectedVariant?.availability ||
            product.availability}
        </span>

        {product.warranty && (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
            <FiCheckCircle className="text-emerald-600" /> {product.warranty} Warranty
          </span>
        )}
      </div>

      {/* ── COLOUR SELECTOR ── */}
      {hasColors && (
        <div className="pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
            Colour
            {selectedVariant?.color && (
              <span className="ml-2 text-slate-800 normal-case font-semibold">
                — {selectedVariant.color}
              </span>
            )}
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {product.variants.map((variant) => {
              const isActive = selectedVariant?.colorSlug === variant.colorSlug;
              return (
                <button
                  key={variant.colorSlug}
                  type="button"
                  onClick={() => onVariantChange(variant)}
                  title={variant.color}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                    isActive
                      ? "border-sky-600 bg-sky-50/80 text-sky-900 ring-2 ring-sky-600/20 font-bold"
                      : "border-slate-200 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <img
                    src={variant.image}
                    alt={variant.color}
                    className="w-7 h-7 object-contain"
                  />
                  <span className="text-xs font-medium">{variant.color}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STORAGE SELECTOR ── */}
      {hasStorage && (
        <div className="pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
            <FiHardDrive className="text-slate-400" />
            Storage
            {selectedStorage && (
              <span className="ml-1 text-slate-800 normal-case font-semibold">
                — {selectedStorage}
              </span>
            )}
          </h3>
          <div className="flex flex-wrap gap-2">
            {storageOptions.map((stor) => {
              const isActive = selectedStorage === stor;
              // Show price delta hint from storagePricing if available
              const tierPrice = product.storagePricing?.[stor];
              return (
                <button
                  key={stor}
                  type="button"
                  onClick={() => onStorageChange(stor)}
                  className={`flex flex-col items-center justify-center px-3.5 py-2 rounded-xl border transition cursor-pointer min-w-[60px] ${
                    isActive
                      ? "border-sky-600 bg-sky-50 text-sky-900 ring-2 ring-sky-600/20 font-bold shadow-sm"
                      : "border-slate-200 hover:border-sky-300 text-slate-700 bg-white"
                  }`}
                >
                  <span className="text-xs font-bold">{stor}</span>
                  {tierPrice > 0 && (
                    <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                      <AedSymbol className="text-[9px]" />
                      {tierPrice.toLocaleString()}
                    </span>
                  )}
                </button>
              );
            })}
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
              <span
                key={tag}
                className="border border-slate-200 rounded-full px-3 py-1 text-xs bg-white text-slate-700"
              >
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
              {selectedStorage && (
                <span className="ml-1 normal-case text-sky-600">· {selectedStorage}</span>
              )}
            </span>
            <div className="flex items-baseline gap-2 mt-0.5 flex-wrap">
              {displayPrice > 0 ? (
                <AedPrice
                  amount={displayPrice}
                  className="text-2xl sm:text-3xl font-black text-sky-950"
                  symbolClassName="text-sky-700"
                />
              ) : (
                <span className="text-lg font-bold text-slate-400 italic">
                  Price on request
                </span>
              )}

              {hasDiscount && (
                <>
                  <AedPrice
                    amount={originalPrice}
                    className="text-sm sm:text-base font-normal text-slate-400 line-through"
                    symbolClassName="text-slate-400"
                  />
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    Save {discountPct}%
                  </span>
                </>
              )}

              {displayPrice > 0 && (
                <span className="text-xs font-mono text-slate-400 ml-auto sm:ml-0">
                  ≈ USD {(displayPrice / 3.6725).toFixed(2)}
                </span>
              )}
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
            <span className="font-mono font-bold text-xs text-slate-900">{quantity}</span>
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
    <p className="mt-0.5 font-semibold text-xs text-slate-800">{value || "-"}</p>
  </div>
);

export default ProductInfo;
