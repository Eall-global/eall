import { useState, useMemo, useRef } from "react";
import {
  FiPlus,
  FiSearch,
  FiTruck,
  FiPackage,
  FiCalendar,
  FiDollarSign,
  FiTrash2,
  FiEye,
  FiEdit2,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiFileText,
  FiLayers,
  FiUpload,
  FiDownload,
  FiClipboard,
  FiPlusCircle,
} from "react-icons/fi";
import {
  createPurchaseRecord,
  updatePurchaseRecord,
  deletePurchaseRecord,
} from "../../services/purchaseService";
import {
  parsePurchaseFile,
  parsePastedPurchaseText,
  downloadPurchaseImportTemplate,
  findBestImageMatch,
  generateCleanSku,
  inferBrandFromName,
  inferCategoryFromName,
} from "../../utils/purchaseFileParser";
import { usePortalCurrency } from "../../context/PortalCurrencyContext";
import { AedSymbol, AedPrice } from "../common/AedSymbol";
import PortalKpiGrid from "./PortalKpiGrid";
import { PortalFilterMenu, ActiveFilterChips } from "./PortalFilterMenu";

const UNLISTED_CATEGORIES = [
  "Mobile Devices",
  "Audio & Accessories",
  "Tablets",
  "Wearables",
  "Laptops & Computing",
  "Accessories",
  "Electronics",
];

