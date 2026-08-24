import { createContext, useContext, useState, useEffect } from "react";

const StaffAuthContext = createContext(null);

const DEFAULT_PINS = {
  admin: "8888",
  sales: "1234",
};

const SESSION_KEY = "eall_staff_auth_session";

export const StaffAuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [pins, setPins] = useState(() => {
    try {
      const storedPins = localStorage.getItem("eall_staff_pins");
      return storedPins ? JSON.parse(storedPins) : DEFAULT_PINS;
    } catch {
      return DEFAULT_PINS;
    }
  });

  const updatePin = (role, newPin) => {
    const updated = { ...pins, [role]: newPin };
    setPins(updated);
    localStorage.setItem("eall_staff_pins", JSON.stringify(updated));
  };

  const login = (role, enteredPin) => {
    const targetPin = pins[role] || DEFAULT_PINS[role];
    if (enteredPin === targetPin) {
      const user = {
        role,
        name: role === "admin" ? "E-ALL Administrator" : "Sales Executive",
        loginAt: new Date().toISOString(),
      };
      setCurrentUser(user);
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return { success: true };
    }
    return { success: false, message: "Invalid Access PIN. Please try again." };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const value = {
    currentUser,
    role: currentUser?.role || null,
    isAdmin: currentUser?.role === "admin",
    isSales: currentUser?.role === "sales",
    isAuthenticated: !!currentUser,
    login,
    logout,
    updatePin,
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
