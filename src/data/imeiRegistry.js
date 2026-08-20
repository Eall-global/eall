/**
 * IMEI Authenticity Registry — Nokia & HMD
 * E-ALL Official Distributor
 *
 * Architecture:
 *  1. `tacRegistry`       — TAC (first 8 digits) → model info. Used as fallback.
 *  2. `imeiLookup`        — Individual 15-digit IMEI → full unit record (dual-SIM aware).
 *  3. `verifyIMEI()`      — Main verification function.
 *  4. `parseMultiIMEI()`  — Parses carton-level QR codes that contain multiple IMEIs.
 *
 * Dual-SIM note:
 *  Each Nokia/HMD DS (Dual SIM) device has TWO IMEIs — one per SIM slot.
 *  They are always shipped as a pair. The `pairedImei` field links SIM1 ↔ SIM2.
 *
 * How to add new stock:
 *  - Add real TAC to `tacRegistry` (first 8 digits of any IMEI for that model).
 *  - Add each IMEI pair to `imeiLookup`.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. TAC REGISTRY (model-level, used as fallback when IMEI not in imeiLookup)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TAC → product info mapping. Keys are 8-digit TAC strings.
 * IMPORTANT: Replace placeholder TACs with real ones from your stock.
 * Real TACs are confirmed via *#06# on the device or from the box label.
 */
