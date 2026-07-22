import { useState } from "react";
import { FiChevronDown, FiSearch } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";

import Container from "./Container";
import SectionTitle from "./SectionTitle";
import SlideUp from "../animations/SlideUp";

const faqData = [
  {
    question: "What type of products does E-ALL supply?",
    answer:
      "E-ALL supplies smartphones, consumer electronics, accessories, IT products, connectivity solutions and other technology products from trusted global brands.",
  },

  {
    question: "Do you support wholesale and bulk orders?",
    answer:
      "Yes. We provide wholesale solutions for distributors, retailers, corporate buyers and international customers with flexible quantities.",
  },

  {
    question: "Can E-ALL source products that are not listed on the website?",
    answer:
      "Yes. Through our global sourcing network, we can assist customers with specific product requirements and customized procurement requests.",
  },

  {
    question: "Do you provide international export services?",
    answer:
      "Yes. We support international buyers with sourcing, documentation, logistics coordination and export assistance.",
  },

  {
    question: "Are your products genuine and authentic?",
    answer:
      "Yes. Product authenticity and supplier verification are core parts of our procurement process.",
  },

  {
    question: "How can I become an E-ALL dealer or business partner?",
    answer:
      "You can contact our sales team through the partner inquiry form. Our team will review your business requirements and discuss suitable partnership opportunities.",
  },

  {
    question: "Do you provide customized quotations?",
    answer:
      "Yes. Our team prepares quotations based on product type, quantity, destination and delivery requirements.",
  },
];

const FAQAccordion = () => {
  const [active, setActive] = useState(null);
  const [search, setSearch] = useState("");

  const popularFAQ = faqData.slice(0, 4);

  const filteredFAQ = search.trim()
    ? faqData.filter((item) =>
        item.question.toLowerCase().includes(search.toLowerCase()),
      )
    : popularFAQ;

  return (
    <section className=" px-6 py-10 lg:px-10 lg:py-16 bg-gray-100">
      <SlideUp>
        <SectionTitle
          className=" flex flex-col text-center items-center"
          label="FAQ"
          title="Frequently Asked Business Questions"
          description="Find answers about sourcing, wholesale supply, export support and partnership opportunities."
          center
        />
      </SlideUp>

      {/* Search */}

      <div className="mt-6 relative max-w-4xl mx-auto">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />

        <input
          type="text"
          placeholder="Search your question..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-5 py-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-600"
        />
      </div>
      {search && (
        <p
          className="
      mt-2!
      text-center
      text-sm
      text-slate-500
   "
        >
          Showing {filteredFAQ.length} result
          {filteredFAQ.length !== 1 && "s"}
          for "{search}"
        </p>
      )}

      <div className="mt-12 space-y-4">
        {filteredFAQ.map((item, index) => {
          const open = active === index;

          return (
            <div
              key={item.question}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
            >
              <button
                onClick={() => setActive(open ? null : index)}
                className="w-full flex justify-between items-center p-6 text-left font-semibold text-slate-800"
              >
                <span>{item.question}</span>

                <FiChevronDown
                  className={`

transition-transform

${open ? "rotate-180 text-sky-700" : ""}

`}
                />
              </button>

              <AnimatePresence>
                {open && (
                  <motion.div
                    initial={{
                      height: 0,
                      opacity: 0,
                    }}
                    animate={{
                      height: "auto",
                      opacity: 1,
                    }}
                    exit={{
                      height: 0,
                      opacity: 0,
                    }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-6 text-slate-600 flex text-left leading-7">
                      {item.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      {!search && faqData.length > popularFAQ.length && (
        <div
          className="
       text-center
       mt-8
       text-slate-500
       text-sm
     "
        >
          Search above to find more answers
        </div>
      )}
    </section>
  );
};

export default FAQAccordion;
