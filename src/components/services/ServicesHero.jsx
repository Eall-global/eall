import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiBriefcase,
  FiCheckCircle,
  FiChevronRight,
  FiShield,
  FiTruck,
} from "react-icons/fi";
import { useCountry } from "../../context/CountryContext";

const ServicesHero = () => {
  const { activeCountry, countryPath } = useCountry();
  const formattedThreshold = `${
    activeCountry.currencySymbol || activeCountry.currency
  } ${Math.round(
    Number(activeCountry.freeShippingThreshold || 500)
  ).toLocaleString()}`;

  return (
    <section className="bg-slate-50 border-b border-slate-200/80 pt-[92px] sm:pt-[104px] xl:pt-[148px] pb-8 text-left">
      <div className="w-full px-4 sm:px-6 lg:px-8 space-y-4">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Link to={countryPath("/")} className="hover:text-sky-700 transition">
            Home
          </Link>
          <FiChevronRight className="text-slate-300" />
          <span className="text-slate-900 font-bold">
            Distribution &amp; Supply Chain Services
          </span>
        </nav>

        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative overflow-hidden shadow-sm">
          <div className="lg:col-span-8 space-y-4 relative z-10">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-sky-500/25 text-sky-200 border border-sky-400/30">
                <FiTruck /> End-to-End Logistics &amp; Fulfillment
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-emerald-300 border border-white/15">
                <FiCheckCircle /> 100% Serialized IMEI Tracking
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Technology Distribution &amp; Supply Chain Services
            </h1>

            <p className="text-xs sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Supporting retail shoppers, regional wholesalers, and corporate procurement teams with genuine Apple, Samsung, HMD, and Nokia hardware, air/sea export forwarding, and official warranty coverage.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to={countryPath("/contact")}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-extrabold transition shadow-xs"
              >
                <FiBriefcase />
                <span>Request Trade Quote</span>
              </Link>

              <Link
                to={countryPath("/products")}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-sky-400 text-slate-950 text-xs sm:text-sm font-extrabold transition"
              >
                <span>Explore Catalog</span>
                <FiArrowRight />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-3 relative z-10">
            <div className="rounded-2xl bg-white/10 border border-white/15 p-4 flex items-center gap-3.5">
              <img
                src="/assets/home/cat-smartphones.png"
                alt="Flagship Smartphones"
                className="w-16 h-16 rounded-xl object-cover bg-white shrink-0"
              />
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-sky-300">
                  {activeCountry.hubName}
                </p>
                <p className="text-xs text-slate-200 mt-0.5">
                  {activeCountry.deliveryPromise} — free delivery over {formattedThreshold}.
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/15 p-4 flex items-center gap-3.5">
              <div className="w-16 h-16 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 text-2xl shrink-0">
                <FiShield />
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                  Official Warranty Registry
                </p>
                <p className="text-xs text-slate-200 mt-0.5">
                  Every device is logged by 15-digit IMEI for instant authenticity verification.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesHero;
