import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getFirebaseDb,
  isFirebaseConfigured,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from "../lib/firebaseClient";
import { logAuditEvent } from "../services/auditService";

const StaffAuthContext = createContext(null);

const DEFAULT_MEMBERS = [
  {
    id: "admin",
    name: "E-ALL Admin",
    role: "admin",
    title: "Master Administrator",
    pin: "8888",
    phone: "+971 4 000 0000",
    email: "admin@eall.ae",
    branch: "Dubai Silicon Oasis HQ",
    assignedLocation: "ALL",
    commissionRate: 0,
    status: "active",
  },
  {
    id: "sales-1",
    name: "Iftikhar - Account Manager",
    role: "sales",
    title: "Account Manager",
    pin: "1234",
    phone: "",
    email: "",
    branch: "Dubai Silicon Oasis HQ",
    assignedLocation: "AE",
    commissionRate: 2,
    status: "active",
  },
  {
    id: "sales-2",
    name: "Hidayat - Procurement Manager",
    role: "hub_manager",
    title: "Procurement & Hub Manager",
    pin: "2345",
    phone: "",
    email: "",
    branch: "Dubai Silicon Oasis HQ",
    assignedLocation: "AE",
    commissionRate: 1.5,
    status: "active",
  },
  {
    id: "sales-3",
    name: "Yafey - Sales Executive",
    role: "sales",
    title: "Sales Executive",
    pin: "3456",
    phone: "",
    email: "",
    branch: "Dubai Silicon Oasis HQ",
    assignedLocation: "AE",
    commissionRate: 2.5,
    status: "active",
  },
];

const SESSION_KEY = "eall_staff_auth_session";
const MEMBERS_KEY = "eall_staff_team_members";
const COLLECTION_NAME = "staff_members";

const sanitizeMemberForDb = (m) => {
  const role = String(m.role || "sales");
  const defaultLoc = role === "admin" ? "ALL" : "AE";
  const assignedLocation = String(m.assignedLocation || defaultLoc).trim().toUpperCase();
  return {
    id: String(m.id),
    name: String(m.name || "").trim(),
    role,
    title: String(m.title || (role === "admin" ? "Master Administrator" : "Sales Executive")).trim(),
    pin: String(m.pin || "").trim(),
    phone: String(m.phone || "").trim(),
    email: String(m.email || "").trim(),
    branch: String(m.branch || "Dubai Silicon Oasis HQ").trim(),
    assignedLocation,
    commissionRate: Number(m.commissionRate ?? 0) || 0,
    status: m.status === "suspended" ? "suspended" : "active",
    joinedAt: m.joinedAt || m.createdAt || m.created_at || new Date().toISOString(),
    lastLoginAt: m.lastLoginAt || null,
    createdAt: m.createdAt || m.created_at || new Date().toISOString(),
  };
};

