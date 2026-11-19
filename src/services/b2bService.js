/**
 * E-ALL B2B & Enterprise Wholesale RFQ Service
 * Synchronizes procurement requests with Cloud Firestore ("b2b_rfqs")
 */
import {
  getFirebaseDb,
  isFirebaseConfigured,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
} from "../lib/firebaseClient";
import { logAuditEvent } from "./auditService";

const RFQ_STORAGE_KEY = "eall_b2b_rfqs_cache";
const COLLECTION_NAME = "b2b_rfqs";

export const RFQ_STATUSES = [
  "Pending Executive Review",
  "In Review",
  "Quoted",
  "Negotiating",
  "Won / Approved",
  "Closed / Lost",
];

export const INCOTERM_OPTIONS = [
  "EXW (Dubai Warehouse)",
  "FOB (Jebel Ali / DXB)",
  "CIF (Destination Port)",
  "DDP (Door Delivery)",
];

const normalizeRfq = (raw, fallbackId = "") => {
  const rfqId = raw.rfqId || raw.id || fallbackId;
  return {
    id: rfqId,
    rfqId,
    companyName: raw.companyName || "Independent Business",
    trnNumber: raw.trnNumber || "",
    businessType: raw.businessType || "Wholesaler / Distributor",
    contactName: raw.contactName || "",
    email: raw.email || "",
    phone: raw.phone || "",
    destinationCountry: raw.destinationCountry || "United Arab Emirates",
    destinationCity: raw.destinationCity || "Dubai",
    incoterms: raw.incoterms || "EXW (Dubai Warehouse)",
    productsRequired: raw.productsRequired || "",
    estimatedVolume: raw.estimatedVolume || "50-100 Units",
    additionalNotes: raw.additionalNotes || "",
    status: raw.status || "Pending Executive Review",
    quotedAmount: Number(raw.quotedAmount || 0) || 0,
    quoteRef: raw.quoteRef || "",
    assignedTo: raw.assignedTo || "",
    internalNotes: raw.internalNotes || "",
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || null,
    updatedBy: raw.updatedBy || null,
  };
};

/**
 * Submit a Formal Request For Quotation (RFQ) from public B2B page or Portal Sales Desk
 */
export const submitRFQ = async (rfqData, { fromPortal = false } = {}) => {
  const rfqId = `RFQ-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

  const record = normalizeRfq({
    ...rfqData,
    rfqId,
    status: rfqData.status || "Pending Executive Review",
    createdAt: new Date().toISOString(),
  });

  // Cache locally
  try {
    const existing = JSON.parse(localStorage.getItem(RFQ_STORAGE_KEY) || "[]");
    localStorage.setItem(RFQ_STORAGE_KEY, JSON.stringify([record, ...existing]));
  } catch (err) {
    console.warn("Could not cache RFQ locally:", err);
  }

  // Cloud Firestore persistence
  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      await setDoc(doc(db, COLLECTION_NAME, rfqId), record);
    } catch (e) {
      console.warn("Could not sync RFQ to Firestore:", e);
    }
  }

  if (fromPortal) {
    logAuditEvent({
      module: "rfqs",
      action: "create",
      severity: "info",
      targetId: rfqId,
      targetLabel: `${rfqId} • ${record.companyName}`,
      summary: `Logged B2B RFQ ${rfqId} for ${record.companyName} (${record.estimatedVolume})`,
      changes: [
        { field: "Company", before: "—", after: record.companyName },
        { field: "Incoterms", before: "—", after: record.incoterms },
      ],
    });
  }

  return record;
};

/**
 * Fetch all RFQs (Admin / Sales Portal)
 */
export const fetchAllRFQs = async () => {
  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      const list = [];
      snap.forEach((d) => list.push(normalizeRfq(d.data(), d.id)));
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      localStorage.setItem(RFQ_STORAGE_KEY, JSON.stringify(list));
      return list;
    } catch (e) {
      console.warn("Could not fetch RFQs from Firestore:", e);
    }
  }

  try {
    const local = localStorage.getItem(RFQ_STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      return Array.isArray(parsed) ? parsed.map((r) => normalizeRfq(r)) : [];
    }
  } catch {
    // fallback
  }

  return [];
};

/**
 * Update RFQ pipeline status, quoted AED value, assigned account manager & internal notes
 */
export const updateRFQ = async (rfqId, updates = {}) => {
  const all = await fetchAllRFQs();
  const existing = all.find((r) => r.rfqId === rfqId || r.id === rfqId);
  if (!existing) throw new Error(`RFQ ${rfqId} not found.`);

  const now = new Date().toISOString();
  const updated = normalizeRfq({
    ...existing,
    ...updates,
    rfqId: existing.rfqId,
    quotedAmount:
      updates.quotedAmount !== undefined
        ? Number(updates.quotedAmount) || 0
        : existing.quotedAmount,
    updatedAt: now,
  });

  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      await setDoc(doc(db, COLLECTION_NAME, existing.rfqId), updated, { merge: true });
    } catch (e) {
      console.warn("Could not update RFQ in Firestore:", e);
    }
  }

  const nextList = all.map((r) => (r.rfqId === existing.rfqId ? updated : r));
  try {
    localStorage.setItem(RFQ_STORAGE_KEY, JSON.stringify(nextList));
  } catch {
    // ignore quota errors
  }

  const changes = [];
  if (existing.status !== updated.status) {
    changes.push({ field: "Pipeline Stage", before: existing.status, after: updated.status });
  }
  if (Number(existing.quotedAmount) !== Number(updated.quotedAmount)) {
    changes.push({
      field: "Quoted Amount",
      before: `AED ${Number(existing.quotedAmount).toFixed(2)}`,
      after: `AED ${Number(updated.quotedAmount).toFixed(2)}`,
    });
  }
  if (existing.assignedTo !== updated.assignedTo) {
    changes.push({
      field: "Assigned To",
      before: existing.assignedTo || "Unassigned",
      after: updated.assignedTo || "Unassigned",
    });
  }

  if (changes.length > 0) {
    logAuditEvent({
      module: "rfqs",
      action: existing.status !== updated.status ? "status_change" : "update",
      severity: updated.status === "Won / Approved" ? "info" : "info",
      targetId: updated.rfqId,
      targetLabel: `${updated.rfqId} • ${updated.companyName}`,
      summary: `Updated B2B RFQ ${updated.rfqId} (${updated.companyName}) → ${updated.status}`,
      changes,
    });
  }

  return updated;
};

/**
 * Delete an RFQ record (Admin only)
 */
export const deleteRFQ = async (rfqId) => {
  const all = await fetchAllRFQs();
  const target = all.find((r) => r.rfqId === rfqId || r.id === rfqId);

  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, rfqId));
    } catch (e) {
      console.warn("Could not delete RFQ from Firestore:", e);
    }
  }

  const remaining = all.filter((r) => r.rfqId !== rfqId && r.id !== rfqId);
  try {
    localStorage.setItem(RFQ_STORAGE_KEY, JSON.stringify(remaining));
  } catch {
    // ignore quota errors
  }

  if (target) {
    logAuditEvent({
      module: "rfqs",
      action: "delete",
      severity: "critical",
      targetId: target.rfqId,
      targetLabel: `${target.rfqId} • ${target.companyName}`,
      summary: `Deleted B2B RFQ ${target.rfqId} (${target.companyName})`,
      changes: [{ field: "RFQ Status", before: target.status, after: "Deleted" }],
    });
  }

  return remaining;
};
