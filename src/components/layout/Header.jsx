import { useEffect, useRef, useState } from "react";
import { FiMenu } from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router-dom";

import useScrollPosition from "../../hooks/useScrollPosition";
import Navigation from "../navigation/Navigation";
import MobileMenu from "../navigation/MobileMenu";
import SearchButton from "../buttons/SearchButton";
import QuoteButton from "../buttons/QuoteButton";
import SearchDrawer from "../search/SearchDrawer";
import ProductMegaMenu from "../navigation/megaMenu/ProductMegaMenu";

const Header = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const headerRef = useRef(null);
  const isScrolled = useScrollPosition(80);
  const headerSolid = isScrolled || activeMenu === "products";
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
    const mediaQuery = window.matchMedia("(min-width:768px)");

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

  return (
    <>
      <div ref={headerRef}>
        {/* HEADER */}
        <header
          className={`
          fixed top-0 left-0 w-full z-50
          transition-all duration-300
         ${headerSolid ? "bg-white shadow-md py-3" : "bg-transparent py-4"}
        `}
        >
          <div className="mx-auto w-full flex items-center justify-between px-6 xl:px-10">
            {/* LEFT: LOGO */}
            <div className="flex flex-col leading-tight">
              <div className="flex items-center">
                <Link
                  to="/"
                  onClick={() => setActiveMenu(null)}
                  className="flex items-center"
                >
                  <img
                    src="/logo.png"
                    alt="E-ALL Logo"
                    className="h-12 md:h-16 lg:h-20 w-auto object-contain"
                  />
                </Link>
              </div>
            </div>

            {/* CENTER: DESKTOP NAV */}
            <Navigation activeMenu={activeMenu} setActiveMenu={setActiveMenu} />

            {/* RIGHT: ACTIONS */}
            <div className="flex items-center gap-3">
              {/* Quote Button */}
              <div className="hidden md:block">
                <QuoteButton
                  onClick={() => {
                    setActiveMenu(null);
                    navigate("/contact");
                  }}
                />
              </div>

              {/* Search Button */}
              <div className="hidden md:block">
                <SearchButton
                  onClick={() => {
                    setActiveMenu(null);
                    setIsSearchOpen(true);
                  }}
                />
              </div>

              {/* Mobile Menu Toggle */}
              <button
                className="md:hidden text-2xl text-slate-700 cursor-pointer"
                onClick={() => setIsMobileOpen(true)}
              >
                <FiMenu />
              </button>
            </div>
          </div>
        </header>
        {activeMenu === "products" && (
          <ProductMegaMenu
            onClose={() => {
              setActiveMenu(null);
            }}
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
        onSearch={(query) => navigate(`/search?q=${query}`)}
      />
    </>
  );
};

export default Header;
