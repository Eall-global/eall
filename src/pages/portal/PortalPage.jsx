import { useState, useEffect, useCallback, useMemo } from "react";
import {
  FiPackage,
  FiFileText,
  FiClipboard,
  FiSettings,
  FiUsers,
  FiTag,
  FiTruck,
  FiBriefcase,
  FiBarChart2,
  FiActivity,
  FiShoppingBag,
  FiGlobe,
  FiCpu,
  FiPercent,
} from "react-icons/fi";
import { useStaffAuth } from "../../context/StaffAuthContext";
import { PortalThemeProvider } from "../../context/PortalThemeContext";
import PortalLogin from "../../components/portal/PortalLogin";
import PortalSidebar from "../../components/portal/PortalSidebar";
import PortalHeader from "../../components/portal/PortalHeader";
import StockTable from "../../components/portal/StockTable";
import OnlineOrdersManagement from "../../components/portal/OnlineOrdersManagement";
import B2BRfqManagement from "../../components/portal/B2BRfqManagement";
import WarrantyImeiManagement from "../../components/portal/WarrantyImeiManagement";
import LandedCostCalculator from "../../components/portal/LandedCostCalculator";
import BillingPOS from "../../components/portal/BillingPOS";
import InvoiceAudit from "../../components/portal/InvoiceAudit";
import PurchaseManagement from "../../components/portal/PurchaseManagement";
import CustomerManagement from "../../components/portal/CustomerManagement";
import CouponManagement from "../../components/portal/CouponManagement";
import EmployeeManagement from "../../components/portal/EmployeeManagement";
import ReportsAnalytics from "../../components/portal/ReportsAnalytics";
import AuditLogs from "../../components/portal/AuditLogs";
import PortalSettings from "../../components/portal/PortalSettings";
import InvoiceDocument from "../../components/portal/InvoiceDocument";
import { fetchStock } from "../../services/stockService";
import { fetchOnlineOrders } from "../../services/orderService";
import { fetchAllRFQs } from "../../services/b2bService";
import { fetchImeiRegistry } from "../../services/warrantyService";
import { fetchLandedCostSheets } from "../../services/landedCostService";
import {
  fetchCustomersList,
  fetchPosContacts,
} from "../../services/customerService";
import { fetchCoupons } from "../../services/couponService";
import { fetchInvoices } from "../../services/billingService";
import { fetchPurchases } from "../../services/purchaseService";
import { fetchAuditLogs } from "../../services/auditService";
import {
  getFirebaseDb,
  isFirebaseConfigured,
  collection,
  onSnapshot,
} from "../../lib/firebaseClient";

const SIDEBAR_STORAGE_KEY = "eall_portal_sidebar_collapsed";
const ADMIN_ONLY_TABS = [
  "customers",
  "coupons",
  "employees",
  "reports",
  "audits",
  "settings",
];

