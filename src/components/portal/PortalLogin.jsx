import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiShield,
  FiUserCheck,
  FiArrowRight,
  FiArrowLeft,
  FiKey,
  FiUsers,
} from "react-icons/fi";
import { useStaffAuth } from "../../context/StaffAuthContext";
import PortalThemeToggle from "./PortalThemeToggle";

const PortalLogin = () => {
  const [selectedRole, setSelectedRole] = useState("admin");
  const [pin, setPin] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [error, setError] = useState("");
  const { loginByPin, loginAsRole, members } = useStaffAuth();

  const salesMembers = members.filter(
    (m) => m.role !== "admin" && m.status !== "suspended"
  );

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

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 transition-colors duration-200 overflow-hidden">
      {/* Subtle Ambient Background Accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] bg-sky-500/10 dark:bg-sky-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 right-1/4 w-[24rem] h-[24rem] bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-3xl" />
      </div>

      {/* Top Utility Bar: Back to Website + Theme Switcher */}
      <div className="relative z-10 w-full flex items-center justify-between gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 text-xs font-semibold shadow-2xs transition"
        >
          <FiArrowLeft className="text-sm" />
          <span>Public Storefront</span>
        </Link>

        <PortalThemeToggle />
      </div>

      {/* Centered Login Card */}
      <div className="relative z-10 flex-1 flex items-center justify-center py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-md bg-white dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-900/5 dark:shadow-black/40 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 text-left"
        >
          {/* Brand Header */}
          <div className="text-center mb-6 space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 p-2.5 mx-auto">
              <img
                src="/logo.png"
                alt="E-ALL Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
            <div className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              E-ALL Business Portal
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Staff Sign In • Inventory, Procurement &amp; POS Billing
            </p>
          </div>

          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 mb-5">
            <button
              type="button"
              onClick={() => {
                setSelectedRole("admin");
                setSelectedMemberId("");
                setPin("");
                setError("");
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                selectedRole === "admin"
                  ? "bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-xs ring-1 ring-slate-900/5 dark:ring-white/10"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FiShield className="text-base" />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole("sales");
                setPin("");
                setError("");
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                selectedRole === "sales"
                  ? "bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-xs ring-1 ring-slate-900/5 dark:ring-white/10"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FiUserCheck className="text-base" />
              <span>Sales Team ({salesMembers.length})</span>
            </button>
          </div>

          {/* Specific Salesperson Picker */}
          {selectedRole === "sales" && salesMembers.length > 0 && (
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FiUsers className="text-sky-600 dark:text-sky-400" />
                <span>Select Sales Representative</span>
              </label>
              <select
                value={selectedMemberId}
                onChange={(e) => {
                  setSelectedMemberId(e.target.value);
                  setPin("");
                  setError("");
                }}
                className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 dark:focus:border-sky-500 transition cursor-pointer"
              >
                <option value="">Any Sales Person (Login with your PIN)</option>
                {salesMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* PIN Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
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
                  className="w-full text-center text-2xl tracking-[0.4em] font-mono py-3 px-4 bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-sky-600 dark:focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl outline-none transition"
                  autoFocus
                />
                <FiKey className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-lg pointer-events-none" />
              </div>
              {error && (
                <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400 text-center">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!pin}
              className="w-full py-3.5 px-4 rounded-2xl bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-lg shadow-sky-700/20 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>Unlock Portal</span>
              <FiArrowRight />
            </button>
          </form>
        </motion.div>
      </div>

      {/* Subtle Footer */}
      <p className="relative z-10 text-center text-[11px] text-slate-400 dark:text-slate-500">
        Electronics All FZCO • Authorized Staff Access Only
      </p>
    </div>
  );
};

export default PortalLogin;
