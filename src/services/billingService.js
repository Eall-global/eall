import { getSupabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { fetchStock, updateStockQuantity, adjustStockDelta } from "./stockService";

const INVOICES_STORAGE_KEY = "eall_billing_invoices";

const getLocalInvoices = () => {
  try {
    const raw = localStorage.getItem(INVOICES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to read local invoices:", err);
    return [];
  }
};

const saveLocalInvoices = (invoices) => {
  try {
    localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoices));
  } catch (err) {
    console.error("Failed to save local invoices:", err);
  }
};

/**
 * Generate standard sequential invoice number
 */
export const generateInvoiceNumber = (existingCount = 0) => {
  const year = new Date().getFullYear();
  const seq = String(1001 + existingCount).padStart(4, "0");
  return `INV-${year}-${seq}`;
};

/**
 * Fetch all invoices
 */
export const fetchInvoices = async () => {
  const supabase = getSupabase();

  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        const formatted = data.map((inv) => ({
          id: inv.id || inv.invoice_no,
          invoiceNo: inv.invoice_no,
          customerName: inv.customer_name,
          customerPhone: inv.customer_phone,
          customerEmail: inv.customer_email || "",
          customerTrn: inv.customer_trn || "",
          paymentMethod: inv.payment_method || "Cash",
          items: typeof inv.items === "string" ? JSON.parse(inv.items) : (inv.items || []),
          subtotal: Number(inv.subtotal) || 0,
          vatRate: Number(inv.vat_rate ?? 5),
          vatAmount: Number(inv.vat_amount) || 0,
          discount: Number(inv.discount) || 0,
          totalAmount: Number(inv.total_amount) || 0,
          createdBy: inv.created_by || "Staff",
          role: inv.role || "Salesperson",
          notes: inv.notes || "",
          createdAt: inv.created_at || new Date().toISOString(),
          updatedAt: inv.updated_at || null,
          updatedBy: inv.updated_by || null,
        }));
        saveLocalInvoices(formatted);
        return formatted;
      }
    } catch (err) {
      console.warn("Supabase invoices fetch failed, using local:", err.message);
    }
  }

  return getLocalInvoices();
};

/**
 * Create a new invoice and automatically deduct stock
 */
export const createInvoice = async ({
  customerName,
  customerPhone,
  customerEmail = "",
  customerTrn = "",
  paymentMethod = "Cash",
  items, // array of { sku, name, brand, quantity, unitPrice, total }
  vatRate = 5,
  discount = 0,
  notes = "",
  createdBy = "Salesperson",
  role = "sales",
}) => {
  if (!items || items.length === 0) {
    throw new Error("Invoice must contain at least one product item");
  }

  // 1. Verify stock availability
  const currentStock = await fetchStock();
  const stockMap = new Map(currentStock.map((s) => [s.sku, s]));

  for (const item of items) {
    const stockItem = stockMap.get(item.sku);
    if (!stockItem) {
      throw new Error(`Product ${item.name} (${item.sku}) is not in inventory`);
    }
    if (stockItem.quantity < item.quantity) {
      throw new Error(
        `Insufficient stock for "${item.name}". Requested: ${item.quantity}, Available: ${stockItem.quantity}`
      );
    }
  }

  // 2. Compute totals
  const subtotal = items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  const discountedSubtotal = Math.max(0, subtotal - (Number(discount) || 0));
  const vatAmount = (discountedSubtotal * Number(vatRate)) / 100;
  const totalAmount = discountedSubtotal + vatAmount;

  // 3. Generate invoice number
  const allInvoices = await fetchInvoices();
  const invoiceNo = generateInvoiceNumber(allInvoices.length);
  const now = new Date().toISOString();

  const newInvoice = {
    id: invoiceNo,
    invoiceNo,
    customerName: customerName.trim(),
    customerPhone: customerPhone.trim(),
    customerEmail: customerEmail.trim(),
    customerTrn: customerTrn.trim(),
    paymentMethod,
    items,
    subtotal,
    vatRate: Number(vatRate),
    vatAmount,
    discount: Number(discount) || 0,
    totalAmount,
    createdBy,
    role,
    notes: notes.trim(),
    createdAt: now,
  };

  // 4. Deduct stock for all items
  for (const item of items) {
    const currentQty = stockMap.get(item.sku)?.quantity || 0;
    const newQty = Math.max(0, currentQty - item.quantity);
    await updateStockQuantity(item.sku, newQty);
  }

  // 5. Save invoice to Supabase if configured
  const supabase = getSupabase();
  if (supabase && isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from("invoices").insert({
        invoice_no: invoiceNo,
        customer_name: newInvoice.customerName,
        customer_phone: newInvoice.customerPhone,
        customer_email: newInvoice.customerEmail,
        customer_trn: newInvoice.customerTrn,
        payment_method: newInvoice.paymentMethod,
        items: newInvoice.items,
        subtotal: newInvoice.subtotal,
        vat_rate: newInvoice.vatRate,
        vat_amount: newInvoice.vatAmount,
        discount: newInvoice.discount,
        total_amount: newInvoice.totalAmount,
        created_by: newInvoice.createdBy,
        role: newInvoice.role,
        notes: newInvoice.notes,
        created_at: now,
      });

      if (error) {
        console.warn("Supabase invoice insert error:", error);
      }
    } catch (err) {
      console.warn("Supabase insert failed:", err.message);
    }
  }

  // Always save to local fallback
  const localList = getLocalInvoices();
  const updatedLocal = [newInvoice, ...localList];
  saveLocalInvoices(updatedLocal);

  return newInvoice;
};

