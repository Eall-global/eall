/**
 * E-ALL IMEI / Serial Number & Warranty Registry Service (Phase 3)
 * Tracks individual serialized devices across warehouse intake, POS checkout,
 * customer warranty coverage, and RMA / service claims.
 *
 * Collection: `imei_registry` (Firestore with localStorage cache fallback)
 */
import {
  getFirebaseDb,
  isFirebaseConfigured,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
} from "../lib/firebaseClient";
import { logAuditEvent } from "./auditService";

const IMEI_CACHE_KEY = "eall_imei_registry_cache";
const COLLECTION_NAME = "imei_registry";

export const IMEI_STATUSES = [
  "In Stock",
  "Sold",
  "Warranty Claim",
  "Replaced",
  "Returned",
  "Void / Defective",
];

export const WARRANTY_TYPES = [
  "Official Manufacturer Warranty",
  "E-ALL Store Warranty",
  "Extended Care Warranty",
  "No Warranty / As-Is",
];

export const RMA_CLAIM_STATUSES = [
  "Open",
  "In Service",
  "Resolved / Repaired",
  "Unit Replaced",
  "Rejected / Out of Scope",
];

const sanitizeDocId = (serial) =>
  String(serial || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "_");

export const computeWarrantyExpiry = (startDateIso, warrantyMonths = 12) => {
  const months = Number(warrantyMonths) || 0;
  if (!startDateIso || months <= 0) return null;
  const dt = new Date(startDateIso);
  if (Number.isNaN(dt.getTime())) return null;
  dt.setMonth(dt.getMonth() + months);
  return dt.toISOString();
};

export const getWarrantyState = (record) => {
  if (!record) return { state: "unsold", label: "Unassigned", daysLeft: null, percentElapsed: 0 };
  if (record.status === "In Stock" || !record.soldAt) {
    return {
      state: "unsold",
      label: `Starts on Sale (${record.warrantyMonths ?? 12}m)`,
      daysLeft: null,
      percentElapsed: 0,
    };
  }
  const months = Number(record.warrantyMonths ?? 12);
  if (months <= 0 || !record.warrantyExpiresAt) {
    return { state: "none", label: "No Warranty", daysLeft: 0, percentElapsed: 100 };
  }

  const now = Date.now();
  const start = new Date(record.soldAt).getTime();
  const end = new Date(record.warrantyExpiresAt).getTime();
  const totalMs = Math.max(1, end - start);
  const remainingMs = end - now;
  const daysLeft = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
  const percentElapsed = Math.min(100, Math.max(0, Math.round(((now - start) / totalMs) * 100)));

  if (daysLeft <= 0) {
    return { state: "expired", label: "Expired", daysLeft: 0, percentElapsed: 100 };
  }
  if (daysLeft <= 30) {
    return {
      state: "expiring",
      label: `Expiring (${daysLeft}d left)`,
      daysLeft,
      percentElapsed,
    };
  }
  return {
    state: "active",
    label: `Active (${daysLeft}d left)`,
    daysLeft,
    percentElapsed,
  };
};

