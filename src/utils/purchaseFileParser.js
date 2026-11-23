/**
 * Zero-Dependency Universal Purchase File & Invoice Parser
 * Supports:
 *  - Modern Excel workbooks (.xlsx) via native browser DecompressionStream + DOMParser
 *  - CSV / TSV / Semicolon delimited sheets (.csv, .tsv, .txt)
 *  - Digital Supplier PDF Invoices (.pdf) via native FlateDecode stream text extraction
 *  - Direct Copy-Paste from Excel, Google Sheets, PDFs, or WhatsApp tables
 */

const KNOWN_BRANDS = [
  "Apple",
  "Samsung",
  "HMD",
  "Nokia",
  "Xiaomi",
  "Redmi",
  "Poco",
  "Huawei",
  "Honor",
  "Oppo",
  "Vivo",
  "Realme",
  "OnePlus",
  "Google",
  "Motorola",
  "Tecno",
  "Infinix",
  "Itel",
  "Sony",
  "JBL",
  "Anker",
  "Baseus",
  "Lenovo",
  "HP",
  "Dell",
  "Asus",
  "Acer",
  "Microsoft",
  "Nintendo",
  "PlayStation",
  "DJI",
  "Garmin",
  "Marshall",
  "Bose",
  "Beats",
];

const HEADER_ALIASES = {
  sku: [
    "sku",
    "item code",
    "product code",
    "part no",
    "part number",
    "part#",
    "model code",
    "article",
    "barcode",
    "ean",
    "upc",
    "code",
  ],
  name: [
    "product name",
    "item name",
    "item description",
    "product",
    "description",
    "item",
    "model",
    "particulars",
    "goods",
    "name",
    "title",
    "device",
  ],
  brand: ["brand", "make", "manufacturer", "oem", "vendor brand"],
  category: ["category", "department", "dept", "type", "group"],
  quantity: [
    "inward qty",
    "quantity",
    "qty",
    "pcs",
    "pieces",
    "units",
    "count",
    "ordered",
    "delivered",
    "shipped",
  ],
  // IMPORTANT: sellingPrice MUST be checked BEFORE unitCost so "Selling Price (AED)"
  // is never swallowed by unitCost's generic "price" alias!
  sellingPrice: [
    "selling price",
    "sell price",
    "sale price",
    "retail price",
    "retail",
    "mrp",
    "rrp",
    "list price",
  ],
  totalCost: [
    "total cost",
    "line total",
    "total amount",
    "total price",
    "ext price",
    "extended price",
    "subtotal",
    "amount",
    "value",
    "total",
  ],
  unitCost: [
    "unit cost",
    "unit price",
    "cost price",
    "buy price",
    "purchase price",
    "unit rate",
    "net price",
    "cost",
    "rate",
    "fob",
    "price",
  ],
};

const SUMMARY_ROW_REGEX =
  /^(sub\s*total|subtotal|grand\s*total|total\s*amount|total\s*payable|total\s*value|net\s*total|vat|tax|discount|shipping|freight|delivery|balance|amount\s*due|total\b)/i;

export const generateCleanSku = (name = "", brand = "", fallbackIndex = 1) => {
  const raw = `${brand && !name.toLowerCase().startsWith(brand.toLowerCase()) ? `${brand} ` : ""}${name}`
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 26);
  return raw || `NEW-SKU-${Date.now().toString().slice(-4)}-${fallbackIndex}`;
};

export const inferBrandFromName = (name = "") => {
  const lower = String(name || "").toLowerCase();
  if (/\b(iphone|ipad|airpods|macbook|apple\s*watch|imac)\b/.test(lower)) {
    return "Apple";
  }
  if (/\b(galaxy|z\s*fold|z\s*flip)\b/.test(lower)) {
    return "Samsung";
  }
  for (const brand of KNOWN_BRANDS) {
    if (lower.includes(brand.toLowerCase())) return brand;
  }
  return "General";
};

export const inferCategoryFromName = (name = "") => {
  const lower = String(name || "").toLowerCase();
  if (/\b(earbud|buds|airpods|headphone|speaker|audio|tws|soundbar)\b/.test(lower)) {
    return "Audio & Accessories";
  }
  if (/\b(watch|band|fitbit|wearable)\b/.test(lower)) {
    return "Wearables";
  }
  if (/\b(ipad|tab\s|tablet|matepad)\b/.test(lower)) {
    return "Tablets";
  }
  if (/\b(macbook|laptop|notebook|thinkpad|inspiron|pavilion)\b/.test(lower)) {
    return "Laptops & Computing";
  }
  if (/\b(charger|cable|case|cover|adapter|power\s*bank|protector|dock)\b/.test(lower)) {
    return "Accessories";
  }
  return "Mobile Devices";
};

