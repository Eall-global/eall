import { Link, useNavigate } from "react-router-dom";
import {
  FiX,
  FiTrash2,
  FiArrowRight,
  FiPlus,
  FiMinus,
  FiTruck,
  FiShield,
  FiShoppingBag,
} from "react-icons/fi";
import { MdOutlineShoppingCart } from "react-icons/md";
import { useCart } from "../../context/CartContext";
import { useCustomerAuth } from "../../context/CustomerAuthContext";

const CartDrawer = () => {
  const {
    items,
    cartCount,
    cartSubtotal,
    shippingFee,
    cartTotal,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    clearCart,
  } = useCart();

  const { isLoggedIn, openAuthModal } = useCustomerAuth();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const handleCheckoutClick = () => {
    setIsCartOpen(false);
    if (!isLoggedIn) {
      openAuthModal("login", "/checkout");
    } else {
      navigate("/checkout");
    }
  };

  const freeShippingThreshold = 500;
  const progressPercent = Math.min(100, Math.round((cartSubtotal / freeShippingThreshold) * 100));
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - cartSubtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden text-left">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">

          {/* HEADER (Safe-Area Aware for Dynamic Island / Notches) */}
          <div className="pt-10 sm:pt-6 pb-4 sm:pb-5 px-5 sm:px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/90 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-sky-50 text-sky-700 rounded-xl shrink-0">
                <MdOutlineShoppingCart className="text-xl" />
              </div>
              <div>
                <h2 className="text-sm! sm:text-base! font-bold! text-slate-900! leading-tight flex items-center gap-2">
                  Shopping Cart
                  {cartCount > 0 && (
                    <span className="bg-sky-700 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {cartCount}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500 mt-0.3">
                  Review your selected items
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition cursor-pointer shrink-0"
              aria-label="Close Cart"
            >
              <FiX className="text-xl" />
            </button>
          </div>

          {/* FREE SHIPPING PROGRESS BAR */}
          {items.length > 0 && (
            <div className="px-5 py-3 bg-sky-50/60 border-b border-sky-100/60 text-xs">
              <div className="flex justify-between items-center text-slate-700 mb-1.5 font-medium">
                <span className="flex items-center gap-1.5 font-semibold text-sky-900">
                  <FiTruck className="text-sky-700 text-sm" />
                  {amountToFreeShipping === 0 ? (
                    <strong className="text-emerald-700 font-bold">You qualify for FREE Delivery!</strong>
                  ) : (
                    <>Add <strong className="font-mono text-sky-800">AED {amountToFreeShipping.toFixed(2)}</strong> for Free Delivery</>
                  )}
                </span>
                <span className="font-mono font-bold text-sky-800">{progressPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-sky-200/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-sky-600 to-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* BODY / CART ITEMS */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
            {items.length === 0 ? (
              <div className="py-20 text-center text-slate-400 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-300">
                  <MdOutlineShoppingCart className="text-3xl" />
                </div>
                <h3 className="text-sm font-bold text-slate-700">Your shopping cart is empty</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Explore our catalog of smartphones, tablets, and electronics to add items to your cart.
                </p>
                <div className="pt-2">
                  <Link
                    to="/products"
                    onClick={() => setIsCartOpen(false)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-700 text-white text-xs font-semibold rounded-xl hover:bg-sky-800 transition shadow-xs"
                  >
                    <FiShoppingBag />
                    Browse Products
                  </Link>
                </div>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.sku}
                  className="flex gap-3 p-3 bg-slate-50/70 border border-slate-200/80 rounded-2xl hover:border-slate-300 transition"
                >
                  <img
                    src={item.image || "/logo.png"}
                    alt={item.name}
                    className="w-16 h-16 object-contain bg-white rounded-xl p-1 border border-slate-100 shrink-0"
                  />

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          {item.brand}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.sku)}
                          className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                          title="Remove item"
                        >
                          <FiTrash2 className="text-xs" />
                        </button>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {item.name}
                      </h4>
                      {item.color || item.storage ? (
                        <p className="text-[10.5px] text-slate-500 font-mono">
                          {[item.color, item.storage].filter(Boolean).join(" • ")}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200/60">
                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.sku, item.quantity - 1)}
                          className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 cursor-pointer"
                        >
                          <FiMinus className="text-xs" />
                        </button>
                        <span className="w-6 text-center font-mono font-bold text-xs text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.sku, item.quantity + 1)}
                          className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 cursor-pointer"
                        >
                          <FiPlus className="text-xs" />
                        </button>
                      </div>

                      {/* Live Unit/Total Price */}
                      <div className="text-right">
                        <span className="font-mono font-bold text-xs text-slate-900 block">
                          AED {(item.price * item.quantity).toFixed(2)}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-[9.5px] text-slate-400 font-mono">
                            AED {item.price.toFixed(2)} ea
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* FOOTER & CHECKOUT ACTION */}
          {items.length > 0 && (
            <div className="p-5 border-t border-slate-100 bg-slate-50/90 space-y-3">
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono font-bold text-slate-900">
                    AED {cartSubtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Delivery</span>
                  <span className="font-mono font-bold text-slate-900">
                    {shippingFee === 0 ? (
                      <span className="text-emerald-700 uppercase text-[10px] font-extrabold">FREE</span>
                    ) : (
                      `AED ${shippingFee.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total</span>
                  <span className="font-mono text-sky-800 font-black">
                    AED {cartTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleCheckoutClick}
                  className="w-full py-3 px-4 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <FiArrowRight className="text-sm" />
                </button>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-[11px] text-slate-400 hover:text-rose-600 font-medium cursor-pointer"
                  >
                    Clear Cart
                  </button>
                  <Link
                    to="/cart"
                    onClick={() => setIsCartOpen(false)}
                    className="text-[11px] text-sky-700 hover:text-sky-900 font-bold underline cursor-pointer"
                  >
                    View Full Cart Page
                  </Link>
                </div>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-1">
                <FiShield className="text-emerald-600" />
                <span>Secure Checkout • Wave Transfer &amp; Direct Delivery</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
