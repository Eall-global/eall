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
import {
  fetchStock,
  updateStockQuantity,
  updateProductDetails,
  updateLocationStock,
  addCustomProduct,
  getLocationStockEntry,
} from "./stockService";
import { logAuditEvent } from "./auditService";

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

const mapPurchaseDoc = (p, fallbackId) => ({
  id: p.id || p.purchaseNo || fallbackId,
  purchaseNo: p.purchaseNo || fallbackId,
  locationCode: String(p.locationCode || "AE").toUpperCase(),
  currency: p.currency || "AED",
  currencySymbol: p.currencySymbol || p.currency || "AED",
  supplierName: p.supplierName || "General Supplier",
  supplierInvoiceRef: p.supplierInvoiceRef || "",
  sourceFile: p.sourceFile || "",
  purchaseDate:
    p.purchaseDate ||
    p.createdAt?.slice(0, 10) ||
    new Date().toISOString().slice(0, 10),
  paymentStatus: p.paymentStatus || "Paid", // Paid | Pending | Partial
  paymentMethod: p.paymentMethod || "Bank Transfer",
  items: typeof p.items === "string" ? JSON.parse(p.items) : p.items || [],
  totalQuantity: Number(p.totalQuantity) || 0,
  totalAmount: Number(p.totalAmount) || 0,
  notes: p.notes || "",
  createdBy: p.createdBy || "Admin",
  createdAt: p.createdAt || new Date().toISOString(),
  updatedAt: p.updatedAt || null,
  updatedBy: p.updatedBy || null,
});

/**
 * Generate standard sequential purchase order number: PO-YYYY-XXXX
 */
export const generatePurchaseNumber = (existingList = []) => {
  const year = new Date().getFullYear();
  let maxSeq = 1000;
  for (const p of existingList) {
    const m = String(p.purchaseNo || "").match(/PO-\d{4}-(\d+)/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > maxSeq) maxSeq = n;
    }
  }
  const seq = String(Math.max(maxSeq + 1, 1001 + existingList.length)).padStart(
    4,
    "0"
  );
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
          formatted.push(mapPurchaseDoc(docSnap.data(), docSnap.id));
        });

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
            formatted.push(mapPurchaseDoc(docSnap.data(), docSnap.id));
          });
          formatted.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
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
 * Normalize & clean line items before persisting
 */
const normalizePurchaseItems = (items = []) =>
  items
    .map((item) => {
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const unitCost = Math.max(0, Number(item.unitCost) || 0);
      const sellingPrice = Math.max(0, Number(item.sellingPrice) || 0);
      return {
        sku: String(item.sku || "").trim().toUpperCase(),
        name: String(item.name || item.sku || "Unnamed Product").trim(),
        brand: String(item.brand || "General").trim(),
        category: String(item.category || "Mobile Devices").trim(),
        image: item.image || "/logo.png",
        quantity: qty,
        unitCost: Number(unitCost.toFixed(2)),
        sellingPrice: sellingPrice > 0 ? Number(sellingPrice.toFixed(2)) : 0,
        totalCost: Number((qty * unitCost).toFixed(2)),
        isUnlisted: Boolean(item.isUnlisted),
      };
    })
    .filter((i) => i.sku);

/**
 * Helper: ensure an unlisted product is added to Stock Manager & seeded at the active location
 */
