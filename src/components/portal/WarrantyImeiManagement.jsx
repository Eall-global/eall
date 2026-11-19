import { useState, useMemo } from "react";
import {
  FiCpu,
  FiShield,
  FiCheckCircle,
  FiAlertTriangle,
  FiSearch,
  FiDownload,
  FiPlus,
  FiX,
  FiCopy,
  FiCheck,
  FiFileText,
  FiTrash2,
  FiTool,
  FiMessageCircle,
  FiEye,
  FiPackage,
} from "react-icons/fi";
import PortalKpiGrid from "./PortalKpiGrid";
import { PortalFilterMenu, ActiveFilterChips } from "./PortalFilterMenu";
import {
  IMEI_STATUSES,
  WARRANTY_TYPES,
  RMA_CLAIM_STATUSES,
  getWarrantyState,
  registerImeiUnits,
  updateImeiRecord,
  logWarrantyClaim,
  deleteImeiRecord,
} from "../../services/warrantyService";

const STATUS_BADGE_MAP = {
  "In Stock":
    "bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-200/80 dark:border-sky-500/25",
  Sold: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-500/25",
  "Warranty Claim":
    "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-500/25",
  Replaced:
    "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-500/25",
  Returned:
    "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  "Void / Defective":
    "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-500/25",
};

const WARRANTY_BADGE_MAP = {
  active:
    "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-500/25",
  expiring:
    "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-500/25",
  expired:
    "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-500/25",
  unsold:
    "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  none: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700",
};

const EMPTY_REGISTER_FORM = {
  sku: "",
  productName: "",
  brand: "",
  serialsText: "",
  imei2: "",
  supplierName: "",
  purchaseInvoiceNo: "",
  costPrice: "",
  warrantyMonths: 12,
  warrantyType: WARRANTY_TYPES[0],
  notes: "",
};

const EMPTY_RMA_FORM = {
  claimStatus: "Open",
  issue: "",
  resolution: "",
  replacementSerial: "",
};

