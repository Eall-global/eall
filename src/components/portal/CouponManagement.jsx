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

  return (
    <div className="space-y-6 text-left">
      {/* 🏷️ HEADER & ACTIONS */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <FiTag className="text-sky-700" /> Coupons &amp; Promotional Vouchers
          </h2>
          <p className="text-xs text-slate-500">
            Create discount codes, set first-order rules, minimum spend thresholds, and manage active offers.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
          >
            <FiPlus className="text-base" />
            <span>Create Coupon</span>
          </button>
        </div>
      </div>

      {/* 📦 COUPONS LIST TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Coupon Code</th>
                <th className="py-3.5 px-4">Discount Value</th>
                <th className="py-3.5 px-4">Min. Spend (<AedSymbol />)</th>
                <th className="py-3.5 px-4 text-center">First Order Only</th>
                <th className="py-3.5 px-4">Expires</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FiTag className="text-3xl mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold">No coupons found. Create your first coupon above.</p>
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
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
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold transition cursor-pointer ${c.isActive
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
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
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
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl font-bold transition shadow-xs disabled:opacity-50"
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
