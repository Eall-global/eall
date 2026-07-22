import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";

const MegaMenuFooter = ({ onClose }) => {
  return (
    <div className=" mt-10 pt-8 border-t border-slate-200 flex justify-between items-center text-left">
      <div>
        <h3 className=" font-semibold text-slate-900">Need bulk pricing?</h3>

        <p className="text-sm text-slate-500 mt-1">
          Talk with our sales team for wholesale requirements.
        </p>
      </div>

      <Link
        to="/products"
        onClick={onClose}
        className=" flex items-center gap-2 text-sky-700 font-semibold hover:gap-3 transition-all"
      >
        Browse Complete Catalogue
        <FiArrowRight />
      </Link>
    </div>
  );
};

export default MegaMenuFooter;
