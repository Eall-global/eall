import {
  FiCheckCircle,
  FiPackage,
  FiTag,
  FiGrid,
  FiLayers,
} from "react-icons/fi";

const availabilityStyles = {
  "In Stock": {
    bg: "bg-green-100",
    text: "text-green-700",
  },

  "Limited Stock": {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
  },

  "Available on Request": {
    bg: "bg-blue-100",
    text: "text-blue-700",
  },

  "Out of Stock": {
    bg: "bg-red-100",
    text: "text-red-700",
  },
};

const ProductInfo = ({ product, selectedVariant, onVariantChange }) => {
  const availability =
    availabilityStyles[product.availability] ||
    availabilityStyles["Available on Request"];

  return (
    <div className="space-y-8">
      {/* Brand */}
      <div>
        <p
          className="
            text-sky-700
            font-semibold
            uppercase
            tracking-wider
            text-sm
          "
        >
          {product.brand}
        </p>

        <p
          className="
            mt-2
            lg:text-3xl
            text-2xl
            font-bold
            text-slate-900
            leading-tight
          "
        >
          {product.name}
        </p>

        <p
          className="
            mt-5
            text-slate-600
            leading-7
          "
        >
          {product.shortDescription}
        </p>
      </div>

      {/* Status */}
      <div className="flex flex-wrap gap-3">
        <span
          className={`
            px-4
            py-2
            rounded-full
            text-sm
            font-semibold
            ${availability.bg}
            ${availability.text}
          `}
        >
          ● {product.availabilityBadge || product.availability}
        </span>

        {product.warranty && (
          <span
            className="
              flex
              items-center
              gap-2
              px-4
              py-2
              rounded-full
              bg-slate-100
              text-slate-700
              text-sm
            "
          >
            <FiCheckCircle />

            {product.warranty}
          </span>
        )}
      </div>

      {/* Colour Selection */}

      {product.variants?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Available Colours
          </h3>

          <div className="flex flex-wrap gap-3 mt-4">
            {product.variants.map((variant) => (
              <button
                key={variant.colorSlug}
                onClick={() => onVariantChange(variant)}
                className={`
                        flex
                        items-center
                        gap-3
                        px-3
                        py-2
                        rounded-xl
                        border-2
                        transition

                        ${
                          selectedVariant.colorSlug === variant.colorSlug
                            ? "border-sky-700 bg-sky-50"
                            : "border-slate-200 hover:border-slate-300"
                        }
                    `}
              >
                <img
                  src={variant.image}
                  alt={variant.color}
                  className="w-10 h-10 object-contain"
                />

                <span className="font-medium">{variant.color}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Information Grid */}
      <div
        className="
          grid
          grid-cols-2
          
          gap-5
          border
          rounded-2xl
          border-slate-200
          p-6
        "
      >
        <InfoItem
          icon={<FiPackage />}
          label="SKU"
          value={selectedVariant?.sku || product.sku}
        />

        <InfoItem
          icon={<FiGrid />}
          label="Category"
          value={product.categoryName || product.category}
        />

        <InfoItem
          icon={<FiLayers />}
          label="Sub Category"
          value={product.subCategory}
        />

        <InfoItem icon={<FiTag />} label="Series" value={product.series} />

        <InfoItem icon={<FiTag />} label="Model" value={product.model} />
      </div>

      {/* Business Segments */}
      {product.businessSegment?.length > 0 && (
        <div>
          <h3
            className="
              text-lg
              font-semibold
              text-slate-900
            "
          >
            Suitable For
          </h3>

          <div className="flex flex-wrap gap-3 mt-4">
            {product.businessSegment.map((item) => (
              <span
                key={item}
                className="
                  bg-sky-50
                  text-sky-700
                  px-4
                  py-2
                  rounded-full
                  text-sm
                  font-medium
                "
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {product.tags?.length > 0 && (
        <div>
          <h3
            className="
              text-lg
              font-semibold
              text-slate-900
            "
          >
            Highlights
          </h3>

          <div className="flex flex-wrap gap-3 mt-4">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="
                  border
                  border-slate-200
                  rounded-full
                  px-4
                  py-2
                  text-sm
                  bg-white
                "
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quote Notice */}
      <div
        className="
          rounded-2xl
          bg-sky-50
          border
          border-sky-100
          p-6
        "
      >
        <h3
          className="
            font-semibold
            text-slate-900
          "
        >
          Pricing & Availability
        </h3>

        <p
          className="
            mt-3
            text-slate-600
            leading-7
          "
        >
          Product pricing varies depending on quantity, destination, and market
          conditions. Contact our sales team to receive the latest availability,
          lead time, and a customized quotation.
        </p>
      </div>
    </div>
  );
};

const InfoItem = ({ icon, label, value }) => (
  <div>
    <p
      className="
        flex
        items-center
        gap-2
        text-sm
        text-slate-500
      "
    >
      {icon}
      {label}
    </p>

    <p
      className="
        mt-2
        font-semibold
        text-slate-900
      "
    >
      {value || "-"}
    </p>
  </div>
);

export default ProductInfo;
