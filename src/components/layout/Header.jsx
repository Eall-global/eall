import { useEffect, useRef, useState, useMemo } from "react";
import {
  FiHeart,
  FiUser,
  FiSearch,
  FiGrid,
  FiChevronDown,
  FiBriefcase,
  FiShield,
  FiX,
  FiTruck,
  FiArrowRight,
  FiGlobe,
  FiCheck,
} from "react-icons/fi";
import { MdOutlineShoppingCart } from "react-icons/md";
import { BsWhatsapp } from "react-icons/bs";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import { useCatalog } from "../../context/CatalogContext";
import { useCountry } from "../../context/CountryContext";
import useScrollPosition from "../../hooks/useScrollPosition";
import SearchDrawer from "../search/SearchDrawer";
import { getDefaultVariant } from "../../utils/productVariant";
import ProductMegaMenu from "../navigation/megaMenu/ProductMegaMenu";
import QuickRfqModal from "../home/QuickRfqModal";
import { AedPrice } from "../common/AedSymbol";
import CountryFlag from "../common/CountryFlag";
import { brands } from "../../data/brandsData";

const QUICK_NAV_LINKS = [
  { label: "Apple", to: "/brands/apple" },
  { label: "Samsung", to: "/brands/samsung" },
  { label: "HMD", to: "/brands/hmd" },
  { label: "Nokia", to: "/brands/nokia" },
  {
    label: "Smartphones",
    to: "/products?category=mobile-devices&subcategory=smartphones",
  },
  {
    label: "Feature Phones",
    to: "/products?category=mobile-devices&subcategory=feature-phones",
  },
  {
    label: "Audio & Earbuds",
    to: "/products?category=consumer-electronics&subcategory=audio",
  },
  {
    label: "Tablets",
    to: "/products?category=mobile-devices&subcategory=tablets",
  },
  { label: "All Brands", to: "/brands" },
  { label: "Verify IMEI", to: "/verify" },
];

