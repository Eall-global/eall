import { useState } from "react";
import {
  FiDatabase,
  FiKey,
  FiCheck,
  FiCopy,
  FiSave,
  FiCheckCircle,
  FiInfo,
  FiRefreshCw,
} from "react-icons/fi";
import {
  getActiveSupabaseConfig,
  saveSupabaseConfig,
  isSupabaseConfigured,
} from "../../lib/supabaseClient";
import { useStaffAuth } from "../../context/StaffAuthContext";

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

-- 3. ENABLE PUBLIC READ/WRITE FOR DEMO/ANON (Or Configure RLS as desired)
ALTER TABLE public.product_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all access on product_stock" ON public.product_stock FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on invoices" ON public.invoices FOR ALL USING (true) WITH CHECK (true);
`;

const PortalSettings = ({ onConfigUpdated }) => {
  const currentConfig = getActiveSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url || "");
  const [key, setKey] = useState(currentConfig.key || "");
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const { updatePin } = useStaffAuth();
  const [adminPin, setAdminPin] = useState("");
  const [salesPin, setSalesPin] = useState("");
  const [pinSuccess, setPinSuccess] = useState(false);

  const isConnected = isSupabaseConfigured();

  const handleSaveSupabase = (e) => {
    e.preventDefault();
    saveSupabaseConfig(url, key);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    if (onConfigUpdated) onConfigUpdated();
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleUpdatePins = (e) => {
    e.preventDefault();
    if (adminPin.trim()) updatePin("admin", adminPin.trim());
    if (salesPin.trim()) updatePin("sales", salesPin.trim());
    setPinSuccess(true);
    setAdminPin("");
    setSalesPin("");
    setTimeout(() => setPinSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl space-y-8">
      
      {/* 🚀 SUPABASE CONFIGURATION */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FiDatabase className="text-sky-700" />
              Supabase Cloud Database Configuration
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Connect to your 100% Free Supabase PostgreSQL project for live multi-device sync.
            </p>
          </div>

          <div>
            {isConnected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                <FiCheckCircle /> Supabase Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                <FiInfo /> Local Sandbox Mode
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSaveSupabase} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Project URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyzprojectid.supabase.co"
              className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:border-sky-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Anon / Public API Key
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:border-sky-600 outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-400">
              Credentials are saved securely in your browser & environment.
            </p>

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
            >
              <FiSave />
              {savedSuccess ? "Saved & Applied!" : "Save Credentials"}
            </button>
          </div>
        </form>
      </div>

      {/* 📄 ONE-CLICK SQL SCHEMA SETUP */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Supabase SQL Setup Query
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Copy and run this query inside your Supabase <strong>SQL Editor</strong> to create the 2 tables with 1 click.
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

        <pre className="p-4 bg-slate-900 text-slate-200 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-52 leading-relaxed">
          {SUPABASE_SQL_SCHEMA}
        </pre>
      </div>

      {/* 🔐 ACCESS PIN MANAGEMENT */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <FiKey className="text-slate-700" />
          Update Staff Access PINs
        </h3>

        <form onSubmit={handleUpdatePins} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Admin PIN (Current Default: 8888)
            </label>
            <input
              type="password"
              maxLength={6}
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              placeholder="e.g. 8888"
              className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:border-sky-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Salesperson PIN (Current Default: 1234)
            </label>
            <input
              type="password"
              maxLength={6}
              value={salesPin}
              onChange={(e) => setSalesPin(e.target.value)}
              placeholder="e.g. 1234"
              className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:border-sky-600 outline-none"
            />
          </div>

          <div className="sm:col-span-2 flex items-center justify-between pt-2">
            {pinSuccess && (
              <span className="text-xs font-semibold text-emerald-600">
                PINs updated successfully!
              </span>
            )}
            <button
              type="submit"
              disabled={!adminPin && !salesPin}
              className="ml-auto px-5 py-2.5 bg-slate-900 hover:bg-black disabled:opacity-40 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Update PINs
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PortalSettings;
