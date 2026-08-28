import { createContext, useContext, useState, useEffect } from "react";
import {
  getFirebaseDb,
  isFirebaseConfigured,
  collection,
  doc,
  getDoc,
  setDoc,
} from "../lib/firebaseClient";

const CustomerAuthContext = createContext(null);
const USER_STORAGE_KEY = "eall_customer_user";
const ORDERS_STORAGE_KEY = "eall_customer_orders";

export const CustomerAuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [redirectAfterAuth, setRedirectAfterAuth] = useState(null);
  const [authMode, setAuthMode] = useState("login"); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync user state to localStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    } catch (e) {
      console.warn("Could not save user to storage:", e);
    }
  }, [user]);

  // Sync orders to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {
      console.warn("Could not save orders to storage:", e);
    }
  }, [orders]);

  const openAuthModal = (mode = "login", redirectUrl = null) => {
    setAuthMode(mode);
    setRedirectAfterAuth(redirectUrl);
    setError(null);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setError(null);
  };

  // Register Customer
  const register = async ({ fullName, email, password, phone, country = "Senegal", city = "Dakar", shippingAddress = "" }) => {
    setLoading(true);
    setError(null);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const customerId = `CUST-${cleanEmail.replace(/[^a-zA-Z0-9]/g, "_")}`;

      const newCustomer = {
        id: customerId,
        email: cleanEmail,
        fullName: fullName.trim(),
        phone: phone ? phone.trim() : "+221 77 000 0000",
        country: country.trim(),
        city: city.trim(),
        shippingAddress: shippingAddress.trim(),
        createdAt: new Date().toISOString(),
      };

      const db = getFirebaseDb();
      if (db && isFirebaseConfigured()) {
        try {
          const docRef = doc(db, "customers", customerId);
          await setDoc(docRef, newCustomer, { merge: true });
        } catch (e) {
          console.warn("Could not write customer to Firestore:", e);
        }
      }

      setUser(newCustomer);
      setIsAuthModalOpen(false);
      setLoading(false);
      return { success: true, user: newCustomer };
    } catch (err) {
      console.error("Register error:", err);
      setError(err.message || "Could not complete registration");
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  // Login Customer
  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const customerId = `CUST-${cleanEmail.replace(/[^a-zA-Z0-9]/g, "_")}`;

      let customerObj = null;

      const db = getFirebaseDb();
      if (db && isFirebaseConfigured()) {
        try {
          const docRef = doc(db, "customers", customerId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            customerObj = snap.data();
          }
        } catch (e) {
          console.warn("Could not read customer from Firestore:", e);
        }
      }

      if (!customerObj) {
        // Fallback to local or generate profile
        const stored = localStorage.getItem(USER_STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : null;
        if (parsed && parsed.email === cleanEmail) {
          customerObj = parsed;
        } else {
          customerObj = {
            id: customerId,
            email: cleanEmail,
            fullName: cleanEmail.split("@")[0],
            phone: "+221 77 000 0000",
            country: "Senegal",
            city: "Dakar",
            shippingAddress: "",
            createdAt: new Date().toISOString(),
          };
        }
      }

      setUser(customerObj);
      setIsAuthModalOpen(false);
      setLoading(false);
      return { success: true, user: customerObj };
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Invalid email or password");
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  // Logout Customer
  const logout = async () => {
    setUser(null);
  };

  // Update Customer Profile
  const updateProfile = async (updatedData) => {
    const updatedUser = user ? { ...user, ...updatedData, updatedAt: new Date().toISOString() } : null;
    setUser(updatedUser);

    if (updatedUser) {
      const db = getFirebaseDb();
      if (db && isFirebaseConfigured()) {
        try {
          const docRef = doc(db, "customers", updatedUser.id);
          await setDoc(docRef, updatedUser, { merge: true });
        } catch (e) {
          console.warn("Could not update customer in Firestore:", e);
        }
      }
    }
  };

  // Save new order to profile history
  const addOrderToHistory = async (newOrder) => {
    setOrders((prev) => [newOrder, ...prev]);

    const db = getFirebaseDb();
    if (db && isFirebaseConfigured() && newOrder.orderId) {
      try {
        const docRef = doc(db, "customer_orders", newOrder.orderId);
        await setDoc(docRef, newOrder);
      } catch (e) {
        console.warn("Could not save customer order to Firestore:", e);
      }
    }
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        user,
        isLoggedIn: Boolean(user),
        orders,
        loading,
        error,
        authMode,
        setAuthMode,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        redirectAfterAuth,
        setRedirectAfterAuth,
        login,
        register,
        logout,
        updateProfile,
        addOrderToHistory,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error("useCustomerAuth must be used within a CustomerAuthProvider");
  }
  return context;
};
