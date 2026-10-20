import { useState, useMemo, useEffect } from "react";
import {
  FiX,
  FiArrowDownLeft,
  FiArrowUpRight,
  FiPackage,
  FiShoppingBag,
  FiTruck,
  FiCalendar,
  FiUser,
  FiFileText,
  FiTag,
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
  FiDollarSign,
  FiPercent,
  FiClock,
} from "react-icons/fi";
import { AedSymbol, AedPrice } from "../common/AedSymbol";

const ProductLedgerDrawer = ({
  product,
  invoices = [],
  purchases = [],
  onClose,
  onOpenEdit,
}) => {
  const [activeTab, setActiveTab] = useState("all"); // all | sales | purchases

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Prevent background body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  if (!product) return null;

  const currentQty = Number(product.quantity || 0);
  const cost = Number(product.costPrice || 0);
  const margin = Number(product.margin || 0);
  const sellingPrice = Number(product.price || cost + margin || 0);

  // 1. Filter Sales (Outwards) for this product
  const productSales = useMemo(() => {
    const list = [];
    invoices.forEach((inv) => {
      const matchingItems = (inv.items || []).filter(
        (item) => item.sku === product.sku
      );
      matchingItems.forEach((item) => {
        list.push({
          type: "outward",
          date: inv.createdAt,
          refNo: inv.invoiceNo || inv.id,
          party: inv.customerName || "Walk-in Customer",
          partySub: inv.customerPhone || "",
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || sellingPrice,
          totalValue: (Number(item.quantity) || 1) * (Number(item.unitPrice) || sellingPrice),
          status: "Completed",
          paymentMethod: inv.paymentMethod || "Cash",
        });
      });
    });
    return list;
  }, [invoices, product.sku, sellingPrice]);

  // 2. Filter Purchases (Inwards) for this product
  const productPurchases = useMemo(() => {
    const list = [];
    purchases.forEach((po) => {
      const matchingItems = (po.items || []).filter(
        (item) => item.sku === product.sku
      );
      matchingItems.forEach((item) => {
        const unitCost = Number(item.unitCost) || Number(product.costPrice) || 0;
        const qty = Number(item.quantity) || 1;
        list.push({
          type: "inward",
          date: po.purchaseDate || po.createdAt,
          refNo: po.purchaseNo || po.id,
          supplierInvoiceRef: po.supplierInvoiceRef || "",
          party: po.supplierName || "Supplier",
          partySub: po.paymentMethod || "Procurement",
          quantity: qty,
          unitPrice: unitCost,
          totalValue: Number(item.totalCost) || qty * unitCost,
          status: po.paymentStatus || "Received",
          paymentMethod: po.paymentMethod || "Bank Transfer",
        });
      });
    });
    return list;
  }, [purchases, product.sku, product.costPrice]);

  // 3. Combine and sort movements chronologically (Newest first)
  const allMovements = useMemo(() => {
    const merged = [...productSales, ...productPurchases];
    merged.sort((a, b) => new Date(b.date) - new Date(a.date));
    return merged;
  }, [productSales, productPurchases]);

  // 4. Calculate Aggregate Metrics
  const totalInwardUnits = useMemo(
    () => productPurchases.reduce((sum, p) => sum + p.quantity, 0),
    [productPurchases]
  );
  const totalInwardValue = useMemo(
    () => productPurchases.reduce((sum, p) => sum + p.totalValue, 0),
    [productPurchases]
  );
  const totalOutwardUnits = useMemo(
    () => productSales.reduce((sum, s) => sum + s.quantity, 0),
    [productSales]
  );
  const totalOutwardValue = useMemo(
    () => productSales.reduce((sum, s) => sum + s.totalValue, 0),
    [productSales]
  );
  const realizedGrossMargin = useMemo(() => {
    return productSales.reduce((acc, s) => {
      const itemCost = cost * s.quantity;
      return acc + (s.totalValue - itemCost);
    }, 0);
  }, [productSales, cost]);

  // Filtered movements based on active tab
  const displayedMovements = useMemo(() => {
    if (activeTab === "sales") return productSales;
    if (activeTab === "purchases") return productPurchases;
    return allMovements;
  }, [activeTab, productSales, productPurchases, allMovements]);

  // Status badge details
  const isOutOfStock = currentQty === 0;
  const isLowStock = !isOutOfStock && currentQty <= (product.minAlert || 3);

  return (
    <div className="fixed inset-0 z-50 flex justify-end text-left font-sans">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={onClose}
        aria-label="Close backdrop"
      />

      {/* Slide-over Drawer Panel */}
      <aside
        className="relative z-10 w-full sm:w-[540px] md:w-[600px] lg:w-[640px] bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col h-full shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-drawer-title"
      >
        {/* 🧭 DRAWER HEADER */}
        <div className="p-4 sm:p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <FiPackage className="text-lg" />
            </span>
            <div>
              <h2
                id="product-drawer-title"
                className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2"
              >
                Stock &amp; Sales Ledger
              </h2>
              <p className="text-xs text-slate-400">
                Inwards, Outwards &amp; Live Closing Balance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEdit(product);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
              >
                Edit Master
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Close Drawer (Esc)"
            >
              <FiX className="text-xl" />
            </button>
          </div>
        </div>

        {/* 📜 SCROLLABLE DRAWER BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* PRODUCT HERO CARD */}
          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white p-2 border border-slate-700 shrink-0 flex items-center justify-center overflow-hidden">
              <img
                src={product.image || "/logo.png"}
                alt={product.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.src = "/logo.png";
                }}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[11px] font-bold">
                  {product.brand}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {product.category}
                </span>
                <span
                  className={`ml-auto inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    isOutOfStock
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      : isLowStock
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}
                >
                  {isOutOfStock ? (
                    <>
                      <FiXCircle /> Out of Stock
                    </>
                  ) : isLowStock ? (
                    <>
                      <FiAlertTriangle /> Low ({currentQty})
                    </>
                  ) : (
                    <>
                      <FiCheckCircle /> In Stock
                    </>
                  )}
                </span>
              </div>

              <h3 className="font-extrabold text-white text-sm sm:text-base leading-snug line-clamp-2">
                {product.name}
              </h3>
              <p className="text-xs font-mono text-slate-400 mt-1">
                SKU: <span className="text-slate-200 font-bold">{product.sku}</span>
              </p>
            </div>
          </div>

          {/* 📊 4 EXECUTIVE KPI SUMMARY CARDS */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* 1. CLOSING BALANCE */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-sm flex flex-col justify-between min-h-[118px]">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  Closing Balance
                  <FiPackage className="text-sky-400" />
                </p>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                    {currentQty}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">units</span>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-900 text-[11px] text-slate-500 font-sans">
                Live available stock for sales
              </div>
            </div>

            {/* 2. REVENUE / SELLING PRICE */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-sm flex flex-col justify-between min-h-[118px]">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  Selling Price
                  <FiDollarSign className="text-emerald-400" />
                </p>
                <div className="mt-2 flex items-baseline gap-1 text-emerald-400">
                  <span className="text-xl sm:text-2xl font-black font-mono">
                    <AedPrice amount={sellingPrice} />
                  </span>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-900 text-[11px] text-slate-400 font-mono flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-baseline gap-1">
                  <span className="text-slate-500 font-sans">Cost:</span>
                  <AedPrice amount={cost} className="text-slate-300 font-semibold" />
                </span>
                <span className="text-slate-700 font-sans">•</span>
                <span className="inline-flex items-baseline gap-1">
                  <span className="text-slate-500 font-sans">Margin:</span>
                  <span className="text-emerald-400 font-semibold inline-flex items-baseline">
                    +<AedPrice amount={margin} className="text-emerald-400" />
                  </span>
                </span>
              </div>
            </div>

            {/* 3. INWARDS (PURCHASED) */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-sm flex flex-col justify-between min-h-[118px]">
              <div>
                <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                  Inwards (Purchases)
                  <FiArrowDownLeft className="text-emerald-400" />
                </p>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                    +{totalInwardUnits}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">units</span>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-900 text-[11px] text-slate-400 font-mono flex items-baseline gap-1.5">
                <span className="text-slate-500 font-sans">Total Spend:</span>
                <AedPrice amount={totalInwardValue} className="text-slate-300 font-semibold" />
              </div>
            </div>

            {/* 4. OUTWARDS (SOLD) */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-sm flex flex-col justify-between min-h-[118px]">
              <div>
                <p className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center justify-between">
                  Outwards (Sales)
                  <FiArrowUpRight className="text-sky-400" />
                </p>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black text-sky-400 font-mono">
                    -{totalOutwardUnits}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">units</span>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-900 text-[11px] text-slate-400 font-mono flex items-baseline gap-1.5">
                <span className="text-slate-500 font-sans">Sales Value:</span>
                <AedPrice amount={totalOutwardValue} className="text-slate-300 font-semibold" />
              </div>
            </div>
          </div>

          {/* 📑 LEDGER SUB-TABS */}
          <div className="border-b border-slate-800 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
                activeTab === "all"
                  ? "border-sky-500 text-sky-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              All Movements ({allMovements.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("sales")}
              className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
                activeTab === "sales"
                  ? "border-sky-500 text-sky-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Sales Outward ({productSales.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("purchases")}
              className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
                activeTab === "purchases"
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Purchases Inward ({productPurchases.length})
            </button>
          </div>

          {/* 📋 CHRONOLOGICAL MOVEMENTS LIST */}
          <div className="space-y-3">
            {displayedMovements.length === 0 ? (
              <div className="py-12 px-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center text-slate-400">
                <FiClock className="text-3xl mx-auto mb-2 text-slate-600" />
                <p className="text-xs font-bold text-slate-300">
                  No {activeTab === "sales" ? "sales records" : activeTab === "purchases" ? "procurement purchases" : "inventory movements"} found.
                </p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                  {activeTab === "purchases" || activeTab === "all"
                    ? "Add inward stock via the 'Purchase Records' tab to populate this ledger."
                    : "Products sold via Billing POS will automatically appear here."}
                </p>
              </div>
            ) : (
              displayedMovements.map((item, idx) => {
                const isInward = item.type === "inward";
                const formattedDate = new Date(item.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={`${item.refNo}-${idx}`}
                    className="p-3.5 sm:p-4 rounded-2xl bg-slate-950 border border-slate-800/90 hover:border-slate-700 transition flex flex-col gap-2.5"
                  >
                    {/* Top Row: Type Badge + Ref + Date */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                            isInward
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                          }`}
                        >
                          {isInward ? (
                            <>
                              <FiArrowDownLeft /> INWARD (PURCHASE)
                            </>
                          ) : (
                            <>
                              <FiArrowUpRight /> OUTWARD (SALE)
                            </>
                          )}
                        </span>

                        <span className="font-mono text-xs font-bold text-white">
                          #{item.refNo}
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-400 font-medium">
                        {formattedDate}
                      </span>
                    </div>

                    {/* Middle Row: Party (Customer / Supplier) */}
                    <div className="flex items-center justify-between gap-2 text-xs pt-1 border-t border-slate-900">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        {isInward ? (
                          <FiTruck className="text-emerald-400 shrink-0" />
                        ) : (
                          <FiUser className="text-sky-400 shrink-0" />
                        )}
                        <span className="font-semibold text-slate-200">
                          {isInward ? "Supplier:" : "Customer:"}
                        </span>
                        <span className="font-medium text-white truncate max-w-[200px]">
                          {item.party}
                        </span>
                        {item.partySub && (
                          <span className="text-[10px] text-slate-500">
                            ({item.partySub})
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] text-slate-400">
                        {item.paymentMethod}
                      </span>
                    </div>

                    {/* Bottom Row: Quantity, Unit Value, Total Value */}
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-sans font-bold">
                          Quantity
                        </span>
                        <span
                          className={`font-black text-sm ${
                            isInward ? "text-emerald-400" : "text-sky-400"
                          }`}
                        >
                          {isInward ? `+${item.quantity}` : `-${item.quantity}`}{" "}
                          <span className="text-[10px] font-sans font-normal text-slate-400">
                            units
                          </span>
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 uppercase block font-sans font-bold">
                          Unit {isInward ? "Cost" : "Price"}
                        </span>
                        <span className="text-slate-300 font-bold">
                          <AedPrice amount={item.unitPrice} />
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 uppercase block font-sans font-bold">
                          Total Value
                        </span>
                        <span className="text-white font-extrabold text-sm">
                          <AedPrice amount={item.totalValue} />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 🔻 FOOTER ACTIONS */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400">
            Current Closing Stock:{" "}
            <strong className="text-white font-mono font-bold">
              {currentQty} units
            </strong>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </aside>
    </div>
  );
};

export default ProductLedgerDrawer;