const ensureAndInwardItem = async ({
  item,
  qtyDelta,
  stockMap,
  locationCode = "AE",
  updateProductCost = true,
}) => {
  const code = String(locationCode || "AE").toUpperCase();
  const isCountryBranch = code !== "AE" && code !== "ALL";
  const stockItem = stockMap.get(item.sku);
  const unitCost = Math.max(0, Number(item.unitCost) || 0);

  if (!stockItem) {
    // Unlisted / New SKU -> auto-create in Stock Manager!
    const initialQty = Math.max(0, qtyDelta);
    const defaultSell =
      item.sellingPrice > 0
        ? item.sellingPrice
        : unitCost > 0
        ? Math.round(unitCost * 1.2)
        : 0;
    const defaultMargin = Math.max(0, Number((defaultSell - unitCost).toFixed(2)));

    await addCustomProduct({
      sku: item.sku,
      name: item.name,
      brand: item.brand || "General",
      category: item.category || "Mobile Devices",
      image: item.image || "/logo.png",
      quantity: isCountryBranch ? 0 : initialQty,
      costPrice: isCountryBranch ? 0 : unitCost,
      margin: isCountryBranch ? 0 : defaultMargin,
      price: isCountryBranch ? 0 : defaultSell,
      minAlert: 3,
    });

    if (isCountryBranch) {
      await updateLocationStock(item.sku, code, {
        quantity: initialQty,
        costLocal: unitCost,
        priceLocal: defaultSell,
        minAlert: 3,
        skipAudit: true,
      });
    }
    return { createdNew: true };
  }

  // Existing SKU -> reconcile stock quantity by delta and update costPrice
  if (isCountryBranch) {
    const prevEntry = getLocationStockEntry(stockItem, code);
    const nextQty = Math.max(0, (Number(prevEntry.quantity) || 0) + qtyDelta);
    const payload = {
      quantity: nextQty,
      skipAudit: true,
    };
    if (updateProductCost && unitCost > 0) {
      payload.costLocal = unitCost;
    }
    if (item.sellingPrice > 0) {
      payload.priceLocal = item.sellingPrice;
    }
    await updateLocationStock(item.sku, code, payload);
  } else {
    const nextQty = Math.max(0, (Number(stockItem.quantity) || 0) + qtyDelta);
    if (updateProductCost && unitCost > 0) {
      const existingPrice = Number(stockItem.price) || 0;
      const nextPrice =
        item.sellingPrice > 0
          ? item.sellingPrice
          : existingPrice > 0
          ? existingPrice
          : Math.round(unitCost * 1.2);
      const nextMargin = Math.max(0, Number((nextPrice - unitCost).toFixed(2)));

      await updateProductDetails(item.sku, {
        quantity: nextQty,
        costPrice: unitCost,
        margin: nextMargin,
        price: nextPrice,
        skipAudit: true,
      });
    } else if (qtyDelta !== 0) {
      await updateStockQuantity(item.sku, nextQty, "AE");
    }
  }

  return { createdNew: false };
};

/**
 * Create a new Purchase Record, auto-register any unlisted SKUs,
 * and inward/increment stock quantities at the active location.
 */
export const createPurchaseRecord = async ({
  supplierName,
  supplierInvoiceRef = "",
  sourceFile = "",
  purchaseDate,
  paymentStatus = "Paid",
  paymentMethod = "Bank Transfer",
  items,
  notes = "",
  createdBy = "Admin",
  locationCode = "AE",
  currency = "AED",
  currencySymbol = "AED",
  updateProductCost = true,
}) => {
  const cleanItems = normalizePurchaseItems(items);
  if (cleanItems.length === 0) {
    throw new Error("Purchase record must contain at least one product item");
  }

  const locCode = locationCode === "ALL" ? "AE" : String(locationCode || "AE").toUpperCase();
  const totalQuantity = cleanItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = Number(
    cleanItems.reduce((sum, item) => sum + item.totalCost, 0).toFixed(2)
  );

  const existingPurchases = await fetchPurchases();
  const purchaseNo = generatePurchaseNumber(existingPurchases);
  const now = new Date().toISOString();

  // Reconcile stock & auto-create unlisted products
  const currentStock = await fetchStock();
  const stockMap = new Map(currentStock.map((s) => [s.sku, s]));
  let newlyCreatedSkus = 0;

  for (const item of cleanItems) {
    const res = await ensureAndInwardItem({
      item,
      qtyDelta: item.quantity,
      stockMap,
      locationCode: locCode,
      updateProductCost,
    });
    if (res.createdNew) {
      newlyCreatedSkus++;
      item.isUnlisted = true;
    }
  }

  const newPurchase = {
    id: purchaseNo,
    purchaseNo,
    locationCode: locCode,
    currency: currency || "AED",
    currencySymbol: currencySymbol || currency || "AED",
    supplierName: supplierName.trim(),
    supplierInvoiceRef: supplierInvoiceRef.trim(),
    sourceFile: sourceFile || "",
    purchaseDate: purchaseDate || now.slice(0, 10),
    paymentStatus,
    paymentMethod,
    items: cleanItems,
    totalQuantity,
    totalAmount,
    notes: notes.trim(),
    createdBy,
    createdAt: now,
  };

  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      const docRef = doc(db, COLLECTION_NAME, purchaseNo);
      await setDoc(docRef, newPurchase);
    } catch (err) {
      console.warn("Firestore purchase record insert warning:", err.message);
    }
  }

  const localList = getLocalPurchases();
  const updatedLocal = [newPurchase, ...localList.filter((p) => p.purchaseNo !== purchaseNo)];
  saveLocalPurchases(updatedLocal);

  logAuditEvent({
    module: "purchases",
    action: "create",
    severity: "info",
    targetId: purchaseNo,
    targetLabel: `${purchaseNo} • ${newPurchase.supplierName}`,
    summary: `Recorded purchase ${purchaseNo} from ${newPurchase.supplierName} (${locCode} • +${totalQuantity} units • ${newPurchase.currencySymbol} ${totalAmount.toLocaleString()}${newlyCreatedSkus > 0 ? ` • ${newlyCreatedSkus} new SKU(s)` : ""})`,
    changes: [
      { field: "Inward Units", before: "—", after: `+${totalQuantity} units` },
      { field: "Total Cost", before: "—", after: `${newPurchase.currencySymbol} ${totalAmount.toFixed(2)}` },
      { field: "Payment Status", before: "—", after: paymentStatus },
    ],
  });

  return newPurchase;
};

