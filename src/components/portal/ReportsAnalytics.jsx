import { useState, useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  FiDollarSign,
  FiTrendingUp,
  FiPercent,
  FiTruck,
  FiDownload,
  FiFileText,
  FiPieChart,
  FiBarChart2,
  FiLayers,
  FiCreditCard,
  FiCalendar,
  FiAlertTriangle,
  FiUsers,
  FiCheckCircle,
} from "react-icons/fi";
import { AedPrice, AedSymbol } from "../common/AedSymbol";
import PortalKpiGrid from "./PortalKpiGrid";
import { PortalFilterMenu, ActiveFilterChips } from "./PortalFilterMenu";

const DATE_PRESETS = [
  { id: "all", label: "All Time" },
  { id: "today", label: "Today" },
  { id: "7d", label: "7 Days" },
  { id: "month", label: "This Month" },
  { id: "year", label: "This Year" },
  { id: "custom", label: "Custom" },
];

const REPORT_VIEWS = [
  { id: "pnl", label: "P&L & Overview", icon: FiBarChart2 },
  { id: "vat", label: "UAE VAT (5%)", icon: FiPercent },
  { id: "brands", label: "Brands & SKUs", icon: FiLayers },
  { id: "payables", label: "Cash & Payables", icon: FiCreditCard },
];

