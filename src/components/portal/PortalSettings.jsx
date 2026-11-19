import { useState } from "react";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiUploadCloud,
  FiServer,
  FiSave,
  FiGlobe,
  FiDownload,
  FiShoppingBag,
  FiCheck,
  FiExternalLink,
  FiSliders,
  FiSidebar,
  FiBriefcase,
  FiArrowRight,
} from "react-icons/fi";
import {
  getActiveFirebaseConfig,
  saveFirebaseConfig,
  isFirebaseConfigured,
} from "../../lib/firebaseClient";
import { useStaffAuth } from "../../context/StaffAuthContext";
import { syncCatalogToStock } from "../../services/stockService";
import {
  downloadGoogleShoppingFeed,
  downloadSitemap,
} from "../../services/googleFeedGenerator";
import PortalThemeToggle from "./PortalThemeToggle";
import { usePortalTheme } from "../../context/PortalThemeContext";

const PortalSettings = ({
  onConfigUpdated,
  sidebarCollapsed,
  onToggleSidebar,
  onOpenEmployees,
}) => {
  const { isDark } = usePortalTheme();
  const currentConfig = getActiveFirebaseConfig();
  const [projectId, setProjectId] = useState(
    currentConfig.projectId || "e-all-store"
  );
  const [apiKey, setApiKey] = useState(currentConfig.apiKey || "");
  const [testResult, setTestResult] = useState(null);
  const [syncingAll, setSyncingAll] = useState(false);

  const { members, pushAllMembersToCloud } = useStaffAuth();
  const isConnected = isFirebaseConfigured();

  // 1-Click Complete Cloud Sync (Staff + Catalog Products) to Firestore
  const handleSyncAllToFirebase = async () => {
    setSyncingAll(true);
    setTestResult(null);

    try {
      const staffRes = await pushAllMembersToCloud();
      if (!staffRes.success) {
        throw new Error("Staff sync failed: " + staffRes.error);
      }

      const stockRes = await syncCatalogToStock();
      if (!stockRes.success) {
        throw new Error("Stock catalog sync failed: " + stockRes.error);
      }

      setTestResult({
        success: true,
        message: `Success! Synced ${staffRes.count} staff members and ${stockRes.synced ?? stockRes.total} inventory products to Firebase Firestore.`,
      });

      if (onConfigUpdated) onConfigUpdated();
    } catch (err) {
      setTestResult({
        success: false,
        message: "Cloud Sync Error: " + (err.message || String(err)),
      });
    } finally {
      setSyncingAll(false);
    }
  };

  const handleSaveFirebaseConfig = (e) => {
    e.preventDefault();
    saveFirebaseConfig({ projectId, apiKey });
    setTestResult({
      success: true,
      message: "Firebase configuration credentials saved to local browser cache.",
    });
    if (onConfigUpdated) onConfigUpdated();
  };

  return (
    <div className="space-y-5 w-full text-left">
      {/* APPEARANCE & WORKSPACE PREFERENCES */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
        <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FiSliders className="text-sky-700 dark:text-sky-400 shrink-0" />
            <span>Appearance &amp; Workspace Preferences</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Customize your portal theme and navigation layout. Preferences are saved automatically for this device.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Color Theme
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Active: {isDark ? "Dark Mode" : "Light Mode (Default)"}
              </p>
            </div>
            <PortalThemeToggle />
          </div>

          {typeof onToggleSidebar === "function" && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Desktop Sidebar
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {sidebarCollapsed
                    ? "Currently compact icon rail"
                    : "Currently expanded with labels"}
                </p>
              </div>
              <button
                type="button"
                onClick={onToggleSidebar}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-sky-400 dark:hover:border-sky-500 text-xs font-semibold shadow-2xs transition cursor-pointer shrink-0"
              >
                <FiSidebar className="text-sm text-sky-600 dark:text-sky-400" />
                <span>{sidebarCollapsed ? "Expand" : "Collapse"}</span>
              </button>
            </div>
          )}

          {typeof onOpenEmployees === "function" && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Staff &amp; Access PINs
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {members.length} team member(s) in Employees
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenEmployees}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-500/15 border border-sky-200/70 dark:border-sky-500/25 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-500/25 text-xs font-semibold transition cursor-pointer shrink-0"
              >
                <FiBriefcase className="text-xs" />
                <span>Manage</span>
                <FiArrowRight className="text-xs" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* GOOGLE SHOPPING FEED & SEO CENTER CARD */}
      <div className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-sky-950/80 dark:to-slate-900 text-slate-900 dark:text-white p-5 sm:p-7 rounded-3xl shadow-xs space-y-5 border border-slate-200/80 dark:border-sky-900/50 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 rounded-xl border border-sky-200/70 dark:border-sky-400/30 text-lg">
              <FiShoppingBag />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Google Shopping &amp; SEO Center
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-300">
                Manage Google Merchant Center XML feed, Google Search Console sitemap, and rich snippets for <strong>www.eall.ae</strong>.
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 rounded-full text-xs font-bold self-start sm:self-auto">
            <FiCheckCircle /> Google Ready
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
                  <FiShoppingBag /> Google Merchant Center Feed
                </span>
                <span className="text-[10px] bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 px-2 py-0.5 rounded-full font-bold">
                  XML RSS 2.0
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Connect this feed to your Google Merchant Center account to display E-ALL products in the <strong>Google Shopping carousel</strong> with photos, AED prices, and stock status.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => downloadGoogleShoppingFeed()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <FiDownload /> Download Feed (XML)
              </button>
              <a
                href="https://merchants.google.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-2 bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/20 text-slate-700 dark:text-white border border-slate-200 dark:border-transparent rounded-xl text-xs font-semibold transition"
              >
                <span>Merchant Center</span>
                <FiExternalLink className="text-xs" />
              </a>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <FiGlobe /> Sitemap.xml for Googlebot
                </span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                  Search Console
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Submit your sitemap to <strong>Google Search Console</strong> so Google rapidly indexes all Apple, Samsung, HMD, and Nokia product pages on <strong>www.eall.ae</strong>.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => downloadSitemap()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <FiDownload /> Download Sitemap.xml
              </button>
              <a
                href="https://search.google.com/search-console"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-2 bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/20 text-slate-700 dark:text-white border border-slate-200 dark:border-transparent rounded-xl text-xs font-semibold transition"
              >
                <span>Search Console</span>
                <FiExternalLink className="text-xs" />
              </a>
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-emerald-50/60 dark:bg-white/5 border border-emerald-200/70 dark:border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-semibold">
            <FiCheck /> Schema.org Product Rich Snippets Active
          </div>
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-semibold">
            <FiCheck /> UAE Dirham (AED) Currency &amp; 5% VAT Configured
          </div>
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-semibold">
            <FiCheck /> Robots.txt &amp; Canonical URLs Injected
          </div>
        </div>
      </div>

      {/* FIREBASE FIRESTORE SYNC & CREDENTIALS */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FiServer className="text-sky-700 dark:text-sky-400 shrink-0" />
              <span>Firebase Cloud Database Integration</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Connect your Firebase Firestore project to synchronize stock inventory, sales invoices, audit logs, customer accounts, and staff credentials in real-time.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isConnected
                  ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/25"
                  : "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/25"
              }`}
            >
              {isConnected ? <FiCheckCircle /> : <FiAlertCircle />}
              <span>{isConnected ? "Cloud Connected" : "Local Fallback"}</span>
            </span>
          </div>
        </div>

        {testResult && (
          <div
            className={`p-4 rounded-2xl text-xs flex items-start gap-2.5 ${
              testResult.success
                ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/25"
                : "bg-rose-50 dark:bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-500/25"
            }`}
          >
            {testResult.success ? (
              <FiCheckCircle className="text-base shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            ) : (
              <FiAlertCircle className="text-base shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            )}
            <div>
              <p className="font-bold">
                {testResult.success ? "Sync Successful" : "Configuration Issue"}
              </p>
              <p className="mt-0.5">{testResult.message}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSaveFirebaseConfig} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Firebase Project ID
              </label>
              <input
                type="text"
                required
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="e-all-store"
                className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 dark:focus:border-sky-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Web API Key
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 dark:focus:border-sky-500 outline-none transition"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              <FiSave className="text-sm" />
              <span>Save Configuration</span>
            </button>

            <button
              type="button"
              onClick={handleSyncAllToFirebase}
              disabled={syncingAll}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              <FiUploadCloud className="text-sm" />
              <span>
                {syncingAll ? "Syncing Database..." : "1-Click Full Cloud Sync"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PortalSettings;
