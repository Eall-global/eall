/**
 * E-ALL Online Storefront Orders & Fulfillment Service
 * Manages Firestore ("customer_orders") orders placed via the public e-commerce checkout.
 */
import {
  getFirebaseDb,
  isFirebaseConfigured,
  collection,
  doc,
  getDocs,
  setDoc,
} from "../lib/firebaseClient";
import { adjustStockDelta } from "./stockService";
import { logAuditEvent } from "./auditService";

const ADMIN_ORDERS_CACHE_KEY = "eall_admin_online_orders_cache";
const LOCAL_CUSTOMER_ORDERS_KEY = "eall_customer_orders";
const COLLECTION_NAME = "customer_orders";

export const ORDER_STATUSES = [
  "Order Placed",
  "Awaiting Wave Verification",
  "Confirmed",
  "Packed",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Returned",
];

export const COURIER_CARRIERS = [
  "E-ALL Dubai Fleet",
  "Aramex",
  "DHL Express",
  "FedEx",
  "SMSA Express",
  "Self Pickup (DSO Warehouse)",
];

const normalizeOrder = (raw, fallbackId = "") => {
  const orderId = raw.orderId || raw.id || fallbackId;
  const items = Array.isArray(raw.items) ? raw.items : [];
  const subtotal = Number(raw.subtotal ?? raw.total ?? 0) || 0;
  const shippingFee = Number(raw.shippingFee ?? 0) || 0;
  const discountAmount = Number(raw.discountAmount ?? raw.discount ?? 0) || 0;
  const total = Number(raw.total ?? raw.totalAmount ?? subtotal + shippingFee - discountAmount) || 0;

  return {
    id: orderId,
    orderId,
    customerId: raw.customerId || "",
    customerName: raw.customerName || raw.fullName || "Customer",
    email: raw.email || raw.customerEmail || "",
    phone: raw.phone || raw.customerPhone || "",
    country: raw.country || "United Arab Emirates",
    city: raw.city || "Dubai",
    shippingAddress: raw.shippingAddress || "",
    addressLabel: raw.addressLabel || "Home",
    paymentMethod: raw.paymentMethod || "cod",
    paymentMethodName: raw.paymentMethodName || raw.paymentMethod || "Cash on Delivery",
    waveTransactionId: raw.waveTransactionId || null,
    paymentVerified: Boolean(
      raw.paymentVerified ??
        (raw.paymentMethod !== "wave" && raw.paymentMethod !== "cod")
    ),
    codCollected: Boolean(raw.codCollected ?? false),
    appliedCoupon: raw.appliedCoupon || null,
    discountAmount,
    items,
    subtotal,
    shippingFee,
    total,
    status: raw.status || "Order Placed",
    carrier: raw.carrier || "",
    trackingNumber: raw.trackingNumber || "",
    internalNotes: raw.internalNotes || "",
    stockRestored: Boolean(raw.stockRestored ?? false),
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || null,
    updatedBy: raw.updatedBy || null,
  };
};

const readLocalOrders = () => {
  try {
    const adminCache = JSON.parse(localStorage.getItem(ADMIN_ORDERS_CACHE_KEY) || "[]");
    const customerCache = JSON.parse(localStorage.getItem(LOCAL_CUSTOMER_ORDERS_KEY) || "[]");
    const map = new Map();
    [...customerCache, ...adminCache].forEach((o) => {
      const norm = normalizeOrder(o);
      if (norm.orderId) map.set(norm.orderId, norm);
    });
    const list = Array.from(map.values());
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  } catch {
    return [];
  }
};

const saveLocalOrders = (list) => {
  try {
    localStorage.setItem(ADMIN_ORDERS_CACHE_KEY, JSON.stringify(list));
  } catch {
    // ignore quota errors
  }
};

/**
 * Fetch all online storefront orders from Firestore (with local fallback)
 */
export const fetchOnlineOrders = async () => {
  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      const list = [];
      snap.forEach((docSnap) => {
        list.push(normalizeOrder(docSnap.data(), docSnap.id));
      });
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      saveLocalOrders(list);
      return list;
    } catch (err) {
      console.warn("Firestore online orders fetch warning:", err?.message || err);
    }
  }

  return readLocalOrders();
};

/**
 * Update an online order's fulfillment status, payment verification, tracking & notes.
 * Automatically syncs status to Firestore `customer_orders` (and `invoices`), logs audit trail,
 * and optionally restores inventory stock when cancelling/returning an order.
 */
