import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FiPackage,
  FiFileText,
  FiClock,
  FiSettings,
  FiLogOut,
  FiShield,
  FiUserCheck,
  FiArrowLeft,
  FiRefreshCw,
  FiCheckCircle,
  FiInfo,
} from "react-icons/fi";
import { useStaffAuth } from "../../context/StaffAuthContext";
import PortalLogin from "../../components/portal/PortalLogin";
import StockTable from "../../components/portal/StockTable";
import BillingPOS from "../../components/portal/BillingPOS";
import InvoiceHistory from "../../components/portal/InvoiceHistory";
import PortalSettings from "../../components/portal/PortalSettings";
import InvoiceDocument from "../../components/portal/InvoiceDocument";
import { fetchStock } from "../../services/stockService";
import { fetchInvoices } from "../../services/billingService";
import { isSupabaseConfigured } from "../../lib/supabaseClient";

const PortalPage = () => {
  const { isAuthenticated, currentUser, role, isAdmin, logout } = useStaffAuth();

  const [activeTab, setActiveTab] = useState("stock"); // stock | billing | invoices | settings
  const [stock, setStock] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingInvoice, setViewingInvoice] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [stockData, invoicesData] = await Promise.all([
        fetchStock(),
        fetchInvoices(),
      ]);
      setStock(stockData);
      setInvoices(invoicesData);
    } catch (err) {
      console.error("Failed to load portal data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  if (!isAuthenticated) {
    return <PortalLogin />;
  }

  const isConnected = isSupabaseConfigured();

  const tabs = [
    { id: "stock", label: "Stock Manager", icon: FiPackage },
    { id: "billing", label: "Billing & POS", icon: FiFileText },
    { id: "invoices", label: "Invoice History", icon: FiClock },
    ...(isAdmin ? [{ id: "settings", label: "Settings", icon: FiSettings }] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* 🚀 TOP PORTAL HEADER */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          
          {/* Brand & Mode */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-semibold transition"
              title="Return to public store"
            >
              <FiArrowLeft className="text-base" />
              <span className="hidden sm:inline">Storefront</span>
            </Link>

            <span className="text-slate-700 hidden sm:inline">|</span>

            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                E-ALL Portal
              </span>
              
              {/* Role badge */}
              <span
                className={`
                  inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold
                  ${
                    isAdmin
                      ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }
                `}
              >
                {isAdmin ? <FiShield /> : <FiUserCheck />}
                {isAdmin ? "Admin" : "Sales"}
              </span>
            </div>
          </div>

          {/* User info, Sync Status & Logout */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Sync Badge */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
              {isConnected ? (
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <FiCheckCircle className="text-sm" /> Cloud Synced
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-400 font-medium">
                  <FiInfo className="text-sm" /> Local Mode
                </span>
              )}
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={loadData}
              title="Refresh Data"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              <FiRefreshCw className={loading ? "animate-spin text-sky-400" : ""} />
            </button>

            {/* User Name */}
            <span className="hidden sm:inline text-xs text-slate-300 font-medium">
              {currentUser?.name}
            </span>

            {/* Logout */}
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <FiLogOut />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* 📑 SUB-NAV TABS */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-2 border-t border-slate-800/80 pt-1 pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-2 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer
                  ${
                    active
                      ? "bg-sky-700 text-white shadow-md shadow-sky-900/50"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }
                `}
              >
                <Icon className="text-base" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* 📦 MAIN CONTENT CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {loading && stock.length === 0 ? (
          <div className="py-24 text-center">
            <div className="inline-block w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-600">Loading inventory data...</p>
          </div>
        ) : (
          <>
            {activeTab === "stock" && (
              <StockTable
                stock={stock}
                onStockChanged={loadData}
                isAdmin={isAdmin}
              />
            )}

            {activeTab === "billing" && (
              <BillingPOS
                stock={stock}
                onInvoiceCreated={(newInv) => {
                  loadData();
                  setViewingInvoice(newInv);
                }}
              />
            )}

            {activeTab === "invoices" && (
              <InvoiceHistory
                invoices={invoices}
                onSelectInvoice={(inv) => setViewingInvoice(inv)}
              />
            )}

            {activeTab === "settings" && isAdmin && (
              <PortalSettings onConfigUpdated={loadData} />
            )}
          </>
        )}
      </main>

      {/* 📄 INVOICE PREVIEW / PRINT MODAL */}
      {viewingInvoice && (
        <InvoiceDocument
          invoice={viewingInvoice}
          onClose={() => setViewingInvoice(null)}
        />
      )}
    </div>
  );
};

export default PortalPage;