const parseNumericValue = (raw) => {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const cleaned = String(raw ?? "")
    .replace(/(AED|KES|KSh|USD|EUR|GBP|XOF|CFA|UGX|USh|GHS|SAR|CNY|RMB)/gi, "")
    .replace(/[^0-9.,-]/g, "")
    .trim();
  if (!cleaned) return NaN;

  // Handle European decimals like "1.250,50" vs US "1,250.50"
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  const normalized =
    lastComma > lastDot && cleaned.length - lastComma - 1 <= 2
      ? cleaned.replace(/\./g, "").replace(",", ".")
      : cleaned.replace(/,/g, "");
  const num = Number(normalized);
  return Number.isFinite(num) ? num : NaN;
};

/* ========================================================================= */
/* 1. DELIMITED TEXT PARSER (CSV / TSV / SEMICOLON)                          */
/* ========================================================================= */
const detectDelimiter = (text) => {
  const sampleLines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 6);
  const candidates = ["\t", ",", ";"];
  let best = ",";
  let bestScore = -1;

  for (const delim of candidates) {
    const counts = sampleLines.map((l) => l.split(delim).length - 1);
    const total = counts.reduce((a, b) => a + b, 0);
    if (total > bestScore) {
      bestScore = total;
      best = delim;
    }
  }
  return best;
};

export const parseDelimitedText = (rawText) => {
  const text = String(rawText || "").replace(/^\uFEFF/, "");
  const delimiter = detectDelimiter(text);
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(cell.trim());
      cell = "";
    } else if (ch === "\r" && next === "\n") {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
      i++;
    } else if (ch === "\n" || ch === "\r") {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    rows.push(row);
  }

  return rows.filter((r) => r.some((c) => String(c || "").trim() !== ""));
};

/* ========================================================================= */
/* 2. PURE-JS MODERN EXCEL (.XLSX) PARSER (OOXML ZIP + DECOMPRESSIONSTREAM)  */
/* ========================================================================= */
const decompressBytes = async (bytes, format) => {
  if (typeof DecompressionStream === "undefined") {
    throw new Error(
      "Your browser does not support native Excel decompression. Please save the sheet as CSV or copy-paste the rows."
    );
  }
  const ds = new DecompressionStream(format);
  const writer = ds.writable.getWriter();
  writer.write(bytes);
  writer.close();
  const res = await new Response(ds.readable).arrayBuffer();
  return new Uint8Array(res);
};

const readZipEntries = async (arrayBuffer) => {
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);

  // Locate End of Central Directory (EOCD) signature 0x06054b50
  let eocdOffset = -1;
  const minOffset = Math.max(0, bytes.length - 65557);
  for (let i = bytes.length - 22; i >= minOffset; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) {
    throw new Error(
      "Invalid .xlsx file format. If this is an older .xls workbook, please re-save it as .xlsx or .csv in Excel."
    );
  }

  const centralDirOffset = view.getUint32(eocdOffset + 16, true);
  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const decoder = new TextDecoder("utf-8");
  const files = new Map();

  let offset = centralDirOffset;
  for (let idx = 0; idx < totalEntries; idx++) {
    if (offset + 46 > bytes.length) break;
    if (view.getUint32(offset, true) !== 0x02014b50) break;

    const compressionMethod = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const nameLen = view.getUint16(offset + 28, true);
    const extraLen = view.getUint16(offset + 30, true);
    const commentLen = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);

    const fileName = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLen));
    offset += 46 + nameLen + extraLen + commentLen;

    // Only decompress XML files we need for Excel sheets
    if (
      !fileName.endsWith(".xml") &&
      !fileName.endsWith(".rels")
    ) {
      continue;
    }

    const localNameLen = view.getUint16(localHeaderOffset + 26, true);
    const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
    const rawSlice = bytes.subarray(dataStart, dataStart + compressedSize);

    let unpacked;
    if (compressionMethod === 0) {
      unpacked = rawSlice;
    } else if (compressionMethod === 8) {
      unpacked = await decompressBytes(rawSlice, "deflate-raw");
    } else {
      continue;
    }

    files.set(fileName.toLowerCase(), decoder.decode(unpacked));
  }

  return files;
};