export const tacRegistry = {
  // ── NOKIA (Real TACs from confirmed stock) ───────────────────────────────
  // Nokia 105 TA-1416 DS — TAC confirmed from carton label 2026/01
  "35168219": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", dualSim: true },

  // ── NOKIA (Placeholder TACs — replace with real values) ──────────────────
  "35894502": { productSlug: "nokia-105-classic", brand: "Nokia", model: "Nokia 105 Classic" },
  "35894503": { productSlug: "nokia-106",         brand: "Nokia", model: "Nokia 106" },
  "35894504": { productSlug: "nokia-108",         brand: "Nokia", model: "Nokia 108" },
  "35894505": { productSlug: "nokia-110",         brand: "Nokia", model: "Nokia 110" },
  "35894506": { productSlug: "nokia-110-4g",      brand: "Nokia", model: "Nokia 110 4G" },
  "35894507": { productSlug: "nokia-112-4g",      brand: "Nokia", model: "Nokia 112 4G" },
  "35894508": { productSlug: "nokia-115-4g",      brand: "Nokia", model: "Nokia 115 4G" },
  "35894509": { productSlug: "nokia-125",         brand: "Nokia", model: "Nokia 125" },
  "35894510": { productSlug: "nokia-130",         brand: "Nokia", model: "Nokia 130" },
  "35894511": { productSlug: "nokia-130-music-edition", brand: "Nokia", model: "Nokia 130 Music Edition" },
  "35894512": { productSlug: "nokia-150",         brand: "Nokia", model: "Nokia 150" },
  "35894513": { productSlug: "nokia-215-4g",      brand: "Nokia", model: "Nokia 215 4G" },
  "35894514": { productSlug: "nokia-220-4g",      brand: "Nokia", model: "Nokia 220 4G" },
  "35894515": { productSlug: "nokia-225-4g",      brand: "Nokia", model: "Nokia 225 4G" },
  "35894516": { productSlug: "nokia-230-4g",      brand: "Nokia", model: "Nokia 230 4G" },
  "35894517": { productSlug: "nokia-235-4g",      brand: "Nokia", model: "Nokia 235 4G" },
  "35894518": { productSlug: "nokia-2660-flip",   brand: "Nokia", model: "Nokia 2660 Flip" },
  "35894519": { productSlug: "nokia-3210",        brand: "Nokia", model: "Nokia 3210" },
  "35894520": { productSlug: "nokia-c2-2nd-edition", brand: "Nokia", model: "Nokia C2 2nd Edition" },
  "35894521": { productSlug: "nokia-g42-5g",      brand: "Nokia", model: "Nokia G42 5G" },

  // ── HMD (Placeholder TACs — replace with real values) ───────────────────
  "35467890": { productSlug: "hmd-100",       brand: "HMD", model: "HMD 100" },
  "35467892": { productSlug: "hmd-101",       brand: "HMD", model: "HMD 101" },
  "35467893": { productSlug: "hmd-102",       brand: "HMD", model: "HMD 102" },
  "35894590": { productSlug: "hmd-105",       brand: "HMD", model: "HMD 105" },
  "35894591": { productSlug: "hmd-130-music", brand: "HMD", model: "HMD 130 Music" },
  "35894592": { productSlug: "hmd-150-music", brand: "HMD", model: "HMD 150 Music" },
  "35123450": { productSlug: "hmd-arc",       brand: "HMD", model: "HMD Arc" },
  "35123451": { productSlug: "hmd-aura2",     brand: "HMD", model: "HMD Aura2" },
  "35123452": { productSlug: "hmd-luma",      brand: "HMD", model: "HMD Luma" },
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. INDIVIDUAL IMEI LOOKUP (unit-level, dual-SIM aware)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Individual IMEI → unit record.
 *
 * Fields:
 *  productSlug  — matches the `slug` field in the product catalogue
 *  brand        — "Nokia" | "HMD"
 *  model        — human-readable model name
 *  sim          — 1 | 2  (which SIM slot this IMEI belongs to)
 *  pairedImei   — the other SIM's IMEI on the same physical device
 *  unitIndex    — 1-based index within the carton (for traceability)
 *  cartonId     — carton/batch identifier (from box label)
 *  color        — device colour variant
 *  mfgDate      — manufacture date from box label (YYYY/MM)
 */
export const imeiLookup = {
  // ════════════════════════════════════════════════════════════════════════════
  // Nokia 105 TA-1416 DS — Carton M83YSL611510074 — 2026/01 — Blue — 10 units
  // ════════════════════════════════════════════════════════════════════════════
  // Unit 1
  "351682194404729": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194430799", unitIndex: 1, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  "351682194430799": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194404729", unitIndex: 1, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  // Unit 2
  "351682194400388": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194404752", unitIndex: 2, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  "351682194404752": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194400388", unitIndex: 2, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  // Unit 3
  "351682194427787": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194422853", unitIndex: 3, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  "351682194422853": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194427787", unitIndex: 3, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  // Unit 4
  "351682194404703": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194395539", unitIndex: 4, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  "351682194395539": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194404703", unitIndex: 4, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  // Unit 5
  "351682194404786": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194400412", unitIndex: 5, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  "351682194400412": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194404786", unitIndex: 5, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  // Unit 6
  "351682194430781": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194404737", unitIndex: 6, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  "351682194404737": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194430781", unitIndex: 6, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  // Unit 7
  "351682194404745": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194400356", unitIndex: 7, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  "351682194400356": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194404745", unitIndex: 7, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  // Unit 8
  "351682194422846": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194427795", unitIndex: 8, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  "351682194427795": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194422846", unitIndex: 8, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  // Unit 9
  "351682194395521": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194404711", unitIndex: 9, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  "351682194404711": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194395521", unitIndex: 9, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  // Unit 10
  "351682194400404": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194404794", unitIndex: 10, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  "351682194404794": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194400404", unitIndex: 10, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. LUHN VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates the IMEI checksum using the Luhn algorithm.
 * @param {string} imei - 15-character IMEI string (digits only)
 * @returns {boolean}
 */
export function validateLuhn(imei) {
  if (!/^\d{15}$/.test(imei)) return false;
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let digit = parseInt(imei[i], 10);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. MULTI-IMEI QR PARSER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parses a raw QR scan value that may contain one or many IMEIs.
 *
 * Carton-level QR codes (like on Nokia shipping boxes) encode all 10 IMEIs
 * for a SIM slot as a single string. This function extracts all 15-digit
 * sequences from the raw value.
 *
 * @param {string} rawValue - Raw string from QR/barcode scanner or URL param
 * @returns {string[]} Array of 15-digit IMEI strings (may be 1 or many)
 */
export function parseMultiIMEI(rawValue) {
  if (!rawValue) return [];

  // If it's a URL with ?imei= param, extract it
  try {
    const url = new URL(rawValue);
    const imeiParam = url.searchParams.get("imei");
    if (imeiParam) rawValue = imeiParam; // eslint-disable-line no-param-reassign
  } catch {
    // Not a URL — use as-is
  }

  // Extract all 15-digit sequences (IMEIs)
  const matches = rawValue.match(/\d{15}/g);
  if (!matches) return [];

  // Deduplicate
  return [...new Set(matches)];
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. MAIN VERIFY FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifies a single IMEI and returns full authenticity details.
 *
 * Priority:
 *  1. Individual IMEI lookup (unit-level, most precise)
 *  2. TAC lookup (model-level fallback)
 *  3. Format / Luhn validation
 *
 * @param {string} rawInput - The 15-digit IMEI (digits only, spaces/dashes stripped)
 * @returns {{
 *   status: 'authentic' | 'not_found' | 'invalid',
 *   imei: string,
 *   tac: string | null,
 *   product: object | null,
 *   message: string,
 *   source: 'unit' | 'tac' | null
 * }}
 */
export function verifyIMEI(rawInput) {
  const imei = String(rawInput).replace(/\D/g, "");

  // ── Format validation ────────────────────────────────────────────────────
  if (imei.length !== 15) {
    return {
      status: "invalid", imei, tac: null, product: null, source: null,
      message: "The IMEI must be exactly 15 digits. Please check and try again.",
    };
  }

  if (!validateLuhn(imei)) {
    return {
      status: "invalid", imei, tac: null, product: null, source: null,
      message: "This IMEI failed the checksum validation. Please ensure it is entered correctly.",
    };
  }

  const tac = imei.slice(0, 8);

  // ── Unit-level lookup (highest confidence) ───────────────────────────────
  const unitEntry = imeiLookup[imei];
  if (unitEntry) {
    return {
      status: "authentic",
      imei,
      tac,
      product: unitEntry,
      source: "unit",
      message: `This is a verified authentic ${unitEntry.brand} ${unitEntry.model} (SIM ${unitEntry.sim}) distributed through E-ALL's official channel.`,
    };
  }

  // ── TAC fallback (model confirmed, unit not individually registered) ──────
  const tacEntry = tacRegistry[tac];
  if (tacEntry) {
    return {
      status: "authentic",
      imei,
      tac,
      product: { ...tacEntry, sim: null, pairedImei: null, unitIndex: null, cartonId: null, color: null, mfgDate: null },
      source: "tac",
      message: `This IMEI belongs to a genuine ${tacEntry.brand} ${tacEntry.model} device. It has not yet been individually registered — contact us to complete unit registration.`,
    };
  }

  // ── Not in registry ───────────────────────────────────────────────────────
  return {
    status: "not_found",
    imei,
    tac,
    product: null,
    source: null,
    message: "This IMEI appears structurally valid, but we could not find it in our Nokia / HMD product registry. If you purchased this device from an authorised distributor, please contact our support team.",
  };
}
