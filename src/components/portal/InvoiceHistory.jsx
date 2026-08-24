import { useState, useMemo } from "react";
import {
  FiSearch,
  FiFileText,
  FiPrinter,
  FiDollarSign,
  FiCalendar,
  FiEye,
  FiDownload,
} from "react-icons/fi";

const InvoiceHistory = ({ invoices = [], onSelectInvoice }) => {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // all | today | month

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          inv.invoiceNo.toLowerCase().includes(q) ||
          inv.customerName.toLowerCase().includes(q) ||
          inv.customerPhone.toLowerCase().includes(q) ||
          inv.createdBy?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Date Filter
      if (dateFilter === "today") {
        const invDate = new Date(inv.createdAt).toDateString();
        const today = new Date().toDateString();
        if (invDate !== today) return false;
      } else if (dateFilter === "month") {
        const invDate = new Date(inv.createdAt);
        const now = new Date();
        if (
          invDate.getMonth() !== now.getMonth() ||
          invDate.getFullYear() !== now.getFullYear()
        )
          return false;
      }

      return true;
    });
  }, [invoices, search, dateFilter]);

  // Financial Metrics
  const stats = useMemo(() => {
    const totalCount = invoices.length;
    const totalRevenue = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalVat = invoices.reduce((sum, i) => sum + i.vatAmount, 0);

    const todayStr = new Date().toDateString();
    const todayInvoices = invoices.filter(
      (i) => new Date(i.createdAt).toDateString() === todayStr
    );
    const todayRevenue = todayInvoices.reduce((sum, i) => sum + i.totalAmount, 0);

    return { totalCount, totalRevenue, totalVat, todayRevenue };
  }, [invoices]);

  const handleExportInvoicesCSV = () => {
    const headers = [
      "Invoice No",
      "Date",
      "Customer Name",
      "Customer Phone",
      "Items Count",
      "Payment Method",
      "Subtotal",
      "VAT",
      "Total (AED)",
      "Created By",
    ];

    const rows = filteredInvoices.map((inv) => [
      `"${inv.invoiceNo}"`,
      `"${new Date(inv.createdAt).toLocaleDateString()}"`,
      `"${inv.customerName}"`,
      `"${inv.customerPhone}"`,
      inv.items?.length || 0,
      `"${inv.paymentMethod}"`,
      inv.subtotal,
      inv.vatAmount,
      inv.totalAmount,
      `"${inv.createdBy}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `EALL_Invoices_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* 📊 REVENUE STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Total Invoices
          </span>
          <p className="text-2xl font-bold text-slate-900">{stats.totalCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Recorded transactions</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Total Revenue
          </span>
          <p className="text-2xl font-bold text-sky-800">
            AED {stats.totalRevenue.toLocaleString("en-AE", { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Cumulative billing</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Today's Sales
          </span>
          <p className="text-2xl font-bold text-emerald-700">
            AED {stats.todayRevenue.toLocaleString("en-AE", { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Generated today</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            VAT Collected
          </span>
          <p className="text-2xl font-bold text-slate-700">
            AED {stats.totalVat.toLocaleString("en-AE", { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">5% Tax element</p>
        </div>
      </div>

      {/* 🔍 SEARCH & FILTERS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by invoice #, customer name, phone..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-sky-600 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-medium">
              {[
                { id: "all", label: "All Time" },
                { id: "month", label: "This Month" },
                { id: "today", label: "Today" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDateFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    dateFilter === tab.id
                      ? "bg-white text-slate-900 font-bold shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleExportInvoicesCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <FiDownload />
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* 📋 INVOICE RECORDS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Items Summary</th>
                <th className="py-3.5 px-4 text-center">Payment</th>
                <th className="py-3.5 px-4 text-right">Total (AED)</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No invoice records found. Create one from the Billing tab!
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id || inv.invoiceNo}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Invoice Number */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-sky-800 text-xs sm:text-sm">
                        {inv.invoiceNo}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        By {inv.createdBy}
                      </p>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <p className="font-semibold text-slate-800">
                        {new Date(inv.createdAt).toLocaleDateString("en-GB")}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(inv.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900 text-xs sm:text-sm">
                        {inv.customerName}
                      </p>
                      <p className="text-xs font-mono text-slate-400">
                        {inv.customerPhone}
                      </p>
                    </td>

                    {/* Items */}
                    <td className="py-3.5 px-4 max-w-xs truncate text-xs text-slate-600">
                      {inv.items?.map((i) => `${i.name} (x${i.quantity})`).join(", ")}
                    </td>

                    {/* Payment */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                        {inv.paymentMethod}
                      </span>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900">
                      AED {Number(inv.totalAmount).toLocaleString("en-AE", { minimumFractionDigits: 2 })}
                    </td>

                    {/* View Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectInvoice(inv)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        <FiEye />
                        View / Print
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvoiceHistory;
