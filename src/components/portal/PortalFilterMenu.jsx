import { useState, useRef, useEffect, useCallback } from "react";
import { FiFilter, FiCheck, FiX, FiRotateCcw } from "react-icons/fi";

/**
 * PortalFilterMenu
 * Single general filter icon trigger that opens a clean two-column master-detail panel:
 * - Left column: Filter categories (e.g., Brand, Category, Status)
 * - Right column: Selectable options with live counts
 */
export const PortalFilterMenu = ({
  sections = [],
  onResetAll,
  resultCount,
  resultLabel = "items",
}) => {
  const [open, setOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id || "");
  const [desktopPos, setDesktopPos] = useState(null); // { top, left } | null (mobile sheet)
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const activeCount = sections.filter(
    (sec) => sec.value !== (sec.defaultValue ?? "All")
  ).length;

  const currentSection =
    sections.find((s) => s.id === activeSectionId) || sections[0];

  const computePosition = useCallback(() => {
    if (window.innerWidth < 640 || !triggerRef.current) {
      setDesktopPos(null);
      return;
    }
    const PANEL_WIDTH = 440;
    const MARGIN = 16;
    const rect = triggerRef.current.getBoundingClientRect();
    const preferredLeft = rect.right - PANEL_WIDTH;
    const maxLeft = Math.max(MARGIN, window.innerWidth - PANEL_WIDTH - MARGIN);
    const left = Math.max(MARGIN, Math.min(preferredLeft, maxLeft));
    const top = Math.min(rect.bottom + 8, Math.max(MARGIN, window.innerHeight - 380));
    setDesktopPos({ top, left });
  }, []);

  const handleToggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) computePosition();
      return next;
    });
  };

  // Close on click outside, Escape, or reposition on resize/scroll
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", computePosition);
    window.addEventListener("scroll", computePosition, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", computePosition);
      window.removeEventListener("scroll", computePosition, true);
    };
  }, [open, computePosition]);

  if (sections.length === 0) return null;

  return (
    <div className="relative shrink-0">
      {/* Filter Icon Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        aria-label={
          activeCount > 0 ? `Filters (${activeCount} active)` : "Open filters"
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        title={
          activeCount > 0 ? `Filters (${activeCount} active)` : "Filter items"
        }
        className={`relative inline-flex items-center justify-center w-10 h-10 rounded-xl border transition-colors cursor-pointer ${
          open || activeCount > 0
            ? "bg-sky-50 dark:bg-sky-500/15 border-sky-300 dark:border-sky-500/40 text-sky-700 dark:text-sky-300"
            : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
        }`}
      >
        <FiFilter className="text-[16px]" />
        {activeCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-sky-600 dark:bg-sky-500 text-white text-[10px] font-bold font-mono flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900">
            {activeCount}
          </span>
        )}
      </button>

      {/* Two-Column Filter Panel */}
      {open && (
        <>
          {/* Mobile Backdrop */}
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[1px] sm:hidden"
            aria-hidden="true"
          />

          <div
            ref={panelRef}
            role="dialog"
            aria-label="Filter options"
            style={
              desktopPos
                ? { top: `${desktopPos.top}px`, left: `${desktopPos.left}px`, width: "440px" }
                : undefined
            }
            className={`fixed z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xl shadow-slate-900/15 dark:shadow-black/50 overflow-hidden text-left ${
              desktopPos ? "max-w-[calc(100vw-32px)]" : "inset-x-3 bottom-3"
            }`}
          >
            {/* Panel Header */}
            <div className="px-4 py-3 bg-slate-50/90 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FiFilter className="text-sky-600 dark:text-sky-400 text-sm" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Filters
                </span>
                {activeCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 text-[10px] font-bold font-mono">
                    {activeCount} active
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {activeCount > 0 && onResetAll && (
                  <button
                    type="button"
                    onClick={onResetAll}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition cursor-pointer"
                  >
                    <FiRotateCcw className="text-[11px]" />
                    <span>Reset</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close filters"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <FiX className="text-base" />
                </button>
              </div>
            </div>

            {/* Two Columns: Filter (Left) | Options (Right) */}
            <div className="grid grid-cols-12 min-h-[240px] max-h-[60vh] sm:max-h-[320px]">
              {/* Column 1: Filter Categories */}
              <div className="col-span-5 border-r border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex flex-col overflow-hidden">
                <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Filter
                </div>
                <div className="flex-1 overflow-y-auto py-1">
                  {sections.map((sec) => {
                    const isSelected = currentSection?.id === sec.id;
                    const isFiltered = sec.value !== (sec.defaultValue ?? "All");
                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => setActiveSectionId(sec.id)}
                        className={`relative w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 font-bold"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 font-medium"
                        }`}
                      >
                        {isSelected && (
                          <span
                            aria-hidden="true"
                            className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-sky-600 dark:bg-sky-400"
                          />
                        )}
                        <span className="truncate">{sec.label}</span>
                        {isFiltered && (
                          <span
                            aria-label="Filter applied"
                            className="w-2 h-2 rounded-full bg-sky-600 dark:bg-sky-400 shrink-0"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Column 2: Options for Selected Filter */}
              <div className="col-span-7 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
                <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
                  <span>Options</span>
                  {currentSection &&
                    currentSection.value !==
                      (currentSection.defaultValue ?? "All") && (
                      <button
                        type="button"
                        onClick={() =>
                          currentSection.onChange(
                            currentSection.defaultValue ?? "All"
                          )
                        }
                        className="text-[10px] font-semibold normal-case tracking-normal text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
                  {currentSection?.options?.map((opt) => {
                    const isChecked = currentSection.value === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => currentSection.onChange(opt.value)}
                        className={`w-full px-2.5 py-2 rounded-xl text-left text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                          isChecked
                            ? "bg-sky-50 dark:bg-sky-500/15 text-sky-800 dark:text-sky-200 font-bold"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 font-medium"
                        }`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                              isChecked
                                ? "bg-sky-600 border-sky-600 text-white"
                                : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                            }`}
                          >
                            {isChecked && <FiCheck className="text-[11px]" />}
                          </span>
                          <span className="truncate">{opt.label}</span>
                        </span>

                        {typeof opt.count === "number" && (
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md shrink-0 ${
                              isChecked
                                ? "bg-sky-100 dark:bg-sky-500/25 text-sky-800 dark:text-sky-200"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                            }`}
                          >
                            {opt.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-slate-50/90 dark:bg-slate-950/60 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {typeof resultCount === "number" ? (
                  <>
                    Showing{" "}
                    <strong className="font-mono text-slate-900 dark:text-white">
                      {resultCount}
                    </strong>{" "}
                    {resultLabel}
                  </>
                ) : (
                  "Filters apply instantly"
                )}
              </span>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3.5 py-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white text-xs font-bold transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * ActiveFilterChips
 * Displays compact dismissible chips ONLY when at least one filter is active.
 */
export const ActiveFilterChips = ({ sections = [], onResetAll }) => {
  const activeSections = sections.filter(
    (sec) => sec.value !== (sec.defaultValue ?? "All")
  );

  if (activeSections.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap pt-2.5 border-t border-slate-100 dark:border-slate-800">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-0.5">
        Active:
      </span>

      {activeSections.map((sec) => {
        const matched = sec.options?.find((o) => o.value === sec.value);
        const displayValue = matched ? matched.label : sec.value;
        return (
          <span
            key={sec.id}
            className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-500/15 border border-sky-200/80 dark:border-sky-500/25 text-sky-800 dark:text-sky-300 text-[11px] font-semibold"
          >
            <span className="text-sky-600/80 dark:text-sky-400/80 font-medium">
              {sec.label}:
            </span>
            <span>{displayValue}</span>
            <button
              type="button"
              onClick={() => sec.onChange(sec.defaultValue ?? "All")}
              aria-label={`Remove ${sec.label} filter`}
              className="p-0.5 rounded hover:bg-sky-200/60 dark:hover:bg-sky-500/30 transition cursor-pointer"
            >
              <FiX className="text-xs" />
            </button>
          </span>
        );
      })}

      {activeSections.length > 1 && onResetAll && (
        <button
          type="button"
          onClick={onResetAll}
          className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 px-1.5 py-1 transition cursor-pointer"
        >
          Clear all
        </button>
      )}
    </div>
  );
};

export default PortalFilterMenu;
