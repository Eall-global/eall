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
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. TAC REGISTRY (model-level, used as fallback when IMEI not in imeiLookup)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TAC → product info mapping. Keys are 8-digit TAC strings.
 * Real TACs are confirmed via *#06# on the device or from the box label.
 */
export const tacRegistry = {
  // ── NOKIA (Real TACs from confirmed stock) ───────────────────────────────
  // Nokia 105 TA-1416 DS — TAC confirmed from carton labels 2026/01
  "35168219": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", dualSim: true },

  // ── NOKIA (Placeholder TACs — replace with real values as stock arrives) ──
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

  // ── HMD (Placeholder TACs — replace with real values as stock arrives) ───
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
  // BOX 1: Nokia 105 TA-1416 DS — Carton M83YSL611510074 — 2026/01 — Blue (10 Units)
  // ════════════════════════════════════════════════════════════════════════════
  // Unit 1
  "351682194404729": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194404737", unitIndex: 1, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  "351682194404737": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194404729", unitIndex: 1, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  // Unit 2
  "351682194400388": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194400396", unitIndex: 2, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  "351682194400396": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194400388", unitIndex: 2, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  // Unit 3
  "351682194427787": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194427795", unitIndex: 3, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  "351682194427795": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194427787", unitIndex: 3, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  // Unit 4
  "351682194404703": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194404711", unitIndex: 4, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  "351682194404711": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194404703", unitIndex: 4, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  // Unit 5
  "351682194404786": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194404794", unitIndex: 5, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  "351682194404794": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194404786", unitIndex: 5, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  // Unit 6
  "351682194430781": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194430799", unitIndex: 6, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  "351682194430799": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194430781", unitIndex: 6, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  // Unit 7
  "351682194404745": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194404752", unitIndex: 7, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  "351682194404752": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194404745", unitIndex: 7, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  // Unit 8
  "351682194422846": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194422853", unitIndex: 8, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  "351682194422853": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194422846", unitIndex: 8, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  // Unit 9
  "351682194395521": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194395539", unitIndex: 9, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  "351682194395539": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194395521", unitIndex: 9, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  // Unit 10
  "351682194400404": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194400412", unitIndex: 10, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },
  "351682194400412": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194400404", unitIndex: 10, cartonId: "M83YSL611510074", color: "Blue", mfgDate: "2026/01" },

  // ════════════════════════════════════════════════════════════════════════════
  // BOX 2: Nokia 105 TA-1416 DS — Carton M83YSL611510073 — 2026/01 — Blue (10 Units)
  // ════════════════════════════════════════════════════════════════════════════
  // Unit 1
  "351682194390605": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194390613", unitIndex: 1, cartonId: "M83YSL611510073", color: "Blue", mfgDate: "2026/01" },
  "351682194390613": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194390605", unitIndex: 1, cartonId: "M83YSL611510073", color: "Blue", mfgDate: "2026/01" },
  // Unit 2
  "351682194390902": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194390910", unitIndex: 2, cartonId: "M83YSL611510073", color: "Blue", mfgDate: "2026/01" },
  "351682194390910": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194390902", unitIndex: 2, cartonId: "M83YSL611510073", color: "Blue", mfgDate: "2026/01" },
  // Unit 3
  "351682194392544": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194392551", unitIndex: 3, cartonId: "M83YSL611510073", color: "Blue", mfgDate: "2026/01" },
  "351682194392551": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194392544", unitIndex: 3, cartonId: "M83YSL611510073", color: "Blue", mfgDate: "2026/01" },
  // Unit 4
  "351682194388765": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194388773", unitIndex: 4, cartonId: "M83YSL611510073", color: "Blue", mfgDate: "2026/01" },
  "351682194388773": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194388765", unitIndex: 4, cartonId: "M83YSL611510073", color: "Blue", mfgDate: "2026/01" },
  // Unit 5
  "351682194420568": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194420576", unitIndex: 5, cartonId: "M83YSL611510073", color: "Blue", mfgDate: "2026/01" },
  "351682194420576": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194420568", unitIndex: 5, cartonId: "M83YSL611510073", color: "Blue", mfgDate: "2026/01" },
  // Unit 6
  "351682194400081": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194400099", unitIndex: 6, cartonId: "M83YSL611510073", color: "Blue", mfgDate: "2026/01" },
  "351682194400099": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194400081", unitIndex: 6, cartonId: "M83YSL611510073", color: "Blue", mfgDate: "2026/01" },
  // Unit 7
  "351682194396669": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194396677", unitIndex: 7, cartonId: "M83YSL611510073", color: "Blue", mfgDate: "2026/01" },
  "351682194396677": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194396669", unitIndex: 7, cartonId: "M83YSL611510073", color: "Blue", mfgDate: "2026/01" },
  // Unit 8
  "351682194405924": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194405932", unitIndex: 8, cartonId: "M83YSL611510073", color: "Blue", mfgDate: "2026/01" },
  "351682194405932": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194405924", unitIndex: 8, cartonId: "M83YSL611510073", color: "Blue", mfgDate: "2026/01" },
  // Unit 9
  "351682194392403": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194392411", unitIndex: 9, cartonId: "M83YSL611510073", color: "Blue", mfgDate: "2026/01" },
  "351682194392411": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194392403", unitIndex: 9, cartonId: "M83YSL611510073", color: "Blue", mfgDate: "2026/01" },
  // Unit 10
  "351682194399002": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194399010", unitIndex: 10, cartonId: "M83YSL611510073", color: "Blue", mfgDate: "2026/01" },
  "351682194399010": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194399002", unitIndex: 10, cartonId: "M83YSL611510073", color: "Blue", mfgDate: "2026/01" },

  // ════════════════════════════════════════════════════════════════════════════
  // BOX 3: Nokia 105 TA-1416 DS — Carton M83YSL611510099 — 2026/01 — Blue (10 Units)
  // ════════════════════════════════════════════════════════════════════════════
  // Unit 1
  "351682194411047": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194411054", unitIndex: 1, cartonId: "M83YSL611510099", color: "Blue", mfgDate: "2026/01" },
  "351682194411054": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194411047", unitIndex: 1, cartonId: "M83YSL611510099", color: "Blue", mfgDate: "2026/01" },
  // Unit 2
  "351682194398202": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194398210", unitIndex: 2, cartonId: "M83YSL611510099", color: "Blue", mfgDate: "2026/01" },
  "351682194398210": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194398202", unitIndex: 2, cartonId: "M83YSL611510099", color: "Blue", mfgDate: "2026/01" },
  // Unit 3
  "351682194405403": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194405411", unitIndex: 3, cartonId: "M83YSL611510099", color: "Blue", mfgDate: "2026/01" },
  "351682194405411": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194405403", unitIndex: 3, cartonId: "M83YSL611510099", color: "Blue", mfgDate: "2026/01" },
  // Unit 4
  "351682194428488": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194428496", unitIndex: 4, cartonId: "M83YSL611510099", color: "Blue", mfgDate: "2026/01" },
  "351682194428496": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194428488", unitIndex: 4, cartonId: "M83YSL611510099", color: "Blue", mfgDate: "2026/01" },
  // Unit 5
  "351682194430724": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194430732", unitIndex: 5, cartonId: "M83YSL611510099", color: "Blue", mfgDate: "2026/01" },
  "351682194430732": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194430724", unitIndex: 5, cartonId: "M83YSL611510099", color: "Blue", mfgDate: "2026/01" },
  // Unit 6
  "351682194411260": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194411278", unitIndex: 6, cartonId: "M83YSL611510099", color: "Blue", mfgDate: "2026/01" },
  "351682194411278": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194411260", unitIndex: 6, cartonId: "M83YSL611510099", color: "Blue", mfgDate: "2026/01" },
  // Unit 7
  "351682194430740": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194430757", unitIndex: 7, cartonId: "M83YSL611510099", color: "Blue", mfgDate: "2026/01" },
  "351682194430757": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194430740", unitIndex: 7, cartonId: "M83YSL611510099", color: "Blue", mfgDate: "2026/01" },
  // Unit 8
  "351682194395844": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194395851", unitIndex: 8, cartonId: "M83YSL611510099", color: "Blue", mfgDate: "2026/01" },
  "351682194395851": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194395844", unitIndex: 8, cartonId: "M83YSL611510099", color: "Blue", mfgDate: "2026/01" },
  // Unit 9
  "351682194428520": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194428538", unitIndex: 9, cartonId: "M83YSL611510099", color: "Blue", mfgDate: "2026/01" },
  "351682194428538": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194428520", unitIndex: 9, cartonId: "M83YSL611510099", color: "Blue", mfgDate: "2026/01" },
  // Unit 10
  "351682194395828": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194395836", unitIndex: 10, cartonId: "M83YSL611510099", color: "Blue", mfgDate: "2026/01" },
  "351682194395836": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194395828", unitIndex: 10, cartonId: "M83YSL611510099", color: "Blue", mfgDate: "2026/01" },

  // ════════════════════════════════════════════════════════════════════════════
  // BOX 4: Nokia 105 TA-1416 DS — Carton M56YSL611310004 — 2026/01 — Charcoal (10 Units)
  // ════════════════════════════════════════════════════════════════════════════
  // Unit 1
  "351682194189502": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194189510", unitIndex: 1, cartonId: "M56YSL611310004", color: "Charcoal", mfgDate: "2026/01" },
  "351682194189510": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194189502", unitIndex: 1, cartonId: "M56YSL611310004", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 2
  "351682194129227": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194129235", unitIndex: 2, cartonId: "M56YSL611310004", color: "Charcoal", mfgDate: "2026/01" },
  "351682194129235": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194129227", unitIndex: 2, cartonId: "M56YSL611310004", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 3
  "351682194189486": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194189494", unitIndex: 3, cartonId: "M56YSL611310004", color: "Charcoal", mfgDate: "2026/01" },
  "351682194189494": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194189486", unitIndex: 3, cartonId: "M56YSL611310004", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 4
  "351682194193389": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194193397", unitIndex: 4, cartonId: "M56YSL611310004", color: "Charcoal", mfgDate: "2026/01" },
  "351682194193397": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194193389", unitIndex: 4, cartonId: "M56YSL611310004", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 5
  "351682194189403": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194189411", unitIndex: 5, cartonId: "M56YSL611310004", color: "Charcoal", mfgDate: "2026/01" },
  "351682194189411": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194189403", unitIndex: 5, cartonId: "M56YSL611310004", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 6
  "351682194193405": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194193413", unitIndex: 6, cartonId: "M56YSL611310004", color: "Charcoal", mfgDate: "2026/01" },
  "351682194193413": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194193405", unitIndex: 6, cartonId: "M56YSL611310004", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 7
  "351682194111746": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194111753", unitIndex: 7, cartonId: "M56YSL611310004", color: "Charcoal", mfgDate: "2026/01" },
  "351682194111753": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194111746", unitIndex: 7, cartonId: "M56YSL611310004", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 8
  "351682194072724": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194072732", unitIndex: 8, cartonId: "M56YSL611310004", color: "Charcoal", mfgDate: "2026/01" },
  "351682194072732": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194072724", unitIndex: 8, cartonId: "M56YSL611310004", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 9
  "351682194199469": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194199477", unitIndex: 9, cartonId: "M56YSL611310004", color: "Charcoal", mfgDate: "2026/01" },
  "351682194199477": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194199469", unitIndex: 9, cartonId: "M56YSL611310004", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 10
  "351682194072765": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194072773", unitIndex: 10, cartonId: "M56YSL611310004", color: "Charcoal", mfgDate: "2026/01" },
  "351682194072773": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194072765", unitIndex: 10, cartonId: "M56YSL611310004", color: "Charcoal", mfgDate: "2026/01" },

  // ════════════════════════════════════════════════════════════════════════════
  // BOX 5: Nokia 105 TA-1416 DS — Carton M56YSL611310047 — 2026/01 — Charcoal (10 Units)
  // ════════════════════════════════════════════════════════════════════════════
  // Unit 1
  "351682194115325": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194115333", unitIndex: 1, cartonId: "M56YSL611310047", color: "Charcoal", mfgDate: "2026/01" },
  "351682194115333": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194115325", unitIndex: 1, cartonId: "M56YSL611310047", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 2
  "351682194193660": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194193678", unitIndex: 2, cartonId: "M56YSL611310047", color: "Charcoal", mfgDate: "2026/01" },
  "351682194193678": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194193660", unitIndex: 2, cartonId: "M56YSL611310047", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 3
  "351682194207023": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194207031", unitIndex: 3, cartonId: "M56YSL611310047", color: "Charcoal", mfgDate: "2026/01" },
  "351682194207031": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194207023", unitIndex: 3, cartonId: "M56YSL611310047", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 4
  "351682194199048": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194199055", unitIndex: 4, cartonId: "M56YSL611310047", color: "Charcoal", mfgDate: "2026/01" },
  "351682194199055": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194199048", unitIndex: 4, cartonId: "M56YSL611310047", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 5
  "351682194115341": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194115358", unitIndex: 5, cartonId: "M56YSL611310047", color: "Charcoal", mfgDate: "2026/01" },
  "351682194115358": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194115341", unitIndex: 5, cartonId: "M56YSL611310047", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 6
  "351682194199063": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194199071", unitIndex: 6, cartonId: "M56YSL611310047", color: "Charcoal", mfgDate: "2026/01" },
  "351682194199071": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194199063", unitIndex: 6, cartonId: "M56YSL611310047", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 7
  "351682194199147": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194199154", unitIndex: 7, cartonId: "M56YSL611310047", color: "Charcoal", mfgDate: "2026/01" },
  "351682194199154": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194199147", unitIndex: 7, cartonId: "M56YSL611310047", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 8
  "351682194202883": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194202891", unitIndex: 8, cartonId: "M56YSL611310047", color: "Charcoal", mfgDate: "2026/01" },
  "351682194202891": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194202883", unitIndex: 8, cartonId: "M56YSL611310047", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 9
  "351682194206926": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194206934", unitIndex: 9, cartonId: "M56YSL611310047", color: "Charcoal", mfgDate: "2026/01" },
  "351682194206934": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194206926", unitIndex: 9, cartonId: "M56YSL611310047", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 10
  "351682194114088": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194114096", unitIndex: 10, cartonId: "M56YSL611310047", color: "Charcoal", mfgDate: "2026/01" },
  "351682194114096": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194114088", unitIndex: 10, cartonId: "M56YSL611310047", color: "Charcoal", mfgDate: "2026/01" },

  // ════════════════════════════════════════════════════════════════════════════
  // BOX 6: Nokia 105 TA-1416 DS — Carton M56YSL611310144 — 2026/01 — Charcoal (10 Units)
  // ════════════════════════════════════════════════════════════════════════════
  // Unit 1
  "351682194114526": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194114534", unitIndex: 1, cartonId: "M56YSL611310144", color: "Charcoal", mfgDate: "2026/01" },
  "351682194114534": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194114526", unitIndex: 1, cartonId: "M56YSL611310144", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 2
  "351682194126967": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194126975", unitIndex: 2, cartonId: "M56YSL611310144", color: "Charcoal", mfgDate: "2026/01" },
  "351682194126975": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194126967", unitIndex: 2, cartonId: "M56YSL611310144", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 3
  "351682194192241": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194192258", unitIndex: 3, cartonId: "M56YSL611310144", color: "Charcoal", mfgDate: "2026/01" },
  "351682194192258": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194192241", unitIndex: 3, cartonId: "M56YSL611310144", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 4
  "351682194192100": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194192118", unitIndex: 4, cartonId: "M56YSL611310144", color: "Charcoal", mfgDate: "2026/01" },
  "351682194192118": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194192100", unitIndex: 4, cartonId: "M56YSL611310144", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 5
  "351682194114567": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194114575", unitIndex: 5, cartonId: "M56YSL611310144", color: "Charcoal", mfgDate: "2026/01" },
  "351682194114575": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194114567", unitIndex: 5, cartonId: "M56YSL611310144", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 6
  "351682194192142": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194192159", unitIndex: 6, cartonId: "M56YSL611310144", color: "Charcoal", mfgDate: "2026/01" },
  "351682194192159": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194192142", unitIndex: 6, cartonId: "M56YSL611310144", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 7
  "351682194126843": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194126850", unitIndex: 7, cartonId: "M56YSL611310144", color: "Charcoal", mfgDate: "2026/01" },
  "351682194126850": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194126843", unitIndex: 7, cartonId: "M56YSL611310144", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 8
  "351682194129805": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194129813", unitIndex: 8, cartonId: "M56YSL611310144", color: "Charcoal", mfgDate: "2026/01" },
  "351682194129813": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194129805", unitIndex: 8, cartonId: "M56YSL611310144", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 9
  "351682194129706": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194129714", unitIndex: 9, cartonId: "M56YSL611310144", color: "Charcoal", mfgDate: "2026/01" },
  "351682194129714": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194129706", unitIndex: 9, cartonId: "M56YSL611310144", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 10
  "351682194127841": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194127858", unitIndex: 10, cartonId: "M56YSL611310144", color: "Charcoal", mfgDate: "2026/01" },
  "351682194127858": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194127841", unitIndex: 10, cartonId: "M56YSL611310144", color: "Charcoal", mfgDate: "2026/01" },

  // ════════════════════════════════════════════════════════════════════════════
  // BOX 7: Nokia 105 TA-1416 DS — Carton M56YSL611310120 — 2026/01 — Charcoal (10 Units)
  // ════════════════════════════════════════════════════════════════════════════
  // Unit 1
  "351682194199022": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194199030", unitIndex: 1, cartonId: "M56YSL611310120", color: "Charcoal", mfgDate: "2026/01" },
  "351682194199030": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194199022", unitIndex: 1, cartonId: "M56YSL611310120", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 2
  "351682194132262": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194132270", unitIndex: 2, cartonId: "M56YSL611310120", color: "Charcoal", mfgDate: "2026/01" },
  "351682194132270": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194132262", unitIndex: 2, cartonId: "M56YSL611310120", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 3
  "351682194118246": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194118253", unitIndex: 3, cartonId: "M56YSL611310120", color: "Charcoal", mfgDate: "2026/01" },
  "351682194118253": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194118246", unitIndex: 3, cartonId: "M56YSL611310120", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 4
  "351682194206421": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194206439", unitIndex: 4, cartonId: "M56YSL611310120", color: "Charcoal", mfgDate: "2026/01" },
  "351682194206439": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194206421", unitIndex: 4, cartonId: "M56YSL611310120", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 5
  "351682194117024": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194117032", unitIndex: 5, cartonId: "M56YSL611310120", color: "Charcoal", mfgDate: "2026/01" },
  "351682194117032": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194117024", unitIndex: 5, cartonId: "M56YSL611310120", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 6
  "351682194132247": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194132254", unitIndex: 6, cartonId: "M56YSL611310120", color: "Charcoal", mfgDate: "2026/01" },
  "351682194132254": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194132247", unitIndex: 6, cartonId: "M56YSL611310120", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 7
  "351682194132288": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194132296", unitIndex: 7, cartonId: "M56YSL611310120", color: "Charcoal", mfgDate: "2026/01" },
  "351682194132296": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194132288", unitIndex: 7, cartonId: "M56YSL611310120", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 8
  "351682194132361": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194132379", unitIndex: 8, cartonId: "M56YSL611310120", color: "Charcoal", mfgDate: "2026/01" },
  "351682194132379": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194132361", unitIndex: 8, cartonId: "M56YSL611310120", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 9
  "351682194198909": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194198917", unitIndex: 9, cartonId: "M56YSL611310120", color: "Charcoal", mfgDate: "2026/01" },
  "351682194198917": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194198909", unitIndex: 9, cartonId: "M56YSL611310120", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 10
  "351682194206603": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194206611", unitIndex: 10, cartonId: "M56YSL611310120", color: "Charcoal", mfgDate: "2026/01" },
  "351682194206611": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194206603", unitIndex: 10, cartonId: "M56YSL611310120", color: "Charcoal", mfgDate: "2026/01" },

  // ════════════════════════════════════════════════════════════════════════════
  // BOX 8: Nokia 105 TA-1416 DS — Carton M56YSL611310108 — 2026/01 — Charcoal (10 Units)
  // ════════════════════════════════════════════════════════════════════════════
  // Unit 1
  "351682194191607": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194191615", unitIndex: 1, cartonId: "M56YSL611310108", color: "Charcoal", mfgDate: "2026/01" },
  "351682194191615": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194191607", unitIndex: 1, cartonId: "M56YSL611310108", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 2
  "351682194117404": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194117412", unitIndex: 2, cartonId: "M56YSL611310108", color: "Charcoal", mfgDate: "2026/01" },
  "351682194117412": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194117404", unitIndex: 2, cartonId: "M56YSL611310108", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 3
  "351682194125985": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194125993", unitIndex: 3, cartonId: "M56YSL611310108", color: "Charcoal", mfgDate: "2026/01" },
  "351682194125993": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194125985", unitIndex: 3, cartonId: "M56YSL611310108", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 4
  "351682194191524": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194191532", unitIndex: 4, cartonId: "M56YSL611310108", color: "Charcoal", mfgDate: "2026/01" },
  "351682194191532": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194191524", unitIndex: 4, cartonId: "M56YSL611310108", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 5
  "351682194119400": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194119418", unitIndex: 5, cartonId: "M56YSL611310108", color: "Charcoal", mfgDate: "2026/01" },
  "351682194119418": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194119400", unitIndex: 5, cartonId: "M56YSL611310108", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 6
  "351682194191565": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194191573", unitIndex: 6, cartonId: "M56YSL611310108", color: "Charcoal", mfgDate: "2026/01" },
  "351682194191573": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194191565", unitIndex: 6, cartonId: "M56YSL611310108", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 7
  "351682194117487": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194117495", unitIndex: 7, cartonId: "M56YSL611310108", color: "Charcoal", mfgDate: "2026/01" },
  "351682194117495": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194117487", unitIndex: 7, cartonId: "M56YSL611310108", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 8
  "351682194119509": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194119517", unitIndex: 8, cartonId: "M56YSL611310108", color: "Charcoal", mfgDate: "2026/01" },
  "351682194119517": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194119509", unitIndex: 8, cartonId: "M56YSL611310108", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 9
  "351682194197661": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194197679", unitIndex: 9, cartonId: "M56YSL611310108", color: "Charcoal", mfgDate: "2026/01" },
  "351682194197679": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194197661", unitIndex: 9, cartonId: "M56YSL611310108", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 10
  "351682194125928": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194125936", unitIndex: 10, cartonId: "M56YSL611310108", color: "Charcoal", mfgDate: "2026/01" },
  "351682194125936": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194125928", unitIndex: 10, cartonId: "M56YSL611310108", color: "Charcoal", mfgDate: "2026/01" },

  // ════════════════════════════════════════════════════════════════════════════
  // BOX 9: Nokia 105 TA-1416 DS — Carton M56YSL611310133 — 2026/01 — Charcoal (10 Units)
  // ════════════════════════════════════════════════════════════════════════════
  // Unit 1
  "351682194194346": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194194353", unitIndex: 1, cartonId: "M56YSL611310133", color: "Charcoal", mfgDate: "2026/01" },
  "351682194194353": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194194346", unitIndex: 1, cartonId: "M56YSL611310133", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 2
  "351682194111043": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194111050", unitIndex: 2, cartonId: "M56YSL611310133", color: "Charcoal", mfgDate: "2026/01" },
  "351682194111050": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194111043", unitIndex: 2, cartonId: "M56YSL611310133", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 3
  "351682194201760": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194201778", unitIndex: 3, cartonId: "M56YSL611310133", color: "Charcoal", mfgDate: "2026/01" },
  "351682194201778": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194201760", unitIndex: 3, cartonId: "M56YSL611310133", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 4
  "351682194194320": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194194338", unitIndex: 4, cartonId: "M56YSL611310133", color: "Charcoal", mfgDate: "2026/01" },
  "351682194194338": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194194320", unitIndex: 4, cartonId: "M56YSL611310133", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 5
  "351682194115606": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194115614", unitIndex: 5, cartonId: "M56YSL611310133", color: "Charcoal", mfgDate: "2026/01" },
  "351682194115614": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194115606", unitIndex: 5, cartonId: "M56YSL611310133", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 6
  "351682194206264": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194206272", unitIndex: 6, cartonId: "M56YSL611310133", color: "Charcoal", mfgDate: "2026/01" },
  "351682194206272": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194206264", unitIndex: 6, cartonId: "M56YSL611310133", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 7
  "351682194201588": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194201596", unitIndex: 7, cartonId: "M56YSL611310133", color: "Charcoal", mfgDate: "2026/01" },
  "351682194201596": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194201588", unitIndex: 7, cartonId: "M56YSL611310133", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 8
  "351682194121125": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194121133", unitIndex: 8, cartonId: "M56YSL611310133", color: "Charcoal", mfgDate: "2026/01" },
  "351682194121133": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194121125", unitIndex: 8, cartonId: "M56YSL611310133", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 9
  "351682194115564": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194115572", unitIndex: 9, cartonId: "M56YSL611310133", color: "Charcoal", mfgDate: "2026/01" },
  "351682194115572": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194115564", unitIndex: 9, cartonId: "M56YSL611310133", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 10
  "351682194201422": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194201430", unitIndex: 10, cartonId: "M56YSL611310133", color: "Charcoal", mfgDate: "2026/01" },
  "351682194201430": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194201422", unitIndex: 10, cartonId: "M56YSL611310133", color: "Charcoal", mfgDate: "2026/01" },

  // ════════════════════════════════════════════════════════════════════════════
  // BOX 10: Nokia 105 TA-1416 DS — Carton M56YSL611310116 — 2026/01 — Charcoal (10 Units)
  // ════════════════════════════════════════════════════════════════════════════
  // Unit 1
  "351682194131363": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194131371", unitIndex: 1, cartonId: "M56YSL611310116", color: "Charcoal", mfgDate: "2026/01" },
  "351682194131371": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194131363", unitIndex: 1, cartonId: "M56YSL611310116", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 2
  "351682194118220": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194118238", unitIndex: 2, cartonId: "M56YSL611310116", color: "Charcoal", mfgDate: "2026/01" },
  "351682194118238": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194118220", unitIndex: 2, cartonId: "M56YSL611310116", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 3
  "351682194204327": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194204335", unitIndex: 3, cartonId: "M56YSL611310116", color: "Charcoal", mfgDate: "2026/01" },
  "351682194204335": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194204327", unitIndex: 3, cartonId: "M56YSL611310116", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 4
  "351682194204384": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194204392", unitIndex: 4, cartonId: "M56YSL611310116", color: "Charcoal", mfgDate: "2026/01" },
  "351682194204392": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194204384", unitIndex: 4, cartonId: "M56YSL611310116", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 5
  "351682194132205": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194132213", unitIndex: 5, cartonId: "M56YSL611310116", color: "Charcoal", mfgDate: "2026/01" },
  "351682194132213": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194132205", unitIndex: 5, cartonId: "M56YSL611310116", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 6
  "351682194132320": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194132338", unitIndex: 6, cartonId: "M56YSL611310116", color: "Charcoal", mfgDate: "2026/01" },
  "351682194132338": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194132320", unitIndex: 6, cartonId: "M56YSL611310116", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 7
  "351682194118204": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194118212", unitIndex: 7, cartonId: "M56YSL611310116", color: "Charcoal", mfgDate: "2026/01" },
  "351682194118212": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194118204", unitIndex: 7, cartonId: "M56YSL611310116", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 8
  "351682194131348": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194131355", unitIndex: 8, cartonId: "M56YSL611310116", color: "Charcoal", mfgDate: "2026/01" },
  "351682194131355": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194131348", unitIndex: 8, cartonId: "M56YSL611310116", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 9
  "351682194131306": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194131314", unitIndex: 9, cartonId: "M56YSL611310116", color: "Charcoal", mfgDate: "2026/01" },
  "351682194131314": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194131306", unitIndex: 9, cartonId: "M56YSL611310116", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 10
  "351682194119384": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194119392", unitIndex: 10, cartonId: "M56YSL611310116", color: "Charcoal", mfgDate: "2026/01" },
  "351682194119392": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194119384", unitIndex: 10, cartonId: "M56YSL611310116", color: "Charcoal", mfgDate: "2026/01" },

  // ════════════════════════════════════════════════════════════════════════════
  // BOX 11: Nokia 105 TA-1416 DS — Carton M56YSL611310013 — 2026/01 — Charcoal (10 Units)
  // ════════════════════════════════════════════════════════════════════════════
  // Unit 1
  "351682194069704": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194069712", unitIndex: 1, cartonId: "M56YSL611310013", color: "Charcoal", mfgDate: "2026/01" },
  "351682194069712": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194069704", unitIndex: 1, cartonId: "M56YSL611310013", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 2
  "351682194115044": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194115051", unitIndex: 2, cartonId: "M56YSL611310013", color: "Charcoal", mfgDate: "2026/01" },
  "351682194115051": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194115044", unitIndex: 2, cartonId: "M56YSL611310013", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 3
  "351682194115069": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194115077", unitIndex: 3, cartonId: "M56YSL611310013", color: "Charcoal", mfgDate: "2026/01" },
  "351682194115077": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194115069", unitIndex: 3, cartonId: "M56YSL611310013", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 4
  "351682194191847": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194191854", unitIndex: 4, cartonId: "M56YSL611310013", color: "Charcoal", mfgDate: "2026/01" },
  "351682194191854": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194191847", unitIndex: 4, cartonId: "M56YSL611310013", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 5
  "351682194115184": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194115192", unitIndex: 5, cartonId: "M56YSL611310013", color: "Charcoal", mfgDate: "2026/01" },
  "351682194115192": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194115184", unitIndex: 5, cartonId: "M56YSL611310013", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 6
  "351682194115846": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194115853", unitIndex: 6, cartonId: "M56YSL611310013", color: "Charcoal", mfgDate: "2026/01" },
  "351682194115853": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194115846", unitIndex: 6, cartonId: "M56YSL611310013", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 7
  "351682194069720": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194069738", unitIndex: 7, cartonId: "M56YSL611310013", color: "Charcoal", mfgDate: "2026/01" },
  "351682194069738": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194069720", unitIndex: 7, cartonId: "M56YSL611310013", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 8
  "351682194069803": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194069811", unitIndex: 8, cartonId: "M56YSL611310013", color: "Charcoal", mfgDate: "2026/01" },
  "351682194069811": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194069803", unitIndex: 8, cartonId: "M56YSL611310013", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 9
  "351682194113387": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194113395", unitIndex: 9, cartonId: "M56YSL611310013", color: "Charcoal", mfgDate: "2026/01" },
  "351682194113395": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194113387", unitIndex: 9, cartonId: "M56YSL611310013", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 10
  "351682194199428": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194199436", unitIndex: 10, cartonId: "M56YSL611310013", color: "Charcoal", mfgDate: "2026/01" },
  "351682194199436": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194199428", unitIndex: 10, cartonId: "M56YSL611310013", color: "Charcoal", mfgDate: "2026/01" },

  // ════════════════════════════════════════════════════════════════════════════
  // BOX 12: Nokia 105 TA-1416 DS — Carton M56YSL611310058 — 2026/01 — Charcoal (10 Units)
  // ════════════════════════════════════════════════════════════════════════════
  // Unit 1
  "351682194128328": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194128336", unitIndex: 1, cartonId: "M56YSL611310058", color: "Charcoal", mfgDate: "2026/01" },
  "351682194128336": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194128328", unitIndex: 1, cartonId: "M56YSL611310058", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 2
  "351682194118725": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194118733", unitIndex: 2, cartonId: "M56YSL611310058", color: "Charcoal", mfgDate: "2026/01" },
  "351682194118733": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194118725", unitIndex: 2, cartonId: "M56YSL611310058", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 3
  "351682194112629": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194112637", unitIndex: 3, cartonId: "M56YSL611310058", color: "Charcoal", mfgDate: "2026/01" },
  "351682194112637": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194112629", unitIndex: 3, cartonId: "M56YSL611310058", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 4
  "351682194128427": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194128435", unitIndex: 4, cartonId: "M56YSL611310058", color: "Charcoal", mfgDate: "2026/01" },
  "351682194128435": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194128427", unitIndex: 4, cartonId: "M56YSL611310058", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 5
  "351682194118741": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194118758", unitIndex: 5, cartonId: "M56YSL611310058", color: "Charcoal", mfgDate: "2026/01" },
  "351682194118758": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194118741", unitIndex: 5, cartonId: "M56YSL611310058", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 6
  "351682194116547": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194116554", unitIndex: 6, cartonId: "M56YSL611310058", color: "Charcoal", mfgDate: "2026/01" },
  "351682194116554": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194116547", unitIndex: 6, cartonId: "M56YSL611310058", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 7
  "351682194114781": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194114799", unitIndex: 7, cartonId: "M56YSL611310058", color: "Charcoal", mfgDate: "2026/01" },
  "351682194114799": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194114781", unitIndex: 7, cartonId: "M56YSL611310058", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 8
  "351682194116588": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194116596", unitIndex: 8, cartonId: "M56YSL611310058", color: "Charcoal", mfgDate: "2026/01" },
  "351682194116596": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194116588", unitIndex: 8, cartonId: "M56YSL611310058", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 9
  "351682194116562": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194116570", unitIndex: 9, cartonId: "M56YSL611310058", color: "Charcoal", mfgDate: "2026/01" },
  "351682194116570": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194116562", unitIndex: 9, cartonId: "M56YSL611310058", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 10
  "351682194114807": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194114815", unitIndex: 10, cartonId: "M56YSL611310058", color: "Charcoal", mfgDate: "2026/01" },
  "351682194114815": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194114807", unitIndex: 10, cartonId: "M56YSL611310058", color: "Charcoal", mfgDate: "2026/01" },

  // ════════════════════════════════════════════════════════════════════════════
  // BOX 13: Nokia 105 TA-1416 DS — Carton M56YSL611310023 — 2026/01 — Charcoal (10 Units)
  // ════════════════════════════════════════════════════════════════════════════
  // Unit 1
  "351682194069563": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194069571", unitIndex: 1, cartonId: "M56YSL611310023", color: "Charcoal", mfgDate: "2026/01" },
  "351682194069571": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194069563", unitIndex: 1, cartonId: "M56YSL611310023", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 2
  "351682194110201": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194110219", unitIndex: 2, cartonId: "M56YSL611310023", color: "Charcoal", mfgDate: "2026/01" },
  "351682194110219": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194110201", unitIndex: 2, cartonId: "M56YSL611310023", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 3
  "351682194110904": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194110912", unitIndex: 3, cartonId: "M56YSL611310023", color: "Charcoal", mfgDate: "2026/01" },
  "351682194110912": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194110904", unitIndex: 3, cartonId: "M56YSL611310023", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 4
  "351682194113767": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194113775", unitIndex: 4, cartonId: "M56YSL611310023", color: "Charcoal", mfgDate: "2026/01" },
  "351682194113775": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194113767", unitIndex: 4, cartonId: "M56YSL611310023", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 5
  "351682194110805": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194110813", unitIndex: 5, cartonId: "M56YSL611310023", color: "Charcoal", mfgDate: "2026/01" },
  "351682194110813": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194110805", unitIndex: 5, cartonId: "M56YSL611310023", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 6
  "351682194129045": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194129052", unitIndex: 6, cartonId: "M56YSL611310023", color: "Charcoal", mfgDate: "2026/01" },
  "351682194129052": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194129045", unitIndex: 6, cartonId: "M56YSL611310023", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 7
  "351682194200382": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194200390", unitIndex: 7, cartonId: "M56YSL611310023", color: "Charcoal", mfgDate: "2026/01" },
  "351682194200390": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194200382", unitIndex: 7, cartonId: "M56YSL611310023", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 8
  "351682194129060": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194129078", unitIndex: 8, cartonId: "M56YSL611310023", color: "Charcoal", mfgDate: "2026/01" },
  "351682194129078": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194129060", unitIndex: 8, cartonId: "M56YSL611310023", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 9
  "351682194190245": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194190252", unitIndex: 9, cartonId: "M56YSL611310023", color: "Charcoal", mfgDate: "2026/01" },
  "351682194190252": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194190245", unitIndex: 9, cartonId: "M56YSL611310023", color: "Charcoal", mfgDate: "2026/01" },
  // Unit 10
  "351682194190104": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194190112", unitIndex: 10, cartonId: "M56YSL611310023", color: "Charcoal", mfgDate: "2026/01" },
  "351682194190112": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194190104", unitIndex: 10, cartonId: "M56YSL611310023", color: "Charcoal", mfgDate: "2026/01" },

  // ════════════════════════════════════════════════════════════════════════════
  // BOX 14: Nokia 105 TA-1416 DS — Carton M83YSL611510076 — 2026/01 — Blue (10 Units)
  // ════════════════════════════════════════════════════════════════════════════
  // Unit 1
  "351682194422929": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194422937", unitIndex: 1, cartonId: "M83YSL611510076", color: "Blue", mfgDate: "2026/01" },
  "351682194422937": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194422929", unitIndex: 1, cartonId: "M83YSL611510076", color: "Blue", mfgDate: "2026/01" },
  // Unit 2
  "351682194422960": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194422978", unitIndex: 2, cartonId: "M83YSL611510076", color: "Blue", mfgDate: "2026/01" },
  "351682194422978": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194422960", unitIndex: 2, cartonId: "M83YSL611510076", color: "Blue", mfgDate: "2026/01" },
  // Unit 3
  "351682194427704": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194427712", unitIndex: 3, cartonId: "M83YSL611510076", color: "Blue", mfgDate: "2026/01" },
  "351682194427712": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194427704", unitIndex: 3, cartonId: "M83YSL611510076", color: "Blue", mfgDate: "2026/01" },
  // Unit 4
  "351682194430807": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194430815", unitIndex: 4, cartonId: "M83YSL611510076", color: "Blue", mfgDate: "2026/01" },
  "351682194430815": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194430807", unitIndex: 4, cartonId: "M83YSL611510076", color: "Blue", mfgDate: "2026/01" },
  // Unit 5
  "351682194422986": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194422994", unitIndex: 5, cartonId: "M83YSL611510076", color: "Blue", mfgDate: "2026/01" },
  "351682194422994": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194422986", unitIndex: 5, cartonId: "M83YSL611510076", color: "Blue", mfgDate: "2026/01" },
  // Unit 6
  "351682194423000": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194423018", unitIndex: 6, cartonId: "M83YSL611510076", color: "Blue", mfgDate: "2026/01" },
  "351682194423018": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194423000", unitIndex: 6, cartonId: "M83YSL611510076", color: "Blue", mfgDate: "2026/01" },
  // Unit 7
  "351682194400487": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194400495", unitIndex: 7, cartonId: "M83YSL611510076", color: "Blue", mfgDate: "2026/01" },
  "351682194400495": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194400487", unitIndex: 7, cartonId: "M83YSL611510076", color: "Blue", mfgDate: "2026/01" },
  // Unit 8
  "351682194430823": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194430831", unitIndex: 8, cartonId: "M83YSL611510076", color: "Blue", mfgDate: "2026/01" },
  "351682194430831": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194430823", unitIndex: 8, cartonId: "M83YSL611510076", color: "Blue", mfgDate: "2026/01" },
  // Unit 9
  "351682194404760": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194404778", unitIndex: 9, cartonId: "M83YSL611510076", color: "Blue", mfgDate: "2026/01" },
  "351682194404778": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194404760", unitIndex: 9, cartonId: "M83YSL611510076", color: "Blue", mfgDate: "2026/01" },
  // Unit 10
  "351682194432027": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 1, pairedImei: "351682194432035", unitIndex: 10, cartonId: "M83YSL611510076", color: "Blue", mfgDate: "2026/01" },
  "351682194432035": { productSlug: "nokia-105", brand: "Nokia", model: "Nokia 105 DS", sim: 2, pairedImei: "351682194432027", unitIndex: 10, cartonId: "M83YSL611510076", color: "Blue", mfgDate: "2026/01" },
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
      status: "invalid",
      imei,
      tac: null,
      product: null,
      source: null,
      message: "The IMEI must be exactly 15 digits. Please check and try again.",
    };
  }

  if (!validateLuhn(imei)) {
    return {
      status: "invalid",
      imei,
      tac: null,
      product: null,
      source: null,
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
      product: {
        ...tacEntry,
        sim: null,
        pairedImei: null,
        unitIndex: null,
        cartonId: null,
        color: null,
        mfgDate: null,
      },
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
