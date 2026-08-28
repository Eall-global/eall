import { Link, useNavigate } from "react-router-dom";
import {
  FiShoppingCart,
  FiTrash2,
  FiArrowRight,
  FiPlus,
  FiMinus,
  FiTruck,
  FiShield,
  FiShoppingBag,
  FiArrowLeft,
  FiCheckCircle,
} from "react-icons/fi";
import { useCart } from "../../context/CartContext";
import { useCustomerAuth } from "../../context/CustomerAuthContext";

const CartPage = () => {
  const {
    items,
    cartCount,
    cartSubtotal,
    shippingFee,
    cartTotal,
    removeFromCart,
    updateQuantity,
    clearCart,
  } = useCart();

  const { isLoggedIn, openAuthModal } = useCustomerAuth();
  const navigate = useNavigate();

  const handleProceedToCheckout = () => {
    if (!isLoggedIn) {
      openAuthModal("login", "/checkout");
    } else {
      navigate("/checkout");
    }
  };

  const freeShippingThreshold = 500;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - cartSubtotal);

  return (
    <div className="min-h-screen bg-slate-50 pt-24 sm:pt-28 lg:pt-32 pb-16 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* BREADCRUMB / HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-sky-700 font-semibold mb-1 transition"
            >
              <FiArrowLeft /> Continue Shopping
            </Link>
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <FiShoppingCart className="text-sky-700 shrink-0" /> Shopping Cart
              {cartCount > 0 && (
                <span className="text-xs bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-full border border-sky-200">
                  {cartCount} {cartCount === 1 ? "item" : "items"}
                </span>
              )}
            </h1>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-600 font-semibold transition cursor-pointer self-start sm:self-auto"
            >
              <FiTrash2 /> Clear Cart
            </button>
          )}
        </div>

        {/* MAIN CONTENT GRID */}
        {items.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center shadow-xs border border-slate-200 max-w-md mx-auto my-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-sky-50 text-sky-700 flex items-center justify-center mx-auto text-3xl">
              <FiShoppingCart />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Your shopping cart is empty</h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Explore our catalog of smartphones, tablets, and electronics to add items to your cart.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-xs"
            >
              <FiShoppingBag />
              Browse Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">

            {/* ITEMS LIST (LEFT COLUMN) */}
            <div className="lg:col-span-7 space-y-4">

              {/* Free Shipping Banner */}
              <div className="bg-linear-to-r from-sky-50 to-emerald-50 border border-sky-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-sky-700 text-white rounded-lg shrink-0">
                    <FiTruck className="text-base" />
                  </div>
                  <div>
                    {amountToFreeShipping === 0 ? (
                      <p className="font-bold text-emerald-800 text-xs">
                        You unlocked FREE Delivery across Africa &amp; UAE!
                      </p>
                    ) : (
                      <p className="text-slate-700 font-medium text-xs">
                        Add <strong className="font-mono text-sky-800">AED {amountToFreeShipping.toFixed(2)}</strong> for <strong className="text-emerald-700 font-bold">FREE Delivery</strong>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Card */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="divide-y divide-slate-100 p-4 sm:p-6 space-y-3 sm:space-y-0">
                  {items.map((item) => (
                    <div
                      key={item.sku}
                      className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-3 sm:items-center justify-between"
                    >
                      {/* Product Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.image || "/logo.png"}
                          alt={item.name}
                          className="w-14 h-14 sm:w-16 sm:h-16 object-contain bg-white rounded-xl p-1.5 border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-[9.5px] font-bold text-sky-700 uppercase tracking-wider block">
                            {item.brand}
                          </span>
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-50 sm:max-w-xs">
                            {item.name}
                          </h3>
                          {item.color || item.storage ? (
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {[item.color, item.storage].filter(Boolean).join(" | ")}
                            </p>
                          ) : null}
                          <p className="text-xs font-mono font-semibold text-slate-700 mt-0.5">
                            AED {item.price.toFixed(2)} ea
                          </p>
                        </div>
                      </div>

                      {/* Stepper & Total */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.sku, item.quantity - 1)}
                            className="p-1 text-slate-500 hover:text-slate-900 rounded cursor-pointer"
                          >
                            <FiMinus className="text-xs" />
                          </button>
                          <span className="w-6 text-center font-mono font-bold text-xs text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.sku, item.quantity + 1)}
                            className="p-1 text-slate-500 hover:text-slate-900 rounded cursor-pointer"
                          >
                            <FiPlus className="text-xs" />
                          </button>
                        </div>

                        {/* Subtotal */}
                        <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 min-w-17.5 text-right">
                          AED {(item.price * item.quantity).toFixed(2)}
                        </span>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.sku)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition rounded-lg hover:bg-rose-50 cursor-pointer"
                          title="Remove item"
                        >
                          <FiTrash2 className="text-xs" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* ORDER SUMMARY (RIGHT COLUMN) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                  Order Summary
                </h2>

                <div className="space-y-2 text-xs text-slate-600">
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

                  <div className="pt-2.5 border-t border-slate-200 flex justify-between items-baseline">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">Total</span>
                    <div className="text-right">
                      <span className="font-mono font-black text-lg sm:text-xl text-sky-800">
                        AED {cartTotal.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 block">
                        ≈ USD {(cartTotal / 3.6725).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Checkout CTA */}
                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  className="w-full py-3.5 px-4 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <FiArrowRight />
                </button>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[10.5px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <FiCheckCircle className="text-emerald-600 shrink-0" />
                    <span>Wave Transfer Gateway (0% Deposit Fee)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiShield className="text-sky-600 shrink-0" />
                    <span>Official Manufacturer Guarantee Included</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default CartPage;
