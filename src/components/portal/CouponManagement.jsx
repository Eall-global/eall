import { useState, useEffect } from "react";
import {
  FiTag,
  FiPlus,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiPercent,
  FiCalendar,
  FiX,
  FiDollarSign,
  FiClock,
  FiGrid,
  FiList,
  FiSearch,
} from "react-icons/fi";
import {
  fetchCoupons,
  saveCoupon,
  deleteCoupon,
  DEFAULT_COUPONS,
} from "../../services/couponService";
import { AedSymbol, AedPrice } from "../common/AedSymbol";

const CouponManagement = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'
  const [search, setSearch] = useState("");

  // New Coupon Form State
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountPercent, setDiscountPercent] = useState(10);
  const [discountFlat, setDiscountFlat] = useState(0);
  const [minOrderAmount, setMinOrderAmount] = useState(0);
  const [firstOrderOnly, setFirstOrderOnly] = useState(false);
  const [expiresAt, setExpiresAt] = useState("2027-12-31");
  const [isSaving, setIsSaving] = useState(false);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const data = await fetchCoupons();
      setCoupons(data);
    } catch (e) {
      console.error("Could not load coupons:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsSaving(true);
    try {
      await saveCoupon({
        code: code.trim(),
        description: description.trim(),
        discountPercent: parseFloat(discountPercent) || 0,
        discountFlat: parseFloat(discountFlat) || 0,
        minOrderAmount: parseFloat(minOrderAmount) || 0,
        firstOrderOnly: Boolean(firstOrderOnly),
        expiresAt,
        isActive: true,
      });
      setShowAddModal(false);
      setCode("");
      setDescription("");
      setDiscountPercent(10);
      setDiscountFlat(0);
      setMinOrderAmount(0);
      setFirstOrderOnly(false);
      loadCoupons();
    } catch (err) {
      alert(err.message || "Failed to save coupon");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (c) => {
    await saveCoupon({
      ...c,
      isActive: !c.isActive,
    });
    loadCoupons();
  };

  const handleDelete = async (cId) => {
    if (window.confirm("Are you sure you want to delete this coupon?")) {
      await deleteCoupon(cId);
      loadCoupons();
    }
  };

  const filteredCoupons = coupons.filter(
    (c) =>
      (c.code || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6 text-left">
      {/* 🏷️ HEADER & ACTIONS */}
      <div className="p-4 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <FiTag className="text-sky-700" /> Coupons &amp; Promotional Vouchers
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            Create discount codes, set first-order rules, minimum spend thresholds, and manage active offers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start sm:justify-end">
          
          {/* 🔲 VIEW MODE SWITCHER (GRID vs TABLE) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-sky-800 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Card / Grid View"
            >
              <FiGrid className="text-sm" />
              <span>Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-sky-800 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Table View"
            >
              <FiList className="text-sm" />
              <span>Table</span>
            </button>
          </div>

          <button
            type="button"
            onClick={loadCoupons}
            disabled={loading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
            title="Refresh"
          >
            <FiRefreshCw className={`text-sm ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
          >
            <FiPlus className="text-base" />
            <span>Create Coupon</span>
          </button>
        </div>
      </div>

      {/* 🔍 SEARCH BAR */}
      <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-2">
        <FiSearch className="text-slate-400 text-base shrink-0 ml-1" />
        <input
          type="text"
          placeholder="Search coupons by code or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-800 outline-none"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg text-xs"
          >
            <FiX />
          </button>
        )}
      </div>

      {/* 🔲 VIEW MODE 1: GRID / CARDS VIEW (SUPPORTED ON BOTH MOBILE & WEB) */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCoupons.length === 0 ? (
            <div className="col-span-full p-12 bg-white rounded-3xl border border-slate-200 text-center text-slate-400 space-y-2">
              <FiTag className="text-4xl mx-auto text-slate-300" />
              <p className="text-sm font-semibold">No coupons matching your criteria.</p>
            </div>
          ) : (
            filteredCoupons.map((c) => (
              <div
                key={c.id || c.code}
                className={`p-5 bg-white rounded-3xl border transition-all duration-300 space-y-3.5 shadow-2xs hover:shadow-md flex flex-col justify-between ${
                  c.isActive
                    ? "border-slate-200 hover:border-sky-300"
                    : "border-slate-200/60 opacity-75 bg-slate-50/50"
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header: Code & Active Pill */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-black text-slate-900 text-sm px-3 py-1 rounded-xl bg-sky-50 text-sky-900 border border-sky-200 truncate">
                      {c.code}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(c)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer shrink-0 ${
                        c.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                    >
                      {c.isActive ? (
                        <>
                          <FiCheckCircle className="text-xs text-emerald-600" /> Active
                        </>
                      ) : (
                        <>
                          <FiXCircle className="text-xs text-slate-400" /> Inactive
                        </>
                      )}
                    </button>
                  </div>

                  {/* Description */}
                  {c.description && (
                    <p className="text-xs text-slate-600 font-medium leading-relaxed line-clamp-2">
                      {c.description}
                    </p>
                  )}

                  {/* Metrics 2x2 Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-2xl space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Discount Value
                      </span>
                      {c.discountPercent > 0 ? (
                        <span className="font-mono font-black text-emerald-700 text-xs">
                          {c.discountPercent}% OFF
                        </span>
                      ) : (
                        <span className="font-mono font-black text-emerald-700 text-xs">
                          <AedPrice amount={c.discountFlat} /> OFF
                        </span>
                      )}
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-2xl space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Min. Spend
                      </span>
                      {c.minOrderAmount > 0 ? (
                        <AedPrice amount={c.minOrderAmount} className="font-mono font-bold text-slate-800 text-xs" />
                      ) : (
                        <span className="text-slate-500 font-medium text-xs">No Minimum</span>
                      )}
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-2xl space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Audience
                      </span>
                      {c.firstOrderOnly ? (
                        <span className="text-[10.5px] font-bold text-amber-800">
                          1st Order Only (1x)
                        </span>
                      ) : (
                        <span className="text-[10.5px] font-bold text-slate-700">
                          All Customers
                        </span>
                      )}
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-2xl space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Expires
                      </span>
                      <span className="font-mono text-slate-600 text-[11px] truncate block">
                        {c.expiresAt || "Never"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
                  <span className="text-[10.5px] text-slate-400">
                    {c.firstOrderOnly ? "First-time buyer rule" : "Storewide offer"}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDelete(c.id || c.code)}
                    className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 font-semibold p-1 cursor-pointer"
                    title="Delete coupon"
                  >
                    <FiTrash2 className="text-sm" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 📄 VIEW MODE 2: TABLE VIEW */}
      {viewMode === "table" && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Coupon Code</th>
                  <th className="py-3.5 px-4">Discount Value</th>
                  <th className="py-3.5 px-4">Min. Spend (<AedSymbol />)</th>
                  <th className="py-3.5 px-4 text-center">Audience</th>
                  <th className="py-3.5 px-4">Expires</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredCoupons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <FiTag className="text-3xl mx-auto mb-2 text-slate-300" />
                      <p className="text-sm font-semibold">No coupons found.</p>
                    </td>
                  </tr>
                ) : (
                  filteredCoupons.map((c) => (
                    <tr key={c.id || c.code} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-slate-900 text-xs sm:text-sm px-2.5 py-1 rounded-lg bg-sky-50 text-sky-900 border border-sky-200">
                            {c.code}
                          </span>
                          {c.description && (
                            <p className="text-[11px] text-slate-500 truncate max-w-xs">{c.description}</p>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {c.discountPercent > 0 ? (
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-mono text-xs">
                            {c.discountPercent}% OFF
                          </span>
                        ) : (
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-mono text-xs">
                            <AedPrice amount={c.discountFlat} /> OFF
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        {c.minOrderAmount > 0 ? (
                          <AedPrice amount={c.minOrderAmount} />
                        ) : (
                          <span className="text-slate-400">No minimum</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {c.firstOrderOnly ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10.5px] font-bold border border-amber-200">
                            1st Order Only (1x)
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">All Customers</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">
                        {c.expiresAt || "Never"}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(c)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold transition cursor-pointer ${
                            c.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {c.isActive ? (
                            <>
                              <FiCheckCircle className="text-xs" /> Active
                            </>
                          ) : (
                            <>
                              <FiXCircle className="text-xs" /> Inactive
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id || c.code)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                          title="Delete coupon"
                        >
                          <FiTrash2 className="text-sm" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ✏️ CREATE COUPON MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-7 w-full max-w-lg shadow-2xl space-y-4 my-6 text-left border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Create New Coupon Voucher
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                    Coupon Code *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. WELCOME10, SUMMER20"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase font-bold text-slate-900 outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                    Discount Percentage (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-emerald-700 outline-none focus:border-sky-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                  Description / Marketing Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10% discount for first time shoppers"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-sky-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                    Min Order Subtotal (<AedSymbol />)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 outline-none focus:border-sky-600"
                  />
                </div>
              </div>

              {/* First-Order Only Checkbox */}
              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="firstOrderOnly"
                  checked={firstOrderOnly}
                  onChange={(e) => setFirstOrderOnly(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                />
                <div>
                  <label htmlFor="firstOrderOnly" className="font-bold text-slate-900 cursor-pointer block text-xs">
                    Limit to First-Time Customers Only (1x per Customer)
                  </label>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Automatically verifies customer order history in Firestore. If the customer has already completed an order, this coupon is rejected.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? "Saving..." : "Save Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponManagement;
