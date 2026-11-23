import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowRight, FiShield, FiSearch, FiCheckCircle } from "react-icons/fi";
import { brands } from "../../data/brandsData";
import { useCatalog } from "../../context/CatalogContext";

const BrandAndImeiSection = () => {
  const { products = [] } = useCatalog();
  const [imeiInput, setImeiInput] = useState("");
  const navigate = useNavigate();

  // Count real live products per brand slug
  const brandCards = useMemo(() => {
    const counts = new Map();
    products.forEach((p) => {
      const slug = (p.brandSlug || p.brand || "").toLowerCase();
      counts.set(slug, (counts.get(slug) || 0) + 1);
    });

    return brands.slice(0, 8).map((b) => ({
      ...b,
      liveCount: counts.get(b.slug.toLowerCase()) || b.stats?.products || 0,
    }));
  }, [products]);

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    const cleaned = imeiInput.trim();
    if (cleaned) {
      navigate(`/verify?imei=${encodeURIComponent(cleaned)}`);
    } else {
      navigate("/verify");
    }
  };

  return (
    <section className="py-10 sm:py-12 bg-slate-50/70 border-t border-slate-200/70 text-left">
      <div className="w-full px-4 sm:px-6 lg:px-8 space-y-8">
        {/* 1. OFFICIAL BRAND SHOWCASE GRID */}
        <div className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-700">
                Authorized &amp; Genuine Supply
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 mt-0.5">
                Shop by Official Brand
              </h2>
            </div>

            <Link
              to="/brands"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-sky-700 hover:text-sky-900 whitespace-nowrap transition"
            >
              <span>All Brands</span>
              <FiArrowRight />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {brandCards.map((brand) => (
              <Link
                key={brand.slug}
                to={`/brands/${brand.slug}`}
                className="group rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/80 hover:border-sky-300 hover:shadow-md p-4 flex flex-col items-center justify-center text-center transition-all duration-200"
              >
                <div className="h-10 flex items-center justify-center mb-2">
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="max-h-8 max-w-20 w-auto object-contain transition-transform duration-300 group-hover:scale-108"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-900 truncate max-w-full">
                  {brand.name}
                </span>
                <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                  {brand.liveCount} items
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* 2. INTERACTIVE IMEI AUTHENTICITY & WARRANTY VERIFIER STRIP */}
        <div className="rounded-3xl bg-slate-50 border border-slate-200/90 p-5 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-3.5 max-w-xl">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
              <FiShield className="text-xl" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Verify Device IMEI &amp; Official Warranty
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <FiCheckCircle className="text-[11px]" /> Instant Lookup
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                Check authenticity, purchase provenance, and official warranty coverage for any E-ALL serialized device using its 15-digit IMEI or serial number.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleVerifySubmit}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto lg:min-w-[380px]"
          >
            <div className="relative flex-1">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                value={imeiInput}
                onChange={(e) => setImeiInput(e.target.value)}
                placeholder="Enter 15-digit IMEI or Serial #"
                className="w-full h-11 pl-10 pr-3.5 bg-white border border-slate-300 focus:border-sky-600 rounded-xl text-xs sm:text-sm font-mono text-slate-900 placeholder:text-slate-400 outline-none transition"
              />
            </div>
            <button
              type="submit"
              className="h-11 px-5 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer shrink-0"
            >
              <span>Verify IMEI</span>
              <FiArrowRight />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default BrandAndImeiSection;