const colRefToIndex = (cellRef = "") => {
  const letters = (cellRef.match(/^[A-Z]+/i)?.[0] || "").toUpperCase();
  if (!letters) return -1;
  let col = 0;
  for (let i = 0; i < letters.length; i++) {
    col = col * 26 + (letters.charCodeAt(i) - 64);
  }
  return col - 1;
};

export const parseXlsxBuffer = async (arrayBuffer) => {
  const files = await readZipEntries(arrayBuffer);
  const parser = new DOMParser();

  // 1. Parse sharedStrings.xml if present
  const sharedStrings = [];
  const sharedXml = files.get("xl/sharedstrings.xml");
  if (sharedXml) {
    const doc = parser.parseFromString(sharedXml, "application/xml");
    const siNodes = doc.getElementsByTagName("si");
    for (let i = 0; i < siNodes.length; i++) {
      const tNodes = siNodes[i].getElementsByTagName("t");
      let combined = "";
      for (let j = 0; j < tNodes.length; j++) {
        combined += tNodes[j].textContent || "";
      }
      sharedStrings.push(combined);
    }
  }

  // 2. Locate first worksheet XML
  let sheetXml = files.get("xl/worksheets/sheet1.xml");
  if (!sheetXml) {
    for (const [key, val] of files.entries()) {
      if (key.startsWith("xl/worksheets/sheet") && key.endsWith(".xml")) {
        sheetXml = val;
        break;
      }
    }
  }
  if (!sheetXml) {
    throw new Error("No worksheet data found inside this Excel file.");
  }

  // 3. Extract sparse row/cell grid
  const sheetDoc = parser.parseFromString(sheetXml, "application/xml");
  const rowNodes = sheetDoc.getElementsByTagName("row");
  const grid = [];

  for (let r = 0; r < rowNodes.length; r++) {
    const cells = rowNodes[r].getElementsByTagName("c");
    const rowArr = [];

    for (let c = 0; c < cells.length; c++) {
      const cellEl = cells[c];
      const ref = cellEl.getAttribute("r") || "";
      const colIdx = colRefToIndex(ref);
      const targetIdx = colIdx >= 0 ? colIdx : rowArr.length;
      const type = cellEl.getAttribute("t") || "";

      let val;
      if (type === "s") {
        const vNode = cellEl.getElementsByTagName("v")[0];
        const sIdx = parseInt(vNode?.textContent || "", 10);
        val = Number.isFinite(sIdx) ? sharedStrings[sIdx] ?? "" : "";
      } else if (type === "inlineStr") {
        const tNodes = cellEl.getElementsByTagName("t");
        let combined = "";
        for (let t = 0; t < tNodes.length; t++) {
          combined += tNodes[t].textContent || "";
        }
        val = combined;
      } else {
        const vNode = cellEl.getElementsByTagName("v")[0];
        val = vNode?.textContent ?? "";
      }

      while (rowArr.length <= targetIdx) rowArr.push("");
      rowArr[targetIdx] = String(val).trim();
    }

    if (rowArr.some((cellVal) => cellVal !== "")) {
      grid.push(rowArr);
    }
  }

  return grid;
};

/* ========================================================================= */
/* 3. DIGITAL PDF INVOICE TEXT EXTRACTOR (FLATE STREAM + TEXT OPERATORS)     */
/* ========================================================================= */
const decodePdfLiteral = (str) => {
  return str
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, " ")
    .replace(/\\t/g, " ")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\")
    .replace(/\\([0-7]{1,3})/g, (_, oct) =>
      String.fromCharCode(parseInt(oct, 8))
    );
};

const decodePdfHex = (hex) => {
  const clean = hex.replace(/\s+/g, "");
  if (clean.length < 2) return "";
  // UTF-16BE BOM check
  if (clean.toUpperCase().startsWith("FEFF")) {
    let out = "";
    for (let i = 4; i + 3 < clean.length; i += 4) {
      out += String.fromCharCode(parseInt(clean.slice(i, i + 4), 16));
    }
    return out;
  }
  let out = "";
  for (let i = 0; i + 1 < clean.length; i += 2) {
    const code = parseInt(clean.slice(i, i + 2), 16);
    if (code >= 32 && code <= 126) out += String.fromCharCode(code);
  }
  return out;
};

