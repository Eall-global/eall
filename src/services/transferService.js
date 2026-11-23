/**
 * E-ALL Inter-Hub Stock Requisition, Transit Tracking & Landed Cost Receiving Service
 * Manages transfers between Tier-1 Global Supply Hubs (AE, CN, HK) and Tier-2 Country Hubs (KE, SN, UG, CI, GH, SA, etc.)
 */
import {
  getFirebaseDb,
  isFirebaseConfigured,
  collection,
  doc,
  getDocs,
  setDoc,
} from "../lib/firebaseClient";
import {
  fetchStock,
  getLocationStockEntry,
  updateLocationStock,
} from "./stockService";
import { logAuditEvent } from "./auditService";
import {
  DEFAULT_LOCATIONS,
  convertAedToLocalPrice,
} from "../config/locationsConfig";

const STORAGE_KEY = "eall_stock_transfers";
const COLLECTION_NAME = "stock_transfers";

const getLocalTransfers = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalTransfers = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore storage quota errors
  }
};

const generateTransferId = (existingCount = 0) => {
  const year = new Date().getFullYear();
  const seq = String(1001 + existingCount).padStart(4, "0");
  return `TRF-${year}-${seq}`;
};

const persistTransferRecord = async (record) => {
  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      await setDoc(doc(db, COLLECTION_NAME, record.transferId), record, {
        merge: true,
      });
    } catch (err) {
      console.warn("Firestore transfer save warning:", err.message);
    }
  }
  const current = getLocalTransfers();
  const updated = [
    record,
    ...current.filter((t) => t.transferId !== record.transferId),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  saveLocalTransfers(updated);
  return record;
};

/**
 * Fetch all inter-hub stock transfer orders
 */
export const fetchTransfers = async () => {
  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      if (!snap.empty) {
        const list = [];
        snap.forEach((d) => {
          const data = d.data();
          list.push({
            transferId: data.transferId || d.id,
            ...data,
            items: Array.isArray(data.items) ? data.items : [],
          });
        });
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        saveLocalTransfers(list);
        return list;
      }
    } catch (err) {
      console.warn("Firestore transfers fetch failed, using local:", err.message);
    }
  }
  return getLocalTransfers();
};

/**
 * STAGE 1: Country Hub submits a stock requisition to a Tier-1 Supply Hub (AE, CN, HK)
 */
export const createTransferRequest = async ({
  sourceHub = "AE",
  destinationCountry = "KE",
  items = [],
  requestedBy = "Staff",
  priority = "Normal",
  notes = "",
}) => {
  const src = String(sourceHub || "AE").trim().toUpperCase();
  const dest = String(destinationCountry || "KE").trim().toUpperCase();

  if (src === dest) {
    throw new Error("Source Supply Hub and Destination Country must be different.");
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Add at least one SKU to the transfer request.");
  }

  const normalizedItems = items
    .map((item) => ({
      sku: String(item.sku || "").trim().toUpperCase(),
      name: String(item.name || item.sku || "").trim(),
      brand: String(item.brand || "").trim(),
      image: item.image || "/logo.png",
      requestedQty: Math.max(1, parseInt(item.requestedQty ?? item.qty ?? 1, 10) || 1),
      approvedQty: Math.max(1, parseInt(item.requestedQty ?? item.qty ?? 1, 10) || 1),
      dispatchedQty: 0,
      receivedQty: 0,
      unitCostAed: Number(item.unitCostAed || item.costPriceAed || item.costPrice || 0),
      unitPriceAed: Number(item.unitPriceAed || item.priceAed || item.price || 0),
      targetPriceLocal: Number(item.targetPriceLocal || 0),
      serials: Array.isArray(item.serials) ? item.serials : [],
    }))
    .filter((i) => i.sku);

  if (normalizedItems.length === 0) {
    throw new Error("Transfer request contains no valid SKUs.");
  }

  const existing = await fetchTransfers();
  const transferId = generateTransferId(existing.length);
  const now = new Date().toISOString();
  const totalUnits = normalizedItems.reduce((s, i) => s + i.requestedQty, 0);

  const record = {
    transferId,
    sourceHub: src,
    destinationCountry: dest,
    status: "Pending Approval",
    priority,
    items: normalizedItems,
    totalRequestedUnits: totalUnits,
    totalDispatchedUnits: 0,
    totalReceivedUnits: 0,
    requestedBy,
    notes: String(notes || "").trim(),
    createdAt: now,
    updatedAt: now,
  };

  await persistTransferRecord(record);

  logAuditEvent({
    module: "stock",
    action: "transfer_request",
    severity: "info",
    targetId: transferId,
    targetLabel: `${transferId} (${src} → ${dest})`,
    summary: `Requested ${totalUnits} unit(s) across ${normalizedItems.length} SKU(s) from [${src}] to [${dest}]`,
    changes: [
      { field: "Route", before: src, after: dest },
      { field: "Units", before: "—", after: `${totalUnits} pcs` },
      { field: "Status", before: "—", after: "Pending Approval" },
    ],
  });

  return record;
};

