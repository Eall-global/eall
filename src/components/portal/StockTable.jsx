import { useState, useMemo } from "react";
import {
  FiSearch,
  FiPlus,
  FiMinus,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiDownload,
  FiRefreshCw,
  FiEdit2,
  FiPackage,
} from "react-icons/fi";
import {
  updateStockQuantity,
  updateProductDetails,
  syncCatalogToStock,
  addCustomProduct,
} from "../../services/stockService";

const StockTable = ({ stock = [], onStockChanged, isAdmin }) => {
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All"); // All | in-stock | low-stock | out-of-stock
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [editingItem, setEditingItem] = useState(null); // For Admin Price / Alert threshold editing
  const [editPrice, setEditPrice] = useState("");
  const [editAlert, setEditAlert] = useState("");

  // New Product Modal State
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newSku, setNewSku] = useState("");
  const [newName, setNewName] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newCategory, setNewCategory] = useState("Electronics");
  const [newQty, setNewQty] = useState(10);
  const [newPrice, setNewPrice] = useState(999);
  const [newAlert, setNewAlert] = useState(3);

  const brands = useMemo(() => {
    const list = Array.from(new Set(stock.map((s) => s.brand).filter(Boolean)));
    return ["All", ...list.sort()];
  }, [stock]);

  const filteredStock = useMemo(() => {
    return stock.filter((item) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          item.name.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          item.brand.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Brand
      if (brandFilter !== "All" && item.brand !== brandFilter) {
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

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalSkus = stock.length;
    const totalUnits = stock.reduce((sum, s) => sum + s.quantity, 0);
    const lowStockCount = stock.filter(
      (s) => s.quantity > 0 && s.quantity <= s.minAlert
    ).length;
    const outOfStockCount = stock.filter((s) => s.quantity === 0).length;
    return { totalSkus, totalUnits, lowStockCount, outOfStockCount };
  }, [stock]);

  const handleAdjust = async (sku, currentQty, delta) => {
    const newQty = Math.max(0, currentQty + delta);
    await updateStockQuantity(sku, newQty);
    onStockChanged();
  };

  const handleDirectChange = async (sku, value) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0) {
      await updateStockQuantity(sku, num);
      onStockChanged();
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage("");
    try {
      const res = await syncCatalogToStock();
      setSyncMessage(`Successfully synced ${res.total} products to database!`);
      setTimeout(() => setSyncMessage(""), 4000);
      onStockChanged();
    } catch (err) {
      setSyncMessage(`Sync warning: ${err.message || "Check connection"}`);
      setTimeout(() => setSyncMessage(""), 4000);
    } finally {
      setSyncing(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newSku.trim() || !newName.trim()) return;

    await addCustomProduct({
      sku: newSku,
      name: newName,
      brand: newBrand,
      category: newCategory,
      quantity: newQty,
      price: newPrice,
      minAlert: newAlert,
    });

    setNewSku("");
    setNewName("");
    setNewBrand("");
    setShowAddProductModal(false);
    onStockChanged();
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEditPrice(item.price);
    setEditAlert(item.minAlert);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    await updateProductDetails(editingItem.sku, {
      price: editPrice,
      minAlert: editAlert,
    });
    setEditingItem(null);
    onStockChanged();
  };

  const handleExportCSV = () => {
    const headers = ["SKU", "Product Name", "Brand", "Category", "Quantity", "Price (AED)", "Min Alert"];
    const rows = stock.map((s) => [
      `"${s.sku}"`,
      `"${s.name}"`,
      `"${s.brand}"`,
      `"${s.category}"`,
      s.quantity,
      s.price,
      s.minAlert,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EALL_Stock_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* 📊 SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total SKUs</span>
            <FiPackage className="text-sky-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{metrics.totalSkus}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Active database items</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Units</span>
            <FiCheckCircle className="text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">{metrics.totalUnits}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Physical items on hand</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Low Stock</span>
            <FiAlertTriangle className="text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600">{metrics.lowStockCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Needs reordering</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Out of Stock</span>
            <FiXCircle className="text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-600">{metrics.outOfStockCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">0 units remaining</p>
        </div>
      </div>

      {/* 🔍 SEARCH & ACTION TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        {syncMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <FiCheckCircle className="text-base text-emerald-600" />
            {syncMessage}
          </div>
        )}

        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search bar */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by SKU, product name, brand..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-sky-600 outline-none transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowAddProductModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <FiPlus />
                Add Product
              </button>
            )}

            <button
              onClick={handleSync}
              disabled={syncing}
              title="Populate or refresh catalog products into database"
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <FiRefreshCw className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing..." : "Sync Catalog"}
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <FiDownload />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            {["All", "in-stock", "low-stock", "out-of-stock"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`
                  px-2.5 py-1 rounded-lg font-medium transition cursor-pointer
                  ${
                    statusFilter === status
                      ? "bg-white text-slate-900 shadow-xs font-bold"
                      : "text-slate-500 hover:text-slate-800"
                  }
                `}
              >
                {status === "All"
                  ? "All Stock"
                  : status === "in-stock"
                  ? "In Stock"
                  : status === "low-stock"
                  ? "Low Stock"
                  : "Out of Stock"}
              </button>
            ))}
          </div>

          {/* Brand select */}
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 outline-none text-slate-700 cursor-pointer font-medium"
          >
            {brands.map((b) => (
              <option key={b} value={b}>
                Brand: {b}
              </option>
            ))}
          </select>

          <span className="ml-auto text-xs text-slate-400">
            Showing <strong className="text-slate-700">{filteredStock.length}</strong> items
          </span>
        </div>
      </div>

      {/* 📋 INVENTORY TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">SKU / Product</th>
                <th className="py-3.5 px-4">Brand & Category</th>
                <th className="py-3.5 px-4 text-right">Unit Price</th>
                <th className="py-3.5 px-4 text-center">Available Stock</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                {isAdmin && <th className="py-3.5 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredStock.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No products match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredStock.map((item) => {
                  const isOutOfStock = item.quantity === 0;
                  const isLowStock = !isOutOfStock && item.quantity <= item.minAlert;

                  return (
                    <tr
                      key={item.sku}
                      className="hover:bg-slate-50/70 transition-colors"
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
                            <p className="font-semibold text-slate-900 truncate max-w-xs sm:max-w-md">
                              {item.name}
                            </p>
                            <p className="text-xs font-mono text-slate-400">
                              {item.sku}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Brand & Category */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 text-xs font-semibold mb-0.5">
                          {item.brand}
                        </span>
                        <p className="text-[11px] text-slate-400">
                          {item.category}
                        </p>
                      </td>

                      {/* Unit Price */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        AED {Number(item.price).toLocaleString("en-AE", { minimumFractionDigits: 2 })}
                      </td>

                      {/* Quantity Stepper */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAdjust(item.sku, item.quantity, -1)}
                            disabled={item.quantity === 0}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                          >
                            <FiMinus className="text-xs" />
                          </button>

                          <input
                            type="number"
                            min="0"
                            value={item.quantity}
                            onChange={(e) => handleDirectChange(item.sku, e.target.value)}
                            className="w-14 text-center font-mono font-extrabold text-slate-900 py-1 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:border-sky-600"
                          />

                          <button
                            type="button"
                            onClick={() => handleAdjust(item.sku, item.quantity, 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-600 transition cursor-pointer"
                          >
                            <FiPlus className="text-xs" />
                          </button>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold">
                            <FiXCircle /> Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold">
                            <FiAlertTriangle /> Low ({item.quantity})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                            <FiCheckCircle /> Available
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
                            title="Edit Price & Alert Level"
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
      </div>

      {/* ADMIN EDIT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Edit Product Info
            </h3>
            <p className="text-xs text-slate-500 mb-4">{editingItem.name} ({editingItem.sku})</p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Selling Price (AED)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm outline-none focus:bg-white focus:border-sky-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Low Stock Alert Threshold (Units)
                </label>
                <input
                  type="number"
                  min="1"
                  value={editAlert}
                  onChange={(e) => setEditAlert(e.target.value)}
                  className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm outline-none focus:bg-white focus:border-sky-600"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-semibold transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN ADD PRODUCT MODAL */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Add New Product to Inventory
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter product details to add directly to database stock.
            </p>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SKU / Product Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SONY-WH1000XM5"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs outline-none focus:bg-white focus:border-sky-600 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Brand *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sony, Apple, Samsung"
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-sky-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sony WH-1000XM5 Noise Canceling Headphones"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-sky-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Price (AED)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs outline-none focus:bg-white focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Min Alert
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
                  className="px-5 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
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
