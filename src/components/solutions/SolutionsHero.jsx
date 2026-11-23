import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiBriefcase,
  FiCheckCircle,
  FiChevronRight,
  FiGlobe,
  FiPackage,
} from "react-icons/fi";

const SolutionsHero = () => {
  return (
    <section className="bg-slate-50 border-b border-slate-200/80 pt-[108px] sm:pt-[116px] xl:pt-[148px] pb-8 text-left">
      <div className="w-full px-4 sm:px-6 lg:px-8 space-y-4">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Link to="/" className="hover:text-sky-700 transition">
            Home
          </Link>
          <FiChevronRight className="text-slate-300" />
          <span className="text-slate-900 font-bold">
            Retail &amp; B2B Wholesale Solutions
          </span>
        </nav>

        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 text-white p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative overflow-hidden shadow-sm">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 w-72 h-72 rounded-full bg-sky-500/15 blur-3xl"
          />

          <div className="lg:col-span-8 space-y-4 relative z-10">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-orange-500 text-white">
                <FiBriefcase /> Dual-Channel Commerce Hub
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-sky-200 border border-white/15">
                <FiCheckCircle className="text-emerald-400" /> Dubai Silicon Oasis Export Desk
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Retail Fulfillment &amp; Global B2B Electronics Distribution
            </h1>

            <p className="text-xs sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Partner with E-ALL for factory-sealed Apple, Samsung, HMD, and Nokia inventory — supporting single-unit UAE retail delivery and multi-carton EXW / FOB / CIF international export.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-extrabold transition shadow-xs"
              >
                <FiBriefcase />
                <span>Request B2B Wholesale Quote</span>
              </Link>

              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-sky-400 text-slate-950 text-xs sm:text-sm font-extrabold transition"
              >
                <span>Browse Live Catalog</span>
                <FiArrowRight />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-4 grid grid-cols-2 gap-3 relative z-10">
            <div className="rounded-2xl bg-white/10 border border-white/15 p-4 space-y-1">
              <FiPackage className="text-sky-400 text-xl" />
              <p className="text-lg font-black text-white">10 – 5,000+</p>
              <p className="text-xs text-slate-300">Units per B2B Allocation</p>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/15 p-4 space-y-1">
              <FiGlobe className="text-emerald-400 text-xl" />
              <p className="text-lg font-black text-white">UAE • GCC • Africa</p>
              <p className="text-xs text-slate-300">EXW / FOB / CIF Air &amp; Sea</p>
            </div>
            <div className="col-span-2 rounded-2xl bg-white/10 border border-white/15 p-4 flex items-center gap-3">
              <img
                src="/assets/home/cat-wholesale.png"
                alt="Master Carton Wholesale"
                className="w-16 h-16 rounded-xl object-cover bg-white shrink-0"
              />
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-orange-300">
                  Official UAE VAT (TRN) Invoicing
                </p>
                <p className="text-xs text-slate-200 mt-0.5">
                  Serialized IMEI manifests &amp; customs documentation ready for immediate dispatch.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionsHero;