const PurchaseManagement = ({
  stock = [],
  purchases = [],
  onPurchasesUpdated,
  currentUser,
  isAdmin,
}) => {
  const portalCur = usePortalCurrency();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("All");

  // Create / Edit Purchase Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingPurchaseNo, setEditingPurchaseNo] = useState(null);
  const [entryMode, setEntryMode] = useState("catalog"); // "catalog" | "unlisted" | "import"

  const [supplierName, setSupplierName] = useState("");
  const [supplierInvoiceRef, setSupplierInvoiceRef] = useState("");
  const [sourceFileName, setSourceFileName] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [notes, setNotes] = useState("");

  // Active Line Items (all rows inline-editable for Qty & Unit Cost)
  const [lineItems, setLineItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successBanner, setSuccessBanner] = useState("");

  // Mode 1: Searchable Catalog Picker
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogDropdownOpen, setCatalogDropdownOpen] = useState(false);
  const [selectedSku, setSelectedSku] = useState("");
  const [addQty, setAddQty] = useState(1);
  const [addUnitCost, setAddUnitCost] = useState("");
  const [addSellingPrice, setAddSellingPrice] = useState("");

  // Mode 2: Unlisted / New SKU Builder
  const [customName, setCustomName] = useState("");
  const [customSku, setCustomSku] = useState("");
  const [customBrand, setCustomBrand] = useState("");
  const [customCategory, setCustomCategory] = useState("Mobile Devices");
  const [customQty, setCustomQty] = useState(1);
  const [customUnitCost, setCustomUnitCost] = useState("");
  const [customSellingPrice, setCustomSellingPrice] = useState("");

  // Mode 3: Excel / CSV / PDF Invoice Import State
  const fileInputRef = useRef(null);
  const [importBusy, setImportBusy] = useState(false);
  const [importError, setImportError] = useState("");
  const [importWarning, setImportWarning] = useState("");
  const [importFileLabel, setImportFileLabel] = useState("");
  const [importMeta, setImportMeta] = useState(null);
  const [importPreviewRows, setImportPreviewRows] = useState([]);
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  // View Receipt Modal State
  const [viewingPurchase, setViewingPurchase] = useState(null);

  // Filtered Purchases list
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesPo = (p.purchaseNo || "").toLowerCase().includes(q);
        const matchesSupplier = (p.supplierName || "").toLowerCase().includes(q);
        const matchesRef = (p.supplierInvoiceRef || "").toLowerCase().includes(q);
        const matchesItem = (p.items || []).some(
          (i) =>
            (i.name || "").toLowerCase().includes(q) ||
            (i.sku || "").toLowerCase().includes(q)
        );
        if (!matchesPo && !matchesSupplier && !matchesRef && !matchesItem)
          return false;
      }

      if (statusFilter !== "All" && p.paymentStatus !== statusFilter) {
        return false;
      }

      if (
        paymentMethodFilter !== "All" &&
        (p.paymentMethod || "") !== paymentMethodFilter
      ) {
        return false;
      }

      return true;
    });
  }, [purchases, search, statusFilter, paymentMethodFilter]);

  const purchaseFilterSections = useMemo(() => {
    const methods = Array.from(
      new Set(purchases.map((p) => p.paymentMethod).filter(Boolean))
    );
    const defaultMethods = [
      "Bank Transfer",
      "Cash",
      "Cheque",
      "Credit Card",
      "Supplier Credit",
    ];
    const allMethods = Array.from(new Set([...defaultMethods, ...methods]));

    return [
      {
        id: "status",
        label: "Status",
        value: statusFilter,
        defaultValue: "All",
        onChange: setStatusFilter,
        options: [
          { value: "All", label: "All Statuses", count: purchases.length },
          {
            value: "Paid",
            label: "Paid",
            count: purchases.filter((p) => p.paymentStatus === "Paid").length,
          },
          {
            value: "Pending",
            label: "Pending",
            count: purchases.filter((p) => p.paymentStatus === "Pending").length,
          },
          {
            value: "Partial",
            label: "Partial",
            count: purchases.filter((p) => p.paymentStatus === "Partial").length,
          },
        ],
      },
      {
        id: "method",
        label: "Payment",
        value: paymentMethodFilter,
        defaultValue: "All",
        onChange: setPaymentMethodFilter,
        options: [
          { value: "All", label: "All Methods", count: purchases.length },
          ...allMethods.map((m) => ({
            value: m,
            label: m,
            count: purchases.filter((p) => p.paymentMethod === m).length,
          })),
        ],
      },
    ];
  }, [purchases, statusFilter, paymentMethodFilter]);

  const handleResetPurchaseFilters = () => {
    setStatusFilter("All");
    setPaymentMethodFilter("All");
  };

  // Executive Metric Calculations
  const metrics = useMemo(() => {
    const totalPurchasesValue = purchases.reduce(
      (sum, p) => sum + (Number(p.totalAmount) || 0),
      0
    );
    const totalUnitsInward = purchases.reduce(
      (sum, p) => sum + (Number(p.totalQuantity) || 0),
      0
    );
    const totalOrders = purchases.length;
    const uniqueSuppliers = new Set(
      purchases.map((p) => (p.supplierName || "").trim()).filter(Boolean)
    ).size;

    return {
      totalPurchasesValue,
      totalUnitsInward,
      totalOrders,
      uniqueSuppliers,
    };
  }, [purchases]);

  // Fast searchable catalog matches inside modal
  const catalogMatches = useMemo(() => {
    const q = catalogQuery.trim().toLowerCase();
    const list = !q
      ? stock.slice(0, 12)
      : stock
          .filter(
            (s) =>
              (s.name || "").toLowerCase().includes(q) ||
              (s.sku || "").toLowerCase().includes(q) ||
              (s.brand || "").toLowerCase().includes(q)
          )
          .slice(0, 14);
    return list;
  }, [stock, catalogQuery]);

  // Reset & Open Modal helpers
  const resetModalForm = () => {
    setEditingPurchaseNo(null);
    setSupplierName("");
    setSupplierInvoiceRef("");
    setSourceFileName("");
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setPaymentStatus("Paid");
    setPaymentMethod("Bank Transfer");
    setNotes("");
    setLineItems([]);
    setErrorMessage("");
    setCatalogQuery("");
    setCatalogDropdownOpen(false);
    setSelectedSku("");
    setAddQty(1);
    setAddUnitCost("");
    setAddSellingPrice("");
    setCustomName("");
    setCustomSku("");
    setCustomBrand("");
    setCustomCategory("Mobile Devices");
    setCustomQty(1);
    setCustomUnitCost("");
    setCustomSellingPrice("");
    setImportError("");
    setImportWarning("");
    setImportFileLabel("");
    setImportMeta(null);
    setImportPreviewRows([]);
    setPasteText("");
    setShowPasteBox(false);
  };

  const handleOpenCreateModal = (initialMode = "catalog") => {
    resetModalForm();
    setEntryMode(initialMode);
    setShowModal(true);
  };

  const handleOpenEditPurchase = (po) => {
    resetModalForm();
    setViewingPurchase(null);
    setEditingPurchaseNo(po.purchaseNo);
    setSupplierName(po.supplierName || "");
    setSupplierInvoiceRef(po.supplierInvoiceRef || "");
    setSourceFileName(po.sourceFile || "");
    setPurchaseDate(
      po.purchaseDate || po.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10)
    );
    setPaymentStatus(po.paymentStatus || "Paid");
    setPaymentMethod(po.paymentMethod || "Bank Transfer");
    setNotes(po.notes || "");
    setLineItems(
      (po.items || []).map((item) => {
        const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
        const cost = Math.max(0, Number(item.unitCost) || 0);
        const stockMatch = stock.find(
          (s) => String(s.sku || "").toUpperCase() === String(item.sku || "").toUpperCase()
        );
        return {
          sku: item.sku,
          name: item.name,
          brand: item.brand || "General",
          category: item.category || "Mobile Devices",
          image:
            item.image && item.image !== "/logo.png"
              ? item.image
              : stockMatch?.image || "/logo.png",
          quantity: qty,
          unitCost: cost,
          sellingPrice: Number(item.sellingPrice) || Number(stockMatch?.price) || 0,
          totalCost: Number((qty * cost).toFixed(2)),
          isUnlisted: Boolean(item.isUnlisted),
        };
      })
    );
    setEntryMode("catalog");
    setShowModal(true);
  };

  // Mode 1: Catalog Selection & Add
  const handlePickCatalogProduct = (prod) => {
    setSelectedSku(prod.sku);
    setCatalogQuery(`${prod.name} (${prod.sku})`);
    setAddUnitCost(prod.costPrice || "");
    setAddSellingPrice(prod.price || "");
    setCatalogDropdownOpen(false);
  };

  const mergeItemsIntoLineItems = (incomingItems = []) => {
    setLineItems((prev) => {
      const next = [...prev];
      for (const inc of incomingItems) {
        const cleanSku = String(inc.sku || "").trim().toUpperCase();
        if (!cleanSku) continue;
        const qty = Math.max(1, parseInt(inc.quantity, 10) || 1);
        const unitCost = Math.max(0, Number(inc.unitCost) || 0);
        const sellingPrice = Math.max(0, Number(inc.sellingPrice) || 0);
        const existingIdx = next.findIndex((x) => x.sku === cleanSku);

        if (existingIdx >= 0) {
          const updatedQty = next[existingIdx].quantity + qty;
          const nextCost = unitCost > 0 ? unitCost : next[existingIdx].unitCost;
          const nextSelling =
            sellingPrice > 0 ? sellingPrice : next[existingIdx].sellingPrice || 0;
          const nextImage =
            inc.image && inc.image !== "/logo.png"
              ? inc.image
              : next[existingIdx].image || "/logo.png";
          next[existingIdx] = {
            ...next[existingIdx],
            image: nextImage,
            quantity: updatedQty,
            unitCost: nextCost,
            sellingPrice: nextSelling,
            totalCost: Number((updatedQty * nextCost).toFixed(2)),
          };
        } else {
          next.push({
            sku: cleanSku,
            name: String(inc.name || cleanSku).trim(),
            brand: inc.brand || "General",
            category: inc.category || "Mobile Devices",
            image: inc.image || "/logo.png",
            imageMatched: Boolean(inc.imageMatched),
            quantity: qty,
            unitCost,
            sellingPrice,
            totalCost: Number((qty * unitCost).toFixed(2)),
            isUnlisted: Boolean(inc.isUnlisted),
          });
        }
      }
      return next;
    });
  };

  const handleAddCatalogLineItem = () => {
    if (!selectedSku) return;
    const found = stock.find((s) => s.sku === selectedSku);
    if (!found) return;

    const qty = Math.max(1, parseInt(addQty, 10) || 1);
    const unitCost = Math.max(0, parseFloat(addUnitCost) || 0);
    const sellingPrice = Math.max(0, parseFloat(addSellingPrice) || 0);

    mergeItemsIntoLineItems([
      {
        sku: found.sku,
        name: found.name,
        brand: found.brand,
        category: found.category,
        image: found.image,
        quantity: qty,
        unitCost,
        sellingPrice,
        isUnlisted: false,
      },
    ]);

    setSelectedSku("");
    setCatalogQuery("");
    setAddQty(1);
    setAddUnitCost("");
    setAddSellingPrice("");
  };

  // Mode 2: Add Unlisted / New SKU
  const handleAddUnlistedItem = () => {
    const trimmedName = customName.trim();
    if (!trimmedName) {
      setErrorMessage("Please enter a product name for the unlisted item.");
      return;
    }

    const inferredBrand = customBrand.trim() || inferBrandFromName(trimmedName);
    const finalSku = (
      customSku.trim() || generateCleanSku(trimmedName, inferredBrand, lineItems.length + 1)
    ).toUpperCase();
    const qty = Math.max(1, parseInt(customQty, 10) || 1);
    const unitCost = Math.max(0, parseFloat(customUnitCost) || 0);
    const sellingPrice = Math.max(0, parseFloat(customSellingPrice) || 0);

    const exactMatch = stock.find((s) => s.sku.toUpperCase() === finalSku);
    const resolvedImage =
      exactMatch?.image ||
      findBestImageMatch(finalSku, trimmedName, inferredBrand, stock);

    setErrorMessage("");
    mergeItemsIntoLineItems([
      {
        sku: finalSku,
        name: trimmedName,
        brand: inferredBrand,
        category: customCategory || inferCategoryFromName(trimmedName),
        image: resolvedImage,
        imageMatched: !exactMatch && resolvedImage !== "/logo.png",
        quantity: qty,
        unitCost,
        sellingPrice,
        isUnlisted: !exactMatch,
      },
    ]);

    setCustomName("");
    setCustomSku("");
    setCustomBrand("");
    setCustomQty(1);
    setCustomUnitCost("");
    setCustomSellingPrice("");
  };

  // Inline Editing of ANY Line Item (Qty, Unit Cost, Selling Price, Name, SKU)
  const handleUpdateLineItem = (idx, field, rawValue) => {
    setLineItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        if (field === "quantity") {
          const qty = Math.max(1, parseInt(rawValue, 10) || 1);
          return {
            ...item,
            quantity: qty,
            totalCost: Number((qty * item.unitCost).toFixed(2)),
          };
        }
        if (field === "unitCost") {
          const cost = Math.max(0, parseFloat(rawValue) || 0);
          return {
            ...item,
            unitCost: cost,
            totalCost: Number((item.quantity * cost).toFixed(2)),
          };
        }
        if (field === "sellingPrice") {
          const sell = Math.max(0, parseFloat(rawValue) || 0);
          return { ...item, sellingPrice: sell };
        }
        if (field === "sku") {
          return { ...item, sku: String(rawValue || "").toUpperCase() };
        }
        if (field === "name") {
          return { ...item, name: rawValue };
        }
        return item;
      })
    );
  };

  const handleRemoveLineItem = (index) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Mode 3: Excel / CSV / PDF Upload & Smart Paste Handlers
  const handleProcessFile = async (file) => {
    if (!file) return;
    setImportBusy(true);
    setImportError("");
    setImportWarning("");
    setImportPreviewRows([]);
    setImportMeta(null);

    try {
      const result = await parsePurchaseFile(file, stock);
      setImportFileLabel(`${result.fileName} (${result.fileType})`);
      setSourceFileName(result.fileName);
      setImportPreviewRows(result.items || []);
      setImportMeta(result.metadata || null);

      if (result.warning) {
        setImportWarning(result.warning);
      } else if ((result.items || []).length === 0) {
        setImportWarning(
          "No line items detected. Ensure your sheet has Product/SKU, Quantity, and Unit Cost columns, or use the Excel Template."
        );
      }
    } catch (err) {
      setImportError(err.message || "Could not parse uploaded file.");
    } finally {
      setImportBusy(false);
    }
  };

  const handleParsePaste = () => {
    setImportError("");
    setImportWarning("");
    const result = parsePastedPurchaseText(pasteText, stock);
    setImportFileLabel("Pasted Table Data");
    setImportPreviewRows(result.items || []);
    setImportMeta(result.metadata || null);
    if ((result.items || []).length === 0) {
      setImportWarning(
        "Could not detect rows from pasted text. Format as: Product Name [Tab/Comma] Qty [Tab/Comma] Unit Cost."
      );
    }
  };

  const handleUpdatePreviewRow = (rowId, field, value) => {
    setImportPreviewRows((prev) =>
      prev.map((row) => {
        if (row.rowId !== rowId) return row;
        if (field === "selected") return { ...row, selected: Boolean(value) };
        if (field === "quantity") {
          const q = Math.max(1, parseInt(value, 10) || 1);
          return { ...row, quantity: q, totalCost: Number((q * row.unitCost).toFixed(2)) };
        }
        if (field === "unitCost") {
          const c = Math.max(0, parseFloat(value) || 0);
          return { ...row, unitCost: c, totalCost: Number((row.quantity * c).toFixed(2)) };
        }
        if (field === "sellingPrice") {
          const sp = Math.max(0, parseFloat(value) || 0);
          return { ...row, sellingPrice: sp };
        }
        if (field === "sku") {
          return { ...row, sku: String(value || "").toUpperCase() };
        }
        return { ...row, [field]: value };
      })
    );
  };

  const handleApplyDetectedMetadata = () => {
    if (!importMeta) return;
    if (importMeta.supplierName && !supplierName.trim()) {
      setSupplierName(importMeta.supplierName);
    }
    if (importMeta.supplierInvoiceRef && !supplierInvoiceRef.trim()) {
      setSupplierInvoiceRef(importMeta.supplierInvoiceRef);
    }
    if (importMeta.purchaseDate) {
      setPurchaseDate(importMeta.purchaseDate);
    }
  };

  const handleConfirmImportRows = () => {
    const selected = importPreviewRows.filter((r) => r.selected);
    if (selected.length === 0) return;

    // Auto-fill supplier ref / date if empty and detected
    handleApplyDetectedMetadata();
    mergeItemsIntoLineItems(selected);
    setImportPreviewRows([]);
    setPasteText("");
    setShowPasteBox(false);
    setEntryMode("catalog");
  };

  const modalTotalAmount = useMemo(
    () => lineItems.reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0),
    [lineItems]
  );

  const modalTotalUnits = useMemo(
    () => lineItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    [lineItems]
  );

  const modalNewSkuCount = useMemo(
    () => lineItems.filter((item) => item.isUnlisted).length,
    [lineItems]
  );

  // Submit Create or Edit Purchase Order
  const handleSavePurchase = async (e) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      setErrorMessage("Please enter a valid supplier name.");
      return;
    }
    if (lineItems.length === 0) {
      setErrorMessage("Please add at least one product item to this purchase.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      if (editingPurchaseNo) {
        await updatePurchaseRecord(editingPurchaseNo, {
          supplierName,
          supplierInvoiceRef,
          sourceFile: sourceFileName,
          purchaseDate,
          paymentStatus,
          paymentMethod,
          items: lineItems,
          notes,
          updatedBy: currentUser?.name || "Admin",
        });
        setSuccessBanner(
          `Updated ${editingPurchaseNo} and reconciled inventory deltas.`
        );
      } else {
        const created = await createPurchaseRecord({
          supplierName,
          supplierInvoiceRef,
          sourceFile: sourceFileName,
          purchaseDate,
          paymentStatus,
          paymentMethod,
          items: lineItems,
          notes,
          createdBy: currentUser?.name || "Admin",
          locationCode: portalCur.countryCode,
          currency: portalCur.currency,
          currencySymbol: portalCur.symbol,
        });
        setSuccessBanner(
          `Recorded ${created.purchaseNo} (+${created.totalQuantity.toLocaleString()} units added to ${portalCur.hubName}${modalNewSkuCount > 0 ? `, including ${modalNewSkuCount} new SKU(s)` : ""}).`
        );
      }

      setShowModal(false);
      resetModalForm();
      window.setTimeout(() => setSuccessBanner(""), 5000);
      if (onPurchasesUpdated) onPurchasesUpdated();
    } catch (err) {
      setErrorMessage(err.message || "Failed to save purchase record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Void/Delete Purchase Record
  const handleDeletePurchase = async (purchaseNo) => {
    if (
      !window.confirm(
        `Are you sure you want to void purchase ${purchaseNo}? This will automatically reverse (deduct) the inward stock quantities from inventory!`
      )
    ) {
      return;
    }

    try {
      await deletePurchaseRecord(purchaseNo, true);
      if (onPurchasesUpdated) onPurchasesUpdated();
    } catch (err) {
      alert(`Error voiding purchase: ${err.message}`);
    }
  };

  const selectedImportCount = importPreviewRows.filter((r) => r.selected).length;
  const matchedImportCount = importPreviewRows.filter((r) => !r.isUnlisted).length;
  const unlistedImportCount = importPreviewRows.filter((r) => r.isUnlisted).length;
  const imageMatchedImportCount = importPreviewRows.filter((r) => r.imageMatched).length;

  return (
    <div className="space-y-4 sm:space-y-5 text-left font-sans">
      {/* SUCCESS NOTICE */}
      {successBanner && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <FiCheckCircle className="text-base shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{successBanner}</span>
          </span>
          <button
            type="button"
            onClick={() => setSuccessBanner("")}
            className="p-1 text-emerald-600 hover:text-emerald-900 cursor-pointer"
          >
            <FiX />
          </button>
        </div>
      )}

      {/* SUMMARY METRICS CARDS */}
      <PortalKpiGrid
        items={[
          {
            id: "spend",
            label: "Procurement Spend",
            value: <AedPrice amount={metrics.totalPurchasesValue} />,
            icon: FiDollarSign,
            tone: "emerald",
            valueClassName: "text-slate-900 dark:text-white",
          },
          {
            id: "inward",
            label: "Inward Units",
            value: `+${metrics.totalUnitsInward.toLocaleString()}`,
            icon: FiPackage,
            tone: "sky",
          },
          {
            id: "orders",
            label: "Purchase Orders",
            value: metrics.totalOrders,
            icon: FiFileText,
            tone: "indigo",
            valueClassName: "text-slate-900 dark:text-white",
          },
          {
            id: "suppliers",
            label: "Active Suppliers",
            value: metrics.uniqueSuppliers,
            icon: FiTruck,
            tone: "amber",
            valueClassName: "text-slate-900 dark:text-white",
          },
        ]}
      />

      {/* CONTROLS & ACTION BAR */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative flex-1 min-w-0">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm" />
              <input
                type="text"
                placeholder="Search by PO#, Supplier, or Product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-3.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 dark:focus:border-sky-500 outline-none transition"
              />
            </div>

            <PortalFilterMenu
              sections={purchaseFilterSections}
              onResetAll={handleResetPurchaseFilters}
              resultCount={filteredPurchases.length}
              resultLabel="purchases"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenCreateModal("import")}
              className="inline-flex items-center justify-center gap-1.5 h-10 px-3.5 bg-sky-50 dark:bg-sky-500/15 hover:bg-sky-100 dark:hover:bg-sky-500/25 border border-sky-200 dark:border-sky-500/30 text-sky-800 dark:text-sky-300 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap"
            >
              <FiUpload className="text-sm" />
              <span>Import Excel / Invoice</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenCreateModal("catalog")}
              className="inline-flex items-center justify-center gap-1.5 h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer whitespace-nowrap"
            >
              <FiPlus className="text-base" />
              <span>Record Purchase</span>
            </button>
          </div>
        </div>

        <ActiveFilterChips
          sections={purchaseFilterSections}
          onResetAll={handleResetPurchaseFilters}
        />
      </div>

      {/* PURCHASES TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-800/70 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">PO # &amp; Date</th>
                <th className="py-3.5 px-4">Supplier &amp; Ref</th>
                <th className="py-3.5 px-4">Items Procured</th>
                <th className="py-3.5 px-4 text-center">Inward Qty</th>
                <th className="py-3.5 px-4 text-right">
                  Total Cost (<AedSymbol />)
                </th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium text-slate-700 dark:text-slate-300">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-slate-400 dark:text-slate-500"
                  >
                    <FiTruck className="text-3xl mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-semibold">
                      No purchase records found.
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Click &quot;Record Purchase&quot; or &quot;Import Excel / Invoice&quot; to inward stock.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((po) => {
                  const itemsCount = (po.items || []).length;
                  const firstItem = po.items?.[0];
                  const formattedDate = new Date(
                    po.purchaseDate || po.createdAt
                  ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <tr
                      key={po.purchaseNo}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            #{po.purchaseNo}
                          </span>
                          {po.updatedAt && (
                            <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/25 font-bold">
                              Edited
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                          <FiCalendar className="text-[10px]" />
                          {formattedDate}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block truncate max-w-[180px]">
                          {po.supplierName}
                        </span>
                        {po.supplierInvoiceRef && (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono block">
                            Ref: {po.supplierInvoiceRef}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {firstItem ? (
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[220px]">
                              {firstItem.name}
                            </span>
                            {itemsCount > 1 && (
                              <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold">
                                + {itemsCount - 1} more items
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No items</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/25">
                          +{Number(po.totalQuantity || 0).toLocaleString()} units
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 dark:text-white whitespace-nowrap">
                        <AedPrice
                          amount={po.totalAmount}
                          symbol={po.currencySymbol || undefined}
                        />
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            po.paymentStatus === "Paid"
                              ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/25"
                              : po.paymentStatus === "Partial"
                              ? "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/25"
                              : "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/25"
                          }`}
                        >
                          {po.paymentStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingPurchase(po)}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-500/15 rounded-lg transition cursor-pointer"
                            title="View Purchase Details / Receipt"
                          >
                            <FiEye className="text-sm" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditPurchase(po)}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/15 rounded-lg transition cursor-pointer"
                            title="Edit Purchase Quantities, Costs & Items"
                          >
                            <FiEdit2 className="text-sm" />
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeletePurchase(po.purchaseNo)}
                              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 rounded-lg transition cursor-pointer"
                              title="Void Purchase & Reverse Stock"
                            >
                              <FiTrash2 className="text-sm" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================================================================= */}
      {/* CREATE / EDIT PURCHASE MODAL (Catalog + Unlisted + Excel/Invoice) */}
      {/* ================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 w-full max-w-4xl shadow-2xl my-4 text-left border border-slate-200/80 dark:border-slate-800 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0 gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {editingPurchaseNo
                    ? `Edit Purchase Order #${editingPurchaseNo}`
                    : "Record Goods Purchase (Inward Stock)"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {editingPurchaseNo
                    ? "Edit quantities, costs, or add items — inventory deltas will reconcile automatically."
                    : `Inwarding into ${portalCur.hubName} (${portalCur.currency}). New unlisted SKUs are created automatically in Stock Manager.`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={handleSavePurchase}
              className="flex-1 overflow-y-auto py-4 space-y-4 pr-0.5"
            >
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 border border-rose-200 dark:border-rose-500/25">
                  <FiAlertCircle className="text-base shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Supplier Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Supplier / Vendor Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Redington Gulf, Sharaf Wholesale"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Supplier Invoice / Bill Ref
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SUP-INV-99014"
                    value={supplierInvoiceRef}
                    onChange={(e) => setSupplierInvoiceRef(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 font-mono"
                  />
                </div>
              </div>

              {/* Date & Payment Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Purchase Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 font-semibold cursor-pointer"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Supplier Credit">Supplier Credit (Pay Later)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Payment Status
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 font-semibold cursor-pointer"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Partial">Partial</option>
                  </select>
                </div>
              </div>

              {/* ============================================================= */}
              {/* INWARD PRODUCTS BUILDER (3 Modes + Inline Editable Table)     */}
              {/* ============================================================= */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                {/* Header + 3-Way Entry Mode Tabs */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <FiLayers className="text-sky-600 dark:text-sky-400" />
                    <span>Inward Products</span>
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10.5px] font-bold text-slate-600 dark:text-slate-300 normal-case tracking-normal">
                      {lineItems.length} added
                    </span>
                  </h4>

                  <div className="inline-flex rounded-xl bg-white dark:bg-slate-900 p-0.5 border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setEntryMode("catalog")}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                        entryMode === "catalog"
                          ? "bg-slate-900 dark:bg-sky-600 text-white shadow-2xs"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      From Catalog
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntryMode("unlisted")}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                        entryMode === "unlisted"
                          ? "bg-amber-600 text-white shadow-2xs"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      + Unlisted SKU
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntryMode("import")}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition cursor-pointer ${
                        entryMode === "import"
                          ? "bg-sky-700 text-white shadow-2xs"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <FiUpload className="text-[11px]" />
                      <span>Excel / Invoice</span>
                    </button>
                  </div>
                </div>

                {/* MODE 1: SEARCHABLE CATALOG PICKER */}
                {entryMode === "catalog" && (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="sm:col-span-4 relative">
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                        Search &amp; Select Catalog Product *
                      </label>
                      <div className="relative">
                        <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                        <input
                          type="text"
                          value={catalogQuery}
                          onFocus={() => setCatalogDropdownOpen(true)}
                          onChange={(e) => {
                            setCatalogQuery(e.target.value);
                            setSelectedSku("");
                            setCatalogDropdownOpen(true);
                          }}
                          placeholder="Type name, SKU, or brand (e.g. HMD 100, iPhone)..."
                          className="w-full py-1.5 pl-7 pr-7 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 font-medium"
                        />
                        {catalogQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setCatalogQuery("");
                              setSelectedSku("");
                              setAddUnitCost("");
                              setAddSellingPrice("");
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            <FiX className="text-xs" />
                          </button>
                        )}
                      </div>

                      {catalogDropdownOpen && (
                        <div className="absolute z-30 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl divide-y divide-slate-100 dark:divide-slate-800">
                          {catalogMatches.length > 0 ? (
                            catalogMatches.map((prod) => (
                              <button
                                key={prod.sku}
                                type="button"
                                onClick={() => handlePickCatalogProduct(prod)}
                                className="w-full px-3 py-2 text-left hover:bg-sky-50 dark:hover:bg-slate-800 flex items-center justify-between gap-2 text-xs cursor-pointer"
                              >
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900 dark:text-white truncate">
                                    {prod.name}
                                  </p>
                                  <p className="text-[10px] font-mono text-slate-400">
                                    {prod.sku} • {prod.brand} • Stock: {prod.quantity}
                                  </p>
                                </div>
                                <span className="text-[11px] font-mono font-bold text-sky-700 dark:text-sky-400 shrink-0">
                                  <AedPrice amount={prod.costPrice || 0} />
                                </span>
                              </button>
                            ))
                          ) : (
                            <div className="p-3 text-center space-y-2">
                              <p className="text-[11px] text-slate-500">
                                No catalog SKU found for &quot;{catalogQuery}&quot;.
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  const q = catalogQuery.trim();
                                  setCustomName(q);
                                  setCustomBrand(inferBrandFromName(q));
                                  setCustomCategory(inferCategoryFromName(q));
                                  setCustomSku(
                                    generateCleanSku(q, inferBrandFromName(q))
                                  );
                                  setCatalogDropdownOpen(false);
                                  setEntryMode("unlisted");
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold cursor-pointer"
                              >
                                <FiPlus /> Add &quot;{catalogQuery.trim()}&quot; as Unlisted Product
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                        Inward Qty *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={addQty}
                        onChange={(e) => setAddQty(e.target.value)}
                        className="w-full py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-mono font-bold text-center"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                        Unit Cost (<AedSymbol />)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={addUnitCost}
                        onChange={(e) => setAddUnitCost(e.target.value)}
                        className="w-full py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-mono text-right"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                        Sell Price (<AedSymbol />)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Keep"
                        value={addSellingPrice}
                        onChange={(e) => setAddSellingPrice(e.target.value)}
                        className="w-full py-1.5 px-2 bg-sky-50/60 dark:bg-sky-500/10 border border-sky-200/80 dark:border-sky-500/30 text-sky-900 dark:text-sky-200 rounded-lg text-xs font-mono text-right"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={handleAddCatalogLineItem}
                        disabled={!selectedSku}
                        className="w-full py-1.5 px-3 bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                )}

                {/* MODE 2: ADD UNLISTED / NEW SKU DIRECTLY */}
                {entryMode === "unlisted" && (
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-200 dark:border-amber-500/30 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <FiPlusCircle /> Add Unlisted Product (Auto-registers in Stock Manager)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-5">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Product Name *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Anker 65W GaN Fast Charger"
                          value={customName}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomName(val);
                            if (!customBrand) setCustomBrand(inferBrandFromName(val));
                          }}
                          className="w-full py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-semibold outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          SKU Code (Auto if blank)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. ANKER-65W"
                          value={customSku}
                          onChange={(e) => setCustomSku(e.target.value.toUpperCase())}
                          className="w-full py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-mono uppercase outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Brand
                        </label>
                        <input
                          type="text"
                          placeholder="Anker"
                          value={customBrand}
                          onChange={(e) => setCustomBrand(e.target.value)}
                          className="w-full py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Category
                        </label>
                        <select
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          className="w-full py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs outline-none cursor-pointer"
                        >
                          {UNLISTED_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-end">
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Inward Qty *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={customQty}
                          onChange={(e) => setCustomQty(e.target.value)}
                          className="w-full py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-mono font-bold text-center"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Unit Cost (<AedSymbol />) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={customUnitCost}
                          onChange={(e) => setCustomUnitCost(e.target.value)}
                          className="w-full py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-mono text-right"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Selling Price (Opt.)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Auto +20%"
                          value={customSellingPrice}
                          onChange={(e) => setCustomSellingPrice(e.target.value)}
                          className="w-full py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-mono text-right"
                        />
                      </div>

                      <div className="col-span-2 sm:col-span-3">
                        <button
                          type="button"
                          onClick={handleAddUnlistedItem}
                          disabled={!customName.trim()}
                          className="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          + Add Unlisted
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* MODE 3: UPLOAD EXCEL (.XLSX) / CSV / SUPPLIER PDF INVOICE / PASTE */}
                {entryMode === "import" && (
                  <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-sky-200 dark:border-sky-500/30 space-y-3 text-xs">
                    {/* Dropzone + Template Download */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                        const dropped = e.dataTransfer.files?.[0];
                        if (dropped) handleProcessFile(dropped);
                      }}
                      className={`p-4 rounded-xl border-2 border-dashed transition text-center space-y-2 ${
                        isDragOver
                          ? "border-sky-500 bg-sky-50/70 dark:bg-sky-500/10"
                          : "border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40"
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.csv,.tsv,.txt,.pdf"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleProcessFile(f);
                          e.target.value = "";
                        }}
                        className="hidden"
                      />
                      <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 flex items-center justify-center mx-auto text-base">
                        <FiUpload />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {importBusy
                            ? "Parsing file..."
                            : "Drop Excel (.xlsx), CSV, or Supplier PDF Invoice here"}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Preserves exact uploaded SKU, Name &amp; Selling Price • Auto-matches product images from catalog
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={importBusy}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white font-bold text-[11px] cursor-pointer"
                        >
                          <FiUpload /> Choose File
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPasteBox((v) => !v)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] cursor-pointer"
                        >
                          <FiClipboard /> {showPasteBox ? "Hide Paste Box" : "Paste from Excel / PDF"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            downloadPurchaseImportTemplate(portalCur.currency)
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-sky-400 text-slate-700 dark:text-slate-200 font-semibold text-[11px] cursor-pointer"
                        >
                          <FiDownload /> Excel Template (.csv)
                        </button>
                      </div>
                    </div>

                    {/* Smart Paste Box */}
                    {showPasteBox && (
                      <div className="space-y-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-300">
                          Paste rows copied directly from Excel, Google Sheets, PDF, or WhatsApp:
                        </label>
                        <textarea
                          rows={4}
                          value={pasteText}
                          onChange={(e) => setPasteText(e.target.value)}
                          placeholder={"SKU\tProduct Name\tQty\tUnit Cost\nHMD-100\tHMD 100\t500\t30.00\nANKER-65W\tAnker 65W Charger\t40\t75.00"}
                          className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-900 dark:text-white outline-none focus:border-sky-600"
                        />
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={handleParsePaste}
                            disabled={!pasteText.trim()}
                            className="px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white text-[11px] font-bold cursor-pointer"
                          >
                            Parse Pasted Rows
                          </button>
                        </div>
                      </div>
                    )}

                    {importError && (
                      <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-[11.5px] font-semibold flex items-center gap-2">
                        <FiAlertCircle className="shrink-0" />
                        <span>{importError}</span>
                      </div>
                    )}

                    {importWarning && (
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11.5px] font-medium flex items-center gap-2">
                        <FiAlertCircle className="shrink-0" />
                        <span>{importWarning}</span>
                      </div>
                    )}

                    {/* Parsed Import Preview & Review Table */}
                    {importPreviewRows.length > 0 && (
                      <div className="space-y-2.5 pt-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                              {importFileLabel}
                            </span>
                            {matchedImportCount > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/25 text-[10px] font-bold">
                                {matchedImportCount} Exact SKU
                              </span>
                            )}
                            {unlistedImportCount > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/25 text-[10px] font-bold">
                                {unlistedImportCount} New SKU{unlistedImportCount === 1 ? "" : "s"}
                              </span>
                            )}
                            {imageMatchedImportCount > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/25 text-[10px] font-bold">
                                {imageMatchedImportCount} Image{imageMatchedImportCount === 1 ? "" : "s"} Matched
                              </span>
                            )}
                          </div>

                          {(importMeta?.supplierName ||
                            importMeta?.supplierInvoiceRef ||
                            importMeta?.purchaseDate) && (
                            <button
                              type="button"
                              onClick={handleApplyDetectedMetadata}
                              className="text-[11px] font-bold text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                            >
                              Auto-fill Supplier / Ref / Date
                            </button>
                          )}
                        </div>

                        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                          <div className="hidden sm:grid grid-cols-12 gap-1.5 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[9.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            <div className="col-span-5 pl-6">Product &amp; SKU (Exact)</div>
                            <div className="col-span-1 text-center">Qty</div>
                            <div className="col-span-2 text-right">Cost (<AedSymbol />)</div>
                            <div className="col-span-2 text-right">Sell (<AedSymbol />)</div>
                            <div className="col-span-2 text-right">Line Total</div>
                          </div>

                          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                            {importPreviewRows.map((row) => (
                              <div
                                key={row.rowId}
                                className={`p-2 grid grid-cols-12 gap-1.5 items-center text-[11px] ${
                                  row.selected
                                    ? "bg-white dark:bg-slate-900"
                                    : "bg-slate-50 dark:bg-slate-800/40 opacity-50"
                                }`}
                              >
                                <div className="col-span-12 sm:col-span-5 flex items-center gap-2 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={row.selected}
                                    onChange={(e) =>
                                      handleUpdatePreviewRow(
                                        row.rowId,
                                        "selected",
                                        e.target.checked
                                      )
                                    }
                                    className="cursor-pointer shrink-0"
                                  />
                                  <div
                                    className={`w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border flex items-center justify-center p-0.5 shrink-0 ${
                                      row.imageMatched
                                        ? "border-sky-300 dark:border-sky-500/50"
                                        : "border-slate-200 dark:border-slate-700"
                                    }`}
                                    title={
                                      row.imageMatched
                                        ? "Image auto-matched from similar catalog product"
                                        : "Product thumbnail"
                                    }
                                  >
                                    <img
                                      src={row.image || "/logo.png"}
                                      alt={row.name}
                                      className="w-full h-full object-contain rounded"
                                      onError={(e) => {
                                        e.currentTarget.src = "/logo.png";
                                      }}
                                    />
                                  </div>
                                  <div className="min-w-0 flex-1 space-y-0.5">
                                    <div className="flex items-center gap-1">
                                      <span
                                        className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold shrink-0 ${
                                          row.isUnlisted
                                            ? "bg-amber-100 text-amber-800"
                                            : "bg-emerald-100 text-emerald-800"
                                        }`}
                                      >
                                        {row.isUnlisted ? "NEW" : "EXACT"}
                                      </span>
                                      <input
                                        type="text"
                                        value={row.name}
                                        onChange={(e) =>
                                          handleUpdatePreviewRow(
                                            row.rowId,
                                            "name",
                                            e.target.value
                                          )
                                        }
                                        className="w-full bg-transparent font-bold text-slate-900 dark:text-white outline-none focus:bg-slate-50 dark:focus:bg-slate-800 rounded px-1 truncate"
                                      />
                                    </div>
                                    <input
                                      type="text"
                                      value={row.sku}
                                      onChange={(e) =>
                                        handleUpdatePreviewRow(
                                          row.rowId,
                                          "sku",
                                          e.target.value
                                        )
                                      }
                                      className="w-full bg-transparent font-mono text-[10px] text-slate-400 outline-none focus:bg-slate-50 dark:focus:bg-slate-800 rounded px-1"
                                    />
                                  </div>
                                </div>

                                <div className="col-span-3 sm:col-span-1">
                                  <span className="sm:hidden text-[9px] font-bold text-slate-400 block mb-0.5">
                                    Qty
                                  </span>
                                  <input
                                    type="number"
                                    min="1"
                                    value={row.quantity}
                                    onChange={(e) =>
                                      handleUpdatePreviewRow(
                                        row.rowId,
                                        "quantity",
                                        e.target.value
                                      )
                                    }
                                    aria-label="Quantity"
                                    className="w-full py-1 px-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-center text-slate-900 dark:text-white"
                                  />
                                </div>

                                <div className="col-span-3 sm:col-span-2">
                                  <span className="sm:hidden text-[9px] font-bold text-slate-400 block mb-0.5">
                                    Cost
                                  </span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={row.unitCost}
                                    onChange={(e) =>
                                      handleUpdatePreviewRow(
                                        row.rowId,
                                        "unitCost",
                                        e.target.value
                                      )
                                    }
                                    aria-label="Unit Cost"
                                    className="w-full py-1 px-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-right text-slate-900 dark:text-white"
                                  />
                                </div>

                                <div className="col-span-3 sm:col-span-2">
                                  <span className="sm:hidden text-[9px] font-bold text-sky-600 block mb-0.5">
                                    Sell
                                  </span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Auto"
                                    value={row.sellingPrice || ""}
                                    onChange={(e) =>
                                      handleUpdatePreviewRow(
                                        row.rowId,
                                        "sellingPrice",
                                        e.target.value
                                      )
                                    }
                                    aria-label="Selling Price"
                                    className="w-full py-1 px-1.5 rounded-lg bg-sky-50/70 dark:bg-sky-500/10 border border-sky-200/80 dark:border-sky-500/30 font-mono font-semibold text-right text-sky-800 dark:text-sky-300"
                                  />
                                </div>

                                <div className="col-span-3 sm:col-span-2 text-right font-mono font-bold text-slate-800 dark:text-slate-200 truncate">
                                  <AedPrice amount={row.totalCost} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setImportPreviewRows([])}
                            className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 cursor-pointer"
                          >
                            Discard Preview
                          </button>
                          <button
                            type="button"
                            onClick={handleConfirmImportRows}
                            disabled={selectedImportCount === 0}
                            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
                          >
                            Add {selectedImportCount} Selected Item
                            {selectedImportCount === 1 ? "" : "s"} to Purchase
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* =========================================================== */}
                {/* INLINE-EDITABLE LINE ITEMS LIST (Qty, Cost & Selling Price) */}
                {/* =========================================================== */}
                {lineItems.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
                    {/* Table Column Labels */}
                    <div className="hidden sm:grid grid-cols-12 gap-2 px-3 py-2 bg-slate-50/90 dark:bg-slate-800/70 border-b border-slate-200/80 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <div className="col-span-4">Product &amp; SKU</div>
                      <div className="col-span-2 text-center">Inward Qty</div>
                      <div className="col-span-2 text-right">
                        Unit Cost (<AedSymbol />)
                      </div>
                      <div className="col-span-2 text-right">
                        Sell Price (<AedSymbol />)
                      </div>
                      <div className="col-span-2 text-right pr-7">Line Total</div>
                    </div>

                    <div className="divide-y divide-slate-200/80 dark:divide-slate-800 max-h-64 overflow-y-auto">
                      {lineItems.map((item, idx) => (
                        <div
                          key={`${item.sku}-${idx}`}
                          className="p-2.5 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                        >
                          {/* Thumbnail + Product Name & SKU */}
                          <div className="sm:col-span-4 flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 border flex items-center justify-center p-0.5 shrink-0 ${
                                item.imageMatched
                                  ? "border-sky-300 dark:border-sky-500/50"
                                  : "border-slate-200 dark:border-slate-700"
                              }`}
                              title={
                                item.imageMatched
                                  ? "Image auto-matched from similar catalog product"
                                  : "Product photo"
                              }
                            >
                              <img
                                src={item.image || "/logo.png"}
                                alt={item.name}
                                className="w-full h-full object-contain rounded"
                                onError={(e) => {
                                  e.currentTarget.src = "/logo.png";
                                }}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                {item.isUnlisted && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[9px] font-extrabold shrink-0">
                                    NEW
                                  </span>
                                )}
                                {item.isUnlisted ? (
                                  <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) =>
                                      handleUpdateLineItem(idx, "name", e.target.value)
                                    }
                                    className="w-full font-bold text-slate-900 dark:text-white bg-transparent border-b border-dashed border-amber-300 focus:border-sky-600 outline-none truncate"
                                  />
                                ) : (
                                  <p
                                    className="font-bold text-slate-900 dark:text-white truncate"
                                    title={item.name}
                                  >
                                    {item.name}
                                  </p>
                                )}
                              </div>
                              <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                                {item.sku} • {item.brand}
                              </p>
                            </div>
                          </div>

                          {/* Editable Qty + Unit Cost + Sell Price + Line Total + Delete */}
                          <div className="grid grid-cols-12 sm:contents gap-2 items-center">
                            <div className="col-span-4 sm:col-span-2">
                              <span className="sm:hidden text-[9.5px] font-bold uppercase text-slate-400 block mb-0.5">
                                Qty
                              </span>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleUpdateLineItem(idx, "quantity", e.target.value)
                                }
                                aria-label={`Quantity for ${item.name}`}
                                className="w-full py-1 px-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/30 font-mono font-black text-emerald-800 dark:text-emerald-300 text-center outline-none focus:border-sky-600"
                              />
                            </div>

                            <div className="col-span-4 sm:col-span-2">
                              <span className="sm:hidden text-[9.5px] font-bold uppercase text-slate-400 block mb-0.5">
                                Unit Cost
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitCost}
                                onChange={(e) =>
                                  handleUpdateLineItem(idx, "unitCost", e.target.value)
                                }
                                aria-label={`Unit cost for ${item.name}`}
                                className="w-full py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white text-right outline-none focus:border-sky-600"
                              />
                            </div>

                            <div className="col-span-4 sm:col-span-2">
                              <span className="sm:hidden text-[9.5px] font-bold uppercase text-sky-600 block mb-0.5">
                                Sell Price
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Auto +20%"
                                value={item.sellingPrice || ""}
                                onChange={(e) =>
                                  handleUpdateLineItem(
                                    idx,
                                    "sellingPrice",
                                    e.target.value
                                  )
                                }
                                aria-label={`Selling price for ${item.name}`}
                                className="w-full py-1 px-2 rounded-lg bg-sky-50/70 dark:bg-sky-500/10 border border-sky-200/80 dark:border-sky-500/30 font-mono font-bold text-sky-800 dark:text-sky-300 text-right outline-none focus:border-sky-600"
                              />
                            </div>

                            <div className="col-span-12 sm:col-span-2 flex items-center justify-between sm:justify-end gap-1.5 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                              <span className="sm:hidden text-[10px] font-bold uppercase text-slate-400">
                                Line Total
                              </span>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-mono font-black text-slate-900 dark:text-white truncate">
                                  <AedPrice amount={item.totalCost} />
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLineItem(idx)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/15 transition cursor-pointer shrink-0"
                                  title="Remove item"
                                >
                                  <FiTrash2 className="text-sm" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Notes Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Purchase Notes / Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional notes, AWB / customs ref, or supplier terms..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs outline-none focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              {/* Order Total Footer Bar */}
              <div className="p-3.5 bg-slate-900 dark:bg-slate-950 border border-slate-800 text-white rounded-2xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs text-slate-400 block font-medium">
                    Total Inward Units:{" "}
                    <strong className="text-white font-mono">
                      +{modalTotalUnits.toLocaleString()} units
                    </strong>
                    {modalNewSkuCount > 0 && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                        +{modalNewSkuCount} new SKU{modalNewSkuCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-slate-400 block">
                    Total Purchase Value ({portalCur.currency}):
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                  <AedPrice amount={modalTotalAmount} />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || lineItems.length === 0}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
                >
                  {isSubmitting
                    ? "Saving & Reconciling..."
                    : editingPurchaseNo
                    ? "Save Changes & Reconcile Stock"
                    : "Confirm & Inward Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PURCHASE DETAILS / RECEIPT MODAL */}
      {viewingPurchase && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 w-full max-w-xl shadow-2xl my-6 text-left border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/25 inline-block mb-1">
                  Goods Received Voucher
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white font-mono">
                  #{viewingPurchase.purchaseNo}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Date:{" "}
                  {new Date(
                    viewingPurchase.purchaseDate || viewingPurchase.createdAt
                  ).toLocaleDateString()}
                  {viewingPurchase.sourceFile
                    ? ` • Imported from ${viewingPurchase.sourceFile}`
                    : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewingPurchase(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="py-4 grid grid-cols-2 gap-3 text-xs border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold block">
                  Supplier
                </span>
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {viewingPurchase.supplierName}
                </span>
                {viewingPurchase.supplierInvoiceRef && (
                  <p className="text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    Ref: {viewingPurchase.supplierInvoiceRef}
                  </p>
                )}
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold block">
                  Payment
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {viewingPurchase.paymentMethod}
                </span>
                <span className="block text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                  Status: {viewingPurchase.paymentStatus}
                </span>
              </div>
            </div>

            <div className="py-4">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                Procured Line Items
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs max-h-60 overflow-y-auto">
                {(viewingPurchase.items || []).map((item) => (
                  <div
                    key={item.sku}
                    className="p-3 flex items-center justify-between gap-2.5 bg-white dark:bg-slate-950/50"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={item.image || "/logo.png"}
                        alt={item.name}
                        className="w-9 h-9 rounded-lg object-contain bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5 shrink-0"
                        onError={(e) => {
                          e.currentTarget.src = "/logo.png";
                        }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {item.name}
                          </p>
                          {item.isUnlisted && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-extrabold shrink-0">
                              NEW SKU
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">
                            {item.sku}
                          </p>
                          {Number(item.sellingPrice) > 0 && (
                            <span className="px-1.5 py-0.2 rounded bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 text-[9.5px] font-mono font-bold shrink-0">
                              Sell:{" "}
                              <AedPrice
                                amount={item.sellingPrice}
                                symbol={viewingPurchase.currencySymbol || undefined}
                              />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono shrink-0">
                      <span className="font-black text-emerald-700 dark:text-emerald-400">
                        +{Number(item.quantity).toLocaleString()} units
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                        Cost @{" "}
                        <AedPrice
                          amount={item.unitCost}
                          symbol={viewingPurchase.currencySymbol || undefined}
                        />
                      </span>
                    </div>

                    <div className="text-right font-mono font-black text-slate-900 dark:text-white w-24 shrink-0">
                      <AedPrice
                        amount={item.totalCost}
                        symbol={viewingPurchase.currencySymbol || undefined}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl flex items-center justify-between font-mono">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-sans block">
                  Total Procured:
                </span>
                <span className="font-black text-slate-900 dark:text-white">
                  +{Number(viewingPurchase.totalQuantity || 0).toLocaleString()} units
                </span>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-sans block">
                  Total Spend:
                </span>
                <span className="text-lg font-black text-slate-950 dark:text-white">
                  <AedPrice
                    amount={viewingPurchase.totalAmount}
                    symbol={viewingPurchase.currencySymbol || undefined}
                  />
                </span>
              </div>
            </div>

            {viewingPurchase.notes && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 italic">
                Note: {viewingPurchase.notes}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => handleOpenEditPurchase(viewingPurchase)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-50 dark:bg-amber-500/15 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <FiEdit2 className="text-xs" /> Edit Purchase
              </button>
              <button
                type="button"
                onClick={() => setViewingPurchase(null)}
                className="px-5 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseManagement;
