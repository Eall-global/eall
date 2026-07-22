import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";

const MegaMenuCTA = () => {
  return (
    <div
      className="
        rounded-3xl
        bg-slate-50
        p-8
        flex
        flex-col
        justify-between
      "
    >
      <div>
        <span
          className="
            inline-block
            rounded-full
            bg-sky-100
            px-3
            py-1
            text-xs
            font-medium
            text-sky-700
          "
        >
          Catalogue
        </span>

        <h3 className="mt-5 text-2xl font-bold text-slate-900">
          Explore Our Complete Product Portfolio
        </h3>

        <p className="mt-4 text-slate-600 leading-7">
          Browse smartphones, networking, accessories, enterprise solutions, and
          consumer electronics from global brands.
        </p>
      </div>

      <Link
        to="/products"
        className="
          mt-8
          inline-flex
          items-center
          gap-2
          text-sky-700
          font-semibold
        "
      >
        Browse All Products
        <FiArrowRight />
      </Link>
    </div>
  );
};

export default MegaMenuCTA;
