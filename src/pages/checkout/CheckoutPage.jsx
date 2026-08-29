import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiShoppingCart,
  FiUser,
  FiMail,
  FiPhone,
  FiGlobe,
  FiMapPin,
  FiCheckCircle,
  FiArrowRight,
  FiShield,
  FiCopy,
  FiArrowLeft,
  FiCreditCard,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
  FiHome,
  FiBriefcase,
  FiTag,
  FiChevronDown,
  FiChevronUp,
  FiPercent,
  FiDollarSign,
} from "react-icons/fi";
import { FaApplePay, FaCcVisa, FaCcMastercard, FaApple } from "react-icons/fa";
import { useCart } from "../../context/CartContext";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import { adjustStockDelta } from "../../services/stockService";
import { WAVE_PAYMENT_CONFIG } from "../../constants/paymentConfig";
import { validateCouponCode, fetchCoupons } from "../../services/couponService";
import OrderSuccessModal from "../../components/checkout/OrderSuccessModal";
import { AedSymbol, AedPrice } from "../../components/common/AedSymbol";

const COUNTRIES = [
  "United Arab Emirates",
  "Senegal",
  "Côte d'Ivoire",
  "Mali",
  "Burkina Faso",
  "Gambia",
  "Uganda",
  "Ghana",
  "Nigeria",
  "Kenya",
  "Tanzania",
  "Saudi Arabia",
  "Oman",
];

// 🍏 Client-side Apple Device / Apple Pay detector
const checkIsAppleDevice = () => {
  if (typeof window === "undefined") return false;
  const ua = (window.navigator.userAgent || "").toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isMac = /macintosh|mac os x/.test(ua) && !window.MSStream;
  const hasAppleSession = Boolean(window.ApplePaySession && window.ApplePaySession.canMakePayments());
  return isIOS || isMac || hasAppleSession;
};

