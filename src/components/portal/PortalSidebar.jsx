import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiArrowLeft,
  FiLogOut,
  FiShield,
  FiUserCheck,
  FiCheckCircle,
  FiInfo,
} from "react-icons/fi";

const getInitials = (name = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "EA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const PortalSidebar = ({
  navGroups = [],
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  currentUser,
  role,
  isAdmin,
  isConnected,
  onLogout,
}) => {
  // Floating tooltip for collapsed desktop rail (prevents clipping by overflow containers)
  const [tooltip, setTooltip] = useState(null); // { label, badge, top, left }

  // Close mobile drawer on Escape key
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onCloseMobile();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  // Lock body scroll while mobile drawer is open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  // Auto-close mobile drawer when viewport widens to desktop (lg: 1024px)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handleChange = (e) => {
      if (e.matches && mobileOpen) {
        onCloseMobile();
      }
    };
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, [mobileOpen, onCloseMobile]);

  const showTooltip = (e, label, badge) => {
    if (!isCollapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      label,
      badge,
      top: rect.top + rect.height / 2,
      left: rect.right + 12,
    });
  };

  const hideTooltip = () => setTooltip(null);

  const handleToggleCollapse = () => {
    setTooltip(null);
    onToggleCollapse();
  };

  const initials = getInitials(currentUser?.name);
  const roleLabel = role === "admin" ? "Master Admin" : "Sales Executive";

  return (
    <>
      {/* ===================================================================== */}
      {/* 1. DESKTOP COLLAPSIBLE SIDEBAR (Web View: >= 1024px)                  */}
      {/* ===================================================================== */}
      <aside
        aria-label="Portal sidebar navigation"
        className={`hidden lg:flex flex-col sticky top-0 h-screen shrink-0 z-30 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-[width] duration-200 ease-in-out select-none ${
          isCollapsed ? "w-[78px]" : "w-[264px]"
        }`}
      >
        {/* Tactile Edge Collapse / Expand Toggle */}
        <button
          type="button"
          onClick={handleToggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
          className="absolute -right-3.5 top-5 z-40 w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:text-sky-700 dark:hover:text-sky-300 hover:border-sky-300 dark:hover:border-sky-500/50 shadow-sm flex items-center justify-center transition-all cursor-pointer"
        >
          {isCollapsed ? (
            <FiChevronRight className="text-sm" />
          ) : (
            <FiChevronLeft className="text-sm" />
          )}
        </button>

        {/* Brand Header */}
        <div
          className={`h-16 shrink-0 border-b border-slate-200/70 dark:border-slate-800 flex items-center ${
            isCollapsed ? "justify-center px-3" : "px-5 gap-3"
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 flex items-center justify-center p-1.5 shrink-0">
            <img
              src="/logo.png"
              alt="E-ALL Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>

          {!isCollapsed && (
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-black tracking-tight text-slate-900 dark:text-white truncate">
                  E-ALL
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-500/25 shrink-0">
                  Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5">
                Business &amp; POS Suite
              </p>
            </div>
          )}
        </div>

        {/* Navigation Groups */}
        <nav
          className={`flex-1 overflow-y-auto overflow-x-hidden no-scrollbar ${
            isCollapsed ? "py-3.5 px-3 space-y-3.5" : "py-2.5 px-2.5 space-y-3"
          }`}
        >
          {navGroups.map((group, groupIdx) => (
            <div
              key={group.title}
              className={isCollapsed ? "space-y-1.5" : "space-y-0.5"}
            >
              {!isCollapsed ? (
                <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                  {group.title}
                </p>
              ) : (
                groupIdx > 0 && (
                  <div className="w-7 mx-auto my-2.5 border-t border-slate-200 dark:border-slate-800" />
                )
              )}

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const hasBadge = typeof item.badge === "number";

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectTab(item.id)}
                    onMouseEnter={(e) => showTooltip(e, item.label, item.badge)}
                    onMouseLeave={hideTooltip}
                    onFocus={(e) => showTooltip(e, item.label, item.badge)}
                    onBlur={hideTooltip}
                    aria-current={isActive ? "page" : undefined}
                    className={`relative w-full flex items-center rounded-xl transition-all duration-150 cursor-pointer group ${
                      isCollapsed
                        ? "justify-center h-11 px-0"
                        : "justify-between px-3 py-2 gap-2.5"
                    } ${
                      isActive
                        ? "bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 font-semibold border border-sky-200/70 dark:border-sky-500/25 shadow-2xs"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100 font-medium border border-transparent"
                    }`}
                  >
                    {/* Active Left Indicator Bar */}
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-sky-600 dark:bg-sky-400"
                      />
                    )}

                    <span
                      className={`flex items-center min-w-0 ${
                        isCollapsed ? "justify-center" : "gap-3 flex-1"
                      }`}
                    >
                      <Icon
                        className={`text-[18px] shrink-0 transition-colors ${
                          isActive
                            ? "text-sky-600 dark:text-sky-400"
                            : "text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                        }`}
                      />
                      {!isCollapsed && (
                        <span className="text-[13px] truncate">{item.label}</span>
                      )}
                    </span>

                    {/* Expanded Count Pill */}
                    {!isCollapsed && hasBadge && (
                      <span
                        className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                          isActive
                            ? "bg-sky-100 dark:bg-sky-500/25 text-sky-800 dark:text-sky-200"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* Collapsed Subtle Alert / Activity Dot */}
                    {isCollapsed && item.alertCount > 0 && (
                      <span
                        aria-hidden="true"
                        className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer: Storefront Link + User Profile */}
        <div className="shrink-0 border-t border-slate-200/80 dark:border-slate-800 p-3 space-y-2">
          {/* Return to Public Storefront */}
          <Link
            to="/"
            onMouseEnter={(e) => showTooltip(e, "Return to Public Storefront")}
            onMouseLeave={hideTooltip}
            className={`flex items-center rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors ${
              isCollapsed ? "justify-center h-10 px-0" : "gap-2.5 px-3 py-2 text-xs font-semibold"
            }`}
          >
            <FiArrowLeft className="text-base shrink-0" />
            {!isCollapsed && <span className="truncate">Public Storefront</span>}
          </Link>

          {/* Staff Profile Card */}
          <div
            onMouseEnter={(e) =>
              showTooltip(e, `${currentUser?.name || "Staff"} • ${roleLabel}`)
            }
            onMouseLeave={hideTooltip}
            className={`flex items-center rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 ${
              isCollapsed ? "justify-center p-1.5" : "gap-2.5 p-2.5"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                isAdmin
                  ? "bg-sky-600 text-white"
                  : "bg-emerald-600 text-white"
              }`}
            >
              {initials}
            </div>

            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {currentUser?.name || "Staff Member"}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  {isAdmin ? (
                    <FiShield className="text-sky-600 dark:text-sky-400 shrink-0" />
                  ) : (
                    <FiUserCheck className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                  <span className="truncate">{roleLabel}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Fixed-Position Floating Tooltip for Collapsed Desktop Sidebar */}
      {isCollapsed && tooltip && (
        <div
          role="tooltip"
          style={{ top: `${tooltip.top}px`, left: `${tooltip.left}px` }}
          className="hidden lg:flex fixed -translate-y-1/2 z-50 pointer-events-none items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold shadow-lg border border-slate-700/80 whitespace-nowrap"
        >
          <span>{tooltip.label}</span>
          {typeof tooltip.badge === "number" && (
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/15 text-sky-200">
              {tooltip.badge}
            </span>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. MOBILE BURGER MENU DRAWER (Mobile / Tablet View: < 1024px)         */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {mobileOpen && (
          <div
            className="fixed inset-0 z-50 lg:hidden flex"
            role="dialog"
            aria-modal="true"
            aria-label="Portal navigation menu"
          >
            {/* Dimmed Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-slate-950/55 backdrop-blur-[2px]"
            />

            {/* Slide-Over Drawer Panel */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 34 }}
              className="relative z-10 w-[292px] max-w-[85vw] h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col text-left"
            >
              {/* Drawer Header */}
              <div className="h-16 px-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 flex items-center justify-center p-1.5 shrink-0">
                    <img
                      src="/logo.png"
                      alt="E-ALL Logo"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
                        E-ALL
                      </span>
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-500/25">
                        Portal
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {isConnected ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <FiCheckCircle className="text-[11px]" /> Firestore Live
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                          <FiInfo className="text-[11px]" /> Local Mode
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onCloseMobile}
                  aria-label="Close navigation menu"
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              {/* Staff Identity Card */}
              <div className="px-4 pt-4 pb-2 shrink-0">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                      isAdmin ? "bg-sky-600 text-white" : "bg-emerald-600 text-white"
                    }`}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {currentUser?.name || "Staff Member"}
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      {isAdmin ? (
                        <FiShield className="text-sky-600 dark:text-sky-400 shrink-0" />
                      ) : (
                        <FiUserCheck className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                      <span>{roleLabel}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Scrollable Navigation Links */}
              <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-2.5 space-y-4">
                {navGroups.map((group) => (
                  <div key={group.title} className="space-y-1">
                    <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                      {group.title}
                    </p>

                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      const hasBadge = typeof item.badge === "number";

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            onSelectTab(item.id);
                            onCloseMobile();
                          }}
                          aria-current={isActive ? "page" : undefined}
                          className={`relative w-full min-h-[44px] flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                            isActive
                              ? "bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 font-semibold border border-sky-200/70 dark:border-sky-500/25 shadow-2xs"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 font-medium border border-transparent"
                          }`}
                        >
                          {isActive && (
                            <span
                              aria-hidden="true"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-sky-600 dark:bg-sky-400"
                            />
                          )}

                          <span className="flex items-center gap-3 min-w-0">
                            <Icon
                              className={`text-lg shrink-0 ${
                                isActive
                                  ? "text-sky-600 dark:text-sky-400"
                                  : "text-slate-400 dark:text-slate-500"
                              }`}
                            />
                            <span className="text-sm truncate">{item.label}</span>
                          </span>

                          {hasBadge && (
                            <span
                              className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                                isActive
                                  ? "bg-sky-100 dark:bg-sky-500/25 text-sky-800 dark:text-sky-200"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </nav>

              {/* Drawer Footer: Storefront + Lock PIN */}
              <div className="shrink-0 border-t border-slate-200/80 dark:border-slate-800 p-3.5 bg-slate-50/70 dark:bg-slate-950/40">
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/"
                    onClick={onCloseMobile}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold transition"
                  >
                    <FiArrowLeft className="text-sm shrink-0" />
                    <span>Website</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      onCloseMobile();
                      onLogout();
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200/80 dark:border-rose-500/25 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-xs font-semibold transition cursor-pointer"
                  >
                    <FiLogOut className="text-sm shrink-0" />
                    <span>Lock PIN</span>
                  </button>
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PortalSidebar;