const PortalContent = () => {
  const { isAuthenticated, currentUser, members, role, isAdmin, logout } =
    useStaffAuth();

  const [activeTab, setActiveTab] = useState("stock");
  const [stock, setStock] = useState([]);
  const [onlineOrders, setOnlineOrders] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [imeiRecords, setImeiRecords] = useState([]);
  const [landedSheets, setLandedSheets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [posContacts, setPosContacts] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [posPrefill, setPosPrefill] = useState(null);

  // Desktop collapsible sidebar state (persisted) & Mobile burger menu drawer state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // Ignore storage restrictions
      }
      return next;
    });
  }, []);

  // Keyboard shortcut: Ctrl/Cmd + B toggles desktop sidebar collapse
  useEffect(() => {
    if (!isAuthenticated) return;
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        const tag = document.activeElement?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        e.preventDefault();
        toggleSidebarCollapsed();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAuthenticated, toggleSidebarCollapsed]);

  const fetchPortalSnapshot = useCallback(async () => {
    const [
      stockData,
      ordersData,
      rfqsData,
      imeiData,
      landedData,
      customersData,
      posContactsData,
      couponsData,
      invoicesData,
      purchasesData,
      auditData,
    ] = await Promise.all([
      fetchStock(),
      fetchOnlineOrders(),
      fetchAllRFQs(),
      fetchImeiRegistry(),
      fetchLandedCostSheets(),
      fetchCustomersList(),
      fetchPosContacts(),
      fetchCoupons(),
      fetchInvoices(),
      fetchPurchases(),
      fetchAuditLogs(),
    ]);
    return {
      stockData,
      ordersData,
      rfqsData,
      imeiData,
      landedData,
      customersData,
      posContactsData,
      couponsData,
      invoicesData,
      purchasesData,
      auditData,
    };
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const {
        stockData,
        ordersData,
        rfqsData,
        imeiData,
        landedData,
        customersData,
        posContactsData,
        couponsData,
        invoicesData,
        purchasesData,
        auditData,
      } = await fetchPortalSnapshot();
      setStock(stockData);
      setOnlineOrders(ordersData);
      setRfqs(rfqsData);
      setImeiRecords(imeiData);
      setLandedSheets(landedData);
      setCustomers(customersData);
      setPosContacts(posContactsData);
      setCoupons(couponsData);
      setInvoices(invoicesData);
      setPurchases(purchasesData);
      setAuditLogs(auditData);
    } catch (err) {
      console.error("Failed to load portal data:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchPortalSnapshot]);

  // Real-time Cloud Firestore listener
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    const syncFromSource = async () => {
      try {
        const {
          stockData,
          ordersData,
          rfqsData,
          imeiData,
          landedData,
          customersData,
          posContactsData,
          couponsData,
          invoicesData,
          purchasesData,
          auditData,
        } = await fetchPortalSnapshot();
        if (cancelled) return;
        setStock(stockData);
        setOnlineOrders(ordersData);
        setRfqs(rfqsData);
        setImeiRecords(imeiData);
        setLandedSheets(landedData);
        setCustomers(customersData);
        setPosContacts(posContactsData);
        setCoupons(couponsData);
        setInvoices(invoicesData);
        setPurchases(purchasesData);
        setAuditLogs(auditData);
      } catch (err) {
        console.error("Failed to load portal data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    syncFromSource();

    const db = getFirebaseDb();
    if (db && isFirebaseConfigured()) {
      try {
        const unSub1 = onSnapshot(collection(db, "product_stock"), () => {
          syncFromSource();
        });
        const unSub2 = onSnapshot(collection(db, "invoices"), () => {
          syncFromSource();
        });
        const unSub3 = onSnapshot(collection(db, "purchase_records"), () => {
          syncFromSource();
        });
        const unSub4 = onSnapshot(collection(db, "audit_logs"), () => {
          syncFromSource();
        });
        const unSub5 = onSnapshot(collection(db, "customer_orders"), () => {
          syncFromSource();
        });
        const unSub6 = onSnapshot(collection(db, "b2b_rfqs"), () => {
          syncFromSource();
        });
        const unSub7 = onSnapshot(collection(db, "imei_registry"), () => {
          syncFromSource();
        });
        const unSub8 = onSnapshot(collection(db, "pos_contacts"), () => {
          syncFromSource();
        });
        const unSub9 = onSnapshot(collection(db, "customers"), () => {
          syncFromSource();
        });
        const unSub10 = onSnapshot(
          collection(db, "landed_cost_sheets"),
          () => {
            syncFromSource();
          }
        );

        return () => {
          cancelled = true;
          unSub1();
          unSub2();
          unSub3();
          unSub4();
          unSub5();
          unSub6();
          unSub7();
          unSub8();
          unSub9();
          unSub10();
        };
      } catch (e) {
        console.warn("Could not attach Firestore portal listener:", e);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, fetchPortalSnapshot]);

  // Alert indicators for sidebar
  const stockAlertCount = useMemo(
    () => stock.filter((s) => s.quantity <= (s.minAlert ?? 3)).length,
    [stock]
  );

  const pendingOrdersCount = useMemo(
    () =>
      onlineOrders.filter((o) =>
        ["Order Placed", "Awaiting Wave Verification"].includes(o.status)
      ).length,
    [onlineOrders]
  );

  const pendingRfqsCount = useMemo(
    () =>
      rfqs.filter((r) =>
        ["Pending Executive Review", "In Review"].includes(r.status)
      ).length,
    [rfqs]
  );

  const openRmaCount = useMemo(
    () => imeiRecords.filter((r) => r.status === "Warranty Claim").length,
    [imeiRecords]
  );

  const criticalAuditCount = useMemo(
    () => auditLogs.filter((l) => l.severity === "critical").length,
    [auditLogs]
  );

  // Enterprise 3-group sidebar IA: Operations | Administration | System
  const navGroups = useMemo(() => {
    const groups = [
      {
        title: "Operations",
        items: [
          {
            id: "stock",
            label: "Stock Manager",
            description:
              "Inventory valuation, pricing controls & real-time stock alerts",
            icon: FiPackage,
            badge: stock.length,
            alertCount: stockAlertCount,
          },
          {
            id: "orders",
            label: "Online Orders",
            description:
              "Storefront order fulfillment, Wave/COD verification & courier tracking",
            icon: FiShoppingBag,
            badge: onlineOrders.length,
            alertCount: pendingOrdersCount,
          },
          {
            id: "rfqs",
            label: "B2B Quotes",
            description:
              "Wholesale RFQ pipeline, Incoterms quotations & POS conversion",
            icon: FiGlobe,
            badge: rfqs.length,
            alertCount: pendingRfqsCount,
          },
          {
            id: "warranty",
            label: "IMEI & Warranty",
            description:
              "Serialized IMEI registry, warranty coverage countdowns & RMA claims",
            icon: FiCpu,
            badge: imeiRecords.length,
            alertCount: openRmaCount,
          },
          {
            id: "purchases",
            label: "Purchase Records",
            description:
              "Supplier procurement, inward goods & purchase vouchers",
            icon: FiTruck,
            badge: purchases.length,
          },
          {
            id: "landed_cost",
            label: "Landed Cost",
            description:
              "Package logistics calculator, 1-piece landed price lookup & WAC stock sync",
            icon: FiPercent,
            badge: landedSheets.length,
          },
          {
            id: "billing",
            label: "Billing & POS",
            description:
              "Point-of-sale checkout, Address Book, IMEI binding & UAE 5% VAT",
            icon: FiFileText,
          },
          {
            id: "invoices",
            label: "Sales & Invoices",
            description:
              "Revenue audit ledger, A4 tax invoices & stock reconciliation",
            icon: FiClipboard,
            badge: invoices.length,
          },
        ],
      },
    ];

    if (isAdmin) {
      groups.push({
        title: "Administration",
        items: [
          {
            id: "customers",
            label: "Customers",
            description:
              "Registered client profiles, delivery addresses & lifetime spend",
            icon: FiUsers,
          },
          {
            id: "coupons",
            label: "Coupons & Offers",
            description:
              "Promotional discount codes, first-order rules & campaign status",
            icon: FiTag,
          },
          {
            id: "employees",
            label: "Employees",
            description:
              "Sales team directory, access PINs, sales attribution & commissions",
            icon: FiBriefcase,
            badge: members.length,
          },
          {
            id: "reports",
            label: "Reports & Finance",
            description:
              "P&L margin analytics, UAE 5% VAT return, brand performance & payables",
            icon: FiBarChart2,
          },
          {
            id: "audits",
            label: "Audit Logs",
            description:
              "Immutable trail of stock edits, pricing changes, voids & staff activity",
            icon: FiActivity,
            badge: auditLogs.length,
            alertCount: criticalAuditCount,
          },
        ],
      });

      groups.push({
        title: "System",
        items: [
          {
            id: "settings",
            label: "System & Settings",
            description:
              "Workspace preferences, Firebase sync & Google Shopping / SEO feeds",
            icon: FiSettings,
          },
        ],
      });
    }

    return groups;
  }, [
    isAdmin,
    stock.length,
    stockAlertCount,
    onlineOrders.length,
    pendingOrdersCount,
    rfqs.length,
    pendingRfqsCount,
    imeiRecords.length,
    openRmaCount,
    purchases.length,
    landedSheets.length,
    invoices.length,
    members.length,
    auditLogs.length,
    criticalAuditCount,
  ]);

  // Derive safe active tab without cascading effect state updates
  const currentTab =
    !isAdmin && ADMIN_ONLY_TABS.includes(activeTab) ? "stock" : activeTab;

  const activeNavItem = useMemo(() => {
    for (const group of navGroups) {
      const found = group.items.find((item) => item.id === currentTab);
      if (found) return found;
    }
    return navGroups[0]?.items[0];
  }, [navGroups, currentTab]);

  const handleSelectTab = useCallback((tabId) => {
    setActiveTab(tabId);
    setViewingInvoice(null);
  }, []);

  const handleConvertRfqToPos = useCallback((prefill) => {
    setPosPrefill(prefill);
    setActiveTab("billing");
    setViewingInvoice(null);
  }, []);

  if (!isAuthenticated) {
    return <PortalLogin />;
  }

  const isConnected = isFirebaseConfigured();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans text-left transition-colors duration-200">
      {/* Desktop Collapsible Sidebar + Mobile Burger Drawer */}
      <PortalSidebar
        navGroups={navGroups}
        activeTab={currentTab}
        onSelectTab={handleSelectTab}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        currentUser={currentUser}
        role={role}
        isAdmin={isAdmin}
        isConnected={isConnected}
        onLogout={logout}
      />

      {/* Main Column: Sticky Header + Full-Width Content Canvas */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <PortalHeader
          activeItem={activeNavItem}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          mobileMenuOpen={mobileMenuOpen}
          isConnected={isConnected}
          loading={loading}
          onRefresh={loadData}
          onLogout={logout}
        />

        <main className="flex-1 w-full p-4 sm:p-5 lg:p-6">
          <div className="w-full">
            {/* Invoice Viewer Overlay / Full Modal */}
            {viewingInvoice && (
              <InvoiceDocument
                invoice={viewingInvoice}
                onClose={() => setViewingInvoice(null)}
              />
            )}

            {/* Stock Manager */}
            {currentTab === "stock" && (
              <StockTable
                stock={stock}
                invoices={invoices}
                purchases={purchases}
                onStockChanged={loadData}
                onStockUpdated={loadData}
                isAdmin={isAdmin}
              />
            )}

            {/* Online Storefront Orders & Fulfillment */}
            {currentTab === "orders" && (
              <OnlineOrdersManagement
                orders={onlineOrders}
                loading={loading}
                onOrdersUpdated={loadData}
                onViewInvoice={(ord) => setViewingInvoice(ord)}
                currentUser={currentUser}
              />
            )}

            {/* B2B Wholesale Quotes / RFQs */}
            {currentTab === "rfqs" && (
              <B2BRfqManagement
                rfqs={rfqs}
                onRfqsUpdated={loadData}
                onConvertToPOS={handleConvertRfqToPos}
                currentUser={currentUser}
                isAdmin={isAdmin}
              />
            )}

            {/* IMEI / Serial Number & Warranty Registry */}
            {currentTab === "warranty" && (
              <WarrantyImeiManagement
                records={imeiRecords}
                stock={stock}
                purchases={purchases}
                invoices={invoices}
                onRecordsUpdated={loadData}
                onViewInvoice={(inv) => setViewingInvoice(inv)}
                currentUser={currentUser}
                isAdmin={isAdmin}
              />
            )}

            {/* Purchase Records */}
            {currentTab === "purchases" && (
              <PurchaseManagement
                stock={stock}
                purchases={purchases}
                onPurchasesUpdated={loadData}
                currentUser={currentUser}
                isAdmin={isAdmin}
              />
            )}

            {/* Landed Cost Calculator & 1-Piece Price Lookup */}
            {currentTab === "landed_cost" && (
              <LandedCostCalculator
                stock={stock}
                sheets={landedSheets}
                onDataUpdated={loadData}
                currentUser={currentUser}
                isAdmin={isAdmin}
              />
            )}

            {/* Billing & POS */}
            {currentTab === "billing" && (
              <BillingPOS
                key={posPrefill?.rfqId || "pos-default"}
                stock={stock}
                customers={customers}
                posContacts={posContacts}
                invoices={invoices}
                rfqs={rfqs}
                coupons={coupons}
                imeiRecords={imeiRecords}
                prefillCustomer={posPrefill}
                onClearPrefill={() => setPosPrefill(null)}
                onContactsUpdated={loadData}
                onInvoiceCreated={(newInv) => {
                  loadData();
                  setViewingInvoice(newInv);
                }}
              />
            )}

            {/* Sales & Invoices Audit */}
            {currentTab === "invoices" && (
              <InvoiceAudit
                invoices={invoices}
                stock={stock}
                onViewInvoice={(inv) => setViewingInvoice(inv)}
                onInvoicesUpdated={loadData}
                isAdmin={isAdmin}
              />
            )}

            {/* Customers (Admin Only) */}
            {currentTab === "customers" && isAdmin && <CustomerManagement />}

            {/* Coupons & Offers (Admin Only) */}
            {currentTab === "coupons" && isAdmin && <CouponManagement />}

            {/* Employees & Sales Performance (Admin Only) */}
            {currentTab === "employees" && isAdmin && (
              <EmployeeManagement
                invoices={invoices}
                onViewInvoice={(inv) => setViewingInvoice(inv)}
              />
            )}

            {/* Reports & Financial Analytics (Admin Only) */}
            {currentTab === "reports" && isAdmin && (
              <ReportsAnalytics
                stock={stock}
                invoices={invoices}
                purchases={purchases}
              />
            )}

            {/* Activity & Audit Logs (Admin Only) */}
            {currentTab === "audits" && isAdmin && (
              <AuditLogs
                logs={auditLogs}
                loading={loading}
                onRefresh={loadData}
              />
            )}

            {/* System & Settings (Admin Only) */}
            {currentTab === "settings" && isAdmin && (
              <PortalSettings
                onConfigUpdated={loadData}
                sidebarCollapsed={sidebarCollapsed}
                onToggleSidebar={toggleSidebarCollapsed}
                onOpenEmployees={() => handleSelectTab("employees")}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

const PortalPage = () => {
  return (
    <PortalThemeProvider>
      <PortalContent />
    </PortalThemeProvider>
  );
};

export default PortalPage;