const extractTextFromPdfContent = (contentStr) => {
  const lines = [];
  let currentLine = "";

  // Match TJ arrays, Tj literals, Tj hex strings, and line break operators (Td, TD, T*, ')
  const tokenRegex =
    /\[((?:[^[\]]|\([^)]*\))*)\]\s*TJ|\(((?:\\.|[^\\()])*)\)\s*(?:Tj|')|<([0-9A-Fa-f\s]+)>\s*Tj|\b(?:T\*|ET)\b|(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(?:Td|TD)\b/g;

  let match;
  while ((match = tokenRegex.exec(contentStr)) !== null) {
    if (match[1] !== undefined) {
      // TJ array
      const inner = match[1];
      const partRegex = /\(((?:\\.|[^\\()])*)\)|<([0-9A-Fa-f\s]+)>|(-?\d+(?:\.\d+)?)/g;
      let pm;
      while ((pm = partRegex.exec(inner)) !== null) {
        if (pm[1] !== undefined) {
          currentLine += decodePdfLiteral(pm[1]);
        } else if (pm[2] !== undefined) {
          currentLine += decodePdfHex(pm[2]);
        } else if (pm[3] !== undefined && Number(pm[3]) < -180) {
          currentLine += " ";
        }
      }
    } else if (match[2] !== undefined) {
      currentLine += decodePdfLiteral(match[2]);
    } else if (match[3] !== undefined) {
      currentLine += decodePdfHex(match[3]);
    } else if (match[5] !== undefined) {
      // Td / TD vertical shift -> new line if ty !== 0, else column gap
      const ty = Number(match[5]);
      if (Math.abs(ty) > 1) {
        if (currentLine.trim()) lines.push(currentLine.trim());
        currentLine = "";
      } else if (currentLine && !currentLine.endsWith(" ")) {
        currentLine += "  ";
      }
    } else {
      if (currentLine.trim()) lines.push(currentLine.trim());
      currentLine = "";
    }
  }
  if (currentLine.trim()) lines.push(currentLine.trim());
  return lines;
};

export const extractLinesFromPdfBuffer = async (arrayBuffer) => {
  const bytes = new Uint8Array(arrayBuffer);
  // Decode raw bytes as latin1 so offsets match 1:1 with byte indices
  let raw = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    raw += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  const allLines = [];
  const decoder = new TextDecoder("latin1");
  let pos = 0;

  while (pos < raw.length) {
    const streamIdx = raw.indexOf("stream", pos);
    if (streamIdx === -1) break;
    const endIdx = raw.indexOf("endstream", streamIdx + 6);
    if (endIdx === -1) break;

    let dataStart = streamIdx + 6;
    if (raw[dataStart] === "\r" && raw[dataStart + 1] === "\n") dataStart += 2;
    else if (raw[dataStart] === "\n" || raw[dataStart] === "\r") dataStart += 1;

    let dataEnd = endIdx;
    while (dataEnd > dataStart && (raw[dataEnd - 1] === "\n" || raw[dataEnd - 1] === "\r")) {
      dataEnd--;
    }

    const headerSnippet = raw.slice(Math.max(0, streamIdx - 280), streamIdx);
    const isFlate = /FlateDecode/i.test(headerSnippet);
    const isImage = /\/Subtype\s*\/Image/i.test(headerSnippet);

    if (!isImage && dataEnd > dataStart) {
      const slice = bytes.subarray(dataStart, dataEnd);
      let decoded;

      if (isFlate) {
        try {
          const inflated = await decompressBytes(slice, "deflate");
          decoded = decoder.decode(inflated);
        } catch {
          try {
            const inflatedRaw = await decompressBytes(slice, "deflate-raw");
            decoded = decoder.decode(inflatedRaw);
          } catch {
            decoded = "";
          }
        }
      } else {
        decoded = decoder.decode(slice);
      }

      if (decoded && (decoded.includes("Tj") || decoded.includes("TJ"))) {
        const extracted = extractTextFromPdfContent(decoded);
        allLines.push(...extracted);
      }
    }

    pos = endIdx + 9;
  }

  return allLines;
};

/* ========================================================================= */
/* 4. STRICT CATALOG MATCHING + SMART IMAGE MATCHING & METADATA              */
/* ========================================================================= */
const normalizeKey = (s = "") =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const tokenize = (s = "") =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2);

const SPEC_NOISE_TOKENS = new Set([
  "ds",
  "ss",
  "sl",
  "wea",
  "wea1",
  "ssa",
  "gcc",
  "mea",
  "eu",
  "global",
  "int",
  "dual",
  "sim",
  "4g",
  "5g",
  "lte",
  "mobile",
  "devices",
  "phone",
]);

