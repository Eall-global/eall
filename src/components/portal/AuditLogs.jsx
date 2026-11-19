import { useState, useMemo } from "react";
import {
  FiActivity,
  FiClock,
  FiAlertTriangle,
  FiUsers,
  FiSearch,
  FiDownload,
  FiRefreshCw,
  FiEye,
  FiX,
  FiShield,
  FiChevronLeft,
  FiChevronRight,
  FiArrowRight,
} from "react-icons/fi";
import PortalKpiGrid from "./PortalKpiGrid";
import { PortalFilterMenu, ActiveFilterChips } from "./PortalFilterMenu";

const MODULE_LABELS = {
  stock: "Stock",
  orders: "Online Orders",
  rfqs: "B2B RFQs",
  warranty: "IMEI & Warranty",
  landed_cost: "Landed Cost",
  invoices: "Invoices",
  purchases: "Purchases",
  employees: "Employees",
  coupons: "Coupons",
  auth: "Session Auth",
  system: "System",
};

const ACTION_LABELS = {
  create: "Created",
  update: "Updated",
  delete: "Deleted",
  void: "Voided",
  status_change: "Status Changed",
  login: "Unlocked",
  logout: "Locked",
  sync: "Cloud Sync",
};

const SEVERITY_BADGE = {
  critical:
    "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/25",
  warning:
    "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/25",
  info: "bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-500/25",
};

const PAGE_SIZE = 15;

