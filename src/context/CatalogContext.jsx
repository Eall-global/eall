/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { products as staticCatalog } from "../data/products/index";
import { fetchStock, subscribeToStock } from "../services/stockService";
import { useCountryOptional } from "./CountryContext";
import {
  DEFAULT_LOCATIONS,
  convertAedToLocalPrice,
} from "../config/locationsConfig";

const CatalogContext = createContext(null);

/**
 * Resolve a single Firestore stock item's quantity, price, and alert threshold
 * for the given country/hub code (backward-compatible with legacy AE root fields).
 */
export const getItemLocationStock = (item, countryCode = "AE") => {
  if (!item) {
    return { quantity: 0, priceLocal: 0, minAlert: 3, inTransitIn: 0 };
  }
  const code = String(countryCode || "AE").toUpperCase();
  const locEntry = item.locations?.[code];

  if (code === "AE") {
    return {
      quantity:
        locEntry?.quantity !== undefined
          ? Number(locEntry.quantity) || 0
          : Number(item.quantity || 0),
      priceLocal:
        Number(locEntry?.priceLocal) > 0
          ? Number(locEntry.priceLocal)
          : Number(item.price || 0),
      minAlert:
        locEntry?.minAlert !== undefined
          ? Number(locEntry.minAlert)
          : Number(item.minAlert ?? 3),
      inTransitIn: Number(locEntry?.inTransitIn || 0),
    };
  }

  return {
    quantity: locEntry?.quantity !== undefined ? Number(locEntry.quantity) || 0 : 0,
    priceLocal: Number(locEntry?.priceLocal) > 0 ? Number(locEntry.priceLocal) : 0,
    minAlert:
      locEntry?.minAlert !== undefined
        ? Number(locEntry.minAlert)
        : Number(item.minAlert ?? 3),
    inTransitIn: Number(locEntry?.inTransitIn || 0),
  };
};

/**
 * Sum Tier-1 Global Supply Hub stock (Dubai AE, China CN, Hong Kong HK) across matching stock items.
 */
export const getSupplyHubBreakdown = (items = []) => {
  let AE = 0;
  let CN = 0;
  let HK = 0;
  items.forEach((item) => {
    const aeQty =
      item?.locations?.AE?.quantity !== undefined
        ? Number(item.locations.AE.quantity) || 0
        : Number(item?.quantity || 0);
    const cnQty = Number(item?.locations?.CN?.quantity || 0);
    const hkQty = Number(item?.locations?.HK?.quantity || 0);
    AE += aeQty;
    CN += cnQty;
    HK += hkQty;
  });
  return { AE, CN, HK, total: AE + CN + HK };
};

/**
 * Deterministic UAE Retail AED price & storage-tier estimator for catalog models
 * that do not yet have a custom price override in Firestore.
 */
