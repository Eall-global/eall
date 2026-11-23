/**
 * E-ALL Landed Cost Calculator & Sales Price Lookup Service
 * Handles multi-currency FOB conversion, package/carton logistics allocation,
 * customs & clearance distribution, Weighted Average Cost (WAC) stock blending,
 * and 1-click conversion into inward Purchase Records.
 *
 * Collection: `landed_cost_sheets` (Firestore with localStorage fallback)
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
import { fetchStock, updateProductDetails, updateLocationStock } from "./stockService";
import { createPurchaseRecord } from "./purchaseService";
import { logAuditEvent } from "./auditService";

const SHEETS_CACHE_KEY = "eall_landed_cost_sheets_cache";
const BUFFER_STORAGE_KEY = "eall_landed_cost_sales_buffer_pct";
const COLLECTION_NAME = "landed_cost_sheets";

export const CURRENCY_PRESETS = [
  { code: "AED", label: "AED — UAE Dirham", defaultRate: 1.0 },
  { code: "KES", label: "KES — Kenyan Shilling", defaultRate: 1.0 },
  { code: "XOF", label: "XOF — West African CFA", defaultRate: 1.0 },
  { code: "UGX", label: "UGX — Ugandan Shilling", defaultRate: 1.0 },
  { code: "GHS", label: "GHS — Ghanaian Cedi", defaultRate: 1.0 },
  { code: "SAR", label: "SAR — Saudi Riyal", defaultRate: 1.0 },
  { code: "USD", label: "USD — US Dollar", defaultRate: 3.6725 },
  { code: "EUR", label: "EUR — Euro", defaultRate: 3.98 },
  { code: "GBP", label: "GBP — British Pound", defaultRate: 4.65 },
  { code: "CNY", label: "CNY — Chinese Yuan", defaultRate: 0.51 },
];

export const ALLOCATION_METHODS = [
  {
    id: "packages",
    label: "By Packages / Cartons",
    description: "Distributes freight & handling proportionally by package/carton count",
  },
  {
    id: "quantity",
    label: "By Quantity (Per Piece)",
    description: "Distributes freight equally across every individual unit",
  },
  {
    id: "value",
    label: "By FOB Goods Value",
    description: "Distributes freight proportionally by each SKU's total purchase value",
  },
];

export const getSalesFloorBufferPercent = () => {
  try {
    const val = parseFloat(localStorage.getItem(BUFFER_STORAGE_KEY));
    return Number.isNaN(val) ? 0 : Math.max(0, Math.min(50, val));
  } catch {
    return 0;
  }
};

export const setSalesFloorBufferPercent = (pct) => {
  const clean = Math.max(0, Math.min(50, parseFloat(pct) || 0));
  try {
    localStorage.setItem(BUFFER_STORAGE_KEY, String(clean));
  } catch {
    // ignore
  }
  return clean;
};

/**
 * Pure calculation engine for a Landed Cost Sheet
 */
