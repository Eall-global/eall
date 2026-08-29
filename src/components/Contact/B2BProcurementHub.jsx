import React, { useState } from "react";
import {
  FiBriefcase,
  FiFileText,
  FiSend,
  FiCheckCircle,
  FiTruck,
  FiDollarSign,
  FiShield,
  FiGlobe,
  FiPackage,
  FiPhone,
  FiMail,
  FiUser,
  FiArrowRight,
  FiClock,
  FiCopy,
  FiX,
  FiPercent,
  FiLayers,
} from "react-icons/fi";
import { BsWhatsapp } from "react-icons/bs";
import { submitRFQ } from "../../services/b2bService";

const B2B_DESTINATIONS = [
  "United Arab Emirates (Dubai / JAFZA)",
  "Senegal (Dakar)",
  "Côte d'Ivoire (Abidjan)",
  "Mali (Bamako)",
  "Burkina Faso (Ouagadougou)",
  "Guinea (Conakry)",
  "Gambia (Banjul)",
  "Uganda (Kampala)",
  "Ghana (Accra)",
  "Nigeria (Lagos)",
  "Saudi Arabia (Riyadh / Jeddah)",
  "Oman (Muscat)",
  "Other International Market",
];

const INCOTERMS_OPTIONS = [
  { id: "EXW", label: "EXW (Ex-Warehouse Dubai)", desc: "Collect directly from our Dubai / Deira hub" },
  { id: "FOB", label: "FOB (Jebel Ali / Dubai Port)", desc: "Loaded on freight carrier in UAE" },
  { id: "CIF", label: "CIF (Air / Sea Cargo)", desc: "Cost, insurance & freight to your destination port" },
  { id: "DDP", label: "DDP (Delivered Duty Paid)", desc: "Doorstep delivery with customs cleared" },
];

const BUSINESS_TYPES = [
  "Regional Importer / Distributor",
  "Retail Store Chain (Multi-Branch)",
  "Corporate IT & Enterprise Procurement",
  "E-Commerce Seller / Re-distributor",
  "Independent Bulk Trader",
];

