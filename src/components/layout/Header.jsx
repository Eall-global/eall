import { useEffect, useRef, useState } from "react";
import { FiMenu, FiHeart, FiUser } from "react-icons/fi";
import { MdOutlineShoppingCart } from "react-icons/md";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { useCustomerAuth } from "../../context/CustomerAuthContext";

import useScrollPosition from "../../hooks/useScrollPosition";
import Navigation from "../navigation/Navigation";
import MobileMenu from "../navigation/MobileMenu";
import SearchButton from "../buttons/SearchButton";
import QuoteButton from "../buttons/QuoteButton";
import SearchDrawer from "../search/SearchDrawer";
import ProductMegaMenu from "../navigation/megaMenu/ProductMegaMenu";
import { brands } from "../../data/brandsData";

const Header = () => {
  const { wishlistCount, setIsWishlistOpen } = useWishlist();
  const { cartCount, setIsCartOpen } = useCart();
  const { isLoggedIn, openAuthModal, user } = useCustomerAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const headerRef = useRef(null);
  const isScrolled = useScrollPosition(80);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        activeMenu &&
        headerRef.current &&
        !headerRef.current.contains(e.target)
      ) {
        setActiveMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeMenu]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width:1280px)");

    const handleResize = () => {
      setActiveMenu(null);
      setIsMobileOpen(false);
      setIsSearchOpen(false);
    };

    handleResize();

    mediaQuery.addEventListener("change", handleResize);

    return () => mediaQuery.removeEventListener("change", handleResize);
  }, []);

  useEffect(() => {
    setActiveMenu(null);
    setIsMobileOpen(false);
  }, [location.pathname]);

  const brand = brands.find((b) => location.pathname === `/brands/${b.slug}`);

  // Pages with a dark hero banner behind the transparent header at the top
  const isDarkHeroPage =
    location.pathname === "/" ||
    location.pathname.startsWith("/brands/") ||
    location.pathname === "/about" ||
    location.pathname === "/services" ||
    location.pathname === "/solutions";

  const isTransparent =
    !isScrolled && activeMenu !== "products" && isDarkHeroPage;
  const headerSolid = !isTransparent;

  return (
    <>
      <div ref={headerRef}>
        {/* HEADER */}
        <header
          className={`
          fixed top-0 left-0 w-full z-50
          transition-all duration-300
         ${headerSolid
              ? "bg-white/95 backdrop-blur-md shadow-md py-2.5 sm:py-3"
              : "bg-linear-to-b from-black/50 via-black/20 to-transparent py-3 sm:py-4"
            }
        `}
        >
          <div className="mx-auto w-full flex items-center justify-between px-4 sm:px-6 md:px-8 lg:px-10">
            {/* LEFT: LOGO / CO-BRANDING */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/"
                onClick={() => setActiveMenu(null)}
                className="flex items-center shrink-0"
              >
                <img
                  src="/logo.png"
                  alt="E-ALL Logo"
                  className="h-8 sm:h-10 lg:h-11 w-auto object-contain transition-all duration-300"
                />
              </Link>

              {brand && (
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <span
                    className={`font-semibold text-xs sm:text-sm select-none transition-colors duration-300 ${isTransparent ? "text-white/60" : "text-slate-400"
                      }`}
                  >
                    ✕
                  </span>

                  <Link
                    to={`/brands/${brand.slug}`}
                    className={`flex items-center transition-all duration-300 ${isTransparent
                      ? "bg-white/90 px-2 py-0.5 rounded-md shadow-xs backdrop-blur-xs"
                      : ""
                      }`}
                  >
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="h-5 sm:h-6 lg:h-7 max-w-18 sm:max-w-24 lg:max-w-28 object-contain"
                    />
                  </Link>
                </div>
              )}
            </div>

            {/* CENTER: DESKTOP NAV */}
            <div className="hidden xl:flex">
              <Navigation
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                isTransparent={isTransparent}
              />
            </div>

            {/* RIGHT: ACTIONS */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {/* Quote Button */}
              <div className="hidden xl:block">
                <QuoteButton
                  onClick={() => {
                    setActiveMenu(null);
                    navigate("/contact");
                  }}
                />
              </div>

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={() => {
                  setActiveMenu(null);
                  setIsWishlistOpen(true);
                }}
                className={`relative p-2 rounded-xl transition-colors duration-300 cursor-pointer ${isTransparent
                  ? "text-white hover:bg-white/10"
                  : "text-slate-700 hover:bg-slate-100"
                  }`}
                title="View Saved Products / Wishlist"
                aria-label="Wishlist"
              >
                <FiHeart className="text-xl sm:text-2xl" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs">
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Shopping Cart Button */}
              <button
                type="button"
                onClick={() => {
                  setActiveMenu(null);
                  setIsCartOpen(true);
                }}
                className={`relative p-2 rounded-xl transition-colors duration-300 cursor-pointer ${isTransparent
                  ? "text-white hover:bg-white/10"
                  : "text-slate-700 hover:bg-slate-100"
                  }`}
                title="View Shopping Cart"
                aria-label="Shopping Cart"
              >
                <MdOutlineShoppingCart className="text-xl sm:text-2xl" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-sky-600 text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Customer Profile Button */}
              <button
                type="button"
                onClick={() => {
                  setActiveMenu(null);
                  if (isLoggedIn) {
                    navigate("/profile");
                  } else {
                    openAuthModal("login", "/profile");
                  }
                }}
                className={`relative p-2 rounded-xl transition-colors duration-300 cursor-pointer ${isTransparent
                  ? "text-white hover:bg-white/10"
                  : "text-slate-700 hover:bg-slate-100"
                  }`}
                title={isLoggedIn ? `Profile (${user?.fullName})` : "Sign In / Profile"}
                aria-label="User Profile"
              >
                <FiUser className="text-xl sm:text-2xl" />
                {isLoggedIn && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
                )}
              </button>

              {/* Search Button */}
              <div className="hidden xl:block">
                <SearchButton
                  isTransparent={isTransparent}
                  onClick={() => {
                    setActiveMenu(null);
                    setIsSearchOpen(true);
                  }}
                />
              </div>

              {/* Mobile Menu Toggle */}
              <button
                className={`xl:hidden text-2xl p-1.5 rounded-lg cursor-pointer transition-colors duration-300 ${isTransparent
                  ? "text-white hover:bg-white/10"
                  : "text-slate-900 hover:bg-slate-100"
                  }`}
                onClick={() => setIsMobileOpen(true)}
                aria-label="Toggle mobile menu"
              >
                <FiMenu />
              </button>
            </div>
          </div>

          {/* MEGA MENU (Seamlessly attached to header bottom) */}
          {activeMenu === "products" && (
            <ProductMegaMenu
              onClose={() => {
                setActiveMenu(null);
              }}
            />
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

      {/* MOBILE MENU */}
      <MobileMenu
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        onSearch={(query) =>
          navigate(`/products?search=${encodeURIComponent(query)}`)
        }
      />
    </>
  );
};

export default Header;
