import { useState } from "react";
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
} from "react-icons/fi";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import { useWishlist } from "../../context/WishlistContext";

const ProfilePage = () => {
  const { user, isLoggedIn, orders, logout, updateProfile, openAuthModal } = useCustomerAuth();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("orders"); // 'orders' | 'profile' | 'wishlist'
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
    country: user?.country || "Senegal",
    city: user?.city || "Dakar",
    shippingAddress: user?.shippingAddress || "",
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

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

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProfile(formData);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 sm:pt-28 lg:pt-32 pb-16 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* TOP PROFILE CARD */}
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-sky-500/20 border border-sky-400/30 text-sky-300 font-black text-lg sm:text-xl flex items-center justify-center shrink-0">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-xl font-bold text-white truncate">
                  {user?.fullName || "Customer"}
                </h1>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded-full shrink-0">
                  Customer
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 font-mono mt-0.5 flex flex-wrap items-center gap-2">
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

        {/* TABS NAVIGATION (Segmented Control) */}
        <div className="grid grid-cols-3 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`py-2.5 px-2 text-[11px] sm:text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer text-center ${activeTab === "orders"
                ? "bg-sky-700 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
          >
            <FiPackage className="text-sm shrink-0" />
            <span className="truncate">Orders ({orders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`py-2.5 px-2 text-[11px] sm:text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer text-center ${activeTab === "profile"
                ? "bg-sky-700 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
          >
            <FiUser className="text-sm shrink-0" />
            <span className="truncate">Account Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("wishlist")}
            className={`py-2.5 px-2 text-[11px] sm:text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer text-center ${activeTab === "wishlist"
                ? "bg-sky-700 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
          >
            <FiHeart className="text-sm shrink-0" />
            <span className="truncate">Wishlist ({wishlist.length})</span>
          </button>
        </div>

        {/* TAB CONTENT */}

        {/* TAB 1: ORDER HISTORY */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200 flex flex-col gap-3 items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-2xl">
                  <FiClock />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">No orders placed yet</h3>
                <p className="text-xs text-slate-500 max-w-sm text-center leading-relaxed">
                  When you place an order with Wave Transfer or COD, your order details and delivery status will appear here.
                </p>
                <div className="pt-2">
                  <Link
                    to="/products"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold uppercase rounded-xl transition shadow-xs"
                  >
                    <FiShoppingBag /> Start Shopping
                  </Link>
                </div>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.orderId}
                  className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-2xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-slate-900 text-xs sm:text-sm">
                          {order.orderId}
                        </span>
                        <span className={`text-[9px] sm:text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${order.status === "Completed" || order.status === "Paid"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}>
                          {order.status || "Pending Wave Transfer"}
                        </span>
                      </div>
                      <span className="text-[10.5px] text-slate-400 font-mono mt-0.5 block">
                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="font-mono font-black text-sky-800 text-sm sm:text-base block">
                        AED {order.total.toFixed(2)}
                      </span>
                      <span className="text-[10.5px] text-slate-500 font-semibold">
                        {order.paymentMethodName || "Wave Transfer"}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="divide-y divide-slate-100">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={item.image || "/logo.png"}
                            alt={item.name}
                            className="w-9 h-9 object-contain bg-slate-50 rounded-lg p-1 border border-slate-100"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block truncate max-w-[200px] sm:max-w-xs">{item.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">Qty: {item.quantity} × AED {item.price.toFixed(2)}</span>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-slate-800 text-xs">
                          AED {(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Info */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 flex flex-col sm:flex-row justify-between gap-1.5">
                    <div>
                      <span className="font-bold text-slate-700">Delivery Address: </span>
                      <span>{order.shippingAddress || "Doorstep Address"}, {order.city}, {order.country}</span>
                    </div>
                    {order.waveTransactionId && (
                      <div className="font-mono text-xs text-sky-800">
                        <strong>Wave Ref:</strong> {order.waveTransactionId}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: PROFILE EDIT */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Personal Details &amp; Address</h2>
                <p className="text-xs text-slate-500">Update your default delivery information</p>
              </div>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  <FiEdit2 /> Edit
                </button>
              ) : null}
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <FiCheckCircle className="text-base shrink-0" />
                <span>Profile details updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    disabled={!isEditing}
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold disabled:opacity-75"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
                    Phone / Wave Number
                  </label>
                  <input
                    disabled={!isEditing}
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold disabled:opacity-75"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
                    Country
                  </label>
                  <input
                    disabled={!isEditing}
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold disabled:opacity-75"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
                    City
                  </label>
                  <input
                    disabled={!isEditing}
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold disabled:opacity-75"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
                  Default Delivery Address
                </label>
                <textarea
                  rows={2}
                  disabled={!isEditing}
                  value={formData.shippingAddress}
                  onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                  placeholder="Street, District, Door number"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold disabled:opacity-75"
                />
              </div>

              {isEditing && (
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <FiSave /> Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* TAB 3: WISHLIST */}
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
                  <div key={item.slug} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
                    <img
                      src={item.image || "/logo.png"}
                      alt={item.name}
                      className="w-12 h-12 object-contain bg-white rounded-xl p-1 border border-slate-100 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[9.5px] font-bold text-sky-700 uppercase">{item.brand}</span>
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
    </div>
  );
};

export default ProfilePage;
