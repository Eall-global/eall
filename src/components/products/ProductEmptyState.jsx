const ProductEmptyState = ({ onReset }) => {
  return (
    <div
      className="
py-24
text-center
"
    >
      <h3
        className="
text-2xl
font-semibold
text-slate-900
"
      >
        No Products Found
      </h3>

      <p
        className="
mt-3
text-slate-500
"
      >
        We couldn't find products matching your criteria.
      </p>

      <button
        onClick={onReset}
        className="
mt-8
rounded-full
bg-sky-700
px-7
py-3
text-white
hover:bg-sky-800
transition
"
      >
        Clear Filters
      </button>
    </div>
  );
};

export default ProductEmptyState;
