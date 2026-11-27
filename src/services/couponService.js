/**
 * E-ALL Multi-Country Coupon & Promotions Service
 * Cloud Firestore persistence with First-Order verification, Country Scoping & Live Currency Conversion
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
import { logAuditEvent } from "./auditService";
import {
  DEFAULT_LOCATIONS,
  convertAedToLocalPrice,
} from "../config/locationsConfig";

const COUPONS_STORAGE_KEY = "eall_active_coupons";

export const DEFAULT_COUPONS = [
  {
    id: "WELCOME10",
    code: "WELCOME10",
    description: "10% OFF on your very first order",
    discountPercent: 10,
    discountFlat: 0,
    minOrderAmount: 0,
    locationCode: "ALL",
    currency: "AED",
    firstOrderOnly: true,
    isActive: true,
    expiresAt: "2027-12-31",
  },
  {
    id: "EALL2026",
    code: "EALL2026",
    description: "5% Storewide discount for all customers",
    discountPercent: 5,
    discountFlat: 0,
    minOrderAmount: 200,
    locationCode: "ALL",
    currency: "AED",
    firstOrderOnly: false,
    isActive: true,
    expiresAt: "2027-12-31",
  },
  {
    id: "AFRICA50",
    code: "AFRICA50",
    description: "Special Flat Voucher on qualifying orders",
    discountPercent: 0,
    discountFlat: 50,
    minOrderAmount: 500,
    locationCode: "ALL",
    currency: "AED",
    firstOrderOnly: false,
    isActive: true,
    expiresAt: "2027-12-31",
  },
];

/**
 * Format a clean coupon currency amount (omits unnecessary .00 decimals for cleaner ticket copy)
 */
export const formatCouponAmount = (amount, locationConfig) => {
  const cfg = locationConfig || DEFAULT_LOCATIONS[0];
  const sym = cfg.currencySymbol || cfg.currency || "AED";
  const num = Number(amount) || 0;
  const isWhole = Math.abs(num - Math.round(num)) < 0.005;
  const decimals = isWhole ? 0 : Number.isFinite(Number(cfg.decimals)) ? Number(cfg.decimals) : 2;
  const formatted = num.toLocaleString(cfg.locale || "en-AE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${sym} ${formatted}`;
};

/**
 * Convert & localize any coupon (global AED base or country-specific) into the active country's currency.
 * Also cleans legacy descriptions that had hardcoded "AED" text when rendered in non-AED countries.
 */
export const resolveCouponForLocation = (coupon, locationConfig = null) => {
  const cfg = locationConfig || DEFAULT_LOCATIONS[0];
  const activeCode = String(cfg.code || "AE").toUpperCase();
  const couponLoc = String(coupon?.locationCode || "ALL").toUpperCase();
  const couponCurrency = String(coupon?.currency || "AED").toUpperCase();
  const targetCurrency = String(cfg.currency || "AED").toUpperCase();

  const isGlobal = couponLoc === "ALL";
  const isNativeCurrency =
    (!isGlobal && couponLoc === activeCode) || couponCurrency === targetCurrency;
  const isEligible = isGlobal || couponLoc === activeCode;

  const discountPercent = Math.max(0, Number(coupon?.discountPercent) || 0);
  const rawFlat = Math.max(0, Number(coupon?.discountFlat) || 0);
  const rawMin = Math.max(0, Number(coupon?.minOrderAmount) || 0);

  const discountFlatLocal =
    rawFlat > 0
      ? isNativeCurrency
        ? rawFlat
        : convertAedToLocalPrice(rawFlat, cfg, 0)
      : 0;

  const minOrderLocal =
    rawMin > 0
      ? isNativeCurrency
        ? rawMin
        : convertAedToLocalPrice(rawMin, cfg, 0)
      : 0;

  const flatFormatted =
    discountFlatLocal > 0 ? formatCouponAmount(discountFlatLocal, cfg) : "";
  const minFormatted =
    minOrderLocal > 0 ? formatCouponAmount(minOrderLocal, cfg) : "";

  const shortValue =
    discountPercent > 0
      ? `${discountPercent}% OFF`
      : `${flatFormatted} OFF`;

  const headline =
    discountPercent > 0
      ? `EXTRA ${discountPercent}% OFF`
      : `${flatFormatted} OFF`;

  const subtitle =
    minOrderLocal > 0
      ? `On orders above ${minFormatted}`
      : coupon?.firstOrderOnly
      ? "On your very first order"
      : "Valid storewide on all items";

  // Clean legacy hardcoded "AED" text inside saved descriptions when viewing in another currency
  const rawDesc = String(coupon?.description || "").trim();
  const hasHardcodedAed = /\bAED\b|د\.إ/i.test(rawDesc);
  let localizedDescription = rawDesc;
  if (!rawDesc || (hasHardcodedAed && targetCurrency !== "AED")) {
    if (discountPercent > 0) {
      localizedDescription =
        minOrderLocal > 0
          ? `${discountPercent}% OFF on orders above ${minFormatted}`
          : coupon?.firstOrderOnly
          ? `${discountPercent}% OFF on your very first order`
          : `${discountPercent}% Storewide discount for all customers`;
    } else if (discountFlatLocal > 0) {
      localizedDescription =
        minOrderLocal > 0
          ? `Special ${flatFormatted} Flat Voucher on orders above ${minFormatted}`
          : `Special ${flatFormatted} Instant Storefront Voucher`;
    }
  }

  let badgeLabel = "STOREWIDE";
  if (coupon?.firstOrderOnly) {
    badgeLabel = "1ST ORDER";
  } else if (discountPercent >= 10 || rawFlat >= 50) {
    badgeLabel = "BEST VALUE";
  } else if (!isGlobal) {
    badgeLabel = `${cfg.shortName || activeCode} EXCLUSIVE`.toUpperCase();
  }

  return {
    ...coupon,
    locationCode: couponLoc,
    isGlobal,
    isEligible,
    activeCurrency: targetCurrency,
    activeSymbol: cfg.currencySymbol || targetCurrency,
    discountPercent,
    discountFlatLocal,
    minOrderLocal,
    flatFormatted,
    minFormatted,
    shortValue,
    headline,
    subtitle,
    localizedDescription,
    badgeLabel,
  };
};

/**
 * Filter and resolve a coupon list for the active country storefront or back-office location
 */
export const filterCouponsForLocation = (
  coupons = [],
  locationConfig = null,
  { activeOnly = true } = {}
) => {
  const now = new Date();
  return (coupons || [])
    .filter((c) => {
      if (!c) return false;
      if (activeOnly) {
        if (c.isActive === false) return false;
        if (c.expiresAt && new Date(c.expiresAt) < now) return false;
      }
      return true;
    })
    .map((c) => resolveCouponForLocation(c, locationConfig))
    .filter((c) => c.isEligible);
};

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

  const locCode = String(couponData.locationCode || "ALL").trim().toUpperCase();
  const currency = String(couponData.currency || "AED").trim().toUpperCase();
  const discountPercent = Number(couponData.discountPercent) || 0;
  const discountFlat = Number(couponData.discountFlat) || 0;
  const minOrderAmount = Number(couponData.minOrderAmount) || 0;

  const coupon = {
    id: code,
    code,
    description:
      couponData.description?.trim() ||
      (discountPercent > 0
        ? `${discountPercent}% OFF`
        : `${currency} ${discountFlat} OFF`),
    discountPercent,
    discountFlat,
    minOrderAmount,
    locationCode: locCode,
    currency,
    firstOrderOnly: Boolean(couponData.firstOrderOnly),
    isActive: couponData.isActive !== false,
    expiresAt: couponData.expiresAt || "2027-12-31",
    updatedAt: new Date().toISOString(),
  };

  const current = await fetchCoupons();
  const existing = current.find((c) => c.code === code);
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

  logAuditEvent({
    module: "coupons",
    action: existing ? (existing.isActive !== coupon.isActive ? "status_change" : "update") : "create",
    severity: "info",
    targetId: code,
    targetLabel: code,
    summary: existing
      ? `Updated coupon ${code} (${coupon.isActive ? "Active" : "Inactive"})`
      : `Created coupon ${code} (${coupon.discountPercent > 0 ? `${coupon.discountPercent}% OFF` : `${currency} ${coupon.discountFlat} OFF`} • ${locCode === "ALL" ? "Global" : locCode})`,
    changes: existing
      ? [
          {
            field: "Status",
            before: existing.isActive ? "Active" : "Inactive",
            after: coupon.isActive ? "Active" : "Inactive",
          },
        ]
      : [
          {
            field: "Discount",
            before: "—",
            after: coupon.discountPercent > 0 ? `${coupon.discountPercent}%` : `${currency} ${coupon.discountFlat}`,
          },
          {
            field: "Scope",
            before: "—",
            after: locCode === "ALL" ? "All Countries (Auto FX)" : `${locCode} (${currency})`,
          },
        ],
  });

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

  logAuditEvent({
    module: "coupons",
    action: "delete",
    severity: "warning",
    targetId: couponId,
    targetLabel: couponId,
    summary: `Deleted promotional coupon "${couponId}"`,
    changes: [{ field: "Coupon", before: couponId, after: "Deleted" }],
  });
};