export const updateOnlineOrder = async (
  orderId,
  {
    status,
    carrier,
    trackingNumber,
    paymentVerified,
    codCollected,
    internalNotes,
    restoreStock = false,
    updatedBy = "Staff",
  }
) => {
  const allOrders = await fetchOnlineOrders();
  const existing = allOrders.find((o) => o.orderId === orderId);
  if (!existing) throw new Error(`Order ${orderId} not found.`);

  const now = new Date().toISOString();
  const nextStatus = status ?? existing.status;
  const shouldRestoreStock =
    restoreStock &&
    !existing.stockRestored &&
    (nextStatus === "Cancelled" || nextStatus === "Returned");

  // Restore inventory stock once if requested on cancellation/return
  if (shouldRestoreStock) {
    for (const item of existing.items || []) {
      if (item.sku) {
        try {
          await adjustStockDelta(item.sku, Number(item.quantity) || 1);
        } catch (err) {
          console.warn(`Could not restore stock for ${item.sku}:`, err?.message || err);
        }
      }
    }
  }

  const updatedOrder = {
    ...existing,
    status: nextStatus,
    carrier: carrier !== undefined ? String(carrier).trim() : existing.carrier,
    trackingNumber:
      trackingNumber !== undefined ? String(trackingNumber).trim() : existing.trackingNumber,
    paymentVerified:
      paymentVerified !== undefined ? Boolean(paymentVerified) : existing.paymentVerified,
    codCollected:
      codCollected !== undefined ? Boolean(codCollected) : existing.codCollected,
    internalNotes:
      internalNotes !== undefined ? String(internalNotes).trim() : existing.internalNotes,
    stockRestored: existing.stockRestored || shouldRestoreStock,
    updatedAt: now,
    updatedBy,
  };

  // Persist to Firestore (customer_orders + mirror status to invoices)
  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      await setDoc(doc(db, COLLECTION_NAME, orderId), updatedOrder, { merge: true });
      await setDoc(
        doc(db, "invoices", orderId),
        {
          status: updatedOrder.status,
          carrier: updatedOrder.carrier,
          trackingNumber: updatedOrder.trackingNumber,
          updatedAt: now,
          updatedBy,
        },
        { merge: true }
      );
    } catch (err) {
      console.warn("Firestore online order update warning:", err?.message || err);
    }
  }

  // Persist locally
  const nextList = allOrders.map((o) => (o.orderId === orderId ? updatedOrder : o));
  saveLocalOrders(nextList);

  // Build structured audit diff
  const changes = [];
  if (existing.status !== updatedOrder.status) {
    changes.push({ field: "Fulfillment Status", before: existing.status, after: updatedOrder.status });
  }
  if (existing.carrier !== updatedOrder.carrier) {
    changes.push({ field: "Courier", before: existing.carrier || "—", after: updatedOrder.carrier || "—" });
  }
  if (existing.trackingNumber !== updatedOrder.trackingNumber) {
    changes.push({ field: "Tracking #", before: existing.trackingNumber || "—", after: updatedOrder.trackingNumber || "—" });
  }
  if (existing.paymentVerified !== updatedOrder.paymentVerified) {
    changes.push({
      field: "Payment Verified",
      before: existing.paymentVerified ? "Verified" : "Unverified",
      after: updatedOrder.paymentVerified ? "Verified" : "Unverified",
    });
  }
  if (existing.codCollected !== updatedOrder.codCollected) {
    changes.push({
      field: "COD Collected",
      before: existing.codCollected ? "Collected" : "Pending",
      after: updatedOrder.codCollected ? "Collected" : "Pending",
    });
  }
  if (shouldRestoreStock) {
    changes.push({
      field: "Inventory Stock",
      before: "Deducted",
      after: `Restored (${(existing.items || []).length} SKU line(s))`,
    });
  }

  if (changes.length > 0) {
    const isCancelledOrReturned =
      updatedOrder.status === "Cancelled" || updatedOrder.status === "Returned";
    logAuditEvent({
      module: "orders",
      action: existing.status !== updatedOrder.status ? "status_change" : "update",
      severity: isCancelledOrReturned ? "critical" : "info",
      targetId: orderId,
      targetLabel: `${orderId} • ${updatedOrder.customerName}`,
      summary: `Updated online order ${orderId} → ${updatedOrder.status}${
        updatedOrder.trackingNumber ? ` (Track: ${updatedOrder.trackingNumber})` : ""
      }`,
      changes,
    });
  }

  return updatedOrder;
};