/**
 * Update an existing Purchase Record and automatically reconcile stock quantity
 * deltas (newQty - oldQty) and updated unit costs in Stock Manager.
 */
export const updatePurchaseRecord = async (
  purchaseNo,
  {
    supplierName,
    supplierInvoiceRef = "",
    sourceFile,
    purchaseDate,
    paymentStatus = "Paid",
    paymentMethod = "Bank Transfer",
    items,
    notes = "",
    updatedBy = "Admin",
    updateProductCost = true,
  }
) => {
  const allPurchases = await fetchPurchases();
  const existing = allPurchases.find((p) => p.purchaseNo === purchaseNo);
  if (!existing) throw new Error(`Purchase order ${purchaseNo} not found`);

  const cleanItems = normalizePurchaseItems(items);
  if (cleanItems.length === 0) {
    throw new Error("Purchase record must contain at least one product item");
  }

  const locCode = String(existing.locationCode || "AE").toUpperCase();
  const currentStock = await fetchStock();
  const stockMap = new Map(currentStock.map((s) => [s.sku, s]));

  // Map previous quantities by SKU
  const oldQtyMap = new Map();
  for (const oldItem of existing.items || []) {
    const sku = String(oldItem.sku || "").trim().toUpperCase();
    oldQtyMap.set(sku, (oldQtyMap.get(sku) || 0) + (Number(oldItem.quantity) || 0));
  }

  // Map new items by SKU (combine duplicates cleanly)
  const newQtyMap = new Map();
  const newItemMeta = new Map();
  for (const item of cleanItems) {
    newQtyMap.set(item.sku, (newQtyMap.get(item.sku) || 0) + item.quantity);
    newItemMeta.set(item.sku, item);
  }

  const allSkus = new Set([...oldQtyMap.keys(), ...newQtyMap.keys()]);

  for (const sku of allSkus) {
    const oldQty = oldQtyMap.get(sku) || 0;
    const newQty = newQtyMap.get(sku) || 0;
    const delta = newQty - oldQty;
    const itemMeta = newItemMeta.get(sku);

    if (itemMeta) {
      await ensureAndInwardItem({
        item: itemMeta,
        qtyDelta: delta,
        stockMap,
        locationCode: locCode,
        updateProductCost,
      });
    } else if (delta < 0) {
      // Item was completely removed from the PO -> reverse old inward quantity
      const stockItem = stockMap.get(sku);
      if (stockItem) {
        const isBranch = locCode !== "AE" && locCode !== "ALL";
        const prevQty = isBranch
          ? Number(getLocationStockEntry(stockItem, locCode).quantity) || 0
          : Number(stockItem.quantity) || 0;
        await updateStockQuantity(sku, Math.max(0, prevQty + delta), locCode);
      }
    }
  }

  const totalQuantity = cleanItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = Number(
    cleanItems.reduce((sum, item) => sum + item.totalCost, 0).toFixed(2)
  );
  const now = new Date().toISOString();

  const updatedPurchase = {
    ...existing,
    supplierName: (supplierName ?? existing.supplierName).trim(),
    supplierInvoiceRef: (supplierInvoiceRef ?? existing.supplierInvoiceRef).trim(),
    sourceFile: sourceFile !== undefined ? sourceFile : existing.sourceFile || "",
    purchaseDate: purchaseDate || existing.purchaseDate,
    paymentStatus,
    paymentMethod,
    items: cleanItems,
    totalQuantity,
    totalAmount,
    notes: (notes ?? existing.notes).trim(),
    updatedBy,
    updatedAt: now,
  };

  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      const docRef = doc(db, COLLECTION_NAME, purchaseNo);
      await setDoc(docRef, updatedPurchase, { merge: true });
    } catch (err) {
      console.warn("Firestore purchase update warning:", err.message);
    }
  }

  const localList = getLocalPurchases();
  const nextLocal = localList.some((p) => p.purchaseNo === purchaseNo)
    ? localList.map((p) => (p.purchaseNo === purchaseNo ? updatedPurchase : p))
    : [updatedPurchase, ...localList];
  saveLocalPurchases(nextLocal);

  const sym = updatedPurchase.currencySymbol || updatedPurchase.currency || "AED";
  logAuditEvent({
    module: "purchases",
    action: "update",
    severity: "warning",
    targetId: purchaseNo,
    targetLabel: `${purchaseNo} • ${updatedPurchase.supplierName}`,
    summary: `Edited purchase ${purchaseNo} and reconciled inventory deltas (${existing.totalQuantity} → ${totalQuantity} units • ${sym} ${totalAmount.toLocaleString()})`,
    changes: [
      { field: "Inward Units", before: `${existing.totalQuantity} units`, after: `${totalQuantity} units` },
      { field: "Total Cost", before: `${sym} ${Number(existing.totalAmount).toFixed(2)}`, after: `${sym} ${totalAmount.toFixed(2)}` },
      { field: "Payment Status", before: existing.paymentStatus, after: paymentStatus },
    ],
  });

  return updatedPurchase;
};

