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

const STORAGE_KEY = "eall_inventory_stock";
const COLLECTION_NAME = "product_stock";

// Helper to seed initial stock from existing product catalog with guaranteed unique SKUs
export const getInitialCatalogSeed = () => {
  const seenSkus = new Set();
  const items = [];

  (catalogProducts || []).forEach((p, idx) => {
    if (!p) return;
    const baseSku = (p.sku || `EALL-${(p.brand || "GEN").toUpperCase()}-${p.id || idx + 1}`).trim().toUpperCase();

    let sku = baseSku;
    let counter = 1;
    while (seenSkus.has(sku)) {
      sku = `${baseSku}-${counter}`;
      counter++;
    }
    seenSkus.add(sku);

    const initialPrice = p.price !== undefined && p.price !== null ? Number(p.price) : 0;
    const initialQty = p.quantity !== undefined ? Number(p.quantity) : (p.stock !== undefined ? Number(p.stock) : 0);

    items.push({
      sku,
      name: String(p.name || p.shortName || "Unnamed Product").trim(),
      brand: String(p.brand || "General").trim(),
      category: String(p.categoryName || p.category || "Electronics").trim(),
      image: String(p.image || "/logo.png"),
      quantity: initialQty,
      price: initialPrice,
      costPrice: p.costPrice !== undefined ? Number(p.costPrice) : Math.round(initialPrice * 0.8),
      minAlert: p.minAlert !== undefined ? Number(p.minAlert) : 3,
      updatedAt: new Date().toISOString(),
    });
  });

  return items;
};

const mapDocToStockItem = (data) => ({
  sku: data.sku,
  name: String(data.name || "").trim(),
  brand: String(data.brand || "General").trim(),
  category: String(data.category || "Electronics").trim(),
  image: data.image || "/logo.png",
  quantity: Number(data.quantity) || 0,
  price: Number(data.price) || 0,
  costPrice: Number(data.costPrice ?? data.cost_price ?? 0),
  minAlert: Number(data.minAlert ?? data.min_alert ?? 3),
  updatedAt: data.updatedAt || data.updated_at || new Date().toISOString(),
});

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
 * Update stock quantity directly in Firestore and locally
 */
export const updateStockQuantity = async (sku, newQuantity) => {
  const qty = Math.max(0, parseInt(newQuantity, 10) || 0);
  const db = getFirebaseDb();

  if (db && isFirebaseConfigured()) {
    try {
      const docRef = doc(db, COLLECTION_NAME, sku);
      await setDoc(
        docRef,
        {
          quantity: qty,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn("Firestore quantity update error:", err.message);
    }
  }

  // Always sync local
  const current = getLocalStock();
  const updated = current.map((item) =>
    item.sku === sku
      ? { ...item, quantity: qty, updatedAt: new Date().toISOString() }
      : item
  );
  saveLocalStock(updated);
  return updated;
};

/**
 * Increment or decrement stock by delta (e.g. +5 for restock or -1 for sale)
 */
export const adjustStockDelta = async (sku, delta) => {
  const current = await fetchStock();
  const target = current.find((i) => i.sku === sku);
  if (!target) throw new Error(`Product with SKU ${sku} not found`);

  const newQty = Math.max(0, target.quantity + delta);
  return await updateStockQuantity(sku, newQty);
};

/**
 * Update product details including name, brand, category, price, quantity, cost price, and min alert threshold
 */
export const updateProductDetails = async (
  sku,
  { name, brand, category, price, quantity, costPrice, minAlert }
) => {
  const db = getFirebaseDb();

  if (db && isFirebaseConfigured()) {
    try {
      const updatePayload = {
        updatedAt: new Date().toISOString(),
      };
      if (name !== undefined) updatePayload.name = String(name).trim();
      if (brand !== undefined) updatePayload.brand = String(brand).trim();
      if (category !== undefined) updatePayload.category = String(category).trim();
      if (price !== undefined) updatePayload.price = Number(price);
      if (quantity !== undefined)
        updatePayload.quantity = Math.max(0, parseInt(quantity, 10) || 0);
      if (costPrice !== undefined) updatePayload.costPrice = Number(costPrice);
      if (minAlert !== undefined) updatePayload.minAlert = Number(minAlert);

      const docRef = doc(db, COLLECTION_NAME, sku);
      await setDoc(docRef, updatePayload, { merge: true });
    } catch (err) {
      console.warn("Firestore details update error:", err.message);
    }
  }

  const current = getLocalStock();
  const updated = current.map((item) =>
    item.sku === sku
      ? {
          ...item,
          name: name !== undefined ? String(name).trim() : item.name,
          brand: brand !== undefined ? String(brand).trim() : item.brand,
          category: category !== undefined ? String(category).trim() : item.category,
          price: price !== undefined ? Number(price) : item.price,
          quantity:
            quantity !== undefined
              ? Math.max(0, parseInt(quantity, 10) || 0)
              : item.quantity,
          costPrice: costPrice !== undefined ? Number(costPrice) : item.costPrice,
          minAlert: minAlert !== undefined ? Number(minAlert) : item.minAlert,
          updatedAt: new Date().toISOString(),
        }
      : item
  );
  saveLocalStock(updated);
  return updated;
};

/**
 * Add a new custom product to inventory
 */
export const addCustomProduct = async ({ sku, name, brand, category, quantity, price, minAlert }) => {
  const cleanSku = sku.trim().toUpperCase();
  const newProduct = {
    sku: cleanSku,
    name: name.trim(),
    brand: brand.trim() || "General",
    category: category.trim() || "Electronics",
    image: "/logo.png",
    quantity: Number(quantity) || 0,
    price: Number(price) || 0,
    costPrice: 0,
    minAlert: Number(minAlert) || 3,
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
          name: s.name,
          brand: s.brand,
          category: s.category,
          image: s.image,
          // Preserve existing price, quantity, costPrice if modified
          quantity: existing && existing.quantity !== null && existing.quantity !== undefined ? Number(existing.quantity) : s.quantity,
          price: existing && existing.price !== null && existing.price !== undefined ? Number(existing.price) : s.price,
          costPrice: existing && existing.costPrice !== undefined ? Number(existing.costPrice) : (s.costPrice || 0),
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
  return { added: seed.length, total: seed.length };
};
