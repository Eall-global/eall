/**
 * E-ALL Coupon & Promotions Service
 * Cloud Firestore persistence with First-Order verification
 */
import {
  getFirebaseDb,
  isFirebaseConfigured,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
} from "../lib/firebaseClient";

const COUPONS_STORAGE_KEY = "eall_active_coupons";

export const DEFAULT_COUPONS = [
  {
    id: "WELCOME10",
    code: "WELCOME10",
    description: "10% OFF on your very first order",
    discountPercent: 10,
    minOrderAmount: 0,
    firstOrderOnly: true,
    isActive: true,
    expiresAt: "2027-12-31",
  },
  {
    id: "EALL2026",
    code: "EALL2026",
    description: "5% Storewide discount for all customers",
    discountPercent: 5,
    minOrderAmount: 200,
    firstOrderOnly: false,
    isActive: true,
    expiresAt: "2027-12-31",
  },
  {
    id: "AFRICA50",
    code: "AFRICA50",
    description: "Special 50 AED Flat Voucher on orders above 500 AED",
    discountFlat: 50,
    minOrderAmount: 500,
    firstOrderOnly: false,
    isActive: true,
    expiresAt: "2027-12-31",
  },
];

/**
 * Fetch all available coupons from Firestore or fallback
 */
export const fetchCoupons = async () => {
  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      const snap = await getDocs(collection(db, "coupons"));
      if (!snap.empty) {
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(list));
        return list;
      }
    } catch (e) {
      console.warn("Could not fetch coupons from Firestore:", e);
    }
  }

  try {
    const local = localStorage.getItem(COUPONS_STORAGE_KEY);
    if (local) return JSON.parse(local);
  } catch {
    // fallback
  }

  return DEFAULT_COUPONS;
};

/**
 * Save or create a new coupon in Firestore
 */
export const saveCoupon = async (couponData) => {
  const code = (couponData.code || "").toUpperCase().trim();
  if (!code) throw new Error("Coupon code is required");

  const coupon = {
    id: code,
    code,
    description: couponData.description || `${couponData.discountPercent || 10}% OFF`,
    discountPercent: Number(couponData.discountPercent) || 0,
    discountFlat: Number(couponData.discountFlat) || 0,
    minOrderAmount: Number(couponData.minOrderAmount) || 0,
    firstOrderOnly: Boolean(couponData.firstOrderOnly),
    isActive: couponData.isActive !== false,
    expiresAt: couponData.expiresAt || "2027-12-31",
    updatedAt: new Date().toISOString(),
  };

  const current = await fetchCoupons();
  const updated = [coupon, ...current.filter((c) => c.code !== code)];
  localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(updated));

  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      await setDoc(doc(db, "coupons", code), coupon, { merge: true });
    } catch (e) {
      console.warn("Could not save coupon to Firestore:", e);
    }
  }

  return coupon;
};

/**
 * Delete a coupon
 */
export const deleteCoupon = async (couponId) => {
  const current = await fetchCoupons();
  const updated = current.filter((c) => c.id !== couponId && c.code !== couponId);
  localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(updated));

  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      await deleteDoc(doc(db, "coupons", couponId));
    } catch (e) {
      console.warn("Could not delete coupon from Firestore:", e);
    }
  }
};

/**
 * Validate and calculate coupon discount
 * @param {string} rawCode
 * @param {Object} context - { user, orders, cartSubtotal }
 */
export const validateCouponCode = async (rawCode, { user, orders = [], cartSubtotal = 0 }) => {
  const code = (rawCode || "").toUpperCase().trim();
  if (!code) {
    return { valid: false, message: "Please enter a valid coupon code." };
  }

  const coupons = await fetchCoupons();
  const coupon = coupons.find((c) => c.code.toUpperCase() === code);

  if (!coupon || !coupon.isActive) {
    return { valid: false, message: `Coupon code "${code}" is invalid or expired.` };
  }

  // Check minimum order subtotal
  if (coupon.minOrderAmount > 0 && cartSubtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      message: `Coupon "${code}" requires a minimum order subtotal of ${coupon.minOrderAmount} د.إ.`,
    };
  }

  // First-Order Only Validation
  if (coupon.firstOrderOnly) {
    if (!user) {
      return {
        valid: false,
        message: "Please log in to your account to redeem the first-order discount.",
      };
    }

    const hasUsedCoupon = Array.isArray(user.usedCoupons) && user.usedCoupons.includes(code);
    const hasExistingOrders = Array.isArray(orders) && orders.length > 0;

    if (hasUsedCoupon || hasExistingOrders) {
      return {
        valid: false,
        message: `Coupon "${code}" is valid for first-time orders only and has already been redeemed on this account.`,
      };
    }
  }

  // Calculate discount amount
  let discountAmount = 0;
  if (coupon.discountPercent > 0) {
    discountAmount = (cartSubtotal * coupon.discountPercent) / 100;
  } else if (coupon.discountFlat > 0) {
    discountAmount = Math.min(cartSubtotal, coupon.discountFlat);
  }

  return {
    valid: true,
    coupon,
    discountAmount: Number(discountAmount.toFixed(2)),
    message: `Coupon "${code}" applied! You saved ${discountAmount.toFixed(2)} د.إ`,
  };
};
