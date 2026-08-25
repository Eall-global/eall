import { getSupabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { products as catalogProducts } from "../data/products/index";

const STORAGE_KEY = "eall_inventory_stock";

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

    items.push({
      sku,
      name: String(p.name || p.shortName || "Unnamed Product").trim(),
      brand: String(p.brand || "General").trim(),
      category: String(p.categoryName || p.category || "Electronics").trim(),
      image: String(p.image || "/logo.png"),
      quantity: 15, // Default initial stock units
      price: 999,   // Default selling price in AED
      costPrice: 750,
      minAlert: 3,  // Low stock warning threshold
      updatedAt: new Date().toISOString(),
    });
  });

  return items;
};

const mapDbToStockItem = (item) => ({
  sku: item.sku,
  name: String(item.name || "").trim(),
  brand: String(item.brand || "General").trim(),
  category: String(item.category || "Electronics").trim(),
  image: item.image,
  quantity: Number(item.quantity) || 0,
  price: Number(item.price) || 0,
  costPrice: Number(item.cost_price ?? item.costPrice ?? 0),
  minAlert: Number(item.min_alert ?? item.minAlert ?? 3),
  updatedAt: item.updated_at || item.updatedAt || new Date().toISOString(),
});

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
 * Fetch all stock items (Live from Supabase, with automatic seeding if empty)
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

      // If Supabase table is empty, auto-seed it with the catalog products
      if (!data || data.length === 0) {
        console.log("Supabase product_stock is empty. Seeding catalog...");
        await syncCatalogToStock();
        
        const { data: refreshedData } = await supabase
          .from("product_stock")
          .select("*")
          .order("brand", { ascending: true });

        if (refreshedData && refreshedData.length > 0) {
          const formatted = refreshedData.map(mapDbToStockItem);
          saveLocalStock(formatted);
          return formatted;
        }
      }

      const formatted = data.map(mapDbToStockItem);
      saveLocalStock(formatted);
      return formatted;
    } catch (err) {
      console.warn("Supabase stock fetch warning:", err.message);
    }
  }

  return getLocalStock();
};

/**
 * Update stock quantity directly in Supabase and locally
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
 * Update product details including name, brand, category, price, quantity, cost price, and min alert threshold
 */
export const updateProductDetails = async (
  sku,
  { name, brand, category, price, quantity, costPrice, minAlert }
) => {
  const supabase = getSupabase();

  if (supabase && isSupabaseConfigured()) {
    try {
      const updatePayload = {
        updated_at: new Date().toISOString(),
      };
      if (name !== undefined) updatePayload.name = String(name).trim();
      if (brand !== undefined) updatePayload.brand = String(brand).trim();
      if (category !== undefined) updatePayload.category = String(category).trim();
      if (price !== undefined) updatePayload.price = Number(price);
      if (quantity !== undefined)
        updatePayload.quantity = Math.max(0, parseInt(quantity, 10) || 0);
      if (costPrice !== undefined) updatePayload.cost_price = Number(costPrice);
      if (minAlert !== undefined) updatePayload.min_alert = Number(minAlert);

      const { error } = await supabase
        .from("product_stock")
        .update(updatePayload)
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

  const supabase = getSupabase();
  if (supabase && isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from("product_stock").upsert({
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

      if (error) throw error;
    } catch (e) {
      console.warn("Error adding custom product to Supabase:", e);
      throw e;
    }
  }

  const current = getLocalStock();
  const updated = [newProduct, ...current.filter((i) => i.sku !== cleanSku)];
  saveLocalStock(updated);
  return updated;
};

/**
 * Sync entire catalog into Supabase product_stock table
 */
export const syncCatalogToStock = async () => {
  const seed = getInitialCatalogSeed();
  const supabase = getSupabase();

  if (supabase && isSupabaseConfigured()) {
    try {
      const payload = seed.map((s) => ({
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

      // Insert in chunks of 20 to ensure reliability
      const chunkSize = 20;
      for (let i = 0; i < payload.length; i += chunkSize) {
        const chunk = payload.slice(i, i + chunkSize);
        const { error } = await supabase.from("product_stock").upsert(chunk, {
          onConflict: "sku",
        });
        if (error) throw error;
      }
    } catch (e) {
      console.error("Syncing catalog to Supabase error:", e);
      throw e;
    }
  }

  saveLocalStock(seed);
  return { added: seed.length, total: seed.length };
};
