import { useState, useEffect } from "react";
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
  FiAlertCircle,
} from "react-icons/fi";
import { useCart } from "../../context/CartContext";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import { adjustStockDelta } from "../../services/stockService";
import { PAYMENT_METHODS, WAVE_PAYMENT_CONFIG } from "../../constants/paymentConfig";
import OrderSuccessModal from "../../components/checkout/OrderSuccessModal";

const CheckoutPage = () => {
  const { items, cartSubtotal, shippingFee, cartTotal, clearCart } = useCart();
  const { user, isLoggedIn, openAuthModal, updateProfile, addOrderToHistory } = useCustomerAuth();
  const navigate = useNavigate();

  const [selectedPayment, setSelectedPayment] = useState("wave");
  const [waveTransactionId, setWaveTransactionId] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [shippingForm, setShippingForm] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    country: user?.country || "Senegal",
    city: user?.city || "Dakar",
    shippingAddress: user?.shippingAddress || "",
    notes: "",
  });

  // Sync logged in user details if user changes
  useEffect(() => {
    if (user) {
      setShippingForm((prev) => ({
        ...prev,
        fullName: user.fullName || prev.fullName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        country: user.country || prev.country,
        city: user.city || prev.city,
        shippingAddress: user.shippingAddress || prev.shippingAddress,
      }));
    }
  }, [user]);

  // Auth Guard: If not logged in, prompt AuthModal
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 pt-28 sm:pt-36 pb-16 px-4 text-center">
        <div className="max-w-md mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center mx-auto text-2xl sm:text-3xl">
            <FiUser />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Sign In to Proceed to Checkout</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Please log in or register with your delivery address to process your cart and access Wave Transfer payment.
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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(WAVE_PAYMENT_CONFIG.merchantPhone);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const orderId = `EALL-${selectedPayment.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const newOrder = {
      orderId,
      customerId: user.uid || user.id,
      customerName: shippingForm.fullName,
      email: shippingForm.email,
      phone: shippingForm.phone,
      country: shippingForm.country,
      city: shippingForm.city,
      shippingAddress: shippingForm.shippingAddress,
      paymentMethod: selectedPayment,
      paymentMethodName: PAYMENT_METHODS.find((p) => p.id === selectedPayment)?.name || "Wave Transfer",
      waveTransactionId: selectedPayment === "wave" ? waveTransactionId.trim() : null,
      items: [...items],
      subtotal: cartSubtotal,
      shippingFee: shippingFee,
      total: cartTotal,
      status: selectedPayment === "wave" ? "Awaiting Wave Verification" : "Order Placed",
      createdAt: new Date().toISOString(),
    };

    // 1. Update customer profile in Firestore with saved address/phone
    updateProfile({
      fullName: shippingForm.fullName,
      phone: shippingForm.phone,
      country: shippingForm.country,
      city: shippingForm.city,
      shippingAddress: shippingForm.shippingAddress,
    });

    // 2. Deduct inventory stock for ordered items
    for (const item of items) {
      if (item.sku) {
        try {
          await adjustStockDelta(item.sku, -(item.quantity || 1));
        } catch (err) {
          console.warn(`Could not adjust stock for ${item.sku}:`, err);
        }
      }
    }

    // 3. Save order to Firestore
    await addOrderToHistory(newOrder);

    setPlacedOrder(newOrder);
    clearCart();
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 sm:pt-28 lg:pt-32 pb-16 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <Link
              to="/cart"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-sky-700 font-semibold mb-1 transition"
            >
              <FiArrowLeft /> Back to Cart
            </Link>
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FiShield className="text-emerald-600 shrink-0" /> Checkout &amp; Payment
            </h1>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto">
            <FiUser className="text-sky-700 shrink-0" />
            <span>LoggedIn as <strong className="text-slate-900">{user?.fullName || user?.email}</strong></span>
          </div>
        </div>

        {/* CHECKOUT FORM & SUMMARY GRID */}
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">

          {/* LEFT COLUMN: SHIPPING ADDRESS & PAYMENT SELECTION */}
          <div className="lg:col-span-7 space-y-5">

            {/* STEP 1: SHIPPING & CONTACT */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-7 h-7 rounded-full bg-sky-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                  1
                </div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Shipping &amp; Delivery Information
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
                    Recipient Full Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={shippingForm.fullName}
                    onChange={(e) => setShippingForm({ ...shippingForm, fullName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
                    Email Address *
                  </label>
                  <input
                    required
                    type="email"
                    value={shippingForm.email}
                    onChange={(e) => setShippingForm({ ...shippingForm, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
                    Phone / Wave Number *
                  </label>
                  <input
                    required
                    type="text"
                    value={shippingForm.phone}
                    onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                    placeholder="+221 77 123 4567"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
                    Country *
                  </label>
                  <select
                    value={shippingForm.country}
                    onChange={(e) => setShippingForm({ ...shippingForm, country: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  >
                    <option value="Senegal">Senegal</option>
                    <option value="Côte d'Ivoire">Côte d'Ivoire</option>
                    <option value="Mali">Mali</option>
                    <option value="Burkina Faso">Burkina Faso</option>
                    <option value="Gambia">Gambia</option>
                    <option value="Uganda">Uganda</option>
                    <option value="United Arab Emirates">United Arab Emirates</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
                  Street Address &amp; Delivery Instructions *
                </label>
                <textarea
                  required
                  rows={2}
                  value={shippingForm.shippingAddress}
                  onChange={(e) => setShippingForm({ ...shippingForm, shippingAddress: e.target.value })}
                  placeholder="District, Street name, Building number"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>
            </div>

            {/* STEP 2: PAYMENT METHOD SELECTION */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-7 h-7 rounded-full bg-sky-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Payment Gateway Selection
                </h2>
              </div>

              <div className="space-y-2.5">
                {PAYMENT_METHODS.map((method) => {
                  const isSelected = selectedPayment === method.id;
                  return (
                    <div
                      key={method.id}
                      onClick={() => setSelectedPayment(method.id)}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3 sm:gap-4 ${
                        isSelected
                          ? "bg-sky-50/70 border-sky-600 ring-2 ring-sky-600/20"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-xl sm:text-2xl pt-0.5 shrink-0">{method.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900">{method.name}</h3>
                          {method.badge && (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                              {method.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{method.description}</p>
                      </div>
                      <div className="pt-0.5 shrink-0">
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={isSelected}
                          onChange={() => setSelectedPayment(method.id)}
                          className="text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* WAVE TRANSFER DETAILED BOX */}
              {selectedPayment === "wave" && (
                <div className="mt-3 p-4 sm:p-5 bg-gradient-to-br from-sky-950 via-slate-900 to-sky-900 text-white rounded-2xl space-y-3.5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🌊</span>
                      <div>
                        <h4 className="text-xs font-bold text-white">Wave Money Transfer Details</h4>
                        <p className="text-[10px] text-sky-200">Zero deposit charges across Africa</p>
                      </div>
                    </div>
                    <span className="bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[9.5px] font-bold px-2 py-0.5 rounded-full shrink-0">
                      Free &amp; Instant
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white/10 p-2.5 rounded-xl border border-white/10 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-sky-200 uppercase font-bold block">Merchant Wave Phone</span>
                        <span className="font-mono font-black text-white text-xs sm:text-sm">{WAVE_PAYMENT_CONFIG.merchantPhone}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold rounded-lg transition cursor-pointer shrink-0"
                      >
                        {copiedCode ? "Copied" : "Copy"}
                      </button>
                    </div>

                    <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                      <span className="text-[9px] text-sky-200 uppercase font-bold block">Amount to Transfer</span>
                      <span className="font-mono font-black text-emerald-400 text-xs sm:text-sm">
                        AED {cartTotal.toFixed(2)}
                      </span>
                    </div>
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

          </div>

          {/* RIGHT COLUMN: ORDER SUMMARY & SUBMIT */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Order Review ({items.length} {items.length === 1 ? "item" : "items"})
              </h2>

              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 pr-1 text-xs">
                {items.map((item) => (
                  <div key={item.sku} className="py-2.5 first:pt-0 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={item.image || "/logo.png"}
                        alt={item.name}
                        className="w-9 h-9 object-contain bg-slate-50 p-1 rounded-lg border border-slate-100 shrink-0"
                      />
                      <div className="truncate">
                        <h4 className="font-bold text-slate-900 truncate max-w-[150px] sm:max-w-xs">{item.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-slate-900 shrink-0">
                      AED {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-200">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono font-bold text-slate-900">
                    AED {cartSubtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span className="font-mono font-bold text-slate-900">
                    {shippingFee === 0 ? (
                      <span className="text-emerald-700 font-extrabold text-[10px] uppercase">FREE</span>
                    ) : (
                      `AED ${shippingFee.toFixed(2)}`
                    )}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">Grand Total</span>
                  <span className="font-mono font-black text-lg sm:text-xl text-sky-800">
                    AED {cartTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                {submitting ? (
                  <span>Processing Order...</span>
                ) : (
                  <>
                    <span>Place Order ({selectedPayment === "wave" ? "Wave Transfer" : selectedPayment.toUpperCase()})</span>
                    <FiArrowRight />
                  </>
                )}
              </button>

              <div className="text-[10.5px] text-slate-400 text-center flex items-center justify-center gap-1.5 pt-1">
                <FiShield className="text-emerald-600" />
                <span>100% Encrypted &amp; Verified Merchant</span>
              </div>
            </div>
          </div>

        </form>

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
