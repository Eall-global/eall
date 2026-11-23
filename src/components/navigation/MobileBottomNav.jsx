import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { FiHome, FiGrid, FiTag, FiShoppingCart, FiUser } from "react-icons/fi";
import { useCart } from "../../context/CartContext";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import { useCountry } from "../../context/CountryContext";

const NAV_ITEMS = [
  {
    id: "home",
    label: "Home",
    to: "/",
    icon: FiHome,
    exact: true,
  },
  {
    id: "shop",
    label: "Shop",
    to: "/products",
    icon: FiGrid,
    exact: false,
  },
  {
    id: "brands",
    label: "Brands",
    to: "/brands",
    icon: FiTag,
    exact: false,
  },
  {
    id: "cart",
    label: "Cart",
    to: "/cart",
    icon: FiShoppingCart,
    isCart: true,
    exact: false,
  },
  {
    id: "account",
    label: "Account",
    to: "/profile",
    icon: FiUser,
    isProfile: true,
    exact: false,
  },
];

const MobileBottomNav = () => {
  const location = useLocation();
  const { cartCount } = useCart();
  const { isLoggedIn, user } = useCustomerAuth();
  const { countryPath } = useCountry();

  const isItemActive = (item) => {
    const target = countryPath(item.to);
    if (item.exact) {
      return location.pathname === target || location.pathname === `${target}/`;
    }
    return location.pathname.startsWith(target);
  };

  return (
    <aside
      aria-label="Mobile Navigation Bar"
      className="fixed bottom-0 left-0 right-0 z-40 xl:hidden bg-white/95 backdrop-blur-lg border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(15,23,42,0.05)] pb-[env(safe-area-inset-bottom,0px)]"
    >
      <nav className="grid grid-cols-5 h-14 px-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item);

          return (
            <Link
              key={item.id}
              to={countryPath(item.to)}
              className="relative flex flex-col items-center justify-center gap-0.5 select-none group focus:outline-none"
              aria-current={active ? "page" : undefined}
            >
              {/* Sleek Native Top Active Indicator Bar */}
              {active && (
                <motion.span
                  layoutId="mobileNavActiveBar"
                  className="absolute top-0 w-7 h-[2.5px] rounded-full bg-sky-700"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}

              {/* Icon Container with Compact Badge */}
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`text-[20px] transition-colors duration-150 ${
                    active
                      ? "text-sky-700 stroke-[2.3]"
                      : "text-slate-400 group-hover:text-slate-700"
                  }`}
                />

                {/* Cart Badge */}
                {item.isCart && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-sky-700 text-white text-[9.5px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center ring-2 ring-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}

                {/* Signed-In Status Dot */}
                {item.isProfile && isLoggedIn && (
                  <span
                    className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"
                    title={`Signed in as ${user?.fullName}`}
                  />
                )}
              </div>

              {/* Tight Native Tab Label */}
              <span
                className={`text-[10.5px] leading-none tracking-tight transition-colors duration-150 ${
                  active
                    ? "font-bold text-sky-700"
                    : "font-medium text-slate-500 group-hover:text-slate-700"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default MobileBottomNav;