export const computeLandedCostSheet = (sheet = {}, stockList = []) => {
  const fxRate = Math.max(0.0001, Number(sheet.fxRate) || 1);
  const currency = sheet.currency || "AED";
  const allocationMethod = sheet.allocationMethod || "packages";
  const logisticsMode = sheet.logisticsMode || "per_package"; // "per_package" | "lump_sum"
  const ratePerPackageAed = Math.max(0, Number(sheet.ratePerPackageAed) || 0);
  const lumpSumFreightAed = Math.max(0, Number(sheet.lumpSumFreightAed) || 0);
  const customsDutyPercent = Math.max(0, Number(sheet.customsDutyPercent) || 0);
  const clearanceFeeAed = Math.max(0, Number(sheet.clearanceFeeAed) || 0);
  const insuranceAndBankAed = Math.max(0, Number(sheet.insuranceAndBankAed) || 0);
  const otherLogisticsAed = Math.max(0, Number(sheet.otherLogisticsAed) || 0);

  const stockMap = new Map((stockList || []).map((s) => [s.sku, s]));

  // Normalize line items
  const rawItems = Array.isArray(sheet.items) ? sheet.items : [];
  const preItems = rawItems.map((item, idx) => {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const unitBuyForeign = Math.max(0, Number(item.unitBuyPrice) || 0);
    const unitFobAed = unitBuyForeign * fxRate;
    const totalFobAed = unitFobAed * qty;

    const pcsPerPackage = Math.max(0, Number(item.pcsPerPackage) || 0);
    const derivedPackages =
      pcsPerPackage > 0
        ? Math.max(1, Math.ceil(qty / pcsPerPackage))
        : Math.max(1, Number(item.packages) || 1);

    const stockItem = stockMap.get(item.sku);
    const currentStockQty = Math.max(0, Number(stockItem?.quantity) || 0);
    const currentStockCostAed = Math.max(0, Number(stockItem?.costPrice) || 0);
    const currentSellingPriceAed = Math.max(0, Number(stockItem?.price) || 0);

    return {
      id: item.id || `${item.sku || "ITEM"}_${idx}`,
      sku: item.sku || `CUSTOM-${idx + 1}`,
      name: item.name || stockItem?.name || "Product Item",
      brand: item.brand || stockItem?.brand || "HMD",
      quantity: qty,
      pcsPerPackage,
      packages: derivedPackages,
      unitBuyPrice: unitBuyForeign,
      unitFobAed,
      totalFobAed,
      targetMarginPercent: Number(item.targetMarginPercent ?? 18),
      currentStockQty,
      currentStockCostAed,
      currentSellingPriceAed,
    };
  });

  const totalUnits = preItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalPackages = preItems.reduce((sum, i) => sum + i.packages, 0);
  const totalFobAed = preItems.reduce((sum, i) => sum + i.totalFobAed, 0);

  // Total package freight in AED
  const freightTotalAed =
    logisticsMode === "per_package"
      ? ratePerPackageAed * totalPackages
      : lumpSumFreightAed;

  // Package / Shipment-allocated pool (Freight + Clearance/DO + Other Package Handling)
  const packagePoolAed = freightTotalAed + clearanceFeeAed + otherLogisticsAed;

  // Value-allocated pool (Customs Duty % on FOB+Freight + Insurance/Bank fees)
  const customsDutyAed = ((totalFobAed + freightTotalAed) * customsDutyPercent) / 100;
  const valuePoolAed = customsDutyAed + insuranceAndBankAed;

  const totalOverheadAed = packagePoolAed + valuePoolAed;
  const totalLandedAed = totalFobAed + totalOverheadAed;

  const calculatedItems = preItems.map((item) => {
    const pkgShare = totalPackages > 0 ? item.packages / totalPackages : 0;
    const qtyShare = totalUnits > 0 ? item.quantity / totalUnits : 0;
    const valShare =
      totalFobAed > 0
        ? item.totalFobAed / totalFobAed
        : preItems.length > 0
        ? 1 / preItems.length
        : 0;

    let primaryShare = pkgShare;
    if (allocationMethod === "quantity") primaryShare = qtyShare;
    if (allocationMethod === "value") primaryShare = valShare;

    const allocatedLogisticsAed = packagePoolAed * primaryShare;
    const allocatedDutyAndFeesAed = valuePoolAed * valShare;
    const allocatedTotalOverheadAed =
      allocatedLogisticsAed + allocatedDutyAndFeesAed;

    const logisticsPerUnitAed = allocatedLogisticsAed / item.quantity;
    const dutyAndFeesPerUnitAed = allocatedDutyAndFeesAed / item.quantity;
    const overheadPerUnitAed = allocatedTotalOverheadAed / item.quantity;
    const landedCostPerUnitAed = item.unitFobAed + overheadPerUnitAed;
    const totalItemLandedAed = landedCostPerUnitAed * item.quantity;

    const overheadPercent =
      item.unitFobAed > 0 ? (overheadPerUnitAed / item.unitFobAed) * 100 : 0;

    // Weighted Average Cost (WAC) blending with existing on-hand stock
    const combinedQty = item.currentStockQty + item.quantity;
    const wacUnitCostAed =
      combinedQty > 0 && item.currentStockQty > 0 && item.currentStockCostAed > 0
        ? (item.currentStockQty * item.currentStockCostAed +
            item.quantity * landedCostPerUnitAed) /
          combinedQty
        : landedCostPerUnitAed;

    // Suggested selling price based on target margin %
    const marginFrac = Math.min(0.9, Math.max(0, item.targetMarginPercent / 100));
    const suggestedSellingPriceAed =
      marginFrac < 1
        ? landedCostPerUnitAed / (1 - marginFrac)
        : landedCostPerUnitAed * 1.2;

    const activeSellingPriceAed =
      item.currentSellingPriceAed > 0
        ? item.currentSellingPriceAed
        : suggestedSellingPriceAed;

    const unitProfitAtActivePrice = activeSellingPriceAed - landedCostPerUnitAed;
    const actualMarginPercent =
      activeSellingPriceAed > 0
        ? (unitProfitAtActivePrice / activeSellingPriceAed) * 100
        : 0;

    return {
      ...item,
      pkgSharePercent: pkgShare * 100,
      valSharePercent: valShare * 100,
      allocatedLogisticsAed,
      allocatedDutyAndFeesAed,
      allocatedTotalOverheadAed,
      logisticsPerUnitAed,
      dutyAndFeesPerUnitAed,
      overheadPerUnitAed,
      landedCostPerUnitAed,
      totalItemLandedAed,
      overheadPercent,
      wacUnitCostAed,
      suggestedSellingPriceAed,
      unitProfitAtActivePrice,
      actualMarginPercent,
    };
  });

  const avgLandedPerUnitAed = totalUnits > 0 ? totalLandedAed / totalUnits : 0;
  const avgLogisticsPerPackageAed =
    totalPackages > 0 ? packagePoolAed / totalPackages : 0;
  const overallOverheadPercent =
    totalFobAed > 0 ? (totalOverheadAed / totalFobAed) * 100 : 0;

  return {
    ...sheet,
    currency,
    fxRate,
    allocationMethod,
    logisticsMode,
    ratePerPackageAed,
    lumpSumFreightAed,
    customsDutyPercent,
    customsDutyAed,
    clearanceFeeAed,
    insuranceAndBankAed,
    otherLogisticsAed,
    freightTotalAed,
    packagePoolAed,
    valuePoolAed,
    totalUnits,
    totalPackages,
    totalFobAed,
    totalOverheadAed,
    totalLandedAed,
    avgLandedPerUnitAed,
    avgLogisticsPerPackageAed,
    overallOverheadPercent,
    items: calculatedItems,
  };
};

