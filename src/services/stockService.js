import {
  getFirebaseDb,
  isFirebaseConfigured,
  collection,
  doc,
  getDocs,
  setDoc,
  onSnapshot,
  writeBatch,
} from "../lib/firebaseClient";
import { products as catalogProducts } from "../data/products/index";
import { expandToFlatSkus } from "../utils/productVariant";
import { logAuditEvent } from "./auditService";
import {
  DEFAULT_LOCATIONS,
  convertAedToLocalPrice,
} from "../config/locationsConfig";

const STORAGE_KEY = "eall_inventory_stock";
const COLLECTION_NAME = "product_stock";

/**
 * Sanitize a SKU so it is ALWAYS a valid Firestore document ID
 * (Firestore forbids forward slashes "/" and bare "." / ".." as document IDs).
 */
export const sanitizeSkuId = (rawSku = "") => {
  const cleaned = String(rawSku || "")
    .trim()
    .toUpperCase()
    .replace(/[\\/]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^A-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
  return cleaned || `SKU-${Date.now()}`;
};

/**
 * Normalize per-location stock entry for any warehouse/country code (AE, CN, HK, KE, SN, etc.)
 * Backward-compatible with legacy root fields on AE (Dubai Main Hub).
 */
export const getLocationStockEntry = (item, locationCode = "AE") => {
  const code = String(locationCode || "AE").toUpperCase();
  const raw = item?.locations?.[code];

  if (code === "AE") {
    return {
      quantity:
        raw?.quantity !== undefined
          ? Math.max(0, Number(raw.quantity) || 0)
          : Math.max(0, Number(item?.quantity) || 0),
      inTransitIn: Math.max(0, Number(raw?.inTransitIn) || 0),
      priceLocal:
        Number(raw?.priceLocal) > 0
          ? Number(raw.priceLocal)
          : Number(item?.price) || 0,
      costLocal:
        Number(raw?.costLocal) > 0
          ? Number(raw.costLocal)
          : Number(item?.costPrice) || 0,
      minAlert:
        raw?.minAlert !== undefined
          ? Number(raw.minAlert)
          : Number(item?.minAlert ?? 3),
      active: raw?.active !== false,
    };
  }

  return {
    quantity: raw?.quantity !== undefined ? Math.max(0, Number(raw.quantity) || 0) : 0,
    inTransitIn: Math.max(0, Number(raw?.inTransitIn) || 0),
    priceLocal: Number(raw?.priceLocal) > 0 ? Number(raw.priceLocal) : 0,
    costLocal: Number(raw?.costLocal) > 0 ? Number(raw.costLocal) : 0,
    minAlert:
      raw?.minAlert !== undefined
        ? Number(raw.minAlert)
        : Number(item?.minAlert ?? 3),
    active: raw?.active !== false,
  };
};

/**
 * Read-only Tier-1 Supply Hub inventory summary (Dubai AE, China CN, Hong Kong HK)
 * shown to country salespeople so they know what can be requested for transfer.
 */
export const getSupplyHubTotals = (item) => {
  const AE = getLocationStockEntry(item, "AE").quantity;
  const CN = getLocationStockEntry(item, "CN").quantity;
  const HK = getLocationStockEntry(item, "HK").quantity;
  return { AE, CN, HK, total: AE + CN + HK };
};

/**
 * Project global stock list into a specific warehouse/country view (e.g., KE in KES, CN in USD, AE in AED)
 */
export const projectStockForLocation = (
  stockList = [],
  locationCode = "AE",
  locationConfig = null
) => {
  const code = String(locationCode || "AE").toUpperCase();
  const cfg =
    locationConfig ||
    DEFAULT_LOCATIONS.find((l) => l.code === code) ||
    DEFAULT_LOCATIONS[0];

  return (stockList || []).map((item) => {
    const loc = getLocationStockEntry(item, code);
    const supplyHubStock = getSupplyHubTotals(item);
    const priceAed = Number(item.price) || 0;
    const costAed = Number(item.costPrice) || 0;

    if (code === "ALL") {
      // Aggregate across all locations in the map (plus AE fallback)
      const locKeys = new Set(["AE", "CN", "HK", ...Object.keys(item.locations || {})]);
      let totalQty = 0;
      let totalInTransit = 0;
      locKeys.forEach((k) => {
        const entry = getLocationStockEntry(item, k);
        totalQty += entry.quantity;
        totalInTransit += entry.inTransitIn;
      });
      return {
        ...item,
        locationCode: "ALL",
        quantity: totalQty,
        inTransitIn: totalInTransit,
        priceAed,
        costPriceAed: costAed,
        supplyHubStock,
        currency: "AED",
        currencySymbol: "AED",
      };
    }

    const resolvedLocalPrice =
      code === "AE"
        ? loc.priceLocal || priceAed
        : convertAedToLocalPrice(priceAed, cfg, loc.priceLocal);
    const resolvedLocalCost =
      loc.costLocal > 0
        ? loc.costLocal
        : code === "AE"
        ? costAed
        : convertAedToLocalPrice(costAed, cfg, 0);

    return {
      ...item,
      locationCode: code,
      quantity: loc.quantity,
      inTransitIn: loc.inTransitIn,
      price: resolvedLocalPrice,
      costPrice: resolvedLocalCost,
      margin: Math.max(0, resolvedLocalPrice - resolvedLocalCost),
      minAlert: loc.minAlert,
      hasExplicitLocalPrice: code !== "AE" && loc.priceLocal > 0,
      priceAed,
      costPriceAed: costAed,
      supplyHubStock,
      currency: cfg.currency || "AED",
      currencySymbol: cfg.currencySymbol || cfg.currency || "AED",
    };
  });
};

// Helper to seed initial stock from existing product catalog.
// Products with color variants and/or storage options are expanded into
// individual SKU rows (one row per color × storage combination).
export const getInitialCatalogSeed = () => {
  const seenSkus = new Set();
  const items = [];

  (catalogProducts || []).forEach((p, idx) => {
    if (!p) return;
    const baseSku = (p.sku || `EALL-${(p.brand || "GEN").toUpperCase()}-${p.id || idx + 1}`).trim().toUpperCase();

    // Expand product into flat SKU rows (color × storage combinations)
    const rows = expandToFlatSkus({ ...p, sku: baseSku });

    rows.forEach((row) => {
      let sku = row.sku;
      let counter = 1;
      while (seenSkus.has(sku)) {
        sku = `${row.sku}-${counter}`;
        counter++;
      }
      seenSkus.add(sku);

      // Determine base price for this variant
      let basePrice = 0;
      if (row.storage && p.storagePricing?.[row.storage]) {
        basePrice = Number(p.storagePricing[row.storage]);
      } else if (p.price !== undefined && p.price !== null) {
        basePrice = Number(p.price);
      }

      const initialQty = p.quantity !== undefined ? Number(p.quantity) : (p.stock !== undefined ? Number(p.stock) : 0);
      const initialCost = p.costPrice !== undefined ? Number(p.costPrice) : Math.round(basePrice * 0.8);
      const initialMargin = p.margin !== undefined ? Number(p.margin) : Math.max(0, basePrice - initialCost);
      const initialOriginalPrice = p.originalPrice !== undefined ? Number(p.originalPrice) : (basePrice > 0 ? Math.round(basePrice * 1.1) : 0);

      // Derive a human-readable name from color + storage
      const suffix = [row.color, row.storage].filter(Boolean).join(" / ");
      const name = suffix
        ? `${String(p.name || p.shortName || "Unnamed Product").trim()} (${suffix})`
        : String(p.name || p.shortName || "Unnamed Product").trim();

      items.push({
        sku,
        // Parent product identifiers
        parentSku: baseSku,
        slug: p.slug || "",
        name,
        brand: String(p.brand || "General").trim(),
        category: String(p.categoryName || p.category || "Electronics").trim(),
        image: String(row.image || p.image || "/logo.png"),
        // Variant dimensions
        color: row.color || null,
        colorSlug: row.colorSlug || null,
        storage: row.storage || null,
        // Inventory
        quantity: initialQty,
        costPrice: initialCost,
        margin: initialMargin,
        price: basePrice > 0 ? basePrice : (initialCost + initialMargin),
        originalPrice: initialOriginalPrice,
        minAlert: p.minAlert !== undefined ? Number(p.minAlert) : 3,
        updatedAt: new Date().toISOString(),
      });
    });
  });

  return items;
};


const mapDocToStockItem = (data) => {
  const costPrice = Number(data.costPrice ?? data.cost_price ?? 0);
  const margin = Number(data.margin ?? 0);
  const price = data.price !== undefined && data.price !== null ? Number(data.price) : (costPrice + margin);
  const originalPrice = Number(data.originalPrice ?? data.original_price ?? data.listPrice ?? 0);
  const rootQty = Number(data.quantity) || 0;
  const minAlert = Number(data.minAlert ?? data.min_alert ?? 3);

  // Preserve multi-warehouse locations map and keep AE synced with legacy root fields
  const rawLocations =
    data.locations && typeof data.locations === "object" ? { ...data.locations } : {};
  const normalizedLocations = {};
  Object.entries(rawLocations).forEach(([locKey, locVal]) => {
    if (!locVal || typeof locVal !== "object") return;
    const upperKey = String(locKey).trim().toUpperCase();
    normalizedLocations[upperKey] = {
      quantity: Math.max(0, Number(locVal.quantity) || 0),
      inTransitIn: Math.max(0, Number(locVal.inTransitIn) || 0),
      priceLocal: Number(locVal.priceLocal) || 0,
      costLocal: Number(locVal.costLocal) || 0,
      minAlert: locVal.minAlert !== undefined ? Number(locVal.minAlert) : minAlert,
      active: locVal.active !== false,
    };
  });

  if (!normalizedLocations.AE) {
    normalizedLocations.AE = {
      quantity: rootQty,
      inTransitIn: 0,
      priceLocal: price,
      costLocal: costPrice,
      minAlert,
      active: true,
    };
  }

  return {
    sku: data.sku,
    parentSku: data.parentSku || data.sku,
    slug: data.slug || "",
    name: String(data.name || "").trim(),
    brand: String(data.brand || "General").trim(),
    category: String(data.category || "Electronics").trim(),
    image: data.image || "/logo.png",
    // Variant dimensions
    color: data.color || null,
    colorSlug: data.colorSlug || null,
    storage: data.storage || null,
    // Inventory (legacy AE root fields + multi-warehouse locations map)
    quantity: normalizedLocations.AE.quantity,
    costPrice,
    margin,
    price,
    originalPrice,
    minAlert,
    locations: normalizedLocations,
    updatedAt: data.updatedAt || data.updated_at || new Date().toISOString(),
  };
};


// Local storage handlers for offline fallback
const getLocalStock = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = getInitialCatalogSeed();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read local stock:", err);
    return getInitialCatalogSeed();
  }
};