const B2BProcurementHub = () => {
  const [activeTab, setActiveTab] = useState("rfq"); // 'rfq' | 'whatsapp'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [copiedTicket, setCopiedTicket] = useState(false);

  // RFQ Form State
  const [formData, setFormData] = useState({
    companyName: "",
    trnNumber: "",
    businessType: "Regional Importer / Distributor",
    contactName: "",
    email: "",
    phone: "",
    destinationCountry: "United Arab Emirates (Dubai / JAFZA)",
    destinationCity: "",
    incoterms: "EXW (Ex-Warehouse Dubai)",
    productsRequired: "",
    estimatedVolume: "50-100 Units",
    additionalNotes: "",
  });

  // Fast WhatsApp Enquiry State
  const [waCategory, setWaCategory] = useState("Smartphones & Apple Devices");
  const [waVolume, setWaVolume] = useState("50+ Units");
  const [waDestination, setWaDestination] = useState("Senegal / West Africa");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRFQSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await submitRFQ(formData);
      setSubmittedTicket(result);
    } catch (err) {
      alert("Could not submit RFQ. Please contact our sales desk directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappMessage = `
*🏢 E-ALL B2B WHOLESALE & BULK INQUIRY*
━━━━━━━━━━━━━━━━━━━━
• *Company / Trader:* ${formData.companyName || "Prospective Partner"}
• *Category:* ${waCategory}
• *Target Volume:* ${waVolume}
• *Destination:* ${waDestination}
• *Incoterms:* ${formData.incoterms}
• *Specific SKUs:* ${formData.productsRequired || "Full catalog quotation requested"}
━━━━━━━━━━━━━━━━━━━━
Looking for official wholesale pricing, pallet availability, and freight timeline from Dubai.
`.trim();

  const whatsappURL = `https://wa.me/971561110147?text=${encodeURIComponent(whatsappMessage)}`;

  const handleCopyTicket = (ticketId) => {
    navigator.clipboard.writeText(ticketId);
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 2000);
  };

  return (
    <section className="pt-6 sm:pt-10 pb-16 w-full text-left">
      <div className="w-full space-y-8 sm:space-y-10">

        {/* 🏢 ENTERPRISE TITLE & BADGE */}
        <div className="text-center w-full space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200/80 text-xs font-bold uppercase tracking-wider">
            <FiBriefcase className="text-sky-700" />
            <span>B2B &amp; Enterprise Procurement Hub</span>
          </div>
          <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
            Direct Wholesale &amp; Bulk Distribution
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-4xl mx-auto leading-relaxed">
            Supplying certified electronics, smartphones, and accessories to regional distributors, retail chains, and corporate buyers across the UAE, West Africa (Senegal, Côte d'Ivoire, Mali, Guinea) &amp; international markets.
          </p>
        </div>

        {/* 💎 4 CORE B2B ADVANTAGES GRID (FULL WIDTH) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2.5 hover:border-sky-300 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center text-xl font-bold">
              <FiPercent />
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Tiered Bulk Discounts</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Volume-based tiered pricing on 50+, 200+, and container-level pallet allocations.
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2.5 hover:border-emerald-300 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl font-bold">
              <FiTruck />
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Air &amp; Sea Cargo Forwarding</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Direct consolidation from Dubai Deira / JAFZA to Dakar, Abidjan, Bamako &amp; GCC ports.
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2.5 hover:border-indigo-300 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-xl font-bold">
              <FiFileText />
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">FTA Tax Invoicing &amp; TRN</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Fully compliant UAE VAT e-invoices, customs packing lists &amp; corporate seal.
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2.5 hover:border-amber-300 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl font-bold">
              <FiShield />
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Wave &amp; Corporate Settlement</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              0% Fee Wave transfers in Africa, T/T Wire, and Letter of Credit (LC) options.
            </p>
          </div>
        </div>

        {/* 📑 INTERACTIVE CHANNEL SELECTOR (FULL WIDTH) */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden w-full">
          <div className="border-b border-slate-200 bg-slate-50/80 p-2.5 sm:p-3.5 flex flex-col sm:flex-row items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("rfq")}
              className={`w-full sm:flex-1 py-3.5 px-5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${activeTab === "rfq"
                  ? "bg-white text-sky-800 shadow-xs border border-slate-200"
                  : "text-slate-500 hover:text-slate-900"
                }`}
            >
              <FiFileText className="text-base" />
              <span>Submit Formal RFQ (Request for Quotation)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("whatsapp")}
              className={`w-full sm:flex-1 py-3.5 px-5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${activeTab === "whatsapp"
                  ? "bg-white text-emerald-800 shadow-xs border border-slate-200"
                  : "text-slate-500 hover:text-slate-900"
                }`}
            >
              <BsWhatsapp className="text-base text-emerald-600" />
              <span>Instant VIP Wholesale WhatsApp Desk</span>
            </button>
          </div>

          {/* TAB 1: FORMAL RFQ ENGINE */}
          {activeTab === "rfq" && (
            <form onSubmit={handleRFQSubmit} className="p-5 sm:p-8 lg:p-10 space-y-6 text-xs sm:text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

                {/* Company Name */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10.5px] tracking-wider mb-1.5">
                    Company / Trade Name *
                  </label>
                  <div className="relative">
                    <FiBriefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      type="text"
                      name="companyName"
                      placeholder="e.g. Sahel Import-Export SARL"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-sky-600 transition"
                    />
                  </div>
                </div>

                {/* TRN / Tax Registration Number */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10.5px] tracking-wider mb-1.5">
                    Tax Reg. No. / TRN (Optional)
                  </label>
                  <input
                    type="text"
                    name="trnNumber"
                    placeholder="e.g. 100234567800003"
                    value={formData.trnNumber}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 outline-none focus:bg-white focus:border-sky-600 transition"
                  />
                </div>

                {/* Business Classification */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10.5px] tracking-wider mb-1.5">
                    Business Classification *
                  </label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-sky-600 transition"
                  >
                    {BUSINESS_TYPES.map((bt) => (
                      <option key={bt} value={bt}>{bt}</option>
                    ))}
                  </select>
                </div>

                {/* Contact Person Name */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10.5px] tracking-wider mb-1.5">
                    Contact Person Name *
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      type="text"
                      name="contactName"
                      placeholder="e.g. Ousmane Diop"
                      value={formData.contactName}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-sky-600 transition"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10.5px] tracking-wider mb-1.5">
                    Official Business Email *
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      type="email"
                      name="email"
                      placeholder="e.g. procurement@sahel.sn"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-sky-600 transition"
                    />
                  </div>
                </div>

                {/* WhatsApp / Phone Number */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10.5px] tracking-wider mb-1.5">
                    WhatsApp Phone Number *
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      type="text"
                      name="phone"
                      placeholder="+221 77 123 4567 or +971 50 123 4567"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 outline-none focus:bg-white focus:border-sky-600 transition"
                    />
                  </div>
                </div>

                {/* Target Destination */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10.5px] tracking-wider mb-1.5">
                    Target Destination Country / Port *
                  </label>
                  <select
                    name="destinationCountry"
                    value={formData.destinationCountry}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-sky-600 transition"
                  >
                    {B2B_DESTINATIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Preferred Incoterms */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10.5px] tracking-wider mb-1.5">
                    Preferred Incoterms / Delivery Method *
                  </label>
                  <select
                    name="incoterms"
                    value={formData.incoterms}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-sky-600 transition"
                  >
                    {INCOTERMS_OPTIONS.map((opt) => (
                      <option key={opt.id} value={`${opt.id} - ${opt.label}`}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estimated Volume */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10.5px] tracking-wider mb-1.5">
                    Estimated Order Volume *
                  </label>
                  <select
                    name="estimatedVolume"
                    value={formData.estimatedVolume}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-sky-600 transition"
                  >
                    <option value="20 - 50 Units (Starter Wholesale)">20 - 50 Units (Starter Wholesale)</option>
                    <option value="50 - 200 Units (Commercial Bulk)">50 - 200 Units (Commercial Bulk)</option>
                    <option value="200 - 500 Units (Pallet Load)">200 - 500 Units (Pallet Load)</option>
                    <option value="500+ Units / Full Container">500+ Units / Full Container</option>
                  </select>
                </div>

              </div>

              {/* Products & Estimated Quantity */}
              <div>
                <label className="block font-bold text-slate-700 uppercase text-[10.5px] tracking-wider mb-1.5">
                  Products, SKUs &amp; Target Quantities *
                </label>
                <textarea
                  required
                  rows={3}
                  name="productsRequired"
                  placeholder="e.g. 50x Apple iPhone 16 Pro 256GB Black, 100x Nokia 150 Music Blue, 30x AirPods Pro (2nd Gen)"
                  value={formData.productsRequired}
                  onChange={handleInputChange}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 outline-none focus:bg-white focus:border-sky-600 transition"
                />
              </div>

              {/* Submit CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <FiClock className="text-sky-700" />
                  <span>Guaranteed quote turnaround within <strong>2–4 business hours</strong>.</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-10 py-4 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Generating RFQ Ticket...</span>
                  ) : (
                    <>
                      <FiSend />
                      <span>Submit Formal RFQ</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: INSTANT WHATSAPP WHOLESALE DESK */}
          {activeTab === "whatsapp" && (
            <div className="p-5 sm:p-8 lg:p-10 space-y-6 text-left">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                    Select Product Focus
                  </label>
                  <select
                    value={waCategory}
                    onChange={(e) => setWaCategory(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="Smartphones & Apple Devices">Smartphones &amp; Apple Devices</option>
                    <option value="Feature Phones (Nokia / HMD)">Feature Phones (Nokia / HMD)</option>
                    <option value="Audio & Wearables (AirPods / Smartwatches)">Audio &amp; Wearables (AirPods / Smartwatches)</option>
                    <option value="Tablets & iPads">Tablets &amp; iPads</option>
                    <option value="Full Mixed Pallet Container">Full Mixed Pallet Container</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                    Target Volume
                  </label>
                  <select
                    value={waVolume}
                    onChange={(e) => setWaVolume(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="20 - 50 Units (Starter Wholesale)">20 - 50 Units (Starter Wholesale)</option>
                    <option value="50 - 200 Units (Commercial Bulk)">50 - 200 Units (Commercial Bulk)</option>
                    <option value="500+ Units (Distributor Allocation)">500+ Units (Distributor Allocation)</option>
                    <option value="Full 20ft / 40ft Container">Full 20ft / 40ft Container</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                    Delivery Destination
                  </label>
                  <select
                    value={waDestination}
                    onChange={(e) => setWaDestination(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="Senegal (Dakar)">Senegal (Dakar)</option>
                    <option value="Côte d'Ivoire (Abidjan)">Côte d'Ivoire (Abidjan)</option>
                    <option value="Mali / Guinea / Burkina">Mali / Guinea / Burkina</option>
                    <option value="Dubai / UAE Freezone">Dubai / UAE Freezone</option>
                    <option value="East Africa (Uganda / Kenya)">East Africa (Uganda / Kenya)</option>
                    <option value="Saudi Arabia / GCC">Saudi Arabia / GCC</option>
                  </select>
                </div>
              </div>

              {/* WhatsApp Live Preview Box */}
              <div className="rounded-3xl overflow-hidden border border-emerald-300 shadow-sm bg-white">
                <div className="bg-[#075E54] text-white px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <BsWhatsapp className="text-emerald-300 text-lg" />
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold">E-ALL Dubai Wholesale Executive Desk</h4>
                      <p className="text-[10px] text-emerald-200">Online • Instant Response for Importers</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-emerald-100">+971 56 111 0147</span>
                </div>

                <div className="p-5 sm:p-8 bg-[#efeae2] bg-opacity-70">
                  <div className="max-w-2xl bg-[#DCF8C6] border border-emerald-200 p-5 rounded-2xl shadow-xs text-xs sm:text-sm font-sans whitespace-pre-line leading-relaxed text-slate-800">
                    {whatsappMessage}
                  </div>
                </div>
              </div>

              <div className="text-center pt-2">
                <a
                  href={whatsappURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-3 px-10 py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm sm:text-base rounded-2xl shadow-lg shadow-emerald-600/20 transition hover:scale-[1.02] cursor-pointer"
                >
                  <BsWhatsapp className="text-xl" />
                  <span>Connect with Wholesale Manager on WhatsApp</span>
                  <FiArrowRight />
                </a>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* 🚀 RFQ SUBMITTED CONFIRMATION MODAL */}
      {submittedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 text-left border border-slate-100">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mx-auto">
              <FiCheckCircle />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                RFQ Ticket Generated Successfully!
              </h3>
              <p className="text-xs text-slate-500">
                Your enterprise procurement inquiry has been assigned to a senior trade specialist.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Your RFQ Reference Code</span>
                <span className="font-mono font-black text-slate-900 text-sm">{submittedTicket.rfqId}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopyTicket(submittedTicket.rfqId)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
              >
                <FiCopy />
                <span>{copiedTicket ? "Copied" : "Copy"}</span>
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1.5 p-3.5 bg-sky-50/70 border border-sky-200/80 rounded-2xl">
              <p>• <strong>Company:</strong> {submittedTicket.companyName}</p>
              <p>• <strong>Destination:</strong> {submittedTicket.destinationCountry}</p>
              <p>• <strong>Incoterms:</strong> {submittedTicket.incoterms}</p>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={`https://wa.me/971561110147?text=${encodeURIComponent(`Hi E-ALL Wholesale Desk, I have just submitted formal RFQ Ticket: ${submittedTicket.rfqId} for ${submittedTicket.companyName}. Looking forward to your prompt proforma invoice.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <BsWhatsapp className="text-base" />
                <span>Fast-Track RFQ on WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => setSubmittedTicket(null)}
                className="w-full py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close &amp; Return to Contact Page
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default B2BProcurementHub;
