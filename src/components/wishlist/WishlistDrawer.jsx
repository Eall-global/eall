import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FiX,
  FiHeart,
  FiTrash2,
  FiArrowRight,
  FiSend,
  FiCheckCircle,
  FiShoppingBag,
} from "react-icons/fi";
import { useWishlist } from "../../context/WishlistContext";

const WishlistDrawer = () => {
  const {
    wishlist,
    wishlistCount,
    isWishlistOpen,
    setIsWishlistOpen,
    removeFromWishlist,
    clearWishlist,
  } = useWishlist();

  if (!isWishlistOpen) return null;

  const handleRequestQuoteWhatsApp = () => {
    if (wishlist.length === 0) return;

    const itemsText = wishlist
      .map((item, idx) => `${idx + 1}. ${item.name} (${item.brand})`)
      .join("\n");

    const message =
      `Hello E-ALL Team,\n\n` +
      `I would like to request a wholesale / corporate quotation for the following ${wishlist.length} saved products:\n\n` +
      `${itemsText}\n\n` +
      `Please provide pricing and lead time. Thank you!`;

    const url = `https://wa.me/971569839269?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden text-left">
      {/* Backdrop */}
      <div
        onClick={() => setIsWishlistOpen(false)}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                <FiHeart className="text-xl fill-rose-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Saved Products ({wishlistCount})
                </h2>
                <p className="text-xs text-slate-400">
                  Shortlisted for quote & procurement
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsWishlistOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              <FiX className="text-xl" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
            {wishlist.length === 0 ? (
              <div className="py-20 text-center text-slate-400 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-300">
                  <FiHeart className="text-3xl" />
                </div>
                <h3 className="text-sm font-bold text-slate-700">Your wishlist is empty</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Click the heart icon on any product to save items for quick quotation or comparison.
                </p>
                <div className="pt-2">
                  <Link
                    to="/products"
                    onClick={() => setIsWishlistOpen(false)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-700 text-white text-xs font-semibold rounded-xl hover:bg-sky-800 transition"
                  >
                    <FiShoppingBag />
                    Browse Catalog
                  </Link>
                </div>
              </div>
            ) : (
              wishlist.map((item) => (
                <div
                  key={item.id || item.slug}
                  className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-14 h-14 object-contain rounded-xl bg-slate-50 p-1 shrink-0"
                    onError={(e) => {
                      e.target.src = "/logo.png";
                    }}
                  />

                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
                      {item.brand}
                    </span>
                    <Link
                      to={`/products/${item.slug}`}
                      onClick={() => setIsWishlistOpen(false)}
                      className="block text-xs sm:text-sm font-bold text-slate-900 hover:text-sky-700 truncate"
                    >
                      {item.name}
                    </Link>
                    <span className="inline-block mt-0.5 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {item.availability}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromWishlist(item.slug)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                    title="Remove from Wishlist"
                  >
                    <FiTrash2 className="text-base" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer CTA */}
          {wishlist.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/70 space-y-2">
              <button
                type="button"
                onClick={handleRequestQuoteWhatsApp}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                <FiSend />
                <span>Request Quotation on WhatsApp ({wishlistCount})</span>
              </button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={clearWishlist}
                  className="text-[11px] text-slate-400 hover:text-rose-600 font-medium transition cursor-pointer"
                >
                  Clear All
                </button>

                <Link
                  to="/contact"
                  onClick={() => setIsWishlistOpen(false)}
                  className="text-[11px] text-sky-700 hover:text-sky-900 font-semibold transition"
                >
                  Submit Quote Inquiry Form →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WishlistDrawer;
