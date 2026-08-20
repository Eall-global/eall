import React from "react";
import { FaArrowRight } from "react-icons/fa";
import { BsWhatsapp } from "react-icons/bs";
import Container from "../common/Container";

const ContactUs = () => {
  return (
    <section>
      <Container className="py-20 bg-gray-100!">
        <div className=" mx-auto">
          <div
            className="relative rounded-3xl bg-linear-to-br from-[#0047D5] to-[#003bb3] p-12 md:p-20 overflow-hidden"
            style={{ opacity: 1, transform: "none" }}
          >
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-[#FF5500]/20 translate-y-1/2 -translate-x-1/4"></div>
            <div className="relative z-10 max-w-2xl text-left">
              <div className="text-3xl md:text-4xl font-medium tracking-tight text-white leading-tight">
                Ready to scale your business?
              </div>
              <div className="mt-5 text-white/70 text-lg leading-relaxed">
                Get competitive pricing, bulk availability, and dedicated
                account management. Start your partnership with E-ALL today.
              </div>
              <div className="mt-10 flex flex-wrap gap-4">
                <a
                  className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#FF5500] text-white font-semibold text-sm hover:bg-[#e64d00] transition-all duration-300"
                  href="/contact"
                >
                  Request a Quote
                  <FaArrowRight />
                </a>
                <a
                  href="https://wa.me/+971526073267?text=Hi%20E-ALL%2C%20I%20would%20like%20to%20request%20a%20quote."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-all duration-300 backdrop-blur-sm"
                >
                  <BsWhatsapp />
                  WhatsApp Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default ContactUs;