const DEFAULT_DEMO_SHEETS = [
  {
    id: "LC-2026-1001",
    sheetNo: "LC-2026-1001",
    locationCode: "AE",
    title: "HMD 2,000 Pcs Air Cargo Shipment (40 Master Cartons)",
    supplierName: "HMD Global / Regional Distribution Hub",
    shipmentRef: "AWB-DXB-884920",
    currency: "AED",
    fxRate: 1,
    allocationMethod: "packages",
    logisticsMode: "per_package",
    ratePerPackageAed: 135,
    lumpSumFreightAed: 5400,
    customsDutyPercent: 0,
    clearanceFeeAed: 850,
    insuranceAndBankAed: 350,
    otherLogisticsAed: 200,
    items: [
      {
        id: "demo_item_1",
        sku: "NOKIA-105",
        name: "Nokia 105",
        brand: "Nokia",
        quantity: 2000,
        pcsPerPackage: 50,
        packages: 40,
        unitBuyPrice: 38.5,
        targetMarginPercent: 22,
      },
    ],
    status: "Calculated",
    notes: "2,000 pcs packed 50 units per master carton (40 cartons total).",
    createdBy: "E-ALL Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const readCache = () => {
  try {
    const raw = localStorage.getItem(SHEETS_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeCache = (list) => {
  try {
    localStorage.setItem(SHEETS_CACHE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
};

/**
 * Fetch saved Landed Cost Sheets from Firestore or local cache
 */
export const fetchLandedCostSheets = async () => {
  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      if (!snap.empty) {
        const list = [];
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        list.sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt || 0) -
            new Date(a.updatedAt || a.createdAt || 0)
        );
        writeCache(list);
        return list;
      }
    } catch (err) {
      console.warn("Firestore landed_cost_sheets fetch warning:", err.message);
    }
  }

  const cached = readCache();
  if (cached && cached.length > 0) return cached;
  writeCache(DEFAULT_DEMO_SHEETS);
  return DEFAULT_DEMO_SHEETS;
};

/**
 * Save or update a Landed Cost Sheet
 */
export const saveLandedCostSheet = async (sheetData, stockList = []) => {
  const existingList = await fetchLandedCostSheets();
  const now = new Date().toISOString();
  const isExisting = Boolean(
    sheetData.id && existingList.some((s) => s.id === sheetData.id)
  );
  const sheetNo =
    sheetData.sheetNo ||
    sheetData.id ||
    `LC-${new Date().getFullYear()}-${String(1001 + existingList.length).padStart(4, "0")}`;

  const computed = computeLandedCostSheet(
    {
      ...sheetData,
      id: sheetNo,
      sheetNo,
    },
    stockList
  );

  const record = {
    id: sheetNo,
    sheetNo,
    locationCode: sheetData.locationCode || "AE",
    localCurrency: sheetData.localCurrency || "AED",
    title: (sheetData.title || `${sheetData.supplierName || "Shipment"} (${computed.totalUnits} pcs)`).trim(),
    supplierName: (sheetData.supplierName || "General Supplier").trim(),
    shipmentRef: (sheetData.shipmentRef || "").trim(),
    currency: computed.currency,
    fxRate: computed.fxRate,
    allocationMethod: computed.allocationMethod,
    logisticsMode: computed.logisticsMode,
    ratePerPackageAed: computed.ratePerPackageAed,
    lumpSumFreightAed: computed.lumpSumFreightAed,
    customsDutyPercent: computed.customsDutyPercent,
    clearanceFeeAed: computed.clearanceFeeAed,
    insuranceAndBankAed: computed.insuranceAndBankAed,
    otherLogisticsAed: computed.otherLogisticsAed,
    totalUnits: computed.totalUnits,
    totalPackages: computed.totalPackages,
    totalFobAed: Number(computed.totalFobAed.toFixed(2)),
    totalOverheadAed: Number(computed.totalOverheadAed.toFixed(2)),
    totalLandedAed: Number(computed.totalLandedAed.toFixed(2)),
    avgLandedPerUnitAed: Number(computed.avgLandedPerUnitAed.toFixed(2)),
    items: computed.items.map((i) => ({
      id: i.id,
      sku: i.sku,
      name: i.name,
      brand: i.brand,
      quantity: i.quantity,
      pcsPerPackage: i.pcsPerPackage,
      packages: i.packages,
      unitBuyPrice: i.unitBuyPrice,
      unitFobAed: Number(i.unitFobAed.toFixed(4)),
      logisticsPerUnitAed: Number(i.logisticsPerUnitAed.toFixed(4)),
      dutyAndFeesPerUnitAed: Number(i.dutyAndFeesPerUnitAed.toFixed(4)),
      landedCostPerUnitAed: Number(i.landedCostPerUnitAed.toFixed(2)),
      wacUnitCostAed: Number(i.wacUnitCostAed.toFixed(2)),
      targetMarginPercent: i.targetMarginPercent,
      suggestedSellingPriceAed: Number(i.suggestedSellingPriceAed.toFixed(2)),
    })),
    status: sheetData.status || "Saved",
    linkedPurchaseNo: sheetData.linkedPurchaseNo || "",
    notes: (sheetData.notes || "").trim(),
    createdBy: sheetData.createdBy || "Admin",
    createdAt: sheetData.createdAt || now,
    updatedAt: now,
  };

  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      await setDoc(doc(db, COLLECTION_NAME, record.id), record, { merge: true });
    } catch (err) {
      console.warn("Firestore landed cost sheet save error:", err.message);
    }
  }

  const nextList = [record, ...existingList.filter((s) => s.id !== record.id)];
  writeCache(nextList);

  const cur = record.localCurrency || "AED";
  logAuditEvent({
    module: "landed_cost",
    action: isExisting ? "update" : "create",
    severity: "info",
    targetId: record.sheetNo,
    targetLabel: `${record.sheetNo} • ${record.title}`,
    summary: `${isExisting ? "Updated" : "Saved"} Landed Cost Sheet ${record.sheetNo} (${record.totalUnits} pcs across ${record.totalPackages} pkgs • Total ${cur} ${record.totalLandedAed.toLocaleString()})`,
    changes: [
      { field: "Total Units", before: "—", after: `${record.totalUnits} pcs (${record.totalPackages} pkgs)` },
      { field: "Logistics & Fees", before: "—", after: `${cur} ${record.totalOverheadAed.toFixed(2)}` },
      { field: "Avg Landed / Pc", before: "—", after: `${cur} ${record.avgLandedPerUnitAed.toFixed(2)}` },
    ],
  });

  return record;
};

