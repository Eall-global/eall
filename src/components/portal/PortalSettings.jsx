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
} from "react-icons/fi";
import {
  getActiveFirebaseConfig,
  saveFirebaseConfig,
  isFirebaseConfigured,
} from "../../lib/firebaseClient";
import { useStaffAuth } from "../../context/StaffAuthContext";
import { syncCatalogToStock } from "../../services/stockService";

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

      // 2. Sync Catalog Products
      const prodRes = await syncCatalogToStock();

      setTestResult({
        success: true,
        message: `🎉 Success! Google Firebase Firestore populated with ${staffRes.count || members.length} staff accounts and ${prodRes.total} catalog products.`,
      });

      if (onConfigUpdated) onConfigUpdated();
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || "Failed to sync data to Firebase Firestore.",
      });
    } finally {
      setSyncingAll(false);
    }
  };

  const handleAddSalesperson = async (e) => {
    e.preventDefault();
    if (!newSalesName.trim() || !newSalesPin.trim()) return;
    await addMember({
      name: newSalesName.trim(),
      role: "sales",
      pin: newSalesPin.trim(),
    });
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
    <div className="max-w-4xl mx-auto space-y-6 text-left">
      
      {/* 🚀 GOOGLE FIREBASE CLOUD DATABASE STATUS BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-5 sm:p-7 rounded-3xl border border-sky-900/50 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs mb-2 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Google Firebase Cloud Firestore Active</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Live Database Sync (Spark Free Plan - 0 Connection Traps)
          </h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-xl">
            Project: <strong className="text-sky-300 font-mono">e-all-store</strong> • Location: <strong className="text-sky-300 font-mono">europe-west3</strong> • 50k free reads / 20k writes per day with unlimited real-time connections.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSyncAllToFirebase}
          disabled={syncingAll}
          className="shrink-0 whitespace-nowrap inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-md transition cursor-pointer text-xs sm:text-sm"
        >
          <FiUploadCloud className="text-base" />
          <span>{syncingAll ? "Syncing..." : "Sync All 71 Products to Cloud"}</span>
        </button>
      </div>

      {/* Test Result Message */}
      {testResult && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-start gap-3 border ${
            testResult.success
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-rose-50 text-rose-900 border-rose-200"
          }`}
        >
          {testResult.success ? (
            <FiCheckCircle className="text-lg text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <FiAlertCircle className="text-lg text-rose-600 shrink-0 mt-0.5" />
          )}
          <p className="leading-relaxed">{testResult.message}</p>
        </div>
      )}

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
