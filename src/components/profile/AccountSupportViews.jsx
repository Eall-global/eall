import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiPhone,
  FiMail,
  FiMapPin,
  FiClock,
  FiShield,
  FiCheckCircle,
  FiChevronRight,
  FiChevronDown,
  FiSearch,
  FiX,
  FiTruck,
  FiRefreshCw,
  FiBriefcase,
  FiSend,
  FiGlobe,
  FiAward,
  FiExternalLink,
} from "react-icons/fi";
import { BsWhatsapp } from "react-icons/bs";
import { useCountry } from "../../context/CountryContext";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import { submitRFQ } from "../../services/b2bService";
import CountryFlag from "../common/CountryFlag";

const PAYMENT_LABELS = {
  apple_pay: "Apple Pay",
  card: "Credit / Debit Card",
  tabby: "Tabby (4x Interest-Free)",
  tamara: "Tamara (Split in 4)",
  mpesa: "M-Pesa Mobile Money",
  wave: "Wave Mobile Money",
  orange_money: "Orange Money",
  mtn_momo: "MTN MoMo",
  airtel_money: "Airtel Money",
  cod: "Cash on Delivery",
  wire: "Bank Wire Transfer",
};

const formatThreshold = (country) => {
  const sym = country?.currencySymbol || country?.currency || "AED";
  const amount = Math.round(Number(country?.freeShippingThreshold || 500));
  return `${sym} ${amount.toLocaleString()}`;
};

const formatPaymentList = (methods = []) => {
  if (!Array.isArray(methods) || methods.length === 0) {
    return "Card, Cash on Delivery, and Bank Transfer";
  }
  const names = methods.map((m) => PAYMENT_LABELS[m] || m);
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
};

