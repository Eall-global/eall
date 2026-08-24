import { useState } from "react";
import { motion } from "framer-motion";
import { FiLock, FiShield, FiUserCheck, FiArrowRight, FiKey, FiUsers } from "react-icons/fi";
import { useStaffAuth } from "../../context/StaffAuthContext";

const PortalLogin = () => {
  const [selectedRole, setSelectedRole] = useState("admin");
  const [pin, setPin] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [error, setError] = useState("");
  const { loginByPin, loginAsRole, members } = useStaffAuth();

  const salesMembers = members.filter((m) => m.role === "sales");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    let res;
    if (selectedRole === "admin") {
      res = loginAsRole("admin", pin);
    } else if (selectedMemberId) {
      const target = members.find((m) => m.id === selectedMemberId);
      if (target && target.pin === pin.trim()) {
        res = loginByPin(pin);
      } else {
        res = { success: false, message: "Invalid PIN for selected staff member." };
      }
    } else {
      res = loginAsRole("sales", pin);
    }

    if (!res.success) {
      setError(res.message);
    }
  };

  const handleQuickFill = (rolePin) => {
    setPin(rolePin);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Ambient Lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-sky-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8"
      >
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-700 text-white shadow-lg shadow-sky-700/30 mb-3">
            <FiLock className="text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            E-ALL Staff Portal
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Inventory Management & POS Billing
          </p>
        </div>

        {/* Role Selector */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => {
              setSelectedRole("admin");
              setSelectedMemberId("");
              setPin("");
              setError("");
            }}
            className={`
              flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer
              ${
                selectedRole === "admin"
                  ? "bg-white text-sky-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }
            `}
          >
            <FiShield className="text-base" />
            Admin
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole("sales");
              setPin("");
              setError("");
            }}
            className={`
              flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer
              ${
                selectedRole === "sales"
                  ? "bg-white text-sky-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }
            `}
          >
            <FiUserCheck className="text-base" />
            Sales Team ({salesMembers.length})
          </button>
        </div>

        {/* Specific Salesperson Picker (When in Sales mode) */}
        {selectedRole === "sales" && salesMembers.length > 0 && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FiUsers className="text-sky-700" />
              Select Sales Representative
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => {
                setSelectedMemberId(e.target.value);
                setPin("");
                setError("");
              }}
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none cursor-pointer"
            >
              <option value="">Any Sales Person (Login with your PIN)</option>
              {salesMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  👤 {m.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* PIN Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Enter Access PIN
            </label>
            <div className="relative">
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError("");
                }}
                placeholder="••••"
                className="w-full text-center text-2xl tracking-[0.4em] font-mono py-3 px-4 bg-slate-50 border-2 border-slate-200 focus:border-sky-600 focus:bg-white rounded-2xl outline-none transition"
                autoFocus
              />
              <FiKey className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
            </div>
            {error && (
              <p className="mt-2 text-xs font-medium text-rose-600 text-center">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!pin}
            className="
              w-full py-3.5 px-4 rounded-2xl bg-sky-700 hover:bg-sky-800
              disabled:opacity-50 disabled:cursor-not-allowed
              text-white font-semibold text-sm shadow-lg shadow-sky-700/25
              flex items-center justify-center gap-2 transition cursor-pointer
            "
          >
            Unlock Portal
            <FiArrowRight />
          </button>
        </form>

        {/* Demo PIN Hints */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Default Demo PINs (customizable in Settings):
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => {
                setSelectedRole("admin");
                handleQuickFill("8888");
              }}
              className="text-sky-700 hover:underline font-semibold"
            >
              Admin: <span className="font-mono">8888</span>
            </button>
            <span className="text-slate-300">•</span>
            {salesMembers.slice(0, 3).map((m, idx) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setSelectedRole("sales");
                  setSelectedMemberId(m.id);
                  handleQuickFill(m.pin);
                }}
                className="text-sky-700 hover:underline font-semibold"
              >
                {m.name.split(" ")[0]}: <span className="font-mono">{m.pin}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PortalLogin;
