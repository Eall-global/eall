import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
  FiShield,
  FiSmartphone,
  FiBox,
  FiCalendar,
  FiArrowRight,
  FiRefreshCw,
  FiLayers,
  FiMail,
} from "react-icons/fi";
import { products } from "../../data/products/index";

/**
 * VerifyResult
 * Displays the authenticity outcome with full Tailwind CSS layout.
 *
 * Props:
 *  - result: object returned by verifyIMEI()
 *  - onReset(): callback to clear and check another IMEI
 */
const VerifyResult = ({ result, onReset }) => {
  const { status, imei, product, message, source } = result;

  const productData = product
    ? products.find((p) => p.slug === product.productSlug)
    : null;

  const isAuthentic = status === "authentic";
  const isNotFound = status === "not_found";
  const isInvalid = status === "invalid";

  const borderColor = isAuthentic
    ? "border-t-emerald-500"
    : isNotFound
    ? "border-t-amber-500"
    : "border-t-rose-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-100 border-t-4 ${borderColor} overflow-hidden`}
    >
      {/* ── Status Header ────────────────────────────────────────── */}
      <div className="p-6 sm:p-8 pb-6 flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
        {/* Status Icon */}
        <div
          className={`w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 ${
            isAuthentic
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200/80"
              : isNotFound
              ? "bg-amber-50 text-amber-600 border border-amber-200/80"
              : "bg-rose-50 text-rose-600 border border-rose-200/80"
          }`}
        >
          {isAuthentic && <FiCheckCircle className="text-2xl" />}
          {isNotFound && <FiAlertTriangle className="text-2xl" />}
          {isInvalid && <FiXCircle className="text-2xl" />}
        </div>

        {/* Status Badges & Message */}
        <div className="flex-1 text-left">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                isAuthentic
                  ? "bg-emerald-100/80 text-emerald-800"
                  : isNotFound
                  ? "bg-amber-100/80 text-amber-800"
                  : "bg-rose-100/80 text-rose-800"
              }`}
            >
              {isAuthentic && "✓ Authentic Product"}
              {isNotFound && "⚠ Not In Registry"}
              {isInvalid && "✕ Invalid IMEI"}
            </span>

            {/* Source Tag */}
            {isAuthentic && source === "unit" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200/60">
                <FiShield className="text-[11px]" />
                Unit Verified
              </span>
            )}
            {isAuthentic && source === "tac" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                <FiLayers className="text-[11px]" />
                Model Verified
              </span>
            )}

            {/* Dual-SIM Badge */}
            {isAuthentic && product?.sim && (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                  product.sim === 1
                    ? "bg-sky-100 text-sky-800"
                    : "bg-indigo-100 text-indigo-800"
                }`}
              >
                SIM {product.sim}
              </span>
            )}
          </div>

          <p className="text-sm text-slate-600 leading-relaxed font-normal">
            {message}
          </p>
        </div>
      </div>

      {/* ── IMEI Bar ─────────────────────────────────────────────── */}
      <div className="mx-6 sm:mx-8 mb-6 p-4 bg-slate-50 border border-slate-200/70 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 text-left">
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
          Verified IMEI Number
        </span>
        <span className="font-mono text-base sm:text-lg font-bold tracking-widest text-slate-900">
          {imei.match(/.{1,5}/g)?.join(" ") || imei}
        </span>
      </div>

      {/* ── Product Card (if Authentic) ──────────────────────────── */}
      {isAuthentic && productData && (
        <div className="mx-6 sm:mx-8 mb-6 p-5 sm:p-6 bg-gradient-to-br from-slate-50 to-sky-50/30 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 text-left">
          {/* Image */}
          <div className="w-28 h-32 sm:w-32 sm:h-36 bg-white rounded-2xl border border-slate-200/70 p-2.5 flex items-center justify-center shrink-0 shadow-sm">
            <img
              src={productData.image}
              alt={productData.name}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {/* Info */}
          <div className="flex-1 w-full">
            <div className="text-xs font-bold uppercase tracking-widest text-sky-600">
              {productData.brand}
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5 mb-3">
              {productData.name}
            </h3>

            {/* Key Specs */}
            {productData.specifications && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 bg-white/80 border border-slate-200/60 rounded-xl p-3.5 mb-3">
                {productData.specifications.display && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-400 w-16 shrink-0">Display:</span>
                    <span className="text-slate-800 font-medium truncate">{productData.specifications.display}</span>
                  </div>
                )}
                {productData.specifications.battery && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-400 w-16 shrink-0">Battery:</span>
                    <span className="text-slate-800 font-medium truncate">{productData.specifications.battery}</span>
                  </div>
                )}
                {productData.specifications.operatingSystem && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-400 w-16 shrink-0">OS:</span>
                    <span className="text-slate-800 font-medium truncate">{productData.specifications.operatingSystem}</span>
                  </div>
                )}
                {productData.specifications.processor && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-400 w-16 shrink-0">Chipset:</span>
                    <span className="text-slate-800 font-medium truncate">{productData.specifications.processor}</span>
                  </div>
                )}
              </div>
            )}

            {/* Traceability Box (for unit-level registry match) */}
            {source === "unit" && product?.unitIndex && (
              <div className="bg-white border border-indigo-100 rounded-xl p-3.5 mb-3 text-xs space-y-1.5">
                <div className="font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5 text-[11px] mb-1">
                  <FiBox className="text-indigo-500" />
                  Carton & Batch Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-slate-600">
                  {product.color && (
                    <div className="flex justify-between sm:justify-start gap-2">
                      <span className="text-slate-400 font-medium">Colour:</span>
                      <span className="font-semibold text-slate-800">{product.color}</span>
                    </div>
                  )}
                  {product.unitIndex && (
                    <div className="flex justify-between sm:justify-start gap-2">
                      <span className="text-slate-400 font-medium">Unit:</span>
                      <span className="font-semibold text-slate-800">#{product.unitIndex} of Carton</span>
                    </div>
                  )}
                  {product.cartonId && (
                    <div className="flex justify-between sm:justify-start gap-2 sm:col-span-2">
                      <span className="text-slate-400 font-medium">Carton ID:</span>
                      <span className="font-mono font-bold text-slate-900">{product.cartonId}</span>
                    </div>
                  )}
                  {product.mfgDate && (
                    <div className="flex justify-between sm:justify-start gap-2">
                      <span className="text-slate-400 font-medium">Mfg Date:</span>
                      <span className="font-semibold text-slate-800">{product.mfgDate}</span>
                    </div>
                  )}
                  {product.pairedImei && (
                    <div className="flex flex-col sm:col-span-2 pt-1 border-t border-slate-100">
                      <span className="text-slate-400 font-medium">
                        SIM {product.sim === 1 ? 2 : 1} Paired IMEI:
                      </span>
                      <span className="font-mono font-bold text-indigo-700 tracking-wider">
                        {product.pairedImei.match(/.{1,5}/g)?.join(" ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Auth Guarantee Pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <FiShield className="text-emerald-500" />
                Official E-ALL Channel
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <FiCheckCircle className="text-emerald-500" />
                {productData.warranty || "Official"} Warranty
              </span>
            </div>

            {/* View Product CTA */}
            <Link
              id="verify-view-product-link"
              to={`/products/${productData.slug}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-sky-600/20 transition-all active:scale-[0.98]"
            >
              View Product Page
              <FiArrowRight />
            </Link>
          </div>
        </div>
      )}

      {/* ── Not Found Support CTA ────────────────────────────────── */}
      {isNotFound && (
        <div className="mx-6 sm:mx-8 mb-6 p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-left">
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4">
            If you purchased this device from an authorised E-ALL retail or wholesale channel, our support team can verify the serial number and assist with registration.
          </p>
          <Link
            id="verify-contact-link"
            to="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-amber-600/20 transition-all"
          >
            <FiMail />
            Contact Support Team
          </Link>
        </div>
      )}

      {/* ── Reset Button ─────────────────────────────────────────── */}
      <div className="p-6 sm:p-8 pt-0">
        <button
          id="verify-check-another-btn"
          onClick={onReset}
          type="button"
          className="w-full py-3.5 px-5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          <FiRefreshCw className="text-slate-400" />
          Check Another Device
        </button>
      </div>
    </motion.div>
  );
};

export default VerifyResult;
