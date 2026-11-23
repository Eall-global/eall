import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiBriefcase,
  FiCopy,
  FiCheck,
  FiTag,
  FiTruck,
  FiShield,
  FiCreditCard,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { useCatalog } from "../../context/CatalogContext";
import { useCountry } from "../../context/CountryContext";
import { fetchCoupons, DEFAULT_COUPONS } from "../../services/couponService";
import { slugify } from "../../utils/slugify";
import { AedPrice } from "../common/AedSymbol";

const getImg = (p) =>
  p?.variants?.find((v) => v.isDefault)?.image ||
  p?.variants?.[0]?.image ||
  p?.image ||
  "/logo.png";

const getPrice = (p) =>
  p?.livePrice !== undefined
    ? Number(p.livePrice)
    : Number(p?.price) || Number(p?.storagePricing?.["256GB"]) || 0;

/**
 * Loads bespoke full-bleed campaign artwork from `/assets/home/<file>` when present,
 * and gracefully falls back to a clean framed studio product visual until the graphic is added.
 */
const HeroCardArtwork = ({
  customSrc,
  fallbackSrc,
  alt,
  darkBackdrop = false,
}) => {
  const [hasCustomArt, setHasCustomArt] = useState(true);

  if (hasCustomArt && customSrc) {
    return (
      <>
        <img
          src={customSrc}
          alt={alt}
          onError={() => setHasCustomArt(false)}
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-104"
        />
        {/* Localized top & bottom readability scrims leaving the central studio product 100% un-dimmed */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 top-0 h-36 ${
            darkBackdrop
              ? "bg-gradient-to-b from-slate-950/85 via-slate-950/45 to-transparent"
              : "bg-gradient-to-b from-sky-100/90 via-sky-50/55 to-transparent"
          }`}
        />
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-24 ${
            darkBackdrop
              ? "bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-transparent"
              : "bg-gradient-to-t from-white/95 via-white/60 to-transparent"
          }`}
        />
      </>
    );
  }

  return (
    <div className="relative z-10 my-4 flex items-center justify-center flex-1">
      <div className="w-44 h-44 sm:w-48 sm:h-48 rounded-3xl bg-white shadow-lg border border-slate-200/70 flex items-center justify-center p-4 transition-transform duration-500 group-hover:scale-105">
        <img
          src={fallbackSrc || "/logo.png"}
          alt={alt}
          className="max-h-36 sm:max-h-40 max-w-full object-contain"
          onError={(e) => {
            e.currentTarget.src = "/logo.png";
          }}
        />
      </div>
    </div>
  );
};

/**
 * Loads bespoke 1:1 department card artwork from `/assets/home/cat-*.png` when present,
 * or falls back cleanly to catalog product photography.
 */
const CategoryTileArtwork = ({ customSrc, fallbackSrc, alt, isB2B }) => {
  const [hasCustomArt, setHasCustomArt] = useState(true);

  if (hasCustomArt && customSrc) {
    return (
      <img
        src={customSrc}
        alt={alt}
        onError={() => setHasCustomArt(false)}
        className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-106"
      />
    );
  }

  if (isB2B) {
    return (
      <FiBriefcase className="text-3xl text-orange-500 pb-3 group-hover:scale-110 transition-transform" />
    );
  }

  return (
    <img
      src={fallbackSrc || "/logo.png"}
      alt={alt}
      className="max-h-16 max-w-[82%] object-contain pb-3 transition-transform duration-300 group-hover:scale-108"
      onError={(e) => {
        e.currentTarget.src = "/logo.png";
      }}
    />
  );
};