export const estimateCatalogRetailPrice = (prod) => {
  if (!prod) return 299;
  if (Number(prod.price) > 0) return Number(prod.price);

  const text = `${prod.slug || ""} ${prod.name || ""} ${prod.model || ""}`.toLowerCase();
  const brand = (prod.brand || "").toLowerCase();
  const sub = (prod.subCategory || "").toLowerCase();

  if (brand === "apple") {
    if (text.includes("18-pro-max") || text.includes("18 pro max")) return 5499;
    if (text.includes("18-pro") || text.includes("18 pro")) return 5099;
    if (text.includes("18-air") || text.includes("18 air")) return 4299;
    if (text.includes("17-pro-max") || text.includes("17 pro max")) return 4899;
    if (text.includes("17-pro") || text.includes("17 pro")) return 4499;
    if (text.includes("16-pro-max") || text.includes("16 pro max")) return 4499;
    if (text.includes("16-pro") || text.includes("16 pro")) return 3999;
    if (text.includes("16-plus") || text.includes("16 plus")) return 3499;
    if (text.includes("iphone")) return 3199;
    if (text.includes("airpods max")) return 2099;
    if (text.includes("airpods pro 4")) return 1049;
    if (text.includes("airpods pro")) return 949;
    if (text.includes("airpods")) return 649;
    if (text.includes("ipad pro")) return 4199;
    if (text.includes("ipad air")) return 2499;
    if (text.includes("ipad")) return 1499;
    if (text.includes("watch ultra")) return 3199;
    if (text.includes("watch")) return 1599;
    return 1999;
  }

  if (brand === "samsung") {
    if (sub.includes("tablet") || text.includes("tab")) {
      if (text.includes("ultra")) return 4599;
      if (text.includes("s10+") || text.includes("s10-plus") || text.includes("s9+") || text.includes("s9-plus")) return 3699;
      if (text.includes("s10") || text.includes("s9")) {
        if (text.includes("fe+") || text.includes("fe-plus")) return 1999;
        if (text.includes("fe")) return 1549;
        return 2999;
      }
      if (text.includes("active")) return 1699;
      if (text.includes("a11") || text.includes("a9+") || text.includes("a9-plus")) return 799;
      return 599;
    }
    if (sub.includes("wearable") || text.includes("watch") || text.includes("ring")) {
      if (text.includes("ultra")) return 2299;
      if (text.includes("classic")) return 1699;
      if (text.includes("ring")) return 1499;
      if (text.includes("watch8") || text.includes("watch 8") || text.includes("watch7") || text.includes("watch 7")) return 1099;
      if (text.includes("fe") || text.includes("fit")) return 599;
      return 999;
    }
    if (sub.includes("audio") || text.includes("buds")) {
      if (text.includes("pro")) return 799;
      if (text.includes("buds3") || text.includes("buds 3")) return 549;
      if (text.includes("fe")) return 329;
      return 449;
    }
    // Samsung Smartphones
    if (text.includes("fold")) return 6799;
    if (text.includes("flip")) return 3899;
    if (text.includes("s26-ultra") || text.includes("s26 ultra")) return 4899;
    if (text.includes("s25-ultra") || text.includes("s25 ultra")) return 4499;
    if (text.includes("s24-ultra") || text.includes("s24 ultra")) return 3899;
    if (text.includes("s26+") || text.includes("s26-plus") || text.includes("s25+") || text.includes("s25-plus")) return 3699;
    if (text.includes("s26") || text.includes("s25")) {
      if (text.includes("fe")) return 2199;
      if (text.includes("edge") || text.includes("slim")) return 3999;
      return 3199;
    }
    if (text.includes("s24")) return text.includes("fe") ? 1899 : 2699;
    if (text.includes("a56") || text.includes("a55")) return 1449;
    if (text.includes("a36") || text.includes("a35")) return 1149;
    if (text.includes("a26") || text.includes("a25")) return 879;
    if (text.includes("a16-5g") || text.includes("a16 5g") || text.includes("a15-5g")) return 699;
    if (text.includes("a16") || text.includes("a15")) return 579;
    if (text.includes("a06-5g") || text.includes("a06 5g")) return 469;
    if (text.includes("a06") || text.includes("a05")) return 369;
    return 1299;
  }

  // HMD & Nokia
  if (sub.includes("wearable") || text.includes("watch")) {
    if (text.includes("x1")) return 279;
    return 199;
  }
  if (sub.includes("audio") || text.includes("dub") || text.includes("buds")) {
    if (text.includes("x50")) return 179;
    if (text.includes("p70")) return 149;
    if (text.includes("p60")) return 129;
    return 99;
  }
  if (sub.includes("tablet") || text.includes("t21") || text.includes("t20") || text.includes("t10")) {
    return 699;
  }
  if (sub.includes("feature") || text.includes("105") || text.includes("106") || text.includes("108") || text.includes("110") || text.includes("130") || text.includes("150") || text.includes("215") || text.includes("220") || text.includes("225") || text.includes("235") || text.includes("3210") || text.includes("2660") || text.includes("5710") || text.includes("6310") || text.includes("8210") || text.includes("100") || text.includes("101") || text.includes("102")) {
    if (text.includes("2660") || text.includes("flip") || text.includes("5710") || text.includes("barbie")) return 279;
    if (text.includes("3210") || text.includes("6310") || text.includes("8210")) return 249;
    if (text.includes("235") || text.includes("225") || text.includes("220") || text.includes("215")) return 189;
    if (text.includes("150") || text.includes("130")) return 135;
    if (text.includes("110") || text.includes("108") || text.includes("106") || text.includes("striker")) return 85;
    return 65;
  }
  // HMD / Nokia Smartphones
  if (text.includes("skyline")) return 1599;
  if (text.includes("xr21") || text.includes("xr20")) return 1699;
  if (text.includes("fusion") || text.includes("crest")) return 799;
  if (text.includes("luma")) return 549;
  if (text.includes("pulse")) return 499;
  if (text.includes("aura")) return 389;
  if (text.includes("arc")) return 349;
  return 499;
};

