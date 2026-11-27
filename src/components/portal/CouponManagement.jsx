import { useState, useEffect, useMemo } from "react";
import {
  FiTag,
  FiPlus,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiX,
  FiGrid,
  FiList,
  FiSearch,
  FiGlobe,
} from "react-icons/fi";
import {
  fetchCoupons,
  saveCoupon,
  deleteCoupon,
  resolveCouponForLocation,
} from "../../services/couponService";
import { usePortalCurrency } from "../../context/PortalCurrencyContext";
import { AedSymbol, AedPrice } from "../common/AedSymbol";
import CountryFlag from "../common/CountryFlag";
import { CouponTicketCard } from "../common/CouponTicketStrip";

const CouponManagement = () => {
  const portalCur = usePortalCurrency();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'
  const [search, setSearch] = useState("");
  const [copiedCode, setCopiedCode] = useState(null);

  // New Coupon Form State
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState("percent"); // "percent" | "flat"
  const [discountPercent, setDiscountPercent] = useState(10);
  const [discountFlat, setDiscountFlat] = useState(0);
  const [minOrderAmount, setMinOrderAmount] = useState(0);
  const [scopeMode, setScopeMode] = useState("ALL"); // "ALL" | active country code
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
    let active = true;
    fetchCoupons()
      .then((data) => {
        if (active) setCoupons(data);
      })
      .catch((e) => console.error("Could not load coupons:", e))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleOpenAddModal = () => {
    setCode("");
    setDescription("");
    setDiscountType("percent");
    setDiscountPercent(10);
    setDiscountFlat(0);
    setMinOrderAmount(0);
    setScopeMode(portalCur.isAll ? "ALL" : portalCur.countryCode);
    setFirstOrderOnly(false);
    setExpiresAt("2027-12-31");
    setShowAddModal(true);
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    const isGlobalScope = scopeMode === "ALL";
    const couponCurrency = isGlobalScope ? "AED" : portalCur.currency;

    setIsSaving(true);
    try {
      await saveCoupon({
        code: code.trim(),
        description: description.trim(),
        discountPercent:
          discountType === "percent" ? parseFloat(discountPercent) || 0 : 0,
        discountFlat:
          discountType === "flat" ? parseFloat(discountFlat) || 0 : 0,
        minOrderAmount: parseFloat(minOrderAmount) || 0,
        locationCode: isGlobalScope ? "ALL" : portalCur.countryCode,
        currency: couponCurrency,
        firstOrderOnly: Boolean(firstOrderOnly),
        expiresAt,
        isActive: true,
      });
      setShowAddModal(false);
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

  const handleCopyPreview = (couponCode) => {
    navigator.clipboard?.writeText(couponCode);
    setCopiedCode(couponCode);
    window.setTimeout(() => {
      setCopiedCode((prev) => (prev === couponCode ? null : prev));
    }, 1800);
  };

  // Resolve every coupon into the active Back Office location's currency & scope
  const resolvedCoupons = useMemo(() => {
    const q = search.toLowerCase().trim();
    return coupons
      .map((c) => resolveCouponForLocation(c, portalCur.locationConfig))
      .filter((c) => {
        if (!portalCur.isAll && !c.isEligible) return false;
        if (!q) return true;
        return (
          (c.code || "").toLowerCase().includes(q) ||
          (c.localizedDescription || "").toLowerCase().includes(q) ||
          (c.headline || "").toLowerCase().includes(q)
        );
      });
  }, [coupons, portalCur.locationConfig, portalCur.isAll, search]);

  // Live ticket preview inside Create Modal
  const draftPreviewCoupon = useMemo(() => {
    const isGlobalScope = scopeMode === "ALL";
    return resolveCouponForLocation(
      {
        code: (code || "NEWCODE").toUpperCase().trim(),
        description: description.trim(),
        discountPercent:
          discountType === "percent" ? parseFloat(discountPercent) || 0 : 0,
        discountFlat:
          discountType === "flat" ? parseFloat(discountFlat) || 0 : 0,
        minOrderAmount: parseFloat(minOrderAmount) || 0,
        locationCode: isGlobalScope ? "ALL" : portalCur.countryCode,
        currency: isGlobalScope ? "AED" : portalCur.currency,
        firstOrderOnly: Boolean(firstOrderOnly),
      },
      portalCur.locationConfig
    );
  }, [
    code,
    description,
    discountType,
    discountPercent,
    discountFlat,
    minOrderAmount,
    scopeMode,
    firstOrderOnly,
    portalCur.countryCode,
    portalCur.currency,
    portalCur.locationConfig,
  ]);

  const modalCurrencySymbol =
    scopeMode === "ALL" ? "AED" : portalCur.symbol;

  return (
    <div className="space-y-4 sm:space-y-5 text-left">
      {/* 🔍 UNIFIED SEARCH & ACTION BAR */}
      <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 transition-colors">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-base" />
          <input
            type="text"
            placeholder="Search coupons by code or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-9 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 dark:focus:border-sky-500 transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg text-xs cursor-pointer"
            >
              <FiX />
            </button>
          )}
        </div>

        {/* Actions: Grid/Table Toggle + Refresh + Create Coupon */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            role="group"
            aria-label="View mode"
            className="inline-flex items-center h-10 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700"
          >
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
              title="Grid View"
              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FiGrid className="text-[15px]" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              aria-label="Table view"
              aria-pressed={viewMode === "table"}
              title="Table View"
              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition cursor-pointer ${
                viewMode === "table"
                  ? "bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FiList className="text-[15px]" />
            </button>
          </div>

          <button
            type="button"
            onClick={loadCoupons}
            disabled={loading}
            aria-label="Refresh coupons"
            title="Refresh"
            className="inline-flex items-center justify-center w-10 h-10 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition cursor-pointer shrink-0"
          >
            <FiRefreshCw className={`text-[15px] ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="ml-auto md:ml-0 inline-flex items-center justify-center gap-1.5 h-10 px-4 bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer whitespace-nowrap"
          >
            <FiPlus className="text-base" />
            <span>Create Coupon</span>
          </button>
        </div>
      </div>

      {/* 🔲 VIEW MODE 1: TICKET CARDS VIEW */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {resolvedCoupons.length === 0 ? (
            <div className="col-span-full p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 space-y-2">
              <FiTag className="text-4xl mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold">No coupons matching your criteria.</p>
            </div>
          ) : (
            resolvedCoupons.map((c) => (
              <div
                key={c.id || c.code}
                className={`p-4 bg-white dark:bg-slate-900 rounded-3xl border transition-all duration-300 space-y-3.5 shadow-2xs hover:shadow-md flex flex-col justify-between ${
                  c.isActive
                    ? "border-slate-200/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-500/40"
                    : "border-slate-200/60 dark:border-slate-800/60 opacity-75 bg-slate-50/50 dark:bg-slate-900/60"
                }`}
              >
                <div className="space-y-3">
                  {/* Live Storefront Ticket Preview */}
                  <div className="rounded-2xl bg-[#091A32] p-1.5">
                    <CouponTicketCard
                      coupon={c}
                      copied={copiedCode === c.code}
                      onCopy={handleCopyPreview}
                      compact={true}
                    />
                  </div>

                  {/* Scope + Active Toggle Row */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10.5px] font-bold">
                      {c.isGlobal ? (
                        <>
                          <FiGlobe className="text-sky-600 dark:text-sky-400 text-xs" />
                          <span>
                            Global • {portalCur.currency} Auto FX
                          </span>
                        </>
                      ) : (
                        <>
                          <CountryFlag code={c.locationCode} size="xs" />
                          <span>{c.locationCode} Exclusive</span>
                        </>
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(c)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer shrink-0 ${
                        c.isActive
                          ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/25"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {c.isActive ? (
                        <>
                          <FiCheckCircle className="text-xs text-emerald-600 dark:text-emerald-400" /> Active
                        </>
                      ) : (
                        <>
                          <FiXCircle className="text-xs text-slate-400" /> Inactive
                        </>
                      )}
                    </button>
                  </div>

                  {/* Localized Description */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed line-clamp-2">
                    {c.localizedDescription}
                  </p>

                  {/* Metrics 2x2 Grid (Localized to Active Country Currency!) */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/70 rounded-2xl space-y-0.5">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">
                        Discount Value
                      </span>
                      {c.discountPercent > 0 ? (
                        <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-xs">
                          {c.discountPercent}% OFF
                        </span>
                      ) : (
                        <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-xs">
                          <AedPrice amount={c.discountFlatLocal} decimals={0} /> OFF
                        </span>
                      )}
                    </div>

                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/70 rounded-2xl space-y-0.5">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">
                        Min. Spend
                      </span>
                      {c.minOrderLocal > 0 ? (
                        <AedPrice
                          amount={c.minOrderLocal}
                          decimals={0}
                          className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs"
                        />
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400 font-medium text-xs">
                          No Minimum
                        </span>
                      )}
                    </div>

                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/70 rounded-2xl space-y-0.5">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">
                        Audience
                      </span>
                      {c.firstOrderOnly ? (
                        <span className="text-[10.5px] font-bold text-amber-800 dark:text-amber-300">
                          1st Order Only (1x)
                        </span>
                      ) : (
                        <span className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300">
                          All Customers
                        </span>
                      )}
                    </div>

                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/70 rounded-2xl space-y-0.5">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">
                        Expires
                      </span>
                      <span className="font-mono text-slate-600 dark:text-slate-300 text-[11px] truncate block">
                        {c.expiresAt || "Never"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-[10.5px] text-slate-400 dark:text-slate-500">
                    {c.firstOrderOnly ? "First-time buyer rule" : "Storewide offer"}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDelete(c.id || c.code)}
                    className="inline-flex items-center gap-1 text-xs text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-semibold p-1 cursor-pointer"
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/90 dark:bg-slate-800/70 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Coupon Code</th>
                  <th className="py-3.5 px-4">Scope</th>
                  <th className="py-3.5 px-4">Discount Value</th>
                  <th className="py-3.5 px-4">Min. Spend (<AedSymbol />)</th>
                  <th className="py-3.5 px-4 text-center">Audience</th>
                  <th className="py-3.5 px-4">Expires</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium text-slate-700 dark:text-slate-300">
                {resolvedCoupons.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      <FiTag className="text-3xl mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm font-semibold">No coupons found.</p>
                    </td>
                  </tr>
                ) : (
                  resolvedCoupons.map((c) => (
                    <tr key={c.id || c.code} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs sm:text-sm px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-500/15 text-sky-900 dark:text-sky-300 border border-sky-200 dark:border-sky-500/25">
                            {c.code}
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                            {c.localizedDescription}
                          </p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                        {c.isGlobal ? (
                          <span className="inline-flex items-center gap-1 text-sky-700 dark:text-sky-300 font-bold">
                            <FiGlobe className="text-xs" /> Global
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 font-bold">
                            <CountryFlag code={c.locationCode} size="xs" />
                            <span>{c.locationCode}</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {c.discountPercent > 0 ? (
                          <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 px-2 py-0.5 rounded-md font-mono text-xs">
                            {c.discountPercent}% OFF
                          </span>
                        ) : (
                          <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 px-2 py-0.5 rounded-md font-mono text-xs">
                            <AedPrice amount={c.discountFlatLocal} decimals={0} /> OFF
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        {c.minOrderLocal > 0 ? (
                          <AedPrice amount={c.minOrderLocal} decimals={0} />
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">No minimum</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {c.firstOrderOnly ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[10.5px] font-bold border border-amber-200 dark:border-amber-500/25">
                            1st Order Only (1x)
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-xs">All Customers</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-xs">
                        {c.expiresAt || "Never"}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(c)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold transition cursor-pointer ${
                            c.isActive
                              ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/25"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
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
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 w-full max-w-lg shadow-2xl space-y-4 my-6 text-left border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Create New Coupon Voucher
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl cursor-pointer"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            {/* Live Ticket Preview */}
            <div className="rounded-2xl bg-[#091A32] p-2">
              <CouponTicketCard
                coupon={draftPreviewCoupon}
                copied={false}
                onCopy={() => {}}
                compact={true}
              />
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs">
              {/* Scope Selector (Global Auto FX vs Country-Specific) */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                  Country Availability &amp; Currency
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setScopeMode("ALL")}
                    className={`p-2 rounded-xl border text-left font-bold transition cursor-pointer flex items-center gap-2 ${
                      scopeMode === "ALL"
                        ? "bg-sky-50 dark:bg-sky-500/15 border-sky-500 text-sky-900 dark:text-sky-200"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <FiGlobe className="text-sm shrink-0 text-sky-600" />
                    <span className="truncate">All Countries (AED Auto FX)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScopeMode(portalCur.countryCode)}
                    className={`p-2 rounded-xl border text-left font-bold transition cursor-pointer flex items-center gap-2 ${
                      scopeMode !== "ALL"
                        ? "bg-sky-50 dark:bg-sky-500/15 border-sky-500 text-sky-900 dark:text-sky-200"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <CountryFlag code={portalCur.countryCode} size="xs" />
                    <span className="truncate">
                      {portalCur.shortName} Only ({portalCur.currency})
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Coupon Code *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. WELCOME10, KE500"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase font-bold text-slate-900 dark:text-white outline-none focus:border-sky-600 dark:focus:border-sky-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px]">
                      {discountType === "percent"
                        ? "Discount (%)"
                        : `Flat Discount (${modalCurrencySymbol})`}
                    </label>
                    <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setDiscountType("percent")}
                        className={`px-2 py-0.5 rounded-md cursor-pointer ${
                          discountType === "percent"
                            ? "bg-sky-700 text-white"
                            : "text-slate-500"
                        }`}
                      >
                        %
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountType("flat")}
                        className={`px-2 py-0.5 rounded-md cursor-pointer ${
                          discountType === "flat"
                            ? "bg-sky-700 text-white"
                            : "text-slate-500"
                        }`}
                      >
                        {modalCurrencySymbol}
                      </button>
                    </div>
                  </div>
                  {discountType === "percent" ? (
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-emerald-700 dark:text-emerald-400 outline-none focus:border-sky-600 dark:focus:border-sky-500"
                    />
                  ) : (
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={discountFlat}
                      onChange={(e) => setDiscountFlat(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-emerald-700 dark:text-emerald-400 outline-none focus:border-sky-600 dark:focus:border-sky-500"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                  Description / Marketing Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Leave blank to auto-localize currency copy per country"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-sky-600 dark:focus:border-sky-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Min Order Subtotal ({modalCurrencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white outline-none focus:border-sky-600 dark:focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white outline-none focus:border-sky-600 dark:focus:border-sky-500"
                  />
                </div>
              </div>

              {/* First-Order Only Checkbox */}
              <div className="p-3 bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/25 rounded-xl flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="firstOrderOnly"
                  checked={firstOrderOnly}
                  onChange={(e) => setFirstOrderOnly(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                />
                <div>
                  <label htmlFor="firstOrderOnly" className="font-bold text-slate-900 dark:text-white cursor-pointer block text-xs">
                    Limit to First-Time Customers Only (1x per Customer)
                  </label>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Automatically verifies customer order history in Firestore. If the customer has already completed an order, this coupon is rejected.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white rounded-xl font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
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