const COLOR_TOKENS = new Set([
  "black",
  "charcoal",
  "grey",
  "gray",
  "darkgrey",
  "darkgray",
  "blue",
  "cyan",
  "red",
  "green",
  "silver",
  "white",
  "gold",
  "pink",
  "purple",
  "orange",
  "yellow",
  "titanium",
  "burgundy",
  "glacier",
]);

/**
 * STRICT exact identity matcher:
 * - If an explicit SKU is supplied in the sheet, ONLY match an exact SKU in catalog.
 *   Never collapse regional/spec/color variants (e.g. NOKIA-106-WEA vs NOKIA-106-SSA)
 *   into a generic catalog SKU.
 * - If SKU is blank, ONLY match an exact normalized Product Name.
 */
export const matchItemToCatalog = (skuInput = "", nameInput = "", stock = []) => {
  const normSku = normalizeKey(skuInput);
  const normName = normalizeKey(nameInput);

  if (normSku) {
    return stock.find((s) => normalizeKey(s.sku) === normSku) || null;
  }

  if (normName) {
    return stock.find((s) => normalizeKey(s.name) === normName) || null;
  }

  return null;
};

/**
 * Smart similarity image matcher:
 * Finds the closest product image from existing catalog listings based on
 * brand, model number/tokens, and color hints — WITHOUT ever altering the
 * uploaded SKU, Product Name, Brand, or Specs.
 */
export const findBestImageMatch = (
  skuInput = "",
  nameInput = "",
  brandInput = "",
  stock = []
) => {
  const queryTokens = tokenize(`${brandInput} ${nameInput} ${skuInput}`).filter(
    (t) => !SPEC_NOISE_TOKENS.has(t) && !/^ta\d{3,4}$/i.test(t)
  );
  if (queryTokens.length === 0) return "/logo.png";

  const querySet = new Set(queryTokens);
  const queryNumbers = queryTokens.filter((t) => /^\d{2,4}[a-z]?$/.test(t));
  const queryColors = queryTokens.filter((t) => COLOR_TOKENS.has(t));
  const normBrand = String(brandInput || "").trim().toLowerCase();

  let bestImage = "/logo.png";
  let bestScore = 0;

  for (const prod of stock) {
    const img = prod.image;
    if (!img || img === "/logo.png") continue;

    const prodTokens = tokenize(`${prod.brand} ${prod.name} ${prod.sku}`);
    const prodSet = new Set(prodTokens);
    if (prodSet.size === 0) continue;

    let score = 0;

    // Brand match boost
    const prodBrand = String(prod.brand || "").trim().toLowerCase();
    if (normBrand && prodBrand && normBrand === prodBrand) {
      score += 2.5;
    }

    // Core model number match (e.g. "100", "102", "105", "106", "110", "125", "130", "150")
    let modelNumberHits = 0;
    for (const numTok of queryNumbers) {
      if (prodSet.has(numTok)) {
        score += 4;
        modelNumberHits++;
      }
    }

    // General meaningful token overlap (e.g. "music", "power", "pro", "max", "classic")
    let tokenHits = 0;
    for (const qt of querySet) {
      if (prodSet.has(qt)) {
        tokenHits++;
        if (!COLOR_TOKENS.has(qt) && !/^\d+$/.test(qt)) {
          score += 1.8;
        }
      }
    }

    // Color preference boost (e.g. Charcoal / Blue / Grey / Black)
    for (const col of queryColors) {
      if (
        prodSet.has(col) ||
        ((col === "darkgrey" || col === "darkgray") &&
          (prodSet.has("grey") || prodSet.has("gray") || prodSet.has("charcoal"))) ||
        (col === "grey" && prodSet.has("gray"))
      ) {
        score += 1.5;
      }
    }

    // Penalize conflicting model numbers (e.g. don't match Nokia 105 image to Nokia 125)
    const prodNumbers = prodTokens.filter((t) => /^\d{2,4}[a-z]?$/.test(t));
    if (
      queryNumbers.length > 0 &&
      prodNumbers.length > 0 &&
      modelNumberHits === 0
    ) {
      continue;
    }

    // Require meaningful overlap (at least brand + model number, or >= 2 matching tokens)
    const isValidMatch =
      (modelNumberHits >= 1 && tokenHits >= 2) || tokenHits >= 3;

    if (isValidMatch && score > bestScore) {
      bestScore = score;
      bestImage = img;
    }
  }

  return bestImage;
};

