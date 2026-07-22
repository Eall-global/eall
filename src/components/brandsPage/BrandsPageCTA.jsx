import { FiArrowRight, FiMessageCircle } from "react-icons/fi";

import { Link } from "react-router-dom";

const BrandsPageCTA = () => {
  return (
    <section className="bg-white p-6 lg:p-10">
      <div
        className="relative rounded-3xl bg-linear-to-br from-[#0047D5] to-[#003bb3] p-12 md:p-20 overflow-hidden"
        style={{ opacity: 1, transform: "none" }}
      >
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-[#FF5500]/20 translate-y-1/2 -translate-x-1/4"></div>
        <div className="relative z-10 max-w-4xl text-left">
          <h2 className="text-3xl lg:text-4xl font-bold text-white">
            Looking For A Specific Brand?
          </h2>

          <p className=" mt-5 max-w-2xl mx-auto text-sky-100 leading-relaxed">
            Our sourcing team can help you find additional brands, products and
            customized supply solutions based on your business needs.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              to="/contact"
              className=" inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-white text-sky-700 font-semibold hover:shadow-xl transition"
            >
              Request Product
              <FiArrowRight />
            </Link>

            <a
              href="https://wa.me/+971561110147?text=Hi%20E-ALL,%20I%20need%20help%20with%20brand%20sourcing."
              target="_blank"
              rel="noopener noreferrer"
              className=" inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full border border-white/40 text-white font-semibold hover:bg-white/10 transition"
            >
              <FiMessageCircle />
              Talk To Sales
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandsPageCTA;
