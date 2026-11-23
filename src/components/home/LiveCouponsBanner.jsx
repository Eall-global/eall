import { useState, useEffect } from "react";
import { FiTag, FiCopy, FiCheck, FiPercent } from "react-icons/fi";
import { fetchCoupons, DEFAULT_COUPONS } from "../../services/couponService";

const LiveCouponsBanner = () => {
  const [coupons, setCoupons] = useState(DEFAULT_COUPONS);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    let active = true;
    fetchCoupons()
      .then((list) => {
        if (!active || !Array.isArray(list)) return;
        const now = new Date();
        const valid = list.filter(
          (c) =>
            c.isActive !== false &&
            (!c.expiresAt || new Date(c.expiresAt) >= now)
        );
        if (valid.length > 0) setCoupons(valid);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!coupons.length) return null;

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    window.setTimeout(() => {
      setCopiedCode((prev) => (prev === code ? null : prev));
    }, 2000);
  };

  return (
    <section className="py-8 sm:py-10 bg-slate-50/70 border-y border-slate-200/70 text-left">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 p-5 sm:p-7 lg:p-8 text-white shadow-sm overflow-hidden relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 w-72 h-72 rounded-full bg-sky-500/15 blur-3xl"
          />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Heading */}
            <div className="max-w-sm space-y-1.5">
              <span className="inline-flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                <FiPercent className="text-xs" />
                Active Storefront Vouchers
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Save Instantly at Checkout
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Copy any active voucher below and apply it in your cart — synced live with E-ALL promotions.
              </p>
            </div>

            {/* Ticket Voucher Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
              {coupons.slice(0, 3).map((coupon) => {
                const isCopied = copiedCode === coupon.code;
                const valueLabel =
                  Number(coupon.discountPercent) > 0
                    ? `${coupon.discountPercent}% OFF`
                    : `AED ${Number(coupon.discountFlat || 0).toFixed(0)} OFF`;

                return (
                  <div
                    key={coupon.code}
                    className="rounded-2xl bg-white/10 hover:bg-white/14 border border-white/15 backdrop-blur-xs p-4 flex flex-col justify-between gap-3 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-black text-emerald-300 font-mono">
                          {valueLabel}
                        </span>
                        <FiTag className="text-sky-300 text-sm shrink-0" />
                      </div>
                      <p className="text-xs text-slate-200 mt-1 line-clamp-2 leading-snug">
                        {coupon.description}
                      </p>
                      {Number(coupon.minOrderAmount) > 0 && (
                        <p className="text-[10.5px] text-slate-400 mt-1 font-mono">
                          Min. spend AED{" "}
                          {Number(coupon.minOrderAmount).toLocaleString()}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(coupon.code)}
                      className={`w-full py-2 px-3 rounded-xl font-mono text-xs font-extrabold flex items-center justify-between gap-2 border border-dashed transition cursor-pointer ${
                        isCopied
                          ? "bg-emerald-500 text-white border-emerald-300"
                          : "bg-white text-slate-900 hover:bg-sky-50 border-sky-300"
                      }`}
                    >
                      <span>{coupon.code}</span>
                      <span className="inline-flex items-center gap-1 font-sans text-[11px] font-bold">
                        {isCopied ? (
                          <>
                            <FiCheck /> Copied
                          </>
                        ) : (
                          <>
                            <FiCopy /> Copy
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveCouponsBanner;