const saveLocalStock = (stockList) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stockList));
  } catch (err) {
    console.error("Failed to save local stock:", err);
  }
};

/**
 * Fetch all stock items (Live from Google Firebase Firestore, with automatic seeding if empty)
 */
export const fetchStock = async () => {
  const db = getFirebaseDb();

  if (db && isFirebaseConfigured()) {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));

      // If Firestore collection is empty, auto-seed it with the catalog products
      if (snapshot.empty) {
        console.log("Firestore product_stock collection is empty. Seeding catalog...");
        await syncCatalogToStock();

        const refreshedSnapshot = await getDocs(collection(db, COLLECTION_NAME));
        const formatted = [];
        refreshedSnapshot.forEach((docSnap) => {
          formatted.push(mapDocToStockItem(docSnap.data()));
        });

        if (formatted.length > 0) {
          formatted.sort((a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name));
          saveLocalStock(formatted);
          return formatted;
        }
      }

      const formatted = [];
      snapshot.forEach((docSnap) => {
        formatted.push(mapDocToStockItem(docSnap.data()));
      });

      formatted.sort((a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name));
      saveLocalStock(formatted);
      return formatted;
    } catch (err) {
      console.warn("Firestore stock fetch warning:", err.message);
    }
  }

  return getLocalStock();
};

