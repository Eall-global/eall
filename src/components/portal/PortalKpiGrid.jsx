/**
 * PortalKpiGrid
 * Standardized executive KPI layout across all portal modules:
 * - Mobile (< sm): Compact unified 2x2 summary panel with crisp hairline cross-dividers,
 *   inline small icon + single-line label on top and full-width value below (saves ~95px
 *   vertical space and prevents label wrapping or currency collision).
 * - Desktop (>= sm): Spacious individual metric cards filling the full workspace width.
 */

const TONE_STYLES = {
  sky: {
    iconBg: "bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400",
    value: "text-slate-900 dark:text-white",
  },
  emerald: {
    iconBg:
      "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    value: "text-emerald-700 dark:text-emerald-400",
  },
  amber: {
    iconBg:
      "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400",
    value: "text-amber-600 dark:text-amber-400",
  },
  indigo: {
    iconBg:
      "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400",
    value: "text-indigo-900 dark:text-indigo-300",
  },
  purple: {
    iconBg:
      "bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400",
    value: "text-purple-900 dark:text-purple-300",
  },
  slate: {
    iconBg: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
    value: "text-slate-900 dark:text-white",
  },
};

const PortalKpiGrid = ({ items = [] }) => {
  return (
    <div
      className="
        grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4
        bg-white dark:bg-slate-900 sm:bg-transparent sm:dark:bg-transparent
        rounded-2xl sm:rounded-none
        border border-slate-200/80 dark:border-slate-800 sm:border-0
        shadow-2xs sm:shadow-none
        overflow-hidden sm:overflow-visible
        sm:gap-3.5
        transition-colors
      "
    >
      {items.map((item, idx) => {
        const Icon = item.icon;
        const tone = TONE_STYLES[item.tone] || TONE_STYLES.slate;
        const valueClass = item.valueClassName || tone.value;

        // Hairline cross-dividers for unified mobile 2x2 panel
        const mobileDividerClasses = [
          idx % 2 === 0 ? "border-r border-slate-100 dark:border-slate-800 sm:border-r-0" : "",
          idx < 2 ? "border-b border-slate-100 dark:border-slate-800 sm:border-b-0" : "",
        ].join(" ");

        return (
          <div
            key={item.id || item.label}
            className={`
              px-3.5 py-3 sm:p-4
              sm:bg-white sm:dark:bg-slate-900
              sm:rounded-2xl
              sm:border sm:border-slate-200/80 sm:dark:border-slate-800
              sm:shadow-2xs
              flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3
              min-w-0 transition-colors
              ${mobileDividerClasses}
            `}
          >
            {/* Mobile Compact Top Row (Icon + Label) / Desktop Left Column (Label + Value + Subtitle) */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {Icon && (
                  <span
                    className={`sm:hidden inline-flex items-center justify-center w-5 h-5 rounded-md shrink-0 ${tone.iconBg}`}
                  >
                    <Icon className="text-[11px]" />
                  </span>
                )}
                <p className="text-[10px] sm:text-xs font-bold sm:font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                  {item.label}
                </p>
              </div>

              <div
                className={`mt-1 text-base sm:text-xl lg:text-2xl font-black font-mono leading-tight truncate ${valueClass}`}
              >
                {item.value}
              </div>

              {item.subtitle && (
                <p className="hidden sm:block text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate">
                  {item.subtitle}
                </p>
              )}
            </div>

            {/* Desktop Right Icon Pill */}
            {Icon && (
              <div
                className={`hidden sm:flex p-2.5 rounded-xl shrink-0 ${tone.iconBg}`}
              >
                <Icon className="text-xl" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PortalKpiGrid;