const AuditLogs = ({ logs = [], loading = false, onRefresh }) => {
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [actorFilter, setActorFilter] = useState("All");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const distinctActors = useMemo(() => {
    const set = new Set();
    logs.forEach((l) => l.actorName && set.add(l.actorName));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    return logs.filter((log) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const hit =
          (log.summary || "").toLowerCase().includes(q) ||
          (log.actorName || "").toLowerCase().includes(q) ||
          (log.targetId || "").toLowerCase().includes(q) ||
          (log.targetLabel || "").toLowerCase().includes(q) ||
          (log.module || "").toLowerCase().includes(q) ||
          (log.action || "").toLowerCase().includes(q);
        if (!hit) return false;
      }

      if (moduleFilter !== "All" && log.module !== moduleFilter) return false;
      if (severityFilter !== "All" && log.severity !== severityFilter) return false;
      if (actorFilter !== "All" && log.actorName !== actorFilter) return false;

      if (periodFilter === "today" && !(log.timestamp || "").startsWith(todayStr)) {
        return false;
      }
      if (periodFilter === "7d" && new Date(log.timestamp) < sevenDaysAgo) {
        return false;
      }
      if (periodFilter === "month") {
        const d = new Date(log.timestamp);
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) {
          return false;
        }
      }

      return true;
    });
  }, [logs, search, moduleFilter, severityFilter, actorFilter, periodFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedLogs = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredLogs.slice(start, start + PAGE_SIZE);
  }, [filteredLogs, safePage]);

  // Executive Metrics
  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const totalEvents = logs.length;
    const todayEvents = logs.filter((l) =>
      (l.timestamp || "").startsWith(todayStr)
    ).length;
    const criticalAlerts = logs.filter(
      (l) => l.severity === "critical" || l.severity === "warning"
    ).length;
    const activeActors = distinctActors.length;
    return { totalEvents, todayEvents, criticalAlerts, activeActors };
  }, [logs, distinctActors]);

  const filterSections = useMemo(
    () => [
      {
        id: "module",
        label: "Module",
        value: moduleFilter,
        defaultValue: "All",
        onChange: (val) => {
          setModuleFilter(val);
          setPage(1);
        },
        options: [
          { value: "All", label: "All Modules", count: logs.length },
          ...Object.entries(MODULE_LABELS).map(([key, label]) => ({
            value: key,
            label,
            count: logs.filter((l) => l.module === key).length,
          })),
        ],
      },
      {
        id: "severity",
        label: "Severity",
        value: severityFilter,
        defaultValue: "All",
        onChange: (val) => {
          setSeverityFilter(val);
          setPage(1);
        },
        options: [
          { value: "All", label: "All Severities", count: logs.length },
          {
            value: "critical",
            label: "Critical (Void / Delete)",
            count: logs.filter((l) => l.severity === "critical").length,
          },
          {
            value: "warning",
            label: "Warning (Price / Stock / Edit)",
            count: logs.filter((l) => l.severity === "warning").length,
          },
          {
            value: "info",
            label: "Info (Standard)",
            count: logs.filter((l) => l.severity === "info").length,
          },
        ],
      },
      {
        id: "actor",
        label: "Staff",
        value: actorFilter,
        defaultValue: "All",
        onChange: (val) => {
          setActorFilter(val);
          setPage(1);
        },
        options: [
          { value: "All", label: "All Staff", count: logs.length },
          ...distinctActors.map((actor) => ({
            value: actor,
            label: actor,
            count: logs.filter((l) => l.actorName === actor).length,
          })),
        ],
      },
      {
        id: "period",
        label: "Period",
        value: periodFilter,
        defaultValue: "all",
        onChange: (val) => {
          setPeriodFilter(val);
          setPage(1);
        },
        options: [
          { value: "all", label: "All Time" },
          { value: "today", label: "Today" },
          { value: "7d", label: "Last 7 Days" },
          { value: "month", label: "This Month" },
        ],
      },
    ],
    [logs, moduleFilter, severityFilter, actorFilter, periodFilter, distinctActors]
  );

  const handleResetFilters = () => {
    setModuleFilter("All");
    setSeverityFilter("All");
    setActorFilter("All");
    setPeriodFilter("all");
    setPage(1);
  };

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = [
      "Audit ID",
      "Timestamp",
      "Staff Name",
      "Role",
      "Module",
      "Action",
      "Severity",
      "Target ID",
      "Summary",
    ];
    const rows = filteredLogs.map((l) => [
      l.id,
      new Date(l.timestamp).toLocaleString("en-GB"),
      `"${(l.actorName || "").replace(/"/g, '""')}"`,
      l.actorRole,
      l.module,
      l.action,
      l.severity,
      `"${(l.targetId || "").replace(/"/g, '""')}"`,
      `"${(l.summary || "").replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `EALL_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 sm:space-y-5 text-left">
      {/* KPI Grid */}
      <PortalKpiGrid
        items={[
          {
            id: "events",
            label: "Total Events",
            value: metrics.totalEvents,
            icon: FiActivity,
            tone: "sky",
          },
          {
            id: "today",
            label: "Today's Activity",
            value: metrics.todayEvents,
            icon: FiClock,
            tone: "emerald",
          },
          {
            id: "alerts",
            label: "Sensitive Changes",
            value: metrics.criticalAlerts,
            icon: FiAlertTriangle,
            tone: "amber",
          },
          {
            id: "actors",
            label: "Recorded Staff",
            value: metrics.activeActors,
            icon: FiUsers,
            tone: "indigo",
          },
        ]}
      />

      {/* Unified Search, Filter & Action Toolbar */}
      <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative flex-1 min-w-0">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-base" />
            <input
              type="text"
              placeholder="Search audit events by staff, SKU, invoice #, or action..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 dark:focus:border-sky-500 transition"
            />
          </div>

          <PortalFilterMenu
            sections={filterSections}
            onResetAll={handleResetFilters}
            resultCount={filteredLogs.length}
            resultLabel="events"
          />

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              aria-label="Refresh audit logs"
              title="Refresh Audit Logs"
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer disabled:opacity-50 shrink-0"
            >
              <FiRefreshCw className={`text-[15px] ${loading ? "animate-spin" : ""}`} />
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            aria-label="Export audit CSV"
            title="Export filtered audit trail as CSV"
            className="inline-flex items-center justify-center gap-1.5 w-10 h-10 md:w-auto md:px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer disabled:opacity-40 shrink-0"
          >
            <FiDownload className="text-[16px] md:text-sm" />
            <span className="hidden md:inline">Export CSV</span>
          </button>
        </div>

        <ActiveFilterChips
          sections={filterSections}
          onResetAll={handleResetFilters}
        />
      </div>

      {/* Audit Trail Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-800/70 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 whitespace-nowrap">Timestamp</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Staff Member</th>
                <th className="py-3.5 px-3 whitespace-nowrap">Module</th>
                <th className="py-3.5 px-3 whitespace-nowrap">Action</th>
                <th className="py-3.5 px-4">Activity Summary</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium text-slate-700 dark:text-slate-300">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-16 text-center text-slate-400 dark:text-slate-500"
                  >
                    <FiShield className="text-3xl mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                      No audit activity recorded yet
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                      Stock edits, price changes, invoices, purchases, employee updates, and login events are automatically logged here.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const dt = new Date(log.timestamp);
                  const severityStyle =
                    SEVERITY_BADGE[log.severity] || SEVERITY_BADGE.info;

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedEvent(log)}
                      className="hover:bg-sky-50/50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                    >
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-semibold text-slate-900 dark:text-white text-xs">
                          {dt.toLocaleDateString("en-GB")}
                        </p>
                        <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                          {dt.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </p>
                      </td>

                      {/* Actor */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-bold text-slate-900 dark:text-white text-xs truncate max-w-[160px]">
                          {log.actorName}
                        </p>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">
                          {log.actorRole}
                        </span>
                      </td>

                      {/* Module */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                          {MODULE_LABELS[log.module] || log.module}
                        </span>
                      </td>

                      {/* Action & Severity */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${severityStyle}`}
                        >
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>

                      {/* Summary & Target */}
                      <td className="py-3.5 px-4 max-w-md">
                        <p className="text-xs text-slate-800 dark:text-slate-200 line-clamp-1 font-medium">
                          {log.summary}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {log.targetId && (
                            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate max-w-[180px]">
                              Ref: {log.targetId}
                            </span>
                          )}
                          {log.changes?.length > 0 && (
                            <span className="text-[10px] font-semibold text-sky-700 dark:text-sky-400">
                              • {log.changes.length} field diff(s)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Inspect */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(log);
                          }}
                          className="p-1.5 text-slate-400 hover:text-sky-700 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-500/15 rounded-lg transition cursor-pointer"
                          title="Inspect event details & changes"
                        >
                          <FiEye className="text-sm" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Page <strong className="font-mono text-slate-900 dark:text-white">{safePage}</strong> of{" "}
              <strong className="font-mono text-slate-900 dark:text-white">{totalPages}</strong>{" "}
              ({filteredLogs.length} events)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
              >
                <FiChevronLeft />
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AUDIT EVENT INSPECTOR MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 w-full max-w-xl shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 my-6 text-left">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      SEVERITY_BADGE[selectedEvent.severity] || SEVERITY_BADGE.info
                    }`}
                  >
                    {selectedEvent.severity} • {ACTION_LABELS[selectedEvent.action] || selectedEvent.action}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {selectedEvent.id}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-1.5">
                  {selectedEvent.summary}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl cursor-pointer"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            {/* Event Metadata */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Performed By
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedEvent.actorName}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block uppercase">
                  {selectedEvent.actorRole}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Timestamp
                </span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {new Date(selectedEvent.timestamp).toLocaleString("en-GB")}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Module
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {MODULE_LABELS[selectedEvent.module] || selectedEvent.module}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Target Reference
                </span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 break-all">
                  {selectedEvent.targetLabel || selectedEvent.targetId || "—"}
                </span>
              </div>
            </div>

            {/* Structured Before -> After Diff Table */}
            {selectedEvent.changes?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Recorded Field Changes
                </h4>
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {selectedEvent.changes.map((diff, i) => (
                    <div
                      key={`${diff.field}-${i}`}
                      className="p-3 bg-white dark:bg-slate-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {diff.field}
                      </span>
                      <div className="flex items-center gap-2 font-mono text-[11px] flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300">
                          {diff.before}
                        </span>
                        <FiArrowRight className="text-slate-400 shrink-0" />
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold">
                          {diff.after}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;