/* ========================================================================= */
/* 1. CONTACT & HELP (Native Mobile Support Hub)                             */
/* ========================================================================= */
export const ContactHelpView = ({ onOpenRfq }) => {
  const { activeCountry } = useCountry();
  const { user } = useCustomerAuth();

  const whatsappRaw = activeCountry.whatsappDesk || "+971526073267";
  const whatsappDigits = String(whatsappRaw).replace(/[^\d]/g, "");
  const whatsappUrl = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
    `Hi E-ALL ${activeCountry.shortName} Support, I need assistance.`
  )}`;

  const [topic, setTopic] = useState("Order Help");
  const [name, setName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState("");

  const TOPICS = ["Order Help", "Warranty", "Product Inquiry", "Bulk Quote"];

  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    if (!phone.trim() || !message.trim()) return;
    setSubmitting(true);
    try {
      const res = await submitRFQ({
        companyName: `[${topic}] Customer Support (${activeCountry.shortName})`,
        businessType: topic,
        contactName: name.trim() || user?.fullName || "Storefront Shopper",
        email: user?.email || "",
        phone: phone.trim(),
        destinationCountry: activeCountry.name || "United Arab Emirates",
        destinationCity: activeCountry.city || "",
        productsRequired: topic,
        estimatedVolume: topic === "Bulk Quote" ? "Bulk Inquiry" : "Retail Support",
        additionalNotes: message.trim(),
      });
      setSubmittedRef(res?.rfqId || "SUP-OK");
      setMessage("");
    } catch {
      // Fallback: open WhatsApp directly if offline
      window.open(
        `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
          `[${topic} - ${activeCountry.shortName}]\nName: ${name}\nPhone: ${phone}\n\n${message}`
        )}`,
        "_blank",
        "noopener,noreferrer"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Local Country Hub Identity Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0">
              <CountryFlag code={activeCountry.code} className="w-6 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[13.5px] font-bold text-slate-900 truncate">
                {activeCountry.hubName}
              </p>
              <p className="text-[11.5px] text-slate-500 truncate">
                {activeCountry.legalEntityName || "Electronics All"}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Online
          </span>
        </div>

        <div className="pt-2.5 border-t border-slate-100 space-y-1.5 text-[11.5px] text-slate-600">
          <p className="flex items-start gap-2">
            <FiMapPin className="text-sky-700 shrink-0 mt-0.5" />
            <span>
              {activeCountry.legalAddress ||
                `${activeCountry.city}, ${activeCountry.name}`}
            </span>
          </p>
          <p className="flex items-center gap-2">
            <FiClock className="text-sky-700 shrink-0" />
            <span>Mon – Sat · 9:00 AM – 8:00 PM ({activeCountry.shortName})</span>
          </p>
        </div>
      </div>

      {/* Direct Support Channels (Grouped Native Rows) */}
      <section>
        <h2 className="text-xs font-bold text-slate-500 px-1 mb-2">
          Instant Channels
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 active:bg-slate-100 transition"
          >
            <span className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg shrink-0">
                <BsWhatsapp />
              </span>
              <span className="min-w-0">
                <span className="text-[13.5px] font-semibold text-slate-900 block">
                  WhatsApp Live Support
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Fastest reply · Chat directly with our team
                </span>
              </span>
            </span>
            <FiChevronRight className="text-slate-400 text-base shrink-0" />
          </a>

          <a
            href={`tel:${whatsappRaw}`}
            className="w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 active:bg-slate-100 transition"
          >
            <span className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center text-base shrink-0">
                <FiPhone />
              </span>
              <span className="min-w-0">
                <span className="text-[13.5px] font-semibold text-slate-900 block">
                  Call Support Desk
                </span>
                <span className="text-[11px] text-slate-500 font-mono block">
                  {whatsappRaw}
                </span>
              </span>
            </span>
            <FiChevronRight className="text-slate-400 text-base shrink-0" />
          </a>

          <a
            href="mailto:info@eall.ae"
            className="w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 active:bg-slate-100 transition"
          >
            <span className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-base shrink-0">
                <FiMail />
              </span>
              <span className="min-w-0">
                <span className="text-[13.5px] font-semibold text-slate-900 block">
                  Email Support
                </span>
                <span className="text-[11px] text-slate-500 font-mono block">
                  info@eall.ae
                </span>
              </span>
            </span>
            <FiChevronRight className="text-slate-400 text-base shrink-0" />
          </a>

          <button
            type="button"
            onClick={onOpenRfq}
            className="w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 active:bg-slate-100 transition text-left cursor-pointer"
          >
            <span className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-base shrink-0">
                <FiBriefcase />
              </span>
              <span className="min-w-0">
                <span className="text-[13.5px] font-semibold text-slate-900 block">
                  Wholesale &amp; Bulk Quote
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Carton pricing &amp; export logistics
                </span>
              </span>
            </span>
            <FiChevronRight className="text-slate-400 text-base shrink-0" />
          </button>
        </div>
      </section>

      {/* Compact Callback / Support Message Form */}
      <section>
        <h2 className="text-xs font-bold text-slate-500 px-1 mb-2">
          Send a Message
        </h2>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          {submittedRef ? (
            <div className="py-4 text-center space-y-2.5">
              <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-xl">
                <FiCheckCircle />
              </div>
              <p className="text-sm font-bold text-slate-900">
                Message Received
              </p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Reference <span className="font-mono font-bold text-slate-700">{submittedRef}</span>. Our {activeCountry.shortName} team will get back to you shortly.
              </p>
              <button
                type="button"
                onClick={() => setSubmittedRef("")}
                className="mt-1 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 cursor-pointer"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleQuickSubmit} className="space-y-3">
              {/* Topic Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {TOPICS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTopic(t)}
                    className={`px-3 py-1.5 rounded-full text-[11.5px] font-semibold transition cursor-pointer ${
                      topic === t
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-sky-700"
                />
                <input
                  type="tel"
                  required
                  placeholder="Phone / WhatsApp Number *"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium font-mono text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-sky-700"
                />
              </div>

              <textarea
                rows={3}
                required
                placeholder="How can we help you today?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-sky-700 resize-none"
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl bg-sky-700 hover:bg-sky-800 disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <FiSend className="text-xs" />
                <span>{submitting ? "Sending..." : "Request Support Callback"}</span>
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};