const CheckoutPage = () => {
  const { items, cartSubtotal, shippingFee, cartTotal, clearCart } = useCart();
  const {
    user,
    isLoggedIn,
    orders,
    openAuthModal,
    updateProfile,
    saveAddress,
    deleteAddress,
    addOrderToHistory,
  } = useCustomerAuth();
  const navigate = useNavigate();

  // Detect Apple Device for Apple Pay conditional rendering
  const isApple = useMemo(() => checkIsAppleDevice(), []);

  const [selectedPayment, setSelectedPayment] = useState(() => (checkIsAppleDevice() ? "apple_pay" : "wave"));
  const [waveTransactionId, setWaveTransactionId] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Address State
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressFormData, setAddressFormData] = useState({
    id: null,
    label: "Home",
    fullName: "",
    phone: "",
    country: "United Arab Emirates",
    city: "Dubai",
    streetAddress: "",
    isDefault: false,
  });
  const [addressSaveError, setAddressSaveError] = useState("");
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Coupon & Discount State
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMessage, setCouponMessage] = useState({ type: "", text: "" });
  const [showAvailableCoupons, setShowAvailableCoupons] = useState(false);
  const [availableCouponsList, setAvailableCouponsList] = useState([]);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Card Form Demo State
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });

  // Load active coupons for drawer
  useEffect(() => {
    fetchCoupons().then((list) => setAvailableCouponsList(list.filter((c) => c.isActive)));
  }, []);

  // Derive saved addresses list (Max 5)
  const savedAddresses = useMemo(() => {
    if (Array.isArray(user?.addresses) && user.addresses.length > 0) {
      return user.addresses.slice(0, 5);
    }
    if (user?.shippingAddress) {
      return [
        {
          id: "addr_primary",
          label: "Primary Address",
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

  // Initial Selected Address
  useEffect(() => {
    if (savedAddresses.length > 0 && !selectedAddressId) {
      const defaultAddr = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
      setSelectedAddressId(defaultAddr.id);
    }
  }, [savedAddresses, selectedAddressId]);

  const activeAddress = useMemo(() => {
    return savedAddresses.find((a) => a.id === selectedAddressId) || savedAddresses[0] || null;
  }, [savedAddresses, selectedAddressId]);

  // Recalculate Final Checkout Grand Total
  const finalPayableTotal = useMemo(() => {
    const discounted = Math.max(0, cartSubtotal - discountAmount);
    return discounted + shippingFee;
  }, [cartSubtotal, discountAmount, shippingFee]);

  // Auth Guard
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 pt-28 sm:pt-36 pb-16 px-4 text-center">
        <div className="max-w-md mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center mx-auto text-2xl sm:text-3xl">
            <FiUser />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Sign In to Proceed to Checkout</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Please log in or register with your delivery address to process your cart, save addresses, and apply discount vouchers.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => openAuthModal("login", "/checkout")}
              className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold uppercase rounded-xl transition shadow-xs cursor-pointer"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => openAuthModal("register", "/checkout")}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold uppercase rounded-xl transition cursor-pointer"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !placedOrder) {
    return (
      <div className="min-h-screen bg-slate-50 pt-28 sm:pt-36 pb-16 px-4 text-center">
        <div className="max-w-md mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-2xl sm:text-3xl">
            <FiShoppingCart />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">Your cart is empty</h2>
          <p className="text-xs text-slate-500">Please add items to your cart before checking out.</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-700 text-white font-bold text-xs uppercase rounded-xl hover:bg-sky-800 transition shadow-xs"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  // Address Handlers
  const handleOpenAddAddress = () => {
    setAddressFormData({
      id: null,
      label: "Home",
      fullName: user?.fullName || "",
      phone: user?.phone || "",
      country: user?.country || "United Arab Emirates",
      city: user?.city || "Dubai",
      streetAddress: "",
      isDefault: savedAddresses.length === 0,
    });
    setAddressSaveError("");
    setIsEditingAddress(true);
  };

  const handleOpenEditAddress = (addr, e) => {
    if (e) e.stopPropagation();
    setAddressFormData({
      id: addr.id,
      label: addr.label || "Home",
      fullName: addr.fullName || "",
      phone: addr.phone || "",
      country: addr.country || "United Arab Emirates",
      city: addr.city || "Dubai",
      streetAddress: addr.streetAddress || "",
      isDefault: Boolean(addr.isDefault),
    });
    setAddressSaveError("");
    setIsEditingAddress(true);
  };

  const handleSaveAddressForm = async (e) => {
    e.preventDefault();
    if (!addressFormData.streetAddress?.trim()) {
      setAddressSaveError("Please enter your complete street address.");
      return;
    }

    setIsSavingAddress(true);
    setAddressSaveError("");
    try {
      const saved = await saveAddress(addressFormData);
      if (saved?.id) {
        setSelectedAddressId(saved.id);
      }
      setIsEditingAddress(false);
    } catch (err) {
      setAddressSaveError(err.message || "Could not save address.");
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addrId, e) => {
    if (e) e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this saved delivery address?")) {
      await deleteAddress(addrId);
      if (selectedAddressId === addrId) {
        const remaining = savedAddresses.filter((a) => a.id !== addrId);
        if (remaining.length > 0) setSelectedAddressId(remaining[0].id);
      }
    }
  };

  // Coupon Verification & First Order Check
  const handleApplyCoupon = async (codeToApply) => {
    const raw = (codeToApply || couponInput || "").trim();
    if (!raw) return;

    setIsValidatingCoupon(true);
    setCouponMessage({ type: "", text: "" });

    try {
      const result = await validateCouponCode(raw, {
        user,
        orders,
        cartSubtotal,
      });

      if (result.valid) {
        setAppliedCoupon(result.coupon);
        setDiscountAmount(result.discountAmount);
        setCouponInput(result.coupon.code);
        setCouponMessage({ type: "success", text: result.message });
      } else {
        setAppliedCoupon(null);
        setDiscountAmount(0);
        setCouponMessage({ type: "error", text: result.message });
      }
    } catch (err) {
      setCouponMessage({ type: "error", text: "Failed to validate coupon code." });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponInput("");
    setCouponMessage({ type: "info", text: "Coupon removed." });
    setTimeout(() => setCouponMessage({ type: "", text: "" }), 3000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(WAVE_PAYMENT_CONFIG.merchantPhone);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Place Order Action
  const handlePlaceOrder = async (e) => {
    if (e) e.preventDefault();

    if (!activeAddress && !addressFormData.streetAddress) {
      alert("Please enter or select a delivery address.");
      setIsEditingAddress(true);
      return;
    }

    setSubmitting(true);

    const deliveryDetails = activeAddress || addressFormData;
    const orderId = `EALL-${selectedPayment.toUpperCase().replace(/[^A-Z0-9]/g, "")}-${Math.floor(100000 + Math.random() * 900000)}`;

    const paymentMethodNames = {
      apple_pay: "Apple Pay",
      card: "Debit / Credit Card",
      wave: "Wave Money Transfer",
      tabby: "Tabby (Pay in 4)",
      tamara: "Tamara (Pay in 6)",
      cod: "Cash on Delivery",
      wire: "Direct Wire / Bank Transfer",
    };

    const newOrder = {
      orderId,
      customerId: user.uid || user.id,
      customerName: deliveryDetails.fullName || user.fullName || "Customer",
      email: user.email,
      phone: deliveryDetails.phone || user.phone || "",
      country: deliveryDetails.country || "United Arab Emirates",
      city: deliveryDetails.city || "Dubai",
      shippingAddress: deliveryDetails.streetAddress,
      addressLabel: deliveryDetails.label || "Home",
      paymentMethod: selectedPayment,
      paymentMethodName: paymentMethodNames[selectedPayment] || selectedPayment,
      waveTransactionId: selectedPayment === "wave" ? waveTransactionId.trim() : null,
      appliedCoupon: appliedCoupon ? appliedCoupon.code : null,
      discountAmount: discountAmount,
      items: [...items],
      subtotal: cartSubtotal,
      shippingFee: shippingFee,
      total: finalPayableTotal,
      status: selectedPayment === "wave" ? "Awaiting Wave Verification" : "Order Placed",
      createdAt: new Date().toISOString(),
    };

    // 1. If coupon was applied, record in user's usedCoupons list in Firestore
    if (appliedCoupon) {
      const currentUsed = Array.isArray(user.usedCoupons) ? [...user.usedCoupons] : [];
      if (!currentUsed.includes(appliedCoupon.code)) {
        await updateProfile({
          usedCoupons: [...currentUsed, appliedCoupon.code],
          ordersCount: (user.ordersCount || 0) + 1,
        });
      }
    } else {
      await updateProfile({
        ordersCount: (user.ordersCount || 0) + 1,
      });
    }

    // 2. Adjust Stock Delta
    for (const item of items) {
      if (item.sku) {
        try {
          await adjustStockDelta(item.sku, -(item.quantity || 1));
        } catch (err) {
          console.warn(`Stock delta error for ${item.sku}:`, err);
        }
      }
    }

    // 3. Save Order to History & Firestore
    await addOrderToHistory(newOrder);

    setPlacedOrder(newOrder);
    clearCart();
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50/80 pt-24 sm:pt-28 lg:pt-32 pb-24 sm:pb-16 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div>
            <Link
              to="/cart"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-sky-700 font-semibold mb-1 transition"
            >
              <FiArrowLeft /> Back to Cart
            </Link>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <FiShield className="text-emerald-600 shrink-0" /> Checkout
            </h1>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-700 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto">
            <FiUser className="text-sky-700 shrink-0" />
            <span>LoggedIn as <strong className="text-slate-900">{user?.fullName || user?.email}</strong></span>
          </div>
        </div>

        {/* CHECKOUT FORM & SUMMARY GRID */}
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">

          {/* LEFT COLUMN: ADDRESS & PAYMENT OPTIONS */}
          <div className="lg:col-span-7 space-y-5">

            {/* STEP 1: SAVED ADDRESS SLIDER & MANAGER */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900">
                      Delivery Address
                    </h2>
                  </div>
                </div>

                {!isEditingAddress && savedAddresses.length < 5 && (
                  <button
                    type="button"
                    onClick={handleOpenAddAddress}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold transition cursor-pointer shrink-0"
                  >
                    <FiPlus className="text-sm" />
                    <span>Add New</span>
                  </button>
                )}
              </div>

              {/* 🏠 SAVED ADDRESS CARDS SLIDER */}
              {!isEditingAddress && savedAddresses.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-stretch gap-3 overflow-x-auto pb-2 snap-x scrollbar-thin">
                    {savedAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`min-w-[260px] sm:min-w-[280px] max-w-[320px] p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between shrink-0 snap-start ${isSelected
                              ? "bg-sky-50/70 border-sky-600 shadow-xs ring-1 ring-sky-500/20"
                              : "bg-white border-slate-200 hover:border-slate-300"
                            }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[10.5px] font-bold uppercase tracking-wider">
                                  {addr.label === "Work" || addr.label === "Office" ? (
                                    <FiBriefcase className="text-slate-500 text-xs" />
                                  ) : (
                                    <FiHome className="text-slate-500 text-xs" />
                                  )}
                                  {addr.label || "Address"}
                                </span>
                                {addr.isDefault && (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9.5px] font-extrabold">
                                    Default
                                  </span>
                                )}
                              </div>

                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "border-sky-600 bg-sky-600 text-white" : "border-slate-300 bg-white"
                                }`}>
                                {isSelected && <FiCheck className="text-[10px]" />}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-bold text-slate-900 text-xs truncate">
                                {addr.fullName}
                              </h4>
                              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                {addr.phone}
                              </p>
                              <p className="text-[11px] text-slate-700 line-clamp-2 mt-1 leading-relaxed">
                                {addr.streetAddress}
                              </p>
                              <p className="text-[10.5px] text-slate-400 mt-0.5 font-medium">
                                {[addr.city, addr.country].filter(Boolean).join(", ")}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100/80 text-xs">
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditAddress(addr, e)}
                              className="inline-flex items-center gap-1 text-slate-500 hover:text-sky-700 font-semibold cursor-pointer text-[11px]"
                            >
                              <FiEdit2 className="text-xs" /> Edit
                            </button>

                            {savedAddresses.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteAddress(addr.id, e)}
                                className="inline-flex items-center gap-1 text-slate-400 hover:text-rose-600 font-medium cursor-pointer text-[11px]"
                              >
                                <FiTrash2 className="text-xs" /> Delete
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {savedAddresses.length < 5 && (
                      <button
                        type="button"
                        onClick={handleOpenAddAddress}
                        className="min-w-[170px] p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-sky-500 hover:bg-sky-50/40 transition flex flex-col items-center justify-center gap-1.5 text-slate-500 hover:text-sky-700 cursor-pointer shrink-0 snap-start"
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                          <FiPlus className="text-base" />
                        </div>
                        <span className="text-xs font-bold">Add Address</span>
                        <span className="text-[10px] text-slate-400">({savedAddresses.length}/5 used)</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ✏️ ADD / EDIT ADDRESS FORM */}
              {(isEditingAddress || savedAddresses.length === 0) && (
                <div className="p-4 sm:p-5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                      <FiMapPin className="text-sky-700" />
                      {addressFormData.id ? "Edit Delivery Address" : "Add Delivery Address"}
                    </h3>
                    {savedAddresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsEditingAddress(false)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                      >
                        <FiX className="text-base" />
                      </button>
                    )}
                  </div>

                  {addressSaveError && (
                    <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                      {addressSaveError}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                        Address Label *
                      </label>
                      <div className="flex gap-2">
                        {["Home", "Office", "Warehouse"].map((lbl) => (
                          <button
                            key={lbl}
                            type="button"
                            onClick={() => setAddressFormData({ ...addressFormData, label: lbl })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${addressFormData.label === lbl
                                ? "bg-slate-900 text-white"
                                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                              }`}
                          >
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                        Recipient Full Name *
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Mohammed yafe"
                        value={addressFormData.fullName}
                        onChange={(e) => setAddressFormData({ ...addressFormData, fullName: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-sky-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                        Phone / Contact Number *
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="+971 56 817 2539"
                        value={addressFormData.phone}
                        onChange={(e) => setAddressFormData({ ...addressFormData, phone: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-sky-600 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                        Country *
                      </label>
                      <select
                        value={addressFormData.country}
                        onChange={(e) => setAddressFormData({ ...addressFormData, country: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-sky-600"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                        City / Emirate *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Dubai, Abu Dhabi, Dakar"
                        value={addressFormData.city}
                        onChange={(e) => setAddressFormData({ ...addressFormData, city: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-sky-600"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-4">
                      <input
                        type="checkbox"
                        id="isDefaultAddr"
                        checked={addressFormData.isDefault}
                        onChange={(e) => setAddressFormData({ ...addressFormData, isDefault: e.target.checked })}
                        className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                      />
                      <label htmlFor="isDefaultAddr" className="text-xs font-semibold text-slate-700 cursor-pointer">
                        Set as primary default address
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                      Street Address &amp; Delivery Instructions *
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="e.g. Al khaleej street Naif 2 opposite to Hyatt Regency Gold Souq Deira"
                      value={addressFormData.streetAddress}
                      onChange={(e) => setAddressFormData({ ...addressFormData, streetAddress: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-sky-600"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                    {savedAddresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsEditingAddress(false)}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-semibold transition"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveAddressForm}
                      disabled={isSavingAddress}
                      className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
                    >
                      {isSavingAddress ? "Saving..." : "Save Address"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2: NOON-STYLE "PAY WITH" METHODS */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-3.5">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Pay with
                </h2>
              </div>

              <div className="space-y-2 text-xs">

                {/* 🍏 1. APPLE PAY (CONDITIONAL: ONLY SHOWN IF ON APPLE DEVICE) */}
                {isApple && (
                  <div
                    onClick={() => setSelectedPayment("apple_pay")}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${selectedPayment === "apple_pay"
                        ? "bg-sky-50/80 border-sky-600 shadow-2xs ring-1 ring-sky-600/20"
                        : "bg-white border-slate-200/90 hover:border-slate-300"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="px-2.5 py-1 rounded-lg bg-black text-white font-black text-xs flex items-center gap-1">
                        <FaApple className="text-sm" /> <span>Pay</span>
                      </div>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">Apple Pay</span>
                    </div>

                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedPayment === "apple_pay" ? "border-sky-600 bg-sky-600 text-white" : "border-slate-300 bg-white"
                      }`}>
                      {selectedPayment === "apple_pay" && <FiCheck className="text-[10px]" />}
                    </div>
                  </div>
                )}

                {/* 💳 2. DEBIT / CREDIT CARD */}
                <div
                  onClick={() => setSelectedPayment("card")}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col gap-2.5 ${selectedPayment === "card"
                      ? "bg-sky-50/80 border-sky-600 shadow-2xs ring-1 ring-sky-600/20"
                      : "bg-white border-slate-200/90 hover:border-slate-300"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1">
                        <FiCreditCard className="text-sm" />
                        <span className="font-mono text-[10px]">CARD</span>
                      </div>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">Debit / Credit Card</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-sky-700 hover:underline">+ Add New</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedPayment === "card" ? "border-sky-600 bg-sky-600 text-white" : "border-slate-300 bg-white"
                        }`}>
                        {selectedPayment === "card" && <FiCheck className="text-[10px]" />}
                      </div>
                    </div>
                  </div>

                  {selectedPayment === "card" && (
                    <div className="pt-2 border-t border-sky-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <input
                        type="text"
                        placeholder="Card Number (0000 0000 0000 0000)"
                        value={cardDetails.number}
                        onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardDetails.expiry}
                          onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                          className="w-1/2 p-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-center"
                        />
                        <input
                          type="text"
                          placeholder="CVV"
                          maxLength={4}
                          value={cardDetails.cvv}
                          onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                          className="w-1/2 p-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-center"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 🌊 3. WAVE MONEY TRANSFER (AFRICAN MARKETS) */}
                <div
                  onClick={() => setSelectedPayment("wave")}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col gap-2.5 ${selectedPayment === "wave"
                      ? "bg-sky-50/80 border-sky-600 shadow-2xs ring-1 ring-sky-600/20"
                      : "bg-white border-slate-200/90 hover:border-slate-300"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center text-sm font-bold shrink-0">
                        🌊
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">Wave Money Transfer</span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-extrabold">
                            0% Fee Africa
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-400">Direct mobile transfer in Senegal, Côte d'Ivoire &amp; West Africa</p>
                      </div>
                    </div>

                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${selectedPayment === "wave" ? "border-sky-600 bg-sky-600 text-white" : "border-slate-300 bg-white"
                      }`}>
                      {selectedPayment === "wave" && <FiCheck className="text-[10px]" />}
                    </div>
                  </div>

                  {selectedPayment === "wave" && (
                    <div className="pt-2 border-t border-sky-200/60 p-3 bg-linear-to-br from-sky-950 to-slate-900 text-white rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[9.5px] text-sky-200 uppercase font-bold block">Merchant Wave Phone</span>
                          <span className="font-mono font-black text-white text-xs sm:text-sm">{WAVE_PAYMENT_CONFIG.merchantPhone}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold rounded-lg transition cursor-pointer"
                        >
                          {copiedCode ? "Copied" : "Copy Number"}
                        </button>
                      </div>

                      <div>
                        <label className="block text-[9.5px] font-bold uppercase text-sky-200 tracking-wider mb-1">
                          Wave Transaction Reference ID (Optional)
                        </label>
                        <input
                          type="text"
                          value={waveTransactionId}
                          onChange={(e) => setWaveTransactionId(e.target.value)}
                          placeholder="e.g. WV-90218492"
                          className="w-full p-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-slate-400 font-mono font-semibold focus:outline-none focus:border-sky-400"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 💳 4. TABBY (PAY IN 4) */}
                <div
                  onClick={() => setSelectedPayment("tabby")}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${selectedPayment === "tabby"
                      ? "bg-sky-50/80 border-sky-600 shadow-2xs ring-1 ring-sky-600/20"
                      : "bg-white border-slate-200/90 hover:border-slate-300"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-black text-[10.5px]">
                      tabby
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">Tabby</span>
                      <p className="text-[10.5px] text-slate-400">
                        Pay in 4 interest-free payments of <AedPrice amount={finalPayableTotal / 4} className="font-bold text-slate-700" />
                      </p>
                    </div>
                  </div>

                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedPayment === "tabby" ? "border-sky-600 bg-sky-600 text-white" : "border-slate-300 bg-white"
                    }`}>
                    {selectedPayment === "tabby" && <FiCheck className="text-[10px]" />}
                  </div>
                </div>

                {/* 💳 5. TAMARA (PAY IN 6) */}
                <div
                  onClick={() => setSelectedPayment("tamara")}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${selectedPayment === "tamara"
                      ? "bg-sky-50/80 border-sky-600 shadow-2xs ring-1 ring-sky-600/20"
                      : "bg-white border-slate-200/90 hover:border-slate-300"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-black text-[10.5px]">
                      tamara
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">Tamara</span>
                      <p className="text-[10.5px] text-slate-400">
                        Split into 6 payments of <AedPrice amount={finalPayableTotal / 6} className="font-bold text-slate-700" />
                      </p>
                    </div>
                  </div>

                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedPayment === "tamara" ? "border-sky-600 bg-sky-600 text-white" : "border-slate-300 bg-white"
                    }`}>
                    {selectedPayment === "tamara" && <FiCheck className="text-[10px]" />}
                  </div>
                </div>

                {/* 💵 6. CASH ON DELIVERY */}
                <div
                  onClick={() => setSelectedPayment("cod")}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${selectedPayment === "cod"
                      ? "bg-sky-50/80 border-sky-600 shadow-2xs ring-1 ring-sky-600/20"
                      : "bg-white border-slate-200/90 hover:border-slate-300"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono font-bold text-[10.5px]">
                      CASH
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">Cash On Delivery</span>
                      <p className="text-[10.5px] text-slate-400">Pay in cash upon doorstep delivery</p>
                    </div>
                  </div>

                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedPayment === "cod" ? "border-sky-600 bg-sky-600 text-white" : "border-slate-300 bg-white"
                    }`}>
                    {selectedPayment === "cod" && <FiCheck className="text-[10px]" />}
                  </div>
                </div>

                {/* 🏦 7. DIRECT WIRE / BANK TRANSFER */}
                <div
                  onClick={() => setSelectedPayment("wire")}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${selectedPayment === "wire"
                      ? "bg-sky-50/80 border-sky-600 shadow-2xs ring-1 ring-sky-600/20"
                      : "bg-white border-slate-200/90 hover:border-slate-300"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono font-bold text-[10.5px]">
                      WIRE
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">Direct Bank Transfer</span>
                      <p className="text-[10.5px] text-slate-400">Direct transfer to E-ALL corporate bank account</p>
                    </div>
                  </div>

                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedPayment === "wire" ? "border-sky-600 bg-sky-600 text-white" : "border-slate-300 bg-white"
                    }`}>
                    {selectedPayment === "wire" && <FiCheck className="text-[10px]" />}
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: NOON-STYLE COUPON BOX & PAYMENT SUMMARY */}
          <div className="lg:col-span-5 space-y-4">

            {/* 🏷️ NOON-STYLE "GOT A COUPON?" CARD */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-3.5 text-xs">
              <h3 className="text-sm font-bold text-slate-900">
                Got a coupon?
              </h3>

              {/* Coupon Input Pill */}
              <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-2xl focus-within:border-sky-600 focus-within:bg-white transition">
                <input
                  type="text"
                  placeholder="Enter your coupon code here"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  disabled={Boolean(appliedCoupon)}
                  className="flex-1 bg-transparent px-3 py-1.5 text-xs font-mono font-bold text-slate-900 uppercase outline-none placeholder:text-slate-400"
                />

                {appliedCoupon ? (
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition cursor-pointer shrink-0"
                  >
                    REMOVE
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon()}
                    disabled={isValidatingCoupon || !couponInput.trim()}
                    className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-40 shrink-0"
                  >
                    {isValidatingCoupon ? "APPLYING..." : "APPLY"}
                  </button>
                )}
              </div>

              {/* Coupon Validation Feedback Banner */}
              {couponMessage.text && (
                <div className={`p-2.5 rounded-xl font-medium text-xs flex items-center gap-2 ${couponMessage.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : couponMessage.type === "error"
                      ? "bg-rose-50 text-rose-800 border border-rose-200"
                      : "bg-sky-50 text-sky-800 border border-sky-200"
                  }`}>
                  {couponMessage.type === "success" ? <FiCheckCircle className="shrink-0 text-emerald-600" /> : <FiTag className="shrink-0" />}
                  <span>{couponMessage.text}</span>
                </div>
              )}

              {/* Accordion: "View available coupons & offers" */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAvailableCoupons(!showAvailableCoupons)}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-800 hover:text-sky-700 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-emerald-100 text-emerald-800">
                      <FiPercent className="text-xs" />
                    </span>
                    View available coupons &amp; offers
                  </span>
                  {showAvailableCoupons ? <FiChevronUp /> : <FiChevronDown />}
                </button>

                {showAvailableCoupons && (
                  <div className="mt-3 space-y-2 pt-2 border-t border-slate-100">
                    {availableCouponsList.map((c) => {
                      const isThisApplied = appliedCoupon?.code === c.code;
                      return (
                        <div key={c.id || c.code} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                          <div>
                            <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 text-xs">
                              {c.code}
                            </span>
                            <p className="text-[11px] text-slate-600 mt-1">{c.description}</p>
                            {c.firstOrderOnly && (
                              <span className="inline-block text-[9.5px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5">
                                1st Order Only (1x per customer)
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => (isThisApplied ? handleRemoveCoupon() : handleApplyCoupon(c.code))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${isThisApplied
                                ? "bg-rose-50 text-rose-700"
                                : "bg-sky-700 text-white hover:bg-sky-800"
                              }`}
                          >
                            {isThisApplied ? "Remove" : "Apply"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 📋 PAYMENT SUMMARY (NOON STYLE) */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Payment summary
              </h3>

              {/* Line Items preview */}
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 pr-1 text-xs">
                {items.map((item) => (
                  <div key={item.sku} className="py-2 first:pt-0 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={item.image || "/logo.png"}
                        alt={item.name}
                        className="w-8 h-8 object-contain bg-slate-50 p-1 rounded-lg border border-slate-100 shrink-0"
                      />
                      <div className="truncate">
                        <h4 className="font-bold text-slate-900 truncate max-w-[150px] sm:max-w-xs">{item.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <AedPrice
                      amount={item.price * item.quantity}
                      className="font-bold text-slate-900 text-xs justify-end shrink-0"
                    />
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <span>Subtotal</span>
                  <AedPrice amount={cartSubtotal} className="font-bold text-slate-900" />
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 font-bold">
                    <span>Coupon Discount ({appliedCoupon?.code})</span>
                    <span>- <AedPrice amount={discountAmount} symbolClassName="text-emerald-600" /></span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span>Shipping Fee</span>
                  {shippingFee === 0 ? (
                    <span className="text-emerald-700 font-extrabold text-[10px] uppercase">FREE</span>
                  ) : (
                    <AedPrice amount={shippingFee} className="font-bold text-slate-900" />
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="font-bold text-slate-900 text-sm">Total Incl. VAT</span>
                  <AedPrice
                    amount={finalPayableTotal}
                    className="font-black text-xl text-slate-950"
                    symbolClassName="text-sky-800"
                  />
                </div>
              </div>

              {/* Desktop Place Order CTA */}
              <div className="hidden sm:block pt-2">
                {selectedPayment === "apple_pay" ? (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-black hover:bg-slate-900 text-white font-black text-base rounded-2xl transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  >
                    <FaApple className="text-xl" />
                    <span>Pay with Apple Pay</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 px-4 bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    {submitting ? (
                      <span>Processing Order...</span>
                    ) : (
                      <>
                        <span>Place Order</span>
                        <FiArrowRight />
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1 pt-1">
                <FiShield className="text-emerald-600" />
                <span>100% Encrypted &amp; Verified Checkout</span>
              </div>
            </div>

          </div>

        </form>

        {/* 📱 MOBILE NOON-STYLE STICKY BOTTOM ACTION BAR */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-2xl flex items-center justify-between gap-3">
          <div>
            <span className="text-[10.5px] text-slate-400 block font-medium">
              {items.length} {items.length === 1 ? "Item" : "Items"}
            </span>
            <AedPrice
              amount={finalPayableTotal}
              className="font-black text-base text-slate-950"
              symbolClassName="text-sky-800"
            />
          </div>

          {selectedPayment === "apple_pay" ? (
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={submitting}
              className="flex-1 max-w-[200px] py-3 bg-black text-white font-black text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              <FaApple className="text-base" /> <span>Pay</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={submitting}
              className="flex-1 max-w-[200px] py-3 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              {submitting ? "Processing..." : "Place Order"}
              <FiArrowRight />
            </button>
          )}
        </div>

        {/* ORDER SUCCESS MODAL */}
        {placedOrder && (
          <OrderSuccessModal
            order={placedOrder}
            onClose={() => setPlacedOrder(null)}
          />
        )}

      </div>
    </div>
  );
};

export default CheckoutPage;
