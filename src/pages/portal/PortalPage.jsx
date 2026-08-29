import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FiPackage,
  FiFileText,
  FiClipboard,
  FiSettings,
  FiLogOut,
  FiShield,
  FiUserCheck,
  FiArrowLeft,
  FiRefreshCw,
  FiCheckCircle,
  FiInfo,
  FiUsers,
  FiTag,
} from "react-icons/fi";
import { useStaffAuth } from "../../context/StaffAuthContext";
import PortalLogin from "../../components/portal/PortalLogin";
import StockTable from "../../components/portal/StockTable";
import BillingPOS from "../../components/portal/BillingPOS";
import InvoiceAudit from "../../components/portal/InvoiceAudit";
import CustomerManagement from "../../components/portal/CustomerManagement";
import CouponManagement from "../../components/portal/CouponManagement";
import PortalSettings from "../../components/portal/PortalSettings";
import InvoiceDocument from "../../components/portal/InvoiceDocument";
import { fetchStock } from "../../services/stockService";
import { fetchInvoices } from "../../services/billingService";
import {
  getFirebaseDb,
  isFirebaseConfigured,
  collection,
  onSnapshot,
} from "../../lib/firebaseClient";

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

  // ⚡ AUTOMATIC REALTIME SUBSCRIPTION (Google Firebase Firestore onSnapshot)
  useEffect(() => {
    if (!isAuthenticated) return;

    loadData();

    const db = getFirebaseDb();
    if (db && isFirebaseConfigured()) {
      try {
        const un過程1 = onSnapshot(collection(db, "product_stock"), () => {
          loadData();
        });
        const un過程2 = onSnapshot(collection(db, "invoices"), () => {
          loadData();
        });

        return () => {
          un過程1();
          un過程2();
        };
      } catch (e) {
        console.warn("Could not attach Firestore portal listener:", e);
      }
    }
  }, [isAuthenticated, loadData]);

  if (!isAuthenticated) {
    return <PortalLogin />;
  }

  const isConnected = isFirebaseConfigured();

  const tabs = [
    { id: "stock", label: "Stock Manager", icon: FiPackage },
    { id: "billing", label: "Billing & POS", icon: FiFileText },
    { id: "invoices", label: "Sales & Invoices Audit", icon: FiClipboard },
  ];

  if (isAdmin) {
    tabs.push({ id: "customers", label: "Customers", icon: FiUsers });
    tabs.push({ id: "coupons", label: "Coupons & Offers", icon: FiTag });
    tabs.push({ id: "settings", label: "System & Settings", icon: FiSettings });
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans text-left">
      {/* 🧭 TOP PORTAL NAVIGATION BAR */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        
        {/* Left: Branding & Role */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Return to Public Website"
          >
            <FiArrowLeft className="text-lg" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                E-ALL <span className="text-sky-400 text-xs sm:text-sm font-semibold uppercase px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20">Portal</span>
              </span>

              {/* Real-time Cloud Connection Indicator */}
              {isConnected ? (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-medium border border-emerald-500/20">
                  <FiCheckCircle className="text-xs" />
                  <span>Firestore Live</span>
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[11px] font-medium border border-amber-500/20">
                  <FiInfo className="text-xs" />
                  <span>Local Mode</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Inventory, Real-Time POS &amp; Tax Invoicing Engine
            </p>
          </div>
        </div>

        {/* Right: User Info & Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition disabled:opacity-50"
            title="Refresh Live Data"
          >
            <FiRefreshCw className={`text-base ${loading ? "animate-spin" : ""}`} />
          </button>

          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-white flex items-center justify-end gap-1">
              {isAdmin ? <FiShield className="text-sky-400" /> : <FiUserCheck className="text-emerald-400" />}
              {currentUser?.name}
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              {role === "admin" ? "Master Admin" : "Sales Executive"}
            </span>
          </div>

          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition"
          >
            <FiLogOut className="text-sm" />
            <span className="hidden sm:inline">Lock PIN</span>
          </button>
        </div>
      </header>

      {/* 📑 TAB NAVIGATION STRIP */}
      <nav className="bg-slate-950 border-b border-slate-800/80 px-4 sm:px-8 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setViewingInvoice(null);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-sky-600 text-white shadow-md shadow-sky-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Icon className="text-sm" />
              <span>{tab.label}</span>
              {tab.id === "stock" && (
                <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded-full font-mono">
                  {stock.length}
                </span>
              )}
              {tab.id === "invoices" && (
                <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded-full font-mono">
                  {invoices.length}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* 💻 MAIN PORTAL CONTENT AREA */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-900 text-slate-900">
        {/* INVOICE VIEWER OVERLAY / FULL MODAL */}
        {viewingInvoice && (
          <InvoiceDocument
            invoice={viewingInvoice}
            onClose={() => setViewingInvoice(null)}
          />
        )}

        {/* TAB 1: STOCK MANAGER */}
        {activeTab === "stock" && (
          <StockTable
            stock={stock}
            onStockUpdated={loadData}
            isAdmin={isAdmin}
          />
        )}

        {/* TAB 2: BILLING & POS */}
        {activeTab === "billing" && (
          <BillingPOS
            stock={stock}
            onInvoiceCreated={(newInv) => {
              loadData();
              setViewingInvoice(newInv);
            }}
            currentUser={currentUser}
          />
        )}

        {/* TAB 3: INVOICES & SALES AUDIT */}
        {activeTab === "invoices" && (
          <InvoiceAudit
            invoices={invoices}
            onViewInvoice={(inv) => setViewingInvoice(inv)}
            onInvoicesUpdated={loadData}
            isAdmin={isAdmin}
          />
        )}

        {/* TAB 4: CUSTOMERS (Admin Only - Hidden for Salesperson) */}
        {activeTab === "customers" && isAdmin && (
          <CustomerManagement />
        )}

        {/* TAB 5: COUPONS & OFFERS (Admin Only) */}
        {activeTab === "coupons" && isAdmin && (
          <CouponManagement />
        )}

        {/* TAB 6: SYSTEM SETTINGS (Admin Only) */}
        {activeTab === "settings" && isAdmin && (
          <PortalSettings onConfigUpdated={loadData} />
        )}
      </main>
    </div>
  );
};

export default PortalPage;
