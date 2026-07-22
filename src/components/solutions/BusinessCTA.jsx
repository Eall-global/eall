import { BsWhatsapp } from "react-icons/bs";
import { FaArrowRight } from "react-icons/fa";
import {
  FiArrowRight,
  FiMessageSquare,
  FiFileText,
  FiUsers,
} from "react-icons/fi";

const BusinessCTA = () => {
  return (
    <section className=" px-6 py-10 lg:px-10 lg:py-16 bg-white">
      <div
        className="relative rounded-3xl bg-linear-to-br from-[#0047D5] to-[#003bb3] p-12 md:p-20 overflow-hidden"
        style={{ opacity: 1, transform: "none" }}
      >
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-[#FF5500]/20 translate-y-1/2 -translate-x-1/4"></div>
        <div className="relative z-10 max-w-4xl text-left">
          <h2 className="text-4xl lg:text-5xl font-black">
            Ready To Build A Technology Partnership?
          </h2>

          <p className="mt-6 text-lg text-sky-100 leading-8">
            Whether you are a retailer, distributor, enterprise buyer or
            international partner, E-ALL provides reliable sourcing and supply
            solutions designed for long-term growth.
          </p>
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
            href="https://wa.me/+971526073266?text=Hi%20E-ALL%2C%20I%20would%20like%20to%20request%20a%20quote."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-all duration-300 backdrop-blur-sm"
          >
            <BsWhatsapp />
            Talk to Sales
          </a>
          <a
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-all duration-300 backdrop-blur-sm"
            href="/contact"
          >
            Become a Partner
            <FaArrowRight />
          </a>
        </div>
      </div>
    </section>
  );
};

export default BusinessCTA;