/**
 * Delete / Void a Purchase Record with optional stock reversal at the original branch location
 */
export const deletePurchaseRecord = async (purchaseNo, reverseStock = true) => {
  const allPurchases = await fetchPurchases();
  const target = allPurchases.find((p) => p.purchaseNo === purchaseNo);
  if (!target) throw new Error(`Purchase order ${purchaseNo} not found`);

  const targetLoc = String(target.locationCode || "AE").toUpperCase();
  const isBranch = targetLoc !== "AE" && targetLoc !== "ALL";

  if (reverseStock) {
    const currentStock = await fetchStock();
    const stockMap = new Map(currentStock.map((s) => [s.sku, s]));

    for (const item of target.items || []) {
      const stockItem = stockMap.get(item.sku);
      if (stockItem) {
        const qtyToReverse = Number(item.quantity) || 0;
        const prevQty = isBranch
          ? Number(getLocationStockEntry(stockItem, targetLoc).quantity) || 0
          : Number(stockItem.quantity) || 0;
        const newQty = Math.max(0, prevQty - qtyToReverse);
        await updateStockQuantity(item.sku, newQty, targetLoc);
      }
    }
  }

  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      const docRef = doc(db, COLLECTION_NAME, purchaseNo);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn("Firestore purchase delete warning:", err.message);
    }
  }

  const localList = getLocalPurchases();
  const updatedList = localList.filter((p) => p.purchaseNo !== purchaseNo);
  saveLocalPurchases(updatedList);

  const sym = target.currencySymbol || target.currency || "AED";
  logAuditEvent({
    module: "purchases",
    action: "void",
    severity: "critical",
    targetId: purchaseNo,
    targetLabel: `${purchaseNo} • ${target.supplierName}`,
    summary: `Voided purchase order ${purchaseNo} (${target.supplierName}) and reversed ${target.totalQuantity} inward units from ${targetLoc}`,
    changes: [
      { field: "Status", before: target.paymentStatus, after: "Voided / Reversed" },
      { field: "Amount", before: `${sym} ${Number(target.totalAmount).toFixed(2)}`, after: `${sym} 0.00` },
    ],
  });

  return updatedList;
};
