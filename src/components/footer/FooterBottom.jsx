import { Link } from "react-router-dom";
import FooterSocial from "./FooterSocial";

const FooterBottom = () => {
  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-5 p-6 lg:px-10 text-center lg:text-left">

      {/* Copyright Notice */}
      <p className="text-slate-400 text-xs sm:text-sm font-normal">
        © {new Date().getFullYear()} Electronics All (E-ALL). All Rights Reserved.
      </p>

      {/* Legal & Navigation Links (Responsive wrap) */}
      <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-2 text-xs sm:text-sm">
        <Link to="/privacy" className="text-slate-400 hover:text-white transition">
          Privacy
        </Link>

        <Link to="/terms" className="text-slate-400 hover:text-white transition">
          Terms
        </Link>

        <Link to="/cookies" className="text-slate-400 hover:text-white transition">
          Cookies
        </Link>

        <Link to="/sitemap" className="text-slate-400 hover:text-white transition">
          Sitemap
        </Link>

        <Link
          to="/portal"
          className="text-slate-400 hover:text-sky-400 inline-flex items-center gap-1 transition"
          title="Staff Portal (Stock & Billing)"
        >
          Business Portal
        </Link>
      </div>

      {/* Social Media Icons */}
      <FooterSocial />
    </div>
  );
};

export default FooterBottom;
