import { useState, useEffect } from "react";
import {
  FiDatabase,
  FiKey,
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

  // Staff Team Management
  const { members, addMember, updateMember, deleteMember, refreshStaff } = useStaffAuth();
  const [newSalesName, setNewSalesName] = useState("");
  const [newSalesPin, setNewSalesPin] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  const isConnected = isSupabaseConfigured();

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
        message: "Please enter both the Project URL and the Anon Public Key.",
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

      // Test querying product_stock table
      const { data, error } = await client
        .from("product_stock")
        .select("sku")
        .limit(1);

      if (error) {
        if (error.code === "42P01") {
          throw new Error(
            "Connected to Supabase, but the tables are missing! Please copy and run the SQL query below in your Supabase SQL Editor."
          );
        }
        throw new Error(`Supabase error: ${error.message}`);
      }

      setTestResult({
        success: true,
        message: "Connected to Supabase. Real-time sync is active across all devices.",
      });

      // Auto-sync staff and catalog
      await refreshStaff();
      if (onConfigUpdated) onConfigUpdated();
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || "Failed to connect to Supabase. Please verify your URL and Key.",
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
    <div className="max-w-4xl space-y-8 text-left">
      
      {/* 👥 STAFF TEAM MANAGEMENT (ADMIN & MULTIPLE SALESPERSONS) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FiUsers className="text-sky-700" />
              Staff Team & Salesperson Access
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage Admin and Sales team members. Changes automatically sync across all devices via Supabase.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <FiPlus />
            Add Salesperson
          </button>
        </div>

        {/* Team List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Staff Name</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3 font-mono">Access PIN</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-3">
                    <p className="font-bold text-slate-900">{member.name}</p>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        member.role === "admin"
                          ? "bg-sky-50 text-sky-800"
                          : "bg-emerald-50 text-emerald-800"
                      }`}
                    >
                      {member.role === "admin" ? <FiShield /> : <FiUserCheck />}
                      {member.role === "admin" ? "Admin" : "Sales"}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-800">
                    •••• ({member.pin})
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingMember(member)}
                        className="p-1.5 text-slate-400 hover:text-sky-700 rounded-lg hover:bg-sky-50 transition cursor-pointer"
                        title="Edit Name & PIN"
                      >
                        <FiEdit2 />
                      </button>

                      {member.id !== "admin" && (
                        <button
                          type="button"
                          onClick={() => deleteMember(member.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Member"
                        >
                          <FiTrash2 />
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

      {/* 🚀 SUPABASE CONFIGURATION */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FiDatabase className="text-sky-700" />
              Supabase Cloud Database Connection
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live PostgreSQL database sync for stock, multi-device billing, and staff accounts.
            </p>
          </div>

          <div>
            {isConnected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                <FiCheckCircle /> Supabase Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
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

        <form onSubmit={handleTestAndSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Project URL
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste URL (e.g. https://fwkglaflloekpzgdnujl.supabase.co)"
              className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:border-sky-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Anon / Public API Key
            </label>
            <input
              type="password"
              required
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Paste Key (starts with eyJhbGciOi...)"
              className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:border-sky-600 outline-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <p className="text-xs text-slate-400">
              Credentials are encrypted and saved in your local configuration.
            </p>

            <button
              type="submit"
              disabled={testing}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
            >
              <FiSave />
              {testing ? "Testing Connection..." : "Save & Connect"}
            </button>
          </div>
        </form>
      </div>

      {/* 📄 ONE-CLICK SQL SCHEMA SETUP */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Supabase SQL Setup Query (Required Once)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Run this query in your Supabase <strong>SQL Editor</strong> to create the 3 database tables (`product_stock`, `invoices`, and `staff_members`).
            </p>
          </div>

          <button
            onClick={handleCopySQL}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            {copied ? <FiCheck className="text-emerald-600" /> : <FiCopy />}
            {copied ? "Copied SQL!" : "Copy SQL Script"}
          </button>
        </div>

        <pre className="p-4 bg-slate-900 text-slate-200 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-56 leading-relaxed">
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-semibold transition"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-semibold transition"
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