/**
 * Apply calculated Landed Cost (WAC or Latest) directly to Stock Manager catalog
 */
export const applyLandedCostToStock = async (
  calculatedSheet,
  { costRule = "wac", updateSellingPrice = false, locationCode = "AE", currencyLabel = "AED" } = {}
) => {
  const currentStock = await fetchStock();
  const stockMap = new Map(currentStock.map((s) => [s.sku, s]));
  const updatedSkus = [];

  for (const item of calculatedSheet.items || []) {
    const stockItem = stockMap.get(item.sku);
    if (!stockItem) continue;

    const newUnitCost = Number(
      (costRule === "wac"
        ? item.wacUnitCostAed
        : item.landedCostPerUnitAed
      ).toFixed(2)
    );

    const nextSellingPrice = updateSellingPrice
      ? Math.round(item.suggestedSellingPriceAed)
      : Number(stockItem.price) || Math.round(item.suggestedSellingPriceAed);

    const nextMargin = Math.max(0, Number((nextSellingPrice - newUnitCost).toFixed(2)));

    if (locationCode && locationCode !== "AE" && locationCode !== "ALL") {
      await updateLocationStock(item.sku, locationCode, {
        costLocal: newUnitCost,
        ...(updateSellingPrice ? { priceLocal: nextSellingPrice } : {}),
      });
    } else {
      await updateProductDetails(item.sku, {
        costPrice: newUnitCost,
        margin: nextMargin,
        price: nextSellingPrice,
        skipAudit: true,
      });
    }

    updatedSkus.push({
      sku: item.sku,
      name: item.name,
      oldCost: Number(stockItem.costPrice) || 0,
      newCost: newUnitCost,
    });
  }

  logAuditEvent({
    module: "landed_cost",
    action: "update",
    severity: "warning",
    targetId: calculatedSheet.sheetNo || "LANDED-APPLY",
    targetLabel: `${updatedSkus.length} SKU(s) • ${costRule === "wac" ? "WAC Blended" : "Latest Landed"}`,
    summary: `Applied ${costRule === "wac" ? "Weighted Average (WAC)" : "Latest"} Landed Cost to ${updatedSkus.length} product(s) in Stock Manager (${locationCode})`,
    changes: updatedSkus.slice(0, 6).map((u) => ({
      field: `${u.sku} Cost`,
      before: `${currencyLabel} ${u.oldCost.toFixed(2)}`,
      after: `${currencyLabel} ${u.newCost.toFixed(2)}`,
    })),
  });

  return updatedSkus;
};

