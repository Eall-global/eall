import { useState, useMemo } from "react";
import {
  FiPlus,
  FiSearch,
  FiTruck,
  FiPackage,
  FiCalendar,
  FiDollarSign,
  FiTrash2,
  FiEye,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiFileText,
  FiCheck,
  FiLayers,
} from "react-icons/fi";
import { createPurchaseRecord, deletePurchaseRecord } from "../../services/purchaseService";
import { AedSymbol, AedPrice } from "../common/AedSymbol";
import PortalKpiGrid from "./PortalKpiGrid";
import { PortalFilterMenu, ActiveFilterChips } from "./PortalFilterMenu";

const PurchaseManagement = ({
  stock = [],
  purchases = [],
  onPurchasesUpdated,
  currentUser,
  isAdmin,
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("All");

  // Create Purchase Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [supplierName, setSupplierName] = useState("");
  const [supplierInvoiceRef, setSupplierInvoiceRef] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [notes, setNotes] = useState("");

  // Line items in modal
  const [lineItems, setLineItems] = useState([]);
  const [selectedSku, setSelectedSku] = useState("");
  const [addQty, setAddQty] = useState(1);
  const [addUnitCost, setAddUnitCost] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

  // Handle item selection in the modal
  const handleSelectProduct = (sku) => {
    setSelectedSku(sku);
    const found = stock.find((s) => s.sku === sku);
    if (found) {
      setAddUnitCost(found.costPrice || "");
    }
  };

  // Add line item to pending purchase list
  const handleAddLineItem = () => {
    if (!selectedSku) return;
    const found = stock.find((s) => s.sku === selectedSku);
    if (!found) return;

    const qty = Math.max(1, parseInt(addQty, 10) || 1);
    const unitCost = Math.max(0, parseFloat(addUnitCost) || 0);

    // Check if already added
    const existingIndex = lineItems.findIndex((i) => i.sku === selectedSku);
    if (existingIndex >= 0) {
      const updated = [...lineItems];
      updated[existingIndex].quantity += qty;
      updated[existingIndex].unitCost = unitCost;
      updated[existingIndex].totalCost =
        updated[existingIndex].quantity * unitCost;
      setLineItems(updated);
    } else {
      setLineItems([
        ...lineItems,
        {
          sku: found.sku,
          name: found.name,
          brand: found.brand,
          image: found.image,
          quantity: qty,
          unitCost: unitCost,
          totalCost: qty * unitCost,
        },
      ]);
    }

    // Reset picker inputs
    setSelectedSku("");
    setAddQty(1);
    setAddUnitCost("");
  };

  const handleRemoveLineItem = (index) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const modalTotalAmount = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + item.totalCost, 0);
  }, [lineItems]);

  const modalTotalUnits = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [lineItems]);

  // Submit Purchase Order
  const handleCreatePurchase = async (e) => {
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
      await createPurchaseRecord({
        supplierName,
        supplierInvoiceRef,
        purchaseDate,
        paymentStatus,
        paymentMethod,
        items: lineItems,
        notes,
        createdBy: currentUser?.name || "Admin",
      });

      // Reset form
      setShowCreateModal(false);
      setSupplierName("");
      setSupplierInvoiceRef("");
      setLineItems([]);
      setNotes("");
      setSelectedSku("");

      if (onPurchasesUpdated) onPurchasesUpdated();
    } catch (err) {
      setErrorMessage(err.message || "Failed to record purchase.");
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

  return (
    <div className="space-y-4 sm:space-y-5 text-left font-sans">
      {/* 📊 SUMMARY METRICS CARDS */}
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
            value: `+${metrics.totalUnitsInward}`,
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

      {/* 🔍 CONTROLS & ACTION BAR */}
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

            {/* Unified Two-Column Filter Trigger */}
            <PortalFilterMenu
              sections={purchaseFilterSections}
              onResetAll={handleResetPurchaseFilters}
              resultCount={filteredPurchases.length}
              resultLabel="purchases"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer whitespace-nowrap"
          >
            <FiPlus className="text-base" />
            <span>Record Purchase</span>
          </button>
        </div>

        <ActiveFilterChips
          sections={purchaseFilterSections}
          onResetAll={handleResetPurchaseFilters}
        />
      </div>

      {/* 📋 PURCHASES TABLE */}
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
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <FiTruck className="text-3xl mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-semibold">No purchase records found.</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Click &quot;Record Purchase&quot; to add procurement records and increase stock.
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
                      {/* PO # & Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-900 dark:text-white block">
                          #{po.purchaseNo}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                          <FiCalendar className="text-[10px]" />
                          {formattedDate}
                        </span>
                      </td>

                      {/* Supplier & Ref */}
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

                      {/* Items Procured Summary */}
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

                      {/* Inward Qty */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/25">
                          +{po.totalQuantity} units
                        </span>
                      </td>

                      {/* Total Cost */}
                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 dark:text-white whitespace-nowrap">
                        <AedPrice amount={po.totalAmount} />
                      </td>

                      {/* Payment Status Badge */}
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

                      {/* Actions */}
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

      {/* 📝 CREATE PURCHASE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 w-full max-w-2xl shadow-2xl my-6 text-left border border-slate-200/80 dark:border-slate-800 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Record Goods Purchase (Inward Stock)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Procured products will be immediately added to inventory stock.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={handleCreatePurchase}
              className="flex-1 overflow-y-auto py-4 space-y-4"
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
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 dark:focus:border-sky-500 font-semibold"
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
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 dark:focus:border-sky-500 font-mono"
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
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 dark:focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 dark:focus:border-sky-500 font-semibold cursor-pointer"
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
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 dark:focus:border-sky-500 font-semibold cursor-pointer"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Partial">Partial</option>
                  </select>
                </div>
              </div>

              {/* 📦 LINE ITEMS SECTION */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <FiLayers className="text-sky-600 dark:text-sky-400" />
                    <span>Inward Products</span>
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {lineItems.length} products added
                  </span>
                </div>

                {/* Add Item Row Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="sm:col-span-6">
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      Select Product *
                    </label>
                    <select
                      value={selectedSku}
                      onChange={(e) => handleSelectProduct(e.target.value)}
                      className="w-full py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 font-medium cursor-pointer"
                    >
                      <option value="">-- Choose from Catalog --</option>
                      {stock.map((s) => (
                        <option key={s.sku} value={s.sku}>
                          {s.name} ({s.sku}) - Cur: {s.quantity} units
                        </option>
                      ))}
                    </select>
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
                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      disabled={!selectedSku}
                      className="w-full py-1.5 px-3 bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Line Items List */}
                {lineItems.length > 0 && (
                  <div className="divide-y divide-slate-200/80 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
                    {lineItems.map((item, idx) => (
                      <div
                        key={item.sku}
                        className="p-2.5 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {item.name}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                            {item.sku}
                          </p>
                        </div>

                        <div className="text-right shrink-0 font-mono">
                          <span className="font-black text-emerald-700 dark:text-emerald-400">
                            +{item.quantity} units
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                            @ <AedPrice amount={item.unitCost} />
                          </span>
                        </div>

                        <div className="text-right shrink-0 font-mono font-black text-slate-900 dark:text-white w-24">
                          <AedPrice amount={item.totalCost} />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition cursor-pointer"
                          title="Remove item"
                        >
                          <FiTrash2 className="text-sm" />
                        </button>
                      </div>
                    ))}
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
                  placeholder="Optional notes or supplier terms..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs outline-none focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              {/* Order Total Footer Bar */}
              <div className="p-3 bg-slate-900 dark:bg-slate-950 border border-slate-800 text-white rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">
                    Total Inward Units:{" "}
                    <strong className="text-white font-mono">
                      +{modalTotalUnits} units
                    </strong>
                  </span>
                  <span className="text-xs text-slate-400">
                    Total Purchase Value:
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
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || lineItems.length === 0}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
                >
                  {isSubmitting ? "Recording Inwards..." : "Confirm & Inward Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📄 VIEW PURCHASE DETAILS / RECEIPT MODAL */}
      {viewingPurchase && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 w-full max-w-xl shadow-2xl my-6 text-left border border-slate-200/80 dark:border-slate-800">
            {/* Header */}
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

            {/* Supplier & Payment Details */}
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

            {/* Items Table */}
            <div className="py-4">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                Procured Line Items
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
                {(viewingPurchase.items || []).map((item) => (
                  <div
                    key={item.sku}
                    className="p-3 flex items-center justify-between gap-2 bg-white dark:bg-slate-950/50"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        {item.sku}
                      </p>
                    </div>

                    <div className="text-right font-mono">
                      <span className="font-black text-emerald-700 dark:text-emerald-400">
                        +{item.quantity} units
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                        @ <AedPrice amount={item.unitCost} />
                      </span>
                    </div>

                    <div className="text-right font-mono font-black text-slate-900 dark:text-white w-24">
                      <AedPrice amount={item.totalCost} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl flex items-center justify-between font-mono">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-sans block">
                  Total Procured:
                </span>
                <span className="font-black text-slate-900 dark:text-white">
                  +{viewingPurchase.totalQuantity} units
                </span>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-sans block">
                  Total Spend:
                </span>
                <span className="text-lg font-black text-slate-950 dark:text-white">
                  <AedPrice amount={viewingPurchase.totalAmount} />
                </span>
              </div>
            </div>

            {viewingPurchase.notes && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 italic">
                Note: {viewingPurchase.notes}
              </p>
            )}

            <div className="flex justify-end pt-4">
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
