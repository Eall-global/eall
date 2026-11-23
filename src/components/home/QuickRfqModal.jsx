import { useState, useEffect } from "react";
import {
  FiX,
  FiBriefcase,
  FiCheckCircle,
  FiGlobe,
  FiPackage,
  FiSend,
} from "react-icons/fi";
import { BsWhatsapp } from "react-icons/bs";
import { submitRFQ, INCOTERM_OPTIONS } from "../../services/b2bService";

const VOLUME_TIERS = [
  "10 - 50 Units",
  "50 - 200 Units",
  "200 - 1,000 Units",
  "1,000 - 5,000+ Units (Container / Air Cargo)",
];

const EMPTY_FORM = {
  companyName: "",
  trnNumber: "",
  contactName: "",
  phone: "",
  email: "",
  destinationCity: "Dubai",
  destinationCountry: "United Arab Emirates",
  incoterms: INCOTERM_OPTIONS[0],
  estimatedVolume: VOLUME_TIERS[1],
  productsRequired: "",
  additionalNotes: "",
};

const QuickRfqModal = ({ isOpen, onClose, initialProduct = "" }) => {
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    productsRequired: initialProduct || "",
  }));
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [submittedRfq, setSubmittedRfq] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleClose = () => {
    setSubmittedRfq(null);
    setErrorMsg("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!form.companyName.trim() || !form.phone.trim() || !form.productsRequired.trim()) {
      setErrorMsg("Please fill in Company Name, Phone/WhatsApp, and Products Required.");
      return;
    }

    setSubmitting(true);
    try {
      const record = await submitRFQ(form);
      setSubmittedRfq(record);
      setForm({ ...EMPTY_FORM });
    } catch (err) {
      setErrorMsg(err.message || "Could not submit RFQ. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Request B2B Wholesale Quote"
    >
      <div
        className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden my-6 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-400/30 text-orange-400 flex items-center justify-center shrink-0">
              <FiBriefcase className="text-lg" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-300 block">
                E-ALL B2B &amp; Export Desk • Dubai Silicon Oasis
              </span>
              <h3 className="text-sm sm:text-base font-extrabold truncate">
                Instant Wholesale Quote (RFQ)
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close wholesale quote dialog"
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Body */}
        {submittedRfq ? (
          <div className="p-6 sm:p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
              <FiCheckCircle className="text-3xl" />
            </div>
            <div>
              <span className="inline-block font-mono text-xs font-bold px-3 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                Reference: {submittedRfq.rfqId}
              </span>
              <h4 className="text-lg font-black text-slate-900 mt-2.5">
                Wholesale Quote Request Received!
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Your inquiry is now live with our B2B Account Managers in Dubai. You will receive an official proforma quotation with landed/EXW pricing shortly.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <a
                href={`https://wa.me/971526073267?text=${encodeURIComponent(
                  `Hi E-ALL B2B Desk, I just submitted RFQ ${submittedRfq.rfqId} for ${submittedRfq.companyName} (${submittedRfq.estimatedVolume}). Please prioritize our wholesale quote.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition"
              >
                <BsWhatsapp className="text-base" />
                Fast-Track on WhatsApp
              </a>
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-3.5 text-xs">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
              <span className="inline-flex items-center gap-1 text-sky-800">
                <FiPackage className="text-orange-500" /> Master Carton &amp; Bulk Tiers
              </span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1 text-sky-800">
                <FiGlobe className="text-sky-600" /> EXW / FOB / CIF Export Ready
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Company / Store Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  placeholder="e.g. Gulf Mobile Trading LLC"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium outline-none focus:bg-white focus:border-sky-600"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  placeholder="Full Name"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-sky-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  WhatsApp / Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+971 50 000 0000"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono outline-none focus:bg-white focus:border-sky-600"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Business Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="procurement@company.com"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-sky-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Estimated Order Volume
                </label>
                <select
                  value={form.estimatedVolume}
                  onChange={(e) =>
                    setForm({ ...form, estimatedVolume: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold outline-none focus:bg-white focus:border-sky-600 cursor-pointer"
                >
                  {VOLUME_TIERS.map((tier) => (
                    <option key={tier} value={tier}>
                      {tier}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Preferred Incoterms
                </label>
                <select
                  value={form.incoterms}
                  onChange={(e) => setForm({ ...form, incoterms: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold outline-none focus:bg-white focus:border-sky-600 cursor-pointer"
                >
                  {INCOTERM_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Destination City
                </label>
                <input
                  type="text"
                  value={form.destinationCity}
                  onChange={(e) =>
                    setForm({ ...form, destinationCity: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-sky-600"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Destination Country
                </label>
                <input
                  type="text"
                  value={form.destinationCountry}
                  onChange={(e) =>
                    setForm({ ...form, destinationCountry: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-sky-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Products, Models &amp; Quantities Needed *
              </label>
              <textarea
                rows={3}
                required
                value={form.productsRequired}
                onChange={(e) =>
                  setForm({ ...form, productsRequired: e.target.value })
                }
                placeholder="e.g. 500x Nokia 105 (Black), 200x HMD Pulse Pro, 50x iPhone 16 Pro 256GB..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-sky-600"
              />
            </div>

            {errorMsg && (
              <p className="text-xs font-semibold text-rose-600">{errorMsg}</p>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold shadow-sm cursor-pointer transition"
              >
                <FiSend />
                <span>{submitting ? "Sending..." : "Submit Wholesale RFQ"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default QuickRfqModal;