const readCache = () => {
  try {
    const raw = localStorage.getItem(IMEI_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeCache = (list) => {
  try {
    localStorage.setItem(IMEI_CACHE_KEY, JSON.stringify(list));
  } catch {
    // ignore storage quota errors
  }
};

const normalizeRecord = (raw, fallbackId = "") => {
  const serialNumber = String(raw.serialNumber || raw.imei || fallbackId || "")
    .trim()
    .toUpperCase();
  const id = raw.id || sanitizeDocId(serialNumber) || fallbackId;
  const warrantyMonths = Number(raw.warrantyMonths ?? 12);
  const soldAt = raw.soldAt || null;
  const warrantyExpiresAt =
    raw.warrantyExpiresAt ||
    (soldAt ? computeWarrantyExpiry(soldAt, warrantyMonths) : null);

  return {
    id,
    serialNumber,
    imei2: String(raw.imei2 || "").trim().toUpperCase(),
    sku: String(raw.sku || "").trim(),
    productName: raw.productName || "Device Unit",
    brand: raw.brand || "General",
    status: raw.status || "In Stock",
    supplierName: raw.supplierName || "",
    purchaseInvoiceNo: raw.purchaseInvoiceNo || "",
    costPrice: Number(raw.costPrice) || 0,
    receivedAt: raw.receivedAt || raw.createdAt || new Date().toISOString(),
    invoiceNo: raw.invoiceNo || "",
    customerName: raw.customerName || "",
    customerPhone: raw.customerPhone || "",
    customerEmail: raw.customerEmail || "",
    soldAt,
    soldBy: raw.soldBy || "",
    warrantyMonths,
    warrantyExpiresAt,
    warrantyType: raw.warrantyType || WARRANTY_TYPES[0],
    claims: Array.isArray(raw.claims) ? raw.claims : [],
    notes: raw.notes || "",
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString(),
  };
};

/**
 * Fetch all tracked IMEI / Serial units
 */
export const fetchImeiRegistry = async () => {
  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      const rows = [];
      snap.forEach((docSnap) => {
        rows.push(normalizeRecord(docSnap.data(), docSnap.id));
      });
      rows.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
      writeCache(rows);
      return rows;
    } catch (err) {
      console.warn("Firestore imei_registry fetch failed, using cache:", err.message);
    }
  }

  return readCache()
    .map((r) => normalizeRecord(r))
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
};

/**
 * Register one or multiple IMEI / Serial numbers (supports bulk paste from packing list)
 */
export const registerImeiUnits = async ({
  sku,
  productName,
  brand = "General",
  serials = [],
  imei2 = "",
  supplierName = "",
  purchaseInvoiceNo = "",
  costPrice = 0,
  warrantyMonths = 12,
  warrantyType = WARRANTY_TYPES[0],
  notes = "",
  status = "In Stock",
  invoiceNo = "",
  customerName = "",
  customerPhone = "",
  customerEmail = "",
  soldAt = null,
  soldBy = "",
}) => {
  const cleanedSerials = Array.from(
    new Set(
      (Array.isArray(serials) ? serials : [serials])
        .map((s) => String(s || "").trim().toUpperCase())
        .filter(Boolean)
    )
  );

  if (cleanedSerials.length === 0) {
    throw new Error("Please enter at least one valid IMEI or serial number.");
  }

  const existingList = await fetchImeiRegistry();
  const existingSet = new Set(existingList.map((r) => r.serialNumber));
  const duplicates = cleanedSerials.filter((s) => existingSet.has(s));
  const toCreate = cleanedSerials.filter((s) => !existingSet.has(s));

  if (toCreate.length === 0) {
    throw new Error(
      `All entered serial(s) are already registered: ${duplicates.slice(0, 3).join(", ")}`
    );
  }

  const now = new Date().toISOString();
  const createdRecords = toCreate.map((serialNumber, idx) =>
    normalizeRecord({
      id: sanitizeDocId(serialNumber),
      serialNumber,
      imei2: idx === 0 ? imei2 : "",
      sku,
      productName,
      brand,
      status,
      supplierName: supplierName.trim(),
      purchaseInvoiceNo: purchaseInvoiceNo.trim(),
      costPrice: Number(costPrice) || 0,
      receivedAt: now,
      invoiceNo,
      customerName,
      customerPhone,
      customerEmail,
      soldAt: status === "Sold" ? soldAt || now : null,
      soldBy,
      warrantyMonths: Number(warrantyMonths ?? 12),
      warrantyExpiresAt:
        status === "Sold"
          ? computeWarrantyExpiry(soldAt || now, warrantyMonths)
          : null,
      warrantyType,
      claims: [],
      notes: notes.trim(),
      createdAt: now,
      updatedAt: now,
    })
  );

  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    await Promise.all(
      createdRecords.map(async (rec) => {
        try {
          await setDoc(doc(db, COLLECTION_NAME, rec.id), rec, { merge: true });
        } catch (err) {
          console.warn(`Firestore IMEI save error (${rec.serialNumber}):`, err.message);
        }
      })
    );
  }

  const nextCache = [...createdRecords, ...existingList];
  writeCache(nextCache);

  logAuditEvent({
    module: "warranty",
    action: "create",
    severity: "info",
    targetId: createdRecords.length === 1 ? createdRecords[0].serialNumber : sku || "BATCH",
    targetLabel:
      createdRecords.length === 1
        ? `${createdRecords[0].serialNumber} • ${productName}`
        : `${createdRecords.length} units • ${productName}`,
    summary: `Registered ${createdRecords.length} IMEI/Serial unit(s) for ${productName} (${sku})`,
    changes: [
      { field: "Units Registered", before: "0", after: String(createdRecords.length) },
      { field: "Status", before: "—", after: status },
      ...(supplierName ? [{ field: "Supplier", before: "—", after: supplierName }] : []),
    ],
  });

  return { created: createdRecords, skippedDuplicates: duplicates };
};

/**
 * Automatically link & activate warranty for IMEI/Serial numbers sold on a POS invoice.
 * Updates existing In-Stock serials to Sold, or creates fresh Sold records if scanned at checkout.
 */