/**
 * ✏️ Update an existing invoice and reconcile inventory stock deltas
 */
export const updateInvoice = async (invoiceNo, {
  customerName,
  customerPhone,
  customerEmail,
  customerTrn,
  paymentMethod,
  items,
  vatRate = 5,
  discount = 0,
  notes,
  updatedBy = "Staff",
}) => {
  const allInvoices = await fetchInvoices();
  const existing = allInvoices.find((i) => i.invoiceNo === invoiceNo);
  if (!existing) throw new Error(`Invoice ${invoiceNo} not found`);

  // 1. Calculate stock difference (Delta reconciliation)
  // Old items map: { sku: qty }
  const oldItemsMap = new Map((existing.items || []).map((i) => [i.sku, i.quantity]));
  // New items map: { sku: qty }
  const newItemsMap = new Map((items || []).map((i) => [i.sku, i.quantity]));

  const allSkus = new Set([...oldItemsMap.keys(), ...newItemsMap.keys()]);
  const currentStock = await fetchStock();
  const stockMap = new Map(currentStock.map((s) => [s.sku, s]));

  // Check if we have enough stock for any increased quantities
  for (const sku of allSkus) {
    const oldQty = oldItemsMap.get(sku) || 0;
    const newQty = newItemsMap.get(sku) || 0;
    const diff = newQty - oldQty; // If positive, we need more stock; if negative, return stock

    if (diff > 0) {
      const stockItem = stockMap.get(sku);
      if (!stockItem || stockItem.quantity < diff) {
        throw new Error(`Insufficient stock for product ${sku} to increase quantity by ${diff}`);
      }
    }
  }

  // Apply stock adjustments: newQty - oldQty deducted from stock (or restored if diff < 0)
  for (const sku of allSkus) {
    const oldQty = oldItemsMap.get(sku) || 0;
    const newQty = newItemsMap.get(sku) || 0;
    const diff = newQty - oldQty;

    if (diff !== 0) {
      const stockItem = stockMap.get(sku);
      if (stockItem) {
        const adjustedQty = Math.max(0, stockItem.quantity - diff);
        await updateStockQuantity(sku, adjustedQty);
      }
    }
  }

  // 2. Recalculate totals
  const subtotal = items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  const discountedSubtotal = Math.max(0, subtotal - (Number(discount) || 0));
  const vatAmount = (discountedSubtotal * Number(vatRate)) / 100;
  const totalAmount = discountedSubtotal + vatAmount;
  const now = new Date().toISOString();

  const updatedInvoice = {
    ...existing,
    customerName: customerName ? customerName.trim() : existing.customerName,
    customerPhone: customerPhone ? customerPhone.trim() : existing.customerPhone,
    customerEmail: customerEmail !== undefined ? customerEmail.trim() : existing.customerEmail,
    customerTrn: customerTrn !== undefined ? customerTrn.trim() : existing.customerTrn,
    paymentMethod: paymentMethod || existing.paymentMethod,
    items,
    subtotal,
    vatRate: Number(vatRate),
    vatAmount,
    discount: Number(discount) || 0,
    totalAmount,
    notes: notes !== undefined ? notes.trim() : existing.notes,
    updatedAt: now,
    updatedBy,
  };

  // 3. Update Supabase
  const supabase = getSupabase();
  if (supabase && isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from("invoices")
        .update({
          customer_name: updatedInvoice.customerName,
          customer_phone: updatedInvoice.customerPhone,
          customer_email: updatedInvoice.customerEmail,
          customer_trn: updatedInvoice.customerTrn,
          payment_method: updatedInvoice.paymentMethod,
          items: updatedInvoice.items,
          subtotal: updatedInvoice.subtotal,
          vat_rate: updatedInvoice.vatRate,
          vat_amount: updatedInvoice.vatAmount,
          discount: updatedInvoice.discount,
          total_amount: updatedInvoice.totalAmount,
          notes: updatedInvoice.notes,
        })
        .eq("invoice_no", invoiceNo);

      if (error) console.warn("Supabase invoice update error:", error);
    } catch (e) {
      console.warn("Supabase update error:", e);
    }
  }

  // 4. Update local storage
  const localList = getLocalInvoices();
  const updatedList = localList.map((i) =>
    i.invoiceNo === invoiceNo ? updatedInvoice : i
  );
  saveLocalInvoices(updatedList);

  return updatedInvoice;
};

/**
 * 🗑️ Delete / Void an invoice and automatically RESTORE all sold products back into stock
 */
export const deleteInvoice = async (invoiceNo) => {
  const allInvoices = await fetchInvoices();
  const target = allInvoices.find((i) => i.invoiceNo === invoiceNo);
  if (!target) throw new Error(`Invoice ${invoiceNo} not found`);

  // 1. Restore all sold stock quantities
  const currentStock = await fetchStock();
  const stockMap = new Map(currentStock.map((s) => [s.sku, s]));

  for (const item of (target.items || [])) {
    const stockItem = stockMap.get(item.sku);
    if (stockItem) {
      const restoredQty = stockItem.quantity + (Number(item.quantity) || 0);
      await updateStockQuantity(item.sku, restoredQty);
    }
  }

  // 2. Delete from Supabase
  const supabase = getSupabase();
  if (supabase && isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("invoice_no", invoiceNo);

      if (error) console.warn("Supabase invoice delete error:", error);
    } catch (e) {
      console.warn("Supabase delete error:", e);
    }
  }

  // 3. Delete from local storage
  const localList = getLocalInvoices();
  const updatedList = localList.filter((i) => i.invoiceNo !== invoiceNo);
  saveLocalInvoices(updatedList);

  return updatedList;
};
