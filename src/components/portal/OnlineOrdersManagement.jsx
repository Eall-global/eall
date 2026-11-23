import { useState, useMemo } from "react";
import {
  FiShoppingBag,
  FiClock,
  FiTruck,
  FiDollarSign,
  FiSearch,
  FiDownload,
  FiRefreshCw,
  FiEye,
  FiX,
  FiCheckCircle,
  FiMapPin,
  FiPhone,
  FiMail,
  FiCopy,
  FiCheck,
  FiMessageCircle,
  FiPrinter,
  FiPackage,
  FiCreditCard,
  FiAlertTriangle,
} from "react-icons/fi";
import {
  ORDER_STATUSES,
  COURIER_CARRIERS,
  updateOnlineOrder,
} from "../../services/orderService";
import { AedPrice, AedSymbol } from "../common/AedSymbol";
import { usePortalCurrency } from "../../context/PortalCurrencyContext";
import PortalKpiGrid from "./PortalKpiGrid";
import { PortalFilterMenu, ActiveFilterChips } from "./PortalFilterMenu";

const FULFILLMENT_STEPS = [
  "Order Placed",
  "Confirmed",
  "Packed",
  "Shipped",
  "Delivered",
];

const getStatusBadgeStyle = (status = "") => {
  const s = status.toLowerCase();
  if (s.includes("delivered")) {
    return "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/25";
  }
  if (s.includes("shipped")) {
    return "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/25";
  }
  if (s.includes("confirmed") || s.includes("packed")) {
    return "bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-500/25";
  }
  if (s.includes("cancel") || s.includes("return")) {
    return "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/25";
  }
  return "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/25";
};

const getStepIndex = (status) => {
  if (status === "Awaiting Wave Verification") return 0;
  return FULFILLMENT_STEPS.indexOf(status);
};