const extractMetadataFromText = (text = "") => {
  const meta = {
    supplierName: "",
    supplierInvoiceRef: "",
    purchaseDate: "",
  };

  const invMatch = text.match(
    /(?:invoice\s*(?:no|num|number|#)|inv\s*#|bill\s*(?:no|ref|#)|ref\s*(?:no|#)?)\s*[:#-]?\s*([A-Z0-9][A-Z0-9/-]{3,24})/i
  );
  if (invMatch?.[1]) meta.supplierInvoiceRef = invMatch[1].trim();

  const supplierMatch = text.match(
    /(?:supplier|vendor|from|billed\s*by|seller)\s*[:-]\s*([^\n,|]{3,60})/i
  );
  if (supplierMatch?.[1]) meta.supplierName = supplierMatch[1].trim();

  const isoDate = text.match(/\b(20\d{2}[-/](?:0?[1-9]|1[0-2])[-/](?:0?[1-9]|[12]\d|3[01]))\b/);
  if (isoDate?.[1]) {
    const parts = isoDate[1].split(/[-/]/);
    meta.purchaseDate = `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
  } else {
    const dmyDate = text.match(/\b((?:0?[1-9]|[12]\d|3[01])[-/](?:0?[1-9]|1[0-2])[-/](20\d{2}))\b/);
    if (dmyDate?.[1]) {
      const parts = dmyDate[1].split(/[-/]/);
      meta.purchaseDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
  }

  return meta;
};

/* ========================================================================= */
/* 5. SMART GRID -> PURCHASE LINE ITEMS MAPPER                               */
/* ========================================================================= */
const matchColumnRole = (headerText = "") => {
  const norm = String(headerText || "")
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9\s#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!norm) return null;

  for (const [role, aliases] of Object.entries(HEADER_ALIASES)) {
    for (const alias of aliases) {
      if (norm === alias || norm.includes(alias)) {
        return role;
      }
    }
  }
  return null;
};

export const extractPurchaseFromGrid = (grid = [], stock = []) => {
  if (!Array.isArray(grid) || grid.length === 0) {
    return { items: [], metadata: {} };
  }

  // Extract metadata from top rows before the table header
  const topSnippet = grid
    .slice(0, 8)
    .map((r) => r.join(" "))
    .join("\n");
  const metadata = extractMetadataFromText(topSnippet);

  // Locate header row (first row with >= 2 recognized column aliases)
  let headerRowIdx = -1;
  let colMap = {};

  for (let r = 0; r < Math.min(grid.length, 15); r++) {
    const row = grid[r];
    const candidateMap = {};
    let hits = 0;

    row.forEach((cell, colIdx) => {
      const role = matchColumnRole(cell);
      if (role && candidateMap[role] === undefined) {
        candidateMap[role] = colIdx;
        hits++;
      }
    });

    if (hits >= 2 && (candidateMap.name !== undefined || candidateMap.sku !== undefined)) {
      headerRowIdx = r;
      colMap = candidateMap;
      break;
    }
  }

  const startRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;
  const parsedItems = [];

  for (let r = startRow; r < grid.length; r++) {
    const row = grid[r];
    if (!row || row.every((c) => !String(c || "").trim())) continue;

    const joined = row.join(" ").trim();
    if (SUMMARY_ROW_REGEX.test(joined)) continue;

    let rawSku = "";
    let rawName;
    let rawBrand = "";
    let rawCategory = "";
    let qty = NaN;
    let unitCost = NaN;
    let totalCost = NaN;
    let sellingPrice = NaN;

    if (headerRowIdx >= 0) {
      rawSku = colMap.sku !== undefined ? String(row[colMap.sku] || "").trim() : "";
      rawName = colMap.name !== undefined ? String(row[colMap.name] || "").trim() : "";
      rawBrand = colMap.brand !== undefined ? String(row[colMap.brand] || "").trim() : "";
      rawCategory = colMap.category !== undefined ? String(row[colMap.category] || "").trim() : "";
      qty = colMap.quantity !== undefined ? parseNumericValue(row[colMap.quantity]) : NaN;
      unitCost = colMap.unitCost !== undefined ? parseNumericValue(row[colMap.unitCost]) : NaN;
      totalCost = colMap.totalCost !== undefined ? parseNumericValue(row[colMap.totalCost]) : NaN;
      sellingPrice =
        colMap.sellingPrice !== undefined ? parseNumericValue(row[colMap.sellingPrice]) : NaN;
    } else {
      // Headerless table heuristic: [SKU/Name, Qty, UnitCost, (Optional Total)]
      const nonEmpty = row.map((c) => String(c || "").trim()).filter(Boolean);
      if (nonEmpty.length < 2) continue;

      // Find numeric cells from right to left
      const numericIndices = [];
      nonEmpty.forEach((cell, idx) => {
        const val = parseNumericValue(cell);
        if (!Number.isNaN(val) && /^[\s$€£A-Za-z]*[\d.,-]+$/.test(cell)) {
          numericIndices.push({ idx, val });
        }
      });

      const textCells = nonEmpty.filter(
        (_, idx) => !numericIndices.some((n) => n.idx === idx)
      );
      if (textCells.length === 0) continue;

      if (textCells.length >= 2 && /^[A-Z0-9_-]{3,24}$/i.test(textCells[0])) {
        rawSku = textCells[0];
        rawName = textCells.slice(1).join(" ");
      } else {
        rawName = textCells.join(" ");
      }

      if (numericIndices.length >= 3) {
        qty = numericIndices[0].val;
        unitCost = numericIndices[1].val;
        totalCost = numericIndices[2].val;
      } else if (numericIndices.length === 2) {
        qty = numericIndices[0].val;
        unitCost = numericIndices[1].val;
      } else if (numericIndices.length === 1) {
        qty = numericIndices[0].val;
        unitCost = 0;
      }
    }

    if (!rawName && !rawSku) continue;
    if (SUMMARY_ROW_REGEX.test(rawName) || SUMMARY_ROW_REGEX.test(rawSku)) continue;

    // Resolve missing unitCost or qty gracefully
    const safeQty = Number.isFinite(qty) && qty > 0 ? Math.round(qty) : 1;
    let safeUnitCost = Number.isFinite(unitCost) && unitCost >= 0 ? unitCost : NaN;
    if (Number.isNaN(safeUnitCost) && Number.isFinite(totalCost) && safeQty > 0) {
      safeUnitCost = totalCost / safeQty;
    }
    if (Number.isNaN(safeUnitCost)) safeUnitCost = 0;

    // STRICT exact catalog match for SKU/Name; smart similarity ONLY for image inheritance!
    const catalogMatch = matchItemToCatalog(rawSku, rawName, stock);
    const finalName = rawName || catalogMatch?.name || rawSku;
    const finalBrand =
      rawBrand || catalogMatch?.brand || inferBrandFromName(finalName);
    const finalCategory =
      rawCategory || catalogMatch?.category || inferCategoryFromName(finalName);
    const finalSku = catalogMatch
      ? catalogMatch.sku
      : (rawSku || generateCleanSku(finalName, finalBrand, parsedItems.length + 1)).toUpperCase();

    const resolvedImage =
      catalogMatch?.image ||
      findBestImageMatch(finalSku, finalName, finalBrand, stock);

    const unitCostFinal =
      safeUnitCost > 0
        ? Number(safeUnitCost.toFixed(2))
        : Number(catalogMatch?.costPrice || 0);

    const sellingPriceFinal =
      Number.isFinite(sellingPrice) && sellingPrice > 0
        ? Number(sellingPrice.toFixed(2))
        : Number(catalogMatch?.price || 0);

    parsedItems.push({
      rowId: `imp_${r}_${finalSku}_${parsedItems.length}`,
      selected: true,
      isUnlisted: !catalogMatch,
      sku: finalSku,
      name: finalName,
      brand: finalBrand,
      category: finalCategory,
      image: resolvedImage,
      imageMatched: !catalogMatch && resolvedImage !== "/logo.png",
      quantity: safeQty,
      unitCost: unitCostFinal,
      sellingPrice: sellingPriceFinal,
      totalCost: Number((safeQty * unitCostFinal).toFixed(2)),
    });
  }

  return { items: parsedItems, metadata };
};

/* ========================================================================= */
/* 6. UNSTRUCTURED TEXT / PDF LINES -> PURCHASE LINE ITEMS                   */
/* ========================================================================= */
export const extractPurchaseFromLines = (lines = [], stock = []) => {
  const fullText = lines.join("\n");
  const metadata = extractMetadataFromText(fullText);

  // First try splitting lines into columns if tabs/multiple spaces exist
  const tabularRows = [];
  for (const rawLine of lines) {
    const line = String(rawLine || "").trim();
    if (!line || line.length < 4) continue;
    if (SUMMARY_ROW_REGEX.test(line)) continue;

    // Pattern A: Multi-space or tab separated columns
    const cols = line.split(/\t+|\s{2,}/).map((c) => c.trim()).filter(Boolean);
    if (cols.length >= 3) {
      tabularRows.push(cols);
      continue;
    }

    // Pattern B: Inline invoice row e.g. "Nokia 105  50  38.50  1925.00" or "HMD-100 HMD 100 100 30.00"
    const lineMatch = line.match(
      /^(.+?)\s+(\d{1,6})\s+(?:(?:AED|KES|KSh|USD|XOF|CFA|SAR)\s*)?([\d,]+(?:\.\d{1,2})?)(?:\s+(?:(?:AED|KES|KSh|USD|XOF|CFA|SAR)\s*)?([\d,]+(?:\.\d{1,2})?))?$/i
    );
    if (lineMatch) {
      const desc = lineMatch[1].replace(/^\d+[.)]\s*/, "").trim();
      if (desc && !SUMMARY_ROW_REGEX.test(desc)) {
        tabularRows.push([desc, lineMatch[2], lineMatch[3], lineMatch[4] || ""].filter(Boolean));
      }
    }
  }

  const fromGrid = extractPurchaseFromGrid(tabularRows, stock);
  return {
    items: fromGrid.items,
    metadata: {
      supplierName: metadata.supplierName || fromGrid.metadata?.supplierName || "",
      supplierInvoiceRef:
        metadata.supplierInvoiceRef || fromGrid.metadata?.supplierInvoiceRef || "",
      purchaseDate: metadata.purchaseDate || fromGrid.metadata?.purchaseDate || "",
    },
  };
};

/* ========================================================================= */
/* 7. UNIFIED PUBLIC ENTRY POINTS                                            */
/* ========================================================================= */
export const parsePurchaseFile = async (file, stock = []) => {
  if (!file) throw new Error("No file selected.");
  const ext = (file.name.split(".").pop() || "").toLowerCase();

  if (ext === "xlsx") {
    const buffer = await file.arrayBuffer();
    const grid = await parseXlsxBuffer(buffer);
    const result = extractPurchaseFromGrid(grid, stock);
    return { ...result, fileType: "Excel (.xlsx)", fileName: file.name };
  }

  if (ext === "csv" || ext === "tsv" || ext === "txt") {
    const text = await file.text();
    const grid = parseDelimitedText(text);
    const result = extractPurchaseFromGrid(grid, stock);
    return { ...result, fileType: ext.toUpperCase(), fileName: file.name };
  }

  if (ext === "pdf") {
    const buffer = await file.arrayBuffer();
    const lines = await extractLinesFromPdfBuffer(buffer);
    const result = extractPurchaseFromLines(lines, stock);
    return {
      ...result,
      fileType: "PDF Invoice",
      fileName: file.name,
      warning:
        result.items.length === 0
          ? "No tabular text items were detected (this PDF may be a scanned image). You can copy-paste invoice rows below or add items directly."
          : "",
    };
  }

  if (ext === "xls") {
    throw new Error(
      "Legacy binary .xls files cannot be parsed directly in the browser. Please re-save the file as .xlsx or .csv in Excel (File → Save As) and upload again."
    );
  }

  throw new Error(
    `Unsupported file format (.${ext}). Please upload .xlsx (Excel), .csv, .tsv, or a digital .pdf supplier invoice.`
  );
};

export const parsePastedPurchaseText = (pastedText, stock = []) => {
  const trimmed = String(pastedText || "").trim();
  if (!trimmed) return { items: [], metadata: {} };

  // If tabs or commas are present across lines, parse as delimited table first
  if (trimmed.includes("\t") || trimmed.includes(",") || trimmed.includes(";")) {
    const grid = parseDelimitedText(trimmed);
    const gridResult = extractPurchaseFromGrid(grid, stock);
    if (gridResult.items.length > 0) return gridResult;
  }

  const lines = trimmed.split(/\r?\n/).filter(Boolean);
  return extractPurchaseFromLines(lines, stock);
};

export const downloadPurchaseImportTemplate = (currency = "AED") => {
  const rows = [
    ["SKU", "Product Name", "Brand", "Category", "Quantity", `Unit Cost (${currency})`, `Selling Price (${currency})`],
    ["NOKIA-105", "Nokia 105", "Nokia", "Mobile Devices", "100", "38.50", "55.00"],
    ["HMD-100", "HMD 100", "HMD", "Mobile Devices", "50", "30.00", "45.00"],
    ["ANKER-PD-65W", "Anker 65W GaN Fast Charger", "Anker", "Accessories", "40", "75.00", "120.00"],
  ];

  const csv = "\uFEFF" + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `EALL_Purchase_Import_Template_${currency}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
