import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiShield,
  FiTruck,
  FiArrowRight,
  FiHeart,
  FiTag,
  FiCopy,
  FiCheck,
  FiBriefcase,
  FiPercent,
  FiZap,
  FiCpu,
  FiHeadphones,
  FiBatteryCharging,
  FiRadio,
  FiFileText,
  FiGlobe,
  FiCreditCard,
  FiAward,
} from "react-icons/fi";
import { SiApple } from "react-icons/si";
import { useWishlist } from "../../context/WishlistContext";
import { slugify } from "../../utils/slugify";

const ProductGridBreaker = () => {
  const [searchParams] = useSearchParams();
  const currentCategory = searchParams.get("category") || "";
  const currentSubCategory = searchParams.get("subcategory") || "";

  const { wishlist, setIsWishlistOpen } = useWishlist();

  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const autoPlayRef = useRef(null);

  const handleCopyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2500);
  };

  // Build the list of active dynamic banners with distinct branded themes & standard SVG icons
  const dynamicBanners = useMemo(() => {
    const banners = [];

    // 1. 🎉 FIRST-ORDER 10% COUPON BANNER (Royal Sky-Indigo Gradient)
    banners.push({
      id: "coupon-welcome10",
      theme: "bg-gradient-to-r from-sky-700 via-indigo-700 to-blue-900 text-white border-indigo-400/30",
      isLight: false,
      badgeIcon: FiPercent,
      badgeText: "Exclusive First Order Offer • 10% OFF",
      badgeColor: "bg-white/15 text-white border-white/20",
      title: "Claim 10% OFF Your First E-ALL Order",
      description:
        "Enjoy direct distributor savings on genuine Apple, Samsung, HMD, and Nokia devices. Enter promo code at checkout for instant savings.",
      couponCode: "WELCOME10",
      primaryCtaText: "Copy Promo Code",
      primaryCtaAction: "copy",
      primaryBtnClass: "bg-white hover:bg-slate-100 text-indigo-900 font-bold",
      secondaryCtaText: "Browse All Products",
      secondaryCtaLink: "/products",
      secondaryBtnClass: "bg-white/10 hover:bg-white/20 text-white border-white/20",
      features: [
        { icon: FiTag, iconColor: "text-amber-300", title: "10% Instant Discount", text: "Applies automatically at checkout on your first order." },
        { icon: FiTruck, iconColor: "text-emerald-300", title: "Free UAE Express Delivery", text: "Fast tracked door-to-door courier dispatch across Emirates." },
        { icon: FiShield, iconColor: "text-sky-300", title: "100% Genuine Guaranteed", text: "Brand new factory-sealed stock with official warranty." },
        { icon: FiZap, iconColor: "text-yellow-300", title: "Instant Wave & Card Checkout", text: "Zero transaction fee digital settlement options." },
      ],
    });

    // 2. ❤️ PERSONALIZED WISHLIST RETARGETING BANNER (Clean Luxury Rose Card)
    if (wishlist && wishlist.length > 0) {
      banners.push({
        id: "wishlist-reminder",
        theme: "bg-gradient-to-r from-rose-50 via-white to-pink-50 text-slate-900 border-rose-200 shadow-xl",
        isLight: true,
        badgeIcon: FiHeart,
        badgeText: `Saved in Your Wishlist • ${wishlist.length} Items`,
        badgeColor: "bg-rose-100/90 text-rose-700 border-rose-300/80",
        title: `You Have ${wishlist.length} Device${wishlist.length > 1 ? "s" : ""} in Your Wishlist`,
        description:
          "Don't leave your favorite devices behind. Complete your procurement with verified IMEI authenticity and fast regional delivery.",
        primaryCtaText: "Open My Wishlist",
        primaryCtaAction: "wishlist",
        primaryBtnClass: "bg-rose-600 hover:bg-rose-700 text-white font-bold",
        secondaryCtaText: "Continue Shopping",
        secondaryCtaLink: "/products",
        secondaryBtnClass: "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200",
        features: [
          { icon: FiHeart, iconColor: "text-rose-600", title: `${wishlist.length} Saved Devices`, text: "Stored safely in your local account for quick ordering." },
          { icon: FiAward, iconColor: "text-amber-600", title: "Stock Allocation Reserved", text: "Fast dispatch directly from Dubai central warehouse." },
          { icon: FiShield, iconColor: "text-sky-600", title: "IMEI Verified Authenticity", text: "Instant online serial verification before shipment." },
          { icon: FiCreditCard, iconColor: "text-indigo-600", title: "Flexible Payment Options", text: "Wave, Apple Pay, Credit/Debit & COD available." },
        ],
      });
    }

    // 3. 🍎 BRAND SPOTLIGHT: APPLE GENUINE HARDWARE (Space-Black & Titanium)
    banners.push({
      id: "apple-spotlight",
      theme: "bg-gradient-to-r from-slate-950 via-neutral-900 to-slate-900 text-white border-slate-700/60",
      isLight: false,
      badgeIcon: SiApple,
      badgeText: "Official Apple Hardware & Accessories",
      badgeColor: "bg-white/10 text-white border-white/20",
      title: "Official Apple iPhone 16 Pro, iPad & AirPods",
      description:
        "Experience the power of A18 Pro silicon, aerospace titanium design, and official international Apple warranty on every unit.",
      primaryCtaText: "Explore Apple Products",
      primaryCtaLink: "/brands/apple",
      primaryBtnClass: "bg-sky-600 hover:bg-sky-500 text-white font-bold",
      secondaryCtaText: "Verify IMEI Serial",
      secondaryCtaLink: "/verify",
      secondaryBtnClass: "bg-white/10 hover:bg-white/20 text-white border-white/20",
      features: [
        { icon: FiCpu, iconColor: "text-sky-400", title: "A18 Pro & Apple Silicon", text: "Industry-leading speed with advanced Apple Intelligence." },
        { icon: FiHeadphones, iconColor: "text-indigo-400", title: "AirPods Pro with ANC", text: "Active noise cancellation and adaptive transparency audio." },
        { icon: FiShield, iconColor: "text-emerald-400", title: "AppleCare Support", text: "Brand new factory-sealed units ready for warranty activation." },
        { icon: SiApple, iconColor: "text-slate-200", title: "Apple Pay 1-Touch Checkout", text: "Fast, secure contactless purchasing on Apple devices." },
      ],
    });

    // 4. ⚡ BRAND SPOTLIGHT: NOKIA & HMD DURABLE FEATURE PHONES (Nokia Ultramarine & Cyan)
    banners.push({
      id: "nokia-hmd-spotlight",
      theme: "bg-gradient-to-r from-blue-900 via-sky-800 to-cyan-700 text-white border-cyan-400/30",
      isLight: false,
      badgeIcon: FiRadio,
      badgeText: "Nokia & HMD Classic Feature Phones",
      badgeColor: "bg-white/15 text-cyan-200 border-cyan-300/30",
      title: "The World's Most Reliable Feature Phones & 4G Devices",
      description:
        "Built for extraordinary battery endurance, wireless FM, crystal clear HD voice calling, and rugged daily commercial use.",
      primaryCtaText: "View Feature Phones",
      primaryCtaLink: "/products?category=mobile-devices&subcategory=feature-phones",
      primaryBtnClass: "bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black",
      secondaryCtaText: "Explore HMD Brand",
      secondaryCtaLink: "/brands/hmd",
      secondaryBtnClass: "bg-white/10 hover:bg-white/20 text-white border-white/20",
      features: [
        { icon: FiBatteryCharging, iconColor: "text-emerald-300", title: "Up to 30 Days Standby", text: "Long-lasting removable batteries for unstoppable connectivity." },
        { icon: FiRadio, iconColor: "text-cyan-300", title: "Wireless FM & MP3 Audio", text: "Built-in powerful speakers and expandable microSD storage." },
        { icon: FiZap, iconColor: "text-amber-300", title: "4G VoLTE & Dual SIM", text: "Crystal clear HD voice calling on modern carrier networks." },
        { icon: FiShield, iconColor: "text-blue-200", title: "Legendary Drop Resistance", text: "Polycarbonate unibody design crafted to withstand impact." },
      ],
    });

    // 5. 🏢 B2B & ENTERPRISE WHOLESALE BANNER (Corporate Executive Navy)
    banners.push({
      id: "b2b-procurement",
      theme: "bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white border-sky-500/30",
      isLight: false,
      badgeIcon: FiBriefcase,
      badgeText: "B2B & Regional Wholesale Hub",
      badgeColor: "bg-sky-500/20 text-sky-300 border-sky-400/30",
      title: "Direct Wholesale & Container-Level Bulk Procurement",
      description:
        "Supplying regional importers, retail chains, and corporate buyers across UAE, West Africa (Senegal, Côte d'Ivoire, Mali) with FTA UAE VAT tax e-invoices.",
      primaryCtaText: "Submit Formal RFQ",
      primaryCtaLink: "/contact",
      primaryBtnClass: "bg-sky-600 hover:bg-sky-500 text-white font-bold",
      secondaryCtaText: "Explore B2B Solutions",
      secondaryCtaLink: "/solutions",
      secondaryBtnClass: "bg-white/10 hover:bg-white/20 text-white border-white/20",
      features: [
        { icon: FiPercent, iconColor: "text-emerald-400", title: "Tiered Bulk Discounts", text: "Volume-based tiered pricing on 50+, 200+, and container pallets." },
        { icon: FiTruck, iconColor: "text-sky-400", title: "Air & Sea Cargo Logistics", text: "Direct consolidation to Dakar, Abidjan, Bamako & GCC ports." },
        { icon: FiFileText, iconColor: "text-indigo-400", title: "FTA VAT Tax Invoicing", text: "Full UAE TRN compliant tax invoices & packing lists." },
        { icon: FiGlobe, iconColor: "text-teal-400", title: "Wave 0% African Settlement", text: "Zero deposit charges for cross-border African transfers." },
      ],
    });

    return banners;
  }, [wishlist]);

  // Context-aware prioritization: if currently on feature-phones, start with Nokia/HMD slide
  useEffect(() => {
    const isFeaturePhoneQuery =
      slugify(currentSubCategory) === "feature-phones" ||
      slugify(currentCategory) === "feature-phones";

    if (isFeaturePhoneQuery) {
      const idx = dynamicBanners.findIndex((b) => b.id === "nokia-hmd-spotlight");
      if (idx !== -1) setCurrentSlideIndex(idx);
    }
  }, [currentSubCategory, currentCategory, dynamicBanners]);

  // Fully automatic rotation every 7 seconds (pauses gently on mouse hover)
  useEffect(() => {
    if (isHovered || dynamicBanners.length <= 1) return;

    autoPlayRef.current = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % dynamicBanners.length);
    }, 7000);

    return () => clearInterval(autoPlayRef.current);
  }, [isHovered, dynamicBanners.length]);

  const activeBanner = dynamicBanners[currentSlideIndex] || dynamicBanners[0];
  if (!activeBanner) return null;

  const BadgeIcon = activeBanner.badgeIcon || FiShield;
  const isLight = activeBanner.isLight;

  return (
    <div
      className="col-span-full my-4 sm:my-6"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`relative overflow-hidden rounded-3xl ${activeBanner.theme} p-6 sm:p-8 md:p-10 shadow-xl border transition-all duration-700`}
      >
        {/* Subtle Decorative Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-black/5 rounded-full blur-3xl pointer-events-none" />

        {/* Main Content Smooth Animated Crossfade */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeBanner.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center text-left"
          >
            {/* Left Side: Headline, Description & CTAs */}
            <div className="lg:col-span-7 space-y-3.5">
              
              {/* Dynamic Context Badge */}
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${activeBanner.badgeColor}`}
              >
                <BadgeIcon className="text-sm shrink-0" />
                <span>{activeBanner.badgeText}</span>
              </div>

              {/* Title */}
              <h3
                className={`text-xl sm:text-2xl md:text-3xl font-black leading-tight tracking-tight ${
                  isLight ? "text-slate-900" : "text-white"
                }`}
              >
                {activeBanner.title}
              </h3>

              {/* Description */}
              <p
                className={`text-xs sm:text-sm max-w-xl leading-relaxed ${
                  isLight ? "text-slate-600" : "text-slate-300"
                }`}
              >
                {activeBanner.description}
              </p>

              {/* Coupon Code Pill if applicable */}
              {activeBanner.couponCode && (
                <div className="pt-1 flex items-center gap-3">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/20 backdrop-blur-xs">
                    <span className="text-[11px] text-white/80 font-medium">Use Code:</span>
                    <span className="font-mono font-black text-white text-sm tracking-wider">
                      {activeBanner.couponCode}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyCoupon(activeBanner.couponCode)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-indigo-900 text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    {copiedCoupon ? (
                      <>
                        <FiCheck className="text-sm text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <FiCopy className="text-xs" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                {activeBanner.primaryCtaAction === "wishlist" ? (
                  <button
                    type="button"
                    onClick={() => setIsWishlistOpen(true)}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-md cursor-pointer ${activeBanner.primaryBtnClass}`}
                  >
                    <FiHeart className="fill-current text-sm" />
                    <span>{activeBanner.primaryCtaText}</span>
                    <FiArrowRight />
                  </button>
                ) : activeBanner.primaryCtaAction === "copy" ? (
                  <Link
                    to="/products"
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-md ${activeBanner.primaryBtnClass}`}
                  >
                    <span>Shop All Products</span>
                    <FiArrowRight />
                  </Link>
                ) : (
                  <Link
                    to={activeBanner.primaryCtaLink || "/products"}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-md ${activeBanner.primaryBtnClass}`}
                  >
                    <span>{activeBanner.primaryCtaText}</span>
                    <FiArrowRight />
                  </Link>
                )}

                {activeBanner.secondaryCtaText && (
                  <Link
                    to={activeBanner.secondaryCtaLink || "/products"}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition border ${activeBanner.secondaryBtnClass}`}
                  >
                    <span>{activeBanner.secondaryCtaText}</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Right Side: 4 Standard Vector Feature Cards */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-2.5 sm:gap-3 text-xs">
              {activeBanner.features.map((f, idx) => {
                const FeatureIcon = f.icon;
                return (
                  <div
                    key={idx}
                    className={`p-3 sm:p-3.5 rounded-2xl border transition-colors space-y-1.5 ${
                      isLight
                        ? "bg-white/80 border-slate-200/80 shadow-2xs hover:bg-white"
                        : "bg-white/5 backdrop-blur-xs border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div className={`text-base sm:text-lg ${f.iconColor}`}>
                      <FeatureIcon />
                    </div>
                    <h4
                      className={`font-bold text-xs leading-snug ${
                        isLight ? "text-slate-900" : "text-white"
                      }`}
                    >
                      {f.title}
                    </h4>
                    <p
                      className={`text-[10.5px] leading-relaxed line-clamp-2 ${
                        isLight ? "text-slate-500" : "text-slate-300/80"
                      }`}
                    >
                      {f.text}
                    </p>
                  </div>
                );
              })}
            </div>

          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
};

export default ProductGridBreaker;
