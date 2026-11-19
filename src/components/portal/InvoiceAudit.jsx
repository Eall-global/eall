import { useState, useMemo } from "react";
import {
  FiSearch,
  FiFileText,
  FiPrinter,
  FiDownload,
  FiDollarSign,
  FiTrendingUp,
  FiCalendar,
  FiPercent,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiMinus,
  FiCheckCircle,
  FiAlertTriangle,
  FiX,
  FiUser,
  FiPhone,
  FiMail,
} from "react-icons/fi";
import { updateInvoice, deleteInvoice } from "../../services/billingService";
import { useStaffAuth } from "../../context/StaffAuthContext";
import { AedPrice } from "../common/AedSymbol";
import PortalKpiGrid from "./PortalKpiGrid";
import { PortalFilterMenu, ActiveFilterChips } from "./PortalFilterMenu";

const InvoiceAudit = ({
  invoices = [],
  stock = [],
  onSelectInvoice,
  onViewInvoice,
  onInvoicesChanged,
  onInvoicesUpdated,
}) => {
  const { currentUser, isAdmin } = useStaffAuth();
  const handleViewInvoice = onViewInvoice || onSelectInvoice;
  const notifyInvoicesChanged = () => {
    if (onInvoicesUpdated) onInvoicesUpdated();
    if (onInvoicesChanged) onInvoicesChanged();
  };

  const [search, setSearch] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("all"); // all, today, month
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("All");

  // Edit Modal State
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editProductSearch, setEditProductSearch] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete / Void Modal State
  const [deletingInvoice, setDeletingInvoice] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    let list = [...invoices];

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (inv) =>
          inv.invoiceNo.toLowerCase().includes(q) ||
          inv.customerName.toLowerCase().includes(q) ||
          inv.customerPhone.includes(q) ||
          inv.createdBy?.toLowerCase().includes(q)
      );
    }

    // Period filter
    const now = new Date();
    if (filterPeriod === "today") {
      const todayStr = now.toISOString().split("T")[0];
      list = list.filter((inv) => inv.createdAt.startsWith(todayStr));
    } else if (filterPeriod === "month") {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      list = list.filter((inv) => {
        const d = new Date(inv.createdAt);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
    }

    // Payment Method filter
    if (paymentMethodFilter !== "All") {
      list = list.filter((inv) => (inv.paymentMethod || "") === paymentMethodFilter);
    }

    return list;
  }, [invoices, search, filterPeriod, paymentMethodFilter]);

  const invoiceFilterSections = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const todayCount = invoices.filter((inv) =>
      (inv.createdAt || "").startsWith(todayStr)
    ).length;
    const monthCount = invoices.filter((inv) => {
      const d = new Date(inv.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    const existingMethods = Array.from(
      new Set(invoices.map((i) => i.paymentMethod).filter(Boolean))
    );
    const allMethods = Array.from(
      new Set(["Cash", "Card", "Bank Transfer", "Credit Term", ...existingMethods])
    );

    return [
      {
        id: "period",
        label: "Period",
        value: filterPeriod,
        defaultValue: "all",
        onChange: setFilterPeriod,
        options: [
          { value: "all", label: "All Time", count: invoices.length },
          { value: "month", label: "This Month", count: monthCount },
          { value: "today", label: "Today", count: todayCount },
        ],
      },
      {
        id: "payment",
        label: "Payment",
        value: paymentMethodFilter,
        defaultValue: "All",
        onChange: setPaymentMethodFilter,
        options: [
          { value: "All", label: "All Methods", count: invoices.length },
          ...allMethods.map((m) => ({
            value: m,
            label: m,
            count: invoices.filter((i) => i.paymentMethod === m).length,
          })),
        ],
      },
    ];
  }, [invoices, filterPeriod, paymentMethodFilter]);

  const handleResetInvoiceFilters = () => {
    setFilterPeriod("all");
    setPaymentMethodFilter("All");
  };

  // Financial Metrics
  const metrics = useMemo(() => {
    const totalCount = invoices.length;
    const totalRevenue = invoices.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);
    const totalVat = invoices.reduce((sum, i) => sum + (Number(i.vatAmount) || 0), 0);

    const todayStr = new Date().toISOString().split("T")[0];
    const todayRevenue = invoices
      .filter((i) => i.createdAt.startsWith(todayStr))
      .reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);

    return { totalCount, totalRevenue, totalVat, todayRevenue };
  }, [invoices]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredInvoices.length === 0) return;

    const headers = [
      "Invoice No",
      "Date",
      "Customer Name",
      "Customer Phone",
      "Customer TRN",
      "Payment Method",
      "Subtotal (AED)",
      "Discount (AED)",
      "VAT Amount (AED)",
      "Total Amount (AED)",
      "Issued By",
    ];

    const rows = filteredInvoices.map((inv) => [
      inv.invoiceNo,
      new Date(inv.createdAt).toLocaleDateString("en-GB"),
      `"${inv.customerName.replace(/"/g, '""')}"`,
      `"${inv.customerPhone}"`,
      `"${inv.customerTrn || ""}"`,
      inv.paymentMethod,
      inv.subtotal.toFixed(2),
      inv.discount.toFixed(2),
      inv.vatAmount.toFixed(2),
      inv.totalAmount.toFixed(2),
      `"${inv.createdBy}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `EALL_Invoices_Audit_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Edit Modal
  const handleOpenEdit = (inv) => {
    setEditingInvoice(inv);
    setEditForm({
      customerName: inv.customerName,
      customerPhone: inv.customerPhone,
      customerEmail: inv.customerEmail || "",
      customerTrn: inv.customerTrn || "",
      paymentMethod: inv.paymentMethod || "Cash",
      items: JSON.parse(JSON.stringify(inv.items || [])),
      vatRate: inv.vatRate ?? 5,
      discount: inv.discount || 0,
      notes: inv.notes || "",
    });
    setEditError("");
  };

  // Adjust item quantity in edit form
  const handleEditQty = (sku, delta) => {
    setEditForm((prev) => {
      const nextItems = prev.items
        .map((item) => {
          if (item.sku === sku) {
            const nextQ = item.quantity + delta;
            return nextQ > 0 ? { ...item, quantity: nextQ } : null;
          }
          return item;
        })
        .filter(Boolean);
      return { ...prev, items: nextItems };
    });
  };

  const handleEditRemoveItem = (sku) => {
    setEditForm((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.sku !== sku),
    }));
  };

  const handleEditAddProduct = (prod) => {
    setEditForm((prev) => {
      const existing = prev.items.find((i) => i.sku === prod.sku);
      if (existing) {
        return {
          ...prev,
          items: prev.items.map((i) =>
            i.sku === prod.sku ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return {
        ...prev,
        items: [
          ...prev.items,
          {
            sku: prod.sku,
            name: prod.name,
            brand: prod.brand,
            quantity: 1,
            unitPrice: Number(prod.price) || 0,
          },
        ],
      };
    });
    setEditProductSearch("");
  };

  // Submit Edit Invoice
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.items || editForm.items.length === 0) {
      setEditError("Invoice must have at least one product item.");
      return;
    }

    setSavingEdit(true);
    setEditError("");

    try {
      await updateInvoice(editingInvoice.invoiceNo, {
        ...editForm,
        updatedBy: currentUser?.name || "Staff",
      });

      setEditingInvoice(null);
      notifyInvoicesChanged();
    } catch (err) {
      setEditError(err.message || "Failed to update invoice");
    } finally {
      setSavingEdit(false);
    }
  };

  // Submit Delete / Void Invoice
  const handleConfirmDelete = async () => {
    if (!deletingInvoice) return;
    setDeleting(true);

    try {
      await deleteInvoice(deletingInvoice.invoiceNo);
      setDeletingInvoice(null);
      notifyInvoicesChanged();
    } catch (err) {
      alert("Failed to delete invoice: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Edit Form Subtotal & Grand Total calculation
  const editSubtotal = useMemo(() => {
    if (!editForm?.items) return 0;
    return editForm.items.reduce((s, i) => s + (i.unitPrice || 0) * (i.quantity || 0), 0);
  }, [editForm]);

  const editDiscounted = Math.max(0, editSubtotal - (Number(editForm?.discount) || 0));
  const editVat = (editDiscounted * (Number(editForm?.vatRate) || 0)) / 100;
  const editGrandTotal = editDiscounted + editVat;

  return (
    <div className="space-y-4 sm:space-y-5 text-left">
      
      {/* 📊 SUMMARY METRICS CARDS */}
      <PortalKpiGrid
        items={[
          {
            id: "invoices",
            label: "Total Invoices",
            value: metrics.totalCount,
            subtitle: "Recorded bills",
            icon: FiFileText,
            tone: "sky",
          },
          {
            id: "revenue",
            label: "Total Revenue",
            value: (
              <AedPrice
                amount={Math.round(metrics.totalRevenue)}
                decimals={0}
                className="font-mono font-black text-emerald-900 dark:text-emerald-400"
              />
            ),
            subtitle: "Cumulative sales",
            icon: FiDollarSign,
            tone: "emerald",
          },
          {
            id: "today",
            label: "Today's Sales",
            value: (
              <AedPrice
                amount={Math.round(metrics.todayRevenue)}
                decimals={0}
                className="font-mono font-black text-indigo-900 dark:text-indigo-300"
              />
            ),
            subtitle: "Generated today",
            icon: FiTrendingUp,
            tone: "indigo",
          },
          {
            id: "vat",
            label: "VAT Collected",
            value: (
              <AedPrice
                amount={Math.round(metrics.totalVat)}
                decimals={0}
                className="font-mono font-black text-purple-900 dark:text-purple-300"
              />
            ),
            subtitle: "5% Tax element",
            icon: FiPercent,
            tone: "purple",
          },
        ]}
      />

      {/* 🔍 SEARCH, FILTER & ACTION BAR */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by invoice #, customer, phone, staff..."
              className="w-full h-10 pl-9 pr-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl text-xs sm:text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 dark:focus:border-sky-500 outline-none"
            />
          </div>

          {/* Unified Two-Column Filter Trigger */}
          <PortalFilterMenu
            sections={invoiceFilterSections}
            onResetAll={handleResetInvoiceFilters}
            resultCount={filteredInvoices.length}
            resultLabel="invoices"
          />

          {/* Export CSV (Icon-only on mobile, icon + label on desktop) */}
          <button
            type="button"
            onClick={handleExportCSV}
            aria-label="Export CSV"
            title="Download CSV report"
            className="inline-flex items-center justify-center gap-1.5 w-10 h-10 md:w-auto md:px-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0"
          >
            <FiDownload className="text-[16px] md:text-sm" />
            <span className="hidden md:inline">Export CSV</span>
          </button>
        </div>

        <ActiveFilterChips
          sections={invoiceFilterSections}
          onResetAll={handleResetInvoiceFilters}
        />
      </div>

      {/* 📋 INVOICE AUDIT TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        {filteredInvoices.length === 0 ? (
          <div className="py-20 text-center text-slate-400 dark:text-slate-500">
            <FiFileText className="mx-auto text-4xl mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No invoices match your criteria</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Sales invoices created in the Billing POS section will be audited here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/90 dark:bg-slate-800/70">
                  <th className="py-3.5 px-4 whitespace-nowrap">Invoice #</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Date &amp; Time</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Customer</th>
                  <th className="py-3.5 px-3">Items Summary</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Payment</th>
                  <th className="py-3.5 px-3 text-right whitespace-nowrap">Total (AED)</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium text-slate-700 dark:text-slate-300">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.invoiceNo} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                    
                    {/* Invoice No */}
                    <td className="py-3.5 px-4 whitespace-nowrap min-w-[130px]">
                      <button
                        type="button"
                        onClick={() => handleViewInvoice && handleViewInvoice(inv)}
                        className="font-mono font-bold text-sky-800 dark:text-sky-400 hover:text-sky-950 dark:hover:text-sky-300 hover:underline cursor-pointer text-xs sm:text-sm tracking-tight whitespace-nowrap block"
                      >
                        {inv.invoiceNo}
                      </button>
                      <div className="flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[130px]" title={inv.createdBy}>
                          By {inv.createdBy}
                        </span>
                        {inv.updatedAt && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/25 font-bold shrink-0">
                            Edited
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-3 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap min-w-[100px]">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {new Date(inv.createdAt).toLocaleDateString("en-GB")}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                        {new Date(inv.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-3 whitespace-nowrap min-w-[120px]">
                      <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">{inv.customerName}</p>
                      <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500">{inv.customerPhone}</p>
                    </td>

                    {/* Items Summary */}
                    <td className="py-3.5 px-3 text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate min-w-[150px]">
                      {inv.items?.map((item) => `${item.name} (x${item.quantity})`).join(", ")}
                    </td>

                    {/* Payment */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {inv.paymentMethod}
                      </span>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white text-xs sm:text-sm whitespace-nowrap">
                      AED {Number(inv.totalAmount).toLocaleString("en-AE", { minimumFractionDigits: 2 })}
                    </td>

                    {/* Actions: View/Print, Edit, Delete */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* View / Print A4 Document */}
                        <button
                          type="button"
                          onClick={() => handleViewInvoice && handleViewInvoice(inv)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-sky-50 dark:bg-sky-500/15 hover:bg-sky-100 dark:hover:bg-sky-500/25 text-sky-800 dark:text-sky-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                          title="View and Print A4 Invoice"
                        >
                          <FiPrinter className="text-xs" />
                          <span>View / Print</span>
                        </button>

                        {/* Edit Invoice */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(inv)}
                          className="p-1.5 text-slate-400 hover:text-sky-700 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-500/15 rounded-lg transition cursor-pointer"
                          title="Edit Invoice & Reconcile Stock"
                        >
                          <FiEdit2 className="text-sm" />
                        </button>

                        {/* Delete / Void (Admin Only) */}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => setDeletingInvoice(inv)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 rounded-lg transition cursor-pointer"
                            title="Delete / Void Invoice (Restores Stock)"
                          >
                            <FiTrash2 className="text-sm" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ✏️ MODAL: EDIT INVOICE (AUTO-RECONCILES STOCK DELTAS) */}
      {editingInvoice && editForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-5 my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FiEdit2 className="text-sky-700 dark:text-sky-400" />
                  <span>Edit Invoice {editingInvoice.invoiceNo}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Modifying quantities will automatically adjust your inventory stock.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditingInvoice(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg text-lg cursor-pointer"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-left">
              
              {/* Customer Info Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.customerName}
                    onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 dark:focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={editForm.customerPhone}
                    onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-mono focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 dark:focus:border-sky-500 outline-none"
                  />
                </div>
              </div>

              {/* TRN & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">TRN / Tax ID</label>
                  <input
                    type="text"
                    value={editForm.customerTrn}
                    onChange={(e) => setEditForm({ ...editForm, customerTrn: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-mono focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 dark:focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
                  <select
                    value={editForm.paymentMethod}
                    onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 dark:focus:border-sky-500 outline-none"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Bank Transfer">Bank Wire / Transfer</option>
                    <option value="Credit Term">Credit Account (30 Days)</option>
                  </select>
                </div>
              </div>

              {/* Items List in Modal */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Invoice Items ({editForm.items.length})
                </label>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
                  {editForm.items.map((item) => (
                    <div key={item.sku} className="p-3 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/50">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 dark:text-white text-xs truncate">{item.name}</p>
                        <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{item.sku} • AED {item.unitPrice}</p>
                      </div>

                      {/* Stepper */}
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => handleEditQty(item.sku, -1)}
                          className="w-5 h-5 flex items-center justify-center rounded text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          <FiMinus />
                        </button>
                        <span className="w-6 text-center font-mono font-bold text-xs text-slate-900 dark:text-white">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleEditQty(item.sku, 1)}
                          className="w-5 h-5 flex items-center justify-center rounded text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          <FiPlus />
                        </button>
                      </div>

                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white w-20 text-right">
                        AED {(item.unitPrice * item.quantity).toLocaleString()}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleEditRemoveItem(item.sku)}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 cursor-pointer"
                      >
                        <FiTrash2 className="text-sm" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Product Search Dropdown inside edit modal */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Add Product to Invoice</label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-xs" />
                  <input
                    type="text"
                    value={editProductSearch}
                    onChange={(e) => setEditProductSearch(e.target.value)}
                    placeholder="Search catalog to add item..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 dark:focus:border-sky-500"
                  />
                </div>

                {editProductSearch.trim() && (
                  <div className="mt-1 border border-slate-200 dark:border-slate-700 rounded-xl max-h-32 overflow-y-auto bg-white dark:bg-slate-900 shadow-md divide-y divide-slate-100 dark:divide-slate-800">
                    {stock
                      .filter((s) =>
                        s.name.toLowerCase().includes(editProductSearch.toLowerCase()) ||
                        s.sku.toLowerCase().includes(editProductSearch.toLowerCase())
                      )
                      .slice(0, 5)
                      .map((prod) => (
                        <button
                          key={prod.sku}
                          type="button"
                          onClick={() => handleEditAddProduct(prod)}
                          className="w-full flex items-center justify-between p-2 text-left hover:bg-sky-50 dark:hover:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 cursor-pointer"
                        >
                          <span className="font-medium truncate">{prod.name} ({prod.sku})</span>
                          <span className="font-mono font-bold text-sky-800 dark:text-sky-400 shrink-0">AED {prod.price}</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Discount & Totals in modal */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">AED {editSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Discount (AED):</span>
                  <input
                    type="number"
                    min="0"
                    value={editForm.discount}
                    onChange={(e) => setEditForm({ ...editForm, discount: e.target.value })}
                    className="w-20 text-right py-0.5 px-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono font-bold text-rose-600 dark:text-rose-400"
                  />
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>VAT ({editForm.vatRate}%):</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">AED {editVat.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-sm font-extrabold text-slate-900 dark:text-white">
                  <span>Grand Total:</span>
                  <span className="font-mono text-sky-800 dark:text-sky-300 text-base">AED {editGrandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Error in modal */}
              {editError && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/25 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
                  <FiAlertTriangle className="shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingInvoice(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  {savingEdit ? "Updating..." : "Save Changes & Reconcile Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🗑️ MODAL: DELETE / VOID INVOICE CONFIRMATION */}
      {deletingInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 text-left">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 bg-rose-50 dark:bg-rose-500/15 rounded-2xl">
                <FiAlertTriangle className="text-2xl" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Void &amp; Delete Invoice?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{deletingInvoice.invoiceNo}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Deleting this invoice will permanently remove it from the audit ledger and automatically restore all{" "}
              <strong>{deletingInvoice.items?.length || 0}</strong> product items back into active stock.
            </p>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1 text-slate-800 dark:text-slate-200">
              <p><span className="text-slate-400 dark:text-slate-500">Customer:</span> <strong>{deletingInvoice.customerName}</strong></p>
              <p><span className="text-slate-400 dark:text-slate-500">Amount:</span> <strong className="font-mono">AED {Number(deletingInvoice.totalAmount).toLocaleString()}</strong></p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingInvoice(null)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                {deleting ? "Restoring Stock..." : "Yes, Void & Restore Stock"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceAudit;
