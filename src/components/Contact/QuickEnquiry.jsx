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

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {enquiryOptions.map((item) => {
            const Icon = item.icon;
            const active = selected?.id === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelection(item)}
                className={`p-4 rounded-2xl text-left flex gap-3.5 items-center transition-all cursor-pointer border ${
                  active
                    ? "bg-sky-700 text-white border-sky-700 shadow-lg shadow-sky-700/20 scale-[1.03]"
                    : "bg-white border-slate-200 text-slate-800 hover:border-sky-400 hover:bg-slate-50/80 shadow-xs"
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${
                    active ? "bg-white/20 text-white" : "bg-sky-50 text-sky-700"
                  }`}
                >
                  <Icon className="text-lg" />
                </div>

                <p className={`text-xs sm:text-sm font-bold leading-snug ${active ? "text-white" : "text-slate-900"}`}>
                  {item.title}
                </p>
              </button>
            );
          })}
        </div>

        {/* 📝 INTERACTIVE FORM & LIVE WHATSAPP CHAT BUBBLE PREVIEW */}
        {selected && (
          <div className="mt-10 space-y-8 bg-slate-50/90 rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs text-left">
            
            {/* 1. Customer Type Selector */}
            <CustomerTypeSelector
              value={customerType}
              onChange={setCustomerType}
            />

            {/* 2. Category & Quantity Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              <ProductCategorySelect
                categories={selected.categories}
                value={category}
                onChange={setCategory}
              />

              <QuantitySelector value={quantity} onChange={setQuantity} />
            </div>

            {/* 3. AUTHENTIC WHATSAPP LIVE CHAT PREVIEW CARD */}
            <div className="rounded-2xl overflow-hidden border border-emerald-300/80 shadow-sm bg-white">
              
              {/* WhatsApp Header Bar */}
              <div className="bg-[#075E54] text-white px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-emerald-500/30 rounded-full text-emerald-300">
                    <BsWhatsapp className="text-sm" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold tracking-wide leading-none text-white">
                      E-ALL Official WhatsApp Sales Desk
                    </h4>
                    <p className="text-[10px] text-emerald-200 mt-0.5 flex items-center gap-1 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Inquiry Message Preview
                    </p>
                  </div>
                </div>

                <span className="text-[10px] bg-white/10 text-emerald-100 px-2 py-0.5 rounded-full font-mono">
                  +971 56 111 0147
                </span>
              </div>

              {/* Message Bubble Body */}
              <div className="p-4 sm:p-6 bg-[#efeae2] bg-opacity-70">
                <div className="max-w-2xl bg-[#DCF8C6] border border-emerald-200/80 p-4 sm:p-5 rounded-2xl rounded-tl-xs shadow-xs text-left relative">
                  <p className="text-xs sm:text-sm text-slate-800 font-sans leading-relaxed whitespace-pre-line">
                    {whatsappMessage.trim()}
                  </p>
                  <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-emerald-800 font-medium">
                    <span>Ready to send</span>
                    <span className="font-bold text-emerald-700">✓✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🚀 PRIMARY WHATSAPP CTA ACTION BUTTON */}
        <div className="mt-10 text-center">
          <a
            href={whatsappURL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <BsWhatsapp className="text-xl" />
            <span>
              {selected
                ? `Send Enquiry for ${selected.title} via WhatsApp`
                : "Initiate Direct Inquiry via WhatsApp"}
            </span>
            <FaArrowRight className="text-sm" />
          </a>

          <p className="mt-3 text-xs text-slate-400 font-medium">
            🔒 Direct SSL encrypted link to our official Dubai sales desk. Instant response guaranteed.
          </p>
        </div>
      </div>
    </section>
  );
};

export default QuickEnquiry;
