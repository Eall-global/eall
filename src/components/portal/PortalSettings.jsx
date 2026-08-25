import { useState } from "react";
import {
  FiDatabase,
  FiCheck,
  FiCopy,
  FiSave,
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
  FiKey,
} from "react-icons/fi";
import {
  getActiveSupabaseConfig,
  saveSupabaseConfig,
  isSupabaseConfigured,
  getSupabase,
} from "../../lib/supabaseClient";
import { useStaffAuth } from "../../context/StaffAuthContext";
import { syncCatalogToStock } from "../../services/stockService";

const SUPABASE_SQL_SCHEMA = `-- 1. PRODUCT STOCK TABLE
CREATE TABLE IF NOT EXISTS public.product_stock (
    sku TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT,
    category TEXT,
    image TEXT,
    quantity INTEGER DEFAULT 0,
    price NUMERIC(10, 2) DEFAULT 0,
    cost_price NUMERIC(10, 2) DEFAULT 0,
    min_alert INTEGER DEFAULT 3,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. INVOICES TABLE
CREATE TABLE IF NOT EXISTS public.invoices (
    id TEXT PRIMARY KEY DEFAULT ('INV-' || to_char(now(), 'YYYY') || '-' || floor(random() * 9000 + 1000)::text),
    invoice_no TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    customer_trn TEXT,
    payment_method TEXT DEFAULT 'Cash',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10, 2) DEFAULT 0,
    vat_rate NUMERIC(5, 2) DEFAULT 5.00,
    vat_amount NUMERIC(10, 2) DEFAULT 0,
    discount NUMERIC(10, 2) DEFAULT 0,
    total_amount NUMERIC(10, 2) DEFAULT 0,
    created_by TEXT,
    role TEXT DEFAULT 'sales',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. STAFF MEMBERS TABLE (Syncs sales persons & pins across all devices)
CREATE TABLE IF NOT EXISTS public.staff_members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'sales',
    pin TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. ENABLE PUBLIC PERMISSIONS FOR ANON KEY
ALTER TABLE public.product_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public all access on product_stock" ON public.product_stock;
CREATE POLICY "Allow public all access on product_stock" ON public.product_stock FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on invoices" ON public.invoices;
CREATE POLICY "Allow public all access on invoices" ON public.invoices FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on staff_members" ON public.staff_members;
CREATE POLICY "Allow public all access on staff_members" ON public.staff_members FOR ALL USING (true) WITH CHECK (true);
`;

