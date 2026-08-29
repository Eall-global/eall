import { Link } from "react-router-dom";
import { FiHeart } from "react-icons/fi";
import { MdOutlineAddShoppingCart } from "react-icons/md";
import { useState, useMemo } from "react";
import { getColorSwatch } from "../../utils/getColorSwatch";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { AedSymbol, AedPrice } from "../common/AedSymbol";

// ⚡ Helper: Sanitize & format verbose raw specifications into compact, elegant micro-pills
const formatShortSpec = (text) => {
  if (!text || typeof text !== "string") return "";
  const clean = text.trim();

  // 1. Clean Display (e.g. '6.7-inch Dynamic AMOLED 2X, 3120 x 1440 (QHD+)...' -> '6.7" AMOLED')
  const screenMatch = clean.match(/(\d+(\.\d+)?)\s*(?:-inch|inch|")/i);
  const typeMatch = clean.match(/(Super AMOLED|Dynamic AMOLED|AMOLED|OLED|Retina|IPS|QQVGA|QVGA|HD\+|FHD\+)/i);
  if (screenMatch) {
    const size = `${screenMatch[1]}"`;
    const type = typeMatch ? typeMatch[1].replace(/Super |Dynamic /i, "") : "";
    return type ? `${size} ${type}` : `${size} Screen`;
  }

  // 2. Clean Processor / Chipset
  if (/snapdragon\s*8\s*elite/i.test(clean)) return "Snapdragon 8 Elite";
  if (/snapdragon\s*8\s*gen\s*\d/i.test(clean)) {
    const m = clean.match(/snapdragon\s*8\s*gen\s*\d/i);
    return m ? m[0] : "Snapdragon 8";
  }
  if (/exynos\s*\d+/i.test(clean)) {
    const m = clean.match(/exynos\s*\d+/i);
    return m ? m[0] : "Exynos";
  }
  if (/a18\s*pro/i.test(clean)) return "A18 Pro";
  if (/a18/i.test(clean)) return "A18";
  if (/a17\s*pro/i.test(clean)) return "A17 Pro";
  if (/a16/i.test(clean)) return "A16 Bionic";
  if (/unisoc\s*t?\d+[a-z]?/i.test(clean)) {
    const m = clean.match(/unisoc\s*t?\d+[a-z]?/i);
    return m ? m[0] : "Unisoc";
  }
  if (/octa-core/i.test(clean)) return "Octa-Core";

  // 3. Clean Battery (e.g. '5,000mAh, up to 51 hours' -> '5000 mAh')
  const battMatch = clean.match(/(\d+[\d,]*)\s*mAh/i);
  if (battMatch) {
    return `${battMatch[1].replace(",", "")} mAh`;
  }

  // 4. Clean Storage (e.g. '256GB' / '128GB')
  const storageMatch = clean.match(/^(\d+)\s*(GB|TB|MB)/i);
  if (storageMatch) {
    return `${storageMatch[1]}${storageMatch[2]}`;
  }

  // 5. Shorten any other generic string to max 14 characters
  if (clean.length > 14) {
    return clean.slice(0, 13) + "…";
  }

  return clean;
};

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

  // ⚡ Extract concise, formatted micro key features (Max 2 on mobile, up to 3 on desktop)
  const keyFeatures = useMemo(() => {
    const rawList = [];

    if (product.specifications) {
      if (product.specifications.display || product.specifications.screenSize) {
        rawList.push(formatShortSpec(product.specifications.display || product.specifications.screenSize));
      }
      if (product.specifications.processor || product.specifications.chipset) {
        rawList.push(formatShortSpec(product.specifications.processor || product.specifications.chipset));
      }
      if (product.specifications.battery) {
        rawList.push(formatShortSpec(product.specifications.battery));
      } else if (product.specifications.storage) {
        rawList.push(formatShortSpec(product.specifications.storage));
      }
    }

    if (rawList.length < 2 && Array.isArray(product.features)) {
      for (const f of product.features) {
        const fmt = formatShortSpec(f);
        if (fmt && !rawList.includes(fmt) && rawList.length < 3) {
          rawList.push(fmt);
        }
      }
    }

    if (rawList.length < 2 && Array.isArray(product.tags)) {
      for (const t of product.tags) {
        if (
          !["Apple", "Nokia", "HMD", "Samsung", "Mobile Devices", product.brand].includes(t) &&
          rawList.length < 3
        ) {
          const fmt = formatShortSpec(t);
          if (fmt && !rawList.includes(fmt)) {
            rawList.push(fmt);
          }
        }
      }
    }

    if (rawList.length < 2 && Array.isArray(product.connectivityOptions)) {
      for (const c of product.connectivityOptions) {
        const fmt = formatShortSpec(c);
        if (fmt && !rawList.includes(fmt) && rawList.length < 3) {
          rawList.push(fmt);
        }
      }
    }

    // Filter out empties and limit strictly to top 3 compact items
    return rawList.filter(Boolean).slice(0, 3);
  }, [product]);

  return (
    <Link to={`/products/${product.slug}`} className="block group h-full text-left">
      <article className="group bg-white rounded-2xl border border-slate-200 hover:border-sky-300 hover:shadow-xl transition-all duration-300 h-full flex flex-col overflow-hidden cursor-pointer relative">

        {/* 📸 PURE WHITE IMAGE CONTAINER WITH STRICT BOUNDS */}
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

            {/* ⚡ MICRO KEY SPECS / FEATURES (Strictly Max 2 Pills on Mobile, Never Overlaps) */}
            {keyFeatures.length > 0 && (
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                {keyFeatures.map((feat, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center text-[9.5px] sm:text-[10px] font-semibold text-slate-600 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-md truncate max-w-27.5 sm:max-w-32 leading-none ${idx >= 2 ? "hidden sm:inline-flex" : ""
                      }`}
                    title={feat}
                  >
                    {feat}
                  </span>
                ))}
              </div>
            )}

            {/* COLOR SWATCHES (Compact Single Row) */}
            {product.variants?.length > 0 && (
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
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
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <div className="flex flex-col">
              {(() => {
                const sellingPrice = product.livePrice !== undefined ? Number(product.livePrice) : (product.price || 0);
                const originalPrice = Number(product.originalPrice || 0);
                const hasDiscount = originalPrice > sellingPrice && sellingPrice > 0;
                const discountPct = hasDiscount ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100) : 0;

                return (
                  <>
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <AedPrice
                        amount={sellingPrice}
                        className="text-xs sm:text-sm font-black text-sky-950"
                        symbolClassName="text-sky-700"
                      />
                      {hasDiscount && (
                        <AedPrice
                          amount={originalPrice}
                          className="text-[10px] sm:text-[11px] font-normal text-slate-400 line-through"
                          symbolClassName="text-slate-400"
                        />
                      )}
                    </div>
                    {hasDiscount && discountPct > 0 && (
                      <span className="inline-block text-[9.5px] font-bold text-emerald-600 font-sans mt-0.5">
                        Save {discountPct}%
                      </span>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addToCart(product, 1, { openDrawer: true });
                }}
                className="p-2 rounded-xl bg-sky-50/80 hover:bg-sky-700 text-sky-700 hover:text-white border border-sky-300 hover:border-sky-700 transition shadow-2xs cursor-pointer flex items-center gap-1 text-xs font-bold"
                title="Add to Cart"
              >
                <MdOutlineAddShoppingCart className="text-base" />
              </button>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default ProductCard;
