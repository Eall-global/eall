import {
  getFirebaseDb,
  isFirebaseConfigured,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
} from "../lib/firebaseClient";
import { fetchStock, updateStockQuantity, updateProductDetails } from "./stockService";

const PURCHASES_STORAGE_KEY = "eall_purchase_records";
const COLLECTION_NAME = "purchase_records";

const getLocalPurchases = () => {
  try {
    const raw = localStorage.getItem(PURCHASES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to read local purchases:", err);
    return [];
  }
};

const saveLocalPurchases = (purchases) => {
  try {
    localStorage.setItem(PURCHASES_STORAGE_KEY, JSON.stringify(purchases));
  } catch (err) {
    console.error("Failed to save local purchases:", err);
  }
};

/**
 * Generate standard sequential purchase order number: PO-YYYY-XXXX
 */
export const generatePurchaseNumber = (existingCount = 0) => {
  const year = new Date().getFullYear();
  const seq = String(1001 + existingCount).padStart(4, "0");
  return `PO-${year}-${seq}`;
};

/**
 * Fetch all purchase records from Firestore / Local fallback
 */
export const fetchPurchases = async () => {
  const db = getFirebaseDb();

  if (db && isFirebaseConfigured()) {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      if (!snapshot.empty) {
        const formatted = [];
        snapshot.forEach((docSnap) => {
          const p = docSnap.data();
          formatted.push({
            id: p.id || p.purchaseNo || docSnap.id,
            purchaseNo: p.purchaseNo || docSnap.id,
            supplierName: p.supplierName || "General Supplier",
            supplierInvoiceRef: p.supplierInvoiceRef || "",
            purchaseDate: p.purchaseDate || p.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
            paymentStatus: p.paymentStatus || "Paid", // Paid | Pending | Partial
            paymentMethod: p.paymentMethod || "Bank Transfer", // Bank Transfer | Cash | Cheque | Credit
            items: typeof p.items === "string" ? JSON.parse(p.items) : (p.items || []),
            totalQuantity: Number(p.totalQuantity) || 0,
            totalAmount: Number(p.totalAmount) || 0,
            notes: p.notes || "",
            createdBy: p.createdBy || "Admin",
            createdAt: p.createdAt || new Date().toISOString(),
            updatedAt: p.updatedAt || null,
          });
        });

        // Sort descending by creation date
        formatted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        saveLocalPurchases(formatted);
        return formatted;
      }
    } catch (err) {
      console.warn("Firestore purchases fetch warning:", err.message);
    }
  }

  return getLocalPurchases();
};

/**
 * Real-time purchase subscription via Firestore onSnapshot
 */
