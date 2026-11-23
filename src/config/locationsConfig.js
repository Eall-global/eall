/**
 * E-ALL Global Multi-Country & Multi-Warehouse Locations Registry
 * Supports Tier-1 Global Supply Hubs (AE, CN, HK) and Tier-2 Public Country Storefronts
 * (eall.ae/ae, eall.ae/ke, eall.ae/sn, eall.ae/ug, eall.ae/ci, eall.ae/gh, eall.ae/sa)
 * plus dynamic country additions saved in Firestore `locations` collection.
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

export const LOCATIONS_CACHE_KEY = "eall_global_locations_config";
export const PREFERRED_COUNTRY_KEY = "eall_preferred_country_slug";
export const GEO_DETECTED_CACHE_KEY = "eall_geo_detected_country";
const COLLECTION_NAME = "locations";

export const DEFAULT_LOCATIONS = [
  {
    code: "AE",
    slug: "ae",
    name: "United Arab Emirates",
    shortName: "UAE",
    hubName: "Dubai Main Hub (HQ)",
    city: "Dubai",
    region: "Middle East",
    flag: "🇦🇪",
    type: "main_hub",
    isSupplyHub: true,
    isPublicStorefront: true,
    currency: "AED",
    currencySymbol: "AED",
    locale: "en-AE",
    decimals: 2,
    fxRateFromAed: 1,
    defaultUpliftPercent: 0,
    priceRoundingStep: 1,
    vatRate: 5,
    freeShippingThreshold: 500,
    shippingFee: 25,
    deliveryPromise: "Same-day / Next-day across UAE",
    taxIdLabel: "UAE TRN",
    legalEntityName: "Electronics All FZCO",
    legalTaxId: "104215897200003",
    legalAddress: "Dubai Silicon Oasis, DDP Building A2, Dubai, UAE",
    whatsappDesk: "+971526073267",
    paymentMethods: ["apple_pay", "card", "tabby", "tamara", "cod", "wire"],
    defaultSupplyHubs: ["AE", "HK", "CN"],
    isActive: true,
    sortOrder: 1,
  },
  {
    code: "KE",
    slug: "ke",
    name: "Kenya",
    shortName: "Kenya",
    hubName: "Nairobi Regional Hub",
    city: "Nairobi",
    region: "East Africa",
    flag: "🇰🇪",
    type: "country_store",
    isSupplyHub: false,
    isPublicStorefront: true,
    currency: "KES",
    currencySymbol: "KSh",
    locale: "en-KE",
    decimals: 0,
    fxRateFromAed: 35.2,
    defaultUpliftPercent: 10,
    priceRoundingStep: 500,
    vatRate: 16,
    freeShippingThreshold: 15000,
    shippingFee: 500,
    deliveryPromise: "Same-day Nairobi • 24–48h Nationwide",
    taxIdLabel: "KRA PIN",
    legalEntityName: "E-ALL Electronics Kenya Ltd",
    legalTaxId: "P051900000E",
    legalAddress: "Westlands Commercial Centre, Nairobi, Kenya",
    whatsappDesk: "+971526073267",
    paymentMethods: ["mpesa", "card", "cod", "wire"],
    defaultSupplyHubs: ["AE", "HK", "CN"],
    isActive: true,
    sortOrder: 2,
  },
  {
    code: "SN",
    slug: "sn",
    name: "Senegal",
    shortName: "Senegal",
    hubName: "Dakar West Africa Hub",
    city: "Dakar",
    region: "West Africa",
    flag: "🇸🇳",
    type: "country_store",
    isSupplyHub: false,
    isPublicStorefront: true,
    currency: "XOF",
    currencySymbol: "CFA",
    locale: "fr-SN",
    decimals: 0,
    fxRateFromAed: 165,
    defaultUpliftPercent: 10,
    priceRoundingStep: 1000,
    vatRate: 18,
    freeShippingThreshold: 75000,
    shippingFee: 2500,
    deliveryPromise: "Express 24h Dakar • Nationwide Delivery",
    taxIdLabel: "NINEA",
    legalEntityName: "E-ALL Electronics Sénégal SARL",
    legalTaxId: "009481202",
    legalAddress: "Plateau Business District, Dakar, Senegal",
    whatsappDesk: "+971526073267",
    paymentMethods: ["wave", "orange_money", "card", "cod", "wire"],
    defaultSupplyHubs: ["AE", "HK", "CN"],
    isActive: true,
    sortOrder: 3,
  },
  {
    code: "UG",
    slug: "ug",
    name: "Uganda",
    shortName: "Uganda",
    hubName: "Kampala Distribution Hub",
    city: "Kampala",
    region: "East Africa",
    flag: "🇺🇬",
    type: "country_store",
    isSupplyHub: false,
    isPublicStorefront: true,
    currency: "UGX",
    currencySymbol: "USh",
    locale: "en-UG",
    decimals: 0,
    fxRateFromAed: 1010,
    defaultUpliftPercent: 10,
    priceRoundingStep: 5000,
    vatRate: 18,
    freeShippingThreshold: 500000,
    shippingFee: 15000,
    deliveryPromise: "Express Kampala • 24–48h Nationwide",
    taxIdLabel: "URA TIN",
    legalEntityName: "E-ALL Electronics Uganda Ltd",
    legalTaxId: "1018492001",
    legalAddress: "Kampala Road Business Centre, Kampala, Uganda",
    whatsappDesk: "+971526073267",
    paymentMethods: ["mtn_momo", "airtel_money", "card", "cod", "wire"],
    defaultSupplyHubs: ["AE", "HK", "CN"],
    isActive: true,
    sortOrder: 4,
  },
  {
    code: "CI",
    slug: "ci",
    name: "Côte d'Ivoire",
    shortName: "Côte d'Ivoire",
    hubName: "Abidjan Regional Hub",
    city: "Abidjan",
    region: "West Africa",
    flag: "🇨🇮",
    type: "country_store",
    isSupplyHub: false,
    isPublicStorefront: true,
    currency: "XOF",
    currencySymbol: "CFA",
    locale: "fr-CI",
    decimals: 0,
    fxRateFromAed: 165,
    defaultUpliftPercent: 10,
    priceRoundingStep: 1000,
    vatRate: 18,
    freeShippingThreshold: 75000,
    shippingFee: 2500,
    deliveryPromise: "Express 24h Abidjan • Nationwide Delivery",
    taxIdLabel: "NCC",
    legalEntityName: "E-ALL Electronics Côte d'Ivoire SARL",
    legalTaxId: "CI-ABJ-2026-881",
    legalAddress: "Marcory Zone 4, Abidjan, Côte d'Ivoire",
    whatsappDesk: "+971526073267",
    paymentMethods: ["wave", "orange_money", "card", "cod", "wire"],
    defaultSupplyHubs: ["AE", "HK", "CN"],
    isActive: true,
    sortOrder: 5,
  },
  {
    code: "GH",
    slug: "gh",
    name: "Ghana",
    shortName: "Ghana",
    hubName: "Accra Regional Hub",
    city: "Accra",
    region: "West Africa",
    flag: "🇬🇭",
    type: "country_store",
    isSupplyHub: false,
    isPublicStorefront: true,
    currency: "GHS",
    currencySymbol: "GH₵",
    locale: "en-GH",
    decimals: 2,
    fxRateFromAed: 4.15,
    defaultUpliftPercent: 10,
    priceRoundingStep: 50,
    vatRate: 15,
    freeShippingThreshold: 2000,
    shippingFee: 60,
    deliveryPromise: "Same-day Accra • 24–48h Kumasi & Nationwide",
    taxIdLabel: "GRA TIN",
    legalEntityName: "E-ALL Electronics Ghana Ltd",
    legalTaxId: "C0049201844",
    legalAddress: "Osu Oxford Street, Accra, Ghana",
    whatsappDesk: "+971526073267",
    paymentMethods: ["mtn_momo", "card", "cod", "wire"],
    defaultSupplyHubs: ["AE", "HK", "CN"],
    isActive: true,
    sortOrder: 6,
  },
  {
    code: "SA",
    slug: "sa",
    name: "Saudi Arabia",
    shortName: "Saudi Arabia",
    hubName: "Riyadh GCC Hub",
    city: "Riyadh",
    region: "Middle East",
    flag: "🇸🇦",
    type: "country_store",
    isSupplyHub: false,
    isPublicStorefront: true,
    currency: "SAR",
    currencySymbol: "SAR",
    locale: "en-SA",
    decimals: 2,
    fxRateFromAed: 1.02,
    defaultUpliftPercent: 4,
    priceRoundingStep: 10,
    vatRate: 15,
    freeShippingThreshold: 500,
    shippingFee: 25,
    deliveryPromise: "24–48h Riyadh, Jeddah & Dammam",
    taxIdLabel: "ZATCA VAT",
    legalEntityName: "E-ALL Electronics KSA",
    legalTaxId: "310482910400003",
    legalAddress: "Olaya District, Riyadh, Saudi Arabia",
    whatsappDesk: "+971526073267",
    paymentMethods: ["apple_pay", "card", "tabby", "tamara", "cod", "wire"],
    defaultSupplyHubs: ["AE", "HK", "CN"],
    isActive: true,
    sortOrder: 7,
  },
  // TIER-1 BACK-OFFICE ONLY GLOBAL SOURCING & SUPPLY HUBS
  {
    code: "CN",
    slug: "cn",
    name: "China",
    shortName: "China Hub",
    hubName: "China Sourcing Warehouse (Shenzhen)",
    city: "Shenzhen",
    region: "East Asia",
    flag: "🇨🇳",
    type: "supply_hub",
    isSupplyHub: true,
    isPublicStorefront: false,
    currency: "USD",
    currencySymbol: "USD",
    locale: "en-US",
    decimals: 2,
    fxRateFromAed: 0.2723,
    defaultUpliftPercent: 0,
    priceRoundingStep: 1,
    vatRate: 0,
    freeShippingThreshold: 0,
    shippingFee: 0,
    deliveryPromise: "Global Air & Sea Export Hub",
    taxIdLabel: "Export License",
    legalEntityName: "E-ALL China Sourcing Hub",
    legalTaxId: "CN-SZ-EXP-8821",
    legalAddress: "Futian District, Shenzhen, Guangdong, China",
    whatsappDesk: "+971526073267",
    paymentMethods: ["wire"],
    defaultSupplyHubs: [],
    isActive: true,
    sortOrder: 90,
  },
  {
    code: "HK",
    slug: "hk",
    name: "Hong Kong",
    shortName: "Hong Kong Hub",
    hubName: "Hong Kong Trading & Transit Hub",
    city: "Hong Kong",
    region: "East Asia",
    flag: "🇭🇰",
    type: "supply_hub",
    isSupplyHub: true,
    isPublicStorefront: false,
    currency: "USD",
    currencySymbol: "USD",
    locale: "en-US",
    decimals: 2,
    fxRateFromAed: 0.2723,
    defaultUpliftPercent: 0,
    priceRoundingStep: 1,
    vatRate: 0,
    freeShippingThreshold: 0,
    shippingFee: 0,
    deliveryPromise: "Global Air Cargo & Transit Export",
    taxIdLabel: "HK BRN",
    legalEntityName: "E-ALL Hong Kong Trading Ltd",
    legalTaxId: "HK-BR-74829104",
    legalAddress: "Kowloon Bay Cargo Centre, Hong Kong",
    whatsappDesk: "+971526073267",
    paymentMethods: ["wire"],
    defaultSupplyHubs: [],
    isActive: true,
    sortOrder: 91,
  },
];

export const DEFAULT_COUNTRY_SLUG = "ae";

export const TIMEZONE_TO_COUNTRY_CODE = {
  "Asia/Dubai": "AE",
  "Asia/Muscat": "AE",
  "Africa/Nairobi": "KE",
  "Africa/Dakar": "SN",
  "Africa/Kampala": "UG",
  "Africa/Abidjan": "CI",
  "Africa/Accra": "GH",
  "Asia/Riyadh": "SA",
  "Asia/Shanghai": "CN",
  "Asia/Hong_Kong": "HK",
};

export const normalizeLocationConfig = (raw = {}) => {
  const code = String(raw.code || "AE").trim().toUpperCase();
  const slug = String(raw.slug || code).trim().toLowerCase();
  return {
    code,
    slug,
    name: String(raw.name || code).trim(),
    shortName: String(raw.shortName || raw.name || code).trim(),
    hubName: String(raw.hubName || `${raw.name || code} Hub`).trim(),
    city: String(raw.city || "").trim(),
    region: String(raw.region || "Global").trim(),
    flag: raw.flag || "🌍",
    type: raw.type || (raw.isSupplyHub ? "supply_hub" : "country_store"),
    isSupplyHub: Boolean(raw.isSupplyHub),
    isPublicStorefront: raw.isPublicStorefront !== false,
    currency: String(raw.currency || "AED").trim().toUpperCase(),
    currencySymbol: String(raw.currencySymbol || raw.currency || "AED").trim(),
    locale: raw.locale || "en-AE",
    decimals: Number.isFinite(Number(raw.decimals)) ? Number(raw.decimals) : 2,
    fxRateFromAed: Math.max(0.0001, Number(raw.fxRateFromAed) || 1),
    defaultUpliftPercent: Number(raw.defaultUpliftPercent) || 0,
    priceRoundingStep: Math.max(1, Number(raw.priceRoundingStep) || 1),
    vatRate: Math.max(0, Number(raw.vatRate ?? 5)),
    freeShippingThreshold: Math.max(0, Number(raw.freeShippingThreshold ?? 500)),
    shippingFee: Math.max(0, Number(raw.shippingFee ?? 25)),
    deliveryPromise: String(
      raw.deliveryPromise || "Express Doorstep Delivery"
    ).trim(),
    taxIdLabel: String(raw.taxIdLabel || "Tax ID").trim(),
    legalEntityName: String(raw.legalEntityName || "Electronics All FZCO").trim(),
    legalTaxId: String(raw.legalTaxId || "").trim(),
    legalAddress: String(raw.legalAddress || "").trim(),
    whatsappDesk: String(raw.whatsappDesk || "+971526073267").trim(),
    paymentMethods: Array.isArray(raw.paymentMethods) && raw.paymentMethods.length > 0
      ? raw.paymentMethods
      : ["card", "cod", "wire"],
    defaultSupplyHubs: Array.isArray(raw.defaultSupplyHubs)
      ? raw.defaultSupplyHubs
      : ["AE", "HK", "CN"],
    isActive: raw.isActive !== false,
    sortOrder: Number(raw.sortOrder ?? 50),
  };
};

/**
 * 3-Tier Multi-Country Price Resolution Engine:
 * Tier 1: Explicit local override price (e.g., set by Country Manager or Landed Cost Calculator)
 * Tier 2: AED Base Price * FX Rate * (1 + Country Uplift %) rounded cleanly to local rounding step
 */
