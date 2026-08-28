import {
  getFirebaseDb,
  isFirebaseConfigured,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
} from "../lib/firebaseClient";
import { fetchStock, updateStockQuantity } from "./stockService";

const INVOICES_STORAGE_KEY = "eall_billing_invoices";
const COLLECTION_NAME = "invoices";

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
 * Fetch all invoices from Google Firebase Firestore
 */
export const fetchInvoices = async () => {
  const db = getFirebaseDb();

  if (db && isFirebaseConfigured()) {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      if (!snapshot.empty) {
        const formatted = [];
        snapshot.forEach((docSnap) => {
          const inv = docSnap.data();
          formatted.push({
            id: inv.id || inv.invoiceNo || docSnap.id,
            invoiceNo: inv.invoiceNo || docSnap.id,
            customerName: inv.customerName || "",
            customerPhone: inv.customerPhone || "",
            customerEmail: inv.customerEmail || "",
            customerTrn: inv.customerTrn || "",
            paymentMethod: inv.paymentMethod || "Cash",
            items: typeof inv.items === "string" ? JSON.parse(inv.items) : (inv.items || []),
            subtotal: Number(inv.subtotal) || 0,
            vatRate: Number(inv.vatRate ?? 5),
            vatAmount: Number(inv.vatAmount) || 0,
            discount: Number(inv.discount) || 0,
            totalAmount: Number(inv.totalAmount) || 0,
            createdBy: inv.createdBy || "Staff",
            role: inv.role || "Salesperson",
            notes: inv.notes || "",
            createdAt: inv.createdAt || new Date().toISOString(),
            updatedAt: inv.updatedAt || null,
            updatedBy: inv.updatedBy || null,
          });
        });

        // Sort descending by creation date
        formatted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        saveLocalInvoices(formatted);
        return formatted;
      }
    } catch (err) {
      console.warn("Firestore invoices fetch failed, using local:", err.message);
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

  // 5. Save invoice to Google Firebase Firestore
  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      const docRef = doc(db, COLLECTION_NAME, invoiceNo);
      await setDoc(docRef, newInvoice);
    } catch (err) {
      console.warn("Firestore invoice insert error:", err.message);
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
  const oldItemsMap = new Map((existing.items || []).map((i) => [i.sku, i.quantity]));
  const newItemsMap = new Map((items || []).map((i) => [i.sku, i.quantity]));

  const allSkus = new Set([...oldItemsMap.keys(), ...newItemsMap.keys()]);
  const currentStock = await fetchStock();
  const stockMap = new Map(currentStock.map((s) => [s.sku, s]));

  // Check if we have enough stock for any increased quantities
  for (const sku of allSkus) {
    const oldQty = oldItemsMap.get(sku) || 0;
    const newQty = newItemsMap.get(sku) || 0;
    const diff = newQty - oldQty;

    if (diff > 0) {
      const stockItem = stockMap.get(sku);
      if (!stockItem || stockItem.quantity < diff) {
        throw new Error(`Insufficient stock for product ${sku} to increase quantity by ${diff}`);
      }
    }
  }

  // Apply stock adjustments
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

  // 3. Update Firestore
  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      const docRef = doc(db, COLLECTION_NAME, invoiceNo);
      await setDoc(docRef, updatedInvoice, { merge: true });
    } catch (e) {
      console.warn("Firestore invoice update error:", e);
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

  // 2. Delete from Firestore
  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      const docRef = doc(db, COLLECTION_NAME, invoiceNo);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn("Firestore invoice delete error:", e);
    }
  }

  // 3. Delete from local storage
  const localList = getLocalInvoices();
  const updatedList = localList.filter((i) => i.invoiceNo !== invoiceNo);
  saveLocalInvoices(updatedList);

  return updatedList;
};
