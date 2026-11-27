import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiGlobe,
  FiClock,
  FiCheckCircle,
  FiLogOut,
  FiEdit2,
  FiSave,
  FiPackage,
  FiArrowRight,
  FiHeart,
  FiPlus,
  FiTrash2,
  FiCheck,
  FiHome,
  FiBriefcase,
  FiX,
  FiFileText,
  FiDownload,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiShield,
  FiHeadphones,
  FiHelpCircle,
  FiInfo,
  FiTag,
  FiShoppingCart,
} from "react-icons/fi";
import { FaFacebookSquare, FaLinkedin, FaTiktok } from "react-icons/fa";
import { GrInstagram } from "react-icons/gr";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { useCountry } from "../../context/CountryContext";
import { downloadInvoicePDF } from "../../services/pdfInvoiceGenerator";
import {
  CouponTicketCard,
  useLocalizedCoupons,
} from "../../components/common/CouponTicketStrip";
import InvoiceDocument from "../../components/portal/InvoiceDocument";
import QuickRfqModal from "../../components/home/QuickRfqModal";
import CountryFlag from "../../components/common/CountryFlag";
import { AedPrice } from "../../components/common/AedSymbol";
import {
  ContactHelpView,
  WarrantyAuthenticityView,
  HelpFaqView,
  AboutCompanyView,
} from "../../components/profile/AccountSupportViews";

const VALID_VIEWS = [
  "hub",
  "orders",
  "personal",
  "addresses",
  "wishlist",
  "coupons",
  "help",
  "warranty",
  "faq",
  "about",
];

const ADDRESS_COUNTRIES = [
  "United Arab Emirates",
  "Kenya",
  "Senegal",
  "Uganda",
  "Côte d'Ivoire",
  "Ghana",
  "Saudi Arabia",
  "Qatar",
  "Kuwait",
  "Oman",
  "Bahrain",
  "Mali",
  "Burkina Faso",
  "Nigeria",
  "Tanzania",
  "Other",
];

