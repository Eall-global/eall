import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiGlobe,
  FiShoppingBag,
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
} from "react-icons/fi";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { downloadInvoicePDF } from "../../services/pdfInvoiceGenerator";
import InvoiceDocument from "../../components/portal/InvoiceDocument";

const COUNTRIES = [
  "United Arab Emirates",
  "Saudi Arabia",
  "Qatar",
  "Kuwait",
  "Oman",
  "Bahrain",
  "Senegal",
  "Côte d'Ivoire",
  "Mali",
  "Burkina Faso",
  "Guinea",
  "Other",
];

const ProfilePage = () => {
  const {
    user,
    isLoggedIn,
    orders,
    logout,
    updateProfile,
    saveAddress,
    deleteAddress,
    setDefaultAddress,
    openAuthModal,
  } = useCustomerAuth();

  const { wishlist } = useWishlist();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("orders"); // 'orders' | 'profile' | 'wishlist'

  // Invoice Modal State
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [reorderSuccessMsg, setReorderSuccessMsg] = useState("");

  // Personal Info Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
  });

  // Address Management State
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressFormData, setAddressFormData] = useState({
    id: null,
    label: "Home",
    fullName: user?.fullName || "",
    phone: user?.phone || "",
    country: user?.country || "United Arab Emirates",
    city: user?.city || "Dubai",
    streetAddress: user?.shippingAddress || "",
    isDefault: true,
  });

  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");
  const [addressSuccessMsg, setAddressSuccessMsg] = useState("");

  // Derive saved addresses list
  const savedAddresses = useMemo(() => {
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
          country: user.country || "United Arab Emirates",
          city: user.city || "Dubai",
          streetAddress: user.shippingAddress,
          isDefault: true,
        },
      ];
    }
    return [];
  }, [user]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 pt-28 sm:pt-36 pb-16 px-4 text-center">
        <div className="max-w-md mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center mx-auto text-2xl sm:text-3xl">
            <FiUser />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Sign In to View Your Profile</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Please log in or create an account to view your orders, manage delivery addresses, and track Wave transfers.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => openAuthModal("login", "/profile")}
              className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold uppercase rounded-xl transition shadow-xs cursor-pointer"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => openAuthModal("register", "/profile")}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold uppercase rounded-xl transition cursor-pointer"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle Save Personal Info
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    await updateProfile({
      fullName: profileFormData.fullName,
      phone: profileFormData.phone,
    });
    setIsEditingProfile(false);
    setProfileSuccessMsg("Personal details updated successfully!");
    setTimeout(() => setProfileSuccessMsg(""), 3000);
  };

  // Open Add Address
  const handleOpenAddAddress = () => {
    setAddressFormData({
      id: null,
      label: "Home",
      fullName: user?.fullName || "",
      phone: user?.phone || "",
      country: user?.country || "United Arab Emirates",
      city: "",
      streetAddress: "",
      isDefault: savedAddresses.length === 0,
    });
    setIsEditingAddress(true);
  };

  // Open Edit Address
  const handleOpenEditAddress = (addr) => {
    setAddressFormData({
      id: addr.id,
      label: addr.label || "Home",
      fullName: addr.fullName || user?.fullName || "",
      phone: addr.phone || user?.phone || "",
      country: addr.country || "United Arab Emirates",
      city: addr.city || "",
      streetAddress: addr.streetAddress || "",
      isDefault: Boolean(addr.isDefault),
    });
    setIsEditingAddress(true);
  };

  // Save Address
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!addressFormData.streetAddress || !addressFormData.city) {
      alert("Please provide both city and street delivery address.");
      return;
    }

    await saveAddress(addressFormData);
    setIsEditingAddress(false);
    setAddressSuccessMsg("Delivery address saved successfully!");
    setTimeout(() => setAddressSuccessMsg(""), 3000);
  };

  // Delete Address
  const handleDeleteAddress = async (addrId) => {
    if (window.confirm("Are you sure you want to delete this delivery address?")) {
      await deleteAddress(addrId);
      setAddressSuccessMsg("Address removed.");
      setTimeout(() => setAddressSuccessMsg(""), 3000);
    }
  };

  // Set Default
  const handleSetDefault = async (addrId) => {
    await setDefaultAddress(addrId);
    setAddressSuccessMsg("Default delivery address updated.");
    setTimeout(() => setAddressSuccessMsg(""), 3000);
  };

  // Re-Order items
  const handleReorder = (order) => {
    if (!order.items || order.items.length === 0) return;
    order.items.forEach((item) => {
      addToCart(item, item.quantity || 1, { openDrawer: true });
    });
    setReorderSuccessMsg(`Added ${order.items.length} items to your cart!`);
    setTimeout(() => setReorderSuccessMsg(""), 3000);
  };

  // Download Invoice PDF
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

  return (
    <div className="min-h-screen bg-slate-50 pt-24 sm:pt-28 lg:pt-32 pb-16 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* TOP PROFILE HERO CARD */}
        <div className="bg-linear-to-r from-slate-900 via-sky-950 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-sky-500/20 border border-sky-400/30 text-sky-300 font-black text-lg sm:text-xl flex items-center justify-center shrink-0">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-xl font-bold text-white truncate">
                  {user?.fullName || "Customer"}
                </h1>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded-full shrink-0">
                  Customer
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 font-mono mt-0.5 flex flex-wrap items-center gap-2 truncate">
                <span>{user?.email}</span>
                {user?.phone && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span>{user?.phone}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition cursor-pointer shrink-0 border border-white/10 self-start sm:self-auto"
          >
            <FiLogOut className="text-sm" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex border-b border-slate-200 gap-4 sm:gap-8 overflow-x-auto pb-px">
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap border-b-2 ${activeTab === "orders"
                ? "border-sky-700 text-sky-700"
                : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
          >
            <FiShoppingBag className="text-base" />
            <span>Orders ({orders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap border-b-2 ${activeTab === "profile"
                ? "border-sky-700 text-sky-700"
                : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
          >
            <FiUser className="text-base" />
            <span>Account Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("wishlist")}
            className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap border-b-2 ${activeTab === "wishlist"
                ? "border-sky-700 text-sky-700"
                : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
          >
            <FiHeart className="text-base" />
            <span>Wishlist ({wishlist.length})</span>
          </button>
        </div>

        {/* Reorder Notification Toast */}
        {reorderSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 shadow-xs">
            <FiCheckCircle className="text-base shrink-0 text-emerald-600" />
            <span>{reorderSuccessMsg}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 1: ORDER HISTORY WITH INVOICE ACTIONS & RE-ORDER      */}
        {/* ========================================================= */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl sm:rounded-3xl p-8 border border-slate-200 text-center space-y-3 shadow-2xs">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center mx-auto text-xl">
                  <FiPackage />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">No Orders Placed Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Your purchase history, invoices, and payment receipts will appear here once you place an order.
                </p>
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-xl transition shadow-2xs mt-2"
                >
                  <span>Explore Products</span>
                  <FiArrowRight />
                </Link>
              </div>
            ) : (
              orders.map((order) => {
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
                    className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4"
                  >
                    {/* Top Row: Order ID, Status, Timestamp & Total */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs sm:text-sm text-slate-900">
                            {order.orderId}
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full uppercase">
                            {order.status || "Order Placed"}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                          <FiClock className="text-xs" />
                          <span>
                            {new Date(order.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Amount</span>
                        <span className="text-xs sm:text-base font-black text-sky-950">
                          AED {Number(order.total || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="divide-y divide-slate-100">
                      {order.items?.map((item, idx) => (
                        <div
                          key={idx}
                          className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={item.image || "/logo.png"}
                              alt={item.name}
                              className="w-9 h-9 object-contain bg-slate-50 rounded-lg p-1 border border-slate-100 shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block truncate max-w-50 sm:max-w-xs">
                                {item.name}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                Qty: {item.quantity} × AED {Number(item.price || 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <span className="font-bold text-slate-900 shrink-0 font-mono">
                            AED {(Number(item.price || 0) * (item.quantity || 1)).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Order Footer Details */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FiMapPin className="text-sky-700 shrink-0" />
                        <span className="truncate max-w-sm">
                          {[order.shippingAddress, order.city, order.country].filter(Boolean).join(", ")}
                        </span>
                      </div>

                      {order.waveTransactionId && (
                        <div className="font-mono text-[10px] text-sky-800 bg-sky-100/70 px-2 py-0.5 rounded-md self-start sm:self-auto shrink-0">
                          <strong>Wave Ref:</strong> {order.waveTransactionId}
                        </div>
                      )}
                    </div>

                    {/* 🧾 INVOICE & RE-ORDER ACTION TOOLBAR */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* 1. View Invoice Modal Trigger */}
                        <button
                          type="button"
                          onClick={() => setSelectedInvoiceOrder(invoiceData)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition cursor-pointer shadow-2xs"
                        >
                          <FiFileText className="text-sky-700 text-sm" />
                          <span>View Invoice</span>
                        </button>

                        {/* 2. Download Official PDF Invoice Trigger */}
                        <button
                          type="button"
                          onClick={() => handleDownloadInvoice(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold transition border border-sky-200 cursor-pointer shadow-2xs"
                          title="Download Official Tax Invoice PDF"
                        >
                          <FiDownload className="text-sky-700 text-sm" />
                          <span>Download PDF</span>
                        </button>
                      </div>

                      {/* 3. Re-Order / Buy Again */}
                      <button
                        type="button"
                        onClick={() => handleReorder(order)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold transition shadow-2xs cursor-pointer ml-auto"
                      >
                        <FiRefreshCw className="text-xs" />
                        <span>Buy Again</span>
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: ACCOUNT DETAILS (SPLIT INTO 2 DEDICATED SECTIONS) */}
        {/* ========================================================= */}
        {activeTab === "profile" && (
          <div className="space-y-6">

            {/* -------------------------------------------------- */}
            {/* SECTION 1: PERSONAL PROFILE INFORMATION            */}
            {/* -------------------------------------------------- */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">Personal Information</h2>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Manage your profile name and primary contact details
                  </p>
                </div>

                {!isEditingProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileFormData({
                        fullName: user?.fullName || "",
                        phone: user?.phone || "",
                      });
                      setIsEditingProfile(true);
                    }}
                    className="inline-flex items-center self-start sm:self-auto gap-1.5 px-3.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-xl transition border border-sky-200 cursor-pointer shrink-0"
                  >
                    <FiEdit2 /> Edit Info
                  </button>
                )}
              </div>

              {profileSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <FiCheckCircle className="text-base shrink-0 text-emerald-600" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              {/* Read-Only Mode: Elegant Structured Info Cards */}
              {!isEditingProfile ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Full Name */}
                  <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <FiUser className="text-sky-600" /> Full Name
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {user?.fullName || "Not specified"}
                    </p>
                  </div>

                  {/* Email Address */}
                  <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1 overflow-hidden">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <FiMail className="text-sky-600" /> Email Address
                    </span>
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 truncate font-mono min-w-0">
                        {user?.email}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-md shrink-0">
                        <FiCheck className="text-[10px]" /> Verified
                      </span>
                    </div>
                  </div>

                  {/* Phone / Wave Number */}
                  <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <FiPhone className="text-emerald-600" /> Phone / Wave
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 font-mono truncate">
                      {user?.phone || "No phone linked"}
                    </p>
                  </div>
                </div>
              ) : (
                /* Editing Mode Form */
                <form onSubmit={handleSaveProfile} className="space-y-4 pt-1 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={profileFormData.fullName}
                        onChange={(e) =>
                          setProfileFormData({ ...profileFormData, fullName: e.target.value })
                        }
                        placeholder="Your Full Name"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold focus:border-sky-700 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
                        Phone / Wave Number
                      </label>
                      <input
                        type="tel"
                        value={profileFormData.phone}
                        onChange={(e) =>
                          setProfileFormData({ ...profileFormData, phone: e.target.value })
                        }
                        placeholder="+971 50 123 4567"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold focus:border-sky-700 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <FiSave /> Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* -------------------------------------------------- */}
            {/* SECTION 2: SAVED DELIVERY ADDRESSES (ADDRESS BOOK) */}
            {/* -------------------------------------------------- */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">Saved Delivery Addresses</h2>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Your shipping destinations for rapid checkout and deliveries
                  </p>
                </div>

                {!isEditingAddress && savedAddresses.length < 5 && (
                  <button
                    type="button"
                    onClick={handleOpenAddAddress}
                    className="inline-flex items-center self-start sm:self-auto gap-1.5 px-3.5 py-1.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-xl transition shadow-2xs cursor-pointer shrink-0"
                  >
                    <FiPlus /> Add Address
                  </button>
                )}
              </div>

              {addressSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <FiCheckCircle className="text-base shrink-0 text-emerald-600" />
                  <span>{addressSuccessMsg}</span>
                </div>
              )}

              {/* ✏️ ADD / EDIT ADDRESS INLINE FORM */}
              {isEditingAddress && (
                <div className="p-4 sm:p-5 bg-sky-50/40 rounded-2xl border border-sky-200/80 space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-sky-200/60 pb-2">
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                      <FiMapPin className="text-sky-700" />
                      <span>{addressFormData.id ? "Edit Delivery Address" : "Add New Delivery Address"}</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsEditingAddress(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                    >
                      <FiX className="text-sm" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveAddress} className="space-y-3.5">
                    {/* Address Label Pills */}
                    <div>
                      <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1.5">
                        Address Label
                      </label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {["Home", "Work", "Warehouse", "Other"].map((lbl) => (
                          <button
                            key={lbl}
                            type="button"
                            onClick={() => setAddressFormData({ ...addressFormData, label: lbl })}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition border cursor-pointer ${addressFormData.label === lbl
                                ? "bg-sky-700 text-white border-sky-700 shadow-2xs"
                                : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
                              }`}
                          >
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
                          Recipient Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={addressFormData.fullName}
                          onChange={(e) =>
                            setAddressFormData({ ...addressFormData, fullName: e.target.value })
                          }
                          placeholder="Recipient Name"
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold focus:border-sky-700 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
                          Delivery Phone Number
                        </label>
                        <input
                          type="tel"
                          required
                          value={addressFormData.phone}
                          onChange={(e) =>
                            setAddressFormData({ ...addressFormData, phone: e.target.value })
                          }
                          placeholder="+971 50 123 4567"
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold focus:border-sky-700 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
                          Country
                        </label>
                        <select
                          value={addressFormData.country}
                          onChange={(e) =>
                            setAddressFormData({ ...addressFormData, country: e.target.value })
                          }
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold focus:border-sky-700 focus:outline-none"
                        >
                          {COUNTRIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
                          City / Emirate
                        </label>
                        <input
                          type="text"
                          required
                          value={addressFormData.city}
                          onChange={(e) =>
                            setAddressFormData({ ...addressFormData, city: e.target.value })
                          }
                          placeholder="e.g. Dubai, Abu Dhabi, Dakar"
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold focus:border-sky-700 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
                        Street Address / Building / Apartment
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={addressFormData.streetAddress}
                        onChange={(e) =>
                          setAddressFormData({
                            ...addressFormData,
                            streetAddress: e.target.value,
                          })
                        }
                        placeholder="Street Name, Building Name, Flat/Office No, Landmark"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold focus:border-sky-700 focus:outline-none"
                      />
                    </div>

                    {/* Set Default Checkbox */}
                    <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={addressFormData.isDefault}
                        onChange={(e) =>
                          setAddressFormData({
                            ...addressFormData,
                            isDefault: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-sky-700 rounded border-slate-300 focus:ring-sky-500"
                      />
                      <span className="text-xs font-semibold text-slate-700">
                        Set as my default shipping address
                      </span>
                    </label>

                    <div className="flex items-center gap-2 pt-2 border-t border-sky-200/60">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <FiSave /> Save Address
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingAddress(false)}
                        className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition border border-slate-200 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* 🏠 SAVED ADDRESSES CARDS GRID */}
              {savedAddresses.length === 0 && !isEditingAddress ? (
                <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
                  <FiMapPin className="text-slate-400 text-2xl mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No Delivery Address Saved Yet</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Add your shipping address to enjoy rapid 1-click checkout on your next order.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAddAddress}
                    className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-700 text-white font-bold text-xs rounded-xl shadow-2xs hover:bg-sky-800 transition cursor-pointer"
                  >
                    <FiPlus /> Add First Address
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {savedAddresses.map((addr) => {
                    const isDefault = Boolean(addr.isDefault);
                    return (
                      <div
                        key={addr.id}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between gap-3 text-left relative ${isDefault
                            ? "bg-sky-50/30 border-sky-600 shadow-2xs ring-1 ring-sky-600/20"
                            : "bg-slate-50/70 border-slate-200/90 hover:border-slate-300"
                          }`}
                      >
                        <div className="space-y-2">
                          {/* Card Header: Label & Default Badge */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              {addr.label === "Work" ? (
                                <FiBriefcase className="text-slate-600 text-xs" />
                              ) : (
                                <FiHome className="text-slate-600 text-xs" />
                              )}
                              <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                                {addr.label || "Delivery Address"}
                              </span>
                            </div>

                            {isDefault && (
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-sky-800 bg-sky-100 border border-sky-300/60 px-2 py-0.5 rounded-full uppercase tracking-tight">
                                <FiCheck className="text-[10px]" /> Default
                              </span>
                            )}
                          </div>

                          {/* Recipient Details */}
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                              {addr.fullName}
                            </h4>
                            {addr.phone && (
                              <p className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                                <FiPhone className="text-[10px]" />
                                <span>{addr.phone}</span>
                              </p>
                            )}
                          </div>

                          {/* Street & Location */}
                          <div className="pt-1 text-[11px] text-slate-700 leading-relaxed">
                            <p className="font-medium text-slate-800 break-words">
                              {addr.streetAddress}
                            </p>
                            <p className="text-slate-500 mt-0.5 flex items-center gap-1">
                              <FiGlobe className="text-[10px] shrink-0" />
                              <span className="truncate">
                                {[addr.city, addr.country].filter(Boolean).join(", ")}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/80 text-xs">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleOpenEditAddress(addr)}
                              className="inline-flex items-center gap-1 text-slate-600 hover:text-sky-700 font-bold cursor-pointer text-[11px]"
                            >
                              <FiEdit2 className="text-xs" /> Edit
                            </button>

                            {!isDefault && (
                              <button
                                type="button"
                                onClick={() => handleSetDefault(addr.id)}
                                className="text-sky-700 hover:underline font-semibold cursor-pointer text-[11px]"
                              >
                                Set as Default
                              </button>
                            )}
                          </div>

                          {savedAddresses.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="inline-flex items-center gap-1 text-slate-400 hover:text-rose-600 font-medium cursor-pointer text-[11px]"
                              title="Delete Address"
                            >
                              <FiTrash2 className="text-xs" /> Delete
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: WISHLIST */}
        {/* ========================================================= */}
        {activeTab === "wishlist" && (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Saved Wishlist Items ({wishlist.length})
            </h2>

            {wishlist.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No items saved in wishlist.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {wishlist.map((item) => (
                  <div
                    key={item.slug}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3"
                  >
                    <img
                      src={item.image || "/logo.png"}
                      alt={item.name}
                      className="w-12 h-12 object-contain bg-white rounded-xl p-1 border border-slate-100 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[9.5px] font-bold text-sky-700 uppercase">
                        {item.brand}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 truncate">{item.name}</h4>
                      <Link
                        to={`/products/${item.slug}`}
                        className="text-[11px] text-sky-700 hover:underline font-semibold block mt-1"
                      >
                        View Product →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* 🧾 OFFICIAL INVOICE VIEW MODAL */}
      {selectedInvoiceOrder && (
        <InvoiceDocument
          invoice={selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
    </div>
  );
};

export default ProfilePage;
