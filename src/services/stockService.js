import { getSupabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { products as catalogProducts } from "../data/products/index";

const STORAGE_KEY = "eall_inventory_stock";

// Helper to seed initial stock from existing product catalog
const getInitialCatalogSeed = () => {
  return catalogProducts.map((p, idx) => ({
    sku: p.sku || `EALL-${p.brand?.toUpperCase() || "GEN"}-${p.id || idx + 1}`,
    name: p.name || p.shortName || "Unnamed Product",
    brand: p.brand || "General",
    category: p.categoryName || p.category || "Electronics",
    image: p.image || "/logo.png",
    quantity: 15, // Default initial stock units
    price: 999,   // Default selling price in AED
    costPrice: 750,
    minAlert: 3,  // Low stock warning threshold
    updatedAt: new Date().toISOString(),
  }));
};

// Local storage handlers for offline/sandbox mode
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
 * Fetch all stock items
 */
export const fetchStock = async () => {
  const supabase = getSupabase();

  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from("product_stock")
        .select("*")
        .order("brand", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;

      // If Supabase table is completely empty, seed it with catalog
      if (!data || data.length === 0) {
        const seed = getInitialCatalogSeed();
        const { error: seedError } = await supabase
          .from("product_stock")
          .upsert(seed);
        if (!seedError) return seed;
      }

      return data.map((item) => ({
        sku: item.sku,
        name: item.name,
        brand: item.brand,
        category: item.category,
        image: item.image,
        quantity: Number(item.quantity) || 0,
        price: Number(item.price) || 0,
        costPrice: Number(item.cost_price || item.costPrice) || 0,
        minAlert: Number(item.min_alert || item.minAlert) || 3,
        updatedAt: item.updated_at || item.updatedAt || new Date().toISOString(),
      }));
    } catch (err) {
      console.warn("Supabase fetch failed, falling back to local stock:", err.message);
    }
  }

  return getLocalStock();
};

/**
 * Update stock quantity directly
 */
export const updateStockQuantity = async (sku, newQuantity) => {
  const qty = Math.max(0, parseInt(newQuantity, 10) || 0);
  const supabase = getSupabase();

  if (supabase && isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from("product_stock")
        .update({
          quantity: qty,
          updated_at: new Date().toISOString(),
        })
        .eq("sku", sku);

      if (error) throw error;
    } catch (err) {
      console.warn("Supabase update error:", err.message);
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
 * Update product price and min alert threshold
 */
export const updateProductDetails = async (sku, { price, costPrice, minAlert }) => {
  const supabase = getSupabase();

  if (supabase && isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from("product_stock")
        .update({
          price: Number(price),
          cost_price: Number(costPrice),
          min_alert: Number(minAlert),
          updated_at: new Date().toISOString(),
        })
        .eq("sku", sku);

      if (error) throw error;
    } catch (err) {
      console.warn("Supabase details update error:", err.message);
    }
  }

  const current = getLocalStock();
  const updated = current.map((item) =>
    item.sku === sku
      ? {
          ...item,
          price: price !== undefined ? Number(price) : item.price,
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
 * Sync catalog to include any new items added to static code
 */
export const syncCatalogToStock = async () => {
  const currentStock = await fetchStock();
  const existingSkus = new Set(currentStock.map((s) => s.sku));

  const newItems = catalogProducts
    .filter((p) => {
      const sku = p.sku || `EALL-${p.brand?.toUpperCase() || "GEN"}-${p.id}`;
      return !existingSkus.has(sku);
    })
    .map((p, idx) => ({
      sku: p.sku || `EALL-${p.brand?.toUpperCase() || "GEN"}-${p.id || idx + 1}`,
      name: p.name || p.shortName || "Unnamed Product",
      brand: p.brand || "General",
      category: p.categoryName || p.category || "Electronics",
      image: p.image || "/logo.png",
      quantity: 10,
      price: 999,
      costPrice: 750,
      minAlert: 3,
      updatedAt: new Date().toISOString(),
    }));

  if (newItems.length === 0) {
    return { added: 0, total: currentStock.length };
  }

  const combined = [...currentStock, ...newItems];
  saveLocalStock(combined);

  const supabase = getSupabase();
  if (supabase && isSupabaseConfigured()) {
    try {
      await supabase.from("product_stock").upsert(newItems);
    } catch (e) {
      console.warn("Syncing to Supabase warning:", e);
    }
  }

  return { added: newItems.length, total: combined.length };
};
