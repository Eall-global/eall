import {
  FiCheckCircle,
  FiMinus,
  FiPlus,
  FiMessageCircle,
  FiMapPin,
  FiUsers,
  FiPackage,
} from "react-icons/fi";
import SectionCard from "../common/SectionCard";
import InfoItem from "../common/InfoItem";
import QuoteButton from "../buttons/QuoteButton";
import { useMemo, useState } from "react";

const CUSTOMER_TYPES = ["Retail", "Wholesale", "Enterprise"];

const REGIONS = [
  "United Arab Emirates",
  "Saudi Arabia",
  "Qatar",
  "Oman",
  "Kuwait",
  "Bahrain",
  "Africa",
  "Other",
];

const TRUST_POINTS = [
  "100% Genuine Products",
  "Official Warranty",
  "Dedicated Sales Support",
  "Global Distribution",
];

const InquiryCard = ({ product }) => {
  const [customerType, setCustomerType] = useState("Wholesale");

  const [quantity, setQuantity] = useState(1);

  const [region, setRegion] = useState("United Arab Emirates");

  const [requirements, setRequirements] = useState("");

  const whatsappMessage = useMemo(() => {
    return `
Hello E-ALL Sales Team,

I would like to request a quotation.

────────────────────────

PRODUCT

${product.name}

SKU
${product.sku}

Brand
${product.brand}

Category
${product.categoryName}

Sub Category
${product.subCategory}

────────────────────────

Customer Type
${customerType}

Required Quantity
${quantity}

Destination
${region}

────────────────────────

Additional Requirements

${requirements || "None"}

────────────────────────

Kindly provide:

• Latest quotation

• Product availability

• Lead time

• Warranty details

Thank you.
`;
  }, [customerType, quantity, region, requirements, product]);

  const whatsappURL = `https://wa.me/971561110147?text=${encodeURIComponent(
    whatsappMessage,
  )}`;

  return (
    <SectionCard className=" p-6!">
      <div className=" space-y-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">
            Interested in this product?
          </h3>

          <p className="mt-3 text-slate-600 leading-7">
            Contact our sales team for pricing, dealer opportunities, bulk
            purchasing, and product availability.
          </p>
        </div>

        {/* Header */}

        <div>
          <h3 className="text-xl font-bold text-slate-900">
            Request Business Quotation
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Complete the details below and we'll prepare a personalized
            quotation.
          </p>
        </div>

        {/* Product */}

        <div className="rounded-2xl bg-slate-50 p-5">
          <div className="flex items-center gap-3">
            <FiPackage className="text-sky-700" />

            <div>
              <p className="text-xs uppercase text-slate-500">Product</p>

              <h4 className="font-semibold">{product.name}</h4>

              <p className="text-xs text-slate-500 mt-1">SKU: {product.sku}</p>
            </div>
          </div>
        </div>

        {/* Customer Type */}

        <div>
          <label className="font-semibold text-slate-800 flex items-center gap-2">
            <FiUsers />
            Customer Type
          </label>

          <div className="flex flex-wrap gap-3 mt-1">
            {CUSTOMER_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setCustomerType(type)}
                className={`
                px-4
                py-2
                rounded-full
                border
                transition

                ${
                  customerType === type
                    ? "bg-sky-700 text-white border-sky-700"
                    : "border-slate-300 hover:border-sky-500"
                }
              `}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity */}

        <div>
          <label className="font-semibold text-slate-800">
            Required Quantity
          </label>

          <div className="mt-1 flex items-center">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-11 h-11 rounded-l-xl border border-r-0"
            >
              <FiMinus className="mx-auto" />
            </button>

            <input
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="
              w-full
              h-11
              border
              text-center
              outline-none
            "
            />

            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-11 h-11 rounded-r-xl border border-l-0"
            >
              <FiPlus className="mx-auto" />
            </button>
          </div>
        </div>

        {/* Region */}

        <div>
          <label className="font-semibold text-slate-800 flex items-center gap-2">
            <FiMapPin />
            Destination
          </label>

          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="
            mt-1
            w-full
            rounded-xl
            border
            p-3
            outline-none
            focus:border-sky-700
          "
          >
            {REGIONS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>

        {/* Requirements */}

        <div>
          <label className="font-semibold text-slate-800">
            Additional Requirements
          </label>

          <textarea
            rows={5}
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="Example: Black colour, 256GB, delivery to Dubai..."
            className="
            mt-3
            w-full
            rounded-xl
            border
            p-4
            resize-none
            outline-none
            focus:border-sky-700
          "
          />
        </div>

        {/* Trust */}

        <div className="space-y-3">
          {TRUST_POINTS.map((item) => (
            <div key={item} className="flex items-center gap-3">
              <FiCheckCircle className="text-green-600" />

              <span className="text-sm text-slate-600">{item}</span>
            </div>
          ))}
        </div>

        {/* CTA */}

        <a
          href={whatsappURL}
          target="_blank"
          rel="noopener noreferrer"
          className="
          w-full
          flex
          items-center
          justify-center
          gap-3
          rounded-xl
          bg-[#25D366]
          py-4
          font-semibold
          text-white
          hover:bg-[#20bd5a]
          transition
        "
        >
          <FiMessageCircle size={20} />
          Request Business Quotation
        </a>
      </div>
    </SectionCard>
  );
};

export default InquiryCard;
