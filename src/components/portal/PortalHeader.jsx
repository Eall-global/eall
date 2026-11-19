import {
  FiMenu,
  FiRefreshCw,
  FiLogOut,
  FiCheckCircle,
  FiInfo,
} from "react-icons/fi";
import PortalThemeToggle from "./PortalThemeToggle";

const PortalHeader = ({
  activeItem,
  onOpenMobileMenu,
  mobileMenuOpen,
  isConnected,
  loading,
  onRefresh,
  onLogout,
}) => {
  const ActiveIcon = activeItem?.icon;

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-5 lg:px-6 flex items-center justify-between gap-3 transition-colors">
      {/* Left: Mobile Burger Button + Contextual Section Heading */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Burger Trigger (Hidden on Desktop >= lg) */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          aria-expanded={mobileMenuOpen}
          className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer shrink-0"
        >
          <FiMenu className="text-xl" />
        </button>

        {/* Active Module Icon Badge (Desktop) + Title & Subtitle */}
        <div className="flex items-center gap-3 min-w-0">
          {ActiveIcon && (
            <div className="hidden sm:flex w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-500/15 border border-sky-200/60 dark:border-sky-500/25 text-sky-700 dark:text-sky-300 items-center justify-center shrink-0">
              <ActiveIcon className="text-base" />
            </div>
          )}

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white truncate">
              {activeItem?.label || "Business Portal"}
            </h1>
            {activeItem?.description && (
              <p className="hidden md:block text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {activeItem.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right: Connection Pill, Refresh, Theme Switcher, Lock PIN */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Cloud Sync Indicator */}
        {isConnected ? (
          <span
            title="Real-time Firebase Firestore connected"
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-500/25 text-[11px] font-semibold"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <FiCheckCircle className="text-xs hidden xl:inline" />
            <span>Firestore Live</span>
          </span>
        ) : (
          <span
            title="Running with local browser storage fallback"
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-500/25 text-[11px] font-semibold"
          >
            <FiInfo className="text-xs" />
            <span>Local Mode</span>
          </span>
        )}

        {/* Refresh Data Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh live data"
          title="Refresh Live Data"
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-sky-700 dark:hover:text-sky-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <FiRefreshCw className={`text-[15px] ${loading ? "animate-spin" : ""}`} />
        </button>

        {/* Theme Switcher: Clean Sun <-> Moon Icon Toggle */}
        <PortalThemeToggle />

        {/* Subtle Divider */}
        <div
          aria-hidden="true"
          className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-800 mx-0.5"
        />

        {/* Lock PIN / Logout */}
        <button
          type="button"
          onClick={onLogout}
          title="Lock Portal PIN"
          aria-label="Lock portal PIN"
          className="inline-flex items-center gap-1.5 h-9 px-2.5 sm:px-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-500/15 hover:text-rose-700 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
        >
          <FiLogOut className="text-sm shrink-0" />
          <span className="hidden sm:inline">Lock PIN</span>
        </button>
      </div>
    </header>
  );
};

export default PortalHeader;