export const buildCatalogStoragePricing = (basePrice, storageOptions, existingMap) => {
  if (existingMap && typeof existingMap === "object" && Object.keys(existingMap).length > 0) {
    return existingMap;
  }
  if (!Array.isArray(storageOptions) || storageOptions.length === 0 || !(basePrice > 0)) {
    return null;
  }
  const step = basePrice >= 3000 ? 450 : basePrice >= 1200 ? 220 : basePrice >= 500 ? 110 : 60;
  const map = {};
  storageOptions.forEach((opt, idx) => {
    const label = typeof opt === "object" ? opt.label : opt;
    if (label) {
      map[label] = Math.round(basePrice + idx * step);
    }
  });
  return map;
};

/**
 * Computes dynamic availability for the public storefront.
 * In strict local country storefronts (non-AE), qty <= 0 is marked unavailable locally.
 */
export const computeLiveAvailability = (liveQty, minAlert = 3, strictLocal = false) => {
  const qty = Number(liveQty);
  if (strictLocal && (isNaN(qty) || qty <= 0)) {
    return {
      status: "Hub Transfer Only",
      badgeText: "Available via Hub",
      className: "bg-slate-100 text-slate-600 border-slate-200",
      inStock: false,
      isLowStock: false,
      unitsLeft: 0,
    };
  }

  if (!isNaN(qty) && qty > 0 && qty <= Number(minAlert)) {
    return {
      status: "Limited Stock",
      badgeText: `Only ${qty} Left`,
      className: "bg-amber-50 text-amber-700 border-amber-200",
      inStock: true,
      isLowStock: true,
      unitsLeft: qty,
    };
  }

  return {
    status: "In Stock",
    badgeText: "In Stock",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    inStock: true,
    isLowStock: false,
    unitsLeft: !isNaN(qty) && qty > 0 ? qty : 25,
  };
};