const COUPON_POSTER_PRESETS = [
  {
    poster: "/assets/home/hero-coupon-1.png",
    eyebrow: "First Order Welcome Offer",
    headline: "10% OFF Your First Order",
    subtext:
      "Instant 10% savings at checkout + Free UAE delivery on orders over AED 500.",
    bgCls: "from-indigo-950 via-indigo-900 to-violet-950",
    pillCls: "bg-indigo-500/30 text-indigo-100 border-indigo-400/40",
    badgeCls: "bg-amber-400 text-slate-950",
  },
  {
    poster: "/assets/home/hero-coupon-2.png",
    eyebrow: "Storewide Smart Tech Deal",
    headline: "5% OFF Storewide Tech",
    subtext:
      "Extra 5% discount across smartphones, tablets, audio & wearables over AED 200.",
    bgCls: "from-emerald-950 via-teal-900 to-emerald-950",
    pillCls: "bg-emerald-500/30 text-emerald-100 border-emerald-400/40",
    badgeCls: "bg-emerald-300 text-slate-950",
  },
  {
    poster: "/assets/home/hero-coupon-3.png",
    eyebrow: "Instant Cash Voucher",
    headline: "AED 50 Flat Cash Off",
    subtext:
      "Save AED 50 immediately at checkout on any retail order above AED 500.",
    bgCls: "from-amber-950 via-orange-900 to-amber-950",
    pillCls: "bg-amber-500/30 text-amber-100 border-amber-400/40",
    badgeCls: "bg-amber-300 text-slate-950",
  },
];

const formatPaymentSummary = (methods = []) => {
  const labels = {
    apple_pay: "Apple Pay",
    card: "Cards",
    tabby: "Tabby",
    tamara: "Tamara",
    mpesa: "M-Pesa",
    wave: "Wave",
    orange_money: "Orange Money",
    mtn_momo: "MTN MoMo",
    airtel_money: "Airtel Money",
    cod: "COD",
    wire: "Bank Wire",
  };
  return methods
    .map((m) => labels[m])
    .filter(Boolean)
    .slice(0, 4)
    .join(", ");
};