/**
 * Convert a Landed Cost Sheet into an Inward Purchase Order (PO) & increment stock
 */
export const convertLandedCostToPurchase = async (
  calculatedSheet,
  {
    costRule = "wac",
    paymentStatus = "Paid",
    paymentMethod = "Bank Transfer",
    createdBy = "Admin",
  } = {}
) => {
  const poItems = (calculatedSheet.items || []).map((item) => {
    const effectiveCost = Number(
      (costRule === "wac" ? item.wacUnitCostAed : item.landedCostPerUnitAed).toFixed(2)
    );
    return {
      sku: item.sku,
      name: item.name,
      brand: item.brand,
      quantity: item.quantity,
      unitCost: Number(item.landedCostPerUnitAed.toFixed(2)),
      effectiveCatalogCost: effectiveCost,
      packages: item.packages,
      totalCost: Number((item.landedCostPerUnitAed * item.quantity).toFixed(2)),
    };
  });

  const poRecord = await createPurchaseRecord({
    supplierName: calculatedSheet.supplierName || "General Supplier",
    supplierInvoiceRef: calculatedSheet.shipmentRef || calculatedSheet.sheetNo || "",
    purchaseDate: new Date().toISOString().slice(0, 10),
    paymentStatus,
    paymentMethod,
    items: poItems,
    notes: `Landed Cost Sheet ${calculatedSheet.sheetNo || ""}: ${calculatedSheet.totalUnits} pcs in ${calculatedSheet.totalPackages} pkgs | FOB AED ${calculatedSheet.totalFobAed.toFixed(2)} + Logistics/Fees AED ${calculatedSheet.totalOverheadAed.toFixed(2)}`,
    createdBy,
    updateProductCost: false, // We apply exact WAC / Latest below
  });

  // Apply the chosen WAC or Latest cost rule to Stock Manager
  await applyLandedCostToStock(calculatedSheet, {
    costRule,
    updateSellingPrice: false,
  });

  // Save/update the sheet with the linked PO number
  await saveLandedCostSheet({
    ...calculatedSheet,
    status: "Posted to PO",
    linkedPurchaseNo: poRecord.purchaseNo,
  });

  return poRecord;
};

/**
 * Delete a saved Landed Cost Sheet
 */
export const deleteLandedCostSheet = async (sheetId) => {
  const existing = await fetchLandedCostSheets();
  const target = existing.find((s) => s.id === sheetId);

  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, sheetId));
    } catch (err) {
      console.warn("Firestore landed cost delete error:", err.message);
    }
  }

  const next = existing.filter((s) => s.id !== sheetId);
  writeCache(next);

  logAuditEvent({
    module: "landed_cost",
    action: "delete",
    severity: "warning",
    targetId: sheetId,
    targetLabel: target ? `${target.sheetNo} • ${target.title}` : sheetId,
    summary: `Deleted Landed Cost Sheet ${sheetId}`,
    changes: [{ field: "Sheet", before: target?.title || sheetId, after: "Deleted" }],
  });

  return true;
};