export const subscribeToPurchases = (callback) => {
  const db = getFirebaseDb();
  if (!db || !isFirebaseConfigured()) return () => {};

  try {
    const unsubscribe = onSnapshot(
      collection(db, COLLECTION_NAME),
      (snapshot) => {
        if (!snapshot.empty) {
          const formatted = [];
          snapshot.forEach((docSnap) => {
            const p = docSnap.data();
            formatted.push({
              id: p.id || p.purchaseNo || docSnap.id,
              purchaseNo: p.purchaseNo || docSnap.id,
              supplierName: p.supplierName || "General Supplier",
              supplierInvoiceRef: p.supplierInvoiceRef || "",
              purchaseDate: p.purchaseDate || p.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
              paymentStatus: p.paymentStatus || "Paid",
              paymentMethod: p.paymentMethod || "Bank Transfer",
              items: typeof p.items === "string" ? JSON.parse(p.items) : (p.items || []),
              totalQuantity: Number(p.totalQuantity) || 0,
              totalAmount: Number(p.totalAmount) || 0,
              notes: p.notes || "",
              createdBy: p.createdBy || "Admin",
              createdAt: p.createdAt || new Date().toISOString(),
              updatedAt: p.updatedAt || null,
            });
          });
          formatted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          saveLocalPurchases(formatted);
          callback(formatted);
        }
      },
      (error) => {
        console.warn("Firestore purchases onSnapshot warning:", error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn("Could not subscribe to Firestore purchases:", err);
    return () => {};
  }
};

/**
 * Create a new Purchase Record and automatically INWARD / increment product stock quantities
 */
export const createPurchaseRecord = async ({
  supplierName,
  supplierInvoiceRef = "",
  purchaseDate,
  paymentStatus = "Paid",
  paymentMethod = "Bank Transfer",
  items, // array of { sku, name, brand, quantity, unitCost, totalCost }
  notes = "",
  createdBy = "Admin",
  updateProductCost = true, // Whether to update product's catalog costPrice to the latest unitCost
}) => {
  if (!items || items.length === 0) {
    throw new Error("Purchase record must contain at least one product item");
  }

  // 1. Compute totals
  const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalAmount = items.reduce((sum, item) => sum + (Number(item.totalCost) || (Number(item.unitCost || 0) * Number(item.quantity || 0))), 0);

  // 2. Generate sequential PO number
  const existingPurchases = await fetchPurchases();
  const purchaseNo = generatePurchaseNumber(existingPurchases.length);
  const now = new Date().toISOString();

  const newPurchase = {
    id: purchaseNo,
    purchaseNo,
    supplierName: supplierName.trim(),
    supplierInvoiceRef: supplierInvoiceRef.trim(),
    purchaseDate: purchaseDate || now.slice(0, 10),
    paymentStatus,
    paymentMethod,
    items,
    totalQuantity,
    totalAmount,
    notes: notes.trim(),
    createdBy,
    createdAt: now,
  };

  // 3. Atomically increment physical stock for each inward item
  const currentStock = await fetchStock();
  const stockMap = new Map(currentStock.map((s) => [s.sku, s]));

  for (const item of items) {
    const stockItem = stockMap.get(item.sku);
    const inwardQty = Math.max(0, parseInt(item.quantity, 10) || 0);

    if (stockItem) {
      const newQty = (stockItem.quantity || 0) + inwardQty;
      const unitCost = Number(item.unitCost) || 0;

      if (updateProductCost && unitCost > 0) {
        // Update product quantity and latest costPrice, maintaining existing margin or price
        const currentMargin = Number(stockItem.margin) || 0;
        await updateProductDetails(item.sku, {
          quantity: newQty,
          costPrice: unitCost,
          price: unitCost + currentMargin,
        });
      } else {
        await updateStockQuantity(item.sku, newQty);
      }
    }
  }

  // 4. Save purchase record to Firestore
  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      const docRef = doc(db, COLLECTION_NAME, purchaseNo);
      await setDoc(docRef, newPurchase);
    } catch (err) {
      console.warn("Firestore purchase record insert warning:", err.message);
    }
  }

  // 5. Save to local storage fallback
  const localList = getLocalPurchases();
  const updatedLocal = [newPurchase, ...localList];
  saveLocalPurchases(updatedLocal);

  return newPurchase;
};

/**
 * Delete / Void a Purchase Record with optional stock reversal
 */
export const deletePurchaseRecord = async (purchaseNo, reverseStock = true) => {
  const allPurchases = await fetchPurchases();
  const target = allPurchases.find((p) => p.purchaseNo === purchaseNo);
  if (!target) throw new Error(`Purchase order ${purchaseNo} not found`);

  // 1. Reverse inward stock if requested
  if (reverseStock) {
    const currentStock = await fetchStock();
    const stockMap = new Map(currentStock.map((s) => [s.sku, s]));

    for (const item of target.items || []) {
      const stockItem = stockMap.get(item.sku);
      if (stockItem) {
        const qtyToReverse = Number(item.quantity) || 0;
        const newQty = Math.max(0, (stockItem.quantity || 0) - qtyToReverse);
        await updateStockQuantity(item.sku, newQty);
      }
    }
  }

  // 2. Remove from Firestore
  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      const docRef = doc(db, COLLECTION_NAME, purchaseNo);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn("Firestore purchase delete warning:", err.message);
    }
  }

  // 3. Update local storage
  const localList = getLocalPurchases();
  const updatedList = localList.filter((p) => p.purchaseNo !== purchaseNo);
  saveLocalPurchases(updatedList);

  return updatedList;
};