export const markImeisSoldForInvoice = async ({
  serialEntries = [], // [{ serialNumber, sku, productName, brand, costPrice, warrantyMonths }]
  invoiceNo,
  customerName,
  customerPhone = "",
  customerEmail = "",
  soldAt = new Date().toISOString(),
  soldBy = "Sales Executive",
}) => {
  const validEntries = (serialEntries || [])
    .map((entry) => ({
      ...entry,
      serialNumber: String(entry.serialNumber || "").trim().toUpperCase(),
    }))
    .filter((entry) => entry.serialNumber.length > 0);

  if (validEntries.length === 0) return [];

  const existingList = await fetchImeiRegistry();
  const bySerial = new Map(existingList.map((r) => [r.serialNumber, r]));
  const db = getFirebaseDb();
  const updatedOrCreated = [];
  const now = new Date().toISOString();

  for (const entry of validEntries) {
    const existing = bySerial.get(entry.serialNumber);
    const warrantyMonths = Number(entry.warrantyMonths ?? existing?.warrantyMonths ?? 12);
    const warrantyExpiresAt = computeWarrantyExpiry(soldAt, warrantyMonths);

    const record = normalizeRecord({
      ...(existing || {}),
      id: existing?.id || sanitizeDocId(entry.serialNumber),
      serialNumber: entry.serialNumber,
      sku: entry.sku || existing?.sku || "",
      productName: entry.productName || existing?.productName || "Device Unit",
      brand: entry.brand || existing?.brand || "General",
      costPrice: Number(entry.costPrice ?? existing?.costPrice ?? 0),
      status: "Sold",
      invoiceNo,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim(),
      soldAt,
      soldBy,
      warrantyMonths,
      warrantyExpiresAt,
      warrantyType: existing?.warrantyType || WARRANTY_TYPES[0],
      updatedAt: now,
    });

    if (db && isFirebaseConfigured()) {
      try {
        await setDoc(doc(db, COLLECTION_NAME, record.id), record, { merge: true });
      } catch (err) {
        console.warn(`Firestore IMEI sale-link failed (${record.serialNumber}):`, err.message);
      }
    }

    bySerial.set(record.serialNumber, record);
    updatedOrCreated.push(record);
  }

  const nextCache = Array.from(bySerial.values()).sort(
    (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
  );
  writeCache(nextCache);

  logAuditEvent({
    module: "warranty",
    action: "status_change",
    severity: "info",
    targetId: invoiceNo,
    targetLabel: `${invoiceNo} • ${updatedOrCreated.length} IMEI(s)`,
    summary: `Activated warranty on ${updatedOrCreated.length} serialized unit(s) sold via ${invoiceNo} to ${customerName}`,
    changes: [
      {
        field: "Serials Bound",
        before: "In Stock",
        after: updatedOrCreated.map((r) => r.serialNumber).join(", "),
      },
      { field: "Invoice", before: "—", after: invoiceNo },
    ],
  });

  return updatedOrCreated;
};

/**
 * Update an existing IMEI / Warranty record
 */
export const updateImeiRecord = async (recordId, updates = {}) => {
  const existingList = await fetchImeiRegistry();
  const existing = existingList.find(
    (r) => r.id === recordId || r.serialNumber === String(recordId).toUpperCase()
  );
  if (!existing) throw new Error(`IMEI record "${recordId}" not found.`);

  const now = new Date().toISOString();
  const nextStatus = updates.status ?? existing.status;
  const nextWarrantyMonths = Number(
    updates.warrantyMonths !== undefined ? updates.warrantyMonths : existing.warrantyMonths
  );
  const nextSoldAt =
    updates.soldAt !== undefined
      ? updates.soldAt
      : nextStatus === "Sold" && !existing.soldAt
      ? now
      : existing.soldAt;

  const nextWarrantyExpiresAt =
    updates.warrantyExpiresAt !== undefined
      ? updates.warrantyExpiresAt
      : nextSoldAt
      ? computeWarrantyExpiry(nextSoldAt, nextWarrantyMonths)
      : null;

  const updated = normalizeRecord({
    ...existing,
    ...updates,
    status: nextStatus,
    soldAt: nextSoldAt,
    warrantyMonths: nextWarrantyMonths,
    warrantyExpiresAt: nextWarrantyExpiresAt,
    updatedAt: now,
  });

  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      await setDoc(doc(db, COLLECTION_NAME, updated.id), updated, { merge: true });
    } catch (err) {
      console.warn("Firestore IMEI update failed:", err.message);
    }
  }

  const nextCache = existingList.map((r) => (r.id === updated.id ? updated : r));
  writeCache(nextCache);

  const changes = [];
  if (existing.status !== updated.status) {
    changes.push({ field: "Status", before: existing.status, after: updated.status });
  }
  if (existing.warrantyMonths !== updated.warrantyMonths) {
    changes.push({
      field: "Warranty Term",
      before: `${existing.warrantyMonths}m`,
      after: `${updated.warrantyMonths}m`,
    });
  }
  if (existing.customerName !== updated.customerName) {
    changes.push({
      field: "Customer",
      before: existing.customerName || "—",
      after: updated.customerName || "—",
    });
  }

  logAuditEvent({
    module: "warranty",
    action: existing.status !== updated.status ? "status_change" : "update",
    severity:
      updated.status === "Warranty Claim" || updated.status === "Void / Defective"
        ? "warning"
        : "info",
    targetId: updated.serialNumber,
    targetLabel: `${updated.serialNumber} • ${updated.productName}`,
    summary: `Updated IMEI ${updated.serialNumber} (${existing.status} → ${updated.status})`,
    changes: changes.length ? changes : [{ field: "Record", before: "Updated", after: updated.status }],
  });

  return updated;
};

