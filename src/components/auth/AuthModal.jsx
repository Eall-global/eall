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
  FiCheckCircle,
} from "react-icons/fi";
import { useCustomerAuth } from "../../context/CustomerAuthContext";

const AuthModal = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authMode,
    setAuthMode,
    login,
    register,
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (authMode === "login") {
      const res = await login(formData.email, formData.password);
      if (res.success) {
        if (redirectAfterAuth) {
          navigate(redirectAfterAuth);
        }
      }
    } else {
      const res = await register(formData);
      if (res.success) {
        if (redirectAfterAuth) {
          navigate(redirectAfterAuth);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 text-left">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        
        {/* HEADER */}
        <div className="p-6 bg-linear-to-br from-slate-900 via-sky-950 to-slate-900 text-white relative">
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
                {authMode === "login" ? "Welcome Back to E-ALL" : "Create Customer Account"}
              </h2>
              <p className="text-xs text-sky-200/80 mt-0.5">
                {authMode === "login"
                  ? "Sign in to access your orders & process checkout"
                  : "Register to track orders & seamless Wave checkout"}
              </p>
            </div>
          </div>

          {/* TAB TOGGLE */}
          <div className="mt-6 flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/80">
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

        {/* FORM BODY */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <FiAlertCircle className="text-base shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {authMode === "register" && (
            <div>
              <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
                Full Name *
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-3 text-slate-400" />
                <input
                  required
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Ousmane Diop"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 text-xs text-slate-900 font-semibold"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
              Email Address *
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 top-3 text-slate-400" />
              <input
                required
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="ousmane@example.com"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 text-xs text-slate-900 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
              Password *
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-3 text-slate-400" />
              <input
                required
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 text-xs text-slate-900 font-semibold"
              />
            </div>
          </div>

          {authMode === "register" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
                    Phone / Wave No. *
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-3 text-slate-400" />
                    <input
                      required
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+221 77 123 4567"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 text-xs text-slate-900 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
                    Country *
                  </label>
                  <div className="relative">
                    <FiGlobe className="absolute left-3 top-3 text-slate-400" />
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 text-xs text-slate-900 font-semibold"
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
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
                  Delivery Address
                </label>
                <div className="relative">
                  <FiMapPin className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    name="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={handleChange}
                    placeholder="Street, District, City"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 text-xs text-slate-900 font-semibold"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white font-bold uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer mt-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{authMode === "login" ? "Sign In to Continue" : "Create Account & Continue"}</span>
                <FiArrowRight />
              </>
            )}
          </button>

          <div className="pt-2 text-center text-[11px] text-slate-500">
            {authMode === "login" ? (
              <p>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setAuthMode("register")}
                  className="text-sky-700 font-bold hover:underline cursor-pointer"
                >
                  Create Account
                </button>
              </p>
            ) : (
              <p>
                Already registered?{" "}
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className="text-sky-700 font-bold hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </form>

      </div>
    </div>
  );
};

export default AuthModal;
