import React, { useState } from "react";
import { BsWhatsapp } from "react-icons/bs";
import { FaArrowRight, FaRegQuestionCircle, FaSearch } from "react-icons/fa";
import { FiPackage, FiSmartphone } from "react-icons/fi";
import { LuHandshake } from "react-icons/lu";
import Container from "../common/Container";
import SectionTitle from "../common/SectionTitle";

import { enquiryOptions } from "./enquiryData";

import CustomerTypeSelector from "./CustomerTypeSelector";
import ProductCategorySelect from "./ProductCategorySelect";
import QuantitySelector from "./QuantitySelector";

const QuickEnquiry = () => {
  const [selected, setSelected] = useState(null);
  const [customerType, setCustomerType] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");

  const handleSelection = (item) => {
    setSelected(item);

    setCustomerType("");

    setCategory("");

    setQuantity("");
  };

  const whatsappMessage = selected
    ? `
Hi E-ALL Team,

I would like to make a business enquiry.


Enquiry Type:
${selected.title}


Customer Type:
${customerType || "Not specified"}


Product Category:
${category || "Not specified"}


Expected Quantity:
${quantity || "Not specified"}


Requirement:
${selected.message}


Source:
E-ALL Website Contact Page


Thank you.
`
    : `
Hi E-ALL Team,

I have an enquiry.

Source:
E-ALL Website Contact Page
`;

  const whatsappURL = `https://wa.me/971561110147?text=${encodeURIComponent(
    whatsappMessage,
  )}`;

  return (
    <section className="pt-20">
      <div className=" mx-auto">
        <SectionTitle
          className="flex flex-col text-left"
          label="Quick Enquiry"
          title="What can we help you with?"
          description="Select your inquiry type and we'll prepare a personalized WhatsApp
              message for you."
        />

        <div className="mt-10 grid  grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {enquiryOptions.map((item) => {
            const Icon = item.icon;

            const active = selected?.id === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelection(item)}
                className={`p-5 rounded-2xl text-left flex gap-4 items-center transition-all border
${
  active
    ? "bg-sky-700 text-white border-sky-700 shadow-lg scale-[1.03]"
    : "bg-white border-gray-200 hover:border-sky-300"
}

`}
              >
                <Icon className="text-xl shrink-0" />

                <p
                  className={`text-sm font-semibold ${active ? "text-white" : "text-gray-900"} `}
                >
                  {item.title}
                </p>
              </button>
            );
          })}
        </div>

        {/* MESSAGE PREVIEW */}

        {selected && (
          <div className=" mt-10 space-y-8 bg-slate-50 rounded-3xl p-8 border border-slate-200">
            <CustomerTypeSelector
              value={customerType}
              onChange={setCustomerType}
            />
            <div className=" grid grid-cols-1 md:grid-cols-2 gap-10">
              <ProductCategorySelect
                categories={selected.categories}
                value={category}
                onChange={setCategory}
              />

              <QuantitySelector value={quantity} onChange={setQuantity} />
            </div>

            {/* MESSAGE PREVIEW */}

            <div className=" bg-white rounded-2xl p-6 border">
              <h4 className="font-semibold text-slate-900">WhatsApp Preview</h4>

              <p className=" mt-3 text-sm text-slate-600 white space-pre-line leading-6">
                {whatsappMessage}
              </p>
            </div>
          </div>
        )}

        <div className="mt-12 text-center">
          <a
            href={whatsappURL}
            target="_blank"
            rel="noopener noreferrer"
            className=" inline-flex items-center gap-3 px-10 py-4 rounded-full bg-[#25D366] text-white font-semibold hover:bg-[#1fbd5a] transition"
          >
            <BsWhatsapp />

            {selected
              ? `Chat About ${selected.title}`
              : "Initiate Direct Inquiry"}

            <FaArrowRight />
          </a>

          <p className="mt-4! text-xs text-gray-400">
            Your enquiry details will be shared directly with our sales team.
          </p>
        </div>
      </div>
    </section>
  );
};

export default QuickEnquiry;
