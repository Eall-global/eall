import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  FiBriefcase,
  FiTruck,
  FiShield,
  FiCreditCard,
  FiZap,
} from "react-icons/fi";
import { BsWhatsapp } from "react-icons/bs";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useCountryOptional } from "../../context/CountryContext";
import {
  DEFAULT_LOCATIONS,
  convertAedToLocalPrice,
  formatLocalMoney,
} from "../../config/locationsConfig";
import { AedSymbol, AedPrice } from "../common/AedSymbol";
import { estimateCatalogRetailPrice } from "../../context/CatalogContext";

const availabilityStyles = {
  "In Stock": {
    bg: "bg-emerald-50 border-emerald-200 text-emerald-800",
    label: "In Stock • Ready for Dispatch",
  },
  "Limited Stock": {
    bg: "bg-amber-50 border-amber-200 text-amber-800",
    label: "Limited Stock • Ready to Ship",
  },
  "Hub Transfer Only": {
    bg: "bg-sky-50 border-sky-200 text-sky-800",
    label: "Available via Global Supply Hub Transfer",
  },
};

const ProductInfo = ({
  product,
  selectedVariant,
  selectedStorage,
  onVariantChange,
  onStorageChange,
  onOpenRfq,
}) => {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const countryCtx = useCountryOptional();
  const activeCountry = countryCtx?.activeCountry || DEFAULT_LOCATIONS[0];
  const countryPath = countryCtx?.countryPath || ((p) => p);
  const navigate = useNavigate();

  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  const rawAvail =
    selectedVariant?.availability || product.availability || "In Stock";
  const availability =
    availabilityStyles[rawAvail] || availabilityStyles["In Stock"];
  const isHubTransferOnly = rawAvail === "Hub Transfer Only";

  // Price: prefer the active variant's live price → product-level livePrice → converted catalog MSRP
  const rawPrice =
    selectedVariant?.livePrice !== undefined && Number(selectedVariant.livePrice) > 0
      ? Number(selectedVariant.livePrice)
      : selectedVariant?.price !== undefined && Number(selectedVariant.price) > 0
      ? Number(selectedVariant.price)
      : product.livePrice !== undefined && Number(product.livePrice) > 0
      ? Number(product.livePrice)
      : product.price !== undefined && Number(product.price) > 0
      ? Number(product.price)
      : 0;
  const displayPrice =
    rawPrice > 0
      ? rawPrice
      : convertAedToLocalPrice(estimateCatalogRetailPrice(product), activeCountry, 0);

  // Accurate USD reference using country FX rate
  const aedEquivalent =
    activeCountry.code === "AE"
      ? displayPrice
      : displayPrice / Math.max(0.0001, Number(activeCountry.fxRateFromAed) || 1);
  const usdEquivalent = (aedEquivalent / 3.6725).toFixed(2);
  const supportsInstallments =
    activeCountry.paymentMethods?.includes("tabby") ||
    activeCountry.paymentMethods?.includes("tamara");

  // Original price for strike-through
  const originalPrice =
    selectedVariant?.originalPrice && Number(selectedVariant.originalPrice) > displayPrice
      ? Number(selectedVariant.originalPrice)
      : product.originalPrice && Number(product.originalPrice) > displayPrice
      ? Number(product.originalPrice)
      : 0;

  const hasDiscount =
    originalPrice > 0 && displayPrice > 0 && originalPrice > displayPrice;
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

  const handleBuyNow = (e) => {
    e.preventDefault();
    addToCart(product, quantity, {
      color: selectedVariant?.color || "",
      storage: selectedVariant?.storage || selectedStorage || "",
      sku: selectedVariant?.sku || product.sku,
      price: displayPrice,
      openDrawer: false,
    });
    navigate(countryPath("/checkout"));
  };

  // Normalise storageOptions — array of strings or objects {label, isDefault}
  const storageOptions = (product.storageOptions || []).map((s) =>
    typeof s === "object" ? s.label : s
  );

  const hasStorage = storageOptions.length > 0;
  const hasColors = product.variants?.length > 0;

  const rfqProductSummary = [
    product.name,
    selectedVariant?.color,
    selectedStorage,
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <div className="space-y-5 text-left">
      {/* Brand, Availability & Title */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2.5">
          <Link
            to={countryPath(
              `/brands/${product.brandSlug || (product.brand || "").toLowerCase()}`
            )}
            className="text-xs uppercase font-extrabold tracking-widest text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg border border-sky-200/80 transition"
          >
            {product.brand} Official
          </Link>

          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${availability.bg}`}
          >
            ● {availability.label}
          </span>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
            <FiCheckCircle className="text-emerald-600" />{" "}
            {product.warranty || "Official"} 12-Month Warranty
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight tracking-tight">
          {product.name}
        </h1>

        <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
          {product.shortDescription}
        </p>
      </div>

      {/* SLEEK PRICING & INSTALLMENT BUY BOX */}
      <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-4 border-t-2 border-t-sky-700">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
          <div>
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider block">
              {activeCountry.shortName} Retail Price (Incl. {activeCountry.vatRate}% VAT)
              {selectedStorage && (
                <span className="ml-1 normal-case text-sky-700">
                  · {selectedStorage}
                </span>
              )}
              {selectedVariant?.color && (
                <span className="ml-1 normal-case text-slate-600">
                  · {selectedVariant.color}
                </span>
              )}
            </span>
            <div className="flex items-baseline gap-2.5 mt-1 flex-wrap">
              <AedPrice
                amount={displayPrice}
                className="text-2xl sm:text-3xl font-black text-slate-950 font-mono"
                symbolClassName="text-sky-700"
              />

              {hasDiscount && (
                <>
                  <AedPrice
                    amount={originalPrice}
                    className="text-sm sm:text-base font-normal text-slate-400 line-through"
                    symbolClassName="text-slate-400"
                  />
                  <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                    Save {discountPct}%
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="inline-block text-xs font-mono font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/70">
              ≈ USD {usdEquivalent}
            </span>
          </div>
        </div>

        {/* 0% Installment Plan Strip (AE/SA) or Regional Payment Strip */}
        {supportsInstallments && aedEquivalent >= 200 ? (
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <FiCreditCard className="text-indigo-600 shrink-0 text-sm" />
              <span>
                Split into <strong>4 interest-free payments</strong> of{" "}
                <strong className="text-slate-900 font-mono">
                  {formatLocalMoney(displayPrice / 4, activeCountry)}
                </strong>{" "}
                / mo
              </span>
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
              0% Fee • Tabby &amp; Tamara
            </span>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <FiCreditCard className="text-sky-700 shrink-0 text-sm" />
              <span>
                Pay locally in <strong>{activeCountry.currency}</strong> —{" "}
                {activeCountry.hubName}
              </span>
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              {activeCountry.flag} Local Checkout
            </span>
          </div>
        )}

        {isHubTransferOnly && (
          <div className="rounded-xl bg-sky-50 border border-sky-200 px-3.5 py-2.5 text-xs text-sky-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>
              <strong>Not currently in {activeCountry.city} local stock.</strong>{" "}
              Available for hub transfer from Dubai, China &amp; Hong Kong.
            </span>
            <button
              type="button"
              onClick={() => onOpenRfq?.(`${rfqProductSummary} (${activeCountry.shortName} Hub Transfer)`)}
              className="px-3 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white font-extrabold text-[11px] shrink-0 cursor-pointer transition"
            >
              Request Hub Transfer
            </button>
          </div>
        )}

        {/* COLOUR SELECTOR */}
        {hasColors && (
          <div className="pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Select Finish
              {selectedVariant?.color && (
                <span className="ml-1.5 text-slate-900 normal-case font-extrabold">
                  — {selectedVariant.color}
                </span>
              )}
            </h3>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((variant) => {
                const isActive =
                  selectedVariant?.colorSlug === variant.colorSlug;
                return (
                  <button
                    key={variant.colorSlug}
                    type="button"
                    onClick={() => onVariantChange(variant)}
                    title={variant.color}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                      isActive
                        ? "border-sky-600 bg-sky-50/80 text-sky-950 ring-2 ring-sky-600/20 font-bold"
                        : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                    }`}
                  >
                    <img
                      src={variant.image}
                      alt={variant.color}
                      className="w-6 h-6 object-contain mix-blend-multiply"
                    />
                    <span className="text-xs">{variant.color}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STORAGE SELECTOR */}
        {hasStorage && (
          <div className="pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <FiHardDrive className="text-slate-400" />
              Select Storage Capacity
              {selectedStorage && (
                <span className="ml-1 text-slate-900 normal-case font-extrabold">
                  — {selectedStorage}
                </span>
              )}
            </h3>
            <div className="flex flex-wrap gap-2">
              {storageOptions.map((stor) => {
                const isActive = selectedStorage === stor;
                const tierPrice = product.storagePricing?.[stor];
                return (
                  <button
                    key={stor}
                    type="button"
                    onClick={() => onStorageChange(stor)}
                    className={`flex flex-col items-center justify-center px-3.5 py-2 rounded-xl border transition cursor-pointer min-w-[72px] ${
                      isActive
                        ? "border-sky-600 bg-sky-50 text-sky-950 ring-2 ring-sky-600/20 font-bold shadow-2xs"
                        : "border-slate-200 hover:border-sky-300 text-slate-700 bg-white"
                    }`}
                  >
                    <span className="text-xs font-extrabold">{stor}</span>
                    {tierPrice > 0 && (
                      <span className="text-[10px] font-mono text-slate-500 mt-0.5">
                        <AedSymbol className="text-[9px]" />
                        {Number(tierPrice).toLocaleString()}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* PRIMARY & EXPRESS BUY CTAs */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-stretch gap-2.5">
          {/* Quantity Stepper */}
          <div className="flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 w-26 shrink-0">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="p-1 text-slate-500 hover:text-slate-900 rounded cursor-pointer"
            >
              <FiMinus className="text-xs" />
            </button>
            <span className="font-mono font-black text-xs text-slate-900">
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
            className="flex-1 min-w-[140px] py-3 px-4 bg-sky-700 hover:bg-sky-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
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

          {/* Express Buy Now Button */}
          <button
            type="button"
            onClick={handleBuyNow}
            className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <FiZap className="text-amber-400 text-sm" />
            <span>Buy Now</span>
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
            <FiHeart
              className={`text-lg ${wishlisted ? "fill-rose-600" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* B2B WHOLESALE & MASTER CARTON VOLUME PRICING CARD */}
      <div className="rounded-2xl bg-gradient-to-r from-orange-50 via-amber-50/70 to-orange-50 border border-orange-200/90 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0">
              <FiBriefcase className="text-xs" />
            </span>
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                B2B Wholesale &amp; Master Carton Allocation
              </h3>
              <p className="text-[11px] text-slate-600">
                Direct Dubai Silicon Oasis warehouse pricing for traders, resellers &amp; corporate buyers
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white/90 rounded-xl border border-orange-200/70 p-2">
            <span className="block text-[10px] font-extrabold text-orange-600 uppercase">
              10 – 49 Units
            </span>
            <span className="text-xs font-black text-slate-900">
              Dealer Tier 1
            </span>
          </div>
          <div className="bg-white/90 rounded-xl border border-orange-200/70 p-2">
            <span className="block text-[10px] font-extrabold text-orange-600 uppercase">
              50 – 199 Units
            </span>
            <span className="text-xs font-black text-slate-900">
              Master Carton
            </span>
          </div>
          <div className="bg-white/90 rounded-xl border border-orange-200/70 p-2">
            <span className="block text-[10px] font-extrabold text-orange-600 uppercase">
              200+ Units
            </span>
            <span className="text-xs font-black text-slate-900">
              FOB / EXW Export
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenRfq?.(rfqProductSummary)}
            className="flex-1 py-2.5 px-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <FiBriefcase className="text-xs" />
            <span>Request Wholesale Quote for {product.shortName || product.name}</span>
          </button>

          <a
            href={`https://wa.me/971526073267?text=${encodeURIComponent(
              `Hi E-ALL B2B Desk, I would like a bulk wholesale quote for ${rfqProductSummary} (SKU: ${
                selectedVariant?.sku || product.sku
              }).`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 transition shrink-0"
          >
            <BsWhatsapp className="text-sm" />
            <span className="hidden sm:inline">WhatsApp Desk</span>
          </a>
        </div>
      </div>

      {/* 4-PILLAR DELIVERY & TRUST ASSURANCE */}
      <div className="grid grid-cols-2 gap-2.5 text-xs">
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <FiTruck className="text-sky-700 text-base shrink-0" />
          <div>
            <p className="font-bold text-slate-900 text-[11px]">
              Express {activeCountry.shortName} Delivery
            </p>
            <p className="text-[10px] text-slate-500">
              Free shipping over{" "}
              {formatLocalMoney(activeCountry.freeShippingThreshold, activeCountry)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <FiShield className="text-emerald-700 text-base shrink-0" />
          <div>
            <p className="font-bold text-slate-900 text-[11px]">
              100% Genuine &amp; IMEI Verified
            </p>
            <p className="text-[10px] text-slate-500">
              Factory-sealed regional specs
            </p>
          </div>
        </div>
      </div>

      {/* Key Specifications Grid */}
      <div className="grid grid-cols-2 gap-3 border rounded-2xl border-slate-200/80 p-4 bg-slate-50/50 text-xs">
        <InfoItem
          icon={<FiPackage />}
          label="SKU"
          value={selectedVariant?.sku || product.sku}
        />
        <InfoItem
          icon={<FiGrid />}
          label="Category"
          value={product.categoryName || product.category}
        />
        <InfoItem
          icon={<FiLayers />}
          label="Sub Category"
          value={product.subCategory}
        />
        <InfoItem icon={<FiTag />} label="Model" value={product.model} />
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
    <p className="mt-0.5 font-semibold text-xs text-slate-800 truncate">
      {value || "-"}
    </p>
  </div>
);

export default ProductInfo;
