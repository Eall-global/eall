const colorClasses = {
  black: "bg-black",
  white: "bg-white border",
  blue: "bg-blue-600",
  green: "bg-green-600",
  red: "bg-red-600",
  pink: "bg-pink-500",
  gold: "bg-yellow-500",
  silver: "bg-gray-300",
  purple: "bg-purple-600",
};

const ProductVariants = ({ variants = [], selectedVariant, onSelect }) => {
  if (!variants.length) return null;

  return (
    <div className="mt-8">
      <p className="text-sm font-semibold text-slate-900 mb-4">
        Available Colours
      </p>

      <div className="flex flex-wrap gap-4">
        {variants.map((variant) => (
          <button
            key={variant.colorSlug}
            onClick={() => onSelect(variant)}
            className={`
              flex
              items-center
              gap-3
              rounded-xl
              border
              px-3
              py-2
              transition

              ${
                selectedVariant.colorSlug === variant.colorSlug
                  ? "border-sky-700 ring-2 ring-sky-200"
                  : "border-slate-200 hover:border-slate-400"
              }
            `}
          >
            <span
              className={`
                w-6
                h-6
                rounded-full
                ${colorClasses[variant.colorSlug]}
              `}
            />

            <div className="text-left">
              <p className="text-sm font-semibold">{variant.color}</p>

              <p className="text-xs text-slate-500">SKU {variant.sku}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProductVariants;
