import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FiShoppingCart,
  FiUser,
  FiMapPin,
  FiCheckCircle,
  FiArrowRight,
  FiShield,
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
  FiChevronRight,
  FiPercent,
  FiSmartphone,
} from "react-icons/fi";
import { FaApple } from "react-icons/fa";
import { useCart } from "../../context/CartContext";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import { useCountry } from "../../context/CountryContext";
import { adjustStockDelta } from "../../services/stockService";
import { WAVE_PAYMENT_CONFIG } from "../../constants/paymentConfig";
import { validateCouponCode, fetchCoupons } from "../../services/couponService";
import OrderSuccessModal from "../../components/checkout/OrderSuccessModal";
import { AedPrice } from "../../components/common/AedSymbol";
import CountryFlag from "../../components/common/CountryFlag";

const COUNTRIES = [
  "United Arab Emirates",
  "Kenya",
  "Senegal",
  "Uganda",
  "Côte d'Ivoire",
  "Ghana",
  "Saudi Arabia",
  "Mali",
  "Burkina Faso",
  "Gambia",
  "Nigeria",
  "Tanzania",
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
  const { items, cartSubtotal, shippingFee, clearCart } = useCart();
  const { activeCountry, publicCountries, countryPath } = useCountry();
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

  const countryOptions = useMemo(() => {
    const names = new Set(COUNTRIES);
    (publicCountries || []).forEach((c) => {
      if (c?.name) names.add(c.name);
    });
    return Array.from(names);
  }, [publicCountries]);

  // Detect Apple Device for Apple Pay conditional rendering
  const isApple = useMemo(() => checkIsAppleDevice(), []);

  // Allowed payment methods for active country
  const allowedMethods = useMemo(() => {
    const list = Array.isArray(activeCountry.paymentMethods) && activeCountry.paymentMethods.length > 0
      ? activeCountry.paymentMethods
      : ["card", "cod", "wire"];
    return list.filter((m) => (m === "apple_pay" ? isApple : true));
  }, [activeCountry.paymentMethods, isApple]);

  const [selectedPaymentRaw, setSelectedPayment] = useState(null);
  const selectedPayment =
    selectedPaymentRaw && allowedMethods.includes(selectedPaymentRaw)
      ? selectedPaymentRaw
      : allowedMethods[0] || "card";

  const [waveTransactionId, setWaveTransactionId] = useState("");
  const [mobileMoneyPhone, setMobileMoneyPhone] = useState("");
  const [mobileMoneyRef, setMobileMoneyRef] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Guest & Logged-in Address State
  const [guestAddresses, setGuestAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressFormData, setAddressFormData] = useState({
    id: null,
    label: "Home",
    fullName: "",
    email: "",
    phone: "",
    country: activeCountry.name || "United Arab Emirates",
    city: activeCountry.city || "Dubai",
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

  // Derive saved addresses list (Max 5) for logged-in user or guest session
  const savedAddresses = useMemo(() => {
    if (!isLoggedIn) {
      return guestAddresses;
    }
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
  }, [user, isLoggedIn, guestAddresses]);

  // Derive effective selected address cleanly without synchronous setState in useEffect
  const activeAddress = useMemo(() => {
    if (selectedAddressId) {
      const found = savedAddresses.find((a) => a.id === selectedAddressId);
      if (found) return found;
    }
    return savedAddresses.find((a) => a.isDefault) || savedAddresses[0] || null;
  }, [savedAddresses, selectedAddressId]);

  const effectiveSelectedAddressId = activeAddress?.id || null;

  // Recalculate Final Checkout Grand Total
  const finalPayableTotal = useMemo(() => {
    const discounted = Math.max(0, cartSubtotal - discountAmount);
    return discounted + shippingFee;
  }, [cartSubtotal, discountAmount, shippingFee]);

  if (items.length === 0 && !placedOrder) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] xl:min-h-screen bg-slate-50 pt-[81px] sm:pt-[93px] xl:pt-[142px] pb-10 text-left">
        <section className="bg-white border-b border-slate-200/80">
          <div className="w-full px-3.5 sm:px-6 lg:px-8 py-3 sm:py-3.5">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 font-medium"
            >
              <Link to={countryPath("/")} className="hover:text-sky-700 transition">
                Home
              </Link>
              <FiChevronRight className="text-slate-300 text-xs" />
              <Link to={countryPath("/cart")} className="hover:text-sky-700 transition">
                Cart
              </Link>
              <FiChevronRight className="text-slate-300 text-xs" />
              <span className="text-slate-900 font-bold">Checkout</span>
            </nav>
          </div>
        </section>

        <div className="px-3.5 sm:px-6 pt-6 text-center">
          <div className="max-w-md mx-auto bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-3.5">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 text-sky-700 flex items-center justify-center mx-auto text-2xl">
              <FiShoppingCart />
            </div>
            <h2 className="text-[15px] sm:text-lg font-extrabold text-slate-900">
              Your cart is empty
            </h2>
            <p className="text-xs text-slate-500">
              Add items to your cart before proceeding to checkout.
            </p>
            <Link
              to={countryPath("/products")}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-700 text-white font-bold text-xs rounded-xl hover:bg-sky-800 transition shadow-xs"
            >
              Start Shopping
            </Link>
          </div>
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
      country: activeCountry.name || user?.country || "United Arab Emirates",
      city: activeCountry.city || user?.city || "Dubai",
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
      if (isLoggedIn) {
        const saved = await saveAddress(addressFormData);
        if (saved?.id) {
          setSelectedAddressId(saved.id);
        }
      } else {
        const guestAddr = {
          ...addressFormData,
          id: addressFormData.id || `guest_addr_${Date.now()}`,
          isDefault: true,
        };
        setGuestAddresses((prev) => {
          const exists = prev.some((a) => a.id === guestAddr.id);
          return exists
            ? prev.map((a) => (a.id === guestAddr.id ? guestAddr : a))
            : [guestAddr, ...prev];
        });
        setSelectedAddressId(guestAddr.id);
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
    } catch {
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
      mpesa: "M-Pesa (Safaricom Kenya)",
      wave: "Wave Money Transfer",
      orange_money: "Orange Money",
      mtn_momo: "MTN Mobile Money (MoMo)",
      airtel_money: "Airtel Money",
      tabby: "Tabby (Pay in 4)",
      tamara: "Tamara (Pay in 6)",
      cod: "Cash on Delivery",
      wire: "Direct Wire / Bank Transfer",
    };

    const isMobileMoney = ["wave", "mpesa", "orange_money", "mtn_momo", "airtel_money"].includes(
      selectedPayment
    );

    const newOrder = {
      orderId,
      countryCode: activeCountry.code,
      currency: activeCountry.currency,
      vatRate: activeCountry.vatRate,
      hubName: activeCountry.hubName,
      customerId: user?.uid || user?.id || `guest_${Date.now()}`,
      customerName: deliveryDetails.fullName || user?.fullName || "Guest Customer",
      email: user?.email || deliveryDetails.email || addressFormData.email || "",
      phone: deliveryDetails.phone || user?.phone || "",
      country: deliveryDetails.country || activeCountry.name || "United Arab Emirates",
      city: deliveryDetails.city || activeCountry.city || "Dubai",
      shippingAddress: deliveryDetails.streetAddress,
      addressLabel: deliveryDetails.label || "Home",
      paymentMethod: selectedPayment,
      paymentMethodName: paymentMethodNames[selectedPayment] || selectedPayment,
      waveTransactionId: selectedPayment === "wave" ? waveTransactionId.trim() : null,
      mobileMoneyPhone: isMobileMoney && selectedPayment !== "wave" ? mobileMoneyPhone.trim() : null,
      mobileMoneyRef: isMobileMoney && selectedPayment !== "wave" ? mobileMoneyRef.trim() : null,
      appliedCoupon: appliedCoupon ? appliedCoupon.code : null,
      discountAmount: discountAmount,
      items: [...items],
      subtotal: cartSubtotal,
      shippingFee: shippingFee,
      total: finalPayableTotal,
      status:
        selectedPayment === "wave"
          ? "Awaiting Wave Verification"
          : isMobileMoney
          ? `Awaiting ${paymentMethodNames[selectedPayment]} Confirmation`
          : "Order Placed",
      createdAt: new Date().toISOString(),
    };

    // 1. If logged-in customer, update usedCoupons and ordersCount in Firestore profile
    if (isLoggedIn && user) {
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
    }

    // 2. Adjust Stock Delta (country-scoped)
    for (const item of items) {
      if (item.sku) {
        try {
          await adjustStockDelta(item.sku, -(item.quantity || 1), activeCountry.code);
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
    <div className="min-h-[calc(100vh-3.5rem)] xl:min-h-screen bg-slate-50 pt-[81px] sm:pt-[93px] xl:pt-[142px] pb-24 lg:pb-14 text-left">
      {/* ================================================================= */}
      {/* UNIFIED BREADCRUMB BAR (Consistent with Shop, Brands & Cart)      */}
      {/* ================================================================= */}
      <section className="bg-white border-b border-slate-200/80">
        <div className="w-full px-3.5 sm:px-6 lg:px-8 py-3 sm:py-3.5 xl:py-5 space-y-0 xl:space-y-3">
          <div className="flex items-center justify-between gap-2">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 font-medium min-w-0"
            >
              <Link
                to={countryPath("/")}
                className="hover:text-sky-700 transition shrink-0"
              >
                Home
              </Link>
              <FiChevronRight className="text-slate-300 shrink-0 text-xs" />
              <Link
                to={countryPath("/cart")}
                className="hover:text-sky-700 transition shrink-0"
              >
                Cart
              </Link>
              <FiChevronRight className="text-slate-300 shrink-0 text-xs" />
              <span className="text-slate-900 font-bold truncate">
                Checkout
              </span>
            </nav>

            <div className="flex items-center gap-2 shrink-0">
              {!isLoggedIn ? (
                <button
                  type="button"
                  onClick={() => openAuthModal("login", countryPath("/checkout"))}
                  className="xl:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200/80 text-sky-700 text-[11px] font-bold cursor-pointer"
                >
                  <FiUser className="text-xs" />
                  <span>Sign In</span>
                </button>
              ) : (
                <span className="xl:hidden inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[10.5px] font-bold">
                  <FiShield className="text-[11px]" />
                  <span>SSL Secure</span>
                </span>
              )}
            </div>
          </div>

          {/* Desktop Title & Account Status Row (xl+) */}
          <div className="hidden xl:flex items-center justify-between gap-4">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FiShield className="text-emerald-600 shrink-0" />
              <span>Secure Checkout</span>
            </h1>

            {isLoggedIn ? (
              <div className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200/80">
                <FiUser className="text-sky-700 shrink-0" />
                <span>
                  Signed in as{" "}
                  <strong className="text-slate-900">
                    {user?.fullName || user?.email}
                  </strong>
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-xs text-slate-700 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200/80">
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                  <FiUser className="text-emerald-600 shrink-0" />
                  Express Guest Checkout
                </span>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => openAuthModal("login", countryPath("/checkout"))}
                  className="font-bold text-sky-700 hover:underline cursor-pointer"
                >
                  Sign In to Account →
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="w-full max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {/* CHECKOUT FORM & SUMMARY GRID */}
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">

          {/* LEFT COLUMN: ADDRESS & PAYMENT OPTIONS */}
          <div className="lg:col-span-7 space-y-4">

            {/* STEP 1: DELIVERY ADDRESS */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                    Delivery Address
                  </h2>
                </div>

                {!isEditingAddress && savedAddresses.length < 5 && (
                  <button
                    type="button"
                    onClick={handleOpenAddAddress}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 hover:bg-sky-100 border border-sky-200/80 text-sky-700 text-[11.5px] font-bold transition cursor-pointer shrink-0"
                  >
                    <FiPlus className="text-xs" />
                    <span>Add New</span>
                  </button>
                )}
              </div>

              {/* SAVED ADDRESS CARDS (Clean Full-Width Stack on Mobile | 2-Col on sm+, Zero Scrollbar) */}
              {!isEditingAddress && savedAddresses.length > 0 && (
                <div
                  className={`grid gap-2.5 ${
                    savedAddresses.length > 1
                      ? "grid-cols-1 sm:grid-cols-2"
                      : "grid-cols-1"
                  }`}
                >
                  {savedAddresses.map((addr) => {
                    const isSelected = effectiveSelectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "bg-sky-50/50 border-sky-600 ring-1 ring-sky-500/20"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[10px] font-bold uppercase tracking-wider">
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

                            <div
                              className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? "border-sky-600 bg-sky-600 text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected && <FiCheck className="text-[10px]" />}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-bold text-slate-900 text-xs sm:text-[13px] truncate">
                              {addr.fullName}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {addr.phone}
                            </p>
                            <p className="text-[11.5px] text-slate-700 line-clamp-2 mt-1 leading-relaxed">
                              {addr.streetAddress}
                            </p>
                            <p className="text-[10.5px] text-slate-400 mt-0.5 font-medium">
                              {[addr.city, addr.country].filter(Boolean).join(", ")}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 text-xs">
                          <button
                            type="button"
                            onClick={(e) => handleOpenEditAddress(addr, e)}
                            className="inline-flex items-center gap-1 text-sky-700 hover:text-sky-900 font-semibold cursor-pointer text-[11.5px]"
                          >
                            <FiEdit2 className="text-xs" /> Edit
                          </button>

                          {savedAddresses.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteAddress(addr.id, e)}
                              className="inline-flex items-center gap-1 text-slate-400 hover:text-rose-600 font-medium cursor-pointer text-[11.5px]"
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
                        {countryOptions.map((c) => (
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

            {/* STEP 2: PAYMENT METHODS */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-3.5">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Pay with
                </h2>
              </div>

              <div className="space-y-2 text-xs">

                {/* 🍏 1. APPLE PAY (CONDITIONAL: APPLE DEVICE + SUPPORTED MARKET) */}
                {isApple && allowedMethods.includes("apple_pay") && (
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

                {/* 📱 REGIONAL MOBILE MONEY: M-PESA (KENYA) */}
                {allowedMethods.includes("mpesa") && (
                  <div
                    onClick={() => setSelectedPayment("mpesa")}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col gap-2.5 ${selectedPayment === "mpesa"
                        ? "bg-emerald-50/70 border-emerald-600 shadow-2xs ring-1 ring-emerald-600/20"
                        : "bg-white border-slate-200/90 hover:border-slate-300"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-black text-[11px] flex items-center gap-1">
                          <FiSmartphone className="text-xs" /> M-PESA
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">
                              Safaricom M-Pesa (STK Push / Paybill)
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-extrabold">
                              Instant KE
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-500">
                            Pay directly in KES via M-Pesa Express prompt or Paybill
                          </p>
                        </div>
                      </div>

                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${selectedPayment === "mpesa" ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white"
                        }`}>
                        {selectedPayment === "mpesa" && <FiCheck className="text-[10px]" />}
                      </div>
                    </div>

                    {selectedPayment === "mpesa" && (
                      <div className="pt-2 border-t border-emerald-200/70 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="M-Pesa Phone (+254 7XX XXX XXX)"
                          value={mobileMoneyPhone}
                          onChange={(e) => setMobileMoneyPhone(e.target.value)}
                          className="w-full p-2 bg-white border border-emerald-200 rounded-xl text-xs font-mono font-semibold text-slate-900"
                        />
                        <input
                          type="text"
                          placeholder="M-Pesa Ref / Confirmation Code (Optional)"
                          value={mobileMoneyRef}
                          onChange={(e) => setMobileMoneyRef(e.target.value.toUpperCase())}
                          className="w-full p-2 bg-white border border-emerald-200 rounded-xl text-xs font-mono font-semibold text-slate-900"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* 🌊 WAVE MONEY TRANSFER (SENEGAL / CÔTE D'IVOIRE) */}
                {allowedMethods.includes("wave") && (
                  <div
                    onClick={() => setSelectedPayment("wave")}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col gap-2.5 ${selectedPayment === "wave"
                        ? "bg-sky-50/80 border-sky-600 shadow-2xs ring-1 ring-sky-600/20"
                        : "bg-white border-slate-200/90 hover:border-slate-300"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 rounded-lg bg-sky-600 text-white font-black text-[10.5px] shrink-0">
                          WAVE
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">Wave Money Transfer</span>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-extrabold">
                              0% Fee
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-500">Direct mobile money transfer</p>
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
                )}

                {/* 🟠 ORANGE MONEY (SENEGAL / CÔTE D'IVOIRE) */}
                {allowedMethods.includes("orange_money") && (
                  <div
                    onClick={() => setSelectedPayment("orange_money")}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col gap-2.5 ${selectedPayment === "orange_money"
                        ? "bg-orange-50/70 border-orange-500 shadow-2xs ring-1 ring-orange-500/20"
                        : "bg-white border-slate-200/90 hover:border-slate-300"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 rounded-lg bg-orange-500 text-white font-black text-[10.5px]">
                          Orange
                        </span>
                        <div>
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">Orange Money</span>
                          <p className="text-[10.5px] text-slate-500">
                            Instant CFA wallet transfer in {activeCountry.name}
                          </p>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${selectedPayment === "orange_money" ? "border-orange-500 bg-orange-500 text-white" : "border-slate-300 bg-white"
                        }`}>
                        {selectedPayment === "orange_money" && <FiCheck className="text-[10px]" />}
                      </div>
                    </div>

                    {selectedPayment === "orange_money" && (
                      <div className="pt-2 border-t border-orange-200/70 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Orange Money Phone Number"
                          value={mobileMoneyPhone}
                          onChange={(e) => setMobileMoneyPhone(e.target.value)}
                          className="w-full p-2 bg-white border border-orange-200 rounded-xl text-xs font-mono font-semibold text-slate-900"
                        />
                        <input
                          type="text"
                          placeholder="Transaction Reference (Optional)"
                          value={mobileMoneyRef}
                          onChange={(e) => setMobileMoneyRef(e.target.value.toUpperCase())}
                          className="w-full p-2 bg-white border border-orange-200 rounded-xl text-xs font-mono font-semibold text-slate-900"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* 🟡 MTN MOBILE MONEY (UGANDA / GHANA) */}
                {allowedMethods.includes("mtn_momo") && (
                  <div
                    onClick={() => setSelectedPayment("mtn_momo")}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col gap-2.5 ${selectedPayment === "mtn_momo"
                        ? "bg-amber-50/80 border-amber-500 shadow-2xs ring-1 ring-amber-500/20"
                        : "bg-white border-slate-200/90 hover:border-slate-300"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-[10.5px]">
                          MTN MoMo
                        </span>
                        <div>
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">MTN Mobile Money</span>
                          <p className="text-[10.5px] text-slate-500">
                            Pay securely in {activeCountry.currency} via MTN MoMo prompt
                          </p>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${selectedPayment === "mtn_momo" ? "border-amber-600 bg-amber-600 text-white" : "border-slate-300 bg-white"
                        }`}>
                        {selectedPayment === "mtn_momo" && <FiCheck className="text-[10px]" />}
                      </div>
                    </div>

                    {selectedPayment === "mtn_momo" && (
                      <div className="pt-2 border-t border-amber-200/70 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="MTN MoMo Phone Number"
                          value={mobileMoneyPhone}
                          onChange={(e) => setMobileMoneyPhone(e.target.value)}
                          className="w-full p-2 bg-white border border-amber-200 rounded-xl text-xs font-mono font-semibold text-slate-900"
                        />
                        <input
                          type="text"
                          placeholder="MoMo Transaction Ref (Optional)"
                          value={mobileMoneyRef}
                          onChange={(e) => setMobileMoneyRef(e.target.value.toUpperCase())}
                          className="w-full p-2 bg-white border border-amber-200 rounded-xl text-xs font-mono font-semibold text-slate-900"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* 🔴 AIRTEL MONEY (UGANDA) */}
                {allowedMethods.includes("airtel_money") && (
                  <div
                    onClick={() => setSelectedPayment("airtel_money")}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col gap-2.5 ${selectedPayment === "airtel_money"
                        ? "bg-rose-50/70 border-rose-500 shadow-2xs ring-1 ring-rose-500/20"
                        : "bg-white border-slate-200/90 hover:border-slate-300"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 rounded-lg bg-rose-600 text-white font-black text-[10.5px]">
                          Airtel
                        </span>
                        <div>
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">Airtel Money</span>
                          <p className="text-[10.5px] text-slate-500">
                            Instant mobile wallet payment in {activeCountry.currency}
                          </p>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${selectedPayment === "airtel_money" ? "border-rose-600 bg-rose-600 text-white" : "border-slate-300 bg-white"
                        }`}>
                        {selectedPayment === "airtel_money" && <FiCheck className="text-[10px]" />}
                      </div>
                    </div>

                    {selectedPayment === "airtel_money" && (
                      <div className="pt-2 border-t border-rose-200/70 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Airtel Money Phone Number"
                          value={mobileMoneyPhone}
                          onChange={(e) => setMobileMoneyPhone(e.target.value)}
                          className="w-full p-2 bg-white border border-rose-200 rounded-xl text-xs font-mono font-semibold text-slate-900"
                        />
                        <input
                          type="text"
                          placeholder="Airtel Ref Code (Optional)"
                          value={mobileMoneyRef}
                          onChange={(e) => setMobileMoneyRef(e.target.value.toUpperCase())}
                          className="w-full p-2 bg-white border border-rose-200 rounded-xl text-xs font-mono font-semibold text-slate-900"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* 💳 DEBIT / CREDIT CARD */}
                {allowedMethods.includes("card") && (
                  <div
                    onClick={() => setSelectedPayment("card")}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col gap-2.5 ${selectedPayment === "card"
                        ? "bg-sky-50/80 border-sky-600 shadow-2xs ring-1 ring-sky-600/20"
                        : "bg-white border-slate-200/90 hover:border-slate-300"
                      }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1">
                          <FiCreditCard className="text-sm" />
                          <span className="font-mono text-[10px]">CARD</span>
                        </div>
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">Debit / Credit Card</span>
                      </div>

                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${selectedPayment === "card" ? "border-sky-600 bg-sky-600 text-white" : "border-slate-300 bg-white"
                        }`}>
                        {selectedPayment === "card" && <FiCheck className="text-[10px]" />}
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
                )}

                {/* 💳 TABBY (PAY IN 4 - UAE & SAUDI ARABIA) */}
                {allowedMethods.includes("tabby") && (
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
                )}

                {/* 💳 TAMARA (PAY IN 6 - UAE & SAUDI ARABIA) */}
                {allowedMethods.includes("tamara") && (
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
                )}

                {/* 💵 CASH ON DELIVERY */}
                {allowedMethods.includes("cod") && (
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
                        <p className="text-[10.5px] text-slate-400">
                          Pay in {activeCountry.currency} upon doorstep delivery
                        </p>
                      </div>
                    </div>

                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedPayment === "cod" ? "border-sky-600 bg-sky-600 text-white" : "border-slate-300 bg-white"
                      }`}>
                      {selectedPayment === "cod" && <FiCheck className="text-[10px]" />}
                    </div>
                  </div>
                )}

                {/* 🏦 DIRECT WIRE / BANK TRANSFER */}
                {allowedMethods.includes("wire") && (
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
                        <p className="text-[10.5px] text-slate-400">
                          Direct transfer to {activeCountry.legalEntityName}
                        </p>
                      </div>
                    </div>

                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedPayment === "wire" ? "border-sky-600 bg-sky-600 text-white" : "border-slate-300 bg-white"
                      }`}>
                      {selectedPayment === "wire" && <FiCheck className="text-[10px]" />}
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: COUPON BOX & PAYMENT SUMMARY */}
          <div className="lg:col-span-5 space-y-4">

            {/* "GOT A COUPON?" CARD */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-3 text-xs">
              <h3 className="text-sm font-extrabold text-slate-900">
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

            {/* PAYMENT SUMMARY */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-4">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
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
                  <span className="font-bold text-slate-900 text-sm">
                    Total Incl. {activeCountry.vatRate}% VAT
                  </span>
                  <AedPrice
                    amount={finalPayableTotal}
                    className="font-black text-xl text-slate-950"
                    symbolClassName="text-sky-800"
                  />
                </div>
              </div>

              {/* Desktop Place Order CTA */}
              <div className="hidden lg:block pt-2">
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

              {/* Bottom Warranty & Storefront Region Trust Row (Matches Cart) */}
              <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-slate-100 text-[11.5px]">
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600">
                  <FiShield className="text-emerald-600 text-sm shrink-0" />
                  <span>Encrypted &amp; Warranty Backed</span>
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600 shrink-0">
                  <CountryFlag code={activeCountry.code} className="w-4 h-3" />
                  <span>
                    {activeCountry.shortName} · {activeCountry.currency}
                  </span>
                </span>
              </div>
            </div>

          </div>

        </form>

        {/* STICKY MOBILE / TABLET CHECKOUT BAR (Docked cleanly above MobileBottomNav) */}
        <div className="lg:hidden fixed left-0 right-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(15,23,42,0.06)] px-3.5 py-2.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-none">
              Total ({items.length} {items.length === 1 ? "item" : "items"})
            </span>
            <AedPrice
              amount={finalPayableTotal}
              className="font-black text-base text-slate-950 mt-0.5"
              symbolClassName="text-sky-700"
            />
          </div>

          {selectedPayment === "apple_pay" ? (
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={submitting}
              className="flex-1 max-w-[210px] h-11 px-4 bg-black hover:bg-slate-900 active:scale-[0.99] text-white font-black text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <FaApple className="text-base" />
              <span>{submitting ? "Processing..." : "Pay"}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={submitting}
              className="flex-1 max-w-[210px] h-11 px-4 bg-sky-700 hover:bg-sky-800 active:scale-[0.99] disabled:opacity-50 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <span>{submitting ? "Processing..." : "Place Order"}</span>
              <FiArrowRight className="text-sm" />
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
