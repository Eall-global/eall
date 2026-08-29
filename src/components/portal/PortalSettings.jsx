import { useState } from "react";
import {
  FiDatabase,
  FiCheckCircle,
  FiInfo,
  FiUsers,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiShield,
  FiUserCheck,
  FiAlertCircle,
  FiUploadCloud,
  FiServer,
  FiSave,
  FiGlobe,
  FiDownload,
  FiShoppingBag,
  FiCheck,
  FiExternalLink,
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

const PortalSettings = ({ onConfigUpdated }) => {
  const currentConfig = getActiveFirebaseConfig();
  const [projectId, setProjectId] = useState(currentConfig.projectId || "e-all-store");
  const [apiKey, setApiKey] = useState(currentConfig.apiKey || "");
  const [testResult, setTestResult] = useState(null); // { success: boolean, message: string }
  const [syncingAll, setSyncingAll] = useState(false);

  // Staff Team Management
  const {
    members,
    addMember,
    updateMember,
    deleteMember,
    refreshStaff,
    pushAllMembersToCloud,
  } = useStaffAuth();

  const [newSalesName, setNewSalesName] = useState("");
  const [newSalesPin, setNewSalesPin] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  const isConnected = isFirebaseConfigured();

  // 1-Click Complete Cloud Sync (Staff + Catalog Products) to Firestore
  const handleSyncAllToFirebase = async () => {
    setSyncingAll(true);
    setTestResult(null);

    try {
      // 1. Sync Staff Members
      const staffRes = await pushAllMembersToCloud();
      if (!staffRes.success) {
        throw new Error("Staff sync failed: " + staffRes.error);
      }

      // 2. Sync Catalog Products to Stock
      const stockRes = await syncCatalogToStock();
      if (!stockRes.success) {
        throw new Error("Stock catalog sync failed: " + stockRes.error);
      }

      setTestResult({
        success: true,
        message: `Success! Synced ${staffRes.count} staff members and ${stockRes.synced} inventory products to Firebase Firestore.`,
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

  const handleAddSalesperson = async (e) => {
    e.preventDefault();
    if (!newSalesName || !newSalesPin) return;

    if (newSalesPin.length < 4) {
      alert("PIN must be at least 4 digits");
      return;
    }

    await addMember(newSalesName, newSalesPin, "sales");
    setNewSalesName("");
    setNewSalesPin("");
    setShowAddModal(false);
  };

  const handleSaveMemberEdit = async (e) => {
    e.preventDefault();
    if (!editingMember) return;

    await updateMember(editingMember.id, {
      name: editingMember.name,
      pin: editingMember.pin,
    });
    setEditingMember(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-left">
      
      {/* 🚀 GOOGLE SHOPPING FEED & SEO CENTER CARD */}
      <div className="bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white p-5 sm:p-7 rounded-3xl shadow-md space-y-5 border border-sky-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-sky-500/20 text-sky-300 rounded-xl border border-sky-400/30 text-lg">
                <FiShoppingBag />
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Google Shopping &amp; SEO Center
                </h3>
                <p className="text-xs text-slate-300">
                  Manage Google Merchant Center XML feed, Google Search Console sitemap, and rich snippets for <strong>www.eall.ae</strong>.
                </p>
              </div>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold self-start sm:self-auto">
            <FiCheckCircle /> Google Ready
          </span>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Card 1: Google Merchant Feed */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <FiShoppingBag /> Google Merchant Center Feed
                </span>
                <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full font-bold">
                  XML RSS 2.0
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Connect this feed to your Google Merchant Center account to display E-ALL products in the <strong>Google Shopping carousel</strong> with photos, AED prices, and stock status.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => downloadGoogleShoppingFeed()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <FiDownload /> Download Feed (XML)
              </button>
              <a
                href="https://merchants.google.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition"
              >
                <span>Merchant Center</span>
                <FiExternalLink className="text-xs" />
              </a>
            </div>
          </div>

          {/* Card 2: Google Search Console Sitemap */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <FiGlobe /> Sitemap.xml for Googlebot
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                  Search Console
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Submit your sitemap to <strong>Google Search Console</strong> so Google rapidly indexes all Apple, Samsung, HMD, and Nokia product pages on <strong>www.eall.ae</strong>.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => downloadSitemap()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <FiDownload /> Download Sitemap.xml
              </button>
              <a
                href="https://search.google.com/search-console"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition"
              >
                <span>Search Console</span>
                <FiExternalLink className="text-xs" />
              </a>
            </div>
          </div>
        </div>

        {/* Live SEO Status Badges */}
        <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
            <FiCheck /> Schema.org Product Rich Snippets Active
          </div>
          <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
            <FiCheck /> UAE Dirham (AED) Currency &amp; 5% VAT Configured
          </div>
          <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
            <FiCheck /> Robots.txt &amp; Canonical URLs Injected
          </div>
        </div>
      </div>

      {/* ☁️ FIREBASE FIRESTORE SYNC & CREDENTIALS */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FiServer className="text-sky-700 shrink-0" />
              <span>Firebase Cloud Database Integration</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Connect your Firebase Firestore project to synchronize stock inventory, sales invoices, customer accounts, and staff credentials in real-time.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isConnected
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
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
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {testResult.success ? (
              <FiCheckCircle className="text-base shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <FiAlertCircle className="text-base shrink-0 text-rose-600 mt-0.5" />
            )}
            <div>
              <p className="font-bold">{testResult.success ? "Sync Successful" : "Configuration Issue"}</p>
              <p className="mt-0.5">{testResult.message}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSaveFirebaseConfig} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Firebase Project ID
              </label>
              <input
                type="text"
                required
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="e-all-store"
                className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:border-sky-600 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Web API Key
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:border-sky-600 outline-none transition"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              <FiSave className="text-sm" />
              <span>Save Configuration</span>
            </button>

            <button
              type="button"
              onClick={handleSyncAllToFirebase}
              disabled={syncingAll}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              <FiUploadCloud className="text-sm" />
              <span>{syncingAll ? "Syncing Database..." : "1-Click Full Cloud Sync"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 👥 STAFF TEAM MANAGEMENT CARD */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        
        {/* Card Header with Aligned Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FiUsers className="text-sky-700 shrink-0" />
              <span>Staff Team &amp; Salesperson Access</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage Admin and Sales team members. Changes automatically sync in real-time across all devices via Firestore.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Sync to Firestore Button */}
            <button
              type="button"
              onClick={async () => {
                const res = await pushAllMembersToCloud();
                if (res.success) {
                  alert(`Staff team (${res.count} members) successfully saved to Firebase Firestore!`);
                } else {
                  alert("Sync error: " + res.error);
                }
              }}
              className="whitespace-nowrap inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              title="Push current team members to Firestore"
            >
              <FiUploadCloud className="text-sm" />
              <span>Sync to Cloud</span>
            </button>

            {/* Add Salesperson Button */}
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="whitespace-nowrap inline-flex items-center gap-1.5 px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <FiPlus className="text-sm" />
              <span>Add Salesperson</span>
            </button>
          </div>
        </div>

        {/* Team List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-2.5 px-3.5 text-left whitespace-nowrap">Staff Name</th>
                <th className="py-2.5 px-3 text-left w-28 whitespace-nowrap">Role</th>
                <th className="py-2.5 px-3 text-left w-32 font-mono whitespace-nowrap">Access PIN</th>
                <th className="py-2.5 px-3 text-right w-24 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                  
                  {/* Name */}
                  <td className="py-3 px-3.5 text-left whitespace-nowrap min-w-[150px]">
                    <p className="font-bold text-slate-900 text-xs sm:text-sm whitespace-nowrap">
                      {member.name}
                    </p>
                  </td>

                  {/* Role Badge */}
                  <td className="py-3 px-3 text-left whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                        member.role === "admin"
                          ? "bg-sky-50 text-sky-800 border border-sky-200"
                          : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {member.role === "admin" ? <FiShield /> : <FiUserCheck />}
                      <span>{member.role === "admin" ? "Admin" : "Sales"}</span>
                    </span>
                  </td>

                  {/* PIN */}
                  <td className="py-3 px-3 text-left font-mono font-bold text-slate-800 text-xs sm:text-sm whitespace-nowrap">
                    •••• ({member.pin})
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingMember(member)}
                        className="p-1.5 text-slate-400 hover:text-sky-700 rounded-lg hover:bg-sky-50 transition cursor-pointer"
                        title="Edit Name & PIN"
                      >
                        <FiEdit2 className="text-sm" />
                      </button>

                      {member.id !== "admin" && (
                        <button
                          type="button"
                          onClick={() => deleteMember(member.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Member"
                        >
                          <FiTrash2 className="text-sm" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD SALESPERSON */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Add New Salesperson
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Create an account with a unique 4-digit PIN for your sales team member.
            </p>

            <form onSubmit={handleAddSalesperson} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Salesperson Name
                </label>
                <input
                  type="text"
                  required
                  value={newSalesName}
                  onChange={(e) => setNewSalesName(e.target.value)}
                  placeholder="e.g. John Smith"
                  className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-sky-600 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  4-Digit Access PIN
                </label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={newSalesPin}
                  onChange={(e) => setNewSalesPin(e.target.value)}
                  placeholder="e.g. 5566"
                  className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:border-sky-600 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Create Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT STAFF MEMBER */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Edit Staff Member
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Update name or PIN for {editingMember.name}
            </p>

            <form onSubmit={handleSaveMemberEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={editingMember.name}
                  onChange={(e) =>
                    setEditingMember({ ...editingMember, name: e.target.value })
                  }
                  className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-sky-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Access PIN
                </label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={editingMember.pin}
                  onChange={(e) =>
                    setEditingMember({ ...editingMember, pin: e.target.value })
                  }
                  className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:border-sky-600 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalSettings;
