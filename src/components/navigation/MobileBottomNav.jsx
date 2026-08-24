import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { FiHome, FiBox, FiTag, FiShield, FiPhoneCall } from "react-icons/fi";

const NAV_ITEMS = [
  {
    id: "home",
    label: "Home",
    to: "/",
    icon: FiHome,
    exact: true,
  },
  {
    id: "products",
    label: "Products",
    to: "/products",
    icon: FiBox,
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
    id: "verify",
    label: "Verify",
    to: "/verify",
    icon: FiShield,
    badge: "IMEI",
    exact: false,
  },
  {
    id: "contact",
    label: "Contact",
    to: "/contact",
    icon: FiPhoneCall,
    exact: true,
  },
];

const MobileBottomNav = () => {
  const location = useLocation();

  const isItemActive = (item) => {
    if (item.exact) {
      return location.pathname === item.to;
    }
    return location.pathname.startsWith(item.to);
  };

  return (
    <aside
      aria-label="Mobile Navigation Bar"
      className="
        fixed bottom-0 left-0 right-0 z-40
        xl:hidden
        bg-white/95 backdrop-blur-lg
        border-t border-slate-200/90
        shadow-[0_-4px_20px_rgba(0,0,0,0.06)]
        pb-[env(safe-area-inset-bottom,0px)]
      "
    >
      <nav className="flex items-center justify-around px-2 py-1.5 sm:py-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item);

          return (
            <Link
              key={item.id}
              to={item.to}
              className="
                relative flex flex-col items-center justify-center
                flex-1 py-1 px-1 rounded-xl
                transition-all duration-200 select-none
                group focus:outline-none
              "
              aria-current={active ? "page" : undefined}
            >
              {/* Active Tab Background Glow / Pill Indicator */}
              {active && (
                <motion.div
                  layoutId="mobileNavActivePill"
                  className="absolute inset-0 bg-sky-50 rounded-xl"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              {/* Icon Container with Badge */}
              <div className="relative z-10 flex items-center justify-center">
                <Icon
                  className={`
                    text-xl sm:text-2xl transition-all duration-200
                    ${active
                      ? "text-sky-700 scale-110"
                      : "text-slate-500 group-hover:text-slate-800"
                    }
                  `}
                />

                {/* Optional Badge (e.g., IMEI for Verify) */}
                {item.badge && !active && (
                  <span
                    className="
                      absolute -top-1 -right-3
                      bg-emerald-600 text-white
                      text-[9px] font-bold tracking-tight
                      px-1 py-0.2 rounded-full shadow-xs
                    "
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`
                  relative z-10 mt-1 text-[11px] sm:text-xs font-medium tracking-tight
                  transition-colors duration-200
                  ${active
                    ? "font-bold text-sky-800"
                    : "text-slate-500 group-hover:text-slate-700"
                  }
                `}
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
