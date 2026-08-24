import { Link } from "react-router-dom";
import FooterSocial from "./FooterSocial";

const FooterBottom = () => {
  return (
    <div
      className="
      flex
      flex-col
      lg:flex-row
      justify-between
      items-center
      gap-6
      p-6 lg:px-10
    "
    >
      <p className="text-slate-500 text-sm">
        © {new Date().getFullYear()} Electronics All (E-ALL). All Rights
        Reserved.
      </p>

      <div className="flex gap-6 text-sm">
        <Link to="/privacy" className="text-slate-400 hover:text-white">
          Privacy
        </Link>

        <Link to="/terms" className="text-slate-400 hover:text-white">
          Terms
        </Link>

        <Link to="/cookies" className="text-slate-400 hover:text-white">
          Cookies
        </Link>

        <Link to="/sitemap" className="text-slate-400 hover:text-white">
          Sitemap
        </Link>

        <Link
          to="/portal"
          className="text-slate-500 hover:text-sky-400 inline-flex items-center gap-1 transition"
          title="Staff Portal (Stock & Billing)"
        >
          <span>Staff Portal</span>
        </Link>
      </div>

      <FooterSocial />
    </div>
  );
};

export default FooterBottom;