/**
 * STAGE 2: Supply Hub Manager / Super Admin approves the requisition (optionally adjusting qty)
 */
export const approveTransferRequest = async (
  transferId,
  { approvedBy = "Admin", approvedItems = null, notes = "" } = {}
) => {
  const all = await fetchTransfers();
  const target = all.find((t) => t.transferId === transferId);
  if (!target) throw new Error(`Transfer ${transferId} not found.`);
  if (target.status !== "Pending Approval") {
    throw new Error(`Transfer ${transferId} is already ${target.status}.`);
  }

  const nextItems = (target.items || []).map((item) => {
    const override = Array.isArray(approvedItems)
      ? approvedItems.find((o) => o.sku === item.sku)
      : null;
    const approvedQty =
      override !== undefined && override !== null
        ? Math.max(0, parseInt(override.approvedQty, 10) || 0)
        : item.requestedQty;
    return { ...item, approvedQty };
  });

  const now = new Date().toISOString();
  const updated = {
    ...target,
    status: "Approved",
    items: nextItems,
    approvedBy,
    approvedAt: now,
    approvalNotes: String(notes || "").trim(),
    updatedAt: now,
  };

  await persistTransferRecord(updated);

  logAuditEvent({
    module: "stock",
    action: "transfer_approve",
    severity: "info",
    targetId: transferId,
    targetLabel: `${transferId} (${target.sourceHub} → ${target.destinationCountry})`,
    summary: `Approved stock transfer ${transferId} by ${approvedBy}`,
  });

  return updated;
};

/**
 * Reject a pending transfer requisition
 */
export const rejectTransferRequest = async (
  transferId,
  { rejectedBy = "Admin", reason = "" } = {}
) => {
  const all = await fetchTransfers();
  const target = all.find((t) => t.transferId === transferId);
  if (!target) throw new Error(`Transfer ${transferId} not found.`);

  const now = new Date().toISOString();
  const updated = {
    ...target,
    status: "Rejected",
    rejectedBy,
    rejectedAt: now,
    rejectionReason: String(reason || "Rejected by supply hub").trim(),
    updatedAt: now,
  };

  await persistTransferRecord(updated);

  logAuditEvent({
    module: "stock",
    action: "transfer_reject",
    severity: "warning",
    targetId: transferId,
    targetLabel: `${transferId} (${target.sourceHub} → ${target.destinationCountry})`,
    summary: `Rejected stock transfer ${transferId}: ${updated.rejectionReason}`,
  });

  return updated;
};

/**
 * STAGE 3: Supply Hub dispatches the shipment with AWB / carrier tracking.
 * Deducts on-hand quantity from `sourceHub` and adds `inTransitIn` to `destinationCountry`.
 */
