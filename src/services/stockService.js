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

      // If Supabase table is completely empty, automatically seed it with catalog
      if (!data || data.length === 0) {
        const seed = getInitialCatalogSeed();
        const dbSeed = seed.map((s) => ({
          sku: s.sku,
          name: s.name,
          brand: s.brand,
          category: s.category,
          image: s.image,
          quantity: s.quantity,
          price: s.price,
          cost_price: s.costPrice,
          min_alert: s.minAlert,
          updated_at: s.updatedAt,
        }));

        await supabase.from("product_stock").upsert(dbSeed);
        return seed;
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
          cost_price: Number(costPrice || 0),
          min_alert: Number(minAlert || 3),
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
 * Add a new custom product to inventory
 */
export const addCustomProduct = async ({ sku, name, brand, category, quantity, price, minAlert }) => {
  const newProduct = {
    sku: sku.trim().toUpperCase(),
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

  const supabase = getSupabase();
  if (supabase && isSupabaseConfigured()) {
    try {
      await supabase.from("product_stock").upsert({
        sku: newProduct.sku,
        name: newProduct.name,
        brand: newProduct.brand,
        category: newProduct.category,
        image: newProduct.image,
        quantity: newProduct.quantity,
        price: newProduct.price,
        cost_price: 0,
        min_alert: newProduct.minAlert,
        updated_at: newProduct.updatedAt,
      });
    } catch (e) {
      console.warn("Error adding custom product to Supabase:", e);
    }
  }

  const current = getLocalStock();
  const updated = [newProduct, ...current.filter((i) => i.sku !== newProduct.sku)];
  saveLocalStock(updated);
  return updated;
};

/**
 * Sync catalog to include all catalog items into database
 */
export const syncCatalogToStock = async () => {
  const seed = getInitialCatalogSeed();
  const currentStock = await fetchStock();
  const existingSkus = new Set(currentStock.map((s) => s.sku));

  // Merge seed products with any existing stock updates
  const combined = seed.map((item) => {
    const existing = currentStock.find((s) => s.sku === item.sku);
    return existing || item;
  });

  saveLocalStock(combined);

  const supabase = getSupabase();
  if (supabase && isSupabaseConfigured()) {
    try {
      const dbSeed = combined.map((s) => ({
        sku: s.sku,
        name: s.name,
        brand: s.brand,
        category: s.category,
        image: s.image,
        quantity: s.quantity,
        price: s.price,
        cost_price: s.costPrice || 0,
        min_alert: s.minAlert || 3,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from("product_stock").upsert(dbSeed);
      if (error) throw error;
    } catch (e) {
      console.warn("Syncing to Supabase warning:", e);
      throw e;
    }
  }

  return { added: combined.length, total: combined.length };
};
