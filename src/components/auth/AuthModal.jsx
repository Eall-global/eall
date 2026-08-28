import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiX,
  FiUser,
  FiMail,
  FiLock,
  FiPhone,
  FiGlobe,
  FiMapPin,
  FiArrowRight,
  FiAlertCircle,
} from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { useCustomerAuth } from "../../context/CustomerAuthContext";

const AuthModal = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authMode,
    setAuthMode,
    login,
    register,
    loginWithGoogle,
    loading,
    error,
    redirectAfterAuth,
  } = useCustomerAuth();

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    country: "Senegal",
    city: "Dakar",
    shippingAddress: "",
  });

  if (!isAuthModalOpen) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();

    if (authMode === "login") {
      const res = await login(formData.email, formData.password);
      if (res.success && redirectAfterAuth) {
        navigate(redirectAfterAuth);
      }
    } else {
      const res = await register(formData);
      if (res.success && redirectAfterAuth) {
        navigate(redirectAfterAuth);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    const res = await loginWithGoogle();
    if (res.success && redirectAfterAuth) {
      navigate(redirectAfterAuth);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 text-left">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        
        {/* HEADER */}
        <div className="p-6 bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white relative">
          <button
            type="button"
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <FiX className="text-xl" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-500/20 text-sky-300 rounded-2xl border border-sky-400/30">
              <FiUser className="text-2xl" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">
                {authMode === "login" ? "Customer Sign In" : "Create Customer Account"}
              </h2>
              <p className="text-xs text-sky-200/80 mt-0.5">
                {authMode === "login"
                  ? "Sign in with your registered account to proceed"
                  : "Register with your verified delivery details"}
              </p>
            </div>
          </div>

          {/* TAB TOGGLE */}
          <div className="mt-5 flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/80">
            <button
              type="button"
              onClick={() => setAuthMode("login")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                authMode === "login"
                  ? "bg-sky-700 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("register")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                authMode === "register"
                  ? "bg-sky-700 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* BODY CONTENT */}
        <div className="p-6 space-y-4">
          
          {/* ⚡ ONE-CLICK GOOGLE SIGN IN */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-2xs transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
          >
            <FcGoogle className="text-xl" />
            <span>Continue with Google</span>
          </button>

          {/* DIVIDER */}
          <div className="flex items-center gap-3 my-2">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
              or use email
            </span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          {/* ERROR ALERT */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
              <FiAlertCircle className="text-base shrink-0 mt-0.5" />
              <p className="leading-relaxed font-semibold">{error}</p>
            </div>
          )}

          {/* SIGN IN FORM */}
          {authMode === "login" && (
            <form onSubmit={handleEmailSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-sky-700 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
                  Password *
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input
                    required
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-sky-700 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer mt-2"
              >
                {loading ? "Authenticating..." : "Sign In to Account"}
                <FiArrowRight />
              </button>

              <div className="text-center pt-1 text-[11px] text-slate-500">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setAuthMode("register")}
                  className="font-bold text-sky-700 hover:underline cursor-pointer"
                >
                  Create one now
                </button>
              </div>
            </form>
          )}

          {/* CREATE ACCOUNT FORM */}
          {authMode === "register" && (
            <form onSubmit={handleEmailSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input
                    required
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Amadou Diallo"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-sky-700 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
                    Email *
                  </label>
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@mail.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-sky-700 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
                    Password *
                  </label>
                  <input
                    required
                    type="password"
                    name="password"
                    minLength={6}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 6 chars"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-sky-700 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
                    Phone / Wave Number *
                  </label>
                  <input
                    required
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+221 77 123 4567"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-sky-700 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
                    Country *
                  </label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-sky-700 outline-none"
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
                  Default Delivery Address *
                </label>
                <textarea
                  required
                  rows={2}
                  name="shippingAddress"
                  value={formData.shippingAddress}
                  onChange={handleChange}
                  placeholder="Street, District, Building number"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-sky-700 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer mt-1"
              >
                {loading ? "Creating Account..." : "Create Customer Account"}
                <FiArrowRight />
              </button>

              <div className="text-center pt-1 text-[11px] text-slate-500">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className="font-bold text-sky-700 hover:underline cursor-pointer"
                >
                  Sign in here
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};

export default AuthModal;
