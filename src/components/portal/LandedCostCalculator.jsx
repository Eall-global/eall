import { useState, useMemo } from "react";
import {
  FiPackage,
  FiTruck,
  FiDollarSign,
  FiPercent,
  FiSearch,
  FiPlus,
  FiTrash2,
  FiDownload,
  FiSave,
  FiCheckCircle,
  FiArrowRight,
  FiLayers,
  FiFolder,
  FiShield,
  FiRefreshCw,
  FiAlertCircle,
  FiSliders,
} from "react-icons/fi";
import PortalKpiGrid from "./PortalKpiGrid";
import { AedPrice } from "../common/AedSymbol";
import { usePortalCurrency } from "../../context/PortalCurrencyContext";
import {
  CURRENCY_PRESETS,
  ALLOCATION_METHODS,
  computeLandedCostSheet,
  saveLandedCostSheet,
  applyLandedCostToStock,
  convertLandedCostToPurchase,
  deleteLandedCostSheet,
  getSalesFloorBufferPercent,
  setSalesFloorBufferPercent,
} from "../../services/landedCostService";

const createBlankSheet = (portalCur) => {
  const isHq = !portalCur || portalCur.countryCode === "AE" || portalCur.isAll;
  if (!isHq) {
    return {
      id: "",
      sheetNo: "",
      locationCode: portalCur.countryCode,
      localCurrency: portalCur.currency,
      title: `${portalCur.shortName} Inbound Shipment`,
      supplierName: "Dubai Main Hub (HQ) / Distributor",
      shipmentRef: "",
      currency: portalCur.currency,
      fxRate: 1.0,
      allocationMethod: "packages",
      logisticsMode: "per_package",
      ratePerPackageAed: 0,
      lumpSumFreightAed: 0,
      customsDutyPercent: 0,
      clearanceFeeAed: 0,
      insuranceAndBankAed: 0,
      otherLogisticsAed: 0,
      items: [],
      notes: "",
    };
  }
  return {
    id: "",
    sheetNo: "",
    locationCode: "AE",
    localCurrency: "AED",
    title: "HMD 2,000 Pcs Shipment (40 Master Cartons)",
    supplierName: "HMD Global / Regional Distributor",
    shipmentRef: "",
    currency: "AED",
    fxRate: 1.0,
    allocationMethod: "packages",
    logisticsMode: "per_package", // "per_package" | "lump_sum"
    ratePerPackageAed: 135,
    lumpSumFreightAed: 5400,
    customsDutyPercent: 0,
    clearanceFeeAed: 850,
    insuranceAndBankAed: 350,
    otherLogisticsAed: 200,
    items: [
      {
        id: "item_default_1",
        sku: "NOKIA-105",
        name: "Nokia 105",
        brand: "Nokia",
        quantity: 2000,
        pcsPerPackage: 50,
        packages: 40,
        unitBuyPrice: 38.5,
        targetMarginPercent: 20,
      },
    ],
    notes: "",
  };
};

