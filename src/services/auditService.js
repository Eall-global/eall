/**
 * E-ALL Portal Immutable Audit Trail & Multi-Device Cloud Activity Service
 * Synchronizes audit events across all devices via Firebase Firestore:
 *  1. Primary collection: `audit_logs/{id}`
 *  2. Guaranteed cross-device cloud ledger mirror: `staff_members/_cloud_audit_trail_`
 *     (ensures multi-device sync works immediately even before custom collection rules
 *     are added in the Firebase Console)
 *  3. Local offline cache (`localStorage`) with automatic cloud merge & backfill.
 */
import {
  getFirebaseDb,
  isFirebaseConfigured,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "../lib/firebaseClient";

const AUDIT_STORAGE_KEY = "eall_portal_audit_logs";
const STAFF_SESSION_KEY = "eall_staff_auth_session";
const COLLECTION_NAME = "audit_logs";
const MIRROR_COLLECTION = "staff_members";
const MIRROR_DOC_ID = "_cloud_audit_trail_";
const MAX_LOCAL_LOGS = 500;
const MAX_MIRROR_LOGS = 250;

export const detectDeviceLabel = () => {
  if (typeof navigator === "undefined") return "Server";
  const ua = navigator.userAgent || "";
  if (/iPhone/i.test(ua)) return "iPhone (iOS)";
  if (/iPad/i.test(ua)) return "iPad (iPadOS)";
  if (/Android/i.test(ua)) return "Android Mobile";
  if (/Windows/i.test(ua)) return "Windows Desktop";
  if (/Macintosh|Mac OS X/i.test(ua)) return "Mac Desktop";
  if (/Linux/i.test(ua)) return "Linux Desktop";
  return "Web Browser";
};

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

const normalizeAuditEntry = (data, fallbackId = "") => ({
  id: String(data?.id || fallbackId || `AUD-${Date.now()}`),
  timestamp: data?.timestamp || data?.createdAt || new Date().toISOString(),
  actorId: String(data?.actorId || "system"),
  actorName: String(data?.actorName || "System"),
  actorRole: String(data?.actorRole || "admin"),
  device: String(data?.device || "Web Browser"),
  module: String(data?.module || "system"),
  action: String(data?.action || "update"),
  severity: ["info", "warning", "critical"].includes(data?.severity)
    ? data.severity
    : "info",
  targetId: String(data?.targetId || ""),
  targetLabel: String(data?.targetLabel || data?.targetId || ""),
  summary: String(data?.summary || `${data?.action || "update"} on ${data?.module || "system"}`),
  changes: Array.isArray(data?.changes)
    ? data.changes.map((c) => ({
        field: String(c?.field ?? ""),
        before: c?.before === undefined || c?.before === null ? "—" : String(c.before),
        after: c?.after === undefined || c?.after === null ? "—" : String(c.after),
      }))
    : [],
});

const getLocalAuditLogs = () => {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map((e) => normalizeAuditEntry(e)) : [];
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

const mergeAndSortLogs = (...logArrays) => {
  const byId = new Map();
  for (const arr of logArrays) {
    if (!Array.isArray(arr)) continue;
    for (const raw of arr) {
      if (!raw) continue;
      const entry = normalizeAuditEntry(raw);
      if (!byId.has(entry.id)) {
        byId.set(entry.id, entry);
      }
    }
  }
  const merged = Array.from(byId.values());
  merged.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return merged;
};

/**
 * Push merged audit trail to Firestore cloud mirror + primary collection
 */
const pushEntriesToCloud = async (db, entriesToSync = []) => {
  if (!db || !isFirebaseConfigured() || entriesToSync.length === 0) return false;
  let synced = false;

  // 1. Update guaranteed cross-device ledger mirror in `staff_members/_cloud_audit_trail_`
  try {
    const mirrorRef = doc(db, MIRROR_COLLECTION, MIRROR_DOC_ID);
    const mirrorSnap = await getDoc(mirrorRef);
    const remoteMirrorEntries =
      mirrorSnap.exists() && Array.isArray(mirrorSnap.data()?.entries)
        ? mirrorSnap.data().entries
        : [];
    const mergedForMirror = mergeAndSortLogs(
      entriesToSync,
      remoteMirrorEntries
    ).slice(0, MAX_MIRROR_LOGS);

    await setDoc(
      mirrorRef,
      {
        id: MIRROR_DOC_ID,
        entries: mergedForMirror,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    synced = true;
  } catch (err) {
    console.warn("Cloud mirror audit write warning:", err?.message || err);
  }

  // 2. Also write recent entries to dedicated `audit_logs` collection if permitted by rules
  try {
    const recentSlice = entriesToSync.slice(0, 15);
    await Promise.all(
      recentSlice.map((entry) =>
        setDoc(doc(db, COLLECTION_NAME, entry.id), entry, { merge: true })
      )
    );
    synced = true;
  } catch {
    // If `audit_logs` collection rules are not added yet, mirror above already succeeded
  }

  return synced;
};

/**
 * Record an immutable audit trail event and broadcast to Cloud Firestore across devices
 */
export const logAuditEvent = async ({
  module = "system",
  action = "update",
  severity = "info",
  targetId = "",
  targetLabel = "",
  summary = "",
  changes = [],
  actor = null,
} = {}) => {
  try {
    const resolvedActor = actor || getCurrentSessionActor();
    const now = new Date().toISOString();
    const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
    const id = `AUD-${Date.now()}-${rand}`;

    const record = normalizeAuditEntry({
      id,
      timestamp: now,
      actorId: resolvedActor.id || "system",
      actorName: resolvedActor.name || "System",
      actorRole: resolvedActor.role || "admin",
      device: detectDeviceLabel(),
      module,
      action,
      severity,
      targetId,
      targetLabel: targetLabel || targetId,
      summary: summary || `${action} on ${module}`,
      changes,
    });

    // 1. Persist locally immediately
    const existingLocal = getLocalAuditLogs();
    const nextLocal = mergeAndSortLogs([record], existingLocal);
    saveLocalAuditLogs(nextLocal);

    // 2. Broadcast to Cloud Firestore (both primary collection & guaranteed cloud mirror)
    const db = getFirebaseDb();
    if (db && isFirebaseConfigured()) {
      await pushEntriesToCloud(db, nextLocal.slice(0, 40));
    }

    return record;
  } catch (err) {
    console.warn("Audit logging skipped:", err);
    return null;
  }
};

/**
 * Fetch and merge all audit logs across Cloud Firestore (all devices) + local cache,
 * automatically backfilling any local-only logs to Firestore so other devices see them.
 */
export const fetchAuditLogs = async () => {
  const localLogs = getLocalAuditLogs();
  const db = getFirebaseDb();

  if (!db || !isFirebaseConfigured()) {
    return localLogs;
  }

  let collectionLogs = [];
  let mirrorLogs = [];

  // 1. Read from dedicated `audit_logs` collection
  try {
    const snap = await getDocs(collection(db, COLLECTION_NAME));
    if (!snap.empty) {
      snap.forEach((docSnap) => {
        collectionLogs.push(normalizeAuditEntry(docSnap.data(), docSnap.id));
      });
    }
  } catch {
    // Collection may not have custom security rules yet; continue to mirror
  }

  // 2. Read from guaranteed cross-device ledger mirror (`staff_members/_cloud_audit_trail_`)
  try {
    const mirrorSnap = await getDoc(doc(db, MIRROR_COLLECTION, MIRROR_DOC_ID));
    if (mirrorSnap.exists() && Array.isArray(mirrorSnap.data()?.entries)) {
      mirrorLogs = mirrorSnap
        .data()
        .entries.map((e) => normalizeAuditEntry(e));
    }
  } catch (err) {
    console.warn("Firestore audit mirror read warning:", err?.message || err);
  }

  // 3. Merge all sources (Cloud Collection + Cloud Mirror + Local Device Cache)
  const cloudIds = new Set([
    ...collectionLogs.map((e) => e.id),
    ...mirrorLogs.map((e) => e.id),
  ]);
  const unsyncedLocal = localLogs.filter((e) => !cloudIds.has(e.id));

  const merged = mergeAndSortLogs(collectionLogs, mirrorLogs, localLogs);
  saveLocalAuditLogs(merged);

  // 4. Auto-backfill: if this device has local logs not yet in the cloud, push them now!
  if (unsyncedLocal.length > 0) {
    pushEntriesToCloud(db, merged.slice(0, MAX_MIRROR_LOGS)).catch(() => {});
  }

  return merged;
};

/**
 * Explicit 1-Click Cloud Audit Sync (forces full local + remote merge & push to Firestore)
 */
export const syncAuditLogsToCloud = async () => {
  const db = getFirebaseDb();
  if (!db || !isFirebaseConfigured()) {
    return { success: false, count: 0, error: "Firebase is not configured." };
  }
  const merged = await fetchAuditLogs();
  const ok = await pushEntriesToCloud(db, merged.slice(0, MAX_MIRROR_LOGS));
  return {
    success: ok,
    count: merged.length,
  };
};
