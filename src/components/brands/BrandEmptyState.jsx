import { Link } from "react-router-dom";

const BrandEmptyState = () => {
  return (
    <div className="text-center py-24">
      <h3 className="text-3xl font-bold">No Products Found</h3>

      <p className="mt-4 text-slate-500">Try another category or search.</p>

      <Link
        to="/products"
        className="
          inline-block
          mt-8
          px-6
          py-3
          rounded-xl
          bg-sky-700
          text-white
        "
      >
        Browse All Products
      </Link>
    </div>
  );
};

export default BrandEmptyState;
