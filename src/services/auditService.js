/**
 * E-ALL Portal Immutable Audit Trail & Security Activity Service
 * Persists audit events to Firebase Firestore ("audit_logs") with localStorage fallback.
 */
import {
  getFirebaseDb,
  isFirebaseConfigured,
  collection,
  doc,
  getDocs,
  setDoc,
} from "../lib/firebaseClient";

const AUDIT_STORAGE_KEY = "eall_portal_audit_logs";
const STAFF_SESSION_KEY = "eall_staff_auth_session";
const COLLECTION_NAME = "audit_logs";
const MAX_LOCAL_LOGS = 500;

const getCurrentSessionActor = () => {
  try {
    const raw = localStorage.getItem(STAFF_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        name: parsed?.name || "System",
        role: parsed?.role || "admin",
        id: parsed?.id || "system",
      };
    }
  } catch {
    // ignore storage read errors
  }
  return { name: "System", role: "admin", id: "system" };
};

const getLocalAuditLogs = () => {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalAuditLogs = (logs) => {
  try {
    localStorage.setItem(
      AUDIT_STORAGE_KEY,
      JSON.stringify(logs.slice(0, MAX_LOCAL_LOGS))
    );
  } catch {
    // ignore storage quota errors
  }
};

/**
 * Record an immutable audit trail event (never throws to avoid blocking core operations)
 * @param {Object} entry
 */
export const logAuditEvent = async ({
  module = "system",
  action = "update",
  severity = "info", // info | warning | critical
  targetId = "",
  targetLabel = "",
  summary = "",
  changes = [], // Array<{ field, before, after }>
  actor = null,
} = {}) => {
  try {
    const resolvedActor = actor || getCurrentSessionActor();
    const now = new Date().toISOString();
    const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
    const id = `AUD-${Date.now()}-${rand}`;

    const record = {
      id,
      timestamp: now,
      actorId: resolvedActor.id || "system",
      actorName: resolvedActor.name || "System",
      actorRole: resolvedActor.role || "admin",
      module: String(module),
      action: String(action),
      severity: ["info", "warning", "critical"].includes(severity)
        ? severity
        : "info",
      targetId: String(targetId || ""),
      targetLabel: String(targetLabel || targetId || ""),
      summary: String(summary || `${action} on ${module}`),
      changes: Array.isArray(changes)
        ? changes.map((c) => ({
            field: String(c.field ?? ""),
            before: c.before === undefined || c.before === null ? "—" : String(c.before),
            after: c.after === undefined || c.after === null ? "—" : String(c.after),
          }))
        : [],
    };

    // Persist locally immediately
    const existing = getLocalAuditLogs();
    saveLocalAuditLogs([record, ...existing]);

    // Sync to Firestore if connected
    const db = getFirebaseDb();
    if (db && isFirebaseConfigured()) {
      try {
        await setDoc(doc(db, COLLECTION_NAME, id), record);
      } catch (err) {
        console.warn("Firestore audit log write skipped:", err?.message || err);
      }
    }

    return record;
  } catch (err) {
    console.warn("Audit logging skipped:", err);
    return null;
  }
};

/**
 * Fetch all audit logs (Firestore primary, localStorage fallback)
 */
export const fetchAuditLogs = async () => {
  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      if (!snap.empty) {
        const list = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: data.id || docSnap.id,
            timestamp: data.timestamp || data.createdAt || new Date().toISOString(),
            actorId: data.actorId || "system",
            actorName: data.actorName || "System",
            actorRole: data.actorRole || "admin",
            module: data.module || "system",
            action: data.action || "update",
            severity: data.severity || "info",
            targetId: data.targetId || "",
            targetLabel: data.targetLabel || data.targetId || "",
            summary: data.summary || "",
            changes: Array.isArray(data.changes) ? data.changes : [],
          });
        });

        list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        saveLocalAuditLogs(list);
        return list;
      }
    } catch (err) {
      console.warn("Firestore audit logs fetch warning:", err?.message || err);
    }
  }

  const local = getLocalAuditLogs();
  local.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return local;
};