/**
 * Real-time stock subscription via Firestore onSnapshot (Unlimited connections)
 */
export const subscribeToStock = (callback) => {
  const db = getFirebaseDb();
  if (!db || !isFirebaseConfigured()) return () => {};

  try {
    const unsubscribe = onSnapshot(
      collection(db, COLLECTION_NAME),
      (snapshot) => {
        if (!snapshot.empty) {
          const formatted = [];
          snapshot.forEach((docSnap) => {
            formatted.push(mapDocToStockItem(docSnap.data()));
          });
          formatted.sort((a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name));
          saveLocalStock(formatted);
          callback(formatted);
        }
      },
      (error) => {
        console.warn("Firestore stock onSnapshot warning:", error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn("Could not subscribe to Firestore stock:", err);
    return () => {};
  }
};

/**
 * Update stock quantity directly in Firestore and locally for a specific hub/country code.
 * Defaults to "AE" (Dubai Main Hub) for full backward compatibility.
 */
export const updateStockQuantity = async (sku, newQuantity, locationCode = "AE") => {
  const code = String(locationCode || "AE").toUpperCase();
  const qty = Math.max(0, parseInt(newQuantity, 10) || 0);
  const now = new Date().toISOString();
  const db = getFirebaseDb();

  const current = getLocalStock();
  const existing = current.find((item) => item.sku === sku);
  const prevLocations = existing?.locations ? { ...existing.locations } : {};
  const prevLocEntry = getLocationStockEntry(existing, code);
  const nextLocations = {
    ...prevLocations,
    [code]: {
      ...prevLocEntry,
      quantity: qty,
    },
  };

  if (db && isFirebaseConfigured()) {
    try {
      const docRef = doc(db, COLLECTION_NAME, sku);
      const payload = {
        locations: {
          [code]: {
            ...prevLocEntry,
            quantity: qty,
          },
        },
        updatedAt: now,
      };
      if (code === "AE") {
        payload.quantity = qty;
      }
      await setDoc(docRef, payload, { merge: true });
    } catch (err) {
      console.warn("Firestore quantity update error:", err.message);
    }
  }

  // Always sync local
  const updated = current.map((item) =>
    item.sku === sku
      ? {
          ...item,
          quantity: code === "AE" ? qty : item.quantity,
          locations: nextLocations,
          updatedAt: now,
        }
      : item
  );
  saveLocalStock(updated);
  return updated;
};

/**
 * Update multi-warehouse location fields (quantity, inTransitIn, priceLocal, costLocal, minAlert)
 */
export const updateLocationStock = async (
  sku,
  locationCode = "AE",
  { quantity, inTransitIn, priceLocal, costLocal, minAlert, skipAudit = false } = {}
) => {
  const code = String(locationCode || "AE").toUpperCase();
  const now = new Date().toISOString();
  const db = getFirebaseDb();

  const current = getLocalStock();
  const existing = current.find((item) => item.sku === sku);
  const prevEntry = getLocationStockEntry(existing, code);

  const nextEntry = {
    quantity:
      quantity !== undefined ? Math.max(0, parseInt(quantity, 10) || 0) : prevEntry.quantity,
    inTransitIn:
      inTransitIn !== undefined
        ? Math.max(0, parseInt(inTransitIn, 10) || 0)
        : prevEntry.inTransitIn,
    priceLocal: priceLocal !== undefined ? Math.max(0, Number(priceLocal) || 0) : prevEntry.priceLocal,
    costLocal: costLocal !== undefined ? Math.max(0, Number(costLocal) || 0) : prevEntry.costLocal,
    minAlert: minAlert !== undefined ? Math.max(0, Number(minAlert) || 0) : prevEntry.minAlert,
    active: true,
  };

  const payload = {
    locations: {
      [code]: nextEntry,
    },
    updatedAt: now,
  };

  if (code === "AE") {
    payload.quantity = nextEntry.quantity;
    if (priceLocal !== undefined && nextEntry.priceLocal > 0) payload.price = nextEntry.priceLocal;
    if (costLocal !== undefined && nextEntry.costLocal > 0) payload.costPrice = nextEntry.costLocal;
    if (minAlert !== undefined) payload.minAlert = nextEntry.minAlert;
  }

  if (db && isFirebaseConfigured()) {
    try {
      await setDoc(doc(db, COLLECTION_NAME, sku), payload, { merge: true });
    } catch (err) {
      console.warn("Firestore location stock update error:", err.message);
    }
  }

  const updated = current.map((item) => {
    if (item.sku !== sku) return item;
    const nextLocations = { ...(item.locations || {}), [code]: nextEntry };
    return {
      ...item,
      quantity: code === "AE" ? nextEntry.quantity : item.quantity,
      price: code === "AE" && nextEntry.priceLocal > 0 ? nextEntry.priceLocal : item.price,
      costPrice: code === "AE" && nextEntry.costLocal > 0 ? nextEntry.costLocal : item.costPrice,
      minAlert: code === "AE" ? nextEntry.minAlert : item.minAlert,
      locations: nextLocations,
      updatedAt: now,
    };
  });
  saveLocalStock(updated);

  if (!skipAudit && existing) {
    const changes = [];
    if (prevEntry.quantity !== nextEntry.quantity) {
      changes.push({
        field: `[${code}] Quantity`,
        before: `${prevEntry.quantity} units`,
        after: `${nextEntry.quantity} units`,
      });
    }
    if (prevEntry.priceLocal !== nextEntry.priceLocal) {
      changes.push({
        field: `[${code}] Local Price`,
        before: prevEntry.priceLocal || "Auto FX",
        after: nextEntry.priceLocal || "Auto FX",
      });
    }
    if (prevEntry.costLocal !== nextEntry.costLocal) {
      changes.push({
        field: `[${code}] Landed Cost`,
        before: prevEntry.costLocal || "—",
        after: nextEntry.costLocal || "—",
      });
    }
    if (changes.length > 0) {
      logAuditEvent({
        module: "stock",
        action: "update",
        severity: "warning",
        targetId: sku,
        targetLabel: `[${code}] ${existing.name || sku}`,
        summary: `Updated [${code}] warehouse stock for ${existing.name || sku}`,
        changes,
      });
    }
  }

  return updated;
};

/**
 * Increment or decrement stock by delta at a specific locationCode (default "AE")
 */
export const adjustStockDelta = async (sku, delta, locationCode = "AE") => {
  const code = String(locationCode || "AE").toUpperCase();
  const current = await fetchStock();
  const target = current.find((i) => i.sku === sku);
  if (!target) throw new Error(`Product with SKU ${sku} not found`);

  const locEntry = getLocationStockEntry(target, code);
  const newQty = Math.max(0, locEntry.quantity + Number(delta || 0));
  return await updateStockQuantity(sku, newQty, code);
};

/**
 * Update product details including name, brand, category, price, quantity, cost price, margin, originalPrice, minAlert, and image
 */
export const updateProductDetails = async (
  sku,
  { name, brand, category, price, quantity, costPrice, margin, originalPrice, minAlert, image, skipAudit = false }
) => {
  const db = getFirebaseDb();
  const current = getLocalStock();
  const previous = current.find((item) => item.sku === sku);

  const cPrice = costPrice !== undefined ? Number(costPrice) : undefined;
  const mMargin = margin !== undefined ? Number(margin) : undefined;
  let sPrice = price !== undefined ? Number(price) : undefined;

  // Auto-reconcile selling price if costPrice and margin are provided
  if (cPrice !== undefined && mMargin !== undefined && price === undefined) {
    sPrice = cPrice + mMargin;
  }

  if (db && isFirebaseConfigured()) {
    try {
      const updatePayload = {
        updatedAt: new Date().toISOString(),
      };
      if (name !== undefined) updatePayload.name = String(name).trim();
      if (brand !== undefined) updatePayload.brand = String(brand).trim();
      if (category !== undefined) updatePayload.category = String(category).trim();
      if (image !== undefined) updatePayload.image = String(image).trim();
      if (cPrice !== undefined) updatePayload.costPrice = cPrice;
      if (mMargin !== undefined) updatePayload.margin = mMargin;
      if (sPrice !== undefined) updatePayload.price = sPrice;
      if (originalPrice !== undefined) updatePayload.originalPrice = Number(originalPrice);
      if (quantity !== undefined)
        updatePayload.quantity = Math.max(0, parseInt(quantity, 10) || 0);
      if (minAlert !== undefined) updatePayload.minAlert = Number(minAlert);

      // Keep locations.AE mirror synchronized with root AE fields
      const prevAe = getLocationStockEntry(previous, "AE");
      updatePayload.locations = {
        AE: {
          ...prevAe,
          quantity:
            quantity !== undefined
              ? Math.max(0, parseInt(quantity, 10) || 0)
              : prevAe.quantity,
          priceLocal: sPrice !== undefined ? sPrice : prevAe.priceLocal,
          costLocal: cPrice !== undefined ? cPrice : prevAe.costLocal,
          minAlert: minAlert !== undefined ? Number(minAlert) : prevAe.minAlert,
        },
      };

      const docRef = doc(db, COLLECTION_NAME, sku);
      await setDoc(docRef, updatePayload, { merge: true });
    } catch (err) {
      console.warn("Firestore details update error:", err.message);
    }
  }

  const updated = current.map((item) => {
    if (item.sku !== sku) return item;
    const nextQty =
      quantity !== undefined
        ? Math.max(0, parseInt(quantity, 10) || 0)
        : item.quantity;
    const nextCost = cPrice !== undefined ? cPrice : item.costPrice || 0;
    const nextMargin = mMargin !== undefined ? mMargin : item.margin || 0;
    const nextPrice =
      sPrice !== undefined
        ? sPrice
        : cPrice !== undefined && mMargin !== undefined
        ? cPrice + mMargin
        : item.price;
    const nextAlert = minAlert !== undefined ? Number(minAlert) : item.minAlert;
    const prevAe = getLocationStockEntry(item, "AE");
    return {
      ...item,
      name: name !== undefined ? String(name).trim() : item.name,
      brand: brand !== undefined ? String(brand).trim() : item.brand,
      category: category !== undefined ? String(category).trim() : item.category,
      image: image !== undefined ? String(image).trim() : item.image,
      costPrice: nextCost,
      margin: nextMargin,
      price: nextPrice,
      originalPrice:
        originalPrice !== undefined ? Number(originalPrice) : item.originalPrice ?? 0,
      quantity: nextQty,
      minAlert: nextAlert,
      locations: {
        ...(item.locations || {}),
        AE: {
          ...prevAe,
          quantity: nextQty,
          priceLocal: nextPrice,
          costLocal: nextCost,
          minAlert: nextAlert,
        },
      },
      updatedAt: new Date().toISOString(),
    };
  });
  saveLocalStock(updated);

  if (!skipAudit && previous) {
    const nextItem = updated.find((i) => i.sku === sku);
    const changes = [];
    if (nextItem) {
      if (previous.name !== nextItem.name) {
        changes.push({ field: "Product Name", before: previous.name, after: nextItem.name });
      }
      if (Number(previous.costPrice || 0) !== Number(nextItem.costPrice || 0)) {
        changes.push({ field: "Cost Price", before: `AED ${Number(previous.costPrice || 0).toFixed(2)}`, after: `AED ${Number(nextItem.costPrice || 0).toFixed(2)}` });
      }
      if (Number(previous.margin || 0) !== Number(nextItem.margin || 0)) {
        changes.push({ field: "Margin", before: `AED ${Number(previous.margin || 0).toFixed(2)}`, after: `AED ${Number(nextItem.margin || 0).toFixed(2)}` });
      }
      if (Number(previous.price || 0) !== Number(nextItem.price || 0)) {
        changes.push({ field: "Selling Price", before: `AED ${Number(previous.price || 0).toFixed(2)}`, after: `AED ${Number(nextItem.price || 0).toFixed(2)}` });
      }
      if (Number(previous.quantity || 0) !== Number(nextItem.quantity || 0)) {
        changes.push({ field: "Stock Quantity", before: `${previous.quantity} units`, after: `${nextItem.quantity} units` });
      }
      if (Number(previous.minAlert || 3) !== Number(nextItem.minAlert || 3)) {
        changes.push({ field: "Min Alert", before: previous.minAlert, after: nextItem.minAlert });
      }
    }

    if (changes.length > 0) {
      const sensitive = changes.some((c) =>
        ["Selling Price", "Cost Price", "Stock Quantity"].includes(c.field)
      );
      logAuditEvent({
        module: "stock",
        action: "update",
        severity: sensitive ? "warning" : "info",
        targetId: sku,
        targetLabel: nextItem?.name || sku,
        summary: `Updated ${nextItem?.name || sku} (${changes.map((c) => c.field).join(", ")})`,
        changes,
      });
    }
  }

  return updated;
};

/**
 * Add a new custom product to inventory. Initial quantity is 0 because stock enters through procurement.
 */
export const addCustomProduct = async ({
  sku,
  name,
  brand,
  category,
  image,
  quantity = 0,
  costPrice = 0,
  margin = 0,
  price,
  originalPrice = 0,
  minAlert = 3,
}) => {
  const cleanSku = sanitizeSkuId(sku);
  const qty = Math.max(0, Number(quantity) || 0);
  const cPrice = Number.isFinite(Number(costPrice)) ? Number(costPrice) : 0;
  const mMargin = Number.isFinite(Number(margin)) ? Number(margin) : 0;
  const sPrice =
    price !== undefined && Number.isFinite(Number(price))
      ? Number(price)
      : cPrice + mMargin;
  const prodImage = (image && String(image).trim()) || "/logo.png";
  const safeAlert = Number.isFinite(Number(minAlert)) ? Number(minAlert) : 3;

  const newProduct = {
    sku: cleanSku,
    name: String(name || cleanSku).trim(),
    brand: String(brand || "General").trim() || "General",
    category: String(category || "Electronics").trim() || "Electronics",
    image: prodImage,
    quantity: qty,
    costPrice: cPrice,
    margin: mMargin,
    price: sPrice,
    originalPrice: Number.isFinite(Number(originalPrice)) ? Number(originalPrice) : 0,
    minAlert: safeAlert,
    locations: {
      AE: {
        quantity: qty,
        inTransitIn: 0,
        priceLocal: sPrice,
        costLocal: cPrice,
        minAlert: safeAlert,
        active: true,
      },
    },
    updatedAt: new Date().toISOString(),
  };

  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      const docRef = doc(db, COLLECTION_NAME, cleanSku);
      await setDoc(docRef, newProduct, { merge: true });
    } catch (e) {
      console.warn("Error adding custom product to Firestore:", e);
      throw e;
    }
  }

  const current = getLocalStock();
  const updated = [newProduct, ...current.filter((i) => i.sku !== cleanSku)];
  saveLocalStock(updated);

  logAuditEvent({
    module: "stock",
    action: "create",
    severity: "info",
    targetId: cleanSku,
    targetLabel: newProduct.name,
    summary: `Added custom SKU ${cleanSku} (${newProduct.brand} • AED ${sPrice.toFixed(2)})`,
    changes: [
      { field: "Cost Price", before: "—", after: `AED ${cPrice.toFixed(2)}` },
      { field: "Selling Price", before: "—", after: `AED ${sPrice.toFixed(2)}` },
    ],
  });

  return updated;
};

/**
 * Sync entire catalog into Google Firestore product_stock collection using atomic writeBatch
 */
export const syncCatalogToStock = async () => {
  const seed = getInitialCatalogSeed();
  const db = getFirebaseDb();

  if (db && isFirebaseConfigured()) {
    try {
      // Fetch existing Firestore documents to PRESERVE user customizations!
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      const existingMap = new Map();
      snapshot.forEach((d) => {
        existingMap.set(d.id, d.data());
      });

      // Firestore batches support up to 500 operations per batch
      const batch = writeBatch(db);

      seed.forEach((s) => {
        const existing = existingMap.get(s.sku);
        const docRef = doc(db, COLLECTION_NAME, s.sku);

        const payload = {
          sku: s.sku,
          parentSku: s.parentSku || s.sku,
          slug: s.slug || "",
          name: s.name,
          brand: s.brand,
          category: s.category,
          image: s.image,
          // Variant dimensions
          color: s.color || null,
          colorSlug: s.colorSlug || null,
          storage: s.storage || null,
          // Preserve existing quantity, costPrice, margin, price, originalPrice
          quantity: existing && existing.quantity !== null && existing.quantity !== undefined ? Number(existing.quantity) : s.quantity,
          costPrice: existing && existing.costPrice !== undefined ? Number(existing.costPrice) : (s.costPrice || 0),
          margin: existing && existing.margin !== undefined ? Number(existing.margin) : (s.margin || Math.max(0, s.price - (s.costPrice || 0))),
          price: existing && existing.price !== null && existing.price !== undefined ? Number(existing.price) : s.price,
          originalPrice: existing && existing.originalPrice !== undefined ? Number(existing.originalPrice) : (s.originalPrice || 0),
          minAlert: existing && existing.minAlert !== undefined ? Number(existing.minAlert) : (s.minAlert || 3),
          updatedAt: new Date().toISOString(),
        };

        batch.set(docRef, payload, { merge: true });
      });

      await batch.commit();
      console.log(`Successfully synced ${seed.length} products to Google Firebase Firestore!`);
    } catch (e) {
      console.error("Syncing catalog to Firestore error:", e);
      throw e;
    }
  }

  saveLocalStock(seed);
  logAuditEvent({
    module: "stock",
    action: "sync",
    severity: "info",
    targetId: "catalog_sync",
    targetLabel: "Catalog Sync",
    summary: `Synchronized ${seed.length} catalog SKUs to stock database`,
  });
  return { added: seed.length, total: seed.length, synced: seed.length, success: true };
};