const WarrantyImeiManagement = ({
  records = [],
  stock = [],
  purchases = [],
  invoices = [],
  onRecordsUpdated,
  onViewInvoice,
  currentUser,
  isAdmin = false,
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [brandFilter, setBrandFilter] = useState("All");
  const [warrantyFilter, setWarrantyFilter] = useState("All");
  const [copiedId, setCopiedId] = useState(null);

  // Register Modal
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [skuSearch, setSkuSearch] = useState("");
  const [regForm, setRegForm] = useState(EMPTY_REGISTER_FORM);
  const [regError, setRegError] = useState("");
  const [regNotice, setRegNotice] = useState("");
  const [registering, setRegistering] = useState(false);

  // Slide-over Detail & RMA Drawer
  const [selectedId, setSelectedId] = useState(null);
  const [editStatus, setEditStatus] = useState("In Stock");
  const [editWarrantyMonths, setEditWarrantyMonths] = useState(12);
  const [editWarrantyType, setEditWarrantyType] = useState(WARRANTY_TYPES[0]);
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editCustomerPhone, setEditCustomerPhone] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [savingUnit, setSavingUnit] = useState(false);

  // RMA Form inside Drawer
  const [rmaForm, setRmaForm] = useState(EMPTY_RMA_FORM);
  const [savingRma, setSavingRma] = useState(false);

  const selectedRecord = useMemo(
    () => records.find((r) => r.id === selectedId) || null,
    [records, selectedId]
  );

  const invoiceLookup = useMemo(() => {
    const map = new Map();
    invoices.forEach((inv) => {
      if (inv.invoiceNo) map.set(inv.invoiceNo, inv);
      if (inv.id) map.set(inv.id, inv);
    });
    return map;
  }, [invoices]);

  const distinctBrands = useMemo(() => {
    const set = new Set();
    records.forEach((r) => r.brand && set.add(r.brand));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [records]);

  const enrichedRecords = useMemo(
    () =>
      records.map((rec) => ({
        ...rec,
        warrantyInfo: getWarrantyState(rec),
      })),
    [records]
  );

  const filteredRecords = useMemo(() => {
    const q = search.toLowerCase().trim();
    return enrichedRecords.filter((rec) => {
      if (statusFilter !== "All" && rec.status !== statusFilter) return false;
      if (brandFilter !== "All" && rec.brand !== brandFilter) return false;
      if (warrantyFilter !== "All" && rec.warrantyInfo.state !== warrantyFilter) {
        return false;
      }
      if (!q) return true;
      return (
        (rec.serialNumber || "").toLowerCase().includes(q) ||
        (rec.imei2 || "").toLowerCase().includes(q) ||
        (rec.productName || "").toLowerCase().includes(q) ||
        (rec.sku || "").toLowerCase().includes(q) ||
        (rec.brand || "").toLowerCase().includes(q) ||
        (rec.invoiceNo || "").toLowerCase().includes(q) ||
        (rec.customerName || "").toLowerCase().includes(q) ||
        (rec.customerPhone || "").toLowerCase().includes(q) ||
        (rec.supplierName || "").toLowerCase().includes(q)
      );
    });
  }, [enrichedRecords, search, statusFilter, brandFilter, warrantyFilter]);

  const metrics = useMemo(() => {
    const total = enrichedRecords.length;
    const inStockCount = enrichedRecords.filter((r) => r.status === "In Stock").length;
    const activeWarranties = enrichedRecords.filter(
      (r) => r.warrantyInfo.state === "active" || r.warrantyInfo.state === "expiring"
    ).length;
    const openRmaClaims = enrichedRecords.filter(
      (r) => r.status === "Warranty Claim"
    ).length;
    return { total, inStockCount, activeWarranties, openRmaClaims };
  }, [enrichedRecords]);

  const parsedBatchSerials = useMemo(() => {
    if (!regForm.serialsText.trim()) return [];
    return Array.from(
      new Set(
        regForm.serialsText
          .split(/[\n,;]+/)
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean)
      )
    );
  }, [regForm.serialsText]);

  const matchingStockOptions = useMemo(() => {
    const q = skuSearch.toLowerCase().trim();
    const list = q
      ? stock.filter(
          (s) =>
            (s.name || "").toLowerCase().includes(q) ||
            (s.sku || "").toLowerCase().includes(q) ||
            (s.brand || "").toLowerCase().includes(q)
        )
      : stock;
    return list.slice(0, 40);
  }, [stock, skuSearch]);

  const filterSections = useMemo(
    () => [
      {
        id: "status",
        label: "Status",
        value: statusFilter,
        defaultValue: "All",
        onChange: setStatusFilter,
        options: [
          { value: "All", label: "All Statuses", count: records.length },
          ...IMEI_STATUSES.map((st) => ({
            value: st,
            label: st,
            count: records.filter((r) => r.status === st).length,
          })),
        ],
      },
      {
        id: "brand",
        label: "Brand",
        value: brandFilter,
        defaultValue: "All",
        onChange: setBrandFilter,
        options: [
          { value: "All", label: "All Brands", count: records.length },
          ...distinctBrands.map((b) => ({
            value: b,
            label: b,
            count: records.filter((r) => r.brand === b).length,
          })),
        ],
      },
      {
        id: "warranty",
        label: "Warranty",
        value: warrantyFilter,
        defaultValue: "All",
        onChange: setWarrantyFilter,
        options: [
          { value: "All", label: "All Coverage", count: enrichedRecords.length },
          {
            value: "active",
            label: "Active Coverage",
            count: enrichedRecords.filter((r) => r.warrantyInfo.state === "active").length,
          },
          {
            value: "expiring",
            label: "Expiring Soon (≤30d)",
            count: enrichedRecords.filter((r) => r.warrantyInfo.state === "expiring").length,
          },
          {
            value: "expired",
            label: "Expired",
            count: enrichedRecords.filter((r) => r.warrantyInfo.state === "expired").length,
          },
          {
            value: "unsold",
            label: "In Stock / Unsold",
            count: enrichedRecords.filter((r) => r.warrantyInfo.state === "unsold").length,
          },
        ],
      },
    ],
    [statusFilter, brandFilter, warrantyFilter, records, distinctBrands, enrichedRecords]
  );

  const openUnitDrawer = (rec) => {
    setSelectedId(rec.id);
    setEditStatus(rec.status || "In Stock");
    setEditWarrantyMonths(rec.warrantyMonths ?? 12);
    setEditWarrantyType(rec.warrantyType || WARRANTY_TYPES[0]);
    setEditCustomerName(rec.customerName || "");
    setEditCustomerPhone(rec.customerPhone || "");
    setEditNotes(rec.notes || "");
    setRmaForm(EMPTY_RMA_FORM);
  };

  const handleCopySerial = (serial, id) => {
    if (!serial) return;
    navigator.clipboard?.writeText(serial);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1800);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError("");
    setRegNotice("");
    if (!regForm.sku || !regForm.productName) {
      setRegError("Please select a product from stock first.");
      return;
    }
    if (parsedBatchSerials.length === 0) {
      setRegError("Enter at least one IMEI or serial number.");
      return;
    }

    setRegistering(true);
    try {
      const res = await registerImeiUnits({
        sku: regForm.sku,
        productName: regForm.productName,
        brand: regForm.brand || "General",
        serials: parsedBatchSerials,
        imei2: parsedBatchSerials.length === 1 ? regForm.imei2 : "",
        supplierName: regForm.supplierName,
        purchaseInvoiceNo: regForm.purchaseInvoiceNo,
        costPrice: parseFloat(regForm.costPrice) || 0,
        warrantyMonths: Number(regForm.warrantyMonths),
        warrantyType: regForm.warrantyType,
        notes: regForm.notes,
      });
      if (onRecordsUpdated) await onRecordsUpdated();
      if (res.skippedDuplicates.length > 0) {
        setRegNotice(
          `Registered ${res.created.length} unit(s). Skipped ${res.skippedDuplicates.length} duplicate(s).`
        );
      } else {
        setShowRegisterModal(false);
        setRegForm(EMPTY_REGISTER_FORM);
        setSkuSearch("");
      }
    } catch (err) {
      setRegError(err.message || "Failed to register IMEI batch.");
    } finally {
      setRegistering(false);
    }
  };

  const handleSaveUnit = async (e) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setSavingUnit(true);
    try {
      await updateImeiRecord(selectedRecord.id, {
        status: editStatus,
        warrantyMonths: Number(editWarrantyMonths),
        warrantyType: editWarrantyType,
        customerName: editCustomerName,
        customerPhone: editCustomerPhone,
        notes: editNotes,
      });
      if (onRecordsUpdated) await onRecordsUpdated();
    } catch (err) {
      alert(err.message || "Could not update unit record.");
    } finally {
      setSavingUnit(false);
    }
  };

  const handleLogRma = async (e) => {
    e.preventDefault();
    if (!selectedRecord || !rmaForm.issue.trim()) return;
    setSavingRma(true);
    try {
      const updated = await logWarrantyClaim(selectedRecord.id, {
        ...rmaForm,
        updatedBy: currentUser?.name || "Staff",
      });
      setEditStatus(updated.status);
      setRmaForm(EMPTY_RMA_FORM);
      if (onRecordsUpdated) await onRecordsUpdated();
    } catch (err) {
      alert(err.message || "Could not log RMA claim.");
    } finally {
      setSavingRma(false);
    }
  };

  const handleDeleteUnit = async (rec) => {
    if (!isAdmin) return;
    if (!window.confirm(`Permanently delete IMEI record ${rec.serialNumber}?`)) return;
    await deleteImeiRecord(rec.id);
    if (selectedId === rec.id) setSelectedId(null);
    if (onRecordsUpdated) onRecordsUpdated();
  };

  const handleWhatsAppWarrantyCard = (rec) => {
    const cleanPhone = (rec.customerPhone || "").replace(/[^0-9]/g, "");
    const expiryText = rec.warrantyExpiresAt
      ? new Date(rec.warrantyExpiresAt).toLocaleDateString("en-GB")
      : "N/A";
    const saleText = rec.soldAt
      ? new Date(rec.soldAt).toLocaleDateString("en-GB")
      : "N/A";
    const msg =
      `*E-ALL OFFICIAL WARRANTY CERTIFICATE*\n` +
      `Electronics All FZCO • Dubai Silicon Oasis\n\n` +
      `*Device:* ${rec.productName}\n` +
      `*IMEI / Serial:* ${rec.serialNumber}\n` +
      (rec.invoiceNo ? `*Invoice #:* ${rec.invoiceNo}\n` : "") +
      `*Purchase Date:* ${saleText}\n` +
      `*Warranty Type:* ${rec.warrantyType}\n` +
      `*Valid Until:* ${expiryText} (${rec.warrantyMonths} Months)\n\n` +
      `Keep this message for priority warranty & RMA support.`;
    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
  };

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;
    const headers = [
      "IMEI / Serial",
      "IMEI 2",
      "SKU",
      "Product",
      "Brand",
      "Status",
      "Supplier",
      "Purchase Ref",
      "Invoice #",
      "Customer",
      "Phone",
      "Sold Date",
      "Warranty (Months)",
      "Warranty Expiry",
      "RMA Claims",
    ];
    const rows = filteredRecords.map((r) => [
      `"${r.serialNumber}"`,
      `"${r.imei2 || ""}"`,
      `"${r.sku}"`,
      `"${(r.productName || "").replace(/"/g, '""')}"`,
      `"${r.brand}"`,
      `"${r.status}"`,
      `"${(r.supplierName || "").replace(/"/g, '""')}"`,
      `"${r.purchaseInvoiceNo || ""}"`,
      `"${r.invoiceNo || ""}"`,
      `"${(r.customerName || "").replace(/"/g, '""')}"`,
      `"${r.customerPhone || ""}"`,
      r.soldAt ? new Date(r.soldAt).toLocaleDateString("en-GB") : "",
      r.warrantyMonths ?? 12,
      r.warrantyExpiresAt
        ? new Date(r.warrantyExpiresAt).toLocaleDateString("en-GB")
        : "",
      r.claims?.length || 0,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `EALL_IMEI_Warranty_Registry_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const selectedWarrantyInfo = selectedRecord
    ? getWarrantyState(selectedRecord)
    : null;

  return (
    <div className="space-y-4 sm:space-y-5 text-left">
      {/* KPI CARDS */}
      <PortalKpiGrid
        items={[
          {
            id: "tracked",
            label: "Tracked Devices",
            value: metrics.total,
            sublabel: "Serialized IMEI units",
            icon: FiCpu,
            tone: "sky",
          },
          {
            id: "instock",
            label: "In-Stock Serials",
            value: metrics.inStockCount,
            sublabel: "Ready for POS scan",
            icon: FiPackage,
            tone: "indigo",
          },
          {
            id: "active",
            label: "Active Warranties",
            value: metrics.activeWarranties,
            sublabel: "Covered sold units",
            icon: FiShield,
            tone: "emerald",
          },
          {
            id: "rma",
            label: "Open RMA Claims",
            value: metrics.openRmaClaims,
            sublabel: "Service & replacement",
            icon: FiAlertTriangle,
            tone: "amber",
            valueClassName:
              metrics.openRmaClaims > 0
                ? "text-amber-600 dark:text-amber-400"
                : "text-slate-900 dark:text-white",
          },
        ]}
      />

      {/* UNIFIED SEARCH + 2-COLUMN FILTER TOOLBAR */}
      <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative flex-1 min-w-0">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-base" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Lookup IMEI, Serial #, SKU, Invoice #, customer, phone or supplier..."
              className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl text-xs sm:text-sm font-medium outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 dark:focus:border-sky-500 transition"
            />
          </div>

          <PortalFilterMenu sections={filterSections} />

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredRecords.length === 0}
            aria-label="Export CSV"
            title="Export CSV"
            className="inline-flex items-center justify-center gap-1.5 w-10 h-10 md:w-auto md:px-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer shrink-0"
          >
            <FiDownload className="text-[15px] md:text-sm" />
            <span className="hidden md:inline">Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRegError("");
              setRegNotice("");
              setShowRegisterModal(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-3 sm:px-4 bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer shrink-0"
          >
            <FiPlus className="text-sm" />
            <span className="hidden sm:inline">Register IMEI</span>
          </button>
        </div>

        <ActiveFilterChips sections={filterSections} />
      </div>

      {/* REGISTRY TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center space-y-2.5">
            <FiCpu className="mx-auto text-4xl text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {records.length === 0
                ? "No serialized devices registered yet"
                : "No IMEI / warranty records match your filters"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Register warehouse IMEI batches on intake or attach serial numbers directly at Billing &amp; POS checkout to activate warranty tracking.
            </p>
            {records.length === 0 && (
              <button
                type="button"
                onClick={() => setShowRegisterModal(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold cursor-pointer"
              >
                <FiPlus /> Register First IMEI Batch
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 px-4 whitespace-nowrap">IMEI / Serial #</th>
                  <th className="py-3 px-4 whitespace-nowrap">Device &amp; SKU</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 whitespace-nowrap">Customer &amp; Invoice</th>
                  <th className="py-3 px-4 whitespace-nowrap">Warranty Coverage</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredRecords.map((rec) => {
                  const statusCls =
                    STATUS_BADGE_MAP[rec.status] || STATUS_BADGE_MAP["In Stock"];
                  const wBadgeCls =
                    WARRANTY_BADGE_MAP[rec.warrantyInfo.state] ||
                    WARRANTY_BADGE_MAP.unsold;
                  const linkedInvoice = rec.invoiceNo
                    ? invoiceLookup.get(rec.invoiceNo)
                    : null;

                  return (
                    <tr
                      key={rec.id}
                      onClick={() => openUnitDrawer(rec)}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                            {rec.serialNumber}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopySerial(rec.serialNumber, rec.id);
                            }}
                            title="Copy IMEI / Serial"
                            className="p-1 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 rounded cursor-pointer"
                          >
                            {copiedId === rec.id ? (
                              <FiCheck className="text-emerald-600 text-xs" />
                            ) : (
                              <FiCopy className="text-xs" />
                            )}
                          </button>
                        </div>
                        {rec.imei2 && (
                          <p className="text-[10px] font-mono text-slate-400">
                            IMEI2: {rec.imei2}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 min-w-[200px]">
                        <p className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm truncate max-w-[260px]">
                          {rec.productName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300">
                            {rec.brand}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {rec.sku}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusCls}`}
                        >
                          {rec.status}
                        </span>
                        {rec.claims?.length > 0 && (
                          <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300">
                            {rec.claims.length} RMA
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {rec.customerName ? (
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white text-xs">
                              {rec.customerName}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {rec.invoiceNo && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (linkedInvoice && onViewInvoice) {
                                      onViewInvoice(linkedInvoice);
                                    }
                                  }}
                                  disabled={!linkedInvoice}
                                  className="text-[11px] font-mono font-bold text-sky-700 dark:text-sky-400 hover:underline disabled:no-underline disabled:text-slate-500 cursor-pointer"
                                >
                                  {rec.invoiceNo}
                                </button>
                              )}
                              {rec.customerPhone && (
                                <span className="text-[11px] font-mono text-slate-400">
                                  {rec.customerPhone}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            {rec.supplierName ? `From ${rec.supplierName}` : "Warehouse Inventory"}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${wBadgeCls}`}
                        >
                          <FiShield className="text-[11px]" />
                          {rec.warrantyInfo.label}
                        </span>
                        {rec.warrantyExpiresAt && (
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Ends {new Date(rec.warrantyExpiresAt).toLocaleDateString("en-GB")}
                          </p>
                        )}
                      </td>

                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openUnitDrawer(rec)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-500/15 text-slate-700 dark:text-slate-200 hover:text-sky-700 dark:hover:text-sky-300 text-xs font-semibold transition cursor-pointer"
                          >
                            <FiEye className="text-xs" /> Inspect
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUnit(rec)}
                              title="Delete IMEI record"
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 rounded-xl transition cursor-pointer"
                            >
                              <FiTrash2 className="text-sm" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SLIDE-OVER DEVICE LIFECYCLE & RMA DRAWER */}
      {selectedRecord && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-end text-left"
          onClick={() => setSelectedId(null)}
        >
          <aside
            className="w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-black text-sm sm:text-base text-slate-900 dark:text-white">
                    {selectedRecord.serialNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopySerial(selectedRecord.serialNumber, selectedRecord.id)
                    }
                    className="p-1 text-slate-400 hover:text-sky-600 rounded cursor-pointer"
                    title="Copy serial"
                  >
                    {copiedId === selectedRecord.id ? (
                      <FiCheck className="text-emerald-600 text-xs" />
                    ) : (
                      <FiCopy className="text-xs" />
                    )}
                  </button>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      STATUS_BADGE_MAP[selectedRecord.status] ||
                      STATUS_BADGE_MAP["In Stock"]
                    }`}
                  >
                    {selectedRecord.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {selectedRecord.productName} •{" "}
                  <span className="font-mono">{selectedRecord.sku}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {/* Warranty Coverage Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FiShield className="text-emerald-600 dark:text-emerald-400 text-base" />
                    <span className="font-bold text-slate-900 dark:text-white">
                      {selectedRecord.warrantyType}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      WARRANTY_BADGE_MAP[selectedWarrantyInfo?.state] ||
                      WARRANTY_BADGE_MAP.unsold
                    }`}
                  >
                    {selectedWarrantyInfo?.label}
                  </span>
                </div>

                {selectedRecord.soldAt && selectedRecord.warrantyExpiresAt && (
                  <div className="space-y-1.5">
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          selectedWarrantyInfo?.state === "expired"
                            ? "bg-rose-500"
                            : selectedWarrantyInfo?.state === "expiring"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${selectedWarrantyInfo?.percentElapsed || 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      <span>
                        Sold: {new Date(selectedRecord.soldAt).toLocaleDateString("en-GB")}
                      </span>
                      <span>
                        Expires:{" "}
                        {new Date(selectedRecord.warrantyExpiresAt).toLocaleDateString(
                          "en-GB"
                        )}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {selectedRecord.customerPhone && (
                    <button
                      type="button"
                      onClick={() => handleWhatsAppWarrantyCard(selectedRecord)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition"
                    >
                      <FiMessageCircle /> Send WhatsApp Warranty Card
                    </button>
                  )}

                  {selectedRecord.invoiceNo &&
                    invoiceLookup.get(selectedRecord.invoiceNo) &&
                    onViewInvoice && (
                      <button
                        type="button"
                        onClick={() =>
                          onViewInvoice(invoiceLookup.get(selectedRecord.invoiceNo))
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-500/15 hover:bg-sky-100 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-500/25 font-bold cursor-pointer transition"
                      >
                        <FiFileText /> View Invoice {selectedRecord.invoiceNo}
                      </button>
                    )}
                </div>
              </div>

              {/* Procurement Provenance Strip */}
              {(selectedRecord.supplierName || selectedRecord.purchaseInvoiceNo) && (
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Supplier / Batch Source
                    </span>
                    <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                      {selectedRecord.supplierName || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Purchase Ref
                    </span>
                    <p className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
                      {selectedRecord.purchaseInvoiceNo || "—"}
                    </p>
                  </div>
                </div>
              )}

              {/* Unit & Warranty Settings Form */}
              <form
                onSubmit={handleSaveUnit}
                className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3"
              >
                <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-500 dark:text-slate-400">
                  Device Status &amp; Coverage Details
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Lifecycle Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold outline-none focus:border-sky-600 cursor-pointer"
                    >
                      {IMEI_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Warranty Term
                    </label>
                    <select
                      value={editWarrantyMonths}
                      onChange={(e) => setEditWarrantyMonths(Number(e.target.value))}
                      className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold outline-none focus:border-sky-600 cursor-pointer"
                    >
                      <option value={12}>12 Months</option>
                      <option value={24}>24 Months</option>
                      <option value={6}>6 Months</option>
                      <option value={0}>No Warranty</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Warranty Type
                  </label>
                  <select
                    value={editWarrantyType}
                    onChange={(e) => setEditWarrantyType(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-sky-600 cursor-pointer"
                  >
                    {WARRANTY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Assigned Customer
                    </label>
                    <input
                      type="text"
                      value={editCustomerName}
                      onChange={(e) => setEditCustomerName(e.target.value)}
                      placeholder="Customer / Company"
                      className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-sky-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Customer Phone
                    </label>
                    <input
                      type="tel"
                      value={editCustomerPhone}
                      onChange={(e) => setEditCustomerPhone(e.target.value)}
                      placeholder="+971 50..."
                      className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono outline-none focus:border-sky-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Internal Notes
                  </label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Box condition, region spec (TDRA / Global), notes..."
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-sky-600"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingUnit}
                    className="px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 text-white font-bold disabled:opacity-50 cursor-pointer"
                  >
                    {savingUnit ? "Saving..." : "Save Unit Details"}
                  </button>
                </div>
              </form>

              {/* RMA / WARRANTY CLAIMS PANEL */}
              <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3.5">
                <div className="flex items-center gap-2">
                  <FiTool className="text-amber-600 dark:text-amber-400" />
                  <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-300">
                    RMA &amp; Warranty Service Log ({selectedRecord.claims?.length || 0})
                  </h4>
                </div>

                <form onSubmit={handleLogRma} className="space-y-2.5 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        RMA Action / Stage
                      </label>
                      <select
                        value={rmaForm.claimStatus}
                        onChange={(e) =>
                          setRmaForm({ ...rmaForm, claimStatus: e.target.value })
                        }
                        className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold outline-none focus:border-amber-500 cursor-pointer"
                      >
                        {RMA_CLAIM_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Replacement IMEI (If Swapped)
                      </label>
                      <input
                        type="text"
                        value={rmaForm.replacementSerial}
                        onChange={(e) =>
                          setRmaForm({
                            ...rmaForm,
                            replacementSerial: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="Optional new serial"
                        className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <input
                    type="text"
                    required
                    value={rmaForm.issue}
                    onChange={(e) => setRmaForm({ ...rmaForm, issue: e.target.value })}
                    placeholder="Reported fault / warranty issue (e.g. Display flicker, Battery drain) *"
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  />

                  <input
                    type="text"
                    value={rmaForm.resolution}
                    onChange={(e) =>
                      setRmaForm({ ...rmaForm, resolution: e.target.value })
                    }
                    placeholder="Technician / Service center resolution notes (optional)"
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  />

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={savingRma || !rmaForm.issue.trim()}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold disabled:opacity-40 cursor-pointer"
                    >
                      {savingRma ? "Logging..." : "Log RMA Entry"}
                    </button>
                  </div>
                </form>

                {/* Claims Timeline */}
                {selectedRecord.claims?.length > 0 ? (
                  <div className="space-y-2">
                    {selectedRecord.claims.map((claim) => (
                      <div
                        key={claim.id}
                        className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {claim.id} • {claim.claimStatus}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(claim.openedAt).toLocaleDateString("en-GB")} •{" "}
                            {claim.updatedBy}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300">
                          {claim.issue}
                        </p>
                        {claim.resolution && (
                          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                            Resolution: {claim.resolution}
                          </p>
                        )}
                        {claim.replacementSerial && (
                          <p className="text-[11px] font-mono text-indigo-700 dark:text-indigo-300 font-semibold">
                            Swapped with IMEI: {claim.replacementSerial}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 text-center py-2">
                    No warranty claims filed for this device.
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* REGISTER IMEI / BULK BATCH MODAL */}
      {showRegisterModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setShowRegisterModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 w-full max-w-xl shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 my-6 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Register IMEI / Serial Batch
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Scan or paste one or multiple IMEIs from a supplier packing list to enable POS lookup &amp; warranty tracking.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl cursor-pointer"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              {/* Product Picker */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Product / SKU *
                </label>
                <input
                  type="text"
                  value={skuSearch}
                  onChange={(e) => setSkuSearch(e.target.value)}
                  placeholder="Filter products by name, SKU or brand..."
                  className="w-full p-2 mb-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:border-sky-600"
                />
                <select
                  required
                  value={regForm.sku}
                  onChange={(e) => {
                    const prod = stock.find((s) => s.sku === e.target.value);
                    setRegForm({
                      ...regForm,
                      sku: e.target.value,
                      productName: prod?.name || "",
                      brand: prod?.brand || "General",
                      costPrice: prod?.costPrice ?? "",
                    });
                  }}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-semibold outline-none focus:border-sky-600 cursor-pointer"
                >
                  <option value="">-- Select Product SKU --</option>
                  {matchingStockOptions.map((s) => (
                    <option key={s.sku} value={s.sku}>
                      {s.name} ({s.sku}) — Stock: {s.quantity}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bulk Serials Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">
                    IMEI / Serial Numbers (One per line or comma-separated) *
                  </label>
                  {parsedBatchSerials.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300">
                      {parsedBatchSerials.length} unique unit(s)
                    </span>
                  )}
                </div>
                <textarea
                  rows={4}
                  required
                  value={regForm.serialsText}
                  onChange={(e) =>
                    setRegForm({ ...regForm, serialsText: e.target.value })
                  }
                  placeholder={"358912098765431\n358912098765432\n358912098765433"}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-mono outline-none focus:border-sky-600"
                />
              </div>

              {parsedBatchSerials.length === 1 && (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Dual-SIM IMEI 2 (Optional)
                  </label>
                  <input
                    type="text"
                    value={regForm.imei2}
                    onChange={(e) =>
                      setRegForm({ ...regForm, imei2: e.target.value })
                    }
                    placeholder="Optional secondary IMEI"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-mono outline-none focus:border-sky-600"
                  />
                </div>
              )}

              {/* Supplier & Purchase Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Supplier / Distributor
                  </label>
                  <input
                    type="text"
                    value={regForm.supplierName}
                    onChange={(e) =>
                      setRegForm({ ...regForm, supplierName: e.target.value })
                    }
                    placeholder="e.g. Axiom / Al Sayegh"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:border-sky-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Purchase Voucher / PO Ref
                  </label>
                  <input
                    type="text"
                    list="purchase-ref-list"
                    value={regForm.purchaseInvoiceNo}
                    onChange={(e) => {
                      const val = e.target.value;
                      const match = purchases.find(
                        (p) => p.purchaseNo === val || p.supplierInvoiceNo === val
                      );
                      setRegForm({
                        ...regForm,
                        purchaseInvoiceNo: val,
                        supplierName: match?.supplierName || regForm.supplierName,
                      });
                    }}
                    placeholder="e.g. PUR-2026-1001"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-mono outline-none focus:border-sky-600"
                  />
                  <datalist id="purchase-ref-list">
                    {purchases.slice(0, 20).map((p) => (
                      <option
                        key={p.id || p.purchaseNo}
                        value={p.purchaseNo || p.supplierInvoiceNo}
                      >
                        {p.supplierName}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Warranty Defaults */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Default Warranty Term
                  </label>
                  <select
                    value={regForm.warrantyMonths}
                    onChange={(e) =>
                      setRegForm({
                        ...regForm,
                        warrantyMonths: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-semibold outline-none focus:border-sky-600 cursor-pointer"
                  >
                    <option value={12}>12 Months (Standard)</option>
                    <option value={24}>24 Months (Extended)</option>
                    <option value={6}>6 Months</option>
                    <option value={0}>No Warranty</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Warranty Coverage Type
                  </label>
                  <select
                    value={regForm.warrantyType}
                    onChange={(e) =>
                      setRegForm({ ...regForm, warrantyType: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:border-sky-600 cursor-pointer"
                  >
                    {WARRANTY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {regError && (
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                  {regError}
                </p>
              )}
              {regNotice && (
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <FiCheckCircle /> {regNotice}
                </p>
              )}

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registering}
                  className="px-5 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 text-white font-bold disabled:opacity-50 cursor-pointer"
                >
                  {registering
                    ? "Registering..."
                    : `Register ${parsedBatchSerials.length || 0} Unit(s)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarrantyImeiManagement;