const ProfilePage = () => {
  const {
    user,
    isLoggedIn,
    orders = [],
    logout,
    updateProfile,
    saveAddress,
    deleteAddress,
    setDefaultAddress,
    openAuthModal,
  } = useCustomerAuth();

  const { wishlist = [], toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { activeCountry, publicCountries, switchCountry, countryPath } =
    useCountry();

  // URL-Synced Native Push View State so browser & phone Back navigate cleanly
  const [searchParams, setSearchParams] = useSearchParams();
  const rawViewParam = searchParams.get("view") || "hub";
  const activeView = VALID_VIEWS.includes(rawViewParam) ? rawViewParam : "hub";

  const [regionSheetOpen, setRegionSheetOpen] = useState(false);
  const [rfqOpen, setRfqOpen] = useState(false);

  // Invoice Modal & Feedback Toasts
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [reorderSuccessMsg, setReorderSuccessMsg] = useState("");
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");
  const [addressSuccessMsg, setAddressSuccessMsg] = useState("");
  const [copiedCoupon, setCopiedCoupon] = useState("");

  // Active Coupons (automatically localized to activeCountry currency & scope)
  const coupons = useLocalizedCoupons();

  // Personal Info Form
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
  });

  // Address Form
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressFormData, setAddressFormData] = useState({
    id: null,
    label: "Home",
    fullName: user?.fullName || "",
    phone: user?.phone || "",
    country: activeCountry.name || "United Arab Emirates",
    city: activeCountry.city || "Dubai",
    streetAddress: "",
    isDefault: true,
  });

  // Country options merged dynamically with Super Admin countries
  const countrySelectOptions = useMemo(() => {
    const set = new Set(ADDRESS_COUNTRIES);
    (publicCountries || []).forEach((c) => c?.name && set.add(c.name));
    return Array.from(set);
  }, [publicCountries]);

  // Saved addresses list
  const savedAddresses = useMemo(() => {
    if (!isLoggedIn) return [];
    if (Array.isArray(user?.addresses) && user.addresses.length > 0) {
      return user.addresses;
    }
    if (user?.shippingAddress) {
      return [
        {
          id: "default_addr",
          label: "Home",
          fullName: user.fullName || "Customer",
          phone: user.phone || "",
          country: user.country || activeCountry.name || "United Arab Emirates",
          city: user.city || activeCountry.city || "Dubai",
          streetAddress: user.shippingAddress,
          isDefault: true,
        },
      ];
    }
    return [];
  }, [user, isLoggedIn, activeCountry.name, activeCountry.city]);

  const firstName = user?.fullName
    ? String(user.fullName).trim().split(/\s+/)[0] || "Customer"
    : "Customer";

  const openSubView = (view) => {
    setIsEditingProfile(false);
    setIsEditingAddress(false);
    if (view === "hub") {
      setSearchParams({});
    } else {
      setSearchParams({ view });
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const goBackToHub = () => {
    setIsEditingProfile(false);
    setIsEditingAddress(false);
    setSearchParams({});
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  // Handlers
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    await updateProfile({
      fullName: profileFormData.fullName,
      phone: profileFormData.phone,
    });
    setIsEditingProfile(false);
    setProfileSuccessMsg("Personal details updated.");
    window.setTimeout(() => setProfileSuccessMsg(""), 3000);
  };

  const handleOpenAddAddress = () => {
    setAddressFormData({
      id: null,
      label: "Home",
      fullName: user?.fullName || "",
      phone: user?.phone || "",
      country: activeCountry.name || user?.country || "United Arab Emirates",
      city: activeCountry.city || "",
      streetAddress: "",
      isDefault: savedAddresses.length === 0,
    });
    setIsEditingAddress(true);
  };

  const handleOpenEditAddress = (addr) => {
    setAddressFormData({
      id: addr.id,
      label: addr.label || "Home",
      fullName: addr.fullName || user?.fullName || "",
      phone: addr.phone || user?.phone || "",
      country: addr.country || activeCountry.name || "United Arab Emirates",
      city: addr.city || "",
      streetAddress: addr.streetAddress || "",
      isDefault: Boolean(addr.isDefault),
    });
    setIsEditingAddress(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!addressFormData.streetAddress?.trim() || !addressFormData.city?.trim()) {
      alert("Please provide both city and street delivery address.");
      return;
    }
    await saveAddress(addressFormData);
    setIsEditingAddress(false);
    setAddressSuccessMsg("Delivery address saved.");
    window.setTimeout(() => setAddressSuccessMsg(""), 3000);
  };

  const handleDeleteAddress = async (addrId) => {
    if (window.confirm("Delete this delivery address?")) {
      await deleteAddress(addrId);
      setAddressSuccessMsg("Address removed.");
      window.setTimeout(() => setAddressSuccessMsg(""), 3000);
    }
  };

  const handleSetDefault = async (addrId) => {
    await setDefaultAddress(addrId);
    setAddressSuccessMsg("Default address updated.");
    window.setTimeout(() => setAddressSuccessMsg(""), 3000);
  };

  const handleReorder = (order) => {
    if (!order.items || order.items.length === 0) return;
    order.items.forEach((item) => {
      addToCart(item, item.quantity || 1, { openDrawer: true });
    });
    setReorderSuccessMsg(`Added ${order.items.length} item(s) to your cart.`);
    window.setTimeout(() => setReorderSuccessMsg(""), 3000);
  };

  const handleDownloadInvoice = (order) => {
    try {
      downloadInvoicePDF({
        ...order,
        invoiceNo: order.orderId || order.invoiceNo || "INV-001",
        customerName: order.customerName || user?.fullName || "Customer",
        customerPhone: order.phone || user?.phone || "N/A",
        customerEmail: order.email || user?.email || "",
        totalAmount: Number(order.total || 0),
        items: order.items || [],
      });
    } catch (err) {
      console.error("PDF Invoice download failed:", err);
    }
  };

  const handleCopyCoupon = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCoupon(code);
    window.setTimeout(() => setCopiedCoupon(""), 2000);
  };

  // Safe current view (redirect private views back to hub if user signs out)
  const effectiveView =
    !isLoggedIn && ["orders", "personal", "addresses"].includes(activeView)
      ? "hub"
      : activeView;

  const SUBVIEW_TITLES = {
    orders: `Orders (${orders.length})`,
    personal: "Personal Information",
    addresses: "Saved Addresses",
    wishlist: `My Wishlist (${wishlist.length})`,
    coupons: "Coupons & Offers",
    help: "Contact & Help",
    warranty: "Warranty & Authenticity",
    faq: "FAQs",
    about: "About E-ALL",
  };

  // Contextual right action for Mobile Push AppBar & Desktop Page Header
  const startEditPersonal = () => {
    setProfileFormData({
      fullName: user?.fullName || "",
      phone: user?.phone || "",
    });
    setIsEditingProfile(true);
  };

  const renderMobileRightAction = () => {
    if (effectiveView === "personal") {
      return isEditingProfile ? (
        <button
          type="button"
          onClick={() => setIsEditingProfile(false)}
          className="text-[13px] font-semibold text-slate-500 active:opacity-60 py-2 px-1 cursor-pointer"
        >
          Cancel
        </button>
      ) : (
        <button
          type="button"
          onClick={startEditPersonal}
          className="text-[13px] font-bold text-sky-700 active:opacity-60 py-2 px-1 cursor-pointer"
        >
          Edit
        </button>
      );
    }
    if (effectiveView === "addresses") {
      if (isEditingAddress) {
        return (
          <button
            type="button"
            onClick={() => setIsEditingAddress(false)}
            className="text-[13px] font-semibold text-slate-500 active:opacity-60 py-2 px-1 cursor-pointer"
          >
            Cancel
          </button>
        );
      }
      if (savedAddresses.length < 5) {
        return (
          <button
            type="button"
            onClick={handleOpenAddAddress}
            className="inline-flex items-center gap-0.5 text-[13px] font-bold text-sky-700 active:opacity-60 py-2 px-1 cursor-pointer"
          >
            <FiPlus className="text-sm" />
            <span>Add</span>
          </button>
        );
      }
    }
    return null;
  };

  const renderDesktopRightAction = () => {
    if (effectiveView === "personal" && !isEditingProfile) {
      return (
        <button
          type="button"
          onClick={startEditPersonal}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-xl border border-sky-200 transition cursor-pointer"
        >
          <FiEdit2 className="text-xs" />
          <span>Edit Profile</span>
        </button>
      );
    }
    if (
      effectiveView === "addresses" &&
      !isEditingAddress &&
      savedAddresses.length < 5
    ) {
      return (
        <button
          type="button"
          onClick={handleOpenAddAddress}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
        >
          <FiPlus className="text-xs" />
          <span>Add Address</span>
        </button>
      );
    }
    return null;
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] xl:min-h-screen bg-slate-50 pt-[81px] sm:pt-[93px] xl:pt-[142px] pb-8 sm:pb-14 text-left">
      {/* FULL-BLEED STICKY MOBILE PUSH APP BAR (< xl) FOR SUB-VIEWS */}
      {effectiveView !== "hub" && (
        <div className="xl:hidden sticky top-[52px] sm:top-[60px] z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="grid grid-cols-[88px_1fr_88px] items-center h-12 px-2">
            <button
              type="button"
              onClick={goBackToHub}
              aria-label="Back to Account"
              className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-sky-700 active:opacity-60 h-11 pl-1 pr-2 cursor-pointer"
            >
              <FiChevronLeft className="text-[20px] -ml-1 shrink-0" />
              <span>Account</span>
            </button>

            <h1 className="text-[14px] font-bold text-slate-900 text-center truncate tracking-tight">
              {SUBVIEW_TITLES[effectiveView]}
            </h1>

            <div className="flex items-center justify-end pr-1.5">
              {renderMobileRightAction()}
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-3xl mx-auto sm:px-6">
        {/* ================================================================= */}
        {/* MAIN VIEW: AIVI-INSPIRED ACCOUNT HUB (BOTH GUEST & LOGGED-IN)     */}
        {/* ================================================================= */}
        {effectiveView === "hub" ? (
          <div className="space-y-5">
            {/* FULL-BLEED BRAND GRADIENT HERO HEADER */}
            <div className="bg-linear-to-br from-slate-900 via-sky-950 to-sky-800 text-white px-4 pt-5 pb-6 sm:p-7 sm:rounded-3xl shadow-sm">
              {/* Top Greeting Row */}
              {isLoggedIn ? (
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-white font-black text-lg sm:text-xl flex items-center justify-center shrink-0">
                    {firstName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate">
                      Hello, {firstName}
                    </h1>
                    <p className="text-[11.5px] sm:text-xs text-sky-100/80 truncate mt-0.5">
                      {user?.email || user?.phone}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-white flex items-center justify-center text-xl shrink-0">
                      <FiUser />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                        Welcome to E-ALL
                      </h1>
                      <p className="text-[11.5px] text-sky-100/80 leading-snug">
                        Sign in to track orders, tax invoices &amp; saved addresses
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => openAuthModal("login", countryPath("/profile"))}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-white hover:bg-sky-50 text-slate-900 text-xs font-extrabold transition shadow-xs cursor-pointer"
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => openAuthModal("register", countryPath("/profile"))}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-white/15 hover:bg-white/22 text-white border border-white/25 text-xs font-bold transition cursor-pointer"
                    >
                      Create Account
                    </button>
                  </div>
                </div>
              )}

              {/* 2×2 TRANSLUCENT GLASS QUICK ACTION CARDS (AIVI Pattern) */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mt-5">
                {isLoggedIn ? (
                  <>
                    <button
                      type="button"
                      onClick={() => openSubView("orders")}
                      className="p-3.5 rounded-2xl bg-white/12 hover:bg-white/18 active:scale-[0.99] backdrop-blur-md border border-white/15 text-left transition flex flex-col justify-between min-h-[88px] cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <FiPackage className="text-lg text-sky-200" />
                        <span className="px-2 py-0.5 rounded-full bg-white text-slate-900 text-[10.5px] font-black font-mono leading-none">
                          {orders.length}
                        </span>
                      </div>
                      <div className="mt-2.5">
                        <p className="text-[13px] font-bold text-white leading-tight">
                          Orders &amp; Invoices
                        </p>
                        <p className="text-[10.5px] text-sky-100/75 mt-0.5">
                          Manage &amp; track
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => openSubView("wishlist")}
                      className="p-3.5 rounded-2xl bg-white/12 hover:bg-white/18 active:scale-[0.99] backdrop-blur-md border border-white/15 text-left transition flex flex-col justify-between min-h-[88px] cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <FiHeart className="text-lg text-rose-300" />
                        <span className="px-2 py-0.5 rounded-full bg-white text-slate-900 text-[10.5px] font-black font-mono leading-none">
                          {wishlist.length}
                        </span>
                      </div>
                      <div className="mt-2.5">
                        <p className="text-[13px] font-bold text-white leading-tight">
                          My Wishlist
                        </p>
                        <p className="text-[10.5px] text-sky-100/75 mt-0.5">
                          Saved devices
                        </p>
                      </div>
                    </button>

                    <Link
                      to={countryPath("/verify")}
                      className="p-3.5 rounded-2xl bg-white/12 hover:bg-white/18 active:scale-[0.99] backdrop-blur-md border border-white/15 text-left transition flex flex-col justify-between min-h-[88px]"
                    >
                      <FiShield className="text-lg text-emerald-300" />
                      <div className="mt-2.5">
                        <p className="text-[13px] font-bold text-white leading-tight">
                          Verify IMEI
                        </p>
                        <p className="text-[10.5px] text-sky-100/75 mt-0.5">
                          Check authenticity
                        </p>
                      </div>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setRfqOpen(true)}
                      className="p-3.5 rounded-2xl bg-white/12 hover:bg-white/18 active:scale-[0.99] backdrop-blur-md border border-white/15 text-left transition flex flex-col justify-between min-h-[88px] cursor-pointer"
                    >
                      <FiBriefcase className="text-lg text-orange-300" />
                      <div className="mt-2.5">
                        <p className="text-[13px] font-bold text-white leading-tight">
                          B2B Wholesale
                        </p>
                        <p className="text-[10.5px] text-sky-100/75 mt-0.5">
                          Bulk carton quotes
                        </p>
                      </div>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => openSubView("wishlist")}
                      className="p-3.5 rounded-2xl bg-white/12 hover:bg-white/18 active:scale-[0.99] backdrop-blur-md border border-white/15 text-left transition flex flex-col justify-between min-h-[84px] cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <FiHeart className="text-lg text-rose-300" />
                        <span className="px-2 py-0.5 rounded-full bg-white text-slate-900 text-[10.5px] font-black font-mono leading-none">
                          {wishlist.length}
                        </span>
                      </div>
                      <div className="mt-2">
                        <p className="text-[13px] font-bold text-white leading-tight">
                          My Wishlist
                        </p>
                        <p className="text-[10.5px] text-sky-100/75 mt-0.5">
                          Saved devices
                        </p>
                      </div>
                    </button>

                    <Link
                      to={countryPath("/verify")}
                      className="p-3.5 rounded-2xl bg-white/12 hover:bg-white/18 active:scale-[0.99] backdrop-blur-md border border-white/15 text-left transition flex flex-col justify-between min-h-[84px]"
                    >
                      <FiShield className="text-lg text-emerald-300" />
                      <div className="mt-2">
                        <p className="text-[13px] font-bold text-white leading-tight">
                          Verify IMEI
                        </p>
                        <p className="text-[10.5px] text-sky-100/75 mt-0.5">
                          Warranty check
                        </p>
                      </div>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setRfqOpen(true)}
                      className="p-3.5 rounded-2xl bg-white/12 hover:bg-white/18 active:scale-[0.99] backdrop-blur-md border border-white/15 text-left transition flex flex-col justify-between min-h-[84px] cursor-pointer"
                    >
                      <FiBriefcase className="text-lg text-orange-300" />
                      <div className="mt-2">
                        <p className="text-[13px] font-bold text-white leading-tight">
                          B2B Quote
                        </p>
                        <p className="text-[10.5px] text-sky-100/75 mt-0.5">
                          Bulk &amp; export
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => openSubView("coupons")}
                      className="p-3.5 rounded-2xl bg-white/12 hover:bg-white/18 active:scale-[0.99] backdrop-blur-md border border-white/15 text-left transition flex flex-col justify-between min-h-[84px] cursor-pointer"
                    >
                      <FiTag className="text-lg text-amber-300" />
                      <div className="mt-2">
                        <p className="text-[13px] font-bold text-white leading-tight">
                          Offers &amp; Codes
                        </p>
                        <p className="text-[10.5px] text-sky-100/75 mt-0.5">
                          {coupons.length} active promos
                        </p>
                      </div>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* GROUPED LIST SECTIONS (Clean iOS / AIVI Surface Cards) */}
            <div className="px-4 sm:px-0 space-y-5">
              {/* SECTION 1: MY ACCOUNT (PERSONAL — LOGGED IN ONLY) */}
              {isLoggedIn && (
                <section>
                  <h2 className="text-xs font-bold text-slate-500 px-1 mb-2">
                    My Account
                  </h2>
                  <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
                    <MenuRow
                      icon={FiUser}
                      label="Personal Information"
                      onClick={() => {
                        setProfileFormData({
                          fullName: user?.fullName || "",
                          phone: user?.phone || "",
                        });
                        setIsEditingProfile(false);
                        openSubView("personal");
                      }}
                    />
                    <MenuRow
                      icon={FiMapPin}
                      label="Addresses"
                      meta={
                        savedAddresses.length > 0
                          ? `${savedAddresses.length} saved`
                          : "Add address"
                      }
                      onClick={() => {
                        setIsEditingAddress(false);
                        openSubView("addresses");
                      }}
                    />
                    <MenuRow
                      icon={FiTag}
                      label="Coupons & Offers"
                      meta={`${coupons.length} available`}
                      onClick={() => openSubView("coupons")}
                    />
                  </div>
                </section>
              )}

              {/* SECTION 2: SUPPORT (NATIVE MOBILE SUB-VIEWS — ZERO NAVIGATION TRAP) */}
              <section>
                <h2 className="text-xs font-bold text-slate-500 px-1 mb-2">
                  Support
                </h2>
                <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
                  <MenuRow
                    icon={FiHeadphones}
                    label="Contact & Help"
                    meta="WhatsApp · Call"
                    onClick={() => openSubView("help")}
                  />
                  <MenuRow
                    icon={FiShield}
                    label="Warranty & Authenticity"
                    meta="IMEI · Care"
                    onClick={() => openSubView("warranty")}
                  />
                  <MenuRow
                    icon={FiHelpCircle}
                    label="FAQs"
                    onClick={() => openSubView("faq")}
                  />
                  <MenuRow
                    icon={FiInfo}
                    label="About E-ALL"
                    onClick={() => openSubView("about")}
                  />
                </div>
              </section>

              {/* SECTION 3: PREFERENCES (GENERAL — ALL USERS) */}
              <section>
                <h2 className="text-xs font-bold text-slate-500 px-1 mb-2">
                  Preferences
                </h2>
                <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setRegionSheetOpen(true)}
                    className="w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 active:bg-slate-100 transition text-left cursor-pointer"
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <FiGlobe className="text-[18px] text-slate-600 shrink-0" />
                      <span className="text-[13.5px] font-semibold text-slate-900">
                        Country &amp; Region
                      </span>
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      <CountryFlag code={activeCountry.code} className="w-5 h-3.5" />
                      <span className="text-xs font-semibold text-slate-600">
                        {activeCountry.shortName} · {activeCountry.currency}
                      </span>
                      <FiChevronRight className="text-slate-400 text-base" />
                    </span>
                  </button>

                  {/* Social Links Row */}
                  <div className="px-4 py-3 flex items-center justify-between gap-3">
                    <span className="text-[12.5px] font-semibold text-slate-600">
                      Follow E-ALL
                    </span>
                    <div className="flex items-center gap-4 text-lg">
                      <a
                        href="https://facebook.com/"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Facebook"
                        className="text-sky-600 hover:opacity-80 transition"
                      >
                        <FaFacebookSquare />
                      </a>
                      <a
                        href="https://instagram.com/eall.global"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Instagram"
                        className="text-pink-500 hover:opacity-80 transition"
                      >
                        <GrInstagram />
                      </a>
                      <a
                        href="https://linkedin.com"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="LinkedIn"
                        className="text-sky-700 hover:opacity-80 transition"
                      >
                        <FaLinkedin />
                      </a>
                      <a
                        href="https://tiktok.com/@eall.global"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="TikTok"
                        className="text-slate-800 hover:opacity-80 transition"
                      >
                        <FaTiktok />
                      </a>
                    </div>
                  </div>
                </div>
              </section>

              {/* SAFE BOTTOM SIGN OUT CARD (LOGGED-IN ONLY) */}
              {isLoggedIn && (
                <section className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      goBackToHub();
                    }}
                    className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-rose-50 border border-slate-200/80 hover:border-rose-200 text-rose-600 text-[13.5px] font-bold flex items-center justify-center gap-2 transition shadow-[0_1px_2px_rgba(15,23,42,0.03)] cursor-pointer"
                  >
                    <FiLogOut className="text-base" />
                    <span>Sign Out</span>
                  </button>
                </section>
              )}

              {/* Subtle Mobile App Footer Caption (Desktop shows global Footer) */}
              <p className="xl:hidden text-center text-[11px] font-medium text-slate-400 pt-1 pb-2">
                E-ALL Electronics · Official Retail &amp; Wholesale
              </p>
            </div>
          </div>
        ) : (
          /* ================================================================= */
          /* DRILL-DOWN SUB-VIEWS (Mobile Push AppBar above | Desktop Crumbs)  */
          /* ================================================================= */
          <div className="px-4 sm:px-0 pt-4 xl:pt-0 space-y-4">
            {/* Desktop Clickable Breadcrumbs + Contextual Title Bar (xl+) */}
            <div className="hidden xl:block space-y-2.5 pb-3 border-b border-slate-200/80">
              <nav
                aria-label="Breadcrumb"
                className="flex items-center gap-1.5 text-xs text-slate-500 font-medium"
              >
                <Link
                  to={countryPath("/")}
                  className="hover:text-sky-700 transition"
                >
                  Home
                </Link>
                <FiChevronRight className="text-slate-300 text-sm" />
                <button
                  type="button"
                  onClick={goBackToHub}
                  className="hover:text-sky-700 transition cursor-pointer"
                >
                  Account
                </button>
                <FiChevronRight className="text-slate-300 text-sm" />
                <span className="text-slate-900 font-bold">
                  {SUBVIEW_TITLES[effectiveView]}
                </span>
              </nav>

              <div className="flex items-center justify-between gap-4">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  {SUBVIEW_TITLES[effectiveView]}
                </h1>
                {renderDesktopRightAction()}
              </div>
            </div>

            {reorderSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
                <FiCheckCircle className="text-base shrink-0 text-emerald-600" />
                <span>{reorderSuccessMsg}</span>
              </div>
            )}

            {/* ---------------- SUB-VIEW: ORDERS & INVOICES ---------------- */}
            {effectiveView === "orders" && (
              <div className="space-y-3.5">
                {orders.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center mx-auto text-xl">
                      <FiPackage />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">
                      No Orders Placed Yet
                    </h3>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Your purchase history, official invoices, and tracking updates will appear here.
                    </p>
                    <Link
                      to={countryPath("/products")}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-xl transition mt-1"
                    >
                      <span>Start Shopping</span>
                      <FiArrowRight />
                    </Link>
                  </div>
                ) : (
                  orders.map((order) => {
                    const orderCur = order.currency || activeCountry.currency || "AED";
                    const invoiceData = {
                      ...order,
                      invoiceNo: order.orderId || order.invoiceNo || "INV-001",
                      customerName: order.customerName || user?.fullName || "Customer",
                      customerPhone: order.phone || user?.phone || "N/A",
                      customerEmail: order.email || user?.email || "",
                      totalAmount: Number(order.total || 0),
                      items: order.items || [],
                    };

                    return (
                      <div
                        key={order.orderId}
                        className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3.5"
                      >
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-bold text-xs text-slate-900">
                                {order.orderId}
                              </span>
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9.5px] font-bold rounded-full uppercase">
                                {order.status || "Order Placed"}
                              </span>
                            </div>
                            <p className="text-[10.5px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                              <FiClock className="text-xs" />
                              <span>
                                {new Date(order.createdAt).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[9.5px] uppercase font-bold text-slate-400 block">
                              Total
                            </span>
                            <span className="text-sm font-black text-slate-900 font-mono">
                              {orderCur} {Number(order.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        <div className="divide-y divide-slate-100">
                          {order.items?.map((item, idx) => (
                            <div
                              key={idx}
                              className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-2.5 text-xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={item.image || "/logo.png"}
                                  alt={item.name}
                                  className="w-9 h-9 object-contain bg-slate-50 rounded-lg p-1 border border-slate-100 shrink-0"
                                />
                                <div className="min-w-0">
                                  <span className="font-bold text-slate-900 block truncate">
                                    {item.name}
                                  </span>
                                  <span className="text-[10.5px] text-slate-500 font-mono">
                                    Qty: {item.quantity} × {orderCur}{" "}
                                    {Number(item.price || 0).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <span className="font-bold text-slate-900 shrink-0 font-mono text-xs">
                                {orderCur}{" "}
                                {(
                                  Number(item.price || 0) * (item.quantity || 1)
                                ).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>

                        {order.shippingAddress && (
                          <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 text-[11px] text-slate-600 flex items-center gap-2">
                            <FiMapPin className="text-sky-700 shrink-0" />
                            <span className="truncate">
                              {[order.shippingAddress, order.city, order.country]
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setSelectedInvoiceOrder(invoiceData)}
                            className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition cursor-pointer"
                          >
                            <FiFileText className="text-sky-700" />
                            <span>Invoice</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadInvoice(order)}
                            className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold border border-sky-200 transition cursor-pointer"
                          >
                            <FiDownload className="text-sky-700" />
                            <span>PDF</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReorder(order)}
                            className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold transition cursor-pointer"
                          >
                            <FiRefreshCw className="text-[11px]" />
                            <span>Buy Again</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ---------------- SUB-VIEW: PERSONAL INFORMATION ---------------- */}
            {effectiveView === "personal" && (
              <div className="space-y-3.5">
                {profileSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
                    <FiCheckCircle className="shrink-0 text-emerald-600" />
                    <span>{profileSuccessMsg}</span>
                  </div>
                )}

                {!isEditingProfile ? (
                  <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
                    <div className="px-4 py-3.5 flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                        <FiUser className="text-base" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] font-medium text-slate-400 block">
                          Full Name
                        </span>
                        <p className="text-[13.5px] font-bold text-slate-900 truncate mt-0.5">
                          {user?.fullName || "Not specified"}
                        </p>
                      </div>
                    </div>

                    <div className="px-4 py-3.5 flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                        <FiMail className="text-base" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] font-medium text-slate-400 block">
                          Email Address
                        </span>
                        <p className="text-[13.5px] font-bold text-slate-900 font-mono truncate mt-0.5">
                          {user?.email}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                        <FiCheck className="text-[10px]" /> Verified
                      </span>
                    </div>

                    <div className="px-4 py-3.5 flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <FiPhone className="text-base" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] font-medium text-slate-400 block">
                          Phone Number
                        </span>
                        <p className="text-[13.5px] font-bold text-slate-900 font-mono mt-0.5">
                          {user?.phone || "No phone linked"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSaveProfile}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-3.5 text-xs"
                  >
                    <div>
                      <label className="block font-bold text-slate-600 text-[11px] mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={profileFormData.fullName}
                        onChange={(e) =>
                          setProfileFormData({
                            ...profileFormData,
                            fullName: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-sky-700"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 text-[11px] mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profileFormData.phone}
                        onChange={(e) =>
                          setProfileFormData({
                            ...profileFormData,
                            phone: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 font-mono outline-none focus:border-sky-700"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="submit"
                        className="flex-1 sm:flex-none px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-xl text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FiSave /> Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* ---------------- SUB-VIEW: SAVED ADDRESSES ---------------- */}
            {effectiveView === "addresses" && (
              <div className="space-y-3.5">
                {addressSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
                    <FiCheckCircle className="shrink-0 text-emerald-600" />
                    <span>{addressSuccessMsg}</span>
                  </div>
                )}

                {isEditingAddress && (
                  <form
                    onSubmit={handleSaveAddress}
                    className="p-4 bg-white rounded-2xl border border-sky-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        {addressFormData.id ? "Edit Address" : "New Delivery Address"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditingAddress(false)}
                        className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        <FiX />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {["Home", "Work", "Warehouse", "Other"].map((lbl) => (
                        <button
                          key={lbl}
                          type="button"
                          onClick={() =>
                            setAddressFormData({ ...addressFormData, label: lbl })
                          }
                          className={`px-3 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                            addressFormData.label === lbl
                              ? "bg-sky-700 text-white border-sky-700"
                              : "bg-white text-slate-700 border-slate-300"
                          }`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        required
                        placeholder="Recipient Full Name"
                        value={addressFormData.fullName}
                        onChange={(e) =>
                          setAddressFormData({
                            ...addressFormData,
                            fullName: e.target.value,
                          })
                        }
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900"
                      />
                      <input
                        type="tel"
                        required
                        placeholder="Phone Number"
                        value={addressFormData.phone}
                        onChange={(e) =>
                          setAddressFormData({
                            ...addressFormData,
                            phone: e.target.value,
                          })
                        }
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-semibold font-mono text-slate-900"
                      />
                      <select
                        value={addressFormData.country}
                        onChange={(e) =>
                          setAddressFormData({
                            ...addressFormData,
                            country: e.target.value,
                          })
                        }
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900"
                      >
                        {countrySelectOptions.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        required
                        placeholder="City"
                        value={addressFormData.city}
                        onChange={(e) =>
                          setAddressFormData({
                            ...addressFormData,
                            city: e.target.value,
                          })
                        }
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900"
                      />
                    </div>

                    <textarea
                      rows={2}
                      required
                      placeholder="Street, Building, Flat / Office No"
                      value={addressFormData.streetAddress}
                      onChange={(e) =>
                        setAddressFormData({
                          ...addressFormData,
                          streetAddress: e.target.value,
                        })
                      }
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900"
                    />

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addressFormData.isDefault}
                        onChange={(e) =>
                          setAddressFormData({
                            ...addressFormData,
                            isDefault: e.target.checked,
                          })
                        }
                      />
                      <span className="font-semibold text-slate-700">
                        Set as default delivery address
                      </span>
                    </label>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-xl cursor-pointer"
                      >
                        Save Address
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingAddress(false)}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {savedAddresses.length === 0 && !isEditingAddress ? (
                  <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center space-y-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center mx-auto text-xl">
                      <FiMapPin />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">
                      No Saved Addresses Yet
                    </h3>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Save up to 5 home, office, or warehouse delivery addresses for faster checkout.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenAddAddress}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      <FiPlus /> Add Delivery Address
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedAddresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-4 rounded-2xl border space-y-2 shadow-[0_1px_2px_rgba(15,23,42,0.03)] ${
                          addr.isDefault
                            ? "bg-white border-sky-300 ring-1 ring-sky-100"
                            : "bg-white border-slate-200/80"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10.5px] font-bold text-slate-800 uppercase">
                              {addr.label === "Work" ? <FiBriefcase /> : <FiHome />}
                              {addr.label || "Home"}
                            </span>
                            {addr.isDefault && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {!addr.isDefault && (
                              <button
                                type="button"
                                onClick={() => handleSetDefault(addr.id)}
                                className="text-[11px] font-bold text-sky-700 hover:underline cursor-pointer"
                              >
                                Set Default
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenEditAddress(addr)}
                              className="p-1 text-slate-500 hover:text-sky-700 cursor-pointer"
                              aria-label="Edit address"
                            >
                              <FiEdit2 />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                              aria-label="Delete address"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs font-bold text-slate-900">
                          {addr.fullName}{" "}
                          <span className="font-mono font-normal text-slate-500 ml-1">
                            {addr.phone}
                          </span>
                        </p>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {addr.streetAddress}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {[addr.city, addr.country].filter(Boolean).join(", ")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ---------------- SUB-VIEW: MY WISHLIST ---------------- */}
            {effectiveView === "wishlist" && (
              <div className="space-y-3">
                {wishlist.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto text-xl">
                      <FiHeart />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Your Wishlist is Empty
                    </h3>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Tap the heart icon on any device to save it here for quick access.
                    </p>
                    <Link
                      to={countryPath("/products")}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
                    >
                      <span>Explore Products</span>
                      <FiArrowRight />
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {wishlist.map((prod) => (
                      <div
                        key={prod.slug || prod.id}
                        className="bg-white rounded-2xl p-3.5 border border-slate-200/80 flex items-center gap-3"
                      >
                        <Link
                          to={countryPath(`/products/${prod.slug}`)}
                          className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 p-1.5 flex items-center justify-center shrink-0"
                        >
                          <img
                            src={prod.variants?.[0]?.image || prod.image || "/logo.png"}
                            alt={prod.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold uppercase text-sky-700">
                            {prod.brand}
                          </span>
                          <Link
                            to={countryPath(`/products/${prod.slug}`)}
                            className="block text-xs font-bold text-slate-900 truncate hover:text-sky-700"
                          >
                            {prod.name}
                          </Link>
                          <div className="mt-1">
                            <AedPrice
                              amount={prod.livePrice || prod.price || 0}
                              className="text-xs font-black text-slate-900 font-mono"
                            />
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => addToCart(prod, 1, { openDrawer: true })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-sky-700 text-white text-[11px] font-bold cursor-pointer"
                            >
                              <FiShoppingCart className="text-xs" /> Add to Cart
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleWishlist(prod)}
                              className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ---------------- SUB-VIEW: COUPONS & OFFERS ---------------- */}
            {effectiveView === "coupons" && (
              <div className="space-y-3">
                <div
                  className="rounded-2xl bg-[#091A32] p-2.5 sm:p-3 space-y-2.5 shadow-sm"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(135deg, rgba(14,165,233,0.09) 0px, rgba(14,165,233,0.09) 2px, transparent 2px, transparent 14px)",
                  }}
                >
                  {coupons.map((c, idx) => (
                    <CouponTicketCard
                      key={c.id || c.code}
                      coupon={c}
                      copied={copiedCoupon === c.code}
                      onCopy={handleCopyCoupon}
                      accentVariant={idx % 2 === 1 ? "highlight" : "primary"}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ---------------- SUPPORT SUB-VIEWS (NATIVE MOBILE) ---------------- */}
            {effectiveView === "help" && (
              <ContactHelpView onOpenRfq={() => setRfqOpen(true)} />
            )}

            {effectiveView === "warranty" && (
              <WarrantyAuthenticityView onNavigateView={openSubView} />
            )}

            {effectiveView === "faq" && (
              <HelpFaqView
                onNavigateView={openSubView}
                onOpenRfq={() => setRfqOpen(true)}
              />
            )}

            {effectiveView === "about" && (
              <AboutCompanyView onNavigateView={openSubView} />
            )}
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* NATIVE-STYLE COUNTRY & REGION BOTTOM SHEET                        */}
      {/* ================================================================= */}
      <AnimatePresence>
        {regionSheetOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRegionSheetOpen(false)}
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-[2px]"
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 340 }}
              className="relative z-10 w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden pb-[env(safe-area-inset-bottom,12px)]"
            >
              {/* Drag Handle */}
              <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
                <span className="w-10 h-1 rounded-full bg-slate-300" />
              </div>

              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Select Country &amp; Currency
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Local availability, pricing &amp; delivery options
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRegionSheetOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
                  aria-label="Close"
                >
                  <FiX />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100">
                {publicCountries.map((country) => {
                  const isSelected = country.code === activeCountry.code;
                  return (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => {
                        switchCountry(country.slug);
                        setRegionSheetOpen(false);
                      }}
                      className={`w-full px-5 py-3.5 flex items-center justify-between gap-3 text-left transition cursor-pointer ${
                        isSelected ? "bg-sky-50/80" : "hover:bg-slate-50"
                      }`}
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <CountryFlag code={country.code} className="w-6 h-4" />
                        <span className="min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate">
                            {country.name}
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate">
                            {country.city} · /{country.slug}
                          </span>
                        </span>
                      </span>

                      <span className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${
                            isSelected
                              ? "bg-sky-700 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {country.currency}
                        </span>
                        {isSelected && <FiCheck className="text-sky-700 text-base" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OFFICIAL INVOICE PREVIEW MODAL */}
      {selectedInvoiceOrder && (
        <InvoiceDocument
          invoice={selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}

      {/* B2B QUICK QUOTE MODAL */}
      <QuickRfqModal isOpen={rfqOpen} onClose={() => setRfqOpen(false)} />
    </div>
  );
};

const MenuRow = ({ icon: Icon, label, meta, onClick, to }) => {
  const inner = (
    <>
      <span className="flex items-center gap-3 min-w-0">
        {Icon && <Icon className="text-[18px] text-slate-600 shrink-0" />}
        <span className="text-[13.5px] font-semibold text-slate-900 truncate">
          {label}
        </span>
      </span>
      <span className="flex items-center gap-2 shrink-0">
        {meta && (
          <span className="text-[11.5px] font-medium text-slate-400">
            {meta}
          </span>
        )}
        <FiChevronRight className="text-slate-400 text-base" />
      </span>
    </>
  );

  const rowCls =
    "w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 active:bg-slate-100 transition text-left cursor-pointer";

  if (to) {
    return (
      <Link to={to} className={rowCls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={rowCls}>
      {inner}
    </button>
  );
};

export default ProfilePage;