/* ========================================================================= */
/* 2. WARRANTY & AUTHENTICITY (Shopper-First Protection & Care)              */
/* ========================================================================= */
export const WarrantyAuthenticityView = ({ onNavigateView }) => {
  const { activeCountry, countryPath } = useCountry();
  const threshold = formatThreshold(activeCountry);

  return (
    <div className="space-y-4">
      {/* Compact Authenticity Assurance Header Card */}
      <div className="rounded-2xl bg-linear-to-br from-slate-900 via-sky-950 to-slate-900 text-white p-4.5 shadow-xs space-y-2.5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10.5px] font-bold">
          <FiShield className="text-xs" />
          <span>100% Genuine &amp; Serialized Stock</span>
        </div>
        <h2 className="text-base font-bold tracking-tight text-white">
          Official Manufacturer &amp; Local Hub Protection
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          Every smartphone, tablet, and audio device shipped from{" "}
          <span className="text-white font-semibold">{activeCountry.hubName}</span>{" "}
          is factory-sealed and logged by its 15-digit IMEI for instant warranty verification.
        </p>
      </div>

      {/* 1-Tap Verify IMEI Action Row */}
      <Link
        to={countryPath("/verify")}
        className="w-full bg-white rounded-2xl p-4 border border-sky-200 hover:border-sky-400 shadow-[0_1px_2px_rgba(15,23,42,0.03)] flex items-center justify-between gap-3 transition"
      >
        <span className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center text-lg shrink-0">
            <FiShield />
          </span>
          <span className="min-w-0">
            <span className="text-[13.5px] font-bold text-slate-900 block">
              Verify Device IMEI &amp; Warranty
            </span>
            <span className="text-[11.5px] text-slate-500 block">
              Check authenticity &amp; coverage status in seconds
            </span>
          </span>
        </span>
        <FiChevronRight className="text-sky-700 text-lg shrink-0" />
      </Link>

      {/* Core Care Promises (Grouped Surface Card) */}
      <section>
        <h2 className="text-xs font-bold text-slate-500 px-1 mb-2">
          What&apos;s Covered
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
          <div className="p-4 flex items-start gap-3">
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
              <FiCheckCircle className="text-base" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-slate-900">
                12-Month Official Hardware Warranty
              </p>
              <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                Factory-sealed Apple, Samsung, HMD, and Nokia devices include official manufacturer coverage backed by your tax invoice &amp; IMEI record.
              </p>
            </div>
          </div>

          <div className="p-4 flex items-start gap-3">
            <span className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
              <FiTruck className="text-base" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-slate-900">
                Insured Local Express Delivery
              </p>
              <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                {activeCountry.deliveryPromise}. Free express delivery on orders over{" "}
                <span className="font-semibold text-slate-700">{threshold}</span>.
              </p>
            </div>
          </div>

          <div className="p-4 flex items-start gap-3">
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
              <FiRefreshCw className="text-base" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-slate-900">
                7-Day Sealed Return &amp; DOA Replacement
              </p>
              <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                Unopened retail items can be returned within 7 days. Any verified hardware fault on arrival is prioritized for immediate hub replacement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Related Actions */}
      <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
        <button
          type="button"
          onClick={() => onNavigateView("help")}
          className="w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition text-left cursor-pointer"
        >
          <span className="text-[13px] font-semibold text-slate-900">
            Claim Warranty or Report an Issue
          </span>
          <FiChevronRight className="text-slate-400 text-base shrink-0" />
        </button>

        <Link
          to={countryPath("/services")}
          className="w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition text-left"
        >
          <span className="flex items-center gap-2 min-w-0">
            <span className="text-[12.5px] font-medium text-slate-600 truncate">
              B2B Distribution &amp; Supply Chain Services
            </span>
          </span>
          <FiExternalLink className="text-slate-400 text-sm shrink-0" />
        </Link>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* 3. HELP & FAQs (Searchable, Country-Aware Mobile Accordion)               */
/* ========================================================================= */
export const HelpFaqView = ({ onNavigateView, onOpenRfq }) => {
  const { activeCountry, countryPath } = useCountry();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [openId, setOpenId] = useState("delivery");

  const threshold = formatThreshold(activeCountry);
  const paymentsText = formatPaymentList(activeCountry.paymentMethods);

  const faqs = useMemo(
    () => [
      {
        id: "delivery",
        category: "Delivery",
        q: `How fast is delivery in ${activeCountry.shortName}?`,
        a: `Orders are dispatched directly from ${activeCountry.hubName} (${activeCountry.deliveryPromise}). Express delivery is free on orders over ${threshold}.`,
      },
      {
        id: "payments",
        category: "Payments",
        q: `Which payment methods can I use in ${activeCountry.shortName}?`,
        a: `We support ${paymentsText} for all ${activeCountry.shortName} orders, priced transparently in ${activeCountry.currency}.`,
      },
      {
        id: "authenticity",
        category: "Warranty",
        q: "Are all devices 100% genuine and factory sealed?",
        a: "Yes. Every unit is sourced through authorized channels and logged by its unique 15-digit IMEI prior to dispatch. You can verify any device on our live IMEI registry.",
        action: { label: "Verify IMEI Now", to: countryPath("/verify") },
      },
      {
        id: "warranty",
        category: "Warranty",
        q: "How does warranty & DOA replacement work?",
        a: "All devices carry official manufacturer warranty backed by your downloadable E-ALL tax invoice. In the rare event of a dead-on-arrival hardware defect, contact our support desk within 7 days for prioritized hub replacement.",
      },
      {
        id: "returns",
        category: "Delivery",
        q: "Can I return or exchange an unopened device?",
        a: "Yes — unopened, factory-sealed items in original condition can be returned or exchanged within 7 days of delivery with your order number or invoice.",
      },
      {
        id: "wholesale",
        category: "Wholesale",
        q: "Do you offer bulk B2B / dealer carton pricing?",
        a: "Yes. Beyond local retail stock, E-ALL operates Tier-1 global supply hubs in Dubai HQ, Hong Kong, and China supporting EXW, FOB, CIF, and DDP wholesale orders.",
        onAction: onOpenRfq,
        actionLabel: "Request B2B Quote",
      },
    ],
    [activeCountry, threshold, paymentsText, countryPath, onOpenRfq]
  );

  const categories = ["All", "Delivery", "Payments", "Warranty", "Wholesale"];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return faqs.filter((item) => {
      const catMatch = category === "All" || item.category === category;
      if (!catMatch) return false;
      if (!q) return true;
      return (
        item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
      );
    });
  }, [faqs, search, category]);

  return (
    <div className="space-y-3.5">
      {/* Compact Search Bar */}
      <div className="relative">
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search delivery, payments, warranty..."
          className="w-full h-10 pl-9 pr-9 rounded-full bg-white border border-slate-200/90 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-sky-700 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <FiX className="text-sm" />
          </button>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-[11.5px] font-semibold shrink-0 transition cursor-pointer ${
              category === cat
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Accordion List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-xs font-bold text-slate-800">
              No matching answers found
            </p>
            <p className="text-[11.5px] text-slate-500">
              Try a different keyword or reach out directly to our team.
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div key={item.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? "" : item.id)}
                  className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/70 transition cursor-pointer"
                >
                  <span className="text-[13px] font-semibold text-slate-900 leading-snug">
                    {item.q}
                  </span>
                  <FiChevronDown
                    className={`text-slate-400 text-base shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-sky-700" : ""
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed space-y-2.5">
                        <p>{item.a}</p>
                        {item.action && (
                          <Link
                            to={item.action.to}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:underline"
                          >
                            <span>{item.action.label}</span>
                            <FiChevronRight className="text-sm" />
                          </Link>
                        )}
                        {item.onAction && (
                          <button
                            type="button"
                            onClick={item.onAction}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:underline cursor-pointer"
                          >
                            <span>{item.actionLabel}</span>
                            <FiChevronRight className="text-sm" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Help Nudge */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)] flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-bold text-slate-900">
            Still have a question?
          </p>
          <p className="text-[11.5px] text-slate-500">
            Chat with our {activeCountry.shortName} team on WhatsApp or phone.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigateView("help")}
          className="px-3.5 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold shrink-0 cursor-pointer"
        >
          Contact Us
        </button>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* 4. ABOUT E-ALL (Compact Native Brand & Global Hub Card)                   */
/* ========================================================================= */
export const AboutCompanyView = ({ onNavigateView }) => {
  const { activeCountry, publicCountries, countryPath } = useCountry();

  const SUPPLY_HUBS = [
    { code: "AE", name: "Dubai Main Hub (HQ)", role: "Global Headquarters & GCC Dispatch" },
    { code: "HK", name: "Hong Kong Hub", role: "Asia Flagship Sourcing & Export" },
    { code: "CN", name: "China Supply Hub", role: "OEM & Volume Procurement" },
  ];

  const BRAND_PARTNERS = [
    { name: "Apple", slug: "apple" },
    { name: "Samsung", slug: "samsung" },
    { name: "HMD", slug: "hmd" },
    { name: "Nokia", slug: "nokia" },
  ];

  return (
    <div className="space-y-4">
      {/* Compact Brand Header Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center p-2 shrink-0">
            <img
              src="/logo.png"
              alt="E-ALL Electronics"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              E-ALL Electronics
            </h2>
            <p className="text-xs font-semibold text-sky-700">
              Authorized Retail &amp; Global Distribution
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Headquartered in Dubai Silicon Oasis, Electronics All connects retail shoppers and wholesale dealers across the Middle East and Africa with genuine factory-sealed Apple, Samsung, HMD, and Nokia devices.
        </p>

        {/* 3 Compact Trust Metrics */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-2.5 text-center">
            <p className="text-sm font-black text-slate-900 font-mono">3</p>
            <p className="text-[10.5px] font-semibold text-slate-500 mt-0.5">
              Supply Hubs
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-2.5 text-center">
            <p className="text-sm font-black text-sky-700 font-mono">
              {publicCountries.length}+
            </p>
            <p className="text-[10.5px] font-semibold text-slate-500 mt-0.5">
              Storefronts
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-2.5 text-center">
            <p className="text-sm font-black text-emerald-600 font-mono">100%</p>
            <p className="text-[10.5px] font-semibold text-slate-500 mt-0.5">
              IMEI Verified
            </p>
          </div>
        </div>
      </div>

      {/* Global Supply Network */}
      <section>
        <h2 className="text-xs font-bold text-slate-500 px-1 mb-2">
          Global Hub Network
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
          {activeCountry.code !== "AE" && (
            <div className="px-4 py-3 flex items-center justify-between gap-3 bg-sky-50/50">
              <span className="flex items-center gap-3 min-w-0">
                <CountryFlag code={activeCountry.code} className="w-5 h-3.5" />
                <span className="min-w-0">
                  <span className="text-[13px] font-bold text-slate-900 block truncate">
                    {activeCountry.hubName}
                  </span>
                  <span className="text-[11px] text-slate-500 block truncate">
                    Active Local Storefront · {activeCountry.city}
                  </span>
                </span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold shrink-0">
                Active
              </span>
            </div>
          )}

          {SUPPLY_HUBS.map((hub) => (
            <div
              key={hub.code}
              className="px-4 py-3 flex items-center gap-3"
            >
              <CountryFlag code={hub.code} className="w-5 h-3.5" />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-slate-900 truncate">
                  {hub.name}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{hub.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Official Brand Partners */}
      <section>
        <h2 className="text-xs font-bold text-slate-500 px-1 mb-2">
          Official Brand Partners
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {BRAND_PARTNERS.map((b) => (
            <Link
              key={b.slug}
              to={countryPath(`/brands/${b.slug}`)}
              className="bg-white rounded-xl px-3.5 py-3 border border-slate-200/80 hover:border-sky-300 flex items-center justify-between transition shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
            >
              <span className="flex items-center gap-2">
                <FiAward className="text-sky-700 text-sm shrink-0" />
                <span className="text-[13px] font-bold text-slate-900">
                  {b.name}
                </span>
              </span>
              <FiChevronRight className="text-slate-400 text-sm" />
            </Link>
          ))}
        </div>
      </section>

      {/* Corporate Registration Details */}
      <section>
        <h2 className="text-xs font-bold text-slate-500 px-1 mb-2">
          Entity &amp; Details
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden text-xs">
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            <span className="text-slate-500 font-medium">Operating Entity</span>
            <span className="font-bold text-slate-900 text-right">
              {activeCountry.legalEntityName || "Electronics All FZCO"}
            </span>
          </div>
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            <span className="text-slate-500 font-medium">Global HQ</span>
            <span className="font-semibold text-slate-800 text-right">
              Dubai Silicon Oasis, UAE
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigateView("help")}
            className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition text-left cursor-pointer"
          >
            <span className="flex items-center gap-2 font-semibold text-sky-700">
              <FiGlobe className="text-sm" />
              <span>Contact Our Team</span>
            </span>
            <FiChevronRight className="text-slate-400 text-base" />
          </button>
          <Link
            to={countryPath("/about")}
            className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition text-left"
          >
            <span className="font-medium text-slate-600">
              View Full Corporate Profile
            </span>
            <FiExternalLink className="text-slate-400 text-sm" />
          </Link>
        </div>
      </section>
    </div>
  );
};