export const CatalogProvider = ({ children }) => {
  const countryCtx = useCountryOptional();
  const activeCountry = countryCtx?.activeCountry || DEFAULT_LOCATIONS[0];
  const countryCode = activeCountry.code || "AE";
  const isStrictLocalCountry = countryCode !== "AE";

  const [liveStockMap, setLiveStockMap] = useState(new Map());
  const [loading, setLoading] = useState(true);

  // Fetch live inventory from Firestore / stockService
  const refreshStock = useCallback(async () => {
    try {
      const stockData = await fetchStock();
      const map = new Map();
      (stockData || []).forEach((item) => {
        if (item.sku) {
          map.set(item.sku.toUpperCase(), item);
        }
      });
      setLiveStockMap(map);
    } catch (err) {
      console.warn("Could not fetch live stock for catalog:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and Google Firestore Real-time listener (unlimited connections, zero quota trap)
  useEffect(() => {
    let active = true;
    fetchStock()
      .then((stockData) => {
        if (!active) return;
        const map = new Map();
        (stockData || []).forEach((item) => {
          if (item.sku) {
            map.set(item.sku.toUpperCase(), item);
          }
        });
        setLiveStockMap(map);
      })
      .catch((err) => {
        console.warn("Could not fetch live stock for catalog:", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const unsubscribe = subscribeToStock((stockData) => {
      if (!active) return;
      const map = new Map();
      (stockData || []).forEach((item) => {
        if (item.sku) {
          map.set(item.sku.toUpperCase(), item);
        }
      });
      setLiveStockMap(map);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Normalize SKU/slug tokens so underscores and hyphens match cleanly (e.g. HMD-150_MUSIC ↔ HMD-150-MUSIC-WEA)
  const normalizeMatchKey = (val = "") =>
    String(val || "")
      .trim()
      .toUpperCase()
      .replace(/[_\s]+/g, "-")
      .replace(/-+/g, "-");

  // Merge static catalog specifications with dynamic multi-location live inventory & active country pricing
  const allCatalogProducts = useMemo(() => {
    // 1. Pre-index static catalog products so each Firestore SKU is assigned to its SINGLE MOST SPECIFIC product
    //    (prevents e.g. NOKIA-110 from stealing NOKIA-110-POWER, and maps HMD-150-MUSIC-WEA -> HMD-150_MUSIC)
    const catalogDescriptors = (staticCatalog || []).map((prod, idx) => {
      const cleanSku = (
        prod.sku || `EALL-${(prod.brand || "GEN").toUpperCase()}-${prod.id}`
      ).toUpperCase();
      const prodSlug = (prod.slug || "").toLowerCase();
      return {
        idx,
        prod,
        cleanSku,
        normSku: normalizeMatchKey(cleanSku),
        prodSlug,
        normSlug: normalizeMatchKey(prodSlug),
      };
    });

    const matchesByIndex = new Map();
    const claimedStockSkus = new Set();

    liveStockMap.forEach((item) => {
      const itemSku = (item.sku || "").toUpperCase();
      if (!itemSku) return;
      const itemNormSku = normalizeMatchKey(itemSku);
      const itemParentNorm = normalizeMatchKey(item.parentSku || "");
      const itemSlug = (item.slug || "").toLowerCase();

      let bestDesc = null;
      let bestScore = 0;

      for (const desc of catalogDescriptors) {
        let score = 0;

        if (itemNormSku === desc.normSku) {
          score = 1000 + desc.normSku.length;
        } else if (itemParentNorm && itemParentNorm === desc.normSku) {
          score = 900 + desc.normSku.length;
        } else if (itemSlug && desc.prodSlug && itemSlug === desc.prodSlug) {
          score = 850 + desc.prodSlug.length;
        } else if (
          desc.normSku &&
          itemNormSku.startsWith(`${desc.normSku}-`)
        ) {
          // Guard Apple sibling prefix overlaps
          if (
            (desc.cleanSku === "APPLE-IP18-PRO" &&
              itemNormSku.startsWith("APPLE-IP18-PRO-MAX-")) ||
            (desc.cleanSku === "APPLE-IP18" &&
              (itemNormSku.startsWith("APPLE-IP18-PRO-") ||
                itemNormSku.startsWith("APPLE-IP18-PRO-MAX-"))) ||
            (desc.cleanSku === "APL-IP16P" &&
              itemNormSku.startsWith("APL-IP16PM-"))
          ) {
            score = 0;
          } else {
            score = 700 + desc.normSku.length;
          }
        } else if (
          desc.normSlug.length >= 6 &&
          (itemNormSku === desc.normSlug ||
            itemNormSku.startsWith(`${desc.normSlug}-`))
        ) {
          // Handles e.g. NOKIA-150-MUSIC-SSA matching Nokia 150 Music (slug: nokia-150-music)
          score = 720 + desc.normSlug.length;
        } else if (
          desc.cleanSku === "APL-IP16P-256-BLK" &&
          (itemSku === "APL-IP16P-256-BLK" ||
            (itemSku.startsWith("APL-IP16P-") &&
              !itemSku.startsWith("APL-IP16PM-")))
        ) {
          score = 650;
        } else if (
          desc.cleanSku === "APL-IP17PM-256-ORN" &&
          (itemSku === "APL-IP17PM-256-ORN" ||
            itemSku.startsWith("APL-IP17PM-"))
        ) {
          score = 650;
        }

        if (score > bestScore) {
          bestScore = score;
          bestDesc = desc;
        }
      }

      if (bestDesc) {
        claimedStockSkus.add(itemSku);
        if (!matchesByIndex.has(bestDesc.idx)) {
          matchesByIndex.set(bestDesc.idx, []);
        }
        matchesByIndex.get(bestDesc.idx).push(item);
      }
    });

    const hydratedStatic = catalogDescriptors.map(({ idx, prod, cleanSku }) => {
      const matchingItems = matchesByIndex.get(idx) || [];
      const directItem =
        liveStockMap.get(cleanSku) ||
        matchingItems.find((i) => i.sku.toUpperCase() === cleanSku);

      // Supply Hub totals (Dubai AE + China CN + Hong Kong HK)
      const supplyHubStock = getSupplyHubBreakdown(
        matchingItems.length > 0 ? matchingItems : directItem ? [directItem] : []
      );

      // Local country quantity & alert threshold across all matched Firestore variants
      let totalLocalQty = 0;
      let minAlert = 3;
      matchingItems.forEach((v) => {
        const loc = getItemLocationStock(v, countryCode);
        totalLocalQty += loc.quantity;
        if (loc.minAlert !== undefined) minAlert = Math.min(minAlert, loc.minAlert);
      });

      const localQty =
        matchingItems.length > 0
          ? totalLocalQty
          : directItem
          ? getItemLocationStock(directItem, countryCode).quantity
          : countryCode === "AE"
          ? prod.quantity !== undefined
            ? Number(prod.quantity)
            : prod.stock !== undefined
            ? Number(prod.stock)
            : 0
          : 0;

      const hasLocalStock = localQty > 0;
      const hasStorageTiers =
        (prod.storageOptions && prod.storageOptions.length > 0) || Boolean(prod.storagePricing);

      // Evaluate EVERY matching variant by its true effective price in the active country
      // Priority:
      //   1) In-stock variants at active country (preferring explicit local country priceLocal > 0, then lowest effective price)
      //   2) Any priced variant (preferring explicit local priceLocal > 0, then lowest effective price)
      let bestInStockVariant = null;
      let bestInStockHasExplicit = false;
      let bestInStockLocalPrice = Infinity;

      let bestAnyVariant = null;
      let bestAnyHasExplicit = false;
      let bestAnyLocalPrice = Infinity;

      matchingItems.forEach((item) => {
        const aeInfo = getItemLocationStock(item, "AE");
        const locInfo = getItemLocationStock(item, countryCode);
        const pAed = aeInfo.priceLocal > 0 ? aeInfo.priceLocal : Number(item.price || 0);
        const explicitLoc =
          isStrictLocalCountry && locInfo.priceLocal > 0 ? locInfo.priceLocal : 0;
        const effectiveLocal =
          explicitLoc > 0
            ? explicitLoc
            : pAed > 0
            ? convertAedToLocalPrice(pAed, activeCountry, 0)
            : 0;
        const q = locInfo.quantity;

        if (effectiveLocal > 0) {
          const hasExp = explicitLoc > 0;

          if (
            !bestAnyVariant ||
            (hasExp && !bestAnyHasExplicit) ||
            (hasExp === bestAnyHasExplicit && effectiveLocal < bestAnyLocalPrice)
          ) {
            bestAnyVariant = item;
            bestAnyHasExplicit = hasExp;
            bestAnyLocalPrice = effectiveLocal;
          }

          if (
            q > 0 &&
            (!bestInStockVariant ||
              (hasExp && !bestInStockHasExplicit) ||
              (hasExp === bestInStockHasExplicit &&
                effectiveLocal < bestInStockLocalPrice))
          ) {
            bestInStockVariant = item;
            bestInStockHasExplicit = hasExp;
            bestInStockLocalPrice = effectiveLocal;
          }
        } else if (q > 0 && !bestInStockVariant) {
          // Even if price wasn't filled yet, remember an in-stock SKU exists
          bestInStockVariant = item;
        }
      });

      const activeLiveTier = bestInStockVariant || bestAnyVariant;

      // Resolve Base AED pricing & Explicit Country Local Price directly from active live tier!
      let basePriceAed = 0;
      let costPrice = directItem ? Number(directItem.costPrice || 0) : Number(prod.costPrice || 0);
      let margin = directItem ? Number(directItem.margin || 0) : Number(prod.margin || 0);
      let baseOriginalPriceAed = directItem ? Number(directItem.originalPrice || 0) : 0;
      let startingStorage = null;
      let explicitCountryPrice = 0;

      if (activeLiveTier) {
        const aeTier = getItemLocationStock(activeLiveTier, "AE");
        const locTier = getItemLocationStock(activeLiveTier, countryCode);
        basePriceAed =
          aeTier.priceLocal > 0 ? aeTier.priceLocal : Number(activeLiveTier.price || 0);
        if (isStrictLocalCountry && locTier.priceLocal > 0) {
          explicitCountryPrice = locTier.priceLocal;
        }
        costPrice = Number(activeLiveTier.costPrice || costPrice);
        margin = Number(activeLiveTier.margin || margin);
        if (activeLiveTier.originalPrice && Number(activeLiveTier.originalPrice) > 0) {
          baseOriginalPriceAed = Number(activeLiveTier.originalPrice);
        }
        if (activeLiveTier.storage) {
          startingStorage = activeLiveTier.storage;
        }
      } else if (directItem) {
        const aeDirect = getItemLocationStock(directItem, "AE");
        const locDirect = getItemLocationStock(directItem, countryCode);
        if (aeDirect.priceLocal > 0) {
          basePriceAed = aeDirect.priceLocal;
        }
        if (isStrictLocalCountry && locDirect.priceLocal > 0) {
          explicitCountryPrice = locDirect.priceLocal;
        }
        if (directItem.originalPrice && Number(directItem.originalPrice) > 0) {
          baseOriginalPriceAed = Number(directItem.originalPrice);
        }
      }

      if (basePriceAed === 0) {
        if (costPrice + margin > 0) {
          basePriceAed = costPrice + margin;
        } else if (prod.price !== undefined && Number(prod.price) > 0) {
          basePriceAed = Number(prod.price);
        }
      }

      // Build AED storagePricing first, then convert each storage tier to active country currency
      const resolvedStoragePricingAed = buildCatalogStoragePricing(
        basePriceAed > 0 ? basePriceAed : estimateCatalogRetailPrice(prod),
        prod.storageOptions,
        prod.storagePricing
      );

      if (basePriceAed === 0 && resolvedStoragePricingAed && typeof resolvedStoragePricingAed === "object") {
        const entries = Object.entries(resolvedStoragePricingAed).filter(([, v]) => Number(v) > 0);
        if (entries.length > 0) {
          entries.sort((a, b) => Number(a[1]) - Number(b[1]));
          basePriceAed = Number(entries[0][1]);
          startingStorage = entries[0][0];
        }
      }

      if (basePriceAed === 0) {
        basePriceAed = estimateCatalogRetailPrice(prod);
      }

      if (hasStorageTiers && !startingStorage && prod.storageOptions && prod.storageOptions.length > 0) {
        const first = prod.storageOptions[0];
        startingStorage = typeof first === "object" ? first.label : first;
      }

      if (baseOriginalPriceAed === 0) {
        if (prod.originalPrice !== undefined && Number(prod.originalPrice) > 0) {
          baseOriginalPriceAed = Number(prod.originalPrice);
        } else if (prod.listPrice !== undefined && Number(prod.listPrice) > 0) {
          baseOriginalPriceAed = Number(prod.listPrice);
        } else {
          for (const item of matchingItems) {
            if (item.originalPrice && Number(item.originalPrice) > 0) {
              baseOriginalPriceAed = Number(item.originalPrice);
              break;
            }
          }
        }
      }

      // Convert AED base prices -> Active country local prices (explicit local price ALWAYS wins!)
      const livePrice = convertAedToLocalPrice(basePriceAed, activeCountry, explicitCountryPrice);
      const originalPrice =
        baseOriginalPriceAed > 0
          ? convertAedToLocalPrice(baseOriginalPriceAed, activeCountry, 0)
          : 0;

      // Build local currency storagePricing map
      let resolvedStoragePricing = null;
      if (resolvedStoragePricingAed && typeof resolvedStoragePricingAed === "object") {
        resolvedStoragePricing = {};
        Object.entries(resolvedStoragePricingAed).forEach(([storLabel, aedVal]) => {
          const matchingStorageItem = matchingItems.find(
            (m) =>
              m.storage &&
              String(m.storage).toLowerCase() === String(storLabel).toLowerCase() &&
              getItemLocationStock(m, countryCode).priceLocal > 0
          );
          const explicitStorLocal =
            isStrictLocalCountry && matchingStorageItem
              ? getItemLocationStock(matchingStorageItem, countryCode).priceLocal
              : 0;
          resolvedStoragePricing[storLabel] = convertAedToLocalPrice(
            aedVal,
            activeCountry,
            explicitStorLocal
          );
        });
      }

      // Build liveVariants keyed by uppercase variant SKU with active-country stock & pricing
      const liveVariants = {};
      matchingItems.forEach((item) => {
        const locInfo = getItemLocationStock(item, countryCode);
        const aeInfo = getItemLocationStock(item, "AE");
        const variantAed = aeInfo.priceLocal > 0 ? aeInfo.priceLocal : basePriceAed;
        const variantLocalPrice = convertAedToLocalPrice(
          variantAed,
          activeCountry,
          isStrictLocalCountry ? locInfo.priceLocal : 0
        );
        const variantLocalOriginal =
          Number(item.originalPrice) > 0
            ? convertAedToLocalPrice(Number(item.originalPrice), activeCountry, 0)
            : 0;
        const avail = computeLiveAvailability(
          locInfo.quantity,
          locInfo.minAlert,
          isStrictLocalCountry
        );

        liveVariants[item.sku.toUpperCase()] = {
          ...item,
          price: variantLocalPrice,
          priceAed: variantAed,
          originalPrice: variantLocalOriginal,
          quantity: locInfo.quantity,
          localQuantity: locInfo.quantity,
          availability: avail.status,
          availabilityBadge: avail.badgeText,
          isInStock: avail.inStock,
          isLowStock: avail.isLowStock,
          stockUnitsLeft: avail.unitsLeft,
        };
      });

      const activeStockSku = bestInStockVariant
        ? bestInStockVariant.sku.toUpperCase()
        : cleanSku;

      const startingFromPrice = hasStorageTiers;
      const hasDiscount = originalPrice > livePrice && livePrice > 0;
      const discountPercentage = hasDiscount
        ? Math.round(((originalPrice - livePrice) / originalPrice) * 100)
        : 0;

      const availabilityInfo = computeLiveAvailability(localQty, minAlert, isStrictLocalCountry);

      return {
        ...prod,
        sku: cleanSku,
        activeStockSku,
        activeStockName: bestInStockVariant?.name || prod.name,
        storagePricing: resolvedStoragePricing || prod.storagePricing,
        storagePricingAed: resolvedStoragePricingAed,
        liveQuantity: localQty,
        localQuantity: localQty,
        hasLocalStock,
        supplyHubStock,
        countryCode,
        currency: activeCountry.currency,
        basePriceAed,
        costPrice,
        margin,
        livePrice,
        price: livePrice, // exact local currency price matching Stock Manager
        originalPrice,
        hasDiscount,
        discountPercentage,
        minAlert,
        startingFromPrice,
        startingStorage,
        availability: availabilityInfo.status,
        availabilityBadge: availabilityInfo.badgeText,
        availabilityClass: availabilityInfo.className,
        isInStock: availabilityInfo.inStock,
        isLowStock: availabilityInfo.isLowStock,
        stockUnitsLeft: availabilityInfo.unitsLeft,
        liveVariants,
      };
    });

    // 2. Surface any custom/unlisted Firestore SKUs that did not match staticCatalog and have stock
    const customStockProducts = [];
    liveStockMap.forEach((item) => {
      const itemSku = (item.sku || "").toUpperCase();
      if (!itemSku || claimedStockSkus.has(itemSku)) return;

      const locInfo = getItemLocationStock(item, countryCode);
      const aeInfo = getItemLocationStock(item, "AE");
      const supplyHubStock = getSupplyHubBreakdown([item]);
      const localQty = locInfo.quantity;
      if (localQty <= 0 && (isStrictLocalCountry || supplyHubStock.total <= 0)) {
        return;
      }

      const basePriceAed =
        aeInfo.priceLocal > 0 ? aeInfo.priceLocal : Number(item.price || 0);
      const explicitCountryPrice =
        isStrictLocalCountry && locInfo.priceLocal > 0 ? locInfo.priceLocal : 0;
      const livePrice = convertAedToLocalPrice(
        basePriceAed,
        activeCountry,
        explicitCountryPrice
      );
      const originalPrice =
        Number(item.originalPrice) > 0
          ? convertAedToLocalPrice(Number(item.originalPrice), activeCountry, 0)
          : 0;
      const avail = computeLiveAvailability(
        localQty,
        locInfo.minAlert,
        isStrictLocalCountry
      );
      const brandLabel = String(item.brand || "General").trim();
      const catLabel = String(item.category || "Mobile Devices").trim();
      const slug = itemSku.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      customStockProducts.push({
        id: `custom-${itemSku}`,
        sku: itemSku,
        activeStockSku: itemSku,
        activeStockName: item.name || itemSku,
        slug,
        name: item.name || itemSku,
        shortName: item.name || itemSku,
        brand: brandLabel,
        brandSlug: brandLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        category: catLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        categoryName: catLabel,
        subCategory: catLabel,
        image: item.image || "/logo.png",
        gallery: [item.image || "/logo.png"],
        warranty: "Official 12-Month Warranty",
        liveQuantity: localQty,
        localQuantity: localQty,
        hasLocalStock: localQty > 0,
        supplyHubStock,
        countryCode,
        currency: activeCountry.currency,
        basePriceAed,
        costPrice: Number(item.costPrice || 0),
        margin: Number(item.margin || 0),
        livePrice,
        price: livePrice,
        originalPrice,
        hasDiscount: originalPrice > livePrice && livePrice > 0,
        discountPercentage:
          originalPrice > livePrice && livePrice > 0
            ? Math.round(((originalPrice - livePrice) / originalPrice) * 100)
            : 0,
        minAlert: locInfo.minAlert,
        startingFromPrice: false,
        startingStorage: null,
        availability: avail.status,
        availabilityBadge: avail.badgeText,
        availabilityClass: avail.className,
        isInStock: avail.inStock,
        isLowStock: avail.isLowStock,
        stockUnitsLeft: avail.unitsLeft,
        liveVariants: {
          [itemSku]: {
            ...item,
            price: livePrice,
            priceAed: basePriceAed,
            originalPrice,
            quantity: localQty,
            localQuantity: localQty,
            availability: avail.status,
            availabilityBadge: avail.badgeText,
            isInStock: avail.inStock,
            isLowStock: avail.isLowStock,
            stockUnitsLeft: avail.unitsLeft,
          },
        },
      });
    });

    return [...hydratedStatic, ...customStockProducts];
  }, [liveStockMap, activeCountry, countryCode, isStrictLocalCountry]);

  // Confirmed User Rule #3: Non-HQ country storefronts filter strictly to local country inventory
  const countryStockedCount = useMemo(
    () => allCatalogProducts.filter((p) => p.hasLocalStock).length,
    [allCatalogProducts]
  );

  const products = useMemo(() => {
    if (!isStrictLocalCountry) return allCatalogProducts;
    return allCatalogProducts.filter((p) => p.hasLocalStock);
  }, [allCatalogProducts, isStrictLocalCountry]);

  const getProductBySlug = useCallback(
    (slug) => {
      if (!slug) return null;
      return (
        allCatalogProducts.find((p) => p.slug === slug || String(p.id) === slug) || null
      );
    },
    [allCatalogProducts]
  );

  const getProductBySku = useCallback(
    (sku) => {
      if (!sku) return null;
      return (
        allCatalogProducts.find((p) => p.sku?.toUpperCase() === sku.toUpperCase()) || null
      );
    },
    [allCatalogProducts]
  );

  return (
    <CatalogContext.Provider
      value={{
        products,
        allCatalogProducts,
        countryStockedCount,
        isStrictLocalCountry,
        loading,
        refreshStock,
        getProductBySlug,
        getProductBySku,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
};

export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error("useCatalog must be used within a CatalogProvider");
  }
  return context;
};