export const dispatchTransferShipment = async (
  transferId,
  {
    dispatchedBy = "Hub Ops",
    carrier = "DHL Express Air Cargo",
    trackingNumber = "",
    freightCostUsd = 0,
    dispatchNotes = "",
  } = {}
) => {
  const all = await fetchTransfers();
  const target = all.find((t) => t.transferId === transferId);
  if (!target) throw new Error(`Transfer ${transferId} not found.`);
  if (!["Pending Approval", "Approved"].includes(target.status)) {
    throw new Error(`Cannot dispatch transfer in status "${target.status}".`);
  }

  const stockList = await fetchStock();
  const stockMap = new Map(stockList.map((s) => [s.sku, s]));

  // Validate source hub has sufficient stock for all items before mutating
  for (const item of target.items) {
    const qtyToShip = Number(item.approvedQty || item.requestedQty || 0);
    if (qtyToShip <= 0) continue;
    const stockDoc = stockMap.get(item.sku);
    if (!stockDoc) {
      throw new Error(`SKU ${item.sku} not found in stock database.`);
    }
    const srcAvail = getLocationStockEntry(stockDoc, target.sourceHub).quantity;
    if (srcAvail < qtyToShip) {
      throw new Error(
        `Insufficient [${target.sourceHub}] hub stock for ${item.name} (${item.sku}). Available: ${srcAvail}, Dispatching: ${qtyToShip}`
      );
    }
  }

  // Execute atomic hub deduction + destination in-transit increment
  const dispatchedItems = [];
  for (const item of target.items) {
    const qtyToShip = Number(item.approvedQty || item.requestedQty || 0);
    if (qtyToShip > 0) {
      const stockDoc = stockMap.get(item.sku);
      const srcEntry = getLocationStockEntry(stockDoc, target.sourceHub);
      const destEntry = getLocationStockEntry(stockDoc, target.destinationCountry);

      await updateLocationStock(item.sku, target.sourceHub, {
        quantity: Math.max(0, srcEntry.quantity - qtyToShip),
        skipAudit: true,
      });

      await updateLocationStock(item.sku, target.destinationCountry, {
        inTransitIn: destEntry.inTransitIn + qtyToShip,
        skipAudit: true,
      });
    }
    dispatchedItems.push({
      ...item,
      dispatchedQty: qtyToShip,
    });
  }

  const now = new Date().toISOString();
  const totalDispatchedUnits = dispatchedItems.reduce(
    (sum, i) => sum + Number(i.dispatchedQty || 0),
    0
  );

  const updated = {
    ...target,
    status: "In Transit",
    items: dispatchedItems,
    totalDispatchedUnits,
    dispatchedBy,
    dispatchedAt: now,
    carrier: String(carrier || "").trim(),
    trackingNumber: String(trackingNumber || "").trim().toUpperCase(),
    freightCostUsd: Number(freightCostUsd) || 0,
    dispatchNotes: String(dispatchNotes || "").trim(),
    updatedAt: now,
  };

  await persistTransferRecord(updated);

  logAuditEvent({
    module: "stock",
    action: "transfer_dispatch",
    severity: "warning",
    targetId: transferId,
    targetLabel: `${transferId} (${target.sourceHub} → ${target.destinationCountry})`,
    summary: `Dispatched ${totalDispatchedUnits} unit(s) from [${target.sourceHub}] to [${target.destinationCountry}] via ${updated.carrier} (AWB: ${updated.trackingNumber || "N/A"})`,
    changes: [
      { field: "Source Hub Deducted", before: target.sourceHub, after: `-${totalDispatchedUnits} pcs` },
      { field: "Destination In-Transit", before: target.destinationCountry, after: `+${totalDispatchedUnits} pcs` },
    ],
  });

  return updated;
};

/**
 * STAGE 4: Receiving Country Hub verifies goods, calculates local landed cost & sets local retail prices.
 * Clears `inTransitIn` and adds received units directly into `locations[destinationCountry].quantity`,
 * making them immediately live on the country's storefront (e.g., eall.ae/ke).
 */
