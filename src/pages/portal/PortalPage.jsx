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
  FiRepeat,
  FiMapPin,
} from "react-icons/fi";
import { useStaffAuth } from "../../context/StaffAuthContext";
import { useCountry } from "../../context/CountryContext";
import { PortalThemeProvider } from "../../context/PortalThemeContext";
import { PortalCurrencyProvider } from "../../context/PortalCurrencyContext";
import PortalLogin from "../../components/portal/PortalLogin";
import PortalSidebar from "../../components/portal/PortalSidebar";
import PortalHeader from "../../components/portal/PortalHeader";
import StockTable from "../../components/portal/StockTable";
import StockTransfersManagement from "../../components/portal/StockTransfersManagement";
import LocationsManagement from "../../components/portal/LocationsManagement";
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
import {
  fetchStock,
  projectStockForLocation,
} from "../../services/stockService";
import { fetchTransfers } from "../../services/transferService";
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
  "locations",
  "customers",
  "coupons",
  "employees",
  "reports",
  "audits",
  "settings",
];

const PortalContent = () => {
  const {
    isAuthenticated,
    currentUser,
    members,
    role,
    isAdmin,
    isHubManager,
    assignedLocation,
    canSwitchLocations,
    logout,
  } = useStaffAuth();
  const { allLocations, getLocationByCode, urlCountrySlug } = useCountry();

  const [activeTab, setActiveTab] = useState("stock");
  const [selectedPortalLocation, setSelectedPortalLocation] = useState(() =>
    urlCountrySlug ? urlCountrySlug.toUpperCase() : "AE"
  );
  const [stock, setStock] = useState([]);
  const [transfers, setTransfers] = useState([]);
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
  const [transferPrefillSku, setTransferPrefillSku] = useState(null);

  // Enforce strict RBAC scoping: country staff are permanently locked to their assignedLocation
  const activePortalLocation = canSwitchLocations
    ? selectedPortalLocation
    : assignedLocation && assignedLocation !== "ALL"
    ? assignedLocation
    : "AE";

  const activeLocationConfig = useMemo(
    () =>
      getLocationByCode(
        activePortalLocation === "ALL" ? "AE" : activePortalLocation
      ),
    [getLocationByCode, activePortalLocation]
  );

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
      transfersData,
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
      fetchTransfers(),
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
      transfersData,
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
        transfersData,
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
      setTransfers(transfersData);
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
          transfersData,
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
        setTransfers(transfersData);
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
        const noopErr = () => {};
        const unSub1 = onSnapshot(
          collection(db, "product_stock"),
          () => syncFromSource(),
          noopErr
        );
        const unSub2 = onSnapshot(
          collection(db, "invoices"),
          () => syncFromSource(),
          noopErr
        );
        const unSub3 = onSnapshot(
          collection(db, "purchase_records"),
          () => syncFromSource(),
          noopErr
        );
        const unSub4 = onSnapshot(
          collection(db, "audit_logs"),
          () => syncFromSource(),
          noopErr
        );
        const unSub5 = onSnapshot(
          collection(db, "customer_orders"),
          () => syncFromSource(),
          noopErr
        );
        const unSub6 = onSnapshot(
          collection(db, "b2b_rfqs"),
          () => syncFromSource(),
          noopErr
        );
        const unSub7 = onSnapshot(
          collection(db, "imei_registry"),
          () => syncFromSource(),
          noopErr
        );
        const unSub8 = onSnapshot(
          collection(db, "pos_contacts"),
          () => syncFromSource(),
          noopErr
        );
        const unSub9 = onSnapshot(
          collection(db, "customers"),
          () => syncFromSource(),
          noopErr
        );
        const unSub10 = onSnapshot(
          collection(db, "landed_cost_sheets"),
          () => syncFromSource(),
          noopErr
        );
        const unSub11 = onSnapshot(
          collection(db, "staff_members"),
          () => syncFromSource(),
          noopErr
        );
        const unSub12 = onSnapshot(
          collection(db, "stock_transfers"),
          () => syncFromSource(),
          noopErr
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
          unSub11();
          unSub12();
        };
      } catch (e) {
        console.warn("Could not attach Firestore portal listener:", e);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, fetchPortalSnapshot]);

  // Multi-Warehouse & Country-Scoped Data Projections
  const scopedStock = useMemo(
    () =>
      projectStockForLocation(
        stock,
        activePortalLocation,
        activeLocationConfig
      ),
    [stock, activePortalLocation, activeLocationConfig]
  );

  const scopedOrders = useMemo(() => {
    if (activePortalLocation === "ALL") return onlineOrders;
    return onlineOrders.filter(
      (o) => String(o.countryCode || "AE").toUpperCase() === activePortalLocation
    );
  }, [onlineOrders, activePortalLocation]);

  const scopedInvoices = useMemo(() => {
    if (activePortalLocation === "ALL") return invoices;
    return invoices.filter(
      (inv) => String(inv.countryCode || "AE").toUpperCase() === activePortalLocation
    );
  }, [invoices, activePortalLocation]);

  const scopedTransfers = useMemo(() => {
    if (activePortalLocation === "ALL") return transfers;
    return transfers.filter(
      (t) =>
        t.sourceHub === activePortalLocation ||
        t.destinationCountry === activePortalLocation
    );
  }, [transfers, activePortalLocation]);

  const scopedLandedSheets = useMemo(() => {
    if (activePortalLocation === "ALL") return landedSheets;
    return landedSheets.filter(
      (s) => String(s.locationCode || "AE").toUpperCase() === activePortalLocation
    );
  }, [landedSheets, activePortalLocation]);

  const scopedPurchases = useMemo(() => {
    if (activePortalLocation === "ALL") return purchases;
    return purchases.filter(
      (p) => String(p.locationCode || "AE").toUpperCase() === activePortalLocation
    );
  }, [purchases, activePortalLocation]);

  // Alert indicators for sidebar
  const stockAlertCount = useMemo(
    () => scopedStock.filter((s) => s.quantity <= (s.minAlert ?? 3)).length,
    [scopedStock]
  );

  const pendingTransfersCount = useMemo(
    () =>
      scopedTransfers.filter((t) =>
        ["Pending Approval", "In Transit"].includes(t.status)
      ).length,
    [scopedTransfers]
  );

  const pendingOrdersCount = useMemo(
    () =>
      scopedOrders.filter((o) =>
        ["Order Placed", "Awaiting Wave Verification"].includes(o.status)
      ).length,
    [scopedOrders]
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
              activePortalLocation === "ALL"
                ? "Global multi-warehouse inventory across Dubai, China, HK & all country hubs"
                : `${activeLocationConfig.hubName} stock & ${activeLocationConfig.currency} pricing`,
            icon: FiPackage,
            badge: scopedStock.length,
            alertCount: stockAlertCount,
          },
          {
            id: "transfers",
            label: "Stock Transfers",
            description:
              "Inter-hub requisitions (Dubai / China / HK → Countries), AWB tracking & landed cost receiving",
            icon: FiRepeat,
            badge: scopedTransfers.length,
            alertCount: pendingTransfersCount,
          },
          {
            id: "orders",
            label: "Online Orders",
            description:
              "Storefront order fulfillment, regional payment verification & courier tracking",
            icon: FiShoppingBag,
            badge: scopedOrders.length,
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
              "Supplier procurement, inward goods, Excel/Invoice import & purchase vouchers",
            icon: FiTruck,
            badge: scopedPurchases.length,
          },
          {
            id: "landed_cost",
            label: "Landed Cost",
            description:
              activePortalLocation === "ALL"
                ? "Package logistics calculator, 1-piece landed price lookup & WAC stock sync"
                : `${activeLocationConfig.hubName} landed cost calculator (${activeLocationConfig.currency}), 1-piece lookup & WAC sync`,
            icon: FiPercent,
            badge: scopedLandedSheets.length,
          },
          {
            id: "billing",
            label: "Billing & POS",
            description:
              activePortalLocation === "ALL"
                ? "Point-of-sale checkout, Address Book, IMEI binding & multi-country VAT"
                : `Point-of-sale checkout (${activeLocationConfig.currency}), Address Book, IMEI binding & ${activeLocationConfig.shortName} ${activeLocationConfig.vatRate}% VAT`,
            icon: FiFileText,
          },
          {
            id: "invoices",
            label: "Sales & Invoices",
            description:
              "Revenue audit ledger, A4 tax invoices & stock reconciliation",
            icon: FiClipboard,
            badge: scopedInvoices.length,
          },
        ],
      },
    ];

    if (isAdmin) {
      groups.push({
        title: "Administration",
        items: [
          {
            id: "locations",
            label: "Countries & Hubs",
            description:
              "Launch new country storefronts (/ke, /tz, /ng), Tier-1 supply hubs, FX rates & VAT",
            icon: FiMapPin,
            badge: allLocations.length,
          },
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
              activePortalLocation === "ALL"
                ? "P&L margin analytics, tax summaries, brand performance & payables"
                : `P&L margin analytics (${activeLocationConfig.currency}), ${activeLocationConfig.shortName} ${activeLocationConfig.vatRate}% VAT return, brand performance & payables`,
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
    activePortalLocation,
    activeLocationConfig,
    allLocations.length,
    scopedStock.length,
    stockAlertCount,
    scopedTransfers.length,
    pendingTransfersCount,
    scopedOrders.length,
    pendingOrdersCount,
    rfqs.length,
    pendingRfqsCount,
    imeiRecords.length,
    openRmaCount,
    scopedPurchases.length,
    scopedLandedSheets.length,
    scopedInvoices.length,
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

  const handleRequestTransferForSku = useCallback((skuItem) => {
    setTransferPrefillSku(skuItem);
    setActiveTab("transfers");
    setViewingInvoice(null);
  }, []);

  if (!isAuthenticated) {
    return <PortalLogin />;
  }

  const isConnected = isFirebaseConfigured();

  return (
    <PortalCurrencyProvider
      locationConfig={activeLocationConfig}
      activeLocationCode={activePortalLocation}
    >
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
          activePortalLocation={activePortalLocation}
          activeLocationConfig={activeLocationConfig}
          allLocations={allLocations}
          canSwitchLocations={canSwitchLocations}
          onChangePortalLocation={setSelectedPortalLocation}
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

            {/* Stock Manager (Multi-Warehouse & Country Scoped) */}
            {currentTab === "stock" && (
              <StockTable
                stock={scopedStock}
                invoices={scopedInvoices}
                purchases={purchases}
                onStockChanged={loadData}
                onStockUpdated={loadData}
                isAdmin={isAdmin}
                activeLocationCode={activePortalLocation}
                activeLocationConfig={activeLocationConfig}
                onRequestTransfer={handleRequestTransferForSku}
              />
            )}

            {/* Inter-Hub Stock Transfers (Dubai AE / China CN / HK → Countries) */}
            {currentTab === "transfers" && (
              <StockTransfersManagement
                key={transferPrefillSku?.sku || "transfers-default"}
                transfers={transfers}
                globalStock={stock}
                activePortalLocation={activePortalLocation}
                currentUser={currentUser}
                isAdmin={isAdmin}
                isHubManager={isHubManager}
                canSwitchLocations={canSwitchLocations}
                prefillSku={transferPrefillSku}
                onClearPrefill={() => setTransferPrefillSku(null)}
                onTransfersUpdated={loadData}
              />
            )}

            {/* Online Storefront Orders & Fulfillment */}
            {currentTab === "orders" && (
              <OnlineOrdersManagement
                orders={scopedOrders}
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
                stock={scopedStock}
                purchases={purchases}
                invoices={scopedInvoices}
                onRecordsUpdated={loadData}
                onViewInvoice={(inv) => setViewingInvoice(inv)}
                currentUser={currentUser}
                isAdmin={isAdmin}
              />
            )}

            {/* Purchase Records */}
            {currentTab === "purchases" && (
              <PurchaseManagement
                stock={scopedStock}
                purchases={scopedPurchases}
                onPurchasesUpdated={loadData}
                currentUser={currentUser}
                isAdmin={isAdmin}
              />
            )}

            {/* Landed Cost Calculator & 1-Piece Price Lookup */}
            {currentTab === "landed_cost" && (
              <LandedCostCalculator
                key={activePortalLocation}
                stock={scopedStock}
                sheets={scopedLandedSheets}
                onDataUpdated={loadData}
                currentUser={currentUser}
                isAdmin={isAdmin}
              />
            )}

            {/* Billing & POS (Country-Scoped Local Stock + Read-Only Hub Availability) */}
            {currentTab === "billing" && (
              <BillingPOS
                key={`${activePortalLocation}-${posPrefill?.rfqId || "pos-default"}`}
                stock={scopedStock}
                customers={customers}
                posContacts={posContacts}
                invoices={scopedInvoices}
                rfqs={rfqs}
                coupons={coupons}
                imeiRecords={imeiRecords}
                prefillCustomer={posPrefill}
                onClearPrefill={() => setPosPrefill(null)}
                onContactsUpdated={loadData}
                activeLocationCode={activePortalLocation}
                activeLocationConfig={activeLocationConfig}
                onRequestTransfer={handleRequestTransferForSku}
                onInvoiceCreated={(newInv) => {
                  loadData();
                  setViewingInvoice(newInv);
                }}
              />
            )}

            {/* Sales & Invoices Audit */}
            {currentTab === "invoices" && (
              <InvoiceAudit
                invoices={scopedInvoices}
                stock={scopedStock}
                onViewInvoice={(inv) => setViewingInvoice(inv)}
                onInvoicesUpdated={loadData}
                isAdmin={isAdmin}
              />
            )}

            {/* Super Admin Countries, Supply Hubs & FX Control Center */}
            {currentTab === "locations" && isAdmin && <LocationsManagement />}

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
                stock={scopedStock}
                invoices={scopedInvoices}
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
    </PortalCurrencyProvider>
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
