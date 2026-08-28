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

const StaffAuthContext = createContext(null);

const DEFAULT_MEMBERS = [
  { id: "admin", name: "E-ALL Admin", role: "admin", pin: "8888" },
  { id: "sales-1", name: "Iftikhar - Account Manager", role: "sales", pin: "1234" },
  { id: "sales-2", name: "Hidayat - Procurement Manager", role: "sales", pin: "2345" },
  { id: "sales-3", name: "Yafey - Sales Executive", role: "sales", pin: "3456" },
];

const SESSION_KEY = "eall_staff_auth_session";
const MEMBERS_KEY = "eall_staff_team_members";
const COLLECTION_NAME = "staff_members";

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
      return stored ? JSON.parse(stored) : DEFAULT_MEMBERS;
    } catch {
      return DEFAULT_MEMBERS;
    }
  });

  const sanitizeMemberForDb = (m) => ({
    id: String(m.id),
    name: String(m.name),
    role: String(m.role || "sales"),
    pin: String(m.pin),
    createdAt: m.createdAt || m.created_at || new Date().toISOString(),
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
            list.push(docSnap.data());
          });
          list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
          setMembers(list);
          localStorage.setItem(MEMBERS_KEY, JSON.stringify(list));
        } else {
          // Auto seed members into empty Firestore collection
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
    loadStaffFromDatabase();

    // Firestore Real-time live subscription with zero connection penalties
    const db = getFirebaseDb();
    if (db && isFirebaseConfigured()) {
      try {
        const unsubscribe = onSnapshot(
          collection(db, COLLECTION_NAME),
          (snapshot) => {
            if (!snapshot.empty) {
              const list = [];
              snapshot.forEach((docSnap) => {
                list.push(docSnap.data());
              });
              list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
              setMembers(list);
              localStorage.setItem(MEMBERS_KEY, JSON.stringify(list));
            }
          },
          (err) => {
            console.warn("Firestore staff onSnapshot warning:", err);
          }
        );

        return () => {
          unsubscribe();
        };
      } catch (e) {
        console.warn("Could not attach Firestore staff listener:", e);
      }
    }
  }, [loadStaffFromDatabase]);

  const saveMembers = async (newMembers) => {
    setMembers(newMembers);
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(newMembers));
  };

  const addMember = async ({ name, role = "sales", pin }) => {
    const id = `member-${Date.now()}`;
    const newMember = sanitizeMemberForDb({
      id,
      name: name.trim(),
      role,
      pin: String(pin).trim(),
      createdAt: new Date().toISOString(),
    });
    const updated = [...members, newMember];
    await saveMembers(updated);

    // Sync to Firestore
    const db = getFirebaseDb();
    if (db && isFirebaseConfigured()) {
      try {
        await setDoc(doc(db, COLLECTION_NAME, id), newMember);
      } catch (e) {
        console.warn("Failed to add member to Firestore:", e);
      }
    }

    return newMember;
  };

  const updateMember = async (id, updates) => {
    const updated = members.map((m) =>
      m.id === id ? { ...m, ...updates, pin: String(updates.pin || m.pin).trim() } : m
    );
    await saveMembers(updated);

    // Sync to Firestore
    const db = getFirebaseDb();
    if (db && isFirebaseConfigured()) {
      try {
        const target = updated.find((m) => m.id === id);
        if (target) {
          await setDoc(doc(db, COLLECTION_NAME, id), sanitizeMemberForDb(target), { merge: true });
        }
      } catch (e) {
        console.warn("Failed to update member in Firestore:", e);
      }
    }
  };

  const deleteMember = async (id) => {
    if (id === "admin") return; // Cannot delete primary admin
    const updated = members.filter((m) => m.id !== id);
    await saveMembers(updated);

    // Delete from Firestore
    const db = getFirebaseDb();
    if (db && isFirebaseConfigured()) {
      try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
      } catch (e) {
        console.warn("Failed to delete member from Firestore:", e);
      }
    }
  };

  // Push all local members to Firestore
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
        return { success: true, count: payload.length };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
    return { success: false, error: "Firebase connection not active." };
  };

  const loginByPin = (enteredPin) => {
    const cleanPin = String(enteredPin).trim();
    const match = members.find((m) => m.pin === cleanPin);

    if (match) {
      const user = {
        id: match.id,
        role: match.role,
        name: match.name,
        loginAt: new Date().toISOString(),
      };
      setCurrentUser(user);
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return { success: true, user };
    }

    return { success: false, message: "Invalid Access PIN. Please try again." };
  };

  const loginAsRole = (role, enteredPin) => {
    const cleanPin = String(enteredPin).trim();
    const match = members.find((m) => m.role === role && m.pin === cleanPin);

    if (match) {
      const user = {
        id: match.id,
        role: match.role,
        name: match.name,
        loginAt: new Date().toISOString(),
      };
      setCurrentUser(user);
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return { success: true, user };
    }

    return {
      success: false,
      message: `Invalid PIN for ${role === "admin" ? "Admin" : "Salesperson"}. Please try again.`,
    };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const value = {
    currentUser,
    members,
    role: currentUser?.role || null,
    isAdmin: currentUser?.role === "admin",
    isSales: currentUser?.role === "sales",
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

export const useStaffAuth = () => {
  const ctx = useContext(StaffAuthContext);
  if (!ctx) {
    throw new Error("useStaffAuth must be used within a StaffAuthProvider");
  }
  return ctx;
};
