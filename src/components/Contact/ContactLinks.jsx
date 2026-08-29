import React from "react";
import { FaArrowRight } from "react-icons/fa";
import { FiPhone } from "react-icons/fi";
import { MdOutlineEmail } from "react-icons/md";
import { BsWhatsapp } from "react-icons/bs";

const ContactLinks = () => {
  return (
    <section className="py-8 sm:py-12 w-full">
      <div className="w-full text-left">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <a
            href="https://wa.me/971561110147?text=Hi%20E-ALL%20Team%2C%20I%20would%20like%20to%20request%20a%20wholesale%20quotation."
            target="_blank"
            rel="noopener noreferrer"
            className="group p-6 sm:p-7 rounded-3xl transition-all duration-300 bg-[#25D366]/5 border border-[#25D366]/20 hover:border-[#25D366]/50 hover:shadow-lg hover:shadow-green-500/10 flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4 bg-[#25D366]/10 text-[#25D366] text-xl">
                <BsWhatsapp />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Direct WhatsApp</h3>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                Fastest response — direct line to our Dubai wholesale sales team.
              </p>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#25D366] group-hover:translate-x-1 transition-transform">
              <span>Start WhatsApp Chat</span>
              <FaArrowRight className="text-[10px]" />
            </div>
          </a>

          <a
            href="mailto:info@eall.ae"
            className="group p-6 sm:p-7 rounded-3xl transition-all duration-300 bg-sky-50/70 border border-sky-200/80 hover:border-sky-400 hover:shadow-lg hover:shadow-sky-500/10 flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4 bg-sky-100 text-sky-700 text-xl">
                <MdOutlineEmail />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Official Email</h3>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed font-mono">
                info@eall.ae • RFQs &amp; formal tenders.
              </p>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-sky-700 group-hover:translate-x-1 transition-transform">
              <span>Send Inquiries</span>
              <FaArrowRight className="text-[10px]" />
            </div>
          </a>

          <a
            href="tel:+971561110147"
            className="group p-6 sm:p-7 rounded-3xl transition-all duration-300 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-lg hover:shadow-black/5 flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4 bg-slate-100 text-slate-700 text-xl">
                <FiPhone />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Direct Phone</h3>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed font-mono">
                +971 56 111 0147 • Speak directly with an account manager.
              </p>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-slate-800 group-hover:translate-x-1 transition-transform">
              <span>Call Sales Desk</span>
              <FaArrowRight className="text-[10px]" />
            </div>
          </a>
        </div>
      </div>
    </section>
  );
};

export default ContactLinks;