const PortalSettings = ({ onConfigUpdated }) => {
  const currentConfig = getActiveSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url || "");
  const [key, setKey] = useState(currentConfig.key || "");
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState(null); // { success: boolean, message: string }
  const [testing, setTesting] = useState(false);
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

  const isConnected = isSupabaseConfigured();

  // 1-Click Complete Cloud Sync (Staff + Catalog Products)
  const handleSyncAllToSupabase = async () => {
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
        message: `🎉 Success! Database populated with ${staffRes.count || members.length} staff accounts and ${prodRes.total} catalog products. Refresh your Supabase table!`,
      });

      if (onConfigUpdated) onConfigUpdated();
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || "Failed to sync data to Supabase.",
      });
    } finally {
      setSyncingAll(false);
    }
  };

  // Test live connection to Supabase
  const handleTestAndSave = async (e) => {
    e?.preventDefault();
    setTesting(true);
    setTestResult(null);

    const cleanUrl = url.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
    const cleanKey = key.trim();

    if (!cleanUrl || !cleanKey) {
      setTestResult({
        success: false,
        message: "Please enter both the Project URL and the Anon Public API Key.",
      });
      setTesting(false);
      return;
    }

    try {
      saveSupabaseConfig(cleanUrl, cleanKey);
      const client = getSupabase();

      if (!client) {
        throw new Error("Invalid Supabase URL or Key format.");
      }

      // Test querying staff_members table
      const { data, error } = await client
        .from("staff_members")
        .select("id")
        .limit(1);

      if (error) {
        if (error.code === "42P01") {
          throw new Error(
            "Connected to Supabase, but database tables are missing! Please copy and run the SQL query below in your Supabase SQL Editor."
          );
        }
        throw new Error(`Supabase error: ${error.message}`);
      }

      // Auto-push staff members
      await pushAllMembersToCloud();

      setTestResult({
        success: true,
        message: "Connected to Supabase. Staff accounts and stock are synchronized in real-time across all devices.",
      });

      await refreshStaff();
      if (onConfigUpdated) onConfigUpdated();
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || "Failed to connect to Supabase. Please verify your Project URL and Key.",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
      
      {/* 🚀 QUICK DATABASE SYNC BANNER */}
      {isConnected && (
        <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px] mb-2 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Cloud Database Active
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Populate & Sync Database Now
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Push all Staff Team members (*Admin, Iftikhar, Hidayat, Yafey*) and Website Catalog Products directly to your Supabase tables in 1 click.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSyncAllToSupabase}
            disabled={syncingAll}
            className="shrink-0 whitespace-nowrap inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-md transition cursor-pointer text-xs sm:text-sm"
          >
            <FiUploadCloud className="text-base" />
            <span>{syncingAll ? "Syncing..." : "Populate Supabase Tables"}</span>
          </button>
        </div>
      )}

      {/* 👥 STAFF TEAM MANAGEMENT CARD */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        
        {/* Card Header with Aligned Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FiUsers className="text-sky-700 shrink-0" />
              <span>Staff Team & Salesperson Access</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage Admin and Sales team members. Changes automatically sync across all devices via Supabase.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Sync to Supabase Button */}
            <button
              type="button"
              onClick={async () => {
                const res = await pushAllMembersToCloud();
                if (res.success) {
                  alert(`Staff team (${res.count} members) successfully saved to Supabase! Refresh your Supabase table to view.`);
                } else {
                  alert("Sync error: " + res.error);
                }
              }}
              className="whitespace-nowrap inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              title="Push current team members to Supabase"
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

        {/* Team List Table with Proper Column Alignment */}
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

      {/* 🚀 SUPABASE CONFIGURATION CARD */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FiDatabase className="text-sky-700 shrink-0" />
              <span>Supabase Cloud Database Connection</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live PostgreSQL database sync for stock, multi-device billing, and staff accounts.
            </p>
          </div>

          <div className="shrink-0">
            {isConnected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 whitespace-nowrap">
                <FiCheckCircle /> Supabase Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200 whitespace-nowrap">
                <FiInfo /> Local Sandbox Mode (Not Synced)
              </span>
            )}
          </div>
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

        {/* Form */}
        <form onSubmit={handleTestAndSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Project URL
            </label>
            <div className="relative">
              <FiServer className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://fwkglaflloekpzgdnujl.supabase.co"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:border-sky-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Anon / Public API Key
            </label>
            <div className="relative">
              <FiKey className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="password"
                required
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:border-sky-600 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            <p className="text-xs text-slate-400">
              Credentials are securely saved in your browser and sync state.
            </p>

            <button
              type="submit"
              disabled={testing}
              className="whitespace-nowrap inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
            >
              <FiSave className="text-sm" />
              <span>{testing ? "Testing..." : "Save & Connect"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 📄 ONE-CLICK SQL SCHEMA SETUP */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Supabase SQL Setup Query (Required Once)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Run this query in your Supabase <strong>SQL Editor</strong> to create the 3 database tables.
            </p>
          </div>

          <button
            onClick={handleCopySQL}
            className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            {copied ? <FiCheck className="text-emerald-600" /> : <FiCopy />}
            <span>{copied ? "Copied SQL!" : "Copy SQL Script"}</span>
          </button>
        </div>

        <pre className="p-4 bg-slate-900 text-slate-200 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-52 leading-relaxed">
          {SUPABASE_SQL_SCHEMA}
        </pre>
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
