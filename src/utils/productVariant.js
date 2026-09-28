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
 * Returns the default (first) colour variant for a product.
 * Falls back to a minimal object if no variants exist.
 */
export const getDefaultVariant = (product) => {
  if (product?.variants?.length) {
    return product.variants.find((v) => v.isDefault) ?? product.variants[0];
  }
  return {
    color: null,
    colorSlug: null,
    sku: product?.sku,
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

  // If CatalogContext has already injected liveVariants keyed by variantSku, use it
  const live = product.liveVariants?.[variantSku.toUpperCase()];

  return {
    ...base,
    storage: stor,
    sku: variantSku,
    price: live?.price ?? basePrice,
    livePrice: live?.price ?? basePrice,
    liveQuantity: live?.quantity ?? null,
    availability: live?.availability ?? product.availability,
    costPrice: live?.costPrice ?? 0,
    margin: live?.margin ?? 0,
    originalPrice: live?.originalPrice ?? product.originalPrice ?? 0,
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
