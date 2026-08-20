import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  FiSmartphone,
  FiCamera,
  FiShield,
  FiClock,
  FiLock,
  FiCheckCircle,
  FiArrowRight,
  FiLayers,
  FiAlertCircle,
} from "react-icons/fi";

import IMEIScanner from "../../components/verify/IMEIScanner";
import VerifyResult from "../../components/verify/VerifyResult";
import { verifyIMEI, parseMultiIMEI } from "../../data/imeiRegistry";

/**
 * VerifyPage — /verify
 * Device Authenticity Checker for Nokia & HMD products.
 * Built 100% with Tailwind CSS utility classes.
 */
const VerifyPage = () => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState("manual"); // 'manual' | 'scan'
  const [imeiInput, setImeiInput] = useState("");
  const [result, setResult] = useState(null);
  const [inputError, setInputError] = useState("");
  const [scannerActive, setScannerActive] = useState(false);
  const [multiImeis, setMultiImeis] = useState(null); // null | string[]
  const inputRef = useRef(null);

  // Auto-verify on deep link query param (?imei=...)
  useEffect(() => {
    const paramImei = searchParams.get("imei");
    if (paramImei) {
      const imeis = parseMultiIMEI(paramImei);
      if (imeis.length === 1) {
        setImeiInput(imeis[0]);
        setResult(verifyIMEI(imeis[0]));
      } else if (imeis.length > 1) {
        setMultiImeis(imeis);
      }
    }
  }, [searchParams]);

  const handleInputChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length <= 15) {
      setImeiInput(raw);
      setInputError("");
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!imeiInput || imeiInput.length === 0) {
      setInputError("Please enter your 15-digit IMEI number.");
      inputRef.current?.focus();
      return;
    }
    setResult(verifyIMEI(imeiInput));
  };

  const handleScanResult = (rawValue) => {
    setScannerActive(false);
    setMode("manual");
    const imeis = parseMultiIMEI(rawValue);

    if (imeis.length === 0) {
      setInputError("Could not extract a valid IMEI from the scanned code. Please enter it manually.");
      return;
    }
    if (imeis.length === 1) {
      setImeiInput(imeis[0]);
      setResult(verifyIMEI(imeis[0]));
    } else {
      // Carton-level QR with multiple IMEIs
      setMultiImeis(imeis);
    }
  };

  const handleSelectImei = (imei) => {
    setMultiImeis(null);
    setImeiInput(imei);
    setResult(verifyIMEI(imei));
  };

  const handleReset = () => {
    setResult(null);
    setImeiInput("");
    setInputError("");
    setScannerActive(false);
    setMultiImeis(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const displayValue = imeiInput.match(/.{1,5}/g)?.join(" ") || imeiInput;

  return (
    <>
      <Helmet>
        <title>Verify Device Authenticity — Nokia & HMD | E-ALL</title>
        <meta
          name="description"
          content="Check if your Nokia or HMD device is genuine. Enter or scan the IMEI to instantly verify product authenticity through E-ALL's official registry."
        />
      </Helmet>

      <div className="min-h-screen bg-slate-100/70 font-sans text-slate-800">
        {/* ── HERO SECTION ────────────────────────────────────────── */}
        <section className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white pt-28 pb-20 sm:pt-36 sm:pb-28 overflow-hidden">
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-32 right-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-10 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl" />
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 sm:gap-12">
            {/* Hero Text */}
            <div className="max-w-xl text-center md:text-left">
              {/* Brand Pills */}
              <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-white/10 text-white border border-white/20 backdrop-blur-md">
                  Nokia
                </span>
                <span className="text-white/30 text-sm">×</span>
                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 backdrop-blur-md">
                  HMD
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Verify Device Authenticity
              </h1>

              <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg">
                Enter or scan your IMEI to confirm your Nokia or HMD device is genuine
                and distributed through E-ALL's official channel.
              </p>

              {/* Helpful Hint Badge */}
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/10 border border-sky-400/20 text-sky-300 text-xs sm:text-sm font-medium">
                <FiSmartphone className="text-sky-400 text-sm shrink-0" />
                <span>
                  Dial <strong className="text-sky-200 font-bold">*#06#</strong> on your phone or check the product box
                </span>
              </div>
            </div>

            {/* Hero Shield Illustration */}
            <div className="shrink-0 relative hidden md:block">
              <motion.div
                animate={{ y: [-4, 4, -4] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <div className="w-36 h-40 rounded-3xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-400/30 backdrop-blur-md flex items-center justify-center shadow-2xl shadow-indigo-500/20">
                  <FiShield className="text-6xl text-sky-400 drop-shadow-[0_0_20px_rgba(56,189,248,0.5)]" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── MAIN CONTENT (FLOATING CARD) ────────────────────────── */}
        <section className="-mt-8 sm:-mt-12 relative z-20 max-w-2xl mx-auto px-4 sm:px-6 pb-20">
          {/* Carton QR Multi-IMEI Selector */}
          {multiImeis && !result && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-100 overflow-hidden text-left"
            >
              <div className="p-6 border-b border-slate-100 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                  <FiLayers className="text-xl" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Carton QR Code Detected
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    This barcode contains <strong>{multiImeis.length} unit IMEIs</strong>. Select your unit to verify:
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-2 max-h-[380px] overflow-y-auto">
                {multiImeis.map((imei, index) => (
                  <button
                    key={imei}
                    id={`verify-select-imei-${index + 1}`}
                    type="button"
                    onClick={() => handleSelectImei(imei)}
                    className="w-full p-3.5 rounded-xl border border-slate-200/80 hover:border-sky-400 bg-white hover:bg-sky-50/50 flex items-center justify-between group transition-all text-left shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0 group-hover:bg-sky-100 group-hover:text-sky-700">
                        {index + 1}
                      </span>
                      <span className="font-mono text-sm sm:text-base font-bold tracking-wider text-slate-800 group-hover:text-sky-700">
                        {imei.match(/.{1,5}/g)?.join(" ")}
                      </span>
                    </div>
                    <FiArrowRight className="text-slate-400 group-hover:text-sky-600 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setMultiImeis(null)}
                className="w-full py-3.5 border-t border-slate-100 text-slate-500 hover:text-slate-900 text-xs sm:text-sm font-semibold transition-all bg-slate-50/50 hover:bg-slate-100/70"
              >
                Cancel and enter IMEI manually
              </button>
            </motion.div>
          )}

          {/* Main Input Form Card (when not in multi-select and no result) */}
          {!multiImeis && !result && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-100 overflow-hidden"
            >
              {/* Mode Tabs */}
              <div className="grid grid-cols-2 p-1.5 bg-slate-100/80 m-6 mb-0 rounded-2xl border border-slate-200/60" role="tablist">
                <button
                  id="verify-tab-manual"
                  role="tab"
                  type="button"
                  aria-selected={mode === "manual"}
                  onClick={() => {
                    setMode("manual");
                    setScannerActive(false);
                  }}
                  className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${mode === "manual"
                    ? "bg-white text-sky-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                    }`}
                >
                  <FiSmartphone className="text-base" />
                  Enter IMEI
                </button>

                <button
                  id="verify-tab-scan"
                  role="tab"
                  type="button"
                  aria-selected={mode === "scan"}
                  onClick={() => {
                    setMode("scan");
                    setScannerActive(true);
                  }}
                  className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${mode === "scan"
                    ? "bg-white text-sky-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                    }`}
                >
                  <FiCamera className="text-base" />
                  Scan Code
                </button>
              </div>

              {/* Form Body */}
              <div className="p-6 sm:p-8 text-left">
                {mode === "manual" && (
                  <form id="verify-manual-form" onSubmit={handleManualSubmit} noValidate>
                    <label
                      htmlFor="verify-imei-input"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2"
                    >
                      IMEI Number (15 Digits)
                    </label>

                    <div className="relative flex items-center">
                      <FiSmartphone className="absolute left-4 text-slate-400 text-lg pointer-events-none" />
                      <input
                        ref={inputRef}
                        id="verify-imei-input"
                        type="tel"
                        inputMode="numeric"
                        placeholder="e.g. 35168 21944 04729"
                        value={displayValue}
                        onChange={handleInputChange}
                        maxLength={19} // 15 digits + 3 spaces
                        autoComplete="off"
                        spellCheck="false"
                        className={`w-full pl-11 pr-16 py-3.5 sm:py-4 bg-slate-50 border-2 rounded-2xl text-slate-900 text-base sm:text-lg font-mono font-bold tracking-widest outline-none transition-all placeholder:text-slate-400 placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-sm ${inputError
                          ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                          : "border-slate-200 focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                          }`}
                      />
                      {imeiInput.length > 0 && (
                        <span
                          className={`absolute right-4 text-xs font-semibold px-2 py-0.5 rounded-md font-mono ${imeiInput.length === 15
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200/70 text-slate-600"
                            }`}
                        >
                          {imeiInput.length}/15
                        </span>
                      )}
                    </div>

                    {inputError && (
                      <p id="verify-input-error" className="mt-2 flex items-center gap-1.5 text-xs text-rose-600 font-medium" role="alert">
                        <FiAlertCircle className="text-sm shrink-0" />
                        {inputError}
                      </p>
                    )}

                    <button
                      id="verify-submit-btn"
                      type="submit"
                      disabled={imeiInput.length !== 15}
                      className="w-full mt-5 py-3.5 sm:py-4 px-6 rounded-2xl bg-linear-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-sky-600/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
                    >
                      <FiShield className="text-lg" />
                      Verify Authenticity
                    </button>
                  </form>
                )}

                {/* Camera Scanner View */}
                {mode === "scan" && scannerActive && (
                  <IMEIScanner
                    onScan={handleScanResult}
                    onClose={() => {
                      setScannerActive(false);
                      setMode("manual");
                    }}
                  />
                )}
              </div>

              {/* Trust Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-slate-50/60 border-t border-slate-100">
                <div className="p-4 sm:p-5 flex items-start gap-3 text-left">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0 mt-0.5">
                    <FiShield className="text-base" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Official Registry</h3>
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                      Direct Nokia & HMD catalogue cross-check
                    </p>
                  </div>
                </div>

                <div className="p-4 sm:p-5 flex items-start gap-3 text-left">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                    <FiClock className="text-base" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Instant Result</h3>
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                      Real-time verification in seconds
                    </p>
                  </div>
                </div>

                <div className="p-4 sm:p-5 flex items-start gap-3 text-left">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                    <FiLock className="text-base" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Private & Secure</h3>
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                      Verified locally without external logging
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Verification Result Card */}
          {result && (
            <VerifyResult result={result} onReset={handleReset} />
          )}

          {/* Brand Links Footer */}
          <div className="mt-8 text-center">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Authorised Distributor For
            </p>
            <div className="flex items-center justify-center gap-3 mt-2">
              <Link
                id="verify-nokia-link"
                to="/brands/nokia"
                className="text-xs font-bold text-slate-700 hover:text-sky-600 transition-colors"
              >
                Nokia
              </Link>
              <span className="text-slate-300 text-xs">·</span>
              <Link
                id="verify-hmd-link"
                to="/brands/hmd"
                className="text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors"
              >
                HMD
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default VerifyPage;