/**
 * Open or resolve an RMA / Warranty Claim on a tracked unit
 */
export const logWarrantyClaim = async (
  recordId,
  {
    issue,
    claimStatus = "Open",
    resolution = "",
    replacementSerial = "",
    updatedBy = "Staff",
  }
) => {
  if (!issue?.trim()) throw new Error("Please describe the warranty issue or service action.");

  const existingList = await fetchImeiRegistry();
  const existing = existingList.find((r) => r.id === recordId);
  if (!existing) throw new Error(`IMEI record "${recordId}" not found.`);

  const now = new Date().toISOString();
  const claimEntry = {
    id: `RMA-${Date.now().toString().slice(-6)}`,
    openedAt: now,
    issue: issue.trim(),
    claimStatus,
    resolution: resolution.trim(),
    replacementSerial: replacementSerial.trim().toUpperCase(),
    updatedBy,
  };

  let nextUnitStatus = existing.status;
  if (claimStatus === "Open" || claimStatus === "In Service") {
    nextUnitStatus = "Warranty Claim";
  } else if (claimStatus === "Unit Replaced") {
    nextUnitStatus = "Replaced";
  } else if (claimStatus === "Resolved / Repaired") {
    nextUnitStatus = "Sold";
  }

  const nextClaims = [claimEntry, ...(existing.claims || [])];

  const updated = normalizeRecord({
    ...existing,
    status: nextUnitStatus,
    claims: nextClaims,
    updatedAt: now,
  });

  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      await setDoc(doc(db, COLLECTION_NAME, updated.id), updated, { merge: true });
    } catch (err) {
      console.warn("Firestore RMA claim save failed:", err.message);
    }
  }

  const nextCache = existingList.map((r) => (r.id === updated.id ? updated : r));
  writeCache(nextCache);

  logAuditEvent({
    module: "warranty",
    action: "status_change",
    severity: claimStatus === "Open" ? "warning" : "info",
    targetId: updated.serialNumber,
    targetLabel: `${claimEntry.id} • ${updated.serialNumber}`,
    summary: `Logged RMA ${claimEntry.id} (${claimStatus}) for ${updated.productName} [${updated.serialNumber}]`,
    changes: [
      { field: "RMA Status", before: existing.status, after: `${claimStatus} (${nextUnitStatus})` },
      { field: "Issue", before: "—", after: issue.trim().slice(0, 80) },
      ...(replacementSerial
        ? [{ field: "Replacement IMEI", before: "—", after: replacementSerial.trim().toUpperCase() }]
        : []),
    ],
  });

  return updated;
};

/**
 * Permanently delete an IMEI registry entry (Admin only)
 */
export const deleteImeiRecord = async (recordId) => {
  const existingList = await fetchImeiRegistry();
  const existing = existingList.find((r) => r.id === recordId);

  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, recordId));
    } catch (err) {
      console.warn("Firestore IMEI delete failed:", err.message);
    }
  }

  const nextCache = existingList.filter((r) => r.id !== recordId);
  writeCache(nextCache);

  logAuditEvent({
    module: "warranty",
    action: "delete",
    severity: "critical",
    targetId: existing?.serialNumber || recordId,
    targetLabel: existing
      ? `${existing.serialNumber} • ${existing.productName}`
      : recordId,
    summary: `Deleted IMEI registry record ${existing?.serialNumber || recordId}`,
    changes: [
      { field: "Status", before: existing?.status || "Unknown", after: "Deleted" },
    ],
  });

  return true;
};