const LandedCostCalculator = ({
  stock = [],
  sheets = [],
  onDataUpdated,
  currentUser,
  isAdmin = false,
}) => {
  const portalCur = usePortalCurrency();
  const curSym = portalCur.symbol;
  const curCode = portalCur.currency;
  const curDecimals = portalCur.decimals;
  const curLocale = portalCur.locale;

  // Active View: Salespeople start on "lookup", Admins can switch freely between "calculator", "lookup", "history"
  const [activeView, setActiveView] = useState(
    isAdmin ? "calculator" : "lookup"
  );

  // Active Shipment Sheet State (initialized from latest saved sheet or country-scoped blank sheet)
  const [sheetForm, setSheetForm] = useState(() =>
    sheets.length > 0 ? { ...sheets[0] } : createBlankSheet(portalCur)
  );

  // Add Product to Shipment Search
  const [productQuery, setProductQuery] = useState("");

  // Cost Application Rule: "wac" (Weighted Average Cost - default) | "latest"
  const [costRule, setCostRule] = useState("wac");
  const [alsoUpdateSellingPrice, setAlsoUpdateSellingPrice] = useState(false);

  // Status / Feedback Banner
  const [busyAction, setBusyAction] = useState("");
  const [feedback, setFeedback] = useState(null); // { tone: "ok" | "err", text }

  // Salesperson Single-Piece Lookup & Quote Simulator State
  const [lookupQuery, setLookupQuery] = useState("");
  const [selectedLookupSku, setSelectedLookupSku] = useState("NOKIA-105");
  const [quoteUnitSellAed, setQuoteUnitSellAed] = useState("");
  const [quoteDealQty, setQuoteDealQty] = useState(100);
  const [salesFloorBufferPct, setSalesFloorBufferPct] = useState(() =>
    getSalesFloorBufferPercent()
  );

  // Live Calculated Shipment Sheet
  const calculatedSheet = useMemo(
    () => computeLandedCostSheet(sheetForm, stock),
    [sheetForm, stock]
  );

  // AllSavedSheets enriched with live calculation
  const enrichedSavedSheets = useMemo(
    () => sheets.map((s) => computeLandedCostSheet(s, stock)),
    [sheets, stock]
  );

  // Product Search Results for Adding to Shipment
  const matchingStockForBuilder = useMemo(() => {
    if (!productQuery.trim()) return [];
    const q = productQuery.toLowerCase().trim();
    return stock
      .filter(
        (s) =>
          (s.name || "").toLowerCase().includes(q) ||
          (s.sku || "").toLowerCase().includes(q) ||
          (s.brand || "").toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [stock, productQuery]);

  // Unified SKU Directory for Salesperson Single-Piece Landed Price Lookup
  // Combines active calculator items, saved shipment sheets, and Stock Manager items
  const lookupDirectory = useMemo(() => {
    const map = new Map();

    // 1. Seed from Stock Manager catalog
    stock.forEach((s) => {
      const baseCost = Number(s.costPrice) || 0;
      map.set(s.sku, {
        sku: s.sku,
        name: s.name,
        brand: s.brand || "General",
        stockQty: Number(s.quantity) || 0,
        catalogCostAed: baseCost,
        catalogSellingPriceAed: Number(s.price) || 0,
        latestBatch: null,
      });
    });

    // 2. Overlay from saved Landed Cost Sheets (oldest to newest so latest wins)
    [...enrichedSavedSheets].reverse().forEach((sheet) => {
      (sheet.items || []).forEach((item) => {
        const existing = map.get(item.sku);
        const batchInfo = {
          sheetNo: sheet.sheetNo || sheet.id || "Draft",
          sheetTitle: sheet.title,
          supplierName: sheet.supplierName,
          updatedAt: sheet.updatedAt || sheet.createdAt,
          batchQty: item.quantity,
          packages: item.packages,
          pcsPerPackage: item.pcsPerPackage,
          unitFobAed: item.unitFobAed,
          logisticsPerUnitAed: item.logisticsPerUnitAed,
          dutyAndFeesPerUnitAed: item.dutyAndFeesPerUnitAed,
          overheadPerUnitAed: item.overheadPerUnitAed,
          landedCostPerUnitAed: item.landedCostPerUnitAed,
          wacUnitCostAed: item.wacUnitCostAed,
          suggestedSellingPriceAed: item.suggestedSellingPriceAed,
        };
        map.set(item.sku, {
          sku: item.sku,
          name: existing?.name || item.name,
          brand: existing?.brand || item.brand || "General",
          stockQty: existing?.stockQty ?? 0,
          catalogCostAed: existing?.catalogCostAed || item.landedCostPerUnitAed,
          catalogSellingPriceAed:
            existing?.catalogSellingPriceAed || item.suggestedSellingPriceAed,
          latestBatch: batchInfo,
        });
      });
    });

    // 3. Overlay live active calculator sheet items so edits reflect immediately in Lookup!
    (calculatedSheet.items || []).forEach((item) => {
      const existing = map.get(item.sku);
      map.set(item.sku, {
        sku: item.sku,
        name: existing?.name || item.name,
        brand: existing?.brand || item.brand || "General",
        stockQty: existing?.stockQty ?? 0,
        catalogCostAed: existing?.catalogCostAed || item.landedCostPerUnitAed,
        catalogSellingPriceAed:
          existing?.catalogSellingPriceAed || item.suggestedSellingPriceAed,
        latestBatch: {
          sheetNo: calculatedSheet.sheetNo || "Active Calculator",
          sheetTitle: calculatedSheet.title,
          supplierName: calculatedSheet.supplierName,
          updatedAt: new Date().toISOString(),
          batchQty: item.quantity,
          packages: item.packages,
          pcsPerPackage: item.pcsPerPackage,
          unitFobAed: item.unitFobAed,
          logisticsPerUnitAed: item.logisticsPerUnitAed,
          dutyAndFeesPerUnitAed: item.dutyAndFeesPerUnitAed,
          overheadPerUnitAed: item.overheadPerUnitAed,
          landedCostPerUnitAed: item.landedCostPerUnitAed,
          wacUnitCostAed: item.wacUnitCostAed,
          suggestedSellingPriceAed: item.suggestedSellingPriceAed,
        },
      });
    });

    return Array.from(map.values()).sort((a, b) => {
      // Prioritize items with calculated shipment batches or positive cost
      const aHasBatch = a.latestBatch ? 1 : 0;
      const bHasBatch = b.latestBatch ? 1 : 0;
      if (bHasBatch !== aHasBatch) return bHasBatch - aHasBatch;
      return (b.catalogCostAed || 0) - (a.catalogCostAed || 0);
    });
  }, [stock, enrichedSavedSheets, calculatedSheet]);

  const filteredLookupItems = useMemo(() => {
    if (!lookupQuery.trim()) return lookupDirectory.slice(0, 30);
    const q = lookupQuery.toLowerCase().trim();
    return lookupDirectory
      .filter(
        (item) =>
          (item.name || "").toLowerCase().includes(q) ||
          (item.sku || "").toLowerCase().includes(q) ||
          (item.brand || "").toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [lookupDirectory, lookupQuery]);

  const activeLookupItem = useMemo(() => {
    return (
      lookupDirectory.find((i) => i.sku === selectedLookupSku) ||
      filteredLookupItems[0] ||
      lookupDirectory[0] ||
      null
    );
  }, [lookupDirectory, selectedLookupSku, filteredLookupItems]);

  const showNotice = (tone, text) => {
    setFeedback({ tone, text });
    window.setTimeout(() => {
      setFeedback((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // Currency Change Handler
  const handleCurrencyChange = (code) => {
    const preset = CURRENCY_PRESETS.find((c) => c.code === code);
    setSheetForm((prev) => ({
      ...prev,
      currency: code,
      fxRate: preset ? preset.defaultRate : prev.fxRate,
    }));
  };

  // Add Product from Stock to Active Shipment Sheet
  const handleAddProductToSheet = (prod) => {
    setSheetForm((prev) => {
      const exists = (prev.items || []).some((i) => i.sku === prod.sku);
      if (exists) return prev;
      const defaultFob =
        (Number(prod.costPrice) || Number(prod.price) * 0.75 || 50) /
        (Number(prev.fxRate) || 1);
      return {
        ...prev,
        items: [
          ...(prev.items || []),
          {
            id: `item_${Date.now()}`,
            sku: prod.sku,
            name: prod.name,
            brand: prod.brand || "General",
            quantity: 100,
            pcsPerPackage: 25,
            packages: 4,
            unitBuyPrice: Number(defaultFob.toFixed(2)),
            targetMarginPercent: 18,
          },
        ],
      };
    });
    setProductQuery("");
  };

  // Add Custom / Prospective Item Row (for items not yet in catalog)
  const handleAddCustomRow = () => {
    const idx = (sheetForm.items?.length || 0) + 1;
    setSheetForm((prev) => ({
      ...prev,
      items: [
        ...(prev.items || []),
        {
          id: `custom_${Date.now()}`,
          sku: `HMD-NEW-${idx}`,
          name: `HMD Device Model ${idx}`,
          brand: "HMD",
          quantity: 500,
          pcsPerPackage: 50,
          packages: 10,
          unitBuyPrice: 45,
          targetMarginPercent: 20,
        },
      ],
    }));
  };

  const handleUpdateItemField = (itemId, field, value) => {
    setSheetForm((prev) => ({
      ...prev,
      items: (prev.items || []).map((item) => {
        if (item.id !== itemId) return item;
        const next = { ...item, [field]: value };

        // Auto-sync packages when quantity or pcsPerPackage changes
        if (field === "quantity" || field === "pcsPerPackage") {
          const q = Math.max(1, Number(next.quantity) || 1);
          const ppp = Math.max(0, Number(next.pcsPerPackage) || 0);
          if (ppp > 0) {
            next.packages = Math.max(1, Math.ceil(q / ppp));
          }
        }
        // If user manually edits packages directly, clear pcsPerPackage override so manual package count sticks
        if (field === "packages") {
          next.pcsPerPackage = 0;
        }
        return next;
      }),
    }));
  };

  const handleRemoveItemRow = (itemId) => {
    setSheetForm((prev) => ({
      ...prev,
      items: (prev.items || []).filter((i) => i.id !== itemId),
    }));
  };

  // Save Sheet to Firestore
  const handleSaveSheet = async () => {
    if (!calculatedSheet.items.length) {
      showNotice("err", "Add at least one product row before saving.");
      return;
    }
    setBusyAction("save");
    try {
      const saved = await saveLandedCostSheet(
        {
          ...sheetForm,
          locationCode: portalCur.countryCode,
          localCurrency: curCode,
          createdBy: currentUser?.name || "Admin",
        },
        stock
      );
      setSheetForm((prev) => ({
        ...prev,
        id: saved.id,
        sheetNo: saved.sheetNo,
        status: saved.status,
      }));
      if (onDataUpdated) await onDataUpdated();
      showNotice("ok", `Saved Landed Cost Sheet ${saved.sheetNo}.`);
    } catch (err) {
      showNotice("err", err.message || "Failed to save landed cost sheet.");
    } finally {
      setBusyAction("");
    }
  };

  // Apply Landed Cost to Stock Manager
  const handleApplyToStock = async () => {
    if (!isAdmin) return;
    if (!calculatedSheet.items.length) return;
    setBusyAction("apply");
    try {
      await saveLandedCostSheet(
        {
          ...sheetForm,
          locationCode: portalCur.countryCode,
          localCurrency: curCode,
          createdBy: currentUser?.name || "Admin",
        },
        stock
      );
      const updated = await applyLandedCostToStock(calculatedSheet, {
        costRule,
        updateSellingPrice: alsoUpdateSellingPrice,
        locationCode: portalCur.countryCode,
        currencyLabel: curSym,
      });
      if (onDataUpdated) await onDataUpdated();
      showNotice(
        "ok",
        `Updated costPrice (${costRule === "wac" ? "Weighted Avg WAC" : "Latest Landed"}) for ${updated.length} SKU(s) in Stock Manager.`
      );
    } catch (err) {
      showNotice("err", err.message || "Failed to update stock costs.");
    } finally {
      setBusyAction("");
    }
  };

  // Convert Shipment Sheet into Inward Purchase Order (PO)
  const handlePostToPurchase = async () => {
    if (!isAdmin) return;
    if (!calculatedSheet.items.length) return;
    if (
      !window.confirm(
        `Create an official Inward Purchase Order (PO) for ${calculatedSheet.totalUnits.toLocaleString()} pcs (${calculatedSheet.totalPackages} packages) and increment Stock Manager quantities?`
      )
    ) {
      return;
    }
    setBusyAction("po");
    try {
      const po = await convertLandedCostToPurchase(calculatedSheet, {
        costRule,
        createdBy: currentUser?.name || "Admin",
      });
      setSheetForm((prev) => ({
        ...prev,
        status: "Posted to PO",
        linkedPurchaseNo: po.purchaseNo,
      }));
      if (onDataUpdated) await onDataUpdated();
      showNotice(
        "ok",
        `Created Purchase Record ${po.purchaseNo} (+${calculatedSheet.totalUnits.toLocaleString()} pcs inwarded at landed cost).`
      );
    } catch (err) {
      showNotice("err", err.message || "Failed to create purchase record.");
    } finally {
      setBusyAction("");
    }
  };

  const handleExportCSV = () => {
    if (!calculatedSheet.items.length) return;
    const headers = [
      "SKU",
      "Product Name",
      "Brand",
      "Qty (Pcs)",
      "Packages / Cartons",
      `Unit Buy (${calculatedSheet.currency})`,
      `FOB Unit (${curCode})`,
      `Logistics / Pc (${curCode})`,
      `Duty & Fees / Pc (${curCode})`,
      `Landed Cost / 1 Pc (${curCode})`,
      `Blended WAC / 1 Pc (${curCode})`,
      `Total Landed (${curCode})`,
      `Suggested Sell Price (${curCode})`,
    ];
    const rows = calculatedSheet.items.map((i) => [
      `"${i.sku}"`,
      `"${(i.name || "").replace(/"/g, '""')}"`,
      `"${i.brand}"`,
      i.quantity,
      i.packages,
      i.unitBuyPrice.toFixed(2),
      i.unitFobAed.toFixed(2),
      i.logisticsPerUnitAed.toFixed(2),
      i.dutyAndFeesPerUnitAed.toFixed(2),
      i.landedCostPerUnitAed.toFixed(2),
      i.wacUnitCostAed.toFixed(2),
      i.totalItemLandedAed.toFixed(2),
      i.suggestedSellingPriceAed.toFixed(2),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `EALL_Landed_Cost_${calculatedSheet.sheetNo || "Shipment"}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Salesperson Single-Piece Lookup Derived Numbers
  const lookupMetrics = useMemo(() => {
    if (!activeLookupItem) return null;
    const batch = activeLookupItem.latestBatch;
    const rawLandedUnit = batch
      ? batch.landedCostPerUnitAed
      : activeLookupItem.catalogCostAed;
    const wacUnit = batch
      ? batch.wacUnitCostAed
      : activeLookupItem.catalogCostAed;

    // Apply optional Admin Sales Floor Buffer % for non-admin view (or show both for Admin)
    const bufferMultiplier = 1 + salesFloorBufferPct / 100;
    const effectiveSalesUnitCost = rawLandedUnit * bufferMultiplier;

    const defaultSellPrice =
      activeLookupItem.catalogSellingPriceAed > 0
        ? activeLookupItem.catalogSellingPriceAed
        : batch?.suggestedSellingPriceAed || effectiveSalesUnitCost * 1.2;

    const simulatedSellUnit =
      quoteUnitSellAed !== "" && !Number.isNaN(parseFloat(quoteUnitSellAed))
        ? Math.max(0, parseFloat(quoteUnitSellAed))
        : defaultSellPrice;

    const qty = Math.max(1, Number(quoteDealQty) || 1);
    const unitProfit = simulatedSellUnit - effectiveSalesUnitCost;
    const totalDealRevenue = simulatedSellUnit * qty;
    const totalDealProfit = unitProfit * qty;
    const marginPercent =
      simulatedSellUnit > 0 ? (unitProfit / simulatedSellUnit) * 100 : 0;
    const markupPercent =
      effectiveSalesUnitCost > 0
        ? (unitProfit / effectiveSalesUnitCost) * 100
        : 0;

    return {
      rawLandedUnit,
      wacUnit,
      effectiveSalesUnitCost,
      unitFobAed: batch ? batch.unitFobAed : rawLandedUnit,
      logisticsPerUnitAed: batch ? batch.logisticsPerUnitAed : 0,
      dutyAndFeesPerUnitAed: batch ? batch.dutyAndFeesPerUnitAed : 0,
      overheadPerUnitAed: batch ? batch.overheadPerUnitAed : 0,
      batchQty: batch?.batchQty || activeLookupItem.stockQty || 1,
      packages: batch?.packages || 1,
      pcsPerPackage: batch?.pcsPerPackage || 0,
      sheetTitle: batch?.sheetTitle || "Catalog Standard Cost",
      sheetNo: batch?.sheetNo || "STOCK-COST",
      tierBulk8: effectiveSalesUnitCost / (1 - 0.08),
      tierWholesale15: effectiveSalesUnitCost / (1 - 0.15),
      tierRetail25: effectiveSalesUnitCost / (1 - 0.25),
      simulatedSellUnit,
      qty,
      unitProfit,
      totalDealRevenue,
      totalDealProfit,
      marginPercent,
      markupPercent,
    };
  }, [
    activeLookupItem,
    salesFloorBufferPct,
    quoteUnitSellAed,
    quoteDealQty,
  ]);

  return (
    <div className="space-y-4 sm:space-y-5 text-left">
      {/* KPI SUMMARY CARDS */}
      <PortalKpiGrid
        items={[
          {
            id: "fob",
            label: "Goods Value (FOB)",
            value: (
              <AedPrice
                amount={calculatedSheet.totalFobAed}
                decimals={0}
                className="font-mono font-black text-slate-900 dark:text-white"
              />
            ),
            sublabel: `${calculatedSheet.totalUnits.toLocaleString()} pcs (${calculatedSheet.currency})`,
            icon: FiPackage,
            tone: "sky",
          },
          {
            id: "logistics",
            label: "Logistics & Fees",
            value: (
              <AedPrice
                amount={calculatedSheet.totalOverheadAed}
                decimals={0}
                className="font-mono font-black text-amber-700 dark:text-amber-300"
              />
            ),
            sublabel: `${calculatedSheet.totalPackages} pkgs • ${curSym} ${calculatedSheet.avgLogisticsPerPackageAed.toFixed(0)}/pkg`,
            icon: FiTruck,
            tone: "amber",
          },
          {
            id: "unit_landed",
            label: "Avg Landed / 1 Pc",
            value: (
              <AedPrice
                amount={calculatedSheet.avgLandedPerUnitAed}
                decimals={2}
                className="font-mono font-black text-emerald-700 dark:text-emerald-300"
              />
            ),
            sublabel: `+${calculatedSheet.overallOverheadPercent.toFixed(1)}% over FOB cost`,
            icon: FiPercent,
            tone: "emerald",
          },
          {
            id: "total_landed",
            label: "Total Landed Cost",
            value: (
              <AedPrice
                amount={calculatedSheet.totalLandedAed}
                decimals={0}
                className="font-mono font-black text-sky-900 dark:text-sky-300"
              />
            ),
            sublabel: `${sheets.length} saved shipment sheet(s)`,
            icon: FiDollarSign,
            tone: "indigo",
          },
        ]}
      />

      {/* TOP MODE SWITCHER & TOOLBAR */}
      <div className="p-2.5 sm:p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2 transition-colors">
        <div className="flex-1 sm:flex-initial inline-grid grid-cols-3 sm:inline-flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 min-w-0">
          <button
            type="button"
            onClick={() => setActiveView("lookup")}
            className={`inline-flex items-center justify-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeView === "lookup"
                ? "bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FiSearch className="text-xs shrink-0" />
            <span className="sm:hidden">1-Pc Lookup</span>
            <span className="hidden sm:inline">1-Piece Price Lookup</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView("calculator")}
            className={`inline-flex items-center justify-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeView === "calculator"
                ? "bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FiSliders className="text-xs shrink-0" />
            <span className="sm:hidden">Calculator</span>
            <span className="hidden sm:inline">Shipment Calculator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView("history")}
            className={`inline-flex items-center justify-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeView === "history"
                ? "bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FiFolder className="text-xs shrink-0" />
            <span className="sm:hidden">Saved ({sheets.length})</span>
            <span className="hidden sm:inline">Saved Sheets ({sheets.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={calculatedSheet.items.length === 0}
            aria-label="Export CSV"
            title="Export Landed Cost CSV"
            className="inline-flex items-center justify-center gap-1.5 w-9 h-9 sm:w-10 sm:h-10 md:w-auto md:px-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            <FiDownload className="text-sm" />
            <span className="hidden md:inline">Export CSV</span>
          </button>

          {activeView === "calculator" && (
            <button
              type="button"
              onClick={() => setSheetForm(createBlankSheet(portalCur))}
              aria-label="Reset calculator"
              title="Reset / New Sheet"
              className="inline-flex items-center justify-center gap-1.5 w-9 h-9 sm:w-auto sm:h-10 sm:px-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              <FiRefreshCw className="text-xs" />
              <span className="hidden sm:inline">Reset / New</span>
            </button>
          )}
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
            feedback.tone === "ok"
              ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-500/25"
              : "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/25"
          }`}
        >
          {feedback.tone === "ok" ? (
            <FiCheckCircle className="text-base shrink-0" />
          ) : (
            <FiAlertCircle className="text-base shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 1: SALESPERSON SINGLE-PIECE LANDED PRICE LOOKUP & SIMULATOR      */}
      {/* ===================================================================== */}
      {activeView === "lookup" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left: Product Selector List (5 Cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Select Product / Model
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {lookupDirectory.length} SKUs
              </span>
            </div>

            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                placeholder="Search HMD, Nokia 105, iPhone, SKU..."
                className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-xl text-xs sm:text-sm outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600"
              />
            </div>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-0.5">
              {filteredLookupItems.map((item) => {
                const isSelected = activeLookupItem?.sku === item.sku;
                const rawUnit = item.latestBatch
                  ? item.latestBatch.landedCostPerUnitAed
                  : item.catalogCostAed;
                const displayUnit = rawUnit * (1 + salesFloorBufferPct / 100);

                return (
                  <button
                    key={item.sku}
                    type="button"
                    onClick={() => {
                      setSelectedLookupSku(item.sku);
                      setQuoteUnitSellAed("");
                    }}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition cursor-pointer ${
                      isSelected
                        ? "bg-sky-50/80 dark:bg-sky-500/15 border-sky-400 dark:border-sky-500/50 shadow-2xs"
                        : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-500/40"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {item.name}
                        </p>
                        {item.latestBatch && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shrink-0">
                            Shipment Calc
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {item.sku} • {item.brand} • Stock: {item.stockQty}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        1-Pc Landed
                      </span>
                      <span className="font-mono font-black text-xs sm:text-sm text-sky-800 dark:text-sky-300">
                        {curSym} {displayUnit.toLocaleString(curLocale, { minimumFractionDigits: curDecimals, maximumFractionDigits: curDecimals })}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Single-Piece Landed Cost Breakdown & Quote Margin Simulator (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {activeLookupItem && lookupMetrics ? (
              <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
                {/* Item Header & Hero Single-Piece Price */}
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300">
                        {activeLookupItem.brand}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {activeLookupItem.sku}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        • Source: {lookupMetrics.sheetNo}
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
                      {activeLookupItem.name}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {lookupMetrics.sheetTitle} ({lookupMetrics.batchQty.toLocaleString()} pcs across{" "}
                      {lookupMetrics.packages} packages)
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
                      {salesFloorBufferPct > 0
                        ? `Sales Floor Landed / 1 Piece (+${salesFloorBufferPct}%)`
                        : "True Landed Cost / 1 Single Piece"}
                    </span>
                    <p className="text-2xl font-mono font-black text-emerald-800 dark:text-emerald-300 mt-0.5">
                      {curSym} {lookupMetrics.effectiveSalesUnitCost.toLocaleString(curLocale, { minimumFractionDigits: curDecimals, maximumFractionDigits: curDecimals })}
                    </p>
                    {isAdmin && salesFloorBufferPct > 0 && (
                      <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        Raw Landed: {curSym} {lookupMetrics.rawLandedUnit.toLocaleString(curLocale, { minimumFractionDigits: curDecimals, maximumFractionDigits: curDecimals })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Single-Piece Cost Anatomy (Base + Package Logistics + Fees = 1 Piece Landed) */}
                {(isAdmin || salesFloorBufferPct === 0) && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Base Unit (FOB)
                      </span>
                      <p className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-1">
                        {curSym} {lookupMetrics.unitFobAed.toLocaleString(curLocale, { minimumFractionDigits: curDecimals, maximumFractionDigits: curDecimals })}
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Package Logistics / Pc
                      </span>
                      <p className="text-sm font-mono font-bold text-amber-700 dark:text-amber-300 mt-1">
                        + {curSym} {lookupMetrics.logisticsPerUnitAed.toLocaleString(curLocale, { minimumFractionDigits: curDecimals, maximumFractionDigits: curDecimals })}
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Duty &amp; Fees / Pc
                      </span>
                      <p className="text-sm font-mono font-bold text-indigo-700 dark:text-indigo-300 mt-1">
                        + {curSym} {lookupMetrics.dutyAndFeesPerUnitAed.toLocaleString(curLocale, { minimumFractionDigits: curDecimals, maximumFractionDigits: curDecimals })}
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-500/10 border border-sky-200/70 dark:border-sky-500/25">
                      <span className="text-[10px] font-bold uppercase text-sky-700 dark:text-sky-300 block">
                        Blended WAC / Pc
                      </span>
                      <p className="text-sm font-mono font-black text-sky-900 dark:text-sky-200 mt-1">
                        {curSym} {lookupMetrics.wacUnit.toLocaleString(curLocale, { minimumFractionDigits: curDecimals, maximumFractionDigits: curDecimals })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Recommended Selling Price Tiers (1-Click Apply to Simulator) */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Recommended Selling Tiers per Single Piece (Tap to Simulate)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      {
                        label: "Bulk Export (+8% Margin)",
                        price: lookupMetrics.tierBulk8,
                        profit:
                          lookupMetrics.tierBulk8 -
                          lookupMetrics.effectiveSalesUnitCost,
                      },
                      {
                        label: "B2B Wholesale (+15% Margin)",
                        price: lookupMetrics.tierWholesale15,
                        profit:
                          lookupMetrics.tierWholesale15 -
                          lookupMetrics.effectiveSalesUnitCost,
                      },
                      {
                        label: "Retail / POS (+25% Margin)",
                        price: lookupMetrics.tierRetail25,
                        profit:
                          lookupMetrics.tierRetail25 -
                          lookupMetrics.effectiveSalesUnitCost,
                      },
                    ].map((tier) => (
                      <button
                        key={tier.label}
                        type="button"
                        onClick={() => setQuoteUnitSellAed(tier.price.toFixed(2))}
                        className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-sky-500 bg-white dark:bg-slate-800/70 text-left transition cursor-pointer"
                      >
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                          {tier.label}
                        </span>
                        <p className="text-sm font-mono font-black text-slate-900 dark:text-white mt-0.5">
                          {curSym} {tier.price.toLocaleString(curLocale, { minimumFractionDigits: curDecimals, maximumFractionDigits: curDecimals })}
                        </p>
                        <span className="text-[10px] font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                          +{curSym} {tier.profit.toLocaleString(curLocale, { minimumFractionDigits: curDecimals, maximumFractionDigits: curDecimals })} / pc profit
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interactive Salesperson Deal & Margin Simulator */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Live Sales Quote &amp; Profit Simulator
                    </h4>
                    <span className="text-[11px] font-mono text-slate-500">
                      Catalog Price: {curSym}{" "}
                      {activeLookupItem.catalogSellingPriceAed.toLocaleString(curLocale, { minimumFractionDigits: curDecimals, maximumFractionDigits: curDecimals })}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Proposed Selling Price / 1 Piece ({curCode})
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={
                          quoteUnitSellAed !== ""
                            ? quoteUnitSellAed
                            : lookupMetrics.simulatedSellUnit.toFixed(curDecimals)
                        }
                        onChange={(e) => setQuoteUnitSellAed(e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-sm text-slate-900 dark:text-white outline-none focus:border-sky-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Order Quantity (Pcs)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={quoteDealQty}
                        onChange={(e) => setQuoteDealQty(e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-sm text-slate-900 dark:text-white outline-none focus:border-sky-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-700">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Net Profit / 1 Pc
                      </span>
                      <p
                        className={`text-sm font-mono font-black ${
                          lookupMetrics.unitProfit >= 0
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {lookupMetrics.unitProfit >= 0 ? "+" : ""}{curSym}{" "}
                        {lookupMetrics.unitProfit.toLocaleString(curLocale, { minimumFractionDigits: curDecimals, maximumFractionDigits: curDecimals })}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Gross Margin %
                      </span>
                      <p
                        className={`text-sm font-mono font-black ${
                          lookupMetrics.marginPercent >= 0
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {lookupMetrics.marginPercent.toFixed(1)}%
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Total Deal Value
                      </span>
                      <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                        {curSym}{" "}
                        {lookupMetrics.totalDealRevenue.toLocaleString(curLocale, {
                          maximumFractionDigits: 0,
                        })}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Total Deal Profit
                      </span>
                      <p
                        className={`text-sm font-mono font-black ${
                          lookupMetrics.totalDealProfit >= 0
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {curSym}{" "}
                        {lookupMetrics.totalDealProfit.toLocaleString(curLocale, {
                          maximumFractionDigits: 0,
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Admin Floor Buffer Setting */}
                {isAdmin && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <FiShield className="text-sky-600 dark:text-sky-400 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          Admin Sales Floor Protection Buffer (%)
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Set to 0% to show exact landed cost to salespeople, or add a safety buffer %.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="0.5"
                        value={salesFloorBufferPct}
                        onChange={(e) => {
                          const next = setSalesFloorBufferPercent(e.target.value);
                          setSalesFloorBufferPct(next);
                        }}
                        className="w-20 p-1.5 text-right font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                      <span className="font-bold text-slate-500">%</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-slate-400">
                Select a product on the left to inspect its single-piece landed cost.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 2: SHIPMENT LANDED COST CALCULATOR (BUILDER)                     */}
      {/* ===================================================================== */}
      {activeView === "calculator" && (
        <div className="space-y-5">
          {/* Top Grid: Shipment Header + Logistics & Package Cost Stack */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Shipment Meta & Currency (5 Cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5 text-xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <FiPackage className="text-sky-700 dark:text-sky-400" />
                  1. Shipment &amp; Currency
                </h3>
                {sheetForm.sheetNo && (
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300">
                    {sheetForm.sheetNo}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Shipment / Batch Title
                </label>
                <input
                  type="text"
                  value={sheetForm.title}
                  onChange={(e) =>
                    setSheetForm({ ...sheetForm, title: e.target.value })
                  }
                  placeholder="e.g. HMD 2,000 Pcs Shipment (40 Master Cartons)"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-semibold outline-none focus:border-sky-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Supplier / Factory
                  </label>
                  <input
                    type="text"
                    value={sheetForm.supplierName}
                    onChange={(e) =>
                      setSheetForm({ ...sheetForm, supplierName: e.target.value })
                    }
                    placeholder="e.g. HMD Global"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:border-sky-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    AWB / Container / Invoice Ref
                  </label>
                  <input
                    type="text"
                    value={sheetForm.shipmentRef}
                    onChange={(e) =>
                      setSheetForm({ ...sheetForm, shipmentRef: e.target.value })
                    }
                    placeholder="e.g. AWB-884920"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono rounded-xl outline-none focus:border-sky-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Purchase Currency
                  </label>
                  <select
                    value={sheetForm.currency}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-semibold outline-none focus:border-sky-600 cursor-pointer"
                  >
                    {CURRENCY_PRESETS.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Exchange Rate (1 {sheetForm.currency} → {curCode})
                  </label>
                  <input
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    value={sheetForm.fxRate}
                    onChange={(e) =>
                      setSheetForm({ ...sheetForm, fxRate: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold rounded-xl outline-none focus:border-sky-600"
                  />
                </div>
              </div>
            </div>

            {/* Package Logistics & Import Overhead Stack (7 Cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <FiTruck className="text-amber-600 dark:text-amber-400" />
                  2. Package Logistics &amp; Import Overhead ({curCode})
                </h3>

                {/* Freight Input Mode Toggle */}
                <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() =>
                      setSheetForm({ ...sheetForm, logisticsMode: "per_package" })
                    }
                    className={`px-2.5 py-1 rounded-lg cursor-pointer transition ${
                      sheetForm.logisticsMode === "per_package"
                        ? "bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs"
                        : "text-slate-500"
                    }`}
                  >
                    Per Package Rate
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSheetForm({ ...sheetForm, logisticsMode: "lump_sum" })
                    }
                    className={`px-2.5 py-1 rounded-lg cursor-pointer transition ${
                      sheetForm.logisticsMode === "lump_sum"
                        ? "bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs"
                        : "text-slate-500"
                    }`}
                  >
                    Lump-Sum Freight
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {sheetForm.logisticsMode === "per_package" ? (
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300 mb-1">
                      Freight Rate / Package ({curCode})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={sheetForm.ratePerPackageAed}
                      onChange={(e) =>
                        setSheetForm({
                          ...sheetForm,
                          ratePerPackageAed: e.target.value,
                        })
                      }
                      className="w-full p-2.5 bg-amber-50/50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-slate-900 dark:text-white font-mono font-bold rounded-xl outline-none focus:border-amber-500"
                    />
                    <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">
                      × {calculatedSheet.totalPackages} pkgs = {curSym}{" "}
                      {calculatedSheet.freightTotalAed.toLocaleString(curLocale)}
                    </span>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300 mb-1">
                      Total Shipment Freight ({curCode})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={sheetForm.lumpSumFreightAed}
                      onChange={(e) =>
                        setSheetForm({
                          ...sheetForm,
                          lumpSumFreightAed: e.target.value,
                        })
                      }
                      className="w-full p-2.5 bg-amber-50/50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-slate-900 dark:text-white font-mono font-bold rounded-xl outline-none focus:border-amber-500"
                    />
                    <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">
                      Avg {curSym}{" "}
                      {calculatedSheet.totalPackages > 0
                        ? (
                            calculatedSheet.freightTotalAed /
                            calculatedSheet.totalPackages
                          ).toFixed(1)
                        : 0}{" "}
                      / pkg
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Clearance, DO &amp; Port ({curCode})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={sheetForm.clearanceFeeAed}
                    onChange={(e) =>
                      setSheetForm({
                        ...sheetForm,
                        clearanceFeeAed: e.target.value,
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono rounded-xl outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Packing / Warehouse Handling ({curCode})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={sheetForm.otherLogisticsAed}
                    onChange={(e) =>
                      setSheetForm({
                        ...sheetForm,
                        otherLogisticsAed: e.target.value,
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono rounded-xl outline-none focus:border-sky-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Customs Duty (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={sheetForm.customsDutyPercent}
                    onChange={(e) =>
                      setSheetForm({
                        ...sheetForm,
                        customsDutyPercent: e.target.value,
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono rounded-xl outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Insurance &amp; Bank Wire ({curCode})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={sheetForm.insuranceAndBankAed}
                    onChange={(e) =>
                      setSheetForm({
                        ...sheetForm,
                        insuranceAndBankAed: e.target.value,
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono rounded-xl outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Logistics Allocation Basis
                  </label>
                  <select
                    value={sheetForm.allocationMethod}
                    onChange={(e) =>
                      setSheetForm({
                        ...sheetForm,
                        allocationMethod: e.target.value,
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold rounded-xl outline-none focus:border-sky-600 cursor-pointer"
                  >
                    {ALLOCATION_METHODS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Shipment Items & Per-Piece Landed Cost Breakdown Table */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <FiLayers className="text-sky-700 dark:text-sky-400 shrink-0" />
                  <span>3. Shipment Items &amp; Per-Piece Landed Cost Breakdown</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Enter quantity, units per package (or total packages), and buy price to see the exact single-piece landed cost.
                </p>
              </div>

              {/* Add from Stock or Custom Item — Full width single row on mobile */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72 min-w-0">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  <input
                    type="text"
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    placeholder="Add product by name / SKU..."
                    className="w-full h-10 pl-8 pr-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs outline-none focus:border-sky-600"
                  />
                  {matchingStockForBuilder.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto">
                      {matchingStockForBuilder.map((prod) => (
                        <button
                          key={prod.sku}
                          type="button"
                          onClick={() => handleAddProductToSheet(prod)}
                          className="w-full p-2.5 text-left hover:bg-sky-50 dark:hover:bg-slate-800 flex items-center justify-between gap-2 text-xs cursor-pointer"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              {prod.name}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400">
                              {prod.sku} • Stock: {prod.quantity}
                            </p>
                          </div>
                          <span className="font-mono text-[11px] font-bold text-sky-700 dark:text-sky-400 shrink-0">
                            + Add
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAddCustomRow}
                  className="inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <FiPlus />
                  <span>Custom Item</span>
                </button>
              </div>
            </div>

            {/* MOBILE ITEM CARDS (< md) — Zero horizontal scrolling */}
            <div className="md:hidden space-y-3">
              {calculatedSheet.items.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3 text-xs"
                >
                  {/* Card Header: Product Name, SKU, Quote Link & Remove */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) =>
                          handleUpdateItemField(item.id, "name", e.target.value)
                        }
                        className="w-full font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent focus:border-sky-500 outline-none text-sm"
                      />
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-mono text-slate-400">
                          {item.sku}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLookupSku(item.sku);
                            setActiveView("lookup");
                          }}
                          className="text-[11px] font-semibold text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                        >
                          Quote Lookup →
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(item.id)}
                      disabled={calculatedSheet.items.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded-lg cursor-pointer shrink-0"
                      title="Remove item"
                    >
                      <FiTrash2 className="text-sm" />
                    </button>
                  </div>

                  {/* 2x2 Editable Inputs Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Qty (Pcs)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateItemField(
                            item.id,
                            "quantity",
                            e.target.value
                          )
                        }
                        className="w-full py-2 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-sky-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Buy / Pc ({calculatedSheet.currency})
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitBuyPrice}
                        onChange={(e) =>
                          handleUpdateItemField(
                            item.id,
                            "unitBuyPrice",
                            e.target.value
                          )
                        }
                        className="w-full py-2 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-sky-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Pcs / Package
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="—"
                        value={item.pcsPerPackage || ""}
                        onChange={(e) =>
                          handleUpdateItemField(
                            item.id,
                            "pcsPerPackage",
                            e.target.value
                          )
                        }
                        className="w-full py-2 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-slate-700 dark:text-slate-300 outline-none focus:border-sky-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300 mb-1">
                        Total Packages
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.packages}
                        onChange={(e) =>
                          handleUpdateItemField(
                            item.id,
                            "packages",
                            e.target.value
                          )
                        }
                        className="w-full py-2 px-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 font-mono font-bold text-amber-800 dark:text-amber-300 outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Single-Piece Landed Result Strip */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Logistics / Pc
                      </span>
                      <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
                        +{curSym} {item.overheadPerUnitAed.toFixed(curDecimals)}
                      </span>
                    </div>

                    <div className="border-x border-slate-100 dark:border-slate-800 px-2">
                      <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 block">
                        Landed / 1 Pc
                      </span>
                      <span className="font-mono font-black text-emerald-800 dark:text-emerald-300 text-sm">
                        {curSym} {item.landedCostPerUnitAed.toFixed(curDecimals)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-sky-700 dark:text-sky-400 block">
                        Blended WAC
                      </span>
                      <span className="font-mono font-bold text-sky-800 dark:text-sky-300">
                        {curSym} {item.wacUnitCostAed.toFixed(curDecimals)}
                      </span>
                    </div>
                  </div>

                  {/* Target Margin & Suggested Selling Price */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-500">
                        Target Margin:
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="85"
                        value={item.targetMarginPercent}
                        onChange={(e) =>
                          handleUpdateItemField(
                            item.id,
                            "targetMarginPercent",
                            e.target.value
                          )
                        }
                        className="w-16 text-center py-1 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white"
                      />
                      <span className="text-slate-400 font-bold">%</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Suggested Sell
                      </span>
                      <span className="font-mono font-black text-slate-900 dark:text-white">
                        {curSym} {item.suggestedSellingPriceAed.toFixed(curDecimals)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP TABLE (md and up) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                    <th className="py-2.5 px-3 min-w-[180px]">Product / Model</th>
                    <th className="py-2.5 px-2.5 text-center whitespace-nowrap">
                      Qty (Pcs)
                    </th>
                    <th className="py-2.5 px-2.5 text-center whitespace-nowrap">
                      Pcs / Pkg
                    </th>
                    <th className="py-2.5 px-2.5 text-center whitespace-nowrap">
                      Packages
                    </th>
                    <th className="py-2.5 px-2.5 text-right whitespace-nowrap">
                      Buy / Pc ({calculatedSheet.currency})
                    </th>
                    <th className="py-2.5 px-2.5 text-right whitespace-nowrap">
                      Logistics / Pc
                    </th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap bg-emerald-50/60 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
                      Landed / 1 Pc
                    </th>
                    <th className="py-2.5 px-2.5 text-right whitespace-nowrap">
                      Blended WAC
                    </th>
                    <th className="py-2.5 px-2.5 text-center whitespace-nowrap">
                      Target Margin
                    </th>
                    <th className="py-2.5 px-2.5 text-right whitespace-nowrap">
                      Suggested Sell
                    </th>
                    <th className="py-2.5 px-2 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {calculatedSheet.items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            handleUpdateItemField(item.id, "name", e.target.value)
                          }
                          className="w-full font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent focus:border-sky-500 outline-none text-xs"
                        />
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-slate-400">
                            {item.sku}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLookupSku(item.sku);
                              setActiveView("lookup");
                            }}
                            className="text-[10px] font-semibold text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                          >
                            Quote Lookup →
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-2.5 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItemField(
                              item.id,
                              "quantity",
                              e.target.value
                            )
                          }
                          className="w-20 text-center py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-sky-600"
                        />
                      </td>

                      <td className="py-3 px-2.5 text-center">
                        <input
                          type="number"
                          min="0"
                          placeholder="—"
                          value={item.pcsPerPackage || ""}
                          onChange={(e) =>
                            handleUpdateItemField(
                              item.id,
                              "pcsPerPackage",
                              e.target.value
                            )
                          }
                          title="Pieces per master carton/package (auto-computes packages)"
                          className="w-16 text-center py-1.5 px-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-700 dark:text-slate-300 outline-none focus:border-sky-600"
                        />
                      </td>

                      <td className="py-3 px-2.5 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.packages}
                          onChange={(e) =>
                            handleUpdateItemField(
                              item.id,
                              "packages",
                              e.target.value
                            )
                          }
                          className="w-16 text-center py-1.5 px-1.5 rounded-lg bg-amber-50/70 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 font-mono font-bold text-amber-800 dark:text-amber-300 outline-none focus:border-amber-500"
                        />
                      </td>

                      <td className="py-3 px-2.5 text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitBuyPrice}
                          onChange={(e) =>
                            handleUpdateItemField(
                              item.id,
                              "unitBuyPrice",
                              e.target.value
                            )
                          }
                          className="w-24 text-right py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-sky-600"
                        />
                      </td>

                      <td className="py-3 px-2.5 text-right font-mono text-amber-700 dark:text-amber-300 whitespace-nowrap">
                        + {curSym} {item.overheadPerUnitAed.toFixed(curDecimals)}
                        <span className="block text-[10px] text-slate-400">
                          ({item.overheadPercent.toFixed(1)}%)
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-black text-sm text-emerald-800 dark:text-emerald-300 bg-emerald-50/40 dark:bg-emerald-500/10 whitespace-nowrap">
                        {curSym} {item.landedCostPerUnitAed.toFixed(curDecimals)}
                      </td>

                      <td className="py-3 px-2.5 text-right font-mono font-bold text-sky-800 dark:text-sky-300 whitespace-nowrap">
                        {curSym} {item.wacUnitCostAed.toFixed(curDecimals)}
                        {item.currentStockQty > 0 && (
                          <span className="block text-[10px] font-normal text-slate-400">
                            +{item.currentStockQty} old
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-2.5 text-center">
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="85"
                            value={item.targetMarginPercent}
                            onChange={(e) =>
                              handleUpdateItemField(
                                item.id,
                                "targetMarginPercent",
                                e.target.value
                              )
                            }
                            className="w-14 text-center py-1 px-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white"
                          />
                          <span className="text-slate-400">%</span>
                        </div>
                      </td>

                      <td className="py-3 px-2.5 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {curSym} {item.suggestedSellingPriceAed.toFixed(curDecimals)}
                      </td>

                      <td className="py-3 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(item.id)}
                          disabled={calculatedSheet.items.length <= 1}
                          className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded-lg cursor-pointer"
                          title="Remove row"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Footer: WAC vs Latest Rule + Save / Apply to Stock / Post to Purchase */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 min-w-0">
                  <span className="font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    Stock Cost Update Rule:
                  </span>
                  <select
                    value={costRule}
                    onChange={(e) => setCostRule(e.target.value)}
                    className="w-full sm:w-auto max-w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white outline-none cursor-pointer truncate"
                  >
                    <option value="wac">
                      Weighted Average (WAC) — Recommended
                    </option>
                    <option value="latest">
                      Overwrite with Latest Landed Cost
                    </option>
                  </select>
                </div>

                {isAdmin && (
                  <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={alsoUpdateSellingPrice}
                      onChange={(e) =>
                        setAlsoUpdateSellingPrice(e.target.checked)
                      }
                      className="rounded text-sky-600 cursor-pointer shrink-0"
                    />
                    <span>Also update catalog selling price to suggested margin</span>
                  </label>
                )}
              </div>

              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full lg:w-auto">
                <button
                  type="button"
                  onClick={handleSaveSheet}
                  disabled={Boolean(busyAction)}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold cursor-pointer transition"
                >
                  <FiSave className="shrink-0" />
                  <span>{busyAction === "save" ? "Saving..." : "Save Sheet"}</span>
                </button>

                {isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={handleApplyToStock}
                      disabled={Boolean(busyAction)}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer transition"
                    >
                      <FiCheckCircle className="shrink-0" />
                      <span>
                        {busyAction === "apply"
                          ? "Applying..."
                          : "Apply Cost to Stock"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePostToPurchase}
                      disabled={Boolean(busyAction)}
                      className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-bold shadow-xs cursor-pointer transition"
                    >
                      <FiArrowRight className="shrink-0" />
                      <span>
                        {busyAction === "po"
                          ? "Posting PO..."
                          : "Post Inward Purchase (PO)"}
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 3: SAVED SHIPMENT SHEETS HISTORY                                 */}
      {/* ===================================================================== */}
      {activeView === "history" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
          {enrichedSavedSheets.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              No saved landed cost sheets yet.
            </div>
          ) : (
            <>
              {/* MOBILE SAVED SHEET CARDS (< md) — Zero horizontal scrolling */}
              <div className="md:hidden p-3.5 space-y-3">
                {enrichedSavedSheets.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3 text-xs"
                  >
                    {/* Top Row: Sheet ID + Linked PO Badge + Actions */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sky-700 dark:text-sky-400 text-xs px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-500/15 border border-sky-200/70 dark:border-sky-500/25 whitespace-nowrap">
                          {s.sheetNo || s.id}
                        </span>
                        {s.linkedPurchaseNo && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                            {s.linkedPurchaseNo}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSheetForm({ ...s });
                            setActiveView("calculator");
                          }}
                          className="px-3 py-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 text-white text-xs font-bold cursor-pointer"
                        >
                          Load Sheet
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (
                                window.confirm(
                                  `Delete Landed Cost Sheet ${s.sheetNo || s.id}?`
                                )
                              ) {
                                await deleteLandedCostSheet(s.id);
                                if (onDataUpdated) onDataUpdated();
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl cursor-pointer"
                            title="Delete sheet"
                          >
                            <FiTrash2 className="text-sm" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Title & Supplier */}
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                        {s.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {s.supplierName}
                      </p>
                    </div>

                    {/* 2x2 Summary Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Units &amp; Packages
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {s.totalUnits.toLocaleString()} pcs{" "}
                          <span className="text-amber-700 dark:text-amber-300">
                            ({s.totalPackages} pkgs)
                          </span>
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 block">
                          Avg Landed / 1 Pc
                        </span>
                        <span className="font-mono font-black text-emerald-700 dark:text-emerald-300 text-sm">
                          {curSym} {s.avgLandedPerUnitAed.toFixed(curDecimals)}
                        </span>
                      </div>

                      <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          FOB Goods Value
                        </span>
                        <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {curSym}{" "}
                          {s.totalFobAed.toLocaleString(curLocale, {
                            maximumFractionDigits: 0,
                          })}
                        </span>
                      </div>

                      <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 text-right">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Logistics &amp; Fees
                        </span>
                        <span className="font-mono font-semibold text-amber-700 dark:text-amber-300">
                          +{curSym}{" "}
                          {s.totalOverheadAed.toLocaleString(curLocale, {
                            maximumFractionDigits: 0,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP TABLE (md and up) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                      <th className="py-3 px-4 min-w-[220px]">Sheet # &amp; Title</th>
                      <th className="py-3 px-4">Supplier</th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">
                        Units &amp; Packages
                      </th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">
                        FOB Value
                      </th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">
                        Logistics &amp; Fees
                      </th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">
                        Avg Landed / Pc
                      </th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {enrichedSavedSheets.map((s) => (
                      <tr
                        key={s.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sky-700 dark:text-sky-400 text-xs whitespace-nowrap">
                              {s.sheetNo || s.id}
                            </span>
                            {s.linkedPurchaseNo && (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                                {s.linkedPurchaseNo}
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm mt-0.5">
                            {s.title}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                          {s.supplierName}
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono text-xs whitespace-nowrap">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {s.totalUnits.toLocaleString()} pcs
                          </span>
                          <span className="block text-[11px] text-amber-700 dark:text-amber-300">
                            {s.totalPackages} packages
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {curSym}{" "}
                          {s.totalFobAed.toLocaleString(curLocale, {
                            minimumFractionDigits: curDecimals,
                            maximumFractionDigits: curDecimals,
                          })}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-xs text-amber-700 dark:text-amber-300 whitespace-nowrap">
                          + {curSym}{" "}
                          {s.totalOverheadAed.toLocaleString(curLocale, {
                            minimumFractionDigits: curDecimals,
                            maximumFractionDigits: curDecimals,
                          })}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                          {curSym} {s.avgLandedPerUnitAed.toFixed(curDecimals)}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSheetForm({ ...s });
                                setActiveView("calculator");
                              }}
                              className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-500/15 hover:bg-sky-100 text-sky-700 dark:text-sky-300 text-xs font-bold cursor-pointer"
                            >
                              Load Sheet
                            </button>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={async () => {
                                  if (
                                    window.confirm(
                                      `Delete Landed Cost Sheet ${s.sheetNo || s.id}?`
                                    )
                                  ) {
                                    await deleteLandedCostSheet(s.id);
                                    if (onDataUpdated) onDataUpdated();
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl cursor-pointer"
                                title="Delete sheet"
                              >
                                <FiTrash2 />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default LandedCostCalculator;

