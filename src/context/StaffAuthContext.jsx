import { createContext, useContext, useState } from "react";

const StaffAuthContext = createContext(null);

const DEFAULT_MEMBERS = [
  { id: "admin", name: "E-ALL Admin", role: "admin", pin: "8888" },
  { id: "sales-1", name: "Ahmed - Sales Executive", role: "sales", pin: "1234" },
  { id: "sales-2", name: "Sara - Account Manager", role: "sales", pin: "2345" },
  { id: "sales-3", name: "Bilal - Sales Rep", role: "sales", pin: "3456" },
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

  const saveMembers = (newMembers) => {
    setMembers(newMembers);
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(newMembers));
  };

  const addMember = ({ name, role = "sales", pin }) => {
    const id = `member-${Date.now()}`;
    const newMember = { id, name: name.trim(), role, pin: String(pin).trim() };
    const updated = [...members, newMember];
    saveMembers(updated);
    return newMember;
  };

  const updateMember = (id, updates) => {
    const updated = members.map((m) =>
      m.id === id ? { ...m, ...updates, pin: String(updates.pin || m.pin).trim() } : m
    );
    saveMembers(updated);
  };

  const deleteMember = (id) => {
    if (id === "admin") return; // Cannot delete primary admin
    const updated = members.filter((m) => m.id !== id);
    saveMembers(updated);
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
