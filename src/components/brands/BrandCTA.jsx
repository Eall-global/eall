import { BsWhatsapp } from "react-icons/bs";
import { FiMessageCircle } from "react-icons/fi";

const BrandCTA = ({ brand }) => {
  return (
    <section className="bg-white p-6 lg:p-10">
      <div
        className="relative rounded-3xl bg-linear-to-br from-[#0047D5] to-[#003bb3] p-12 md:p-20 overflow-hidden"
        style={{ opacity: 1, transform: "none" }}
      >
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-[#FF5500]/20 translate-y-1/2 -translate-x-1/4"></div>
        <div className="relative z-10 max-w-4xl text-left">
          <h2 className="text-3xl font-bold">
            Looking for {brand.name} products in bulk?
          </h2>

          <p className="mt-4 text-white/80">
            Contact our sales team for wholesale pricing, availability and
            partnership opportunities.
          </p>

          <a
            href="/contact"
            className="mt-4 inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#FF5500] text-white font-semibold text-sm hover:bg-[#e64d00] transition-all duration-300"
          >
            <BsWhatsapp className=" text-lg font-extrabold" />
            Request Wholesale Quote
          </a>
        </div>
      </div>
    </section>
  );
};

export default BrandCTA;
