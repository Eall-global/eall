import { Link } from "react-router-dom";
import {
  FiShoppingBag,
  FiBriefcase,
  FiCheck,
  FiArrowRight,
} from "react-icons/fi";
import { BsWhatsapp } from "react-icons/bs";
import { useCountry } from "../../context/CountryContext";

const WHOLESALE_PERKS = [
  "Master-carton & tiered dealer pricing from 10 to 5,000+ units",
  "EXW Dubai Silicon Oasis, FOB Jebel Ali / DXB & CIF export quotes",
  "Dedicated B2B account managers & UAE VAT (TRN) tax invoices",
  "Verified batch IMEI manifests & priority air/sea cargo packing",
];

const DualChannelSection = ({ onOpenRfq }) => {
  const { activeCountry, countryPath, formatPrice, convertPrice } = useCountry();
  const freeShipLabel = formatPrice(
    Number(activeCountry?.freeShippingThresholdLocal) || convertPrice(500)
  );
  const retailPerks = [
    "Instant online checkout for 1 to 9 units — no account required",
    activeCountry.code === "KE"
      ? "Pay via M-Pesa, Card, Apple Pay, Bank Transfer or COD"
      : activeCountry.code === "SN" || activeCountry.code === "CI"
      ? "Pay via Wave, Orange Money, Card, Bank Transfer or COD"
      : "Pay via Apple Pay, Card, Tabby, Tamara, Wave Transfer or COD",
    `Free Express ${activeCountry.shortName} delivery on orders above ${freeShipLabel}`,
    "100% genuine factory-sealed devices with official 12-month warranty",
  ];

  return (
    <section className="py-10 sm:py-12 bg-white text-left">
      <div className="w-full px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-700">
            Two Ways to Buy With E-ALL
          </span>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900 mt-1">
            Built for Individual Shoppers &amp; Global Wholesalers
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* RETAIL CHANNEL CARD (Clean Light + Navy / Sky) */}
          <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xs p-6 sm:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-200/80 text-sky-700 flex items-center justify-center">
                  <FiShoppingBag className="text-xl" />
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200/80">
                  Retail Store • 1–9 Units
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Personal &amp; Retail Checkout
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                  Order genuine smartphones, earbuds, and everyday tech directly from our {activeCountry.hubName} with fast doorstep delivery.
                </p>
              </div>

              <ul className="space-y-2.5 pt-1">
                {retailPerks.map((perk) => (
                  <li
                    key={perk}
                    className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700"
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <FiCheck className="text-xs" />
                    </span>
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
              <Link
                to={countryPath("/products")}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-sky-700 text-white text-xs sm:text-sm font-bold shadow-xs transition"
              >
                <span>Start Retail Shopping</span>
                <FiArrowRight />
              </Link>
              <Link
                to={countryPath("/brands")}
                className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold transition"
              >
                Explore Official Brands
              </Link>
            </div>
          </div>

          {/* B2B WHOLESALE CHANNEL CARD (Warm Cream + Vibrant Orange Accent) */}
          <div className="rounded-3xl bg-gradient-to-br from-orange-50/75 via-white to-amber-50/60 border border-orange-200/90 shadow-xs p-6 sm:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="w-11 h-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
                  <FiBriefcase className="text-xl" />
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                  B2B &amp; Export • 10–5,000+ Units
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Wholesale, Dealers &amp; Export Desk
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  Supplying mobile retailers, corporate buyers, and regional importers across UAE, GCC, East &amp; West Africa.
                </p>
              </div>

              <ul className="space-y-2.5 pt-1">
                {WHOLESALE_PERKS.map((perk) => (
                  <li
                    key={perk}
                    className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700"
                  >
                    <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                      <FiCheck className="text-xs" />
                    </span>
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-orange-200/60">
              <button
                type="button"
                onClick={() => onOpenRfq?.("")}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
              >
                <FiBriefcase />
                <span>Request Bulk Quote (RFQ)</span>
              </button>

              <a
                href="https://wa.me/971526073267?text=Hi%20E-ALL%20Wholesale%20Team%2C%20I%20would%20like%20to%20discuss%20bulk%20pricing."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs sm:text-sm font-bold transition"
              >
                <BsWhatsapp className="text-base" />
                <span>WhatsApp B2B Desk</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DualChannelSection;

