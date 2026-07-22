import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiCalendar,
  FiCheckCircle,
  FiMapPin,
  FiMessageCircle,
  FiPackage,
  FiShield,
} from "react-icons/fi";
import Container from "../common/Container";
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
    <section className="relative  h-180 overflow-hidden">
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
      <div className="absolute inset-0 bg-slate-900/60 " />
      <SlideUp>
        <div className="relative z-10 items-center h-162.5 p-6 lg:p-10 text-left">
          <div className="max-w-4xl pt-44 text-white">
            {/* Partnership */}

            {brand.partnership && (
              <div
                className="
                relative
                -top-20
                
                  inline-flex
                  
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-sky-400/40
                  bg-sky-500/15
                  backdrop-blur-md
                  px-5
                  py-2
                  text-sm
                  font-medium
                  text-sky-200
                "
              >
                <FiCheckCircle />

                {brand.partnership.type}

                {brand.partnership.region && <>• {brand.partnership.region}</>}
              </div>
            )}

            {/* <img
              src={brand.logo}
              alt={brand.name}
              className="h-16 object-contain bg-white rounded-xl p-2"
            /> */}

            {/* <h1 className="mt-8 text-5xl! font-black">{brand.name}</h1> */}

            <p
              className="
    mt-4
    font-bold
    tracking-wider
    text-white
    leading-tight
  "
              style={{
                fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
              }}
            >
              {brand.tagline}
            </p>

            <p
              className="
    mt-6
    text-slate-200
    leading-8
    max-w-4xl
  "
              style={{
                fontSize: "clamp(1rem, 1.4vw, 1.25rem)",
              }}
            >
              {brand.description}
            </p>

            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                <FiMapPin className="mb-2 text-lg" />
                <p className="text-xs text-slate-300">Country</p>
                <p className="font-semibold">{brand.country}</p>
              </div>

              <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                <FiCalendar className="mb-2 text-lg" />
                <p className="text-xs text-slate-300">Founded</p>
                <p className="font-semibold">{brand.founded}</p>
              </div>

              <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                <FiShield className="mb-2 text-lg" />
                <p className="text-xs text-slate-300">Warranty</p>
                <p className="font-semibold">{brand.stats.warranty}</p>
              </div>

              <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                <FiPackage className="mb-2 text-lg" />
                <p className="text-xs text-slate-300">Products</p>
                <p className="font-semibold">{brand.stats.products}</p>
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <Link
                to="/contact"
                className="px-8 py-4 font-semibold rounded-2xl bg-sky-700 hover:bg-sky-800 text-white items-center"
              >
                Request Quote
              </Link>

              <Link
                to="#products"
                className="px-8 py-4 rounded-2xl flex items-center gap-2 border border-white hover:bg-white hover:text-slate-900 transition"
              >
                View Products
                <FiArrowRight />
              </Link>
            </div>
            <div
              className="
            absolute
            bottom-8
            right-0
            text-white/70
            text-sm
          "
            >
              E-ALL • Electronics All
            </div>
          </div>
        </div>
      </SlideUp>
    </section>
  );
};

export default BrandHero;
