import { useState, useMemo, useRef, useEffect } from "react";
import {
  FiSearch,
  FiPlus,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiDownload,
  FiRefreshCw,
  FiEdit2,
  FiPackage,
  FiGlobe,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiPercent,
  FiDollarSign,
  FiX,
} from "react-icons/fi";
import {
  updateProductDetails,
  syncCatalogToStock,
  addCustomProduct,
} from "../../services/stockService";
import { formatAED, CURRENCY_SYMBOL } from "../../utils/currencyFormatter";
import { AedSymbol, AedPrice } from "../common/AedSymbol";

const StockTable = ({ stock = [], onStockChanged, isAdmin }) => {
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All"); // All | in-stock | low-stock | out-of-stock
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  // Edit Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [editName, setEditName] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editCostPrice, setEditCostPrice] = useState("");
  const [editMargin, setEditMargin] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editOriginalPrice, setEditOriginalPrice] = useState("");
  const [editQty, setEditQty] = useState("");
  const [editAlert, setEditAlert] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Pagination State & Ref
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const tableRef = useRef(null);

  // New Product Modal State
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newSku, setNewSku] = useState("");
  const [newName, setNewName] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newCategory, setNewCategory] = useState("Electronics");
  const [newCostPrice, setNewCostPrice] = useState(0);
  const [newMargin, setNewMargin] = useState(0);
  const [newPrice, setNewPrice] = useState(0);
  const [newOriginalPrice, setNewOriginalPrice] = useState(0);
  const [newQty, setNewQty] = useState(10);
  const [newAlert, setNewAlert] = useState(3);

  // Reset pagination to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, brandFilter, statusFilter, itemsPerPage]);

  const brands = useMemo(() => {
    const list = Array.from(
      new Set(
        stock
          .map((s) => (s.brand ? String(s.brand).trim() : ""))
          .filter(Boolean)
      )
    );
    return ["All", ...list.sort((a, b) => a.localeCompare(b))];
  }, [stock]);

  const filteredStock = useMemo(() => {
    return stock.filter((item) => {
      const itemBrand = (item.brand || "").trim();
      const targetBrand = brandFilter.trim();

      // Search
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matches =
          (item.name || "").toLowerCase().includes(q) ||
          (item.sku || "").toLowerCase().includes(q) ||
          itemBrand.toLowerCase().includes(q) ||
          (item.category || "").toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Brand
      if (
        brandFilter !== "All" &&
        itemBrand.toLowerCase() !== targetBrand.toLowerCase()
      ) {
        return false;
      }

      // Status
      if (statusFilter === "out-of-stock" && item.quantity > 0) return false;
      if (
        statusFilter === "low-stock" &&
        (item.quantity === 0 || item.quantity > item.minAlert)
      )
        return false;
      if (statusFilter === "in-stock" && item.quantity === 0) return false;

      return true;
    });
  }, [stock, search, brandFilter, statusFilter]);

  // Pagination Calculations
  const totalItems = filteredStock.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (validPage - 1) * itemsPerPage;
  const endIndex = Math.min(totalItems, startIndex + itemsPerPage);

  const paginatedStock = useMemo(() => {
    return filteredStock.slice(startIndex, endIndex);
  }, [filteredStock, startIndex, endIndex]);

  const handlePageChange = (newPage) => {
    const pageNum = Math.max(1, Math.min(newPage, totalPages));
    setCurrentPage(pageNum);
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, validPage - 2);
      let end = Math.min(totalPages, start + maxVisible - 1);
      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalSkus = stock.length;
    const totalUnits = stock.reduce((sum, s) => sum + s.quantity, 0);
    const lowStockCount = stock.filter(
      (s) => s.quantity > 0 && s.quantity <= s.minAlert
    ).length;
    const outOfStockCount = stock.filter((s) => s.quantity === 0).length;
    const totalValuation = stock.reduce(
      (sum, s) => sum + (Number(s.price || (s.costPrice + s.margin) || 0) * Number(s.quantity || 0)),
      0
    );
    return { totalSkus, totalUnits, lowStockCount, outOfStockCount, totalValuation };
  }, [stock]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage("");
    try {
      const res = await syncCatalogToStock();
      setSyncMessage(`Successfully synced ${res.total} products to Cloud Firestore!`);
      setTimeout(() => setSyncMessage(""), 4000);
      if (onStockChanged) onStockChanged();
    } catch (err) {
      setSyncMessage(`Sync warning: ${err.message || "Check connection"}`);
      setTimeout(() => setSyncMessage(""), 4000);
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEditName(item.name || "");
    setEditBrand(item.brand || "");
    setEditCategory(item.category || "");

    const cost = item.costPrice !== undefined ? Number(item.costPrice) : 0;
    const currentPrice = Number(item.price) || 0;
    const margin = item.margin !== undefined ? Number(item.margin) : Math.max(0, currentPrice - cost);

    setEditCostPrice(cost);
    setEditMargin(margin);
    setEditPrice(currentPrice > 0 ? currentPrice : cost + margin);
    setEditOriginalPrice(item.originalPrice ?? "");
    setEditQty(item.quantity ?? 0);
    setEditAlert(item.minAlert ?? 3);
  };

  // Live Auto-reconcile Selling Price when Cost or Margin changes
  const handleCostChange = (val) => {
    setEditCostPrice(val);
    const c = parseFloat(val) || 0;
    const m = parseFloat(editMargin) || 0;
    setEditPrice((c + m).toFixed(2));
  };

  const handleMarginChange = (val) => {
    setEditMargin(val);
    const c = parseFloat(editCostPrice) || 0;
    const m = parseFloat(val) || 0;
    setEditPrice((c + m).toFixed(2));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSaving(true);
    try {
      const cost = parseFloat(editCostPrice) || 0;
      const margin = parseFloat(editMargin) || 0;
      const selling = parseFloat(editPrice) || (cost + margin);
      const original = editOriginalPrice ? parseFloat(editOriginalPrice) : 0;

      await updateProductDetails(editingItem.sku, {
        name: editName,
        brand: editBrand,
        category: editCategory,
        costPrice: cost,
        margin: margin,
        price: selling,
        originalPrice: original,
        quantity: editQty,
        minAlert: editAlert,
      });
      setEditingItem(null);
      if (onStockChanged) onStockChanged();
    } catch (err) {
      console.error("Save edit error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newSku.trim() || !newName.trim()) return;

    const cost = parseFloat(newCostPrice) || 0;
    const margin = parseFloat(newMargin) || 0;
    const price = parseFloat(newPrice) || (cost + margin);

    await addCustomProduct({
      sku: newSku,
      name: newName,
      brand: newBrand,
      category: newCategory,
      quantity: newQty,
      costPrice: cost,
      margin: margin,
      price: price,
      originalPrice: newOriginalPrice,
      minAlert: newAlert,
    });

    setShowAddProductModal(false);
    setNewSku("");
    setNewName("");
    setNewBrand("");
    setNewCostPrice(0);
    setNewMargin(0);
    setNewPrice(0);
    if (onStockChanged) onStockChanged();
  };

  // CSV Export with Cost, Margin & Selling Price
  const handleExportCSV = () => {
    const headers = [
      "SKU",
      "Product Name",
      "Brand",
      "Category",
      "Quantity",
      `Cost Price (${CURRENCY_SYMBOL})`,
      `Margin (${CURRENCY_SYMBOL})`,
      `Selling Price (${CURRENCY_SYMBOL})`,
      `Original Price (${CURRENCY_SYMBOL})`,
      "Min Alert",
    ];
    const rows = filteredStock.map((i) => [
      `"${i.sku}"`,
      `"${i.name.replace(/"/g, '""')}"`,
      `"${i.brand}"`,
      `"${i.category}"`,
      i.quantity,
      i.costPrice || 0,
      i.margin || 0,
      i.price || ((i.costPrice || 0) + (i.margin || 0)),
      i.originalPrice || 0,
      i.minAlert,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `EALL_Inventory_Stock_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-left">
      {/* 📊 SUMMARY METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total SKUs */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total SKUs
            </p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1 font-mono">
              {metrics.totalSkus}
            </p>
          </div>
          <div className="p-2.5 bg-sky-50 text-sky-700 rounded-xl">
            <FiPackage className="text-xl" />
          </div>
        </div>

        {/* Total Units in Stock */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Units
            </p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1 font-mono">
              {metrics.totalUnits}
            </p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
            <FiCheckCircle className="text-xl" />
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Low Stock Alert
            </p>
            <p className="text-xl sm:text-2xl font-black text-amber-600 mt-1 font-mono">
              {metrics.lowStockCount}
            </p>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <FiAlertTriangle className="text-xl" />
          </div>
        </div>

        {/* Inventory Valuation */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Stock Valuation
            </p>
            <div className="mt-1">
              <AedPrice amount={metrics.totalValuation} decimals={0} className="text-lg sm:text-xl font-black text-sky-900 truncate" />
            </div>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
            <FiDollarSign className="text-xl" />
          </div>
        </div>
      </div>

      {/* 🛠️ CONTROLS & ACTIONS BAR */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
            <input
              type="text"
              placeholder="Search by product name, SKU, brand, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:bg-white focus:border-sky-600 transition"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
              title="Export filtered stock as CSV"
            >
              <FiDownload className="text-sm" />
              <span>Export CSV</span>
            </button>

            {/* Sync from Catalog */}
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              title="Sync catalog to Firestore"
            >
              <FiRefreshCw className={`text-sm ${syncing ? "animate-spin" : ""}`} />
              <span>{syncing ? "Syncing..." : "Sync Catalog"}</span>
            </button>

            {/* Add Custom Product (Admin Only) */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowAddProductModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <FiPlus className="text-sm" />
                <span>Add Product</span>
              </button>
            )}
          </div>
        </div>

        {/* Sync message banner */}
        {syncMessage && (
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs font-semibold text-sky-900 flex items-center gap-2">
            <FiCheckCircle className="text-emerald-600 text-sm shrink-0" />
            <span>{syncMessage}</span>
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-slate-100">
          {/* Brand Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Brand:
            </span>
            {brands.slice(0, 8).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBrandFilter(b)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${brandFilter === b
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
              >
                {b}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
              Status:
            </span>
            {[
              { id: "All", label: "All" },
              { id: "in-stock", label: "In Stock" },
              { id: "low-stock", label: "Low Stock" },
              { id: "out-of-stock", label: "Out of Stock" },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${statusFilter === st.id
                  ? "bg-sky-700 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 📦 INVENTORY TABLE */}
      <div
        ref={tableRef}
        className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Product &amp; SKU</th>
                <th className="py-3.5 px-4">Brand &amp; Category</th>
                {isAdmin && (
                  <th className="py-3.5 px-3 text-right whitespace-nowrap">
                    Cost (<AedSymbol />)
                  </th>
                )}
                {isAdmin && (
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">
                    Margin (<AedSymbol />)
                  </th>
                )}
                <th className="py-3.5 px-4 text-right whitespace-nowrap">
                  Selling Price (<AedSymbol />)
                </th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">
                  Stock Units
                </th>
                <th className="py-3.5 px-4 text-center">Status</th>
                {isAdmin && <th className="py-3.5 px-4 text-right">Edit</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedStock.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 8 : 5}
                    className="py-12 text-center text-slate-400"
                  >
                    <FiPackage className="text-3xl mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold">No stock items found matching your filters.</p>
                  </td>
                </tr>
              ) : (
                paginatedStock.map((item) => {
                  const isOutOfStock = item.quantity === 0;
                  const isLowStock = !isOutOfStock && item.quantity <= item.minAlert;
                  const cost = Number(item.costPrice || 0);
                  const margin = Number(item.margin || 0);
                  const sellingPrice = Number(item.price || (cost + margin) || 0);
                  const originalPrice = Number(item.originalPrice || 0);
                  const hasDiscount = originalPrice > sellingPrice && sellingPrice > 0;

                  return (
                    <tr
                      key={item.sku}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Product & SKU */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-10 h-10 object-contain rounded-lg bg-slate-50 p-1 border border-slate-100 shrink-0"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                              {item.name}
                            </p>
                            <p className="text-xs font-mono text-slate-400 font-medium">
                              {item.sku}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Brand & Category */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 text-xs font-bold mb-0.5">
                          {item.brand}
                        </span>
                        <p className="text-[11px] text-slate-400 truncate max-w-[140px]">
                          {item.category}
                        </p>
                      </td>

                      {/* Cost Price (Admin Only) */}
                      {isAdmin && (
                        <td className="py-3.5 px-3 text-right font-mono text-slate-600 text-xs whitespace-nowrap">
                          <AedPrice amount={cost} />
                        </td>
                      )}

                      {/* Margin (Admin Only - Centered) */}
                      {isAdmin && (
                        <td className="py-3.5 px-3 text-center font-mono whitespace-nowrap">
                          <span className="inline-flex items-center justify-center gap-1 font-bold text-xs text-emerald-700 bg-emerald-50/90 px-2.5 py-0.5 rounded-lg border border-emerald-200/80">
                            <span>+</span>
                            <AedPrice amount={margin} symbolClassName="text-emerald-600" />
                          </span>
                        </td>
                      )}

                      {/* Selling Price */}
                      <td className="py-3.5 px-4 text-right font-mono whitespace-nowrap">
                        <div className="flex flex-col items-end">
                          <AedPrice amount={sellingPrice} className="font-bold text-slate-950 text-sm" />
                          {hasDiscount && (
                            <span className="text-[10px] text-slate-400 line-through">
                              <AedPrice amount={originalPrice} />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Available Stock */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-extrabold ${isOutOfStock
                            ? "bg-rose-100/80 text-rose-700 border border-rose-200"
                            : isLowStock
                              ? "bg-amber-100/80 text-amber-800 border border-amber-200"
                              : "bg-slate-100 text-slate-800 border border-slate-200/60"
                            }`}
                        >
                          {item.quantity} <span className="text-[10px] text-slate-500 font-semibold ml-1">units</span>
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold">
                            <FiXCircle /> Out
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold">
                            <FiAlertTriangle /> Low ({item.quantity})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                            <FiCheckCircle /> In Stock
                          </span>
                        )}
                      </td>

                      {/* Admin Edit Modal Trigger */}
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-2 text-slate-400 hover:text-sky-700 hover:bg-sky-50 rounded-xl transition cursor-pointer"
                            title="Edit Product Details, Cost, Margin & Stock"
                          >
                            <FiEdit2 className="text-base" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 📄 PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <p className="text-slate-500 font-medium">
              Showing{" "}
              <strong className="text-slate-900 font-mono">{startIndex + 1}</strong> to{" "}
              <strong className="text-slate-900 font-mono">{endIndex}</strong> of{" "}
              <strong className="text-slate-900 font-mono">{totalItems}</strong> items
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handlePageChange(1)}
                disabled={validPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                title="First Page"
              >
                <FiChevronsLeft />
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(validPage - 1)}
                disabled={validPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                title="Previous Page"
              >
                <FiChevronLeft />
              </button>

              {getPageNumbers().map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePageChange(p)}
                  className={`w-8 h-8 rounded-lg font-bold font-mono transition cursor-pointer ${validPage === p
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                >
                  {p}
                </button>
              ))}

              <button
                type="button"
                onClick={() => handlePageChange(validPage + 1)}
                disabled={validPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                title="Next Page"
              >
                <FiChevronRight />
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(totalPages)}
                disabled={validPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                title="Last Page"
              >
                <FiChevronsRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🛠️ ADMIN EDIT MODAL (Optimized for iPhone 14 Pro Max & all screens) */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-7 w-full max-w-lg shadow-2xl space-y-4 my-6 text-left border border-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Edit Product &amp; Pricing
                  </h3>
                  <span className="px-2 py-0.5 rounded-lg bg-sky-50 text-sky-800 text-xs font-mono font-bold border border-sky-200">
                    {editingItem.sku}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Controller adjustments sync live to Cloud Firestore globally.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Product Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:bg-white focus:border-sky-600 transition"
                  required
                />
              </div>

              {/* Brand & Category (Clean 2-column grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-sky-600 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-sky-600 transition"
                    required
                  />
                </div>
              </div>

              {/* 💰 CONTROLLER PRICING ENGINE BOX */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-sky-50/70 border border-sky-100/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sky-900 font-bold text-xs">
                    <FiDollarSign className="text-sky-700" />
                    <span>Controller Pricing Engine</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Selling = Cost + Margin
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Cost Price */}
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-700 uppercase tracking-wider mb-1 h-5 flex items-center gap-1">
                      <span>Cost Price</span> (<AedSymbol className="text-xs" />)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={editCostPrice}
                      onChange={(e) => handleCostChange(e.target.value)}
                      className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl font-mono text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-sky-600 transition"
                      required
                    />
                  </div>

                  {/* Profit Margin */}
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-700 uppercase tracking-wider mb-1 h-5 flex items-center gap-1">
                      <span>Margin</span> (<AedSymbol className="text-xs" />)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={editMargin}
                      onChange={(e) => handleMarginChange(e.target.value)}
                      className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl font-mono text-xs sm:text-sm font-bold text-emerald-700 outline-none focus:border-sky-600 transition"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-sky-100">
                  {/* Selling Price */}
                  <div>
                    <label className="block text-[10.5px] font-bold text-sky-900 uppercase tracking-wider mb-1 h-5 flex items-center gap-1">
                      <span>Selling Price</span> (<AedSymbol className="text-xs" />)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-full py-2 px-3 bg-white border-2 border-sky-500 rounded-xl font-mono text-xs sm:text-sm font-black text-sky-950 outline-none transition"
                      required
                    />
                  </div>

                  {/* MSRP / Original Price */}
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1 h-5 flex items-center gap-1">
                      <span>Original / List</span> (<AedSymbol className="text-xs" />)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Optional"
                      value={editOriginalPrice}
                      onChange={(e) => setEditOriginalPrice(e.target.value)}
                      className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl font-mono text-xs sm:text-sm text-slate-700 outline-none focus:border-sky-600 transition"
                    />
                  </div>
                </div>
              </div>

              {/* 📦 INVENTORY & ALERTS */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 h-5 flex items-center">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editQty}
                    onChange={(e) => setEditQty(e.target.value)}
                    className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs sm:text-sm font-bold outline-none focus:bg-white focus:border-sky-600 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 h-5 flex items-center">
                    Min Stock Alert
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editAlert}
                    onChange={(e) => setEditAlert(e.target.value)}
                    className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs sm:text-sm font-bold outline-none focus:bg-white focus:border-sky-600 transition"
                    required
                  />
                </div>
              </div>

              {/* Live sync note */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-[11px] text-slate-600 font-medium">
                <FiGlobe className="text-sky-600 text-xs shrink-0" />
                <span>Saves directly to Cloud Firestore &amp; updates live globally.</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 shadow-md"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN ADD PRODUCT MODAL */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-7 w-full max-w-lg shadow-2xl my-6 text-left border border-slate-100">
            <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1">
              Add New Product to Inventory
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter product details, pricing, and stock to save to Cloud Firestore.
            </p>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SONY-WH1000XM5"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs outline-none focus:bg-white focus:border-sky-600 uppercase font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Brand *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sony, Apple, Samsung"
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-sky-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Product Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sony WH-1000XM5 Wireless Noise Canceling Headphones"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-sky-600 font-semibold"
                />
              </div>

              <div className="p-3 bg-sky-50 rounded-2xl border border-sky-100 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 text-[10px] mb-1">
                    Cost ({CURRENCY_SYMBOL})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newCostPrice}
                    onChange={(e) => {
                      setNewCostPrice(e.target.value);
                      const c = parseFloat(e.target.value) || 0;
                      const m = parseFloat(newMargin) || 0;
                      setNewPrice((c + m).toFixed(2));
                    }}
                    className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 text-[10px] mb-1">
                    Margin ({CURRENCY_SYMBOL})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newMargin}
                    onChange={(e) => {
                      setNewMargin(e.target.value);
                      const c = parseFloat(newCostPrice) || 0;
                      const m = parseFloat(e.target.value) || 0;
                      setNewPrice((c + m).toFixed(2));
                    }}
                    className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded-lg font-mono text-xs text-emerald-700 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-sky-900 text-[10px] mb-1">
                    Selling ({CURRENCY_SYMBOL})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full py-1.5 px-2 bg-white border-2 border-sky-500 rounded-lg font-mono text-xs font-black text-sky-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newQty}
                    onChange={(e) => setNewQty(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs outline-none focus:bg-white focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Min Stock Alert
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newAlert}
                    onChange={(e) => setNewAlert(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs outline-none focus:bg-white focus:border-sky-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockTable;
