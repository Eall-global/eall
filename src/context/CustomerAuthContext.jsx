import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getFirebaseDb,
  getFirebaseAuth,
  isFirebaseConfigured,
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateAuthProfile,
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

  // Sync customer profile from Firestore
  const syncCustomerProfile = useCallback(async (uid, basicInfo = {}) => {
    const db = getFirebaseDb();
    if (!db || !isFirebaseConfigured()) return null;

    try {
      const docRef = doc(db, "customers", uid);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const profile = { id: uid, uid, ...snap.data() };
        setUser(profile);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
        return profile;
      } else {
        // Create new Firestore customer record for first-time login
        const newProfile = {
          id: uid,
          uid,
          fullName: basicInfo.fullName || basicInfo.displayName || "Customer",
          email: (basicInfo.email || "").toLowerCase(),
          phone: basicInfo.phone || basicInfo.phoneNumber || "",
          country: basicInfo.country || "Senegal",
          city: basicInfo.city || "Dakar",
          shippingAddress: basicInfo.shippingAddress || "",
          photoURL: basicInfo.photoURL || "",
          createdAt: new Date().toISOString(),
        };
        await setDoc(docRef, newProfile);
        setUser(newProfile);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newProfile));
        return newProfile;
      }
    } catch (e) {
      console.warn("Could not sync customer profile from Firestore:", e);
      return null;
    }
  }, []);

  // Fetch orders for current customer from Firestore
  const loadCustomerOrders = useCallback(async (uid) => {
    const db = getFirebaseDb();
    if (!db || !isFirebaseConfigured() || !uid) return;

    try {
      const q = query(
        collection(db, "customer_orders"),
        where("customerId", "==", uid)
      );
      const snapshot = await getDocs(q);
      const list = [];
      snapshot.forEach((d) => list.push(d.data()));

      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(list);
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn("Could not load customer orders:", e);
    }
  }, []);

  // Firebase Real-time Auth State Observer
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth || !isFirebaseConfigured()) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await syncCustomerProfile(firebaseUser.uid, {
          email: firebaseUser.email,
          fullName: firebaseUser.displayName,
          phone: firebaseUser.phoneNumber,
          photoURL: firebaseUser.photoURL,
        });
        loadCustomerOrders(firebaseUser.uid);
      } else {
        // Logged out
        setUser(null);
        setOrders([]);
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(ORDERS_STORAGE_KEY);
      }
    });

    return () => unsubscribe();
  }, [syncCustomerProfile, loadCustomerOrders]);

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

  // 1️⃣ REAL REGISTRATION via Firebase Auth
  const register = async ({
    fullName,
    email,
    password,
    phone,
    country = "Senegal",
    city = "Dakar",
    shippingAddress = "",
  }) => {
    setLoading(true);
    setError(null);

    const auth = getFirebaseAuth();
    if (!auth || !isFirebaseConfigured()) {
      setError("Firebase Authentication is not configured.");
      setLoading(false);
      return { success: false, error: "Firebase not configured" };
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const firebaseUser = userCredential.user;

      // Update Firebase Auth display name
      try {
        await updateAuthProfile(firebaseUser, { displayName: fullName.trim() });
      } catch (err) {
        console.warn("Could not update auth display name:", err);
      }

      // Create rich customer profile in Firestore
      const customerProfile = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: cleanEmail,
        fullName: fullName.trim(),
        phone: phone ? phone.trim() : "",
        country: country.trim(),
        city: city.trim(),
        shippingAddress: shippingAddress.trim(),
        createdAt: new Date().toISOString(),
      };

      const db = getFirebaseDb();
      if (db) {
        await setDoc(doc(db, "customers", firebaseUser.uid), customerProfile);
      }

      setUser(customerProfile);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(customerProfile));
      setIsAuthModalOpen(false);
      setLoading(false);
      return { success: true, user: customerProfile };
    } catch (err) {
      console.error("Firebase register error:", err);
      let msg = "Could not complete registration. Please try again.";
      if (err.code === "auth/email-already-in-use") {
        msg = "An account with this email already exists. Please sign in instead.";
      } else if (err.code === "auth/invalid-email") {
        msg = "Please enter a valid email address.";
      } else if (err.code === "auth/weak-password") {
        msg = "Password should be at least 6 characters.";
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      setLoading(false);
      return { success: false, error: msg };
    }
  };

  // 2️⃣ REAL LOGIN via Firebase Auth
  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    const auth = getFirebaseAuth();
    if (!auth || !isFirebaseConfigured()) {
      setError("Firebase Authentication is not configured.");
      setLoading(false);
      return { success: false, error: "Firebase not configured" };
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const firebaseUser = userCredential.user;

      // Sync Firestore profile
      const profile = await syncCustomerProfile(firebaseUser.uid, {
        email: cleanEmail,
        fullName: firebaseUser.displayName,
      });

      loadCustomerOrders(firebaseUser.uid);
      setIsAuthModalOpen(false);
      setLoading(false);
      return { success: true, user: profile };
    } catch (err) {
      console.error("Firebase login error:", err);
      let msg = "Invalid email or password. Please verify your credentials or create a new account.";
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        msg = "No registered account found with this email, or incorrect password. Please create an account if you haven't registered.";
      } else if (err.code === "auth/wrong-password") {
        msg = "Incorrect password. Please try again.";
      } else if (err.code === "auth/invalid-email") {
        msg = "Please enter a valid email address.";
      } else if (err.code === "auth/too-many-requests") {
        msg = "Too many failed login attempts. Please try again in a few minutes.";
      }
      setError(msg);
      setLoading(false);
      return { success: false, error: msg };
    }
  };

  // 3️⃣ ONE-CLICK GOOGLE SIGN-IN
  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);

    const auth = getFirebaseAuth();
    if (!auth || !isFirebaseConfigured()) {
      setError("Firebase Authentication is not configured.");
      setLoading(false);
      return { success: false, error: "Firebase not configured" };
    }

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const userCredential = await signInWithPopup(auth, provider);
      const firebaseUser = userCredential.user;

      const profile = await syncCustomerProfile(firebaseUser.uid, {
        email: firebaseUser.email,
        fullName: firebaseUser.displayName,
        phone: firebaseUser.phoneNumber || "",
        photoURL: firebaseUser.photoURL || "",
      });

      loadCustomerOrders(firebaseUser.uid);
      setIsAuthModalOpen(false);
      setLoading(false);
      return { success: true, user: profile };
    } catch (err) {
      console.error("Google Sign-In error:", err);
      let msg = "Google Sign-In was cancelled or failed.";
      if (err.code === "auth/popup-closed-by-user") {
        msg = "Sign-in window was closed before completing.";
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      setLoading(false);
      return { success: false, error: msg };
    }
  };

  // 4️⃣ LOGOUT
  const logout = async () => {
    const auth = getFirebaseAuth();
    if (auth) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn("Signout error:", e);
      }
    }
    setUser(null);
    setOrders([]);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(ORDERS_STORAGE_KEY);
  };

  // 5️⃣ UPDATE PROFILE
  const updateProfile = async (updatedData) => {
    if (!user?.id) return;
    const updatedUser = { ...user, ...updatedData, updatedAt: new Date().toISOString() };
    setUser(updatedUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));

    const db = getFirebaseDb();
    if (db && isFirebaseConfigured()) {
      try {
        await setDoc(doc(db, "customers", user.id), updatedUser, { merge: true });
      } catch (e) {
        console.warn("Could not update customer profile in Firestore:", e);
      }
    }
  };

  // 6️⃣ SAVE ORDER TO HISTORY & FIRESTORE
  const addOrderToHistory = async (newOrder) => {
    setOrders((prev) => [newOrder, ...prev]);

    const db = getFirebaseDb();
    if (db && isFirebaseConfigured() && newOrder.orderId) {
      try {
        // Save to customer_orders collection
        await setDoc(doc(db, "customer_orders", newOrder.orderId), newOrder);
        // Also save to global invoices collection
        await setDoc(doc(db, "invoices", newOrder.orderId), {
          invoiceNo: newOrder.orderId,
          customerName: newOrder.customerName,
          customerPhone: newOrder.phone,
          customerEmail: newOrder.email,
          customerAddress: `${newOrder.shippingAddress}, ${newOrder.city}, ${newOrder.country}`,
          paymentMethod: newOrder.paymentMethodName || newOrder.paymentMethod,
          waveTransactionId: newOrder.waveTransactionId || null,
          items: newOrder.items,
          subtotal: newOrder.subtotal,
          totalAmount: newOrder.total,
          status: newOrder.status,
          createdAt: newOrder.createdAt,
        }, { merge: true });
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
        loginWithGoogle,
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
