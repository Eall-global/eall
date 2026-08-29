/**
 * E-ALL B2B & Enterprise Wholesale RFQ Service
 * Synchronizes procurement requests with Cloud Firestore
 */
import {
  getFirebaseDb,
  isFirebaseConfigured,
  collection,
  doc,
  setDoc,
  getDocs,
} from "../lib/firebaseClient";

const RFQ_STORAGE_KEY = "eall_b2b_rfqs_cache";

/**
 * Submit a Formal Request For Quotation (RFQ)
 * @param {Object} rfqData
 * @returns {Object} Saved RFQ record with generated ticket ID
 */
export const submitRFQ = async (rfqData) => {
  const rfqId = `RFQ-2026-${Math.floor(10000 + Math.random() * 90000)}`;

  const record = {
    rfqId,
    companyName: rfqData.companyName || "Independent Business",
    trnNumber: rfqData.trnNumber || "",
    businessType: rfqData.businessType || "Wholesaler / Distributor",
    contactName: rfqData.contactName || "",
    email: rfqData.email || "",
    phone: rfqData.phone || "",
    destinationCountry: rfqData.destinationCountry || "United Arab Emirates",
    destinationCity: rfqData.destinationCity || "Dubai",
    incoterms: rfqData.incoterms || "EXW (Dubai Warehouse)",
    productsRequired: rfqData.productsRequired || "",
    estimatedVolume: rfqData.estimatedVolume || "50-100 Units",
    additionalNotes: rfqData.additionalNotes || "",
    status: "Pending Executive Review",
    createdAt: new Date().toISOString(),
  };

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
      await setDoc(doc(db, "b2b_rfqs", rfqId), record);
    } catch (e) {
      console.warn("Could not sync RFQ to Firestore:", e);
    }
  }

  return record;
};

/**
 * Fetch all RFQs (Admin Portal)
 */
export const fetchAllRFQs = async () => {
  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      const snap = await getDocs(collection(db, "b2b_rfqs"));
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      localStorage.setItem(RFQ_STORAGE_KEY, JSON.stringify(list));
      return list;
    } catch (e) {
      console.warn("Could not fetch RFQs from Firestore:", e);
    }
  }

  try {
    const local = localStorage.getItem(RFQ_STORAGE_KEY);
    if (local) return JSON.parse(local);
  } catch {
    // fallback
  }

  return [];
};
