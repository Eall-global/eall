import { FiCheckCircle, FiStar } from "react-icons/fi";

const ProductFeatures = ({ features = [] }) => {
  if (!features || !features.length) return null;

  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center gap-2">
        <span className="p-1.5 rounded-lg bg-sky-50 text-sky-700">
          <FiStar className="text-sm" />
        </span>
        <h2 className="text-base sm:text-lg font-bold text-slate-900">
          Key Highlights &amp; Features
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {features.map((feature, index) => (
          <div
            key={index}
            className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex items-start gap-3 hover:border-sky-300 transition"
          >
            <FiCheckCircle className="text-emerald-600 text-base mt-0.5 shrink-0" />
            <p className="text-xs font-semibold text-slate-800 leading-snug">
              {feature}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductFeatures;
