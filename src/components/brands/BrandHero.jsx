import {
  FiArrowRight,
  FiCalendar,
  FiCheckCircle,
  FiMapPin,
  FiPackage,
  FiShield,
} from "react-icons/fi";
import SlideUp from "../animations/SlideUp";
import { useEffect, useState } from "react";

const BrandHero = ({ brand }) => {
  const banners = brand.banners || [];

  const [activeBanner, setActiveBanner] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;

    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % banners.length);
    }, 7000);

    return () => clearInterval(timer);
  }, [banners]);

  return (
    <section className="relative min-h-[85vh] sm:min-h-[90vh] w-full flex flex-col justify-center overflow-hidden">
      {/* BACKGROUND IMAGES */}
      {banners.map((image, index) => (
        <div
          key={image}
          className={`
            absolute
            inset-0
            bg-cover
            bg-center
            transition-opacity
            duration-1000
            ${activeBanner === index ? "opacity-100" : "opacity-0"}
          `}
          style={{
            backgroundImage: `url(${image})`,
          }}
        />
      ))}

      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-950/65" />

      {/* CONTENT */}
      <div className="relative z-10 w-full px-6 sm:px-8 lg:px-12 pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-24 text-left">
        <div className="max-w-4xl text-white">
          <SlideUp>
            {/* Partnership Badge */}
            {brand.partnership && (
              <div className="mb-4 sm:mb-6">
                <div
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    border
                    border-sky-400/40
                    bg-sky-500/15
                    backdrop-blur-md
                    px-3.5 sm:px-5
                    py-1.5 sm:py-2
                    text-xs sm:text-sm
                    font-medium
                    tracking-wide
                    text-sky-200
                  "
                >
                  <FiCheckCircle className="text-sky-400 text-sm sm:text-base shrink-0" />
                  <span>{brand.partnership.type}</span>
                  {brand.partnership.region && (
                    <span className="text-sky-300/80">
                      • {brand.partnership.region}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Tagline */}
            <h1
              className="font-bold tracking-tight text-white leading-tight"
              style={{
                fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
              }}
            >
              {brand.tagline}
            </h1>

            {/* Description */}
            <p
              className="mt-4 sm:mt-5 text-slate-200 leading-relaxed max-w-3xl"
              style={{
                fontSize: "clamp(0.95rem, 1.3vw, 1.15rem)",
              }}
            >
              {brand.description}
            </p>

            {/* Stats Grid */}
            <div className="mt-8 sm:mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 p-3.5 sm:p-4">
                <FiMapPin className="mb-1.5 text-base sm:text-lg text-sky-400" />
                <p className="text-[11px] sm:text-xs text-slate-300">Country</p>
                <p className="font-semibold text-sm sm:text-base truncate">
                  {brand.country}
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 p-3.5 sm:p-4">
                <FiCalendar className="mb-1.5 text-base sm:text-lg text-sky-400" />
                <p className="text-[11px] sm:text-xs text-slate-300">Founded</p>
                <p className="font-semibold text-sm sm:text-base">
                  {brand.founded}
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 p-3.5 sm:p-4">
                <FiShield className="mb-1.5 text-base sm:text-lg text-sky-400" />
                <p className="text-[11px] sm:text-xs text-slate-300">
                  Warranty
                </p>
                <p className="font-semibold text-sm sm:text-base">
                  {brand.stats.warranty}
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 p-3.5 sm:p-4">
                <FiPackage className="mb-1.5 text-base sm:text-lg text-sky-400" />
                <p className="text-[11px] sm:text-xs text-slate-300">
                  Products
                </p>
                <p className="font-semibold text-sm sm:text-base">
                  {brand.stats.products}
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-8 sm:mt-10">
              <button
                onClick={() => {
                  document.getElementById("products")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                className="
                  px-6 sm:px-8
                  py-3 sm:py-3.5
                  rounded-xl
                  inline-flex
                  items-center
                  gap-2
                  border
                  border-white/80
                  bg-white/10
                  hover:bg-white
                  text-white
                  hover:text-slate-900
                  font-semibold
                  text-sm sm:text-base
                  backdrop-blur-md
                  transition-all
                  duration-200
                  cursor-pointer
                  shadow-lg
                "
              >
                <span>View Products</span>
                <FiArrowRight className="transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </SlideUp>
        </div>
      </div>

      {/* Brand Sub-Watermark */}
      <div className="absolute hidden lg:block bottom-6 right-8 text-white/40 text-xs tracking-wider">
        E-ALL • Electronics All
      </div>
    </section>
  );
};

export default BrandHero;
