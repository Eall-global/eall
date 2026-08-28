import { Link } from "react-router-dom";
import { FiShield, FiTruck, FiCheckCircle, FiArrowRight, FiSmartphone } from "react-icons/fi";

const ProductGridBreaker = () => {
  return (
    <div className="col-span-full my-4 sm:my-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-6 sm:p-8 md:p-10 shadow-xl border border-sky-900/50">
        
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center text-left">
          
          {/* Left Text & CTA */}
          <div className="lg:col-span-7 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 text-xs font-bold uppercase tracking-wider">
              <FiShield className="text-emerald-400" />
              <span>Official Warranty &amp; Guaranteed Authenticity</span>
            </div>

            <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight">
              Premium Electronics with Instant Wave Payment
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Every device from Apple, Samsung, HMD, and Nokia comes factory-sealed with full manufacturer warranty and verified IMEI authenticity.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to="/verify"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-md"
              >
                <FiSmartphone />
                <span>Verify IMEI Authenticity</span>
                <FiArrowRight />
              </Link>
              <Link
                to="/brands"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition border border-white/10"
              >
                <span>Explore All Brands</span>
              </Link>
            </div>
          </div>

          {/* Right Trust Features Grid */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 space-y-1">
              <div className="p-2 w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                🌊
              </div>
              <h4 className="font-bold text-white text-xs">Wave Money Transfer</h4>
              <p className="text-[11px] text-slate-400">0% deposit charges across West &amp; Sub-Saharan Africa.</p>
            </div>

            <div className="p-3.5 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 space-y-1">
              <div className="p-2 w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <FiCheckCircle className="text-base" />
              </div>
              <h4 className="font-bold text-white text-xs">100% Genuine Devices</h4>
              <p className="text-[11px] text-slate-400">Factory sealed with valid international manufacturer warranty.</p>
            </div>

            <div className="p-3.5 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 space-y-1">
              <div className="p-2 w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <FiTruck className="text-base" />
              </div>
              <h4 className="font-bold text-white text-xs">Express Dispatch</h4>
              <p className="text-[11px] text-slate-400">Fast, insured regional &amp; international door-to-door delivery.</p>
            </div>

            <div className="p-3.5 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 space-y-1">
              <div className="p-2 w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <FiShield className="text-base" />
              </div>
              <h4 className="font-bold text-white text-xs">IMEI Protection</h4>
              <p className="text-[11px] text-slate-400">Instant online authenticity verification before procurement.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProductGridBreaker;
