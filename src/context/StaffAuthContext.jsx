import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getSupabase, isSupabaseConfigured } from "../lib/supabaseClient";

const StaffAuthContext = createContext(null);

const DEFAULT_MEMBERS = [
  { id: "admin", name: "E-ALL Admin", role: "admin", pin: "8888" },
  { id: "sales-1", name: "Iftikhar - Account Manager", role: "sales", pin: "1234" },
  { id: "sales-2", name: "Hidayat - Account Manager", role: "sales", pin: "2345" },
  { id: "sales-3", name: "Yafey - Sales Executive", role: "sales", pin: "3456" },
];

const SESSION_KEY = "eall_staff_auth_session";
const MEMBERS_KEY = "eall_staff_team_members";

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

  // Fetch / Sync staff members from Supabase
  const loadStaffFromDatabase = useCallback(async () => {
    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("staff_members")
          .select("*")
          .order("created_at", { ascending: true });

        if (!error && data) {
          if (data.length > 0) {
            setMembers(data);
            localStorage.setItem(MEMBERS_KEY, JSON.stringify(data));
          } else {
            // Seed defaults into empty Supabase table
            await supabase.from("staff_members").upsert(DEFAULT_MEMBERS);
          }
        }
      } catch (err) {
        console.warn("Could not sync staff from Supabase:", err);
      }
    }
  }, []);

  useEffect(() => {
    loadStaffFromDatabase();
  }, [loadStaffFromDatabase]);

  const saveMembers = async (newMembers) => {
    setMembers(newMembers);
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(newMembers));
  };

  const addMember = async ({ name, role = "sales", pin }) => {
    const id = `member-${Date.now()}`;
    const newMember = {
      id,
      name: name.trim(),
      role,
      pin: String(pin).trim(),
      created_at: new Date().toISOString(),
    };
    const updated = [...members, newMember];
    await saveMembers(updated);

    // Sync to Supabase
    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from("staff_members").upsert(newMember);
      } catch (e) {
        console.warn("Failed to add member to Supabase:", e);
      }
    }

    return newMember;
  };

  const updateMember = async (id, updates) => {
    const updated = members.map((m) =>
      m.id === id ? { ...m, ...updates, pin: String(updates.pin || m.pin).trim() } : m
    );
    await saveMembers(updated);

    // Sync to Supabase
    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured()) {
      try {
        const target = updated.find((m) => m.id === id);
        if (target) {
          await supabase.from("staff_members").upsert(target);
        }
      } catch (e) {
        console.warn("Failed to update member in Supabase:", e);
      }
    }
  };

  const deleteMember = async (id) => {
    if (id === "admin") return; // Cannot delete primary admin
    const updated = members.filter((m) => m.id !== id);
    await saveMembers(updated);

    // Delete from Supabase
    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from("staff_members").delete().eq("id", id);
      } catch (e) {
        console.warn("Failed to delete member from Supabase:", e);
      }
    }
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
