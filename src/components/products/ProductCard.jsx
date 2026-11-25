import { Link } from "react-router-dom";
import { FiHeart, FiCheck, FiShield } from "react-icons/fi";
import { MdOutlineAddShoppingCart } from "react-icons/md";
import { useState, useMemo } from "react";
import { getColorSwatch } from "../../utils/getColorSwatch";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { useCountryOptional } from "../../context/CountryContext";
import { DEFAULT_LOCATIONS, convertAedToLocalPrice } from "../../config/locationsConfig";
import { AedPrice } from "../common/AedSymbol";
import { buildVariantSku, getDefaultVariant, getActiveVariant } from "../../utils/productVariant";
import { estimateCatalogRetailPrice } from "../../context/CatalogContext";

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
  if (/a20\s*pro/i.test(clean)) return "A20 Pro (2 nm)";
  if (/a19\s*pro/i.test(clean)) return "A19 Pro";
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
  const countryCtx = useCountryOptional();
  const activeCountry = countryCtx?.activeCountry || DEFAULT_LOCATIONS[0];
  const countryPath = countryCtx?.countryPath || ((p) => p);
  const [justAdded, setJustAdded] = useState(false);

  const defaultVariant = useMemo(() => getDefaultVariant(product), [product]);

  const [manualPreviewVariant, setManualPreviewVariant] = useState(null);
  const previewVariant = manualPreviewVariant || defaultVariant;

  const startingStorage =
    product.startingStorage ||
    (product.storageOptions?.length > 0
      ? typeof product.storageOptions[0] === "object"
        ? product.storageOptions[0].label
        : product.storageOptions[0]
      : null);

  const sellingPrice = useMemo(() => {
    const raw =
      product.livePrice !== undefined && Number(product.livePrice) > 0
        ? Number(product.livePrice)
        : Number(product.price) > 0
        ? Number(product.price)
        : startingStorage && Number(product.storagePricing?.[startingStorage]) > 0
        ? Number(product.storagePricing[startingStorage])
        : 0;
    if (raw > 0) return raw;
    return convertAedToLocalPrice(estimateCatalogRetailPrice(product), activeCountry, 0);
  }, [product, startingStorage, activeCountry]);

  const originalPrice = Number(product.originalPrice || 0);
  const hasDiscount = originalPrice > sellingPrice && sellingPrice > 0;
  const discountPct = hasDiscount
    ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100)
    : 0;
  const hasStorageTiers =
    (product.storageOptions && product.storageOptions.length > 0) ||
    Boolean(product.storagePricing);
  const isFromPrice = product.startingFromPrice === true || hasStorageTiers;

  const wishlisted = isWishlisted(product.slug || product.id);

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const resolved = getActiveVariant(product, previewVariant, startingStorage);
    const targetSku =
      resolved?.sku ||
      product.activeStockSku ||
      (previewVariant
        ? buildVariantSku(product.sku, previewVariant.colorSlug, startingStorage)
        : product.sku);
    addToCart(product, 1, {
      color: previewVariant?.color || "",
      storage: startingStorage || "",
      sku: targetSku,
      price: Number(resolved?.livePrice) > 0 ? Number(resolved.livePrice) : sellingPrice,
      openDrawer: true,
    });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1800);
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
    <Link to={countryPath(`/products/${product.slug}`)} className="block group h-full text-left">
      <article className="group bg-white rounded-2xl border border-slate-200/90 hover:border-sky-300 hover:shadow-xl transition-all duration-300 h-full flex flex-col overflow-hidden cursor-pointer relative">
        {/* STUDIO PRODUCT IMAGE CONTAINER */}
        <div className="relative bg-slate-50/60 group-hover:bg-white border-b border-slate-100 h-40 sm:h-48 md:h-52 w-full flex items-center justify-center overflow-hidden transition-colors">
          <div className="w-full h-full flex items-center justify-center px-3 pt-7 pb-7 sm:p-4">
            <img
              src={previewVariant?.image || product.image}
              alt={product.name}
              className="max-h-24 sm:max-h-34 md:max-h-38 max-w-[76%] sm:max-w-[78%] w-auto h-auto object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-106"
              onError={(e) => {
                e.target.src = "/logo.png";
              }}
            />
          </div>

          {/* TOP-LEFT MERCHANDISING BADGE */}
          <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 flex flex-col gap-1 z-10">
            {hasDiscount && discountPct > 0 ? (
              <span className="bg-emerald-600 text-white text-[9.5px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg shadow-2xs leading-tight">
                Save {discountPct}%
              </span>
            ) : product.isNewArrival ? (
              <span className="bg-sky-700 text-white text-[9.5px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg shadow-2xs leading-tight">
                NEW
              </span>
            ) : null}
          </div>

          {/* TOP-RIGHT WISHLIST HEART BUTTON */}
          <button
            type="button"
            onClick={handleWishlistClick}
            className={`absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer z-10 border ${
              wishlisted
                ? "bg-rose-50 border-rose-200 text-rose-600 scale-105"
                : "bg-white/90 border-slate-200/80 text-slate-400 hover:text-rose-500 hover:border-rose-200 shadow-2xs"
            }`}
            title={wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            <FiHeart className={`text-xs sm:text-sm ${wishlisted ? "fill-rose-600" : ""}`} />
          </button>

          {/* BOTTOM SINGLE-LINE WARRANTY & STORAGE ROW (Never wraps onto 2 lines) */}
          <div className="absolute bottom-1.5 left-2 right-2 sm:bottom-2 sm:left-2.5 sm:right-2.5 flex items-center justify-between gap-1 pointer-events-none z-10">
            {product.isLowStock ? (
              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[9.5px] font-bold bg-amber-50/95 text-amber-800 border border-amber-200/80 whitespace-nowrap leading-none">
                ● {product.availabilityBadge || "Low Stock"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[9.5px] font-semibold bg-white/95 text-slate-600 border border-slate-200/80 whitespace-nowrap leading-none">
                <FiShield className="text-emerald-600 text-[9.5px] shrink-0" />
                <span className="sm:hidden">12M Warranty</span>
                <span className="hidden sm:inline">Official Warranty</span>
              </span>
            )}

            {startingStorage && (
              <span className="inline-flex items-center text-[9px] sm:text-[9.5px] font-bold text-sky-800 bg-sky-50/95 border border-sky-200/80 px-1.5 py-0.5 rounded-md whitespace-nowrap shrink-0 leading-none">
                {startingStorage}
              </span>
            )}
          </div>
        </div>

        {/* CONTENT DETAILS (Aligned baseline across 2-col mobile & 6-col desktop grids) */}
        <div className="p-2.5 sm:p-3.5 md:p-4 flex flex-col flex-1 bg-white justify-between">
          <div>
            {/* Brand Header */}
            <div className="flex items-center justify-between gap-1.5">
              <p className="text-[9.5px] sm:text-[10px] uppercase tracking-wider text-sky-700 font-extrabold truncate">
                {product.brand}
              </p>
              {product.subCategory && (
                <span className="hidden sm:inline text-[9.5px] text-slate-400 font-medium truncate">
                  {product.subCategory}
                </span>
              )}
            </div>

            {/* Product Name — Fixed 2-line height for strict horizontal alignment */}
            <h3 className="mt-0.5 text-[12px] sm:text-[13px] font-bold text-slate-900 group-hover:text-sky-700 line-clamp-2 leading-[1.3] h-[2.05rem] sm:h-[2.2rem] transition-colors">
              {product.name}
            </h3>

            {/* MICRO KEY SPECS — Single tidy horizontal row on mobile (no vertical pill stack) */}
            {keyFeatures.length > 0 && (
              <div className="mt-1.5 flex items-center gap-1 flex-nowrap sm:flex-wrap overflow-hidden">
                {keyFeatures.map((feat, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center text-[9px] sm:text-[9.5px] font-semibold text-slate-600 bg-slate-50 border border-slate-200/80 px-1.5 py-0.5 rounded-md whitespace-nowrap truncate max-w-[48%] sm:max-w-28 leading-none ${
                      idx >= 2 ? "hidden sm:inline-flex" : ""
                    }`}
                    title={feat}
                  >
                    {feat}
                  </span>
                ))}
              </div>
            )}

            {/* COLOR SWATCHES — Consistent reserved row height */}
            <div className="mt-2 flex items-center gap-1.5 flex-wrap min-h-[16px]">
              {product.variants?.length > 0 && (
                <>
                  {visibleVariants.map((variant) => (
                    <button
                      key={variant.colorSlug || variant.color}
                      type="button"
                      onMouseEnter={() => setManualPreviewVariant(variant)}
                      onMouseLeave={() => setManualPreviewVariant(null)}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setManualPreviewVariant(variant);
                      }}
                      title={variant.color}
                      className={`h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full border transition-all cursor-pointer ${
                        previewVariant?.colorSlug === variant.colorSlug
                          ? "border-sky-600 ring-2 ring-sky-400/30 scale-110"
                          : "border-slate-300 hover:border-sky-500"
                      }`}
                      style={{
                        backgroundColor: getColorSwatch(variant.color),
                      }}
                    />
                  ))}

                  {extraCount > 0 && (
                    <span className="text-[9.5px] font-medium text-slate-400 pl-0.5">
                      +{extraCount}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* LIVE PRICE & ADD TO CART CTA */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-end justify-between gap-1.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1 flex-wrap">
                {isFromPrice && (
                  <span className="text-[8.5px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                    From
                  </span>
                )}
                <AedPrice
                  amount={sellingPrice}
                  className="text-[13px] sm:text-[15px] font-black text-slate-900 font-mono leading-tight"
                  symbolClassName="text-sky-700 text-[10px] sm:text-[11px]"
                />
                {hasDiscount && (
                  <AedPrice
                    amount={originalPrice}
                    className="hidden sm:inline-flex text-[10px] font-normal text-slate-400 line-through"
                    symbolClassName="text-slate-400"
                  />
                )}
              </div>
              {(activeCountry.paymentMethods?.includes("tabby") ||
                activeCountry.paymentMethods?.includes("tamara")) &&
              (product.basePriceAed || sellingPrice) >= 300 ? (
                <p className="text-[9px] sm:text-[9.5px] text-slate-500 font-medium truncate mt-0.5">
                  4× {activeCountry.currencySymbol}{" "}
                  {Math.round(sellingPrice / 4).toLocaleString()} • 0%
                </p>
              ) : (
                <p className="text-[9px] sm:text-[9.5px] text-emerald-700 font-semibold truncate mt-0.5">
                  Express Delivery
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleQuickAdd}
              className={`h-8 w-8 sm:h-auto sm:w-auto sm:px-2.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] font-extrabold transition shadow-2xs cursor-pointer inline-flex items-center justify-center gap-1 shrink-0 ${
                justAdded
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-900 hover:bg-sky-700 text-white"
              }`}
              title="Add to Cart"
              aria-label="Add to Cart"
            >
              {justAdded ? (
                <>
                  <FiCheck className="text-xs" />
                  <span className="hidden sm:inline">Added</span>
                </>
              ) : (
                <>
                  <MdOutlineAddShoppingCart className="text-sm" />
                  <span className="hidden sm:inline">Add</span>
                </>
              )}
            </button>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default ProductCard;
