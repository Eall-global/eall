import { Link } from "react-router-dom";
import {
  FiHome,
  FiTag,
  FiTool,
  FiInfo,
  FiMail,
  FiShield,
} from "react-icons/fi";
import MobileCategoryAccordion from "./MobileCategoryAccordion";
import { useCountry } from "../../../context/CountryContext";

const MobileNavigation = ({ onClose }) => {
  const { countryPath } = useCountry();

  const linkClass =
    "flex items-center gap-3 rounded-xl px-2.5 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-100/90 hover:text-sky-700 transition";

  const iconWrapClass =
    "w-7 h-7 rounded-lg bg-slate-100/90 text-sky-700 flex items-center justify-center shrink-0 text-sm";

  return (
    <section className="space-y-0.5 text-left">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
        Browse Store
      </p>

      <Link to={countryPath("/")} onClick={onClose} className={linkClass}>
        <span className={iconWrapClass}>
          <FiHome />
        </span>
        <span>Home</span>
      </Link>

      <MobileCategoryAccordion onClose={onClose} />

      <Link to={countryPath("/brands")} onClick={onClose} className={linkClass}>
        <span className={iconWrapClass}>
          <FiTag />
        </span>
        <span>Official Brands</span>
      </Link>

      <Link to={countryPath("/verify")} onClick={onClose} className={linkClass}>
        <span className={iconWrapClass}>
          <FiShield />
        </span>
        <span>Verify IMEI &amp; Warranty</span>
      </Link>

      <div className="my-2 border-t border-slate-100" />

      <Link
        to={countryPath("/services")}
        onClick={onClose}
        className={linkClass}
      >
        <span className={iconWrapClass}>
          <FiTool />
        </span>
        <span>Services</span>
      </Link>

      <Link to={countryPath("/about")} onClick={onClose} className={linkClass}>
        <span className={iconWrapClass}>
          <FiInfo />
        </span>
        <span>About Us</span>
      </Link>

      <Link
        to={countryPath("/contact")}
        onClick={onClose}
        className={linkClass}
      >
        <span className={iconWrapClass}>
          <FiMail />
        </span>
        <span>Contact Support</span>
      </Link>
    </section>
  );
};

export default MobileNavigation;
