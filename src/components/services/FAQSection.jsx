import { useState } from "react";

import Container from "../common/Container";

import { FiChevronDown } from "react-icons/fi";

const faqs = [
  {
    q: "Do you supply wholesale quantities?",
    a: "Yes. E-ALL provides wholesale solutions for retailers, distributors and business partners.",
  },

  {
    q: "Are your products genuine?",
    a: "Yes. We focus on authentic electronics sourced through trusted global suppliers.",
  },

  {
    q: "Which markets do you serve?",
    a: "We support partners across Africa, Middle East, GCC and international markets.",
  },

  {
    q: "Can businesses request custom quotations?",
    a: "Yes. Our sales team provides customized pricing based on product requirements and quantities.",
  },
];

const FAQSection = () => {
  const [open, setOpen] = useState(null);

  return (
    <section className=" px-6 py-10 lg:px-10 lg:py-16 bg-white">
      <div>
        <h2 className="text-2xl! lg:text-3xl! font-bold! text-left text-slate-900!">
          Frequently Asked Questions
        </h2>

        <div className="mt-8 space-y-4">
          {faqs.map((item, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm">
              <button
                onClick={() => setOpen(open === index ? null : index)}
                className="w-full flex justify-between items-center p-6 text-left font-semibold"
              >
                {item.q}

                <FiChevronDown />
              </button>

              {open === index && (
                <p className="px-6 pb-6 text-slate-600 text-left leading-7">
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