export const StaffAuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [members, setMembers] = useState(() => {
    try {
      const stored = localStorage.getItem(MEMBERS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed.map(sanitizeMemberForDb) : DEFAULT_MEMBERS.map(sanitizeMemberForDb);
      }
      return DEFAULT_MEMBERS.map(sanitizeMemberForDb);
    } catch {
      return DEFAULT_MEMBERS.map(sanitizeMemberForDb);
    }
  });

  // Fetch / Sync staff members from Firestore
  const loadStaffFromDatabase = useCallback(async () => {
    const db = getFirebaseDb();
    if (db && isFirebaseConfigured()) {
      try {
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));
        if (!snapshot.empty) {
          const list = [];
          snapshot.forEach((docSnap) => {
            if (docSnap.id.startsWith("_")) return;
            list.push(sanitizeMemberForDb({ id: docSnap.id, ...docSnap.data() }));
          });
          list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
          setMembers(list);
          localStorage.setItem(MEMBERS_KEY, JSON.stringify(list));
        } else {
          const batch = writeBatch(db);
          const toSeed = DEFAULT_MEMBERS.map(sanitizeMemberForDb);
          toSeed.forEach((m) => {
            batch.set(doc(db, COLLECTION_NAME, m.id), m);
          });
          await batch.commit();
          setMembers(toSeed);
          localStorage.setItem(MEMBERS_KEY, JSON.stringify(toSeed));
        }
      } catch (err) {
        console.warn("Could not sync staff from Firestore:", err);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    const db = getFirebaseDb();

    const syncInitial = async () => {
      if (db && isFirebaseConfigured()) {
        try {
          const snapshot = await getDocs(collection(db, COLLECTION_NAME));
          if (!active) return;
          if (!snapshot.empty) {
            const list = [];
            snapshot.forEach((docSnap) => {
              if (docSnap.id.startsWith("_")) return;
              list.push(sanitizeMemberForDb({ id: docSnap.id, ...docSnap.data() }));
            });
            list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
            setMembers(list);
            localStorage.setItem(MEMBERS_KEY, JSON.stringify(list));
          } else {
            const batch = writeBatch(db);
            const toSeed = DEFAULT_MEMBERS.map(sanitizeMemberForDb);
            toSeed.forEach((m) => {
              batch.set(doc(db, COLLECTION_NAME, m.id), m);
            });
            await batch.commit();
            if (!active) return;
            setMembers(toSeed);
            localStorage.setItem(MEMBERS_KEY, JSON.stringify(toSeed));
          }
        } catch (err) {
          console.warn("Could not sync staff from Firestore:", err);
        }
      }
    };

    syncInitial();

    if (db && isFirebaseConfigured()) {
      try {
        const unsubscribe = onSnapshot(
          collection(db, COLLECTION_NAME),
          (snapshot) => {
            if (!active || snapshot.empty) return;
            const list = [];
            snapshot.forEach((docSnap) => {
              if (docSnap.id.startsWith("_")) return;
              list.push(sanitizeMemberForDb({ id: docSnap.id, ...docSnap.data() }));
            });
            list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
            setMembers(list);
            localStorage.setItem(MEMBERS_KEY, JSON.stringify(list));
          },
          (err) => {
            console.warn("Firestore staff onSnapshot warning:", err);
          }
        );

        return () => {
          active = false;
          unsubscribe();
        };
      } catch (e) {
        console.warn("Could not attach Firestore staff listener:", e);
      }
    }

    return () => {
      active = false;
    };
  }, []);

  const saveMembers = async (newMembers) => {
    setMembers(newMembers);
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(newMembers));
  };

  // Supports both addMember({ name, role, pin, ... }) and legacy positional addMember(name, pin, role)
  const addMember = async (input, legacyPin, legacyRole) => {
    const payload =
      typeof input === "string"
        ? { name: input, pin: legacyPin, role: legacyRole || "sales" }
        : input || {};

    const cleanPin = String(payload.pin || "").trim();
    if (!payload.name?.trim() || cleanPin.length < 4) {
      throw new Error("Employee name and a 4–6 digit PIN are required.");
    }

    const pinExists = members.some((m) => String(m.pin).trim() === cleanPin);
    if (pinExists) {
      throw new Error("That Access PIN is already assigned to another employee.");
    }

    const id = `member-${Date.now()}`;
    const newMember = sanitizeMemberForDb({
      ...payload,
      id,
      pin: cleanPin,
      createdAt: new Date().toISOString(),
    });

    const updated = [...members, newMember];
    await saveMembers(updated);

    const db = getFirebaseDb();
    if (db && isFirebaseConfigured()) {
      try {
        await setDoc(doc(db, COLLECTION_NAME, id), newMember);
      } catch (e) {
        console.warn("Failed to add member to Firestore:", e);
      }
    }

    logAuditEvent({
      module: "employees",
      action: "create",
      severity: "info",
      targetId: newMember.id,
      targetLabel: newMember.name,
      summary: `Added ${newMember.role} employee "${newMember.name}" (${newMember.branch})`,
      changes: [
        { field: "Role", before: "—", after: newMember.role },
        { field: "Commission", before: "—", after: `${newMember.commissionRate}%` },
        { field: "Status", before: "—", after: newMember.status },
      ],
    });

    return newMember;
  };

  const updateMember = async (id, updates) => {
    const previous = members.find((m) => m.id === id);
    if (!previous) return null;

    if (updates.pin !== undefined) {
      const nextPin = String(updates.pin).trim();
      const duplicate = members.some(
        (m) => m.id !== id && String(m.pin).trim() === nextPin
      );
      if (duplicate) {
        throw new Error("That Access PIN is already assigned to another employee.");
      }
    }

    const merged = sanitizeMemberForDb({
      ...previous,
      ...updates,
      id,
      pin: updates.pin !== undefined ? String(updates.pin).trim() : previous.pin,
    });

    const updated = members.map((m) => (m.id === id ? merged : m));
    await saveMembers(updated);

    const db = getFirebaseDb();
    if (db && isFirebaseConfigured()) {
      try {
        await setDoc(doc(db, COLLECTION_NAME, id), merged, { merge: true });
      } catch (e) {
        console.warn("Failed to update member in Firestore:", e);
      }
    }

    // Build structured audit diff (masking raw PIN values)
    const changes = [];
    if (previous.name !== merged.name) {
      changes.push({ field: "Name", before: previous.name, after: merged.name });
    }
    if (previous.role !== merged.role) {
      changes.push({ field: "Role", before: previous.role, after: merged.role });
    }
    if (previous.title !== merged.title) {
      changes.push({ field: "Title", before: previous.title, after: merged.title });
    }
    if (previous.status !== merged.status) {
      changes.push({ field: "Status", before: previous.status, after: merged.status });
    }
    if (Number(previous.commissionRate) !== Number(merged.commissionRate)) {
      changes.push({
        field: "Commission Rate",
        before: `${previous.commissionRate}%`,
        after: `${merged.commissionRate}%`,
      });
    }
    if (previous.branch !== merged.branch) {
      changes.push({ field: "Branch", before: previous.branch, after: merged.branch });
    }
    if (previous.assignedLocation !== merged.assignedLocation) {
      changes.push({
        field: "Assigned Location",
        before: previous.assignedLocation || "AE",
        after: merged.assignedLocation,
      });
    }
    if (previous.pin !== merged.pin) {
      changes.push({ field: "Access PIN", before: "••••", after: "•••• (Updated)" });
    }

    if (changes.length > 0) {
      const isSecurityChange =
        previous.status !== merged.status ||
        previous.pin !== merged.pin ||
        previous.role !== merged.role;

      logAuditEvent({
        module: "employees",
        action: previous.status !== merged.status ? "status_change" : "update",
        severity: merged.status === "suspended" ? "critical" : isSecurityChange ? "warning" : "info",
        targetId: merged.id,
        targetLabel: merged.name,
        summary: `Updated employee profile for "${merged.name}" (${changes.map((c) => c.field).join(", ")})`,
        changes,
      });
    }

    return merged;
  };

  const deleteMember = async (id) => {
    if (id === "admin") return; // Cannot delete primary admin
    const target = members.find((m) => m.id === id);
    const updated = members.filter((m) => m.id !== id);
    await saveMembers(updated);

    const db = getFirebaseDb();
    if (db && isFirebaseConfigured()) {
      try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
      } catch (e) {
        console.warn("Failed to delete member from Firestore:", e);
      }
    }

    if (target) {
      logAuditEvent({
        module: "employees",
        action: "delete",
        severity: "critical",
        targetId: target.id,
        targetLabel: target.name,
        summary: `Removed employee "${target.name}" (${target.role}) from staff directory`,
        changes: [
          { field: "Name", before: target.name, after: "Deleted" },
          { field: "Role", before: target.role, after: "—" },
        ],
      });
    }
  };

  const pushAllMembersToCloud = async () => {
    const db = getFirebaseDb();
    if (db && isFirebaseConfigured()) {
      try {
        const batch = writeBatch(db);
        const payload = members.map(sanitizeMemberForDb);
        payload.forEach((m) => {
          batch.set(doc(db, COLLECTION_NAME, m.id), m);
        });
        await batch.commit();
        logAuditEvent({
          module: "employees",
          action: "sync",
          severity: "info",
          targetId: "staff_members",
          targetLabel: "Staff Directory",
          summary: `Synced ${payload.length} staff profiles to Cloud Firestore`,
        });
        return { success: true, count: payload.length };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
    return { success: false, error: "Firebase connection not active." };
  };

  const recordLoginSuccess = (match) => {
    const now = new Date().toISOString();
    const assignedLoc =
      match.assignedLocation || (match.role === "admin" ? "ALL" : "AE");
    const user = {
      id: match.id,
      role: match.role,
      name: match.name,
      title: match.title,
      branch: match.branch,
      assignedLocation: assignedLoc,
      loginAt: now,
    };
    setCurrentUser(user);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));

    // Update lastLoginAt locally & in Firestore without blocking login
    setMembers((prev) => {
      const next = prev.map((m) =>
        m.id === match.id ? { ...m, lastLoginAt: now } : m
      );
      localStorage.setItem(MEMBERS_KEY, JSON.stringify(next));
      return next;
    });

    const db = getFirebaseDb();
    if (db && isFirebaseConfigured()) {
      setDoc(doc(db, COLLECTION_NAME, match.id), { lastLoginAt: now }, { merge: true }).catch(() => {});
    }

    logAuditEvent({
      module: "auth",
      action: "login",
      severity: "info",
      targetId: match.id,
      targetLabel: match.name,
      summary: `${match.name} unlocked the portal (${match.role})`,
      actor: { id: match.id, name: match.name, role: match.role },
    });

    return { success: true, user };
  };

  const loginByPin = (enteredPin) => {
    const cleanPin = String(enteredPin).trim();
    const match = members.find((m) => m.pin === cleanPin);

    if (match) {
      if (match.status === "suspended") {
        return {
          success: false,
          message: "This staff account is currently suspended. Contact Master Admin.",
        };
      }
      return recordLoginSuccess(match);
    }

    return { success: false, message: "Invalid Access PIN. Please try again." };
  };

  const loginAsRole = (role, enteredPin) => {
    const cleanPin = String(enteredPin).trim();
    const match = members.find((m) => {
      if (role === "admin") return m.role === "admin" && m.pin === cleanPin;
      return m.role !== "admin" && m.pin === cleanPin;
    });

    if (match) {
      if (match.status === "suspended") {
        return {
          success: false,
          message: "This staff account is currently suspended. Contact Master Admin.",
        };
      }
      return recordLoginSuccess(match);
    }

    return {
      success: false,
      message: `Invalid PIN for ${role === "admin" ? "Admin" : "Sales Team"}. Please try again.`,
    };
  };

  const logout = () => {
    if (currentUser) {
      logAuditEvent({
        module: "auth",
        action: "logout",
        severity: "info",
        targetId: currentUser.id,
        targetLabel: currentUser.name,
        summary: `${currentUser.name} locked the portal session`,
        actor: { id: currentUser.id, name: currentUser.name, role: currentUser.role },
      });
    }
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const effectiveAssignedLocation = currentUser
    ? String(
        currentUser.assignedLocation ||
          (currentUser.role === "admin" ? "ALL" : "AE")
      ).toUpperCase()
    : "AE";
  const isAdmin = currentUser?.role === "admin";
  const canSwitchLocations = isAdmin || effectiveAssignedLocation === "ALL";
  const isHubManager = isAdmin || currentUser?.role === "hub_manager";
  const isCountryManager = isAdmin || currentUser?.role === "country_manager";

  const value = {
    currentUser,
    members,
    role: currentUser?.role || null,
    isAdmin,
    isHubManager,
    isCountryManager,
    assignedLocation: effectiveAssignedLocation,
    canSwitchLocations,
    isSales: currentUser?.role !== "admin" && !!currentUser,
    isAuthenticated: !!currentUser,
    loginByPin,
    loginAsRole,
    logout,
    addMember,
    updateMember,
    deleteMember,
    pushAllMembersToCloud,
    refreshStaff: loadStaffFromDatabase,
  };

  return (
    <StaffAuthContext.Provider value={value}>
      {children}
    </StaffAuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useStaffAuth = () => {
  const ctx = useContext(StaffAuthContext);
  if (!ctx) {
    throw new Error("useStaffAuth must be used within a StaffAuthProvider");
  }
  return ctx;
};