const EcommerceHero = ({ onOpenRfq }) => {
  const { products = [], allCatalogProducts = [] } = useCatalog();
  const { activeCountry, countryPath, convertPrice, formatPrice } = useCountry();
  const showcaseCatalog = products.length > 0 ? products : allCatalogProducts;
  const [coupons, setCoupons] = useState(DEFAULT_COUPONS);
  const [activeCouponIdx, setActiveCouponIdx] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [copiedCode, setCopiedCode] = useState("");

  useEffect(() => {
    let active = true;
    fetchCoupons()
      .then((list) => {
        if (!active || !Array.isArray(list)) return;
        const now = new Date();
        const validList = list.filter(
          (c) =>
            c.isActive !== false &&
            (!c.expiresAt || new Date(c.expiresAt) >= now)
        );
        if (validList.length > 0) {
          setCoupons(validList.slice(0, 5));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (isCarouselPaused || coupons.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActiveCouponIdx((prev) => (prev + 1) % coupons.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [isCarouselPaused, coupons.length]);

  // Curated flagship merchandising (prefers active country's local stock, falls back to global showcase)
  const { appleHero, samsungHero, hmdHero, departmentTiles } = useMemo(() => {
    const findBest = (brandName, keyword) =>
      showcaseCatalog.find(
        (p) =>
          (p.brand || "").toLowerCase() === brandName &&
          (!keyword || (p.name || "").toLowerCase().includes(keyword)) &&
          getImg(p) !== "/logo.png"
      ) ||
      showcaseCatalog.find((p) => (p.brand || "").toLowerCase() === brandName);

    const apple =
      showcaseCatalog.find((p) => p.slug === "iphone-18-pro-max") ||
      findBest("apple", "iphone 18 pro max") ||
      findBest("apple", "iphone 18 pro") ||
      findBest("apple", "iphone");
    const samsung =
      showcaseCatalog.find((p) => p.slug === "galaxy-s25-ultra") ||
      findBest("samsung", "s25 ultra") ||
      findBest("samsung", "ultra") ||
      findBest("samsung", "galaxy");
    const hmdPhone =
      findBest("hmd", "luma") ||
      findBest("hmd", "aura") ||
      findBest("hmd", "crest") ||
      findBest("hmd");
    const nokiaClassic =
      findBest("nokia", "3210") ||
      findBest("nokia", "235") ||
      findBest("nokia", "150") ||
      findBest("nokia");
    const audioHero =
      showcaseCatalog.find(
        (p) =>
          (p.name || "").toLowerCase().includes("airpods") &&
          getImg(p) !== "/logo.png"
      ) ||
      showcaseCatalog.find(
        (p) =>
          slugify(p.subCategory || "") === "audio" && getImg(p) !== "/logo.png"
      );
    const tabletHero = showcaseCatalog.find(
      (p) =>
        (slugify(p.subCategory || "") === "tablets" ||
          (p.name || "").toLowerCase().includes("ipad") ||
          (p.name || "").toLowerCase().includes("tab")) &&
        getImg(p) !== "/logo.png"
    );
    const wearableHero = showcaseCatalog.find(
      (p) =>
        (slugify(p.subCategory || "") === "wearables" ||
          (p.name || "").toLowerCase().includes("watch")) &&
        getImg(p) !== "/logo.png"
    );
    const newArrivalHero =
      showcaseCatalog.find(
        (p) =>
          p.isNewArrival &&
          p.slug !== apple?.slug &&
          p.slug !== samsung?.slug &&
          getImg(p) !== "/logo.png"
      ) || hmdPhone || apple;

    // 10 distinct Noon-style department tiles (each auto-loads `/assets/home/cat-*.png`)
    const tiles = [
      {
        id: "new-arrivals",
        label: "New Arrivals",
        pill: "Just Dropped",
        pillCls: "bg-sky-700 text-white",
        customSrc: "/assets/home/cat-new-arrivals.png",
        fallbackSrc: getImg(newArrivalHero),
        to: "/products?sort=latest",
      },
      {
        id: "smartphones",
        label: "Smartphones",
        pill: "Flagship 5G",
        pillCls: "bg-slate-900 text-white",
        customSrc: "/assets/home/cat-smartphones.png",
        fallbackSrc: getImg(apple),
        to: "/products?category=mobile-devices&subcategory=smartphones",
      },
      {
        id: "feature-phones",
        label: "Feature Phones",
        pill: "Classic Series",
        pillCls: "bg-emerald-700 text-white",
        customSrc: "/assets/home/cat-feature-phones.png",
        fallbackSrc: getImg(nokiaClassic),
        to: "/products?category=mobile-devices&subcategory=feature-phones",
      },
      {
        id: "audio",
        label: "Audio & Earbuds",
        pill: "AirPods & TWS",
        pillCls: "bg-indigo-600 text-white",
        customSrc: "/assets/home/cat-audio.png",
        fallbackSrc: getImg(audioHero),
        to: "/products?category=consumer-electronics&subcategory=audio",
      },
      {
        id: "tablets",
        label: "Tablets & iPad",
        pill: "Work & Study",
        pillCls: "bg-sky-600 text-white",
        customSrc: "/assets/home/cat-tablets.png",
        fallbackSrc: getImg(tabletHero || samsung),
        to: "/products?category=mobile-devices&subcategory=tablets",
      },
      {
        id: "wearables",
        label: "Wearables",
        pill: "Smartwatches",
        pillCls: "bg-slate-800 text-white",
        customSrc: "/assets/home/cat-wearables.png",
        fallbackSrc: getImg(wearableHero || apple),
        to: "/products?category=consumer-electronics&subcategory=wearables",
      },
      {
        id: "apple",
        label: "Apple Store",
        pill: "Official UAE",
        pillCls: "bg-slate-900 text-white",
        customSrc: "/assets/home/cat-apple.png",
        fallbackSrc: getImg(apple),
        to: "/brands/apple",
      },
      {
        id: "samsung",
        label: "Samsung",
        pill: "Galaxy AI",
        pillCls: "bg-blue-700 text-white",
        customSrc: "/assets/home/cat-samsung.png",
        fallbackSrc: getImg(samsung),
        to: "/brands/samsung",
      },
      {
        id: "hmd",
        label: "HMD & Nokia",
        pill: "Authorized",
        pillCls: "bg-teal-700 text-white",
        customSrc: "/assets/home/cat-hmd-nokia.png",
        fallbackSrc: getImg(hmdPhone || nokiaClassic),
        to: "/brands/hmd",
      },
      {
        id: "wholesale",
        label: "Wholesale B2B",
        pill: "10–5,000+ Pcs",
        pillCls: "bg-orange-500 text-white",
        customSrc: "/assets/home/cat-wholesale.png",
        fallbackSrc: null,
        isB2B: true,
      },
    ];

    return {
      appleHero: apple,
      samsungHero: samsung,
      hmdHero: hmdPhone,
      departmentTiles: tiles,
    };
  }, [showcaseCatalog]);

  const safeCouponIdx =
    coupons.length > 0 ? activeCouponIdx % coupons.length : 0;
  const currentCoupon = coupons[safeCouponIdx] || DEFAULT_COUPONS[0];
  const currentPreset =
    COUPON_POSTER_PRESETS[safeCouponIdx % COUPON_POSTER_PRESETS.length];

  const handleCopyCoupon = (code) => {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    window.setTimeout(() => setCopiedCode(""), 2200);
  };

  const couponBadgeText =
    Number(currentCoupon?.discountPercent) > 0
      ? `${currentCoupon.discountPercent}% OFF`
      : `${formatPrice(convertPrice(Number(currentCoupon?.discountFlat || 50)))} OFF`;

  return (
    <section className="bg-slate-50 border-b border-slate-200/80 pt-[92px] sm:pt-[108px] xl:pt-[144px] pb-6 text-left">
      <div className="w-full px-4 sm:px-6 lg:px-8 space-y-4">
        {/* ================================================================= */}
        {/* FULL-WIDTH 4-COLUMN EDITORIAL COMMERCE MOSAIC                     */}
        {/* ================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4 items-stretch">
          {/* TILE 1: APPLE iPHONE 18 PRO MAX FLAGSHIP CAMPAIGN CARD */}
          <Link
            to={countryPath(appleHero ? `/products/${appleHero.slug}` : "/brands/apple")}
            className="group relative rounded-3xl bg-gradient-to-b from-slate-900 via-sky-950 to-slate-900 text-white p-5 sm:p-6 flex flex-col justify-between overflow-hidden min-h-[360px] sm:min-h-[400px] shadow-sm hover:shadow-xl transition-all duration-300"
          >
            <HeroCardArtwork
              customSrc="/assets/home/hero-apple.png"
              fallbackSrc={getImg(appleHero)}
              alt={appleHero?.shortName || "iPhone 18 Pro Max"}
              darkBackdrop={true}
            />

            <div className="relative z-10 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-sky-500/25 text-sky-200 border border-sky-400/35 backdrop-blur-xs">
                  Apple Flagship Series
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300">
                  <FiCheckCircle /> Official Warranty
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                {appleHero?.shortName || appleHero?.name || "iPhone 18 Pro Max"}
              </h1>
              <p className="text-xs text-slate-200/90 leading-relaxed line-clamp-2">
                A20 Pro 2nm chip, 48MP variable-aperture camera &amp; 6.9-inch Super Retina XDR display.
              </p>
            </div>

            <div className="relative z-10 pt-3 border-t border-white/15 flex items-center justify-between gap-2 mt-auto">
              <div>
                {getPrice(appleHero) > 0 ? (
                  <>
                    <span className="block text-[9.5px] uppercase font-bold text-slate-300">
                      Starting From
                    </span>
                    <AedPrice
                      amount={getPrice(appleHero)}
                      className="text-base font-black font-mono text-white"
                      symbolClassName="text-sky-400"
                    />
                  </>
                ) : (
                  <span className="text-xs font-bold text-sky-300">
                    Explore Apple Range
                  </span>
                )}
              </div>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-slate-900 group-hover:bg-sky-400 group-hover:text-slate-950 text-xs font-extrabold transition shadow-xs">
                <span>Shop Apple</span>
                <FiArrowRight />
              </span>
            </div>
          </Link>

          {/* TILE 2: SAMSUNG GALAXY FLAGSHIP CAMPAIGN CARD */}
          <Link
            to={countryPath(samsungHero ? `/products/${samsungHero.slug}` : "/brands/samsung")}
            className="group relative rounded-3xl bg-gradient-to-b from-sky-100/80 via-sky-50/50 to-white border border-sky-200/80 p-5 sm:p-6 flex flex-col justify-between overflow-hidden min-h-[360px] sm:min-h-[400px] shadow-xs hover:shadow-xl hover:border-sky-300 transition-all duration-300"
          >
            <HeroCardArtwork
              customSrc="/assets/home/hero-samsung.png"
              fallbackSrc={getImg(samsungHero)}
              alt={samsungHero?.name || "Samsung Galaxy Flagship"}
              darkBackdrop={false}
            />

            <div className="relative z-10 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-sky-700 text-white">
                  Samsung Galaxy Series
                </span>
                <span className="text-[10px] font-bold text-sky-800 bg-white/90 px-2 py-0.5 rounded-full border border-sky-200">
                  Pay in 4 • 0%
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-tight">
                {samsungHero?.name || "Galaxy S25 Ultra"}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                Flagship Galaxy AI smartphones with Middle East &amp; Global specs ready for instant delivery.
              </p>
            </div>

            <div className="relative z-10 pt-3 border-t border-sky-200/70 flex items-center justify-between gap-2 mt-auto">
              <div>
                {getPrice(samsungHero) > 0 ? (
                  <>
                    <span className="block text-[9.5px] uppercase font-bold text-slate-500">
                      Starting From
                    </span>
                    <AedPrice
                      amount={getPrice(samsungHero)}
                      className="text-base font-black font-mono text-slate-900"
                      symbolClassName="text-sky-700"
                    />
                  </>
                ) : (
                  <span className="text-xs font-bold text-sky-700">
                    Explore Galaxy Series
                  </span>
                )}
              </div>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 group-hover:bg-sky-700 text-white text-xs font-extrabold transition shadow-xs">
                <span>Explore</span>
                <FiArrowRight />
              </span>
            </div>
          </Link>

          {/* TILE 3: HMD ECOSYSTEM POSTER (HMD MOBILE + SMARTWATCH + DUB EARBUDS) */}
          <Link
            to={countryPath("/brands/hmd")}
            className="group relative rounded-3xl bg-gradient-to-b from-teal-100/80 via-emerald-50/40 to-white border border-teal-200/80 p-5 sm:p-6 flex flex-col justify-between overflow-hidden min-h-[360px] sm:min-h-[400px] shadow-xs hover:shadow-xl hover:border-teal-300 transition-all duration-300"
          >
            <HeroCardArtwork
              customSrc="/assets/home/hero-hmd.png"
              fallbackSrc={getImg(hmdHero)}
              alt="HMD Smartphones, Smartwatches & DUB Wireless Earbuds"
              darkBackdrop={false}
            />

            <div className="relative z-10 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-teal-700 text-white">
                  HMD Ecosystem
                </span>
                <span className="text-[10px] font-bold text-teal-800 bg-white/90 px-2 py-0.5 rounded-full border border-teal-200">
                  Mobile • Watch • Buds
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-tight">
                HMD Mobile, Watch &amp; Buds
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                HMD Luma smartphones, Watch P1/X1 smartwatches &amp; DUB ANC wireless earbuds.
              </p>
            </div>

            <div className="relative z-10 pt-3 border-t border-teal-200/70 flex items-center justify-between gap-2 mt-auto">
              <div>
                <span className="block text-[9.5px] uppercase font-bold text-slate-500">
                  Ecosystem Starting From
                </span>
                <AedPrice
                  amount={convertPrice(99)}
                  className="text-base font-black font-mono text-slate-900"
                  symbolClassName="text-teal-700"
                />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 group-hover:bg-teal-700 text-white text-xs font-extrabold transition shadow-xs">
                <span>Shop HMD</span>
                <FiArrowRight />
              </span>
            </div>
          </Link>

          {/* TILE 4: INTERACTIVE 3-COUPON SHOPPING PROMO POSTER CAROUSEL */}
          <div
            onMouseEnter={() => setIsCarouselPaused(true)}
            onMouseLeave={() => setIsCarouselPaused(false)}
            className={`group relative rounded-3xl bg-gradient-to-b ${currentPreset.bgCls} text-white p-5 sm:p-6 flex flex-col justify-between overflow-hidden min-h-[360px] sm:min-h-[400px] shadow-sm hover:shadow-xl transition-all duration-500`}
          >
            <HeroCardArtwork
              key={currentPreset.poster}
              customSrc={currentPreset.poster}
              fallbackSrc="/logo.png"
              alt={currentCoupon?.description || currentPreset.headline}
              darkBackdrop={true}
            />

            {/* TOP HEADER + DISCOUNT PILL + SLIDE CONTROLS */}
            <div className="relative z-10 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border backdrop-blur-xs ${currentPreset.pillCls}`}
                >
                  <FiTag /> {currentPreset.eyebrow}
                </span>
                <span
                  className={`text-[11px] font-black font-mono px-2.5 py-0.5 rounded-full shadow-xs ${currentPreset.badgeCls}`}
                >
                  {couponBadgeText}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                {currentCoupon?.description || currentPreset.headline}
              </h2>
              <p className="text-xs text-slate-200/90 leading-relaxed line-clamp-2">
                {currentPreset.subtext}
              </p>
            </div>

            {/* BOTTOM VOUCHER COPY BAR + CAROUSEL NAVIGATION */}
            <div className="relative z-10 space-y-2.5 mt-auto pt-3 border-t border-white/15">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyCoupon(currentCoupon?.code)}
                  className={`flex-1 py-2.5 px-3 rounded-xl font-mono text-xs font-extrabold flex items-center justify-between gap-1.5 border border-dashed transition cursor-pointer ${
                    copiedCode === currentCoupon?.code
                      ? "bg-emerald-500 text-white border-emerald-200"
                      : "bg-white text-slate-900 hover:bg-sky-50 border-white/80"
                  }`}
                >
                  <span className="truncate">
                    CODE: {currentCoupon?.code || "WELCOME10"}
                  </span>
                  <span className="inline-flex items-center gap-1 font-sans text-[11px] font-bold shrink-0">
                    {copiedCode === currentCoupon?.code ? (
                      <>
                        <FiCheck /> Copied!
                      </>
                    ) : (
                      <>
                        <FiCopy /> Copy
                      </>
                    )}
                  </span>
                </button>

                <Link
                  to={countryPath("/products")}
                  className="inline-flex items-center gap-1 py-2.5 px-3 rounded-xl bg-white/15 hover:bg-white hover:text-slate-950 text-white text-xs font-extrabold border border-white/25 transition shrink-0"
                >
                  <span>Shop</span>
                  <FiArrowRight />
                </Link>
              </div>

              {/* Carousel indicator dots & Prev/Next controls */}
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <div className="flex items-center gap-1.5">
                  {coupons.map((c, idx) => (
                    <button
                      key={c.id || c.code || idx}
                      type="button"
                      onClick={() => setActiveCouponIdx(idx)}
                      aria-label={`View coupon ${c.code}`}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        idx === safeCouponIdx
                          ? "w-6 bg-white"
                          : "w-2 bg-white/35 hover:bg-white/60"
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-[10px] font-semibold text-white/75">
                    {safeCouponIdx + 1} / {coupons.length} Offers
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveCouponIdx(
                        (prev) => (prev - 1 + coupons.length) % coupons.length
                      )
                    }
                    aria-label="Previous coupon offer"
                    className="w-6 h-6 rounded-lg bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
                  >
                    <FiChevronLeft className="text-xs" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveCouponIdx((prev) => (prev + 1) % coupons.length)
                    }
                    aria-label="Next coupon offer"
                    className="w-6 h-6 rounded-lg bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
                  >
                    <FiChevronRight className="text-xs" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* NOON-STYLE FULL-WIDTH 10-TILE DEPARTMENT STRIP                    */}
        {/* ================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs">
          <div className="grid grid-flow-col auto-cols-[minmax(108px,1fr)] xl:grid-flow-row xl:grid-cols-10 gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar pb-0.5">
            {departmentTiles.map((tile) => {
              const cardContent = (
                <div className="group flex flex-col items-center text-center cursor-pointer">
                  <div
                    className={`relative w-full aspect-square rounded-2xl border p-2.5 flex items-center justify-center overflow-hidden transition-all duration-200 ${
                      tile.isB2B
                        ? "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 group-hover:border-orange-400"
                        : "bg-slate-50/80 border-slate-200/80 group-hover:border-sky-400 group-hover:bg-white group-hover:shadow-sm"
                    }`}
                  >
                    <CategoryTileArtwork
                      customSrc={tile.customSrc}
                      fallbackSrc={tile.fallbackSrc}
                      alt={tile.label}
                      isB2B={tile.isB2B}
                    />
                  </div>
                  <span className="mt-2 text-xs font-extrabold text-slate-800 group-hover:text-sky-700 truncate w-full transition">
                    {tile.label}
                  </span>
                </div>
              );

              if (tile.isB2B) {
                return (
                  <button
                    key={tile.id}
                    type="button"
                    onClick={() => onOpenRfq?.("Wholesale Mixed Carton Inquiry")}
                    className="text-left"
                  >
                    {cardContent}
                  </button>
                );
              }

              return (
                <Link key={tile.id} to={countryPath(tile.to)}>
                  {cardContent}
                </Link>
              );
            })}
          </div>
        </div>

        {/* COMPACT 4-PILLAR COMMERCE ASSURANCE BAR */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {[
            {
              icon: FiTruck,
              title: "Express Doorstep Delivery",
              sub: `Free shipping over ${formatPrice(activeCountry.freeShippingThreshold)}`,
              cls: "text-sky-700 bg-sky-50",
            },
            {
              icon: FiShield,
              title: "100% Genuine & IMEI Verified",
              sub: "Official 12-month warranty",
              cls: "text-emerald-700 bg-emerald-50",
            },
            {
              icon: FiCreditCard,
              title: "Flexible Payments",
              sub: formatPaymentSummary(activeCountry.paymentMethods) || "Cards, COD & Bank Wire",
              cls: "text-indigo-700 bg-indigo-50",
            },
            {
              icon: FiBriefcase,
              title: "Authorized Wholesale Desk",
              sub: `Official ${activeCountry.taxIdLabel} Invoices (${activeCountry.currency})`,
              cls: "text-orange-600 bg-orange-50",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-white rounded-xl border border-slate-200/80 px-3 py-2.5 flex items-center gap-2.5"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.cls}`}
                >
                  <Icon className="text-sm sm:text-base" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs font-bold text-slate-900 truncate">
                    {item.title}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                    {item.sub}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default EcommerceHero;