const OnlineOrdersManagement = ({
  orders = [],
  loading = false,
  onOrdersUpdated,
  onViewInvoice,
  currentUser,
}) => {
  const portalCur = usePortalCurrency();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [periodFilter, setPeriodFilter] = useState("all");

  // Slide-over Order Fulfillment Drawer state
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [editStatus, setEditStatus] = useState("");
  const [editCarrier, setEditCarrier] = useState("");
  const [editTracking, setEditTracking] = useState("");
  const [editPaymentVerified, setEditPaymentVerified] = useState(false);
  const [editCodCollected, setEditCodCollected] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [restoreStockOnCancel, setRestoreStockOnCancel] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(false);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.orderId === selectedOrderId) || null,
    [orders, selectedOrderId]
  );

  const openOrderDrawer = (order) => {
    setSelectedOrderId(order.orderId);
    setEditStatus(order.status || "Order Placed");
    setEditCarrier(order.carrier || "");
    setEditTracking(order.trackingNumber || "");
    setEditPaymentVerified(Boolean(order.paymentVerified));
    setEditCodCollected(Boolean(order.codCollected));
    setEditNotes(order.internalNotes || "");
    setRestoreStockOnCancel(true);
    setCopiedAddr(false);
  };

  // Distinct payment names
  const paymentMethods = useMemo(() => {
    const set = new Set();
    orders.forEach((o) => {
      if (o.paymentMethodName) set.add(o.paymentMethodName);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    return orders.filter((o) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const hit =
          (o.orderId || "").toLowerCase().includes(q) ||
          (o.customerName || "").toLowerCase().includes(q) ||
          (o.phone || "").toLowerCase().includes(q) ||
          (o.email || "").toLowerCase().includes(q) ||
          (o.city || "").toLowerCase().includes(q) ||
          (o.trackingNumber || "").toLowerCase().includes(q) ||
          (o.waveTransactionId || "").toLowerCase().includes(q);
        if (!hit) return false;
      }

      if (statusFilter !== "All" && o.status !== statusFilter) return false;
      if (
        paymentFilter !== "All" &&
        (o.paymentMethodName || "") !== paymentFilter
      ) {
        return false;
      }

      if (periodFilter === "today" && !(o.createdAt || "").startsWith(todayStr)) {
        return false;
      }
      if (periodFilter === "month") {
        const d = new Date(o.createdAt);
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) {
          return false;
        }
      }

      return true;
    });
  }, [orders, search, statusFilter, paymentFilter, periodFilter]);

  // Executive KPIs
  const metrics = useMemo(() => {
    const totalCount = orders.length;
    const pendingCount = orders.filter((o) =>
      ["Order Placed", "Awaiting Wave Verification", "Confirmed", "Packed"].includes(
        o.status
      )
    ).length;
    const fulfilledCount = orders.filter((o) =>
      ["Shipped", "Delivered"].includes(o.status)
    ).length;
    const onlineRevenue = orders
      .filter((o) => o.status !== "Cancelled" && o.status !== "Returned")
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    return { totalCount, pendingCount, fulfilledCount, onlineRevenue };
  }, [orders]);

  // Unified Two-Column Filter Menu
  const filterSections = useMemo(
    () => [
      {
        id: "status",
        label: "Status",
        value: statusFilter,
        defaultValue: "All",
        onChange: setStatusFilter,
        options: [
          { value: "All", label: "All Statuses", count: orders.length },
          ...ORDER_STATUSES.map((st) => ({
            value: st,
            label: st,
            count: orders.filter((o) => o.status === st).length,
          })),
        ],
      },
      {
        id: "payment",
        label: "Payment",
        value: paymentFilter,
        defaultValue: "All",
        onChange: setPaymentFilter,
        options: [
          { value: "All", label: "All Methods", count: orders.length },
          ...paymentMethods.map((pm) => ({
            value: pm,
            label: pm,
            count: orders.filter((o) => o.paymentMethodName === pm).length,
          })),
        ],
      },
      {
        id: "period",
        label: "Period",
        value: periodFilter,
        defaultValue: "all",
        onChange: setPeriodFilter,
        options: [
          { value: "all", label: "All Time", count: orders.length },
          { value: "month", label: "This Month" },
          { value: "today", label: "Today" },
        ],
      },
    ],
    [orders, statusFilter, paymentFilter, periodFilter, paymentMethods]
  );

  const handleResetFilters = () => {
    setStatusFilter("All");
    setPaymentFilter("All");
    setPeriodFilter("all");
  };

  const handleSaveFulfillment = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSaving(true);
    try {
      await updateOnlineOrder(selectedOrder.orderId, {
        status: editStatus,
        carrier: editCarrier,
        trackingNumber: editTracking,
        paymentVerified: editPaymentVerified,
        codCollected: editCodCollected,
        internalNotes: editNotes,
        restoreStock:
          restoreStockOnCancel &&
          (editStatus === "Cancelled" || editStatus === "Returned"),
        updatedBy: currentUser?.name || "Staff",
      });
      if (onOrdersUpdated) onOrdersUpdated();
      setSelectedOrderId(null);
    } catch (err) {
      alert(err.message || "Could not update order.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyAddress = (order) => {
    const full = [
      order.customerName,
      order.phone,
      order.shippingAddress,
      `${order.city}, ${order.country}`,
    ]
      .filter(Boolean)
      .join("\n");
    navigator.clipboard.writeText(full).catch(() => { });
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  const handleWhatsAppUpdate = (order) => {
    const cleanPhone = (order.phone || "").replace(/[^0-9]/g, "");
    const msg =
      `Hello ${order.customerName},\n` +
      `Update on your *E-ALL Order ${order.orderId}*:\n` +
      `*Status:* ${editStatus || order.status}\n` +
      (editCarrier ? `*Courier:* ${editCarrier}\n` : "") +
      (editTracking ? `*Tracking #:* ${editTracking}\n` : "") +
      `*Order Total:* ${order.currency || portalCur.currency} ${Number(order.total).toLocaleString(portalCur.locale, { minimumFractionDigits: portalCur.decimals, maximumFractionDigits: portalCur.decimals })}\n\n` +
      `Thank you for shopping with E-ALL Electronics!`;
    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
  };

  const handleExportCSV = () => {
    if (filteredOrders.length === 0) return;
    const headers = [
      "Order ID",
      "Date",
      "Customer",
      "Phone",
      "City",
      "Country",
      "Payment Method",
      "Wave TxID",
      `Subtotal (${portalCur.currency})`,
      `Discount (${portalCur.currency})`,
      `Total (${portalCur.currency})`,
      "Fulfillment Status",
      "Courier",
      "Tracking No",
    ];
    const rows = filteredOrders.map((o) => [
      o.orderId,
      new Date(o.createdAt).toLocaleDateString("en-GB"),
      `"${(o.customerName || "").replace(/"/g, '""')}"`,
      `"${o.phone || ""}"`,
      `"${o.city || ""}"`,
      `"${o.country || ""}"`,
      `"${o.paymentMethodName || ""}"`,
      `"${o.waveTransactionId || ""}"`,
      Number(o.subtotal || 0).toFixed(2),
      Number(o.discountAmount || 0).toFixed(2),
      Number(o.total || 0).toFixed(2),
      `"${o.status || ""}"`,
      `"${o.carrier || ""}"`,
      `"${o.trackingNumber || ""}"`,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `EALL_Online_Orders_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isCancelOrReturn =
    editStatus === "Cancelled" || editStatus === "Returned";

  return (
    <div className="space-y-4 sm:space-y-5 text-left">
      {/* KPI Grid */}
      <PortalKpiGrid
        items={[
          {
            id: "total-orders",
            label: "Online Orders",
            value: metrics.totalCount,
            icon: FiShoppingBag,
            tone: "sky",
          },
          {
            id: "pending-orders",
            label: "In Progress",
            value: metrics.pendingCount,
            icon: FiClock,
            tone: "amber",
          },
          {
            id: "fulfilled",
            label: "Shipped / Done",
            value: metrics.fulfilledCount,
            icon: FiTruck,
            tone: "emerald",
          },
          {
            id: "online-rev",
            label: "Online Revenue",
            value: (
              <AedPrice
                amount={Math.round(metrics.onlineRevenue)}
                decimals={0}
                className="font-mono font-black text-indigo-900 dark:text-indigo-300"
              />
            ),
            icon: FiDollarSign,
            tone: "indigo",
          },
        ]}
      />

      {/* Unified Search, Filter & Action Bar */}
      <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative flex-1 min-w-0">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-base" />
            <input
              type="text"
              placeholder="Search by order #, customer, phone, city, Wave TxID, or tracking #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 dark:focus:border-sky-500 transition"
            />
          </div>

          <PortalFilterMenu
            sections={filterSections}
            onResetAll={handleResetFilters}
            resultCount={filteredOrders.length}
            resultLabel="orders"
          />

          {onOrdersUpdated && (
            <button
              type="button"
              onClick={onOrdersUpdated}
              disabled={loading}
              aria-label="Refresh online orders"
              title="Refresh Online Orders"
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer disabled:opacity-50 shrink-0"
            >
              <FiRefreshCw className={`text-[15px] ${loading ? "animate-spin" : ""}`} />
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredOrders.length === 0}
            aria-label="Export CSV"
            title="Export online orders as CSV"
            className="inline-flex items-center justify-center gap-1.5 w-10 h-10 md:w-auto md:px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer disabled:opacity-40 shrink-0"
          >
            <FiDownload className="text-[16px] md:text-sm" />
            <span className="hidden md:inline">Export CSV</span>
          </button>
        </div>

        <ActiveFilterChips
          sections={filterSections}
          onResetAll={handleResetFilters}
        />
      </div>

      {/* Orders Fulfillment Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-800/70 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 whitespace-nowrap">Order # &amp; Date</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Customer &amp; City</th>
                <th className="py-3.5 px-3">Items</th>
                <th className="py-3.5 px-3 whitespace-nowrap">Payment</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Total (<AedSymbol />)</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">Fulfillment</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium text-slate-700 dark:text-slate-300">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-16 text-center text-slate-400 dark:text-slate-500"
                  >
                    <FiShoppingBag className="text-3xl mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                      No online orders match your criteria
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Orders submitted from the public storefront checkout appear here in real time.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.orderId}
                    onClick={() => openOrderDrawer(order)}
                    className="hover:bg-sky-50/50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                  >
                    {/* Order # & Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-sky-800 dark:text-sky-400 block text-xs sm:text-sm">
                        {order.orderId}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                        {new Date(order.createdAt).toLocaleDateString("en-GB")} •{" "}
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>

                    {/* Customer & Location */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                        {order.customerName}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {order.city}, {order.country}
                      </p>
                    </td>

                    {/* Items */}
                    <td className="py-3.5 px-3 text-xs max-w-[220px] truncate">
                      {(order.items || [])
                        .map((i) => `${i.name || i.title || "Item"} (x${i.quantity || 1})`)
                        .join(", ") || "—"}
                    </td>

                    {/* Payment + Wave/COD badge */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold">
                        {order.paymentMethodName}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        {order.paymentMethod === "cod" && (
                          <span
                            className={`text-[10px] font-bold ${order.codCollected
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-amber-600 dark:text-amber-400"
                              }`}
                          >
                            {order.codCollected ? "COD Settled" : "COD Pending"}
                          </span>
                        )}
                        {order.waveTransactionId && (
                          <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400">
                            Tx: {order.waveTransactionId}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Total */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      <AedPrice amount={order.total} />
                    </td>

                    {/* Fulfillment Status */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${getStatusBadgeStyle(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                      {order.trackingNumber && (
                        <span className="block text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                          {order.trackingNumber}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td
                      className="py-3.5 px-4 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openOrderDrawer(order)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-500/15 hover:bg-sky-100 dark:hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 text-xs font-semibold transition cursor-pointer"
                        >
                          <FiEye className="text-xs" />
                          <span>Fulfill</span>
                        </button>
                        {onViewInvoice && (
                          <button
                            type="button"
                            onClick={() => onViewInvoice(order)}
                            className="p-1.5 text-slate-400 hover:text-sky-700 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-500/15 rounded-lg transition cursor-pointer"
                            title="View / Print A4 Tax Invoice"
                          >
                            <FiPrinter className="text-sm" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ORDER FULFILLMENT SLIDE-OVER DRAWER */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end text-left">
          <div
            onClick={() => setSelectedOrderId(null)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px]"
          />
          <aside
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full sm:w-[560px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 bg-slate-50/90 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-black font-mono text-slate-900 dark:text-white">
                    {selectedOrder.orderId}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeStyle(
                      selectedOrder.status
                    )}`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Placed {new Date(selectedOrder.createdAt).toLocaleString("en-GB")}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {onViewInvoice && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = selectedOrder;
                      setSelectedOrderId(null);
                      onViewInvoice(target);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    <FiPrinter className="text-xs" />
                    <span>Invoice</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedOrderId(null)}
                  className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <FiX className="text-lg" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <form
              onSubmit={handleSaveFulfillment}
              className="flex-1 overflow-y-auto p-5 space-y-5"
            >
              {/* Visual 5-Step Progress Indicator */}
              {!isCancelOrReturn && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                  <div className="grid grid-cols-5 gap-1">
                    {FULFILLMENT_STEPS.map((step, idx) => {
                      const activeIdx = getStepIndex(editStatus);
                      const isDone = activeIdx >= idx;
                      return (
                        <button
                          key={step}
                          type="button"
                          onClick={() => setEditStatus(step)}
                          className="flex flex-col items-center gap-1.5 cursor-pointer group"
                        >
                          <span
                            className={`w-full h-1.5 rounded-full transition-colors ${isDone
                              ? "bg-sky-600 dark:bg-sky-400"
                              : "bg-slate-200 dark:bg-slate-700 group-hover:bg-slate-300"
                              }`}
                          />
                          <span
                            className={`text-[10px] font-bold text-center leading-tight ${isDone
                              ? "text-sky-700 dark:text-sky-300"
                              : "text-slate-400 dark:text-slate-500"
                              }`}
                          >
                            {step.replace("Order ", "")}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Customer & Shipping Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">
                      {selectedOrder.customerName}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-slate-500 dark:text-slate-400 mt-1">
                      {selectedOrder.phone && (
                        <span className="inline-flex items-center gap-1 font-mono">
                          <FiPhone className="text-[11px]" /> {selectedOrder.phone}
                        </span>
                      )}
                      {selectedOrder.email && (
                        <span className="inline-flex items-center gap-1">
                          <FiMail className="text-[11px]" /> {selectedOrder.email}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyAddress(selectedOrder)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:border-sky-400 cursor-pointer shrink-0"
                  >
                    {copiedAddr ? (
                      <>
                        <FiCheck className="text-emerald-600" /> Copied
                      </>
                    ) : (
                      <>
                        <FiCopy /> Copy
                      </>
                    )}
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700 flex items-start gap-2 text-slate-700 dark:text-slate-300">
                  <FiMapPin className="text-sky-600 dark:text-sky-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">
                      {selectedOrder.shippingAddress || "No street address provided"}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {[selectedOrder.city, selectedOrder.country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Fulfillment Controls */}
              <div className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold uppercase text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                      Order Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-semibold outline-none focus:border-sky-600 cursor-pointer"
                    >
                      {ORDER_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold uppercase text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                      Courier / Delivery Fleet
                    </label>
                    <select
                      value={editCarrier}
                      onChange={(e) => setEditCarrier(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-semibold outline-none focus:border-sky-600 cursor-pointer"
                    >
                      <option value="">-- Select Carrier --</option>
                      {COURIER_CARRIERS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                    AWB / Tracking Reference Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ARX-994028114"
                    value={editTracking}
                    onChange={(e) => setEditTracking(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-mono outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600"
                  />
                </div>

                {/* Payment / Wave / COD Settlement Checkboxes */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <FiCreditCard className="text-sky-600 dark:text-sky-400" />
                      <span>Payment: {selectedOrder.paymentMethodName}</span>
                    </span>
                    {selectedOrder.waveTransactionId && (
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 font-bold">
                        Wave ID: {selectedOrder.waveTransactionId}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 pt-1">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                      <input
                        type="checkbox"
                        checked={editPaymentVerified}
                        onChange={(e) => setEditPaymentVerified(e.target.checked)}
                        className="rounded text-sky-600 cursor-pointer"
                      />
                      <span>Payment Verified</span>
                    </label>

                    {selectedOrder.paymentMethod === "cod" && (
                      <label className="inline-flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                        <input
                          type="checkbox"
                          checked={editCodCollected}
                          onChange={(e) => setEditCodCollected(e.target.checked)}
                          className="rounded text-emerald-600 cursor-pointer"
                        />
                        <span>COD Cash Collected</span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Restore Stock Option on Cancel/Return */}
                {isCancelOrReturn && !selectedOrder.stockRestored && (
                  <label className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={restoreStockOnCancel}
                      onChange={(e) => setRestoreStockOnCancel(e.target.checked)}
                      className="mt-0.5 rounded text-amber-600 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1">
                        <FiAlertTriangle className="text-xs" /> Restore {(selectedOrder.items || []).length} SKU line(s) back into active stock
                      </span>
                      <span className="block text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-0.5">
                        Automatically increments inventory quantities when saving this cancellation/return.
                      </span>
                    </div>
                  </label>
                )}

                {selectedOrder.stockRestored && (
                  <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <FiCheckCircle /> Stock for this order was already restored to inventory.
                  </p>
                )}

                {/* Internal Notes */}
                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                    Fulfillment / Dispatch Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Warehouse packing notes, delivery timing, IMEI batch..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600"
                  />
                </div>
              </div>

              {/* Ordered Items List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <FiPackage className="text-sky-600 dark:text-sky-400" />
                  <span>Ordered Items ({(selectedOrder.items || []).length})</span>
                </h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
                  {(selectedOrder.items || []).map((item, idx) => (
                    <div
                      key={`${item.sku || idx}-${idx}`}
                      className="p-3 flex items-center justify-between gap-2 bg-white dark:bg-slate-950/40"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate">
                          {item.name || item.title || "Item"}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400">
                          {item.sku || "SKU N/A"} • Qty: {item.quantity || 1}
                        </p>
                      </div>
                      <AedPrice
                        amount={
                          Number(item.price ?? item.unitPrice ?? 0) *
                          (Number(item.quantity) || 1)
                        }
                        className="font-mono font-bold text-slate-900 dark:text-white shrink-0"
                      />
                    </div>
                  ))}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between font-bold text-slate-900 dark:text-white">
                    <span>Order Grand Total</span>
                    <AedPrice
                      amount={selectedOrder.total}
                      className="font-mono font-black text-sm text-sky-800 dark:text-sky-300"
                    />
                  </div>
                </div>
              </div>

              {/* Drawer Footer Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleWhatsAppUpdate(selectedOrder)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-500/25 text-xs font-bold transition cursor-pointer"
                >
                  <FiMessageCircle className="text-sm" />
                  <span>WhatsApp Update</span>
                </button>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedOrderId(null)}
                    className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 transition cursor-pointer"
                  >
                    {saving ? "Saving..." : "Save Fulfillment"}
                  </button>
                </div>
              </div>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
};

export default OnlineOrdersManagement;

