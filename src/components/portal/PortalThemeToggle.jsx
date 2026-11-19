import { FiSun, FiMoon } from "react-icons/fi";
import { usePortalTheme } from "../../context/PortalThemeContext";

/**
 * PortalThemeToggle
 * Default: single-button icon toggle where the Sun icon (Light mode)
 * smoothly transitions into the Moon icon (Dark mode).
 */
const PortalThemeToggle = ({ className = "" }) => {
  const { isDark, toggleTheme } = usePortalTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      title={isDark ? "Dark mode — click for Light" : "Light mode — click for Dark"}
      className={`relative inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer overflow-hidden ${className}`}
    >
      <span className="relative w-[17px] h-[17px] flex items-center justify-center">
        <FiSun
          aria-hidden="true"
          className={`absolute text-[17px] text-amber-500 transition-all duration-200 ${
            isDark
              ? "opacity-0 -rotate-90 scale-50"
              : "opacity-100 rotate-0 scale-100"
          }`}
        />
        <FiMoon
          aria-hidden="true"
          className={`absolute text-[17px] text-sky-400 transition-all duration-200 ${
            isDark
              ? "opacity-100 rotate-0 scale-100"
              : "opacity-0 rotate-90 scale-50"
          }`}
        />
      </span>
    </button>
  );
};

export default PortalThemeToggle;
