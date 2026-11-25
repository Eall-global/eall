/**
 * productVariant.js
 * Utilities for the two-axis variant model: Color × Storage.
 *
 * Each product can have:
 *   variants[]        – colour entries (image / gallery / colorSlug)
 *   storageOptions[]  – e.g. ["256GB", "512GB", "1TB", "2TB"]
 *   storagePricing{}  – { "256GB": 3999, "512GB": 4599, "1TB": 5299, "2TB": 5999 }
 *
 * A flat variant SKU is built as:  <baseSku>-<COLOR_SLUG>-<STORAGE_SLUG>
 * e.g.  APPLE-IP18-PRO-BLACK-256GB
 */

/**
 * Returns the default colour variant for a product.
 * When live inventory is loaded, automatically prefers a colour variant that
 * matches an in-stock SKU (including regional SKUs like HMD-102-WEA / GREY).
 */
export const getDefaultVariant = (product) => {
  if (product?.variants?.length) {
    const liveVars = product.liveVariants || {};
    const activeSku = String(product.activeStockSku || "").toUpperCase();
    const activeLive = activeSku ? liveVars[activeSku] : null;
    const activeText = `${activeSku} ${activeLive?.name || ""} ${product.activeStockName || ""}`.toLowerCase();

    // 1. Prefer a color variant whose exact built SKU is in stock
    const exactInStock = product.variants.find((v) => {
      const built = buildVariantSku(product.sku, v.colorSlug, getDefaultStorage(product));
      return Number(liveVars[built]?.quantity) > 0;
    });
    if (exactInStock) return exactInStock;

    // 2. Prefer a color variant whose color name/slug appears in the active stocked regional SKU/name (e.g. GREY / BLUE / CHARCOAL)
    if (activeLive && Number(activeLive.quantity) > 0) {
      const colorMatched = product.variants.find((v) => {
        const slug = String(v.colorSlug || "").toLowerCase();
        const col = String(v.color || "").toLowerCase();
        if (slug && activeText.includes(slug)) return true;
        if (col && activeText.includes(col)) return true;
        if ((slug === "grey" || slug === "gray") && (activeText.includes("grey") || activeText.includes("gray") || activeText.includes("charcoal"))) return true;
        if (slug === "charcoal" && (activeText.includes("charcoal") || activeText.includes("darkgrey") || activeText.includes("black"))) return true;
        return false;
      });
      if (colorMatched) return colorMatched;
    }

    return product.variants.find((v) => v.isDefault) ?? product.variants[0];
  }
  return {
    color: null,
    colorSlug: null,
    sku: product?.activeStockSku || product?.sku,
    image: product?.image,
    gallery: product?.gallery || [],
  };
};

/**
 * Returns the default storage option for a product.
 * Prefers the one marked isDefault, otherwise the first option.
 */
export const getDefaultStorage = (product) => {
  if (!product?.storageOptions?.length) return null;
  return (
    product.storageOptions.find((s) => s?.isDefault) ??
    (typeof product.storageOptions[0] === "object"
      ? product.storageOptions[0].label
      : product.storageOptions[0])
  );
};

/**
 * Normalize a storage string into a URL-safe slug.
 * "256GB" → "256gb"
 */
export const storageSlug = (storage) =>
  String(storage || "").toLowerCase().replace(/\s+/g, "");

/**
 * Build the flat per-variant SKU used in Firestore.
 * baseSku: product.sku (e.g. "APPLE-IP18-PRO")
 * colorSlug: variant.colorSlug (e.g. "black")
 * storage: selected storage string (e.g. "256GB")
 *
 * Products WITHOUT storageOptions just use:  <baseSku>-<COLOR_SLUG>
 * Products WITHOUT variants just use:        <baseSku>
 */
export const buildVariantSku = (baseSku, colorSlug, storage) => {
  const base = String(baseSku || "").trim().toUpperCase();
  const color = colorSlug ? `-${String(colorSlug).toUpperCase()}` : "";
  const stor = storage ? `-${storageSlug(storage).toUpperCase()}` : "";
  return `${base}${color}${stor}`;
};

/**
 * Given a product, a selected color variant, and a selected storage string,
 * return the merged active variant object that includes:
 *   - image / gallery from the colour variant
 *   - sku built from baseSku + color + storage
 *   - price from storagePricing[storage] or product.price (0 if unknown)
 *   - livePrice / liveQuantity / availability if they have been merged in
 */
