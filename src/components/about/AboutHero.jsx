import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiBriefcase,
  FiCheckCircle,
  FiChevronRight,
  FiMapPin,
  FiShield,
} from "react-icons/fi";
import { useCountry } from "../../context/CountryContext";
import { aboutData } from "./aboutData";

const AboutHero = () => {
  const { countryPath } = useCountry();

  return (
    <section className="bg-slate-50 border-b border-slate-200/80 pt-[92px] sm:pt-[104px] xl:pt-[148px] pb-8 text-left">
      <div className="w-full px-4 sm:px-6 lg:px-8 space-y-4">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Link to={countryPath("/")} className="hover:text-sky-700 transition">
            Home
          </Link>
          <FiChevronRight className="text-slate-300" />
          <span className="text-slate-900 font-bold">About E-ALL</span>
        </nav>

        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 text-white p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative overflow-hidden shadow-sm">
          <div className="lg:col-span-8 space-y-4 relative z-10">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-sky-500/25 text-sky-200 border border-sky-400/30">
                <FiMapPin /> Dubai Silicon Oasis Headquarters
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-emerald-300 border border-white/15">
                <FiCheckCircle /> Authorized Brand Supply
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              {aboutData?.hero?.subtitle ||
                "Your Trusted Retail & Wholesale Electronics Partner"}
            </h1>

            <p className="text-xs sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              {aboutData?.hero?.description ||
                "Headquartered in Dubai Silicon Oasis, Electronics All FZCO connects retail shoppers and wholesale B2B dealers across the UAE, GCC, and Africa with genuine Apple, Samsung, HMD, and Nokia technology."}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to={countryPath("/products")}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-sky-400 text-slate-950 text-xs sm:text-sm font-extrabold transition"
              >
                <span>Shop Live Catalog</span>
                <FiArrowRight />
              </Link>

              <Link
                to={countryPath("/contact")}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-extrabold transition shadow-xs"
              >
                <FiBriefcase />
                <span>Contact B2B Desk</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-4 grid grid-cols-2 gap-3 relative z-10">
            <div className="rounded-2xl bg-white p-3 flex items-center justify-center aspect-square shadow-md">
              <img
                src="/assets/home/cat-apple.png"
                alt="Apple Flagship Supply"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div className="rounded-2xl bg-white p-3 flex items-center justify-center aspect-square shadow-md">
              <img
                src="/assets/home/cat-samsung.png"
                alt="Samsung Galaxy Supply"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div className="col-span-2 rounded-2xl bg-white/10 border border-white/15 p-3.5 flex items-center gap-3">
              <FiShield className="text-emerald-400 text-2xl shrink-0" />
              <p className="text-xs text-slate-200">
                100% genuine factory-sealed inventory backed by our official IMEI warranty registry.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutHero;
