import { Link } from "react-router-dom";
import {
  FiHome,
  FiTag,
  FiLayers,
  FiTool,
  FiInfo,
  FiMail,
} from "react-icons/fi";
import MobileCategoryAccordion from "./MobileCategoryAccordion";

const MobileNavigation = ({ onClose }) => {
  const linkClass = `
    flex
    items-center
    gap-3
    rounded-xl
    px-4
    py-3
    text-slate-700
    hover:bg-slate-100
    hover:text-sky-700
    transition
  `;

  const iconClass = `
    text-lg
    text-sky-700
  `;

  return (
    <section className="space-y-1 text-left">
      <p className="text-xs uppercase tracking-wider text-slate-500 mb-2!">
        Navigation
      </p>

      <Link to="/" onClick={onClose} className={linkClass}>
        <FiHome className={iconClass} />

        <span>Home</span>
      </Link>

      <MobileCategoryAccordion onClose={onClose} />

      <Link to="/brands" onClick={onClose} className={linkClass}>
        <FiTag className={iconClass} />

        <span>Brands</span>
      </Link>

      <Link to="/solutions" onClick={onClose} className={linkClass}>
        <FiLayers className={iconClass} />

        <span>Solutions</span>
      </Link>

      <Link to="/services" onClick={onClose} className={linkClass}>
        <FiTool className={iconClass} />

        <span>Services</span>
      </Link>

      <Link to="/about" onClick={onClose} className={linkClass}>
        <FiInfo className={iconClass} />

        <span>About</span>
      </Link>

      <Link to="/contact" onClick={onClose} className={linkClass}>
        <FiMail className={iconClass} />

        <span>Contact</span>
      </Link>
    </section>
  );
};

export default MobileNavigation;