const Header = () => {
  const { wishlistCount, setIsWishlistOpen } = useWishlist();
  const { cartCount, cartSubtotal, setIsCartOpen } = useCart();
  const { isLoggedIn, openAuthModal, user } = useCustomerAuth();
  const { products = [] } = useCatalog();
  const {
    activeCountry,
    publicCountries,
    detectedCountry,
    dismissGeoBanner,
    switchCountry,
    countryPath,
  } = useCountry();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRfqOpen, setIsRfqOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [isCountryOpen, setIsCountryOpen] = useState(false);

  // Inline Predictive Search State (Tablet/Desktop md+)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const headerRef = useRef(null);
  const searchBoxRef = useRef(null);
  const countryDropdownRef = useRef(null);
  const isScrolled = useScrollPosition(48);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        activeMenu &&
        headerRef.current &&
        !headerRef.current.contains(e.target)
      ) {
        setActiveMenu(null);
      }
      if (
        searchFocused &&
        searchBoxRef.current &&
        !searchBoxRef.current.contains(e.target)
      ) {
        setSearchFocused(false);
      }
      if (
        isCountryOpen &&
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(e.target)
      ) {
        setIsCountryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeMenu, searchFocused, isCountryOpen]);

  // Close search overlay when widening to md+
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width:768px)");
    const handleResize = (e) => {
      if (e.matches) {
        setIsSearchOpen(false);
      }
    };
    mediaQuery.addEventListener("change", handleResize);
    return () => mediaQuery.removeEventListener("change", handleResize);
  }, []);

  const brand = brands.find((b) =>
    location.pathname.endsWith(`/brands/${b.slug}`)
  );

  // Live Predictive Search Results (strictly in-stock items with valid selling price > 0)
  const predictiveMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return products
      .filter((p) => {
        const qty = Number(p.localQuantity ?? p.liveQuantity ?? 0);
        const price = Number(p.livePrice ?? p.price ?? 0);
        if (qty <= 0 || price <= 0) return false;
        return (
          (p.name || "").toLowerCase().includes(q) ||
          (p.activeStockName || "").toLowerCase().includes(q) ||
          (p.brand || "").toLowerCase().includes(q) ||
          (p.sku || "").toLowerCase().includes(q) ||
          (p.activeStockSku || "").toLowerCase().includes(q) ||
          (p.categoryName || p.category || "").toLowerCase().includes(q) ||
          (p.subCategory || "").toLowerCase().includes(q)
        );
      })
      .sort(
        (a, b) =>
          Number(b.localQuantity ?? b.liveQuantity ?? 0) -
          Number(a.localQuantity ?? a.liveQuantity ?? 0)
      )
      .slice(0, 6);
  }, [products, searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchFocused(false);
    setActiveMenu(null);
    navigate(countryPath(`/products?search=${encodeURIComponent(q)}`));
  };

  const firstName = user?.fullName
    ? String(user.fullName).trim().split(/\s+/)[0]
    : "";

  const whatsappNum = String(
    activeCountry.whatsappDesk || "+971526073267"
  ).replace(/[^\d]/g, "");

  // Clean integer-formatted shipping threshold (e.g. "AED 500" instead of "AED 500.00")
  const formattedShippingThreshold = `${activeCountry.currencySymbol || activeCountry.currency} ${Math.round(
    Number(activeCountry.freeShippingThreshold || 500)
  ).toLocaleString()}`;

  return (
    <>
      <div ref={headerRef}>
        <header className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md shadow-xs border-b border-slate-200/80 transition-all duration-200">
          {/* GEOLOCATION SUGGESTION BAR (When detected visitor country differs from URL) */}
          {detectedCountry && !isScrolled && (
            <div className="bg-sky-700 text-white border-b border-sky-600">
              <div className="w-full px-3 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <FiGlobe className="shrink-0 text-sky-200 hidden sm:block" />
                  <span className="truncate flex items-center gap-1.5">
                    <span>Visiting from</span>
                    <CountryFlag code={detectedCountry.code} className="w-4 h-3" />
                    <strong>{detectedCountry.shortName}</strong>?
                    <span className="hidden sm:inline">
                      Switch to {detectedCountry.name} ({detectedCountry.currency})
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      switchCountry(detectedCountry.slug);
                      dismissGeoBanner();
                    }}
                    className="px-2.5 py-0.5 rounded-md bg-white text-sky-800 hover:bg-sky-50 font-bold text-[10.5px] transition cursor-pointer"
                  >
                    Switch
                  </button>
                  <button
                    type="button"
                    onClick={dismissGeoBanner}
                    aria-label="Dismiss country suggestion"
                    className="p-0.5 rounded hover:bg-sky-600 text-sky-100 cursor-pointer"
                  >
                    <FiX className="text-sm" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ROW 1: SLIM ANNOUNCEMENT & UTILITY BAR (Collapses smoothly on scroll) */}
          <div
            className={`bg-slate-900 text-slate-200 overflow-hidden transition-all duration-200 ${
              isScrolled ? "max-h-0 opacity-0" : "max-h-8 opacity-100"
            }`}
          >
            <div className="w-full px-3 sm:px-6 lg:px-8 h-7 sm:h-8 flex items-center justify-between gap-4 text-[10.5px] sm:text-[11px]">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 truncate">
                <FiTruck className="text-sky-400 shrink-0 text-xs" />
                <span className="truncate font-medium">
                  Free Express Delivery over{" "}
                  <strong className="text-white">
                    {formattedShippingThreshold}
                  </strong>
                  <span className="hidden sm:inline text-slate-400">
                    {" "}
                    • {activeCountry.deliveryPromise}
                  </span>
                </span>
              </div>

              <div className="hidden lg:flex items-center gap-4 shrink-0 text-slate-300 font-medium">
                <Link
                  to={countryPath("/verify")}
                  className="inline-flex items-center gap-1 hover:text-white transition"
                >
                  <FiShield className="text-emerald-400 text-xs" />
                  Verify IMEI
                </Link>
                <span className="text-slate-700">|</span>
                <button
                  type="button"
                  onClick={() => setIsRfqOpen(true)}
                  className="hover:text-white transition cursor-pointer"
                >
                  Wholesale Desk
                </button>
                <span className="text-slate-700">|</span>
                <a
                  href={`https://wa.me/${whatsappNum}?text=${encodeURIComponent(
                    "Hi E-ALL, I have an inquiry."
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold transition"
                >
                  <BsWhatsapp className="text-xs" />
                  WhatsApp Sales
                </a>
              </div>
            </div>
          </div>

          {/* ROW 2: PRIMARY BAR (Native Mobile Search Bar < md | Full Commerce Bar xl+) */}
          <div className="w-full px-3 sm:px-6 lg:px-8 h-13 sm:h-15 flex items-center justify-between gap-2.5 sm:gap-4">
            {/* LEFT: BRAND LOGO + DESKTOP COUNTRY & CURRENCY SWITCHER */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              <Link
                to={countryPath("/")}
                onClick={() => {
                  setActiveMenu(null);
                  setSearchFocused(false);
                }}
                className="flex items-center gap-2 shrink-0"
                aria-label="E-ALL Home"
              >
                <img
                  src="/logo.png"
                  alt="E-ALL Electronics"
                  className="h-7.5 sm:h-9 w-auto object-contain"
                />
                <div className="hidden sm:block leading-tight text-left">
                  <span className="text-sm font-black tracking-tight text-slate-900 block">
                    E-ALL
                  </span>
                  <span className="text-[9.5px] font-bold uppercase tracking-wider text-sky-700 block">
                    Retail &amp; Wholesale
                  </span>
                </div>
              </Link>

              {/* DESKTOP-ONLY COUNTRY & CURRENCY SWITCHER DROPDOWN */}
              <div
                ref={countryDropdownRef}
                className="hidden xl:block relative pl-3 border-l border-slate-200"
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveMenu(null);
                    setIsCountryOpen((prev) => !prev);
                  }}
                  aria-label="Switch country and currency"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition text-left cursor-pointer"
                >
                  <CountryFlag code={activeCountry.code} className="w-5 h-3.5" />
                  <div className="leading-tight">
                    <span className="block text-[9.5px] font-semibold text-slate-400">
                      Region &amp; Currency
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-800">
                      <span>{activeCountry.shortName}</span>
                      <span className="text-slate-400 font-normal">·</span>
                      <span className="text-sky-700 font-extrabold">
                        {activeCountry.currency}
                      </span>
                      <FiChevronDown
                        className={`text-slate-400 text-xs transition-transform ${
                          isCountryOpen ? "rotate-180" : ""
                        }`}
                      />
                    </span>
                  </div>
                </button>

                {isCountryOpen && (
                  <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 text-left">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-extrabold text-slate-900">
                          Select Region &amp; Currency
                        </p>
                        <p className="text-[10.5px] text-slate-500">
                          Local pricing, availability &amp; regional delivery
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                        {publicCountries.length} Markets
                      </span>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {publicCountries.map((country) => {
                        const isSelected = country.code === activeCountry.code;
                        return (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => {
                              switchCountry(country.slug);
                              setIsCountryOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 flex items-center justify-between gap-3 text-left transition cursor-pointer ${
                              isSelected ? "bg-sky-50/80" : "hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <CountryFlag
                                code={country.code}
                                className="w-5 h-3.5"
                              />
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-slate-900 truncate block">
                                  {country.name}
                                </span>
                                <p className="text-[10.5px] text-slate-500 truncate">
                                  {country.city} · /{country.slug}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-md ${
                                  isSelected
                                    ? "bg-sky-700 text-white"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {country.currency}
                              </span>
                              {isSelected && (
                                <FiCheck className="text-sky-700 text-sm shrink-0" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-500">
                      <span>Global Logistics Network</span>
                      <Link
                        to="/portal"
                        onClick={() => setIsCountryOpen(false)}
                        className="font-bold text-sky-700 hover:underline"
                      >
                        Staff Portal →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {brand && (
                <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-200">
                  <Link
                    to={countryPath(`/brands/${brand.slug}`)}
                    className="flex items-center"
                  >
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="h-5 max-w-20 object-contain"
                    />
                  </Link>
                </div>
              )}
            </div>

            {/* MOBILE NATIVE PILL SEARCH BAR (< md) — 1-tap instant discovery */}
            <button
              type="button"
              onClick={() => {
                setActiveMenu(null);
                setIsSearchOpen(true);
              }}
              aria-label="Search products, brands, SKU"
              className="md:hidden flex-1 min-w-0 h-9 px-3 rounded-full bg-slate-100/95 hover:bg-slate-200/70 border border-slate-200/90 flex items-center gap-2 text-left transition cursor-pointer"
            >
              <FiSearch className="text-slate-400 text-sm shrink-0" />
              <span className="text-xs text-slate-400 font-medium truncate">
                Search iPhone, Galaxy, HMD...
              </span>
            </button>

            {/* TABLET & DESKTOP INLINE PREDICTIVE SEARCH BAR (md+) */}
            <div ref={searchBoxRef} className="hidden md:block flex-1 relative">
              <form onSubmit={handleSearchSubmit} className="relative">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setSearchFocused(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchFocused(true);
                  }}
                  placeholder="Search iPhone, Samsung Galaxy, HMD, Nokia, AirPods, SKU..."
                  className="w-full h-10 pl-10 pr-24 bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-slate-200/90 focus:border-sky-600 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="absolute right-18 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <FiX className="text-sm" />
                  </button>
                )}
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 px-3 rounded-lg bg-slate-900 hover:bg-sky-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  Search
                </button>
              </form>

              {/* PREDICTIVE SEARCH DROPDOWN */}
              {searchFocused && searchQuery.trim().length >= 2 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 text-left">
                  {predictiveMatches.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No matching products found for &quot;{searchQuery.trim()}&quot;.
                    </div>
                  ) : (
                    <>
                      <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                        {predictiveMatches.map((prod) => {
                          const price =
                            prod.livePrice !== undefined
                              ? Number(prod.livePrice)
                              : Number(prod.price) || 0;
                          const img =
                            getDefaultVariant(prod)?.image ||
                            prod.variants?.[0]?.image ||
                            prod.image ||
                            "/logo.png";

                          return (
                            <Link
                              key={prod.id || prod.slug}
                              to={countryPath(`/products/${prod.slug}`)}
                              onClick={() => {
                                setSearchFocused(false);
                                setSearchQuery("");
                              }}
                              className="flex items-center gap-3 p-3 hover:bg-sky-50/60 transition"
                            >
                              <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-center p-1 shrink-0">
                                <img
                                  src={img}
                                  alt={prod.name}
                                  className="max-h-9 max-w-9 object-contain"
                                  onError={(e) => {
                                    e.currentTarget.src = "/logo.png";
                                  }}
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-extrabold uppercase text-sky-700">
                                    {prod.brand}
                                  </span>
                                  <span
                                    className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded ${
                                      prod.availability === "In Stock"
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-slate-100 text-slate-500"
                                    }`}
                                  >
                                    {prod.availability || "On Request"}
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
                                  {prod.name}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                {price > 0 ? (
                                  <AedPrice
                                    amount={price}
                                    className="text-xs font-black text-slate-900 font-mono"
                                  />
                                ) : (
                                  <span className="text-[10px] font-semibold text-slate-400">
                                    Quote
                                  </span>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={handleSearchSubmit}
                        className="w-full py-2.5 px-4 bg-slate-50 hover:bg-sky-50 text-sky-700 text-xs font-bold flex items-center justify-center gap-1.5 border-t border-slate-100 cursor-pointer transition"
                      >
                        <span>
                          See all results for &quot;{searchQuery.trim()}&quot;
                        </span>
                        <FiArrowRight />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT: CLEAN ZERO-DUPLICATION COMMERCE ACTIONS */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Desktop-only B2B Wholesale Instant Quote Button */}
              <button
                type="button"
                onClick={() => {
                  setActiveMenu(null);
                  setIsRfqOpen(true);
                }}
                className="hidden xl:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                title="Request Wholesale / Bulk Quotation (10–5,000+ units)"
              >
                <FiBriefcase className="text-sm shrink-0" />
                <span>B2B Quote</span>
              </button>

              {/* Desktop-only Account / Profile (Lives in Bottom Nav on < xl) */}
              <button
                type="button"
                onClick={() => {
                  setActiveMenu(null);
                  const targetProfile = countryPath("/profile");
                  if (isLoggedIn) {
                    navigate(targetProfile);
                  } else {
                    openAuthModal("login", targetProfile);
                  }
                }}
                className="hidden xl:inline-flex relative items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                title={
                  isLoggedIn ? `Profile (${user?.fullName})` : "Sign In / Account"
                }
                aria-label="Account"
              >
                <div className="relative">
                  <FiUser className="text-xl" />
                  {isLoggedIn && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white" />
                  )}
                </div>
                <span className="text-xs font-semibold max-w-20 truncate">
                  {isLoggedIn ? firstName || "Account" : "Sign In"}
                </span>
              </button>

              {/* Wishlist — Clean Single Right Action on Mobile & Desktop */}
              <button
                type="button"
                onClick={() => {
                  setActiveMenu(null);
                  setIsWishlistOpen(true);
                }}
                className="relative w-9 h-9 rounded-full xl:rounded-xl bg-slate-100/80 xl:bg-transparent hover:bg-slate-100 text-slate-700 flex items-center justify-center transition cursor-pointer"
                title="Wishlist"
                aria-label="Wishlist"
              >
                <FiHeart className="text-[19px] xl:text-xl" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[9.5px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center ring-2 ring-white">
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Desktop-only Shopping Cart (Lives in Bottom Nav on < xl) */}
              <button
                type="button"
                onClick={() => {
                  setActiveMenu(null);
                  setIsCartOpen(true);
                }}
                className="hidden xl:inline-flex relative items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200/80 transition cursor-pointer"
                title="Shopping Cart"
                aria-label="Shopping Cart"
              >
                <div className="relative">
                  <MdOutlineShoppingCart className="text-xl text-sky-700" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-sky-700 text-white text-[10px] font-black min-w-4.5 h-4.5 px-1 rounded-full flex items-center justify-center shadow-2xs">
                      {cartCount}
                    </span>
                  )}
                </div>
                <div className="text-left leading-tight pl-0.5">
                  <span className="block text-[9.5px] font-bold uppercase text-sky-700">
                    Cart
                  </span>
                  <span className="block text-xs font-mono font-black text-slate-900">
                    {activeCountry.currencySymbol}{" "}
                    {Math.round(cartSubtotal).toLocaleString()}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* ROW 3: FULL-WIDTH CATEGORY & BRAND QUICK-SHOP BAR (Desktop xl+) */}
          <nav
            aria-label="Storefront category navigation"
            className="hidden xl:block bg-white border-t border-slate-100"
          >
            <div className="w-full px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-1 min-w-0">
                {/* All Categories MegaMenu Trigger */}
                <button
                  type="button"
                  onClick={() =>
                    setActiveMenu(activeMenu === "products" ? null : "products")
                  }
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                    activeMenu === "products"
                      ? "bg-sky-700 text-white"
                      : "bg-slate-100 hover:bg-slate-200/80 text-slate-900"
                  }`}
                >
                  <FiGrid className="text-xs" />
                  <span>All Categories</span>
                  <FiChevronDown
                    className={`text-xs transition-transform ${
                      activeMenu === "products" ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <span className="h-4 w-px bg-slate-200 mx-1.5" />

                <Link
                  to={countryPath("/products")}
                  onClick={() => setActiveMenu(null)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-sky-700 hover:bg-sky-50 transition whitespace-nowrap"
                >
                  <span>Best Sellers</span>
                </Link>

                <Link
                  to={countryPath("/products?sort=latest")}
                  onClick={() => setActiveMenu(null)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-orange-600 hover:bg-orange-50 transition whitespace-nowrap"
                >
                  <span>New Arrivals</span>
                </Link>

                {QUICK_NAV_LINKS.map((item) => {
                  const target = countryPath(item.to);
                  const isActive =
                    location.pathname === target ||
                    `${location.pathname}${location.search}` === target;
                  return (
                    <Link
                      key={item.label}
                      to={target}
                      onClick={() => setActiveMenu(null)}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition whitespace-nowrap ${
                        isActive
                          ? "text-sky-700 bg-sky-50"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 shrink-0 text-slate-500 font-semibold">
                <Link
                  to={countryPath("/about")}
                  onClick={() => setActiveMenu(null)}
                  className="hover:text-slate-900 transition"
                >
                  About
                </Link>
                <Link
                  to={countryPath("/services")}
                  onClick={() => setActiveMenu(null)}
                  className="hover:text-slate-900 transition"
                >
                  Services
                </Link>
                <Link
                  to={countryPath("/contact")}
                  onClick={() => setActiveMenu(null)}
                  className="hover:text-slate-900 transition"
                >
                  Contact
                </Link>
              </div>
            </div>
          </nav>

          {/* MEGA MENU (Desktop xl+) */}
          {activeMenu === "products" && (
            <ProductMegaMenu onClose={() => setActiveMenu(null)} />
          )}
        </header>

        {/* Backdrop for Mega Menu */}
        {activeMenu === "products" && (
          <div
            className="fixed inset-0 bg-black/25 z-40 backdrop-blur-xs"
            onClick={() => setActiveMenu(null)}
          />
        )}
      </div>

      <SearchDrawer
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      <QuickRfqModal
        isOpen={isRfqOpen}
        onClose={() => setIsRfqOpen(false)}
      />
    </>
  );
};

export default Header;
