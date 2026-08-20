import React from "react";
import Container from "../common/Container";
import { FaArrowRight } from "react-icons/fa";
import { FiPhone } from "react-icons/fi";
import { MdOutlineEmail } from "react-icons/md";
import { BsWhatsapp } from "react-icons/bs";

const ContactLinks = () => {
  return (
    <section className=" py-20">
      <div className="mx-auto text-left">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a
            href="https://wa.me/+971526073267?text=Hi%20E-ALL%2C%20I%20would%20like%20to%20request%20a%20quote."
            target="_blank"
            rel="noopener noreferrer"
            style={{ opacity: 1, transform: "none" }}
            className="group relative p-8 rounded-2xl transition-all duration-500 bg-[#25D366]/5 border-2 border-[#25D366]/20 hover:border-[#25D366]/40 hover:shadow-xl hover:shadow-green-500/10"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-[#25D366]/10 text-[#25D366]">
              <BsWhatsapp />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">WhatsApp</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Fastest response — direct line to our sales team.
            </p>
            <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#25D366]">
              Start Chat
              <FaArrowRight />
            </div>
          </a>
          <a
            href="mailto:sales@e-all.com"
            className="group relative p-8 rounded-2xl transition-all duration-500 bg-sky-700/10 border-2 border-sky-700/20 hover:border-sky-700/40 hover:shadow-xl hover:shadow-black/5"
            style={{ opacity: 1, transform: "none" }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-[#0047D5]/10 text-sky-700">
              <MdOutlineEmail />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Email</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Send detailed enquiries and RFQs to our team.
            </p>
            <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700">
              Send Email
              <FaArrowRight />
            </div>
          </a>
          <a
            href="tel:+971561110147"
            className="group relative p-8 rounded-2xl transition-all duration-500 bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl hover:shadow-black/5"
            style={{ opacity: 1, transform: "none" }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-[#0047D5]/10 text-sky-700">
              <FiPhone />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Phone</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Speak directly with an account manager.
            </p>
            <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700">
              Call Now
              <FaArrowRight />
            </div>
          </a>
        </div>
      </div>
    </section>
  );
};

export default ContactLinks;