const isDateInRange = (isoDate, preset, customStart, customEnd) => {
  if (preset === "all") return true;
  if (!isoDate) return false;
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return false;

  const now = new Date();
  if (preset === "today") {
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }
  if (preset === "7d") {
    const start = new Date();
    start.setDate(now.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    return d >= start;
  }
  if (preset === "month") {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }
  if (preset === "year") {
    return d.getFullYear() === now.getFullYear();
  }
  if (preset === "custom") {
    if (customStart) {
      const s = new Date(customStart);
      s.setHours(0, 0, 0, 0);
      if (d < s) return false;
    }
    if (customEnd) {
      const e = new Date(customEnd);
      e.setHours(23, 59, 59, 999);
      if (d > e) return false;
    }
    return true;
  }
  return true;
};

const fmtNum = (val, decimals = 2) =>
  Number(val || 0).toLocaleString("en-AE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

const ReportsAnalytics = ({ stock = [], invoices = [], purchases = [] }) => {
  const [datePreset, setDatePreset] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [brandFilter, setBrandFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [activeView, setActiveView] = useState("pnl"); // pnl | vat | brands | payables

  // Fast SKU -> stock lookup for COGS / Cost Price calculation
  const stockBySku = useMemo(() => {
    const map = new Map();
    stock.forEach((s) => map.set(s.sku, s));
    return map;
  }, [stock]);

  // Dynamic Brand & Payment options
  const availableBrands = useMemo(() => {
    const set = new Set();
    stock.forEach((s) => s.brand && set.add(String(s.brand).trim()));
    invoices.forEach((inv) =>
      (inv.items || []).forEach((it) => it.brand && set.add(String(it.brand).trim()))
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [stock, invoices]);

  const availablePayments = useMemo(() => {
    const set = new Set(["Cash", "Card", "Bank Transfer", "Credit Term"]);
    invoices.forEach((inv) => inv.paymentMethod && set.add(inv.paymentMethod));
    return Array.from(set);
  }, [invoices]);

  // Filtered Invoices (Period + Payment + Brand)
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (!isDateInRange(inv.createdAt, datePreset, customStart, customEnd)) {
        return false;
      }
      if (paymentFilter !== "All" && (inv.paymentMethod || "") !== paymentFilter) {
        return false;
      }
      if (brandFilter !== "All") {
        const hasBrand = (inv.items || []).some((it) => {
          const itemBrand = (it.brand || stockBySku.get(it.sku)?.brand || "").trim();
          return itemBrand.toLowerCase() === brandFilter.toLowerCase();
        });
        if (!hasBrand) return false;
      }
      return true;
    });
  }, [invoices, datePreset, customStart, customEnd, paymentFilter, brandFilter, stockBySku]);

  // Filtered Purchases (Period + Brand)
  const filteredPurchases = useMemo(() => {
    return purchases.filter((po) => {
      if (!isDateInRange(po.purchaseDate || po.createdAt, datePreset, customStart, customEnd)) {
        return false;
      }
      if (brandFilter !== "All") {
        const hasBrand = (po.items || []).some((it) => {
          const itemBrand = (it.brand || stockBySku.get(it.sku)?.brand || "").trim();
          return itemBrand.toLowerCase() === brandFilter.toLowerCase();
        });
        if (!hasBrand) return false;
      }
      return true;
    });
  }, [purchases, datePreset, customStart, customEnd, brandFilter, stockBySku]);

  // Core Financial Computations
  const analytics = useMemo(() => {
    let grossRevenue = 0;
    let totalSubtotal = 0;
    let totalDiscounts = 0;
    let totalVat = 0;
    let standardRatedSupplies = 0;
    let zeroRatedSupplies = 0;
    let estimatedCogs = 0;
    let totalUnitsSold = 0;

    const paymentMap = new Map();
    const staffMap = new Map();
    const brandSalesMap = new Map();
    const skuSalesMap = new Map();

    filteredInvoices.forEach((inv) => {
      const invTotal = Number(inv.totalAmount) || 0;
      const invSubtotal = Number(inv.subtotal) || 0;
      const invDiscount = Number(inv.discount) || 0;
      const invVat = Number(inv.vatAmount) || 0;
      const taxableNet = Math.max(0, invSubtotal - invDiscount);

      grossRevenue += invTotal;
      totalSubtotal += invSubtotal;
      totalDiscounts += invDiscount;
      totalVat += invVat;

      if (Number(inv.vatRate ?? 5) > 0 && invVat > 0) {
        standardRatedSupplies += taxableNet;
      } else {
        zeroRatedSupplies += taxableNet;
      }

      // Payment channel totals
      const pm = inv.paymentMethod || "Cash";
      const pmEntry = paymentMap.get(pm) || { method: pm, amount: 0, count: 0 };
      pmEntry.amount += invTotal;
      pmEntry.count += 1;
      paymentMap.set(pm, pmEntry);

      // Staff attribution
      const staff = inv.createdBy || "Staff";
      const stEntry = staffMap.get(staff) || { name: staff, amount: 0, count: 0 };
      stEntry.amount += invTotal;
      stEntry.count += 1;
      staffMap.set(staff, stEntry);

      // Line item COGS, Brand & SKU performance
      (inv.items || []).forEach((item) => {
        const qty = Number(item.quantity) || 1;
        const unitPrice = Number(item.unitPrice) || 0;
        const lineRevenue = qty * unitPrice;
        const stockRef = stockBySku.get(item.sku);
        const unitCost = Number(stockRef?.costPrice || 0);
        const lineCost = qty * unitCost;
        const lineProfit = lineRevenue - lineCost;
        const itemBrand = (item.brand || stockRef?.brand || "General").trim();

        estimatedCogs += lineCost;
        totalUnitsSold += qty;

        const bEntry = brandSalesMap.get(itemBrand) || {
          brand: itemBrand,
          revenue: 0,
          profit: 0,
          units: 0,
        };
        bEntry.revenue += lineRevenue;
        bEntry.profit += lineProfit;
        bEntry.units += qty;
        brandSalesMap.set(itemBrand, bEntry);

        const sKey = item.sku || item.name;
        const sEntry = skuSalesMap.get(sKey) || {
          sku: item.sku || "N/A",
          name: item.name || "Product",
          brand: itemBrand,
          units: 0,
          revenue: 0,
          profit: 0,
        };
        sEntry.units += qty;
        sEntry.revenue += lineRevenue;
        sEntry.profit += lineProfit;
        skuSalesMap.set(sKey, sEntry);
      });
    });

    const netRevenueExVat = Math.max(0, totalSubtotal - totalDiscounts);
    const grossProfit = netRevenueExVat - estimatedCogs;
    const grossMarginPct =
      netRevenueExVat > 0 ? (grossProfit / netRevenueExVat) * 100 : 0;

    // Procurement & Supplier Payables
    let procurementSpend = 0;
    let totalInwardUnits = 0;
    let paidPayables = 0;
    let pendingPayables = 0;
    const supplierMap = new Map();

    filteredPurchases.forEach((po) => {
      const amt = Number(po.totalAmount) || 0;
      const qty = Number(po.totalQuantity) || 0;
      procurementSpend += amt;
      totalInwardUnits += qty;

      const supName = (po.supplierName || "General Supplier").trim();
      const sup = supplierMap.get(supName) || {
        supplier: supName,
        orders: 0,
        units: 0,
        totalSpend: 0,
        paidAmount: 0,
        dueAmount: 0,
      };
      sup.orders += 1;
      sup.units += qty;
      sup.totalSpend += amt;

      if (po.paymentStatus === "Paid") {
        paidPayables += amt;
        sup.paidAmount += amt;
      } else {
        pendingPayables += amt;
        sup.dueAmount += amt;
      }
      supplierMap.set(supName, sup);
    });

    // Inventory Valuation by Brand
    const stockValuationMap = new Map();
    let totalStockValue = 0;
    let lowStockSkus = 0;
    let outOfStockSkus = 0;

    stock.forEach((item) => {
      if (
        brandFilter !== "All" &&
        (item.brand || "").trim().toLowerCase() !== brandFilter.toLowerCase()
      ) {
        return;
      }
      const val =
        Number(item.price || Number(item.costPrice || 0) + Number(item.margin || 0) || 0) *
        Number(item.quantity || 0);
      totalStockValue += val;
      if (item.quantity === 0) outOfStockSkus += 1;
      else if (item.quantity <= (item.minAlert || 3)) lowStockSkus += 1;

      const b = (item.brand || "General").trim();
      const entry = stockValuationMap.get(b) || {
        brand: b,
        skus: 0,
        units: 0,
        valuation: 0,
      };
      entry.skus += 1;
      entry.units += Number(item.quantity || 0);
      entry.valuation += val;
      stockValuationMap.set(b, entry);
    });

    return {
      grossRevenue,
      totalSubtotal,
      totalDiscounts,
      netRevenueExVat,
      totalVat,
      standardRatedSupplies,
      zeroRatedSupplies,
      estimatedCogs,
      grossProfit,
      grossMarginPct,
      totalUnitsSold,
      procurementSpend,
      totalInwardUnits,
      paidPayables,
      pendingPayables,
      totalStockValue,
      lowStockSkus,
      outOfStockSkus,
      paymentMix: Array.from(paymentMap.values()).sort((a, b) => b.amount - a.amount),
      staffLeaderboard: Array.from(staffMap.values()).sort((a, b) => b.amount - a.amount),
      brandSales: Array.from(brandSalesMap.values()).sort((a, b) => b.revenue - a.revenue),
      topSkus: Array.from(skuSalesMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 12),
      suppliers: Array.from(supplierMap.values()).sort((a, b) => b.totalSpend - a.totalSpend),
      stockByBrand: Array.from(stockValuationMap.values()).sort((a, b) => b.valuation - a.valuation),
    };
  }, [filteredInvoices, filteredPurchases, stock, stockBySku, brandFilter]);

  // Unified Filter Menu (Brand & Payment Method)
  const filterSections = useMemo(
    () => [
      {
        id: "brand",
        label: "Brand",
        value: brandFilter,
        defaultValue: "All",
        onChange: setBrandFilter,
        options: [
          { value: "All", label: "All Brands" },
          ...availableBrands.map((b) => ({ value: b, label: b })),
        ],
      },
      {
        id: "payment",
        label: "Payment",
        value: paymentFilter,
        defaultValue: "All",
        onChange: setPaymentFilter,
        options: [
          { value: "All", label: "All Methods" },
          ...availablePayments.map((p) => ({ value: p, label: p })),
        ],
      },
    ],
    [availableBrands, availablePayments, brandFilter, paymentFilter]
  );

  const handleResetFilters = () => {
    setBrandFilter("All");
    setPaymentFilter("All");
  };

  // Export Comprehensive Financial CSV
  const handleExportFinancialCSV = () => {
    const periodLabel =
      DATE_PRESETS.find((p) => p.id === datePreset)?.label || datePreset;
    const rows = [
      ["E-ALL (ELECTRONICS ALL FZCO) - FINANCIAL REPORT"],
      ["Generated At", new Date().toLocaleString("en-GB")],
      ["Period", periodLabel],
      ["Brand Filter", brandFilter],
      ["Payment Filter", paymentFilter],
      [],
      ["SECTION 1: PROFIT & LOSS SUMMARY (AED)"],
      ["Metric", "Amount (AED)"],
      ["Gross Billed Revenue (Incl. VAT)", analytics.grossRevenue.toFixed(2)],
      ["Gross Sales Subtotal", analytics.totalSubtotal.toFixed(2)],
      ["Less: Customer Discounts", analytics.totalDiscounts.toFixed(2)],
      ["Net Revenue (Excl. VAT)", analytics.netRevenueExVat.toFixed(2)],
      ["Estimated COGS (Inventory Cost)", analytics.estimatedCogs.toFixed(2)],
      ["Estimated Gross Profit", analytics.grossProfit.toFixed(2)],
      ["Gross Profit Margin (%)", `${analytics.grossMarginPct.toFixed(2)}%`],
      ["UAE Output VAT Collected (5%)", analytics.totalVat.toFixed(2)],
      ["Procurement Spend (Inward POs)", analytics.procurementSpend.toFixed(2)],
      [],
      ["SECTION 2: SALES BY BRAND"],
      ["Brand", "Units Sold", "Revenue (AED)", "Est. Profit (AED)"],
      ...analytics.brandSales.map((b) => [
        `"${b.brand}"`,
        b.units,
        b.revenue.toFixed(2),
        b.profit.toFixed(2),
      ]),
      [],
      ["SECTION 3: UAE VAT TAX INVOICE REGISTER"],
      ["Invoice No", "Date", "Customer", "Customer TRN", "Payment", "Taxable Net (AED)", "VAT 5% (AED)", "Total (AED)"],
      ...filteredInvoices.map((inv) => [
        inv.invoiceNo,
        new Date(inv.createdAt).toLocaleDateString("en-GB"),
        `"${(inv.customerName || "").replace(/"/g, '""')}"`,
        `"${inv.customerTrn || ""}"`,
        inv.paymentMethod,
        Math.max(0, (Number(inv.subtotal) || 0) - (Number(inv.discount) || 0)).toFixed(2),
        (Number(inv.vatAmount) || 0).toFixed(2),
        (Number(inv.totalAmount) || 0).toFixed(2),
      ]),
    ];

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `EALL_Financial_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export Executive Vector PDF Report via jsPDF + autoTable
  const handleDownloadExecutivePDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const periodLabel =
      DATE_PRESETS.find((p) => p.id === datePreset)?.label || datePreset;

    // Header Banner
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 32, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("E-ALL (ELECTRONICS ALL FZCO)", 14, 14);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Executive Financial, UAE VAT & Operations Report", 14, 21);
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Period: ${periodLabel}  |  Brand: ${brandFilter}  |  Generated: ${new Date().toLocaleString("en-GB")}`,
      14,
      27
    );

    // P&L Summary Table
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("1. Profit & Loss & UAE VAT Summary", 14, 42);

    autoTable(doc, {
      startY: 46,
      head: [["Financial Metric", "Value"]],
      body: [
        ["Invoices Issued / Units Sold", `${filteredInvoices.length} invoices / ${analytics.totalUnitsSold} units`],
        ["Gross Billed Revenue (Incl. VAT)", `AED ${fmtNum(analytics.grossRevenue)}`],
        ["Less: Customer Discounts", `AED ${fmtNum(analytics.totalDiscounts)}`],
        ["Net Revenue (Excl. VAT)", `AED ${fmtNum(analytics.netRevenueExVat)}`],
        ["Estimated Cost of Goods Sold (COGS)", `AED ${fmtNum(analytics.estimatedCogs)}`],
        ["Estimated Gross Profit", `AED ${fmtNum(analytics.grossProfit)} (${analytics.grossMarginPct.toFixed(1)}%)`],
        ["UAE Output VAT Collected (5%)", `AED ${fmtNum(analytics.totalVat)}`],
        ["Procurement Spend (Inward POs)", `AED ${fmtNum(analytics.procurementSpend)}`],
        ["Active Inventory Valuation", `AED ${fmtNum(analytics.totalStockValue, 0)}`],
      ],
      theme: "grid",
      headStyles: { fillColor: [3, 105, 161], textColor: 255, fontSize: 9 },
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
    });

    // Brand Breakdown Table
    const afterPnlY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("2. Revenue & Profit by Brand", 14, afterPnlY);

    autoTable(doc, {
      startY: afterPnlY + 4,
      head: [["Brand", "Units Sold", "Revenue (AED)", "Est. Profit (AED)"]],
      body:
        analytics.brandSales.length > 0
          ? analytics.brandSales.map((b) => [
              b.brand,
              String(b.units),
              fmtNum(b.revenue),
              fmtNum(b.profit),
            ])
          : [["No sales recorded in selected period", "0", "0.00", "0.00"]],
      theme: "striped",
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 9 },
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      columnStyles: {
        1: { halign: "center" },
        2: { halign: "right" },
        3: { halign: "right" },
      },
    });

    // Payment Channels Table
    const afterBrandsY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("3. Payment Channel Mix", 14, afterBrandsY);

    autoTable(doc, {
      startY: afterBrandsY + 4,
      head: [["Payment Method", "Invoices", "Total Collected (AED)", "Share"]],
      body:
        analytics.paymentMix.length > 0
          ? analytics.paymentMix.map((pm) => [
              pm.method,
              String(pm.count),
              fmtNum(pm.amount),
              `${analytics.grossRevenue > 0 ? ((pm.amount / analytics.grossRevenue) * 100).toFixed(1) : "0.0"}%`,
            ])
          : [["No collections recorded", "0", "0.00", "0.0%"]],
      theme: "striped",
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 9 },
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      columnStyles: {
        1: { halign: "center" },
        2: { halign: "right" },
        3: { halign: "right" },
      },
    });

    doc.save(`EALL_Executive_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-4 sm:space-y-5 text-left">
      {/* KPI Grid */}
      <PortalKpiGrid
        items={[
          {
            id: "gross-rev",
            label: "Gross Revenue",
            value: (
              <AedPrice
                amount={Math.round(analytics.grossRevenue)}
                decimals={0}
                className="font-mono font-black text-slate-900 dark:text-white"
              />
            ),
            subtitle: `${filteredInvoices.length} invoices • ${analytics.totalUnitsSold} units`,
            icon: FiDollarSign,
            tone: "sky",
          },
          {
            id: "gross-profit",
            label: "Est. Gross Profit",
            value: (
              <AedPrice
                amount={Math.round(analytics.grossProfit)}
                decimals={0}
                className="font-mono font-black text-emerald-700 dark:text-emerald-400"
              />
            ),
            subtitle: `${analytics.grossMarginPct.toFixed(1)}% net margin`,
            icon: FiTrendingUp,
            tone: "emerald",
          },
          {
            id: "vat-tax",
            label: "UAE VAT (5%)",
            value: (
              <AedPrice
                amount={analytics.totalVat}
                decimals={2}
                className="font-mono font-black text-purple-900 dark:text-purple-300"
              />
            ),
            subtitle: "Output tax collected",
            icon: FiPercent,
            tone: "purple",
          },
          {
            id: "procurement",
            label: "Procurement Spend",
            value: (
              <AedPrice
                amount={Math.round(analytics.procurementSpend)}
                decimals={0}
                className="font-mono font-black text-indigo-900 dark:text-indigo-300"
              />
            ),
            subtitle: `${filteredPurchases.length} POs • +${analytics.totalInwardUnits} units`,
            icon: FiTruck,
            tone: "indigo",
          },
        ]}
      />

      {/* Unified Period, Filter & Export Toolbar */}
      <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3">
          {/* Date Range Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <FiCalendar className="text-slate-400 dark:text-slate-500 text-sm shrink-0 mr-1" />
            {DATE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setDatePreset(preset.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer shrink-0 ${
                  datePreset === preset.id
                    ? "bg-sky-700 dark:bg-sky-600 text-white shadow-2xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Right Controls: Filter Icon + CSV + Executive PDF */}
          <div className="flex items-center gap-2 shrink-0">
            <PortalFilterMenu
              sections={filterSections}
              onResetAll={handleResetFilters}
              resultCount={filteredInvoices.length}
              resultLabel="invoices"
            />

            <button
              type="button"
              onClick={handleExportFinancialCSV}
              aria-label="Export financial CSV"
              title="Export complete P&L & VAT report as CSV"
              className="inline-flex items-center justify-center gap-1.5 w-10 h-10 md:w-auto md:px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer shrink-0"
            >
              <FiDownload className="text-[16px] md:text-sm" />
              <span className="hidden md:inline">Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadExecutivePDF}
              aria-label="Download Executive PDF"
              title="Download A4 Executive PDF Report"
              className="ml-auto md:ml-0 inline-flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-xl bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white text-xs font-bold transition shadow-xs cursor-pointer whitespace-nowrap"
            >
              <FiFileText className="text-sm" />
              <span>Executive PDF</span>
            </button>
          </div>
        </div>

        {/* Custom Date Range Pickers */}
        {datePreset === "custom" && (
          <div className="flex flex-wrap items-center gap-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500 dark:text-slate-400">From:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:border-sky-600"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500 dark:text-slate-400">To:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:border-sky-600"
              />
            </div>
          </div>
        )}

        <ActiveFilterChips
          sections={filterSections}
          onResetAll={handleResetFilters}
        />
      </div>

      {/* Report Sub-View Switcher */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-slate-200/80 dark:border-slate-800 pb-0">
        {REPORT_VIEWS.map((view) => {
          const Icon = view.icon;
          const isActive = activeView === view.id;
          return (
            <button
              key={view.id}
              type="button"
              onClick={() => setActiveView(view.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? "border-sky-600 dark:border-sky-400 text-sky-700 dark:text-sky-300"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Icon className="text-sm" />
              <span>{view.label}</span>
            </button>
          );
        })}
      </div>

      {/* =================================================================== */}
      {/* TAB 1: P&L & EXECUTIVE OVERVIEW                                     */}
      {/* =================================================================== */}
      {activeView === "pnl" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Profit & Loss Statement Card */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FiBarChart2 className="text-sky-600 dark:text-sky-400" />
                  <span>Profit &amp; Loss Statement</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Reconciled from live POS invoices &amp; SKU unit cost prices
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-500/25 text-[11px] font-bold font-mono">
                {analytics.grossMarginPct.toFixed(1)}% Margin
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs sm:text-sm">
              {[
                {
                  label: "Gross Merchandise Sales (Pre-Tax)",
                  value: analytics.totalSubtotal,
                  tone: "text-slate-900 dark:text-white font-semibold",
                },
                {
                  label: "Less: Customer Discounts",
                  value: -analytics.totalDiscounts,
                  tone: "text-rose-600 dark:text-rose-400",
                },
                {
                  label: "Net Taxable Revenue (Excl. VAT)",
                  value: analytics.netRevenueExVat,
                  tone: "text-slate-900 dark:text-white font-bold",
                  highlight: true,
                },
                {
                  label: "Less: Estimated Cost of Goods Sold (COGS)",
                  value: -analytics.estimatedCogs,
                  tone: "text-slate-600 dark:text-slate-400",
                },
                {
                  label: "Estimated Gross Profit",
                  value: analytics.grossProfit,
                  tone: "text-emerald-700 dark:text-emerald-400 font-black text-base",
                  highlight: true,
                },
                {
                  label: "Output VAT Liability (UAE 5%)",
                  value: analytics.totalVat,
                  tone: "text-purple-700 dark:text-purple-300 font-bold",
                },
                {
                  label: "Total Cash & Receivables Billed (Incl. VAT)",
                  value: analytics.grossRevenue,
                  tone: "text-sky-800 dark:text-sky-300 font-black",
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className={`px-5 py-3 flex items-center justify-between gap-4 ${
                    row.highlight ? "bg-slate-50/80 dark:bg-slate-800/40" : ""
                  }`}
                >
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    {row.label}
                  </span>
                  <span className={`font-mono whitespace-nowrap ${row.tone}`}>
                    {row.value < 0 ? "- " : ""}
                    <AedPrice amount={Math.abs(row.value)} />
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Payment Mix + Top Salespeople */}
          <div className="lg:col-span-5 space-y-5">
            {/* Payment Method Mix */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs p-5 space-y-4 transition-colors">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FiPieChart className="text-sky-600 dark:text-sky-400" />
                  <span>Collections by Payment Method</span>
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  {filteredInvoices.length} bills
                </span>
              </div>

              {analytics.paymentMix.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No sales collections in this period.
                </p>
              ) : (
                <div className="space-y-3">
                  {analytics.paymentMix.map((pm) => {
                    const pct =
                      analytics.grossRevenue > 0
                        ? (pm.amount / analytics.grossRevenue) * 100
                        : 0;
                    return (
                      <div key={pm.method} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {pm.method}{" "}
                            <span className="text-slate-400 font-normal">
                              ({pm.count})
                            </span>
                          </span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            <AedPrice amount={pm.amount} decimals={0} />{" "}
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({pct.toFixed(0)}%)
                            </span>
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            style={{ width: `${Math.max(4, pct)}%` }}
                            className="h-full rounded-full bg-sky-600 dark:bg-sky-500 transition-all"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Staff Sales Leaderboard */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs p-5 space-y-4 transition-colors">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FiUsers className="text-emerald-600 dark:text-emerald-400" />
                <span>Sales Leaderboard by Staff</span>
              </h3>

              {analytics.staffLeaderboard.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No staff sales recorded yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {analytics.staffLeaderboard.map((st, idx) => {
                    const pct =
                      analytics.grossRevenue > 0
                        ? (st.amount / analytics.grossRevenue) * 100
                        : 0;
                    return (
                      <div key={st.name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 truncate">
                            <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="truncate">{st.name}</span>
                          </span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0">
                            <AedPrice amount={st.amount} decimals={0} />
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            style={{ width: `${Math.max(4, pct)}%` }}
                            className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500 transition-all"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: UAE VAT (5%) FTA TAX RETURN SUMMARY                          */}
      {/* =================================================================== */}
      {activeView === "vat" && (
        <div className="space-y-5">
          {/* FTA Box Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Box 1 • Standard-Rated Supplies (5%)
              </span>
              <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
                <AedPrice amount={analytics.standardRatedSupplies} />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Taxable net sales value in UAE
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Box 2 • Zero-Rated / Exempt Supplies
              </span>
              <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
                <AedPrice amount={analytics.zeroRatedSupplies} />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Export or non-VAT billed invoices
              </p>
            </div>

            <div className="p-5 bg-purple-50/70 dark:bg-purple-500/10 rounded-2xl border border-purple-200/80 dark:border-purple-500/25 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                Output VAT Payable to FTA
              </span>
              <div className="text-xl font-black font-mono text-purple-900 dark:text-purple-200">
                <AedPrice amount={analytics.totalVat} />
              </div>
              <p className="text-[11px] text-purple-700/80 dark:text-purple-300/80 font-mono">
                Company TRN: 100482910400003
              </p>
            </div>
          </div>

          {/* Itemized Tax Register */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/90 dark:bg-slate-800/70 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Invoice #</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Customer &amp; TRN</th>
                    <th className="py-3.5 px-4 text-right">Taxable Net (<AedSymbol />)</th>
                    <th className="py-3.5 px-4 text-center">Rate</th>
                    <th className="py-3.5 px-4 text-right">VAT (<AedSymbol />)</th>
                    <th className="py-3.5 px-4 text-right">Gross Total (<AedSymbol />)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300 font-medium">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No taxable invoices found in this period.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const net = Math.max(
                        0,
                        (Number(inv.subtotal) || 0) - (Number(inv.discount) || 0)
                      );
                      return (
                        <tr
                          key={inv.invoiceNo}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            {inv.invoiceNo}
                          </td>
                          <td className="py-3 px-4 text-xs font-mono whitespace-nowrap">
                            {new Date(inv.createdAt).toLocaleDateString("en-GB")}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-900 dark:text-white text-xs">
                              {inv.customerName}
                            </p>
                            {inv.customerTrn && (
                              <span className="text-[10px] font-mono text-slate-400">
                                TRN: {inv.customerTrn}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                            <AedPrice amount={net} />
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-xs whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 font-bold">
                              {inv.vatRate ?? 5}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-purple-700 dark:text-purple-300 whitespace-nowrap">
                            <AedPrice amount={inv.vatAmount} />
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            <AedPrice amount={inv.totalAmount} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: BRAND & SKU PERFORMANCE                                      */}
      {/* =================================================================== */}
      {activeView === "brands" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Sales Revenue by Brand */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Sales Revenue by Brand
              </h3>
              {analytics.brandSales.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">
                  No brand sales recorded in this period.
                </p>
              ) : (
                <div className="space-y-3">
                  {analytics.brandSales.map((b) => {
                    const maxRev = analytics.brandSales[0]?.revenue || 1;
                    const widthPct = (b.revenue / maxRev) * 100;
                    return (
                      <div key={b.brand} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {b.brand}{" "}
                            <span className="text-slate-400 font-normal">
                              ({b.units} units)
                            </span>
                          </span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            <AedPrice amount={b.revenue} decimals={0} />
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            style={{ width: `${Math.max(4, widthPct)}%` }}
                            className="h-full rounded-full bg-sky-600 dark:bg-sky-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Inventory Capital Valuation by Brand */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Active Stock Valuation by Brand
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  <FiAlertTriangle className="text-xs" />
                  <span>
                    {analytics.lowStockSkus} low • {analytics.outOfStockSkus} out
                  </span>
                </span>
              </div>

              <div className="space-y-3">
                {analytics.stockByBrand.map((b) => {
                  const pct =
                    analytics.totalStockValue > 0
                      ? (b.valuation / analytics.totalStockValue) * 100
                      : 0;
                  return (
                    <div key={b.brand} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {b.brand}{" "}
                          <span className="text-slate-400 font-normal">
                            ({b.skus} SKUs • {b.units} units)
                          </span>
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          <AedPrice amount={b.valuation} decimals={0} />
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          style={{ width: `${Math.max(2, pct)}%` }}
                          className="h-full rounded-full bg-indigo-600 dark:bg-indigo-400"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Top-Selling SKUs Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Top-Selling Products
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/90 dark:bg-slate-800/70 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Product &amp; SKU</th>
                    <th className="py-3 px-4">Brand</th>
                    <th className="py-3 px-4 text-center">Units Sold</th>
                    <th className="py-3 px-4 text-right">Revenue (<AedSymbol />)</th>
                    <th className="py-3 px-4 text-right">Est. Profit (<AedSymbol />)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300 font-medium">
                  {analytics.topSkus.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        No product sales found in selected period.
                      </td>
                    </tr>
                  ) : (
                    analytics.topSkus.map((item) => (
                      <tr
                        key={item.sku}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition"
                      >
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {item.name}
                          </p>
                          <p className="text-[11px] font-mono text-slate-400">
                            {item.sku}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 text-xs font-bold">
                            {item.brand}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold">
                          {item.units}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          <AedPrice amount={item.revenue} />
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          <AedPrice amount={item.profit} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: SUPPLIER PAYABLES & CASH FLOW                                */}
      {/* =================================================================== */}
      {activeView === "payables" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Supplier Procurement
              </span>
              <div className="mt-1 text-xl font-black font-mono text-slate-900 dark:text-white">
                <AedPrice amount={analytics.procurementSpend} />
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Settled / Paid to Suppliers
              </span>
              <div className="mt-1 text-xl font-black font-mono text-emerald-700 dark:text-emerald-400">
                <AedPrice amount={analytics.paidPayables} />
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Pending / Partial Payables
              </span>
              <div className="mt-1 text-xl font-black font-mono text-amber-700 dark:text-amber-400">
                <AedPrice amount={analytics.pendingPayables} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Supplier Spend &amp; Payables Ledger
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/90 dark:bg-slate-800/70 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Supplier Name</th>
                    <th className="py-3 px-4 text-center">PO Count</th>
                    <th className="py-3 px-4 text-center">Inward Units</th>
                    <th className="py-3 px-4 text-right">Total Spend (<AedSymbol />)</th>
                    <th className="py-3 px-4 text-right">Paid (<AedSymbol />)</th>
                    <th className="py-3 px-4 text-right">Outstanding (<AedSymbol />)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300 font-medium">
                  {analytics.suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        No supplier purchases recorded in selected period.
                      </td>
                    </tr>
                  ) : (
                    analytics.suppliers.map((sup) => (
                      <tr
                        key={sup.supplier}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition"
                      >
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {sup.supplier}
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          {sup.orders}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                          +{sup.units}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          <AedPrice amount={sup.totalSpend} />
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-700 dark:text-emerald-400">
                          <AedPrice amount={sup.paidAmount} />
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          {sup.dueAmount > 0 ? (
                            <span className="text-amber-700 dark:text-amber-400">
                              <AedPrice amount={sup.dueAmount} />
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                              <FiCheckCircle /> Settled
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsAnalytics;