export const receiveTransferShipment = async (
  transferId,
  {
    receivedBy = "Branch Ops",
    receivedItems = null,
    destinationConfig = null,
    customsDutyLocal = 0,
    localLogisticsLocal = 0,
    applyPriceUpdates = true,
    receiveNotes = "",
  } = {}
) => {
  const all = await fetchTransfers();
  const target = all.find((t) => t.transferId === transferId);
  if (!target) throw new Error(`Transfer ${transferId} not found.`);
  if (target.status !== "In Transit") {
    throw new Error(`Transfer ${transferId} must be In Transit before receiving.`);
  }

  const destCfg =
    destinationConfig ||
    DEFAULT_LOCATIONS.find((l) => l.code === target.destinationCountry) ||
    DEFAULT_LOCATIONS[0];

  const stockList = await fetchStock();
  const stockMap = new Map(stockList.map((s) => [s.sku, s]));

  // Compute total received units to allocate shared freight + customs + local clearance evenly per piece
  const preparedItems = (target.items || []).map((item) => {
    const ov = Array.isArray(receivedItems)
      ? receivedItems.find((o) => o.sku === item.sku)
      : null;
    const receivedQty =
      ov && ov.receivedQty !== undefined
        ? Math.max(0, parseInt(ov.receivedQty, 10) || 0)
        : Number(item.dispatchedQty || item.approvedQty || item.requestedQty || 0);
    const explicitPriceLocal =
      ov && Number(ov.priceLocal) > 0 ? Number(ov.priceLocal) : Number(item.targetPriceLocal || 0);
    return {
      ...item,
      receivedQty,
      finalPriceLocal: explicitPriceLocal,
    };
  });

  const totalReceivedUnits = preparedItems.reduce((s, i) => s + i.receivedQty, 0);
  const freightAed = (Number(target.freightCostUsd) || 0) * 3.6725;
  const freightLocal = convertAedToLocalPrice(freightAed, destCfg, 0);
  const totalSharedOverheadLocal =
    freightLocal + (Number(customsDutyLocal) || 0) + (Number(localLogisticsLocal) || 0);
  const overheadPerUnitLocal =
    totalReceivedUnits > 0 ? totalSharedOverheadLocal / totalReceivedUnits : 0;

  const finalizedItems = [];
  for (const item of preparedItems) {
    const stockDoc = stockMap.get(item.sku);
    const destEntry = getLocationStockEntry(stockDoc, target.destinationCountry);
    const dispatchedQty = Number(item.dispatchedQty || item.approvedQty || 0);

    const baseCostAed = Number(item.unitCostAed || stockDoc?.costPrice || 0);
    const baseCostLocal =
      baseCostAed > 0
        ? baseCostAed * (Number(destCfg.fxRateFromAed) || 1)
        : 0;
    const landedCostLocal = Math.round((baseCostLocal + overheadPerUnitLocal) * 100) / 100;

    let nextPriceLocal = destEntry.priceLocal;
    if (applyPriceUpdates) {
      if (item.finalPriceLocal > 0) {
        nextPriceLocal = item.finalPriceLocal;
      } else if (nextPriceLocal <= 0) {
        const refAed = Number(item.unitPriceAed || stockDoc?.price || 0);
        nextPriceLocal = convertAedToLocalPrice(refAed, destCfg, 0);
      }
    }

    await updateLocationStock(item.sku, target.destinationCountry, {
      quantity: destEntry.quantity + item.receivedQty,
      inTransitIn: Math.max(0, destEntry.inTransitIn - dispatchedQty),
      costLocal: landedCostLocal > 0 ? landedCostLocal : destEntry.costLocal,
      priceLocal: nextPriceLocal,
      skipAudit: true,
    });

    finalizedItems.push({
      ...item,
      landedCostLocal,
      appliedPriceLocal: nextPriceLocal,
    });
  }

  const now = new Date().toISOString();
  const updated = {
    ...target,
    status: "Received",
    items: finalizedItems,
    totalReceivedUnits,
    receivedBy,
    receivedAt: now,
    customsDutyLocal: Number(customsDutyLocal) || 0,
    localLogisticsLocal: Number(localLogisticsLocal) || 0,
    destinationCurrency: destCfg.currency,
    receiveNotes: String(receiveNotes || "").trim(),
    updatedAt: now,
  };

  await persistTransferRecord(updated);

  logAuditEvent({
    module: "stock",
    action: "transfer_receive",
    severity: "info",
    targetId: transferId,
    targetLabel: `${transferId} (${target.sourceHub} → ${target.destinationCountry})`,
    summary: `Received ${totalReceivedUnits} unit(s) into [${target.destinationCountry}] ${destCfg.hubName} (Storefront Live)`,
    changes: [
      { field: "Destination Stock Added", before: target.destinationCountry, after: `+${totalReceivedUnits} pcs` },
      { field: "Customs & Clearance", before: "—", after: `${destCfg.currency} ${(Number(customsDutyLocal) + Number(localLogisticsLocal)).toLocaleString()}` },
    ],
  });

  return updated;
};

/**
 * Cancel a transfer (if In Transit, cleanly restores source hub stock and clears destination in-transit)
 */
export const cancelTransferRequest = async (
  transferId,
  { cancelledBy = "Admin", reason = "" } = {}
) => {
  const all = await fetchTransfers();
  const target = all.find((t) => t.transferId === transferId);
  if (!target) throw new Error(`Transfer ${transferId} not found.`);
  if (target.status === "Received") {
    throw new Error("Received transfers cannot be cancelled.");
  }

  if (target.status === "In Transit") {
    const stockList = await fetchStock();
    const stockMap = new Map(stockList.map((s) => [s.sku, s]));
    for (const item of target.items || []) {
      const qty = Number(item.dispatchedQty || 0);
      if (qty <= 0) continue;
      const stockDoc = stockMap.get(item.sku);
      if (!stockDoc) continue;
      const srcEntry = getLocationStockEntry(stockDoc, target.sourceHub);
      const destEntry = getLocationStockEntry(stockDoc, target.destinationCountry);

      await updateLocationStock(item.sku, target.sourceHub, {
        quantity: srcEntry.quantity + qty,
        skipAudit: true,
      });
      await updateLocationStock(item.sku, target.destinationCountry, {
        inTransitIn: Math.max(0, destEntry.inTransitIn - qty),
        skipAudit: true,
      });
    }
  }

  const now = new Date().toISOString();
  const updated = {
    ...target,
    status: "Cancelled",
    cancelledBy,
    cancelledAt: now,
    cancellationReason: String(reason || "Cancelled by staff").trim(),
    updatedAt: now,
  };

  await persistTransferRecord(updated);

  logAuditEvent({
    module: "stock",
    action: "transfer_cancel",
    severity: "critical",
    targetId: transferId,
    targetLabel: `${transferId} (${target.sourceHub} → ${target.destinationCountry})`,
    summary: `Cancelled transfer ${transferId} (${updated.cancellationReason})`,
  });

  return updated;
};

