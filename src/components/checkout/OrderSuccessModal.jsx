import { Link, useNavigate } from "react-router-dom";
import {
  FiCheckCircle,
  FiX,
  FiCopy,
  FiPhoneCall,
  FiPackage,
  FiArrowRight,
  FiClock,
} from "react-icons/fi";
import { useState } from "react";
import { WAVE_PAYMENT_CONFIG } from "../../constants/paymentConfig";

const OrderSuccessModal = ({ order, onClose }) => {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  if (!order) return null;

  const handleCopyMerchantCode = () => {
    navigator.clipboard.writeText(WAVE_PAYMENT_CONFIG.merchantPhone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 text-left">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        
        {/* HEADER */}
        <div className="p-6 bg-linear-to-br from-emerald-600 via-teal-700 to-sky-900 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <FiX className="text-xl" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 text-white rounded-2xl border border-white/30 shrink-0">
              <FiCheckCircle className="text-3xl" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase bg-white/20 px-2.5 py-0.5 rounded-full text-white tracking-wider">
                Order Received
              </span>
              <h2 className="text-xl font-black text-white mt-1">
                Thank You for Your Order!
              </h2>
              <p className="text-xs text-emerald-100 font-mono">
                Order Ref: <strong>{order.orderId}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-4 text-xs">
          
          {/* WAVE TRANSFER INSTRUCTIONS CARD */}
          {order.paymentMethod === "wave" && (
            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-sky-200/60 pb-2">
                <span className="font-bold text-sky-950 flex items-center gap-1.5 text-xs">
                  🌊 Wave Money Transfer Payment Details
                </span>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Pending Transfer
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-sky-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Wave Merchant Phone</span>
                  <span className="font-mono font-black text-slate-900 text-sm">
                    {WAVE_PAYMENT_CONFIG.merchantPhone}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyMerchantCode}
                  className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white text-[10px] font-bold uppercase rounded-lg transition cursor-pointer flex items-center gap-1"
                >
                  <FiCopy />
                  <span>{copied ? "Copied!" : "Copy Number"}</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-600 space-y-1 leading-relaxed">
                <p><strong>1.</strong> Open your Wave App on your phone.</p>
                <p><strong>2.</strong> Send <strong>AED {order.total.toFixed(2)}</strong> to <strong>{WAVE_PAYMENT_CONFIG.merchantPhone}</strong>.</p>
                <p><strong>3.</strong> Include Note: <strong className="font-mono text-sky-800">{order.orderId}</strong>.</p>
              </div>
            </div>
          )}

          {/* ORDER ITEMS SUMMARY */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-1">
              Order Items ({order.items?.length || 0})
            </h3>
            <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 pr-1">
              {order.items?.map((item, idx) => (
                <div key={idx} className="py-2 first:pt-0 flex justify-between items-center text-slate-700">
                  <div className="truncate pr-2">
                    <span className="font-bold text-slate-900 block truncate">{item.name}</span>
                    <span className="text-[10.5px] text-slate-400 font-mono">Qty: {item.quantity}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 shrink-0">
                    AED {(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs font-bold">
              <span>Grand Total</span>
              <span className="font-mono text-sky-800 text-sm font-black">
                AED {order.total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate("/profile");
              }}
              className="w-full py-3 px-4 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <FiPackage />
              <span>Track Order in Profile</span>
              <FiArrowRight />
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                navigate("/products");
              }}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase rounded-xl transition cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrderSuccessModal;
