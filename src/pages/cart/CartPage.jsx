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
  FiChevronRight,
  FiHeart,
  FiSmartphone,
  FiHeadphones,
  FiTag,
} from "react-icons/fi";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useCountry } from "../../context/CountryContext";
import { AedPrice } from "../../components/common/AedSymbol";
import CountryFlag from "../../components/common/CountryFlag";

const CartPage = () => {
  const {
    items,
    cartCount,
    cartSubtotal,
    shippingFee,
    freeShippingThreshold,
    cartTotal,
    removeFromCart,
    updateQuantity,
    clearCart,
  } = useCart();

  const { wishlistCount } = useWishlist();
  const { activeCountry, countryPath } = useCountry();
  const navigate = useNavigate();

  const handleProceedToCheckout = () => {
    navigate(countryPath("/checkout"));
  };

  const threshold = Number(
    freeShippingThreshold ?? activeCountry.freeShippingThreshold ?? 500
  );
  const amountToFreeShipping = Math.max(0, threshold - cartSubtotal);
  const freeShippingProgress = Math.min(
    100,
    Math.round((cartSubtotal / Math.max(1, threshold)) * 100)
  );
  const aedTotal =
    activeCountry.code === "AE"
      ? cartTotal
      : cartTotal / Math.max(0.0001, Number(activeCountry.fxRateFromAed) || 1);
  const usdEquivalent = (aedTotal / 3.6725).toFixed(2);

  const QUICK_DEPARTMENTS = [
    {
      label: "Smartphones",
      icon: FiSmartphone,
      to: "/products?category=mobile-devices&subcategory=smartphones",
    },
    {
      label: "Audio & Earbuds",
      icon: FiHeadphones,
      to: "/products?category=consumer-electronics&subcategory=audio",
    },
    {
      label: "Official Brands",
      icon: FiTag,
      to: "/brands",
    },
    {
      label: "All Products",
      icon: FiShoppingBag,
      to: "/products",
    },
  ];

  return (
    <div
      className={`min-h-[calc(100vh-3.5rem)] xl:min-h-screen bg-slate-50 pt-[81px] sm:pt-[93px] xl:pt-[142px] text-left ${
        items.length > 0 ? "pb-24 lg:pb-14" : "pb-8 sm:pb-14"
      }`}
    >
      {/* ================================================================= */}
      {/* UNIFIED BREADCRUMB BAR (Matches Shop & Official Brand Stores)     */}
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
              <span className="text-slate-900 font-bold truncate">
                Shopping Cart
                {cartCount > 0 ? ` (${cartCount})` : ""}
              </span>
            </nav>

            {items.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-slate-500 hover:text-rose-600 transition cursor-pointer shrink-0"
              >
                <FiTrash2 className="text-xs" />
                <span>Clear Cart</span>
              </button>
            )}
          </div>

          {/* Desktop Heading Row (xl+) */}
          <div className="hidden xl:flex items-center justify-between gap-4">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <FiShoppingCart className="text-sky-700 shrink-0" />
              <span>Shopping Cart</span>
              {cartCount > 0 && (
                <span className="text-xs bg-sky-100 text-sky-800 font-bold px-2.5 py-0.5 rounded-full border border-sky-200">
                  {cartCount} {cartCount === 1 ? "item" : "items"}
                </span>
              )}
            </h1>
          </div>
        </div>
      </section>

      <div className="w-full max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-4 sm:space-y-6">
        {/* ================================================================= */}
        {/* MAIN CONTENT: EMPTY STATE VS. FILLED CART                         */}
        {/* ================================================================= */}
        {items.length === 0 ? (
          <div className="max-w-md mx-auto space-y-4 pt-1 sm:pt-4">
            {/* Primary Empty State Card */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-center border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-3.5">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 text-sky-700 flex items-center justify-center mx-auto text-2xl">
                <FiShoppingCart />
              </div>
              <div className="space-y-1">
                <h2 className="text-[15px] sm:text-lg font-extrabold text-slate-900">
                  Your cart is empty
                </h2>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Add genuine smartphones, tablets, or accessories to check out with fast, insured delivery.
                </p>
              </div>
              <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-2">
                <Link
                  to={countryPath("/products")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl transition shadow-xs"
                >
                  <FiShoppingBag />
                  <span>Start Shopping</span>
                </Link>

                {wishlistCount > 0 && (
                  <Link
                    to={countryPath("/profile?view=wishlist")}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition"
                  >
                    <FiHeart className="text-rose-500" />
                    <span>Saved Wishlist ({wishlistCount})</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Quick Explore Shortcuts (Keeps Mobile Shoppers Engaged) */}
            <section>
              <h3 className="text-xs font-bold text-slate-500 px-1 mb-2">
                Explore Store
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_DEPARTMENTS.map((dept) => {
                  const Icon = dept.icon;
                  return (
                    <Link
                      key={dept.label}
                      to={countryPath(dept.to)}
                      className="bg-white rounded-2xl px-3.5 py-3 border border-slate-200/80 hover:border-sky-300 shadow-[0_1px_2px_rgba(15,23,42,0.03)] flex items-center justify-between gap-2 transition"
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Icon className="text-sky-700 text-base shrink-0" />
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {dept.label}
                        </span>
                      </span>
                      <FiChevronRight className="text-slate-400 text-sm shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* Compact Warranty + Active Storefront Region Bar */}
            <div className="bg-white rounded-2xl px-4 py-3 border border-slate-200/80 flex items-center justify-between gap-3 text-[11.5px] shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                <FiShield className="text-emerald-600 text-sm shrink-0" />
                <span>Official Warranty</span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600 shrink-0">
                <CountryFlag code={activeCountry.code} className="w-4 h-3" />
                <span>
                  {activeCountry.shortName} · {activeCountry.currency}
                </span>
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
            {/* ITEMS COLUMN */}
            <div className="lg:col-span-7 space-y-3.5">
              {/* Free Shipping Progress Banner */}
              <div className="bg-white border border-sky-200/80 rounded-2xl p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-2">
                <div className="flex items-center gap-2.5 text-xs">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      amountToFreeShipping === 0
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-sky-50 text-sky-700"
                    }`}
                  >
                    <FiTruck className="text-base" />
                  </div>
                  <div className="min-w-0">
                    {amountToFreeShipping === 0 ? (
                      <p className="font-bold text-emerald-700 text-xs">
                        You unlocked FREE Express Delivery!
                      </p>
                    ) : (
                      <p className="text-slate-700 font-medium text-xs flex items-center gap-1 flex-wrap">
                        <span>Add</span>
                        <AedPrice
                          amount={amountToFreeShipping}
                          className="font-mono text-sky-800 font-bold"
                        />
                        <span>more for</span>
                        <strong className="text-emerald-700 font-bold">
                          FREE Delivery
                        </strong>
                      </p>
                    )}
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      amountToFreeShipping === 0 ? "bg-emerald-500" : "bg-sky-600"
                    }`}
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>

              {/* Cart Items Surface Card */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden divide-y divide-slate-100">
                {items.map((item) => (
                  <div
                    key={item.sku}
                    className="p-3.5 sm:p-5 flex items-start gap-3"
                  >
                    <img
                      src={item.image || "/logo.png"}
                      alt={item.name}
                      className="w-16 h-16 sm:w-18 sm:h-18 object-contain bg-slate-50 rounded-xl p-1.5 border border-slate-100 shrink-0"
                    />

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">
                            {item.brand}
                          </span>
                          <h3 className="text-[13px] sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                            {item.name}
                          </h3>
                          {item.color || item.storage ? (
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {[item.color, item.storage].filter(Boolean).join(" · ")}
                            </p>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.sku)}
                          className="p-1.5 -mr-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer shrink-0"
                          aria-label={`Remove ${item.name}`}
                        >
                          <FiTrash2 className="text-sm" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        {/* Quantity Stepper */}
                        <div className="inline-flex items-center gap-0.5 bg-slate-50 border border-slate-200 rounded-xl p-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.sku, item.quantity - 1)
                            }
                            aria-label="Decrease quantity"
                            className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 rounded-lg active:bg-slate-200 cursor-pointer"
                          >
                            <FiMinus className="text-xs" />
                          </button>
                          <span className="w-7 text-center font-mono font-bold text-xs text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.sku, item.quantity + 1)
                            }
                            aria-label="Increase quantity"
                            className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 rounded-lg active:bg-slate-200 cursor-pointer"
                          >
                            <FiPlus className="text-xs" />
                          </button>
                        </div>

                        {/* Line Price */}
                        <div className="text-right">
                          <AedPrice
                            amount={item.price * item.quantity}
                            className="font-black text-xs sm:text-sm text-slate-900 justify-end"
                          />
                          {item.quantity > 1 && (
                            <span className="text-[10px] font-mono text-slate-400 block">
                              <AedPrice amount={item.price} /> ea
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ORDER SUMMARY COLUMN */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-4">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
                  Order Summary
                </h2>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between items-center">
                    <span>Subtotal ({cartCount} {cartCount === 1 ? "item" : "items"})</span>
                    <AedPrice
                      amount={cartSubtotal}
                      className="font-bold text-slate-900"
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Delivery</span>
                    {shippingFee === 0 ? (
                      <span className="text-emerald-700 font-extrabold text-[10.5px] uppercase">
                        FREE
                      </span>
                    ) : (
                      <AedPrice
                        amount={shippingFee}
                        className="font-bold text-slate-900"
                      />
                    )}
                  </div>

                  <div className="pt-2.5 border-t border-slate-200 flex justify-between items-baseline">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      Total
                    </span>
                    <div className="text-right">
                      <AedPrice
                        amount={cartTotal}
                        className="font-black text-lg sm:text-xl text-sky-800 justify-end"
                        symbolClassName="text-sky-700"
                      />
                      <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                        ≈ USD {usdEquivalent}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Desktop / Inline Checkout CTA */}
                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  className="hidden lg:flex w-full py-3.5 px-4 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <FiArrowRight />
                </button>

                <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-slate-100 text-[11.5px]">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600">
                    <FiShield className="text-emerald-600 text-sm shrink-0" />
                    <span>Official Warranty</span>
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
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* STICKY MOBILE CHECKOUT ACTION BAR (When Cart Has Items, < lg)     */}
      {/* ================================================================= */}
      {items.length > 0 && (
        <div className="lg:hidden fixed left-0 right-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(15,23,42,0.06)] px-3.5 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-none">
                Total ({cartCount})
              </span>
              <AedPrice
                amount={cartTotal}
                className="text-base font-black text-slate-900 mt-0.5"
                symbolClassName="text-sky-700"
              />
            </div>

            <button
              type="button"
              onClick={handleProceedToCheckout}
              className="flex-1 max-w-[210px] h-11 px-4 rounded-xl bg-sky-700 hover:bg-sky-800 active:scale-[0.99] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <span>Checkout</span>
              <FiArrowRight className="text-sm" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