export const getActiveVariant = (product, colorVariant, storage) => {
  if (!product) return null;

  const base = colorVariant ?? getDefaultVariant(product);
  const stor = storage ?? getDefaultStorage(product);
  const variantSku = buildVariantSku(product.sku, base?.colorSlug, stor);

  // Price: prefer storagePricing map → then product-level price → 0
  const basePrice =
    stor && product.storagePricing?.[stor]
      ? product.storagePricing[stor]
      : product.price ?? product.livePrice ?? 0;

  // If CatalogContext has already injected liveVariants keyed by variantSku, use it.
  // When a product is stocked under a regional/custom child SKU (e.g. HMD-102-WEA),
  // fall back to the active in-stock variant so detail page & cart match Stock Manager 1:1.
  const liveVars = product.liveVariants || {};
  const exactLive = liveVars[variantSku.toUpperCase()];
  const activeStockKey = String(product.activeStockSku || "").toUpperCase();
  const fallbackLive =
    exactLive && Number(exactLive.quantity) > 0
      ? exactLive
      : activeStockKey &&
        liveVars[activeStockKey] &&
        Number(liveVars[activeStockKey].quantity) > 0 &&
        (!stor ||
          !liveVars[activeStockKey].storage ||
          String(liveVars[activeStockKey].storage).toLowerCase() ===
            String(stor).toLowerCase())
      ? liveVars[activeStockKey]
      : exactLive || (activeStockKey ? liveVars[activeStockKey] : null);

  const live = fallbackLive;
  const resolvedSku =
    live && Number(live.quantity) > 0 ? live.sku || variantSku : variantSku;
  const resolvedPrice =
    Number(live?.price) > 0 ? Number(live.price) : Number(basePrice) || 0;

  return {
    ...base,
    storage: stor,
    sku: resolvedSku,
    price: resolvedPrice,
    livePrice: resolvedPrice,
    liveQuantity: live?.quantity ?? product.liveQuantity ?? null,
    availability: live?.availability || product.availability || "In Stock",
    costPrice: live?.costPrice ?? 0,
    margin: live?.margin ?? 0,
    originalPrice:
      Number(live?.originalPrice) > 0
        ? Number(live.originalPrice)
        : Number(product.originalPrice) || 0,
  };
};

/**
 * Expand a product's variants × storageOptions into a flat list of SKU objects.
 * Used by stockService to seed Firestore with one document per sellable combination.
 */
export const expandToFlatSkus = (product) => {
  const baseSku = String(product.sku || "").trim().toUpperCase();
  const hasVariants = product.variants?.length > 0;
  const hasStorage = product.storageOptions?.length > 0;

  const rows = [];

  // Helper to normalise a storageOptions entry which might be a string or { label, isDefault }
  const storLabel = (s) => (typeof s === "object" ? s.label : s);

  if (!hasVariants && !hasStorage) {
    // Simple product — single SKU
    rows.push({ colorSlug: null, color: null, storage: null, sku: baseSku });
  } else if (hasVariants && !hasStorage) {
    // Colour-only variants (e.g. cases, accessories)
    product.variants.forEach((v) => {
      rows.push({
        colorSlug: v.colorSlug,
        color: v.color,
        storage: null,
        sku: buildVariantSku(baseSku, v.colorSlug, null),
        image: v.image,
        gallery: v.gallery,
      });
    });
  } else if (!hasVariants && hasStorage) {
    // Storage-only (no colour)
    product.storageOptions.forEach((s) => {
      const sl = storLabel(s);
      rows.push({
        colorSlug: null,
        color: null,
        storage: sl,
        sku: buildVariantSku(baseSku, null, sl),
      });
    });
  } else {
    // Full matrix: colour × storage
    product.variants.forEach((v) => {
      product.storageOptions.forEach((s) => {
        const sl = storLabel(s);
        rows.push({
          colorSlug: v.colorSlug,
          color: v.color,
          storage: sl,
          sku: buildVariantSku(baseSku, v.colorSlug, sl),
          image: v.image,
          gallery: v.gallery,
        });
      });
    });
  }

  return rows;
};