/**
 * Validate and calculate coupon discount in the active country's currency
 * @param {string} rawCode
 * @param {Object} context - { user, orders, cartSubtotal, locationConfig }
 */
export const validateCouponCode = async (
  rawCode,
  { user, orders = [], cartSubtotal = 0, locationConfig = null } = {}
) => {
  const cfg = locationConfig || DEFAULT_LOCATIONS[0];
  const code = (rawCode || "").toUpperCase().trim();
  if (!code) {
    return { valid: false, message: "Please enter a valid coupon code." };
  }

  const coupons = await fetchCoupons();
  const coupon = coupons.find((c) => c.code.toUpperCase() === code);

  if (!coupon || !coupon.isActive) {
    return { valid: false, message: `Coupon code "${code}" is invalid or expired.` };
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return { valid: false, message: `Coupon code "${code}" has expired.` };
  }

  const resolved = resolveCouponForLocation(coupon, cfg);

  if (!resolved.isEligible) {
    return {
      valid: false,
      message: `Coupon "${code}" is not valid in ${cfg.shortName || cfg.name}.`,
    };
  }

  // Check minimum order subtotal in the active country's currency
  if (resolved.minOrderLocal > 0 && cartSubtotal < resolved.minOrderLocal) {
    return {
      valid: false,
      message: `Coupon "${code}" requires a minimum order subtotal of ${resolved.minFormatted}.`,
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

  // Calculate discount amount in the active country's local currency
  let discountAmount = 0;
  if (resolved.discountPercent > 0) {
    discountAmount = (cartSubtotal * resolved.discountPercent) / 100;
  } else if (resolved.discountFlatLocal > 0) {
    discountAmount = Math.min(cartSubtotal, resolved.discountFlatLocal);
  }

  const roundedDiscount = Number(discountAmount.toFixed(2));
  const savedLabel = formatCouponAmount(roundedDiscount, cfg);

  return {
    valid: true,
    coupon: resolved,
    discountAmount: roundedDiscount,
    message: `Coupon "${code}" applied! You saved ${savedLabel}`,
  };
};