export const convertAedToLocalPrice = (
  aedPrice,
  locationConfig,
  explicitLocalPrice = 0
) => {
  const explicit = Number(explicitLocalPrice) || 0;
  if (explicit > 0) return explicit;

  const baseAed = Number(aedPrice) || 0;
  if (baseAed <= 0) return 0;

  if (!locationConfig || locationConfig.code === "AE") {
    return Math.round(baseAed * 100) / 100;
  }

  const fx = Number(locationConfig.fxRateFromAed) || 1;
  const uplift = 1 + (Number(locationConfig.defaultUpliftPercent) || 0) / 100;
  const rawLocal = baseAed * fx * uplift;
  const step = Math.max(1, Number(locationConfig.priceRoundingStep) || 1);

  if (step > 1) {
    return Math.round(rawLocal / step) * step;
  }
  const decimals = Number(locationConfig.decimals ?? 2);
  return decimals === 0
    ? Math.round(rawLocal)
    : Math.round(rawLocal * 100) / 100;
};

/**
 * Formats a numeric amount in the active country's currency
 */
export const formatLocalMoney = (amount, locationConfig) => {
  const cfg = locationConfig || DEFAULT_LOCATIONS[0];
  const num = Number(amount) || 0;
  const decimals = Number.isFinite(Number(cfg.decimals))
    ? Number(cfg.decimals)
    : 2;
  const formatted = num.toLocaleString(cfg.locale || "en-AE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${cfg.currencySymbol || cfg.currency || "AED"} ${formatted}`;
};

/**
 * Extract leading /:countrySlug from a URL pathname if it matches a known storefront slug
 */
export const extractCountrySlugFromPath = (
  pathname = "/",
  validSlugs = ["ae", "ke", "sn", "ug", "ci", "gh", "sa"]
) => {
  const segments = String(pathname || "/")
    .split("/")
    .filter(Boolean);
  if (segments.length === 0) return null;
  const first = segments[0].toLowerCase();
  return validSlugs.includes(first) ? first : null;
};

/**
 * Strip leading /:countrySlug from a URL pathname so we can switch countries on the same page
 */
export const stripCountryPrefix = (
  pathname = "/",
  validSlugs = ["ae", "ke", "sn", "ug", "ci", "gh", "sa"]
) => {
  const segments = String(pathname || "/")
    .split("/")
    .filter(Boolean);
  if (segments.length === 0) return "/";
  if (validSlugs.includes(segments[0].toLowerCase())) {
    const rest = segments.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
};

/**
 * Build a country-prefixed storefront URL cleanly
 * Example: buildCountryPath("/products?brand=apple", "ke") -> "/ke/products?brand=apple"
 */
export const buildCountryPath = (
  targetPath = "/",
  countrySlug = DEFAULT_COUNTRY_SLUG,
  validSlugs = ["ae", "ke", "sn", "ug", "ci", "gh", "sa"]
) => {
  if (!targetPath) return `/${countrySlug}`;
  if (
    targetPath.startsWith("http://") ||
    targetPath.startsWith("https://") ||
    targetPath.startsWith("mailto:") ||
    targetPath.startsWith("tel:") ||
    targetPath.startsWith("#")
  ) {
    return targetPath;
  }

  const [pathOnly, queryAndHash = ""] = targetPath.split(/(?=[?#])/);
  if (pathOnly === "/portal" || pathOnly.startsWith("/portal/")) {
    return targetPath;
  }

  const clean = stripCountryPrefix(pathOnly || "/", validSlugs);
  const prefixed = clean === "/" ? `/${countrySlug}` : `/${countrySlug}${clean}`;
  return `${prefixed}${queryAndHash}`;
};

/**
 * Fetch global locations config from Firestore (merged with DEFAULT_LOCATIONS)
 */
export const fetchLocationsConfig = async () => {
  const defaultMap = new Map(
    DEFAULT_LOCATIONS.map((loc) => [loc.code, normalizeLocationConfig(loc)])
  );

  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      if (!snap.empty) {
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          const norm = normalizeLocationConfig({
            code: docSnap.id,
            ...data,
          });
          defaultMap.set(norm.code, norm);
        });
      }
      const list = Array.from(defaultMap.values()).sort(
        (a, b) => (a.sortOrder ?? 50) - (b.sortOrder ?? 50)
      );
      try {
        localStorage.setItem(LOCATIONS_CACHE_KEY, JSON.stringify(list));
      } catch {
        // ignore storage quota errors
      }
      return list;
    } catch (e) {
      console.warn("Could not fetch locations from Firestore:", e);
    }
  }

  try {
    const cached = localStorage.getItem(LOCATIONS_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.forEach((item) => {
          const norm = normalizeLocationConfig(item);
          defaultMap.set(norm.code, norm);
        });
      }
    }
  } catch {
    // ignore parse errors
  }

  return Array.from(defaultMap.values()).sort(
    (a, b) => (a.sortOrder ?? 50) - (b.sortOrder ?? 50)
  );
};

/**
 * Save or add a country/hub configuration in Firestore `locations/{code}`
 */
export const saveLocationConfig = async (locationData) => {
  const normalized = normalizeLocationConfig(locationData);
  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    await setDoc(doc(db, COLLECTION_NAME, normalized.code), normalized, {
      merge: true,
    });
  }

  const current = await fetchLocationsConfig();
  const map = new Map(current.map((c) => [c.code, c]));
  map.set(normalized.code, normalized);
  const next = Array.from(map.values()).sort(
    (a, b) => (a.sortOrder ?? 50) - (b.sortOrder ?? 50)
  );
  try {
    localStorage.setItem(LOCATIONS_CACHE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
};

/**
 * Delete a custom location from Firestore `locations/{code}` (never deletes core AE/CN/HK hubs)
 */
export const deleteLocationConfig = async (code) => {
  const upper = String(code || "").toUpperCase();
  if (["AE", "CN", "HK"].includes(upper)) {
    throw new Error("Core global supply hubs (AE, CN, HK) cannot be deleted.");
  }
  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    await deleteDoc(doc(db, COLLECTION_NAME, upper));
  }
  return fetchLocationsConfig();
};

